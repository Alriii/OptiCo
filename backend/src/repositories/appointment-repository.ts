import { and, asc, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db, type DbClient } from "@/db";
import {
  appointmentStatusHistory,
  appointments,
  doctors,
  patients,
  services,
  type AppointmentSource,
  type AppointmentStatus,
} from "@/db/schema";
import { generateBookingReference } from "@/lib/reference";
import { manilaDayRange } from "@/lib/time";

export type AppointmentFilters = {
  statuses?: AppointmentStatus[];
  date?: string;
  patientId?: string;
  doctorId?: string;
  q?: string;
};

export type CreateAppointmentInput = {
  patientId: string;
  serviceId: string;
  doctorId?: string | null;
  source: AppointmentSource;
  status?: AppointmentStatus;
  requestedStartAt: Date;
  startsAt?: Date | null;
  endsAt?: Date | null;
  durationMinutes: number;
  fee: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  note?: string | null;
  createdByUserId?: string | null;
  approvedByUserId?: string | null;
  approvedAt?: Date | null;
};

const detailColumns = {
  id: appointments.id,
  reference: appointments.reference,
  status: appointments.status,
  source: appointments.source,
  requestedStartAt: appointments.requestedStartAt,
  startsAt: appointments.startsAt,
  endsAt: appointments.endsAt,
  durationMinutes: appointments.durationMinutes,
  fee: appointments.fee,
  bufferBeforeMinutes: appointments.bufferBeforeMinutes,
  bufferAfterMinutes: appointments.bufferAfterMinutes,
  note: appointments.note,
  patientId: appointments.patientId,
  serviceId: appointments.serviceId,
  doctorId: appointments.doctorId,
  approvedAt: appointments.approvedAt,
  rejectedAt: appointments.rejectedAt,
  cancelledAt: appointments.cancelledAt,
  cancellationReason: appointments.cancellationReason,
  createdAt: appointments.createdAt,
  updatedAt: appointments.updatedAt,
  patientName: patients.fullName,
  patientEmail: patients.email,
  patientMobile: patients.mobile,
  guardianName: patients.guardianName,
  guardianRelationship: patients.guardianRelationship,
  guardianContact: patients.guardianContact,
  serviceName: services.name,
  serviceSlug: services.slug,
  doctorName: doctors.displayName,
  doctorSlug: doctors.slug,
};

function detailQuery(client: DbClient = db) {
  return client
    .select(detailColumns)
    .from(appointments)
    .innerJoin(patients, eq(appointments.patientId, patients.id))
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id));
}

function buildConditions(filters: AppointmentFilters): SQL[] {
  const conditions: SQL[] = [];
  if (filters.statuses?.length) conditions.push(inArray(appointments.status, filters.statuses));
  if (filters.patientId) conditions.push(eq(appointments.patientId, filters.patientId));
  if (filters.doctorId) conditions.push(eq(appointments.doctorId, filters.doctorId));

  if (filters.date) {
    const { start, end } = manilaDayRange(filters.date);
    conditions.push(sql`coalesce(${appointments.startsAt}, ${appointments.requestedStartAt}) >= ${start.toISOString()}`);
    conditions.push(sql`coalesce(${appointments.startsAt}, ${appointments.requestedStartAt}) < ${end.toISOString()}`);
  }

  if (filters.q) {
    const term = `%${filters.q.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${appointments.reference}) LIKE ${term} OR lower(${patients.fullName}) LIKE ${term} OR lower(${patients.email}) LIKE ${term})`,
    );
  }

  return conditions;
}

export class AppointmentRepository {
  async create(input: CreateAppointmentInput, client: DbClient = db) {
    // The reference is non-guessable; retry on the rare unique collision.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const [row] = await client
          .insert(appointments)
          .values({ ...input, reference: generateBookingReference() })
          .returning();
        return row;
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code !== "23505" || attempt === 4) throw error;
      }
    }
    throw new Error("Could not allocate a booking reference");
  }

  async findById(id: string, client: DbClient = db) {
    const [row] = await client.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return row;
  }

  async findByIdForUpdate(id: string, client: DbClient) {
    const [row] = await client.select().from(appointments).where(eq(appointments.id, id)).limit(1).for("update");
    return row;
  }

  async findDetailById(id: string, client: DbClient = db) {
    const [row] = await detailQuery(client).where(eq(appointments.id, id)).limit(1);
    return row;
  }

  async findByReference(reference: string) {
    const [row] = await db.select().from(appointments).where(eq(appointments.reference, reference)).limit(1);
    return row;
  }

  async update(id: string, data: Partial<typeof appointments.$inferInsert>, client: DbClient = db) {
    const [row] = await client
      .update(appointments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return row;
  }

  async addHistory(
    input: {
      appointmentId: string;
      fromStatus: AppointmentStatus | null;
      toStatus: AppointmentStatus;
      actorUserId?: string | null;
      reason?: string | null;
    },
    client: DbClient = db,
  ) {
    const [row] = await client.insert(appointmentStatusHistory).values(input).returning();
    return row;
  }

  async getHistory(appointmentId: string) {
    return db
      .select()
      .from(appointmentStatusHistory)
      .where(eq(appointmentStatusHistory.appointmentId, appointmentId))
      .orderBy(asc(appointmentStatusHistory.createdAt));
  }

  async list(filters: AppointmentFilters, page: number, limit: number) {
    const conditions = buildConditions(filters);
    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const rows = await detailQuery()
      .where(where)
      .orderBy(asc(sql`coalesce(${appointments.startsAt}, ${appointments.requestedStartAt})`), desc(appointments.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await db
      .select({ total: count() })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(where);

    return { rows, total: Number(totalRow.total) };
  }

  async listForPatient(patientId: string, page: number, limit: number) {
    return this.list({ patientId }, page, limit);
  }

  async listForDoctor(doctorId: string, filters: Omit<AppointmentFilters, "doctorId">, page: number, limit: number) {
    return this.list({ ...filters, doctorId }, page, limit);
  }

  async countByStatus(status: AppointmentStatus) {
    const [row] = await db.select({ total: count() }).from(appointments).where(eq(appointments.status, status));
    return Number(row.total);
  }

  async countOnDate(date: string) {
    const { start, end } = manilaDayRange(date);
    const [row] = await db
      .select({ total: count() })
      .from(appointments)
      .where(
        and(
          sql`coalesce(${appointments.startsAt}, ${appointments.requestedStartAt}) >= ${start.toISOString()}`,
          sql`coalesce(${appointments.startsAt}, ${appointments.requestedStartAt}) < ${end.toISOString()}`,
        ),
      );
    return Number(row.total);
  }
}
