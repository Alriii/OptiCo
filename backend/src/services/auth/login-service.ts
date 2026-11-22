import bcrypt from "bcrypt";
import { AppError } from "@/lib/http";
import { UserRepository } from "@/repositories/user-repository";
import { recordAudit } from "@/services/audit-service";
import { issueTokens } from "@/services/auth/token-service";
import { toSessionUser } from "@/services/auth/types";

const userRepository = new UserRepository();
// Equalize the failed-login path so account existence is not measurable by timing.
const DUMMY_HASH = bcrypt.hashSync("optico-timing-equalizer", 10);

export async function loginService(input: { email: string; password: string }) {
  const user = await userRepository.findByEmail(input.email.trim().toLowerCase());
  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);

  // One generic error for unknown, wrong-password, invited, and disabled accounts.
  if (!user || !user.passwordHash || !valid || user.status !== "ACTIVE") {
    throw new AppError(401, "Invalid email or password");
  }

  await userRepository.updateLastLogin(user.id);
  const tokens = await issueTokens(user);

  await recordAudit({
    actorUserId: user.id,
    actorType: "USER",
    action: "auth.login",
    entityType: "user",
    entityId: user.id,
  });

  return { user: toSessionUser(user), tokens };
}
