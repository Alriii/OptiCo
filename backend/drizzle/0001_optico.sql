CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'INVITED', 'DISABLED');--> statement-breakpoint
CREATE TYPE "public"."token_purpose" AS ENUM('REFRESH', 'STAFF_INVITE', 'EMAIL_VERIFY');--> statement-breakpoint
CREATE TYPE "public"."appointment_source" AS ENUM('ONLINE_ACCOUNT', 'ONLINE_GUEST', 'WALK_IN');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."schedule_exception_type" AS ENUM('UNAVAILABLE', 'ADDITIONAL', 'TIME_OFF');--> statement-breakpoint
CREATE TYPE "public"."walk_in_status" AS ENUM('WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'EWALLET', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_type" AS ENUM('USER', 'GUEST', 'SYSTEM');--> statement-breakpoint

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"name" text DEFAULT '' NOT NULL,
	"role" "user_role" DEFAULT 'PATIENT' NOT NULL,
	"status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_role_status_idx" ON "users" USING btree ("role","status");--> statement-breakpoint

CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"mobile" text,
	"date_of_birth" date,
	"guardian_name" text,
	"guardian_relationship" text,
	"guardian_contact" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patients_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE INDEX "patients_email_idx" ON "patients" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "patients_full_name_idx" ON "patients" USING btree ("full_name");--> statement-breakpoint

CREATE TABLE "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"credentials" text,
	"bio" text,
	"photo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctors_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "doctors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "doctors_active_idx" ON "doctors" USING btree ("is_active");--> statement-breakpoint

CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"buffer_before_minutes" integer DEFAULT 0 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 0 NOT NULL,
	"fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug"),
	CONSTRAINT "services_duration_positive" CHECK ("duration_minutes" > 0),
	CONSTRAINT "services_buffers_non_negative" CHECK ("buffer_before_minutes" >= 0 AND "buffer_after_minutes" >= 0),
	CONSTRAINT "services_fee_non_negative" CHECK ("fee" >= 0)
);
--> statement-breakpoint
CREATE INDEX "services_active_order_idx" ON "services" USING btree ("is_active","display_order");--> statement-breakpoint

CREATE TABLE "doctor_services" (
	"doctor_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	CONSTRAINT "doctor_services_doctor_id_service_id_pk" PRIMARY KEY("doctor_id","service_id")
);
--> statement-breakpoint
CREATE INDEX "doctor_services_service_idx" ON "doctor_services" USING btree ("service_id");--> statement-breakpoint

CREATE TABLE "clinic_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekday" integer NOT NULL,
	"is_open" boolean DEFAULT false NOT NULL,
	"open_time" time,
	"close_time" time,
	CONSTRAINT "clinic_hours_weekday_range" CHECK ("weekday" BETWEEN 0 AND 6),
	CONSTRAINT "clinic_hours_time_order" CHECK ("open_time" IS NULL OR "close_time" IS NULL OR "open_time" < "close_time")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "clinic_hours_weekday_unique" ON "clinic_hours" USING btree ("weekday");--> statement-breakpoint

CREATE TABLE "clinic_closures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clinic_closures_date_order" CHECK ("ends_on" >= "starts_on")
);
--> statement-breakpoint
CREATE INDEX "clinic_closures_range_idx" ON "clinic_closures" USING btree ("starts_on","ends_on");--> statement-breakpoint

CREATE TABLE "doctor_weekly_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_start" time,
	"break_end" time,
	"effective_from" date,
	"effective_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_weekly_weekday_range" CHECK ("weekday" BETWEEN 0 AND 6),
	CONSTRAINT "doctor_weekly_time_order" CHECK ("start_time" < "end_time"),
	CONSTRAINT "doctor_weekly_break_order" CHECK (("break_start" IS NULL AND "break_end" IS NULL) OR ("break_start" IS NOT NULL AND "break_end" IS NOT NULL AND "break_start" < "break_end"))
);
--> statement-breakpoint
CREATE INDEX "doctor_weekly_doctor_weekday_idx" ON "doctor_weekly_availability" USING btree ("doctor_id","weekday");--> statement-breakpoint

CREATE TABLE "doctor_schedule_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"type" "schedule_exception_type" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_exception_time_order" CHECK ("ends_at" > "starts_at")
);
--> statement-breakpoint
CREATE INDEX "doctor_exception_doctor_range_idx" ON "doctor_schedule_exceptions" USING btree ("doctor_id","starts_at","ends_at");--> statement-breakpoint

CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"patient_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"doctor_id" uuid,
	"source" "appointment_source" NOT NULL,
	"status" "appointment_status" DEFAULT 'PENDING' NOT NULL,
	"requested_start_at" timestamp with time zone NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"duration_minutes" integer NOT NULL,
	"fee" numeric(12, 2) NOT NULL,
	"buffer_before_minutes" integer DEFAULT 0 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_by_user_id" uuid,
	"approved_by_user_id" uuid,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_reference_unique" UNIQUE("reference"),
	CONSTRAINT "appointments_duration_positive" CHECK ("duration_minutes" > 0),
	CONSTRAINT "appointments_time_order" CHECK ("starts_at" IS NULL OR "ends_at" IS NULL OR "ends_at" > "starts_at"),
	CONSTRAINT "appointments_confirmed_shape" CHECK ("status" NOT IN ('CONFIRMED','CHECKED_IN','IN_PROGRESS','COMPLETED') OR ("doctor_id" IS NOT NULL AND "starts_at" IS NOT NULL AND "ends_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX "appointments_patient_idx" ON "appointments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "appointments_doctor_idx" ON "appointments" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_starts_at_idx" ON "appointments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "appointments_pending_created_idx" ON "appointments" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_no_doctor_overlap"
EXCLUDE USING gist (
	"doctor_id" WITH =,
	tstzrange("starts_at", "ends_at", '[)') WITH &&
) WHERE ("status" IN ('CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') AND "doctor_id" IS NOT NULL);--> statement-breakpoint

CREATE TABLE "appointment_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"from_status" "appointment_status",
	"to_status" "appointment_status" NOT NULL,
	"actor_user_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "appointment_history_appointment_idx" ON "appointment_status_history" USING btree ("appointment_id","created_at");--> statement-breakpoint

CREATE TABLE "walk_in_queue_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid,
	"clinic_date" date NOT NULL,
	"queue_number" integer NOT NULL,
	"status" "walk_in_status" DEFAULT 'WAITING' NOT NULL,
	"doctor_id" uuid,
	"checked_in_at" timestamp with time zone,
	"called_at" timestamp with time zone,
	"service_started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "walk_in_queue_number_positive" CHECK ("queue_number" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "walk_in_queue_date_number_unique" ON "walk_in_queue_entries" USING btree ("clinic_date","queue_number");--> statement-breakpoint
CREATE INDEX "walk_in_queue_date_status_idx" ON "walk_in_queue_entries" USING btree ("clinic_date","status");--> statement-breakpoint

CREATE TABLE "guest_booking_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guest_booking_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "guest_tokens_appointment_idx" ON "guest_booking_tokens" USING btree ("appointment_id");--> statement-breakpoint

CREATE TABLE "tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" "token_purpose" NOT NULL,
	"token_hash" text NOT NULL,
	"family_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "tokens_user_purpose_idx" ON "tokens" USING btree ("user_id","purpose");--> statement-breakpoint

CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'PHP' NOT NULL,
	"method" "payment_method" NOT NULL,
	"receipt_number" text,
	"recorded_by_user_id" uuid,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"reverses_payment_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0),
	CONSTRAINT "payments_currency_php" CHECK ("currency" = 'PHP'),
	CONSTRAINT "payments_reversal_not_self" CHECK ("reverses_payment_id" IS NULL OR "reverses_payment_id" <> "id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "payments_reversal_unique" ON "payments" USING btree ("reverses_payment_id");--> statement-breakpoint
CREATE INDEX "payments_appointment_idx" ON "payments" USING btree ("appointment_id");--> statement-breakpoint

CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dedupe_key" text NOT NULL,
	"recipient" text NOT NULL,
	"template_key" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deliver_after" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"locked_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_outbox_dedupe_key_unique" UNIQUE("dedupe_key"),
	CONSTRAINT "email_outbox_attempts_non_negative" CHECK ("attempts" >= 0)
);
--> statement-breakpoint
CREATE INDEX "email_outbox_due_idx" ON "email_outbox" USING btree ("deliver_after","sent_at");--> statement-breakpoint

CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_type" "audit_actor_type" DEFAULT 'USER' NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint

CREATE TABLE "clinic_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text,
	"phone" text,
	"email" text,
	"timezone" text DEFAULT 'Asia/Manila' NOT NULL,
	"currency" text DEFAULT 'PHP' NOT NULL,
	"cancellation_cutoff_hours" integer DEFAULT 24 NOT NULL,
	"guest_link_ttl_hours" integer DEFAULT 168 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clinic_settings_timezone" CHECK ("timezone" = 'Asia/Manila'),
	CONSTRAINT "clinic_settings_currency" CHECK ("currency" = 'PHP'),
	CONSTRAINT "clinic_settings_cutoff_non_negative" CHECK ("cancellation_cutoff_hours" >= 0),
	CONSTRAINT "clinic_settings_guest_ttl_positive" CHECK ("guest_link_ttl_hours" > 0)
);
--> statement-breakpoint

CREATE TABLE "staff_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"invited_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_invites_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX "staff_invites_email_idx" ON "staff_invites" USING btree (lower("email"));--> statement-breakpoint

ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_services" ADD CONSTRAINT "doctor_services_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_services" ADD CONSTRAINT "doctor_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_weekly_availability" ADD CONSTRAINT "doctor_weekly_availability_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedule_exceptions" ADD CONSTRAINT "doctor_schedule_exceptions_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_approved_by_user_id_users_id_fk" FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_history" ADD CONSTRAINT "appointment_status_history_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment_status_history" ADD CONSTRAINT "appointment_status_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walk_in_queue_entries" ADD CONSTRAINT "walk_in_queue_entries_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walk_in_queue_entries" ADD CONSTRAINT "walk_in_queue_entries_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walk_in_queue_entries" ADD CONSTRAINT "walk_in_queue_entries_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walk_in_queue_entries" ADD CONSTRAINT "walk_in_queue_entries_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_booking_tokens" ADD CONSTRAINT "guest_booking_tokens_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reverses_payment_id_payments_id_fk" FOREIGN KEY ("reverses_payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

INSERT INTO "clinic_settings" ("id", "name", "description", "address", "phone", "email")
VALUES ('00000000-0000-4000-8000-000000000001', 'OptiCo Demo Optical Clinic', 'Sample clinic profile for development. Replace before real use.', 'Demo address, Metro Manila', '+63 2 0000 0000', 'demo@example.com')
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "clinic_hours" ("weekday", "is_open", "open_time", "close_time") VALUES
	(0, false, NULL, NULL),
	(1, true, '09:00', '17:00'),
	(2, true, '09:00', '17:00'),
	(3, true, '09:00', '17:00'),
	(4, true, '09:00', '17:00'),
	(5, true, '09:00', '17:00'),
	(6, false, NULL, NULL)
ON CONFLICT ("weekday") DO NOTHING;--> statement-breakpoint
INSERT INTO "services" ("id", "slug", "name", "description", "duration_minutes", "fee", "display_order") VALUES
	('00000000-0000-4000-8000-000000000101', 'optometry-consultation', 'Optometry consultation', 'Demo service. Discuss vision concerns with an optometrist.', 30, '500.00', 1),
	('00000000-0000-4000-8000-000000000102', 'comprehensive-eye-examination', 'Comprehensive eye examination', 'Demo service. Full eye health and vision check.', 45, '800.00', 2),
	('00000000-0000-4000-8000-000000000103', 'refraction-vision-testing', 'Refraction / vision testing', 'Demo service. Measure refractive error for eyewear.', 20, '400.00', 3),
	('00000000-0000-4000-8000-000000000104', 'follow-up-consultation', 'Follow-up consultation', 'Demo service. Short follow-up visit.', 15, '300.00', 4),
	('00000000-0000-4000-8000-000000000105', 'eyewear-consultation', 'Eyewear consultation', 'Demo service. Frame and lens selection guidance.', 30, '300.00', 5)
ON CONFLICT ("slug") DO NOTHING;
