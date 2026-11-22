import type { NextFunction, Request, Response } from "express";
import { ENV } from "@/config/env";
import { failure } from "@/lib/http";
import { verifyAccessToken } from "@/lib/jwt";
import { csrfSessionCookieName, validateRequest } from "@/lib/csrf";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function bearerToken(req: Request): string | undefined {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token.trim() : undefined;
}

function originAllowed(req: Request): boolean {
  const origin = req.get("origin");
  if (origin && !ENV.FRONTEND_ORIGINS.includes(origin.replace(/\/$/, ""))) return false;

  const referer = req.get("referer");
  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (!ENV.FRONTEND_ORIGINS.includes(refererOrigin)) return false;
    } catch {
      return false;
    }
  }

  return true;
}

export class CsrfMiddleware {
  /**
   * Cookie-authenticated mutations need the double-submit token. Verified Bearer
   * clients are exempt because the browser cannot attach the token automatically.
   */
  public execute = (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method)) return next();

    // A valid signed Bearer token is a non-browser client; CSRF does not apply.
    if (verifyAccessToken(bearerToken(req))) return next();

    if (!originAllowed(req)) return failure(res, 403, "Request origin is not allowed");

    const hasAuthCookie = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
    const hasCsrfSession = Boolean(req.cookies?.[csrfSessionCookieName]);
    if (!hasAuthCookie && !hasCsrfSession) return next();

    if (validateRequest(req)) return next();
    return failure(res, 403, "Invalid or missing CSRF token");
  };
}
