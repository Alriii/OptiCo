import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"]);
export const userStatus = pgEnum("user_status", ["ACTIVE", "INVITED", "DISABLED"]);
export const tokenPurpose = pgEnum("token_purpose", ["REFRESH", "STAFF_INVITE", "EMAIL_VERIFY"]);
export const appointmentSource = pgEnum("appointment_source", ["ONLINE_ACCOUNT", "ONLINE_GUEST", "WALK_IN"]);
export const appointmentStatus = pgEnum("appointment_status", [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "NO_SHOW",
]);
export const scheduleExceptionType = pgEnum("schedule_exception_type", ["UNAVAILABLE", "ADDITIONAL", "TIME_OFF"]);
export const walkInStatus = pgEnum("walk_in_status", [
  "WAITING",
  "CALLED",
  "IN_SERVICE",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
]);
export const auditActorType = pgEnum("audit_actor_type", ["USER", "GUEST", "SYSTEM"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    name: text("name").notNull().default(""),
    role: userRole("role").notNull().default("PATIENT"),
    status: userStatus("status").notNull().default("ACTIVE"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    // Case-insensitive uniqueness belongs in the database, not only in code.
    uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
    index("users_role_status_idx").on(table.role, table.status),
  ],
);

export const patients = pgTable(
  "patients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .unique()
      .references(() => users.id, { onDelete: "set null" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    mobile: text("mobile"),
    dateOfBirth: date("date_of_birth"),
    guardianName: text("guardian_name"),
    guardianRelationship: text("guardian_relationship"),
    guardianContact: text("guardian_contact"),
    ...timestamps,
  },
  (table) => [
    index("patients_email_idx").on(sql`lower(${table.email})`),
    index("patients_full_name_idx").on(table.fullName),
  ],
);

export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    displayName: text("display_name").notNull(),
    credentials: text("credentials"),
    bio: text("bio"),
    photoUrl: text("photo_url"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [index("doctors_active_idx").on(table.isActive)],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),
    bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(0),
    fee: numeric("fee", { precision: 12, scale: 2 }).notNull().default("0"),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    check("services_duration_positive", sql`${table.durationMinutes} > 0`),
    check("services_buffers_non_negative", sql`${table.bufferBeforeMinutes} >= 0 AND ${table.bufferAfterMinutes} >= 0`),
    check("services_fee_non_negative", sql`${table.fee} >= 0`),
    index("services_active_order_idx").on(table.isActive, table.displayOrder),
  ],
);

export const doctorServices = pgTable(
  "doctor_services",
  {
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.doctorId, table.serviceId] }),
    index("doctor_services_service_idx").on(table.serviceId),
  ],
);

export const clinicHours = pgTable(
  "clinic_hours",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    weekday: integer("weekday").notNull(),
    isOpen: boolean("is_open").notNull().default(false),
    openTime: time("open_time"),
    closeTime: time("close_time"),
  },
  (table) => [
    uniqueIndex("clinic_hours_weekday_unique").on(table.weekday),
    check("clinic_hours_weekday_range", sql`${table.weekday} BETWEEN 0 AND 6`),
    check(
      "clinic_hours_time_order",
      sql`${table.openTime} IS NULL OR ${table.closeTime} IS NULL OR ${table.openTime} < ${table.closeTime}`,
    ),
  ],
);

export const clinicClosures = pgTable(
  "clinic_closures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("clinic_closures_date_order", sql`${table.endsOn} >= ${table.startsOn}`),
    index("clinic_closures_range_idx").on(table.startsOn, table.endsOn),
  ],
);

export const doctorWeeklyAvailability = pgTable(
  "doctor_weekly_availability",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    breakStart: time("break_start"),
    breakEnd: time("break_end"),
    effectiveFrom: date("effective_from"),
    effectiveUntil: date("effective_until"),
    ...timestamps,
  },
  (table) => [
    check("doctor_weekly_weekday_range", sql`${table.weekday} BETWEEN 0 AND 6`),
    check("doctor_weekly_time_order", sql`${table.startTime} < ${table.endTime}`),
    check(
      "doctor_weekly_break_order",
      sql`(${table.breakStart} IS NULL AND ${table.breakEnd} IS NULL) OR (${table.breakStart} IS NOT NULL AND ${table.breakEnd} IS NOT NULL AND ${table.breakStart} < ${table.breakEnd})`,
    ),
    index("doctor_weekly_doctor_weekday_idx").on(table.doctorId, table.weekday),
  ],
);

export const doctorScheduleExceptions = pgTable(
  "doctor_schedule_exceptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    type: scheduleExceptionType("type").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("doctor_exception_time_order", sql`${table.endsAt} > ${table.startsAt}`),
    index("doctor_exception_doctor_range_idx").on(table.doctorId, table.startsAt, table.endsAt),
  ],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reference: text("reference").notNull().unique(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "restrict" }),
    source: appointmentSource("source").notNull(),
    status: appointmentStatus("status").notNull().default("PENDING"),
    requestedStartAt: timestamp("requested_start_at", { withTimezone: true }).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes").notNull(),
    fee: numeric("fee", { precision: 12, scale: 2 }).notNull(),
    bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(0),
    bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(0),
    note: text("note"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    ...timestamps,
  },
  (table) => [
    check("appointments_duration_positive", sql`${table.durationMinutes} > 0`),
    check("appointments_time_order", sql`${table.startsAt} IS NULL OR ${table.endsAt} IS NULL OR ${table.endsAt} > ${table.startsAt}`),
    check(
      "appointments_confirmed_shape",
      sql`${table.status} NOT IN ('CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED') OR (${table.doctorId} IS NOT NULL AND ${table.startsAt} IS NOT NULL AND ${table.endsAt} IS NOT NULL)`,
    ),
    index("appointments_patient_idx").on(table.patientId),
    index("appointments_doctor_idx").on(table.doctorId),
    index("appointments_status_idx").on(table.status),
    index("appointments_starts_at_idx").on(table.startsAt),
    index("appointments_pending_created_idx").on(table.status, table.createdAt),
  ],
);

export const appointmentStatusHistory = pgTable(
  "appointment_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    fromStatus: appointmentStatus("from_status"),
    toStatus: appointmentStatus("to_status").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("appointment_history_appointment_idx").on(table.appointmentId, table.createdAt)],
);

export const walkInQueueEntries = pgTable(
  "walk_in_queue_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
    clinicDate: date("clinic_date").notNull(),
    queueNumber: integer("queue_number").notNull(),
    status: walkInStatus("status").notNull().default("WAITING"),
    doctorId: uuid("doctor_id").references(() => doctors.id, { onDelete: "set null" }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    calledAt: timestamp("called_at", { withTimezone: true }),
    serviceStartedAt: timestamp("service_started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("walk_in_queue_date_number_unique").on(table.clinicDate, table.queueNumber),
    check("walk_in_queue_number_positive", sql`${table.queueNumber} > 0`),
    index("walk_in_queue_date_status_idx").on(table.clinicDate, table.status),
  ],
);

export const guestBookingTokens = pgTable(
  "guest_booking_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("guest_tokens_appointment_idx").on(table.appointmentId)],
);

export const tokens = pgTable(
  "tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: tokenPurpose("purpose").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    familyId: uuid("family_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("tokens_user_purpose_idx").on(table.userId, table.purpose)],
);

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dedupeKey: text("dedupe_key").notNull().unique(),
    recipient: text("recipient").notNull(),
    templateKey: text("template_key").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    deliverAfter: timestamp("deliver_after", { withTimezone: true }).defaultNow().notNull(),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("email_outbox_attempts_non_negative", sql`${table.attempts} >= 0`),
    index("email_outbox_due_idx").on(table.deliverAfter, table.sentAt),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    actorType: auditActorType("actor_type").notNull().default("USER"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_created_idx").on(table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_actor_idx").on(table.actorUserId),
  ],
);

export const clinicSettings = pgTable(
  "clinic_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    timezone: text("timezone").notNull().default("Asia/Manila"),
    currency: text("currency").notNull().default("PHP"),
    cancellationCutoffHours: integer("cancellation_cutoff_hours").notNull().default(24),
    guestLinkTtlHours: integer("guest_link_ttl_hours").notNull().default(168),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("clinic_settings_timezone", sql`${table.timezone} = 'Asia/Manila'`),
    check("clinic_settings_currency", sql`${table.currency} = 'PHP'`),
    check("clinic_settings_cutoff_non_negative", sql`${table.cancellationCutoffHours} >= 0`),
    check("clinic_settings_guest_ttl_positive", sql`${table.guestLinkTtlHours} > 0`),
  ],
);

export const staffInvites = pgTable(
  "staff_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    role: userRole("role").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("staff_invites_email_idx").on(sql`lower(${table.email})`)],
);

export type User = typeof users.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Doctor = typeof doctors.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type WalkInQueueEntry = typeof walkInQueueEntries.$inferSelect;
export type EmailOutboxRow = typeof emailOutbox.$inferSelect;
export type ClinicSettings = typeof clinicSettings.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
export type UserStatus = (typeof userStatus.enumValues)[number];
export type AppointmentStatus = (typeof appointmentStatus.enumValues)[number];
export type AppointmentSource = (typeof appointmentSource.enumValues)[number];
export type WalkInStatus = (typeof walkInStatus.enumValues)[number];
