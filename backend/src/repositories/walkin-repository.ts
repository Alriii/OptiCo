import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, type DbClient } from "@/db";
import {
  patients,
  walkInQueueEntries,
  type WalkInStatus,
} from "@/db/schema";

export class WalkInRepository {
  /** Queue numbers are per Manila clinic day and protected by a transaction-scoped lock. */
  async createWithQueueNumber(
    input: {
      patientId: string;
      clinicDate: string;
      appointmentId?: string | null;
      doctorId?: string | null;
      createdByUserId?: string | null;
    },
    client: DbClient,
  ) {
    await client.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.clinicDate}))`);
    const [maxRow] = await client
      .select({ max: sql<number>`coalesce(max(${walkInQueueEntries.queueNumber}), 0)::int` })
      .from(walkInQueueEntries)
      .where(eq(walkInQueueEntries.clinicDate, input.clinicDate));

    const [row] = await client
      .insert(walkInQueueEntries)
      .values({
        patientId: input.patientId,
        clinicDate: input.clinicDate,
        queueNumber: maxRow.max + 1,
        appointmentId: input.appointmentId ?? null,
        doctorId: input.doctorId ?? null,
        createdByUserId: input.createdByUserId ?? null,
        checkedInAt: new Date(),
      })
      .returning();
    return row;
  }

  async listByDate(clinicDate: string) {
    return db
      .select({
        id: walkInQueueEntries.id,
        queueNumber: walkInQueueEntries.queueNumber,
        status: walkInQueueEntries.status,
        clinicDate: walkInQueueEntries.clinicDate,
        appointmentId: walkInQueueEntries.appointmentId,
        doctorId: walkInQueueEntries.doctorId,
        patientId: walkInQueueEntries.patientId,
        patientName: patients.fullName,
        patientMobile: patients.mobile,
        checkedInAt: walkInQueueEntries.checkedInAt,
        calledAt: walkInQueueEntries.calledAt,
        serviceStartedAt: walkInQueueEntries.serviceStartedAt,
        completedAt: walkInQueueEntries.completedAt,
        createdAt: walkInQueueEntries.createdAt,
      })
      .from(walkInQueueEntries)
      .innerJoin(patients, eq(walkInQueueEntries.patientId, patients.id))
      .where(eq(walkInQueueEntries.clinicDate, clinicDate))
      .orderBy(asc(walkInQueueEntries.queueNumber));
  }

  async findById(id: string, client: DbClient = db) {
    const [row] = await client.select().from(walkInQueueEntries).where(eq(walkInQueueEntries.id, id)).limit(1);
    return row;
  }

  async findByIdForUpdate(id: string, client: DbClient) {
    const [row] = await client.select().from(walkInQueueEntries).where(eq(walkInQueueEntries.id, id)).limit(1).for("update");
    return row;
  }

  async updateStatus(id: string, status: WalkInStatus, extra: Partial<typeof walkInQueueEntries.$inferInsert> = {}) {
    const [row] = await db
      .update(walkInQueueEntries)
      .set({ status, ...extra, updatedAt: new Date() })
      .where(eq(walkInQueueEntries.id, id))
      .returning();
    return row;
  }

  async findActiveByPatient(patientId: string) {
    const [row] = await db
      .select()
      .from(walkInQueueEntries)
      .where(
        and(
          eq(walkInQueueEntries.patientId, patientId),
          sql`${walkInQueueEntries.status} IN ('WAITING','CALLED','IN_SERVICE')`,
        ),
      )
      .orderBy(desc(walkInQueueEntries.createdAt))
      .limit(1);
    return row;
  }

  async countByDateAndStatus(clinicDate: string, status: WalkInStatus) {
    const [row] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(walkInQueueEntries)
      .where(and(eq(walkInQueueEntries.clinicDate, clinicDate), eq(walkInQueueEntries.status, status)));
    return row.total;
  }
}
