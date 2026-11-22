import bcrypt from "bcrypt";
import { AppError } from "@/lib/http";
import { UserRepository } from "@/repositories/user-repository";
import { recordAudit } from "@/services/audit-service";
import { issueTokens } from "@/services/auth/token-service";
import { toSessionUser } from "@/services/auth/types";

const userRepository = new UserRepository();
const BCRYPT_ROUNDS = 12;

export async function signupService(input: { name: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new AppError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  // Public signup is hard-coded to PATIENT; role is never read from the client.
  const { user } = await userRepository.createPatientAccount({ name: input.name.trim(), email, passwordHash });
  const tokens = await issueTokens(user);

  await recordAudit({
    actorUserId: user.id,
    actorType: "USER",
    action: "auth.signup",
    entityType: "user",
    entityId: user.id,
  });

  return { user: toSessionUser(user), tokens };
}
