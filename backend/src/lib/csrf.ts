import { doubleCsrf } from "csrf-csrf";
import type { CookieOptions } from "express";
import { ENV } from "@/config/env";

export const csrfCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: ENV.IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
  maxAge: ENV.REFRESH_TOKEN_TTL_SECONDS * 1000,
};

export const csrfSessionCookieName = "csrf-session";
export const csrfTokenCookieName = "csrf-token";

export const { generateCsrfToken, validateRequest } = doubleCsrf({
  getSecret: () => ENV.CSRF_SECRET,
  // Bound to our own session cookie so a login or refresh does not invalidate it.
  getSessionIdentifier: (req) => req.cookies?.[csrfSessionCookieName] ?? "",
  cookieName: csrfTokenCookieName,
  cookieOptions: csrfCookieOptions,
  getCsrfTokenFromRequest: (req) => req.get("x-csrf-token"),
});
