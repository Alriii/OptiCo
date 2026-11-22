import { randomUUID } from "node:crypto";
import { ENV } from "@/config/env";
import type { User } from "@/db/schema";
import { AppError } from "@/lib/http";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { hashToken } from "@/lib/tokens";
import { AuthTokenRepository } from "@/repositories/auth-token-repository";
import { UserRepository } from "@/repositories/user-repository";
import type { AuthTokens } from "@/services/auth/types";

const tokenRepository = new AuthTokenRepository();
const userRepository = new UserRepository();

export async function issueTokens(user: Pick<User, "id" | "role">): Promise<AuthTokens> {
  const familyId = randomUUID();
  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, familyId);

  await tokenRepository.create({
    userId: user.id,
    purpose: "REFRESH",
    tokenHash: hashToken(refreshToken),
    familyId,
    expiresAt: new Date(Date.now() + ENV.REFRESH_TOKEN_TTL_SECONDS * 1000),
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(rawToken: string | undefined) {
  const payload = verifyRefreshToken(rawToken);
  if (!payload) throw new AppError(401, "Invalid or expired session");

  const row = await tokenRepository.findByHash(hashToken(rawToken as string));
  if (!row || row.userId !== payload.sub || row.familyId !== payload.familyId) {
    throw new AppError(401, "Invalid or expired session");
  }

  // A consumed or revoked token presented again means the family is compromised.
  if (row.consumedAt || row.revokedAt) {
    await tokenRepository.revokeFamily(row.familyId);
    throw new AppError(401, "Invalid or expired session");
  }

  if (row.expiresAt.getTime() <= Date.now()) {
    throw new AppError(401, "Invalid or expired session");
  }

  const consumed = await tokenRepository.consume(row.id);
  if (!consumed) {
    await tokenRepository.revokeFamily(row.familyId);
    throw new AppError(401, "Invalid or expired session");
  }

  const user = await userRepository.findById(payload.sub);
  if (!user || user.status !== "ACTIVE") throw new AppError(401, "Invalid or expired session");

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, row.familyId);
  await tokenRepository.create({
    userId: user.id,
    purpose: "REFRESH",
    tokenHash: hashToken(refreshToken),
    familyId: row.familyId,
    expiresAt: new Date(Date.now() + ENV.REFRESH_TOKEN_TTL_SECONDS * 1000),
  });

  return { user, tokens: { accessToken, refreshToken } };
}

export async function revokeRefreshToken(rawToken: string | undefined) {
  if (!rawToken) return;
  const row = await tokenRepository.findByHash(hashToken(rawToken));
  if (!row) return;
  await tokenRepository.revokeFamily(row.familyId);
}
