import type { CookieOptions, Response } from "express";
import { ENV } from "@/config/env";
import { signGuestToken } from "@/lib/jwt";
import { csrfCookieOptions, csrfSessionCookieName, csrfTokenCookieName } from "@/lib/csrf";

// Same-origin deployment: host-only cookie, no Domain attribute, SameSite=Lax.
function authCookieOptions(maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: ENV.IS_PRODUCTION,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

export const GUEST_COOKIE_NAME = "guestToken";

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie("accessToken", tokens.accessToken, authCookieOptions(ENV.ACCESS_TOKEN_TTL_SECONDS * 1000));
  res.cookie("refreshToken", tokens.refreshToken, authCookieOptions(ENV.REFRESH_TOKEN_TTL_SECONDS * 1000));
}

export function clearAuthCookies(res: Response) {
  const options = authCookieOptions();
  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  res.clearCookie(csrfSessionCookieName, csrfCookieOptions);
  res.clearCookie(csrfTokenCookieName, csrfCookieOptions);
}

export function setGuestCookie(res: Response, appointmentId: string) {
  res.cookie(GUEST_COOKIE_NAME, signGuestToken(appointmentId), authCookieOptions(30 * 60 * 1000));
}

export function clearGuestCookie(res: Response) {
  res.clearCookie(GUEST_COOKIE_NAME, authCookieOptions());
}
