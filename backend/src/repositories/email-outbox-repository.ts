import { and, asc, eq, isNull, lt, sql } from "drizzle-orm";
import { db, type DbClient } from "@/db";
import { emailOutbox, type EmailOutboxRow } from "@/db/schema";

export const MAX_EMAIL_ATTEMPTS = 5;

export type EnqueueEmailInput = {
  dedupeKey: string;
  recipient: string;
  templateKey: string;
  payload?: Record<string, unknown>;
  deliverAfter?: Date;
};

export class EmailOutboxRepository {
  async enqueue(input: EnqueueEmailInput, client: DbClient = db) {
    const [row] = await client
      .insert(emailOutbox)
      .values({
        dedupeKey: input.dedupeKey,
        recipient: input.recipient,
        templateKey: input.templateKey,
        payload: input.payload ?? {},
        deliverAfter: input.deliverAfter ?? new Date(),
      })
      .onConflictDoNothing({ target: emailOutbox.dedupeKey })
      .returning();
    return row;
  }

  async claimDue(limit = 10): Promise<EmailOutboxRow[]> {
    // One worker wins each row; SKIP LOCKED keeps other workers moving.
    const result = await db.execute(sql`
      UPDATE email_outbox SET locked_at = now()
      WHERE id IN (
        SELECT id FROM email_outbox
        WHERE sent_at IS NULL
          AND locked_at IS NULL
          AND attempts < ${MAX_EMAIL_ATTEMPTS}
          AND deliver_after <= now()
        ORDER BY deliver_after
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `);
    return result.rows as EmailOutboxRow[];
  }

  async markSent(id: string) {
    await db.update(emailOutbox).set({ sentAt: new Date(), lockedAt: null, lastError: null }).where(eq(emailOutbox.id, id));
  }

  async markFailed(id: string, error: string, retryAfterSeconds: number) {
    await db
      .update(emailOutbox)
      .set({
        attempts: sql`${emailOutbox.attempts} + 1`,
        lastError: error.slice(0, 500),
        lockedAt: null,
        deliverAfter: new Date(Date.now() + retryAfterSeconds * 1000),
      })
      .where(eq(emailOutbox.id, id));
  }

  /** Reschedule/cancel must drop reminders that have not been sent yet. */
  async cancelUnsentReminders(appointmentId: string, client: DbClient = db) {
    await client
      .delete(emailOutbox)
      .where(
        and(
          isNull(emailOutbox.sentAt),
          sql`${emailOutbox.dedupeKey} LIKE ${`reminder%:${appointmentId}:%`}`,
        ),
      );
  }

  async listUnsent(limit = 50) {
    return db
      .select()
      .from(emailOutbox)
      .where(and(isNull(emailOutbox.sentAt), lt(emailOutbox.attempts, MAX_EMAIL_ATTEMPTS)))
      .orderBy(asc(emailOutbox.deliverAfter))
      .limit(limit);
  }
}
