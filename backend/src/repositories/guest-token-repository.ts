import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { guestBookingTokens } from "@/db/schema";

export class GuestTokenRepository {
  async create(input: { appointmentId: string; tokenHash: string; expiresAt: Date }) {
    const [row] = await db.insert(guestBookingTokens).values(input).returning();
    return row;
  }

  async findUsableByHash(tokenHash: string) {
    const [row] = await db
      .select()
      .from(guestBookingTokens)
      .where(
        and(
          eq(guestBookingTokens.tokenHash, tokenHash),
          isNull(guestBookingTokens.usedAt),
          isNull(guestBookingTokens.revokedAt),
          gt(guestBookingTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row;
  }

  /** Single use: the update only succeeds once. */
  async markUsed(id: string) {
    const [row] = await db
      .update(guestBookingTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(guestBookingTokens.id, id), isNull(guestBookingTokens.usedAt), isNull(guestBookingTokens.revokedAt)))
      .returning();
    return row;
  }

  async revokeForAppointment(appointmentId: string) {
    await db
      .update(guestBookingTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(guestBookingTokens.appointmentId, appointmentId), isNull(guestBookingTokens.revokedAt)));
  }
}
