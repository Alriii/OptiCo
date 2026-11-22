import { getRequestContext } from "@/lib/request-context";
import { recordAudit } from "@/services/audit-service";
import { revokeRefreshToken } from "@/services/auth/token-service";

export async function logoutService(rawToken: string | undefined) {
  await revokeRefreshToken(rawToken);
  await recordAudit({
    actorUserId: getRequestContext()?.actorUserId ?? null,
    actorType: "USER",
    action: "auth.logout",
    entityType: "session",
  });
  return { loggedOut: true };
}
