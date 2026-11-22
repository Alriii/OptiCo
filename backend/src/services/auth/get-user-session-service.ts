import { AppError } from "@/lib/http";
import { UserRepository } from "@/repositories/user-repository";
import { toSessionUser } from "@/services/auth/types";

const userRepository = new UserRepository();

export async function getUserSessionService(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(401, "Authentication required");
  if (user.status !== "ACTIVE") throw new AppError(403, "This account is not active");
  return { user: toSessionUser(user) };
}
