import { getRequestContext, getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";
import { AuditRepository, type AuditInput } from "@/repositories/audit-repository";

const repository = new AuditRepository();

/** Append-only. Never include secrets, full DOB, or clinical text in metadata. */
export async function recordAudit(input: AuditInput) {
  const context = getRequestContext();
  try {
    await repository.append({
      ...input,
      actorUserId: input.actorUserId ?? context?.actorUserId ?? null,
      actorType: input.actorType ?? context?.actorType ?? "SYSTEM",
      requestId: input.requestId ?? getRequestId() ?? null,
    });
  } catch (error) {
    // Audit failure must not break the user action, but it must be visible.
    logger.error("audit_write_failed", {
      action: input.action,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
