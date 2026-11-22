import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tokens, type tokenPurpose } from "@/db/schema";

type TokenPurpose = (typeof tokenPurpose.enumValues)[number];

export class AuthTokenRepository {
  async create(input: {
    userId: string;
    purpose: TokenPurpose;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
  }) {
    const [row] = await db.insert(tokens).values(input).returning();
    return row;
  }

  async findByHash(tokenHash: string) {
    const [row] = await db.select().from(tokens).where(eq(tokens.tokenHash, tokenHash)).limit(1);
    return row;
  }

  async findActiveByHash(tokenHash: string) {
    const [row] = await db
      .select()
      .from(tokens)
      .where(
        and(
          eq(tokens.tokenHash, tokenHash),
          eq(tokens.purpose, "REFRESH"),
          isNull(tokens.consumedAt),
          isNull(tokens.revokedAt),
          gt(tokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row;
  }

  /** Atomic single-use consume; a second caller gets null. */
  async consume(id: string) {
    const [row] = await db
      .update(tokens)
      .set({ consumedAt: new Date() })
      .where(and(eq(tokens.id, id), isNull(tokens.consumedAt), isNull(tokens.revokedAt)))
      .returning();
    return row;
  }

  async revoke(id: string) {
    const [row] = await db
      .update(tokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(tokens.id, id), isNull(tokens.revokedAt)))
      .returning();
    return row;
  }

  /** Reuse detection revokes every rotation in the same family. */
  async revokeFamily(familyId: string) {
    await db
      .update(tokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(tokens.familyId, familyId), isNull(tokens.revokedAt)));
  }
}
