import { and, count, desc, eq, ne, sql } from "drizzle-orm";
import { db, type DbClient } from "@/db";
import { patients, users, type UserRole, type UserStatus } from "@/db/schema";

export type CreatePatientAccountInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export class UserRepository {
  async findByEmail(email: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1);
    return user;
  }

  async findById(id: string, client: DbClient = db) {
    const [user] = await client.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async createPatientAccount(input: CreatePatientAccountInput) {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: input.email.toLowerCase(),
          name: input.name,
          passwordHash: input.passwordHash,
          role: "PATIENT",
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        })
        .returning();

      const [patient] = await tx
        .insert(patients)
        .values({
          userId: user.id,
          fullName: input.name,
          email: input.email.toLowerCase(),
        })
        .returning();

      return { user, patient };
    });
  }

  async createInvitedStaff(input: { email: string; name: string; role: UserRole }) {
    const [user] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        name: input.name,
        role: input.role,
        status: "INVITED",
      })
      .returning();
    return user;
  }

  async activateInvitedUser(id: string, passwordHash: string) {
    const [user] = await db
      .update(users)
      .set({ passwordHash, status: "ACTIVE", emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateLastLogin(id: string) {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  async setStatus(id: string, status: UserStatus) {
    const [user] = await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async setRole(id: string, role: UserRole) {
    const [user] = await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async listStaff(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const where = ne(users.role, "PATIENT");
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(users).where(where);
    return { rows, total: Number(total) };
  }

  async countByRole(role: UserRole) {
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(eq(users.role, role), eq(users.status, "ACTIVE")));
    return Number(total);
  }
}
