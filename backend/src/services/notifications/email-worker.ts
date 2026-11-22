import { logger } from "@/lib/logger";
import { EmailOutboxRepository } from "@/repositories/email-outbox-repository";
import { deliverEmail } from "@/services/notifications/email-service";

const repository = new EmailOutboxRepository();
const POLL_INTERVAL_MS = 15_000;
const BATCH_SIZE = 10;

let timer: ReturnType<typeof setInterval> | null = null;
let inFlight: Promise<void> | null = null;

async function processBatch() {
  const due = await repository.claimDue(BATCH_SIZE);
  for (const row of due) {
    try {
      await deliverEmail(row.templateKey, row.recipient, row.payload ?? {});
      await repository.markSent(row.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delivery error";
      const backoffSeconds = Math.min(3600, 60 * 2 ** row.attempts);
      await repository.markFailed(row.id, message, backoffSeconds);
      logger.warn("email_delivery_failed", { templateKey: row.templateKey, attempts: row.attempts + 1 });
    }
  }
}

async function tick() {
  if (inFlight) return inFlight;
  inFlight = processBatch()
    .catch((error) => logger.error("email_worker_error", { message: error instanceof Error ? error.message : "unknown" }))
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

export function startEmailWorker() {
  if (timer) return;
  timer = setInterval(() => void tick(), POLL_INTERVAL_MS);
  timer.unref?.();
  void tick();
  logger.info("email_worker_started");
}

export async function stopEmailWorker() {
  if (timer) clearInterval(timer);
  timer = null;
  if (inFlight) await inFlight;
  logger.info("email_worker_stopped");
}

/** Used by tests and one-off scripts without starting the interval. */
export async function runEmailWorkerOnce() {
  await tick();
}
