import bcrypt from "bcrypt";
import { AppError } from "@/lib/http";
import { hashToken } from "@/lib/tokens";
import { StaffInviteRepository } from "@/repositories/staff-invite-repository";
import { UserRepository } from "@/repositories/user-repository";
import { recordAudit } from "@/services/audit-service";
import { issueTokens } from "@/services/auth/token-service";
import { toSessionUser } from "@/services/auth/types";

const staffInviteRepository = new StaffInviteRepository();
const userRepository = new UserRepository();

export async function acceptInviteService(input: { token: string; password: string }) {
  const invite = await staffInviteRepository.findUsableByHash(hashToken(input.token));
  if (!invite) throw new AppError(400, "This invitation is invalid or has expired");

  const user = await userRepository.findByEmail(invite.email);
  if (!user || user.status === "DISABLED") throw new AppError(400, "This invitation cannot be used");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const activated = await userRepository.activateInvitedUser(user.id, passwordHash);
  await staffInviteRepository.markAccepted(invite.id);
  const tokens = await issueTokens(activated);

  await recordAudit({
    actorUserId: activated.id,
    actorType: "USER",
    action: "staff.invite_accepted",
    entityType: "user",
    entityId: activated.id,
    metadata: { role: activated.role },
  });

  return { user: toSessionUser(activated), tokens };
}
