import { rotateRefreshToken } from "@/services/auth/token-service";
import { toSessionUser } from "@/services/auth/types";

export async function refreshTokenService(rawToken: string | undefined) {
  const { user, tokens } = await rotateRefreshToken(rawToken);
  return { user: toSessionUser(user), tokens };
}
