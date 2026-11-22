import { and, asc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db, type DbClient } from "@/db";
import {
  clinicClosures,
  clinicHours,
  doctorScheduleExceptions,
  doctorWeeklyAvailability,
} from "@/db/schema";

export type ClinicHourInput = {
  weekday: number;
  isOpen: boolean;
  openTime?: string | null;
  closeTime?: string | null;
};

export type WeeklyAvailabilityInput = {
  weekday: number;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
};

export type ScheduleExceptionInput = {
  startsAt: Date;
  endsAt: Date;
  type: "UNAVAILABLE" | "ADDITIONAL" | "TIME_OFF";
  reason?: string | null;
};

export class ScheduleRepository {
  async listClinicHours() {
    return db.select().from(clinicHours).orderBy(asc(clinicHours.weekday));
  }

  async getClinicHour(weekday: number, client: DbClient = db) {
    const [row] = await client.select().from(clinicHours).where(eq(clinicHours.weekday, weekday)).limit(1);
    return row;
  }

  async replaceClinicHours(rows: ClinicHourInput[]) {
    await db.transaction(async (tx) => {
      for (const row of rows) {
        await tx
          .insert(clinicHours)
          .values(row)
          .onConflictDoUpdate({
            target: clinicHours.weekday,
            set: { isOpen: row.isOpen, openTime: row.openTime ?? null, closeTime: row.closeTime ?? null },
          });
      }
    });
  }

  async listClosures() {
    return db.select().from(clinicClosures).orderBy(asc(clinicClosures.startsOn));
  }

  async findClosureForDate(dateStr: string, client: DbClient = db) {
    const [row] = await client
      .select()
      .from(clinicClosures)
      .where(and(lte(clinicClosures.startsOn, dateStr), gte(clinicClosures.endsOn, dateStr)))
      .limit(1);
    return row;
  }

  async createClosure(input: { startsOn: string; endsOn: string; reason?: string | null }) {
    const [row] = await db.insert(clinicClosures).values(input).returning();
    return row;
  }

  async deleteClosure(id: string) {
    const [row] = await db.delete(clinicClosures).where(eq(clinicClosures.id, id)).returning();
    return row;
  }

  async listWeeklyAvailability(doctorId: string) {
    return db
      .select()
      .from(doctorWeeklyAvailability)
      .where(eq(doctorWeeklyAvailability.doctorId, doctorId))
      .orderBy(asc(doctorWeeklyAvailability.weekday), asc(doctorWeeklyAvailability.startTime));
  }

  async weeklyAvailabilityForDate(doctorId: string, weekday: number, dateStr: string, client: DbClient = db) {
    return client
      .select()
      .from(doctorWeeklyAvailability)
      .where(
        and(
          eq(doctorWeeklyAvailability.doctorId, doctorId),
          eq(doctorWeeklyAvailability.weekday, weekday),
          or(isNull(doctorWeeklyAvailability.effectiveFrom), lte(doctorWeeklyAvailability.effectiveFrom, dateStr)),
          or(isNull(doctorWeeklyAvailability.effectiveUntil), gte(doctorWeeklyAvailability.effectiveUntil, dateStr)),
        ),
      )
      .orderBy(asc(doctorWeeklyAvailability.startTime));
  }

  async replaceWeeklyAvailability(doctorId: string, rows: WeeklyAvailabilityInput[]) {
    await db.transaction(async (tx) => {
      await tx.delete(doctorWeeklyAvailability).where(eq(doctorWeeklyAvailability.doctorId, doctorId));
      if (rows.length > 0) {
        await tx.insert(doctorWeeklyAvailability).values(rows.map((row) => ({ ...row, doctorId })));
      }
    });
  }

  async listExceptions(doctorId: string, from?: Date, to?: Date) {
    const conditions = [eq(doctorScheduleExceptions.doctorId, doctorId)];
    if (from) conditions.push(sql`${doctorScheduleExceptions.endsAt} > ${from.toISOString()}`);
    if (to) conditions.push(sql`${doctorScheduleExceptions.startsAt} < ${to.toISOString()}`);
    return db
      .select()
      .from(doctorScheduleExceptions)
      .where(and(...conditions))
      .orderBy(asc(doctorScheduleExceptions.startsAt));
  }

  async exceptionsForRange(doctorId: string, from: Date, to: Date, client: DbClient = db) {
    return client
      .select()
      .from(doctorScheduleExceptions)
      .where(
        and(
          eq(doctorScheduleExceptions.doctorId, doctorId),
          sql`${doctorScheduleExceptions.endsAt} > ${from.toISOString()}`,
          sql`${doctorScheduleExceptions.startsAt} < ${to.toISOString()}`,
        ),
      )
      .orderBy(asc(doctorScheduleExceptions.startsAt));
  }

  async createException(doctorId: string, input: ScheduleExceptionInput) {
    const [row] = await db
      .insert(doctorScheduleExceptions)
      .values({ doctorId, ...input })
      .returning();
    return row;
  }
}
