import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { staffInvites, type UserRole } from "@/db/schema";

export class StaffInviteRepository {
  async create(input: {
    email: string;
    role: UserRole;
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId?: string | null;
  }) {
    const [row] = await db.insert(staffInvites).values({ ...input, email: input.email.toLowerCase() }).returning();
    return row;
  }

  async findUsableByHash(tokenHash: string) {
    const [row] = await db
      .select()
      .from(staffInvites)
      .where(
        and(
          eq(staffInvites.tokenHash, tokenHash),
          isNull(staffInvites.acceptedAt),
          gt(staffInvites.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row;
  }

  async findPendingByEmail(email: string) {
    const [row] = await db
      .select()
      .from(staffInvites)
      .where(
        and(
          sql`lower(${staffInvites.email}) = ${email.toLowerCase()}`,
          isNull(staffInvites.acceptedAt),
          gt(staffInvites.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(staffInvites.createdAt))
      .limit(1);
    return row;
  }

  async markAccepted(id: string) {
    const [row] = await db.update(staffInvites).set({ acceptedAt: new Date() }).where(eq(staffInvites.id, id)).returning();
    return row;
  }
}
