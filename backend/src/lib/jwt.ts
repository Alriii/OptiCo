import jwt, { type SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { ENV } from "@/config/env";
import type { UserRole } from "@/db/schema";

const ISSUER = "optico-api";
const AUDIENCE = "optico-web";
const ALGORITHM = "HS256" as const;

export type AccessPayload = {
  sub: string;
  role: UserRole;
  type: "access";
};

export type RefreshPayload = {
  sub: string;
  type: "refresh";
  familyId: string;
};

export type GuestPayload = {
  sub: string;
  type: "guest";
  appointmentId: string;
};

const baseOptions: SignOptions = {
  algorithm: ALGORITHM,
  issuer: ISSUER,
  audience: AUDIENCE,
};

export function signAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role, type: "access" }, ENV.JWT_SECRET, {
    ...baseOptions,
    expiresIn: ENV.ACCESS_TOKEN_TTL_SECONDS,
    jwtid: randomUUID(),
  });
}

export function signRefreshToken(userId: string, familyId: string): string {
  return jwt.sign({ sub: userId, type: "refresh", familyId }, ENV.JWT_SECRET, {
    ...baseOptions,
    expiresIn: ENV.REFRESH_TOKEN_TTL_SECONDS,
    jwtid: randomUUID(),
  });
}

export function signGuestToken(appointmentId: string): string {
  return jwt.sign({ sub: appointmentId, type: "guest", appointmentId }, ENV.JWT_SECRET, {
    ...baseOptions,
    expiresIn: 30 * 60,
    jwtid: randomUUID(),
  });
}

function verify<T extends { type: string }>(token: string | undefined, type: T["type"]): T | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as T;
    return payload.type === type ? payload : null;
  } catch {
    return null;
  }
}

export const verifyAccessToken = (token?: string) => verify<AccessPayload>(token, "access");
export const verifyRefreshToken = (token?: string) => verify<RefreshPayload>(token, "refresh");
export const verifyGuestToken = (token?: string) => verify<GuestPayload>(token, "guest");
