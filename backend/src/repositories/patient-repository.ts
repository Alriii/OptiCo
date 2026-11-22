import { and, desc, eq, or, sql } from "drizzle-orm";
import { db, type DbClient } from "@/db";
import { patients } from "@/db/schema";

export type PatientInput = {
  fullName: string;
  email: string;
  mobile?: string | null;
  dateOfBirth?: string | null;
  guardianName?: string | null;
  guardianRelationship?: string | null;
  guardianContact?: string | null;
};

export class PatientRepository {
  async findByUserId(userId: string) {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId)).limit(1);
    return patient;
  }

  async findById(id: string, client: DbClient = db) {
    const [patient] = await client.select().from(patients).where(eq(patients.id, id)).limit(1);
    return patient;
  }

  async create(input: PatientInput, client: DbClient = db) {
    const [patient] = await client
      .insert(patients)
      .values({
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        mobile: input.mobile ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        guardianName: input.guardianName ?? null,
        guardianRelationship: input.guardianRelationship ?? null,
        guardianContact: input.guardianContact ?? null,
      })
      .returning();
    return patient;
  }

  async update(id: string, input: Partial<PatientInput>) {
    const [patient] = await db
      .update(patients)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient;
  }

  async search(query: string, limit = 20) {
    const term = `%${query.toLowerCase()}%`;
    return db
      .select({
        id: patients.id,
        fullName: patients.fullName,
        email: patients.email,
        mobile: patients.mobile,
      })
      .from(patients)
      .where(
        or(
          sql`lower(${patients.fullName}) LIKE ${term}`,
          sql`lower(${patients.email}) LIKE ${term}`,
          sql`${patients.mobile} LIKE ${term}`,
        ),
      )
      .orderBy(desc(patients.createdAt))
      .limit(limit);
  }

  async count() {
    const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(patients);
    return row.total;
  }

  async findGuardianCandidates(email: string) {
    return db.select().from(patients).where(and(eq(patients.email, email.toLowerCase()))).limit(5);
  }
}
