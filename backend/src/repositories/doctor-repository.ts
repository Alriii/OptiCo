import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { db, type DbClient } from "@/db";
import {
  appointments,
  doctorServices,
  doctors,
  services,
  users,
} from "@/db/schema";

export type DoctorInput = {
  slug: string;
  displayName: string;
  credentials?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  isActive?: boolean;
};

export class DoctorRepository {
  async listPublic() {
    return db
      .select({
        id: doctors.id,
        slug: doctors.slug,
        displayName: doctors.displayName,
        credentials: doctors.credentials,
        bio: doctors.bio,
        photoUrl: doctors.photoUrl,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(and(eq(doctors.isActive, true), eq(users.status, "ACTIVE")))
      .orderBy(asc(doctors.displayName));
  }

  async findPublicBySlug(slug: string) {
    const [doctor] = await db
      .select({
        id: doctors.id,
        slug: doctors.slug,
        displayName: doctors.displayName,
        credentials: doctors.credentials,
        bio: doctors.bio,
        photoUrl: doctors.photoUrl,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(and(eq(doctors.slug, slug), eq(doctors.isActive, true), eq(users.status, "ACTIVE")))
      .limit(1);
    return doctor;
  }

  async listAdmin() {
    return db
      .select({
        id: doctors.id,
        userId: doctors.userId,
        slug: doctors.slug,
        displayName: doctors.displayName,
        credentials: doctors.credentials,
        bio: doctors.bio,
        photoUrl: doctors.photoUrl,
        isActive: doctors.isActive,
        email: users.email,
        userStatus: users.status,
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .orderBy(asc(doctors.displayName));
  }

  async findById(id: string, client: DbClient = db) {
    const [doctor] = await client.select().from(doctors).where(eq(doctors.id, id)).limit(1);
    return doctor;
  }

  async findByUserId(userId: string) {
    const [doctor] = await db.select().from(doctors).where(eq(doctors.userId, userId)).limit(1);
    return doctor;
  }

  async create(userId: string, input: DoctorInput) {
    const [doctor] = await db
      .insert(doctors)
      .values({ userId, ...input })
      .returning();
    return doctor;
  }

  async update(id: string, input: Partial<DoctorInput>) {
    const [doctor] = await db
      .update(doctors)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return doctor;
  }

  async getServiceIds(doctorId: string) {
    const rows = await db
      .select({ serviceId: doctorServices.serviceId })
      .from(doctorServices)
      .where(eq(doctorServices.doctorId, doctorId));
    return rows.map((row) => row.serviceId);
  }

  async listServicesForDoctor(doctorId: string) {
    return db
      .select({
        id: services.id,
        slug: services.slug,
        name: services.name,
        description: services.description,
        durationMinutes: services.durationMinutes,
        fee: services.fee,
      })
      .from(doctorServices)
      .innerJoin(services, eq(doctorServices.serviceId, services.id))
      .where(and(eq(doctorServices.doctorId, doctorId), eq(services.isActive, true)))
      .orderBy(asc(services.displayOrder));
  }

  async setServices(doctorId: string, serviceIds: string[]) {
    await db.transaction(async (tx) => {
      await tx.delete(doctorServices).where(eq(doctorServices.doctorId, doctorId));
      if (serviceIds.length > 0) {
        await tx.insert(doctorServices).values(serviceIds.map((serviceId) => ({ doctorId, serviceId })));
      }
    });
  }

  /** Active doctors whose staff account is usable and who are linked to the service. */
  async listEligibleForService(serviceId: string) {
    return db
      .select({ id: doctors.id, userId: doctors.userId, displayName: doctors.displayName })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .innerJoin(doctorServices, eq(doctorServices.doctorId, doctors.id))
      .where(
        and(
          eq(doctorServices.serviceId, serviceId),
          eq(doctors.isActive, true),
          eq(users.status, "ACTIVE"),
        ),
      )
      .orderBy(asc(doctors.id));
  }

  async lockEligibleForService(serviceId: string, client: DbClient) {
    // Stable id order prevents deadlocks between concurrent approvals.
    const result = await client.execute(sql`
      SELECT d.id
      FROM doctors d
      JOIN users u ON u.id = d.user_id
      JOIN doctor_services ds ON ds.doctor_id = d.id
      WHERE ds.service_id = ${serviceId}
        AND d.is_active = true
        AND u.status = 'ACTIVE'
      ORDER BY d.id
      FOR UPDATE OF d
    `);
    return (result.rows as { id: string }[]).map((row) => row.id);
  }

  async countScheduledOnDate(doctorId: string, dayStart: Date, dayEnd: Date, client: DbClient = db) {
    const [row] = await client
      .select({ total: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          inArray(appointments.status, ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED"]),
          sql`${appointments.startsAt} >= ${dayStart.toISOString()}`,
          sql`${appointments.startsAt} < ${dayEnd.toISOString()}`,
        ),
      );
    return Number(row.total);
  }

  async findBlockingAppointments(doctorId: string, rangeStart: Date, rangeEnd: Date, client: DbClient = db) {
    return client
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        bufferBeforeMinutes: appointments.bufferBeforeMinutes,
        bufferAfterMinutes: appointments.bufferAfterMinutes,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          inArray(appointments.status, ["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"]),
          sql`${appointments.startsAt} < ${rangeEnd.toISOString()}`,
          sql`${appointments.endsAt} > ${rangeStart.toISOString()}`,
        ),
      );
  }

  async countActive() {
    const [row] = await db
      .select({ total: count() })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .where(and(eq(doctors.isActive, true), eq(users.status, "ACTIVE")));
    return Number(row.total);
  }
}
