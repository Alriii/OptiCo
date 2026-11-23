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

function isOriginAllowed(origin: string): boolean {
  const cleanOrigin = origin.replace(/\/$/, "");
  if (ENV.FRONTEND_ORIGINS.includes(cleanOrigin)) return true;
  if (/^https:\/\/opti-co(-[a-z0-9-]+)?\.vercel\.app$/.test(cleanOrigin)) return true;
  if (!ENV.IS_PRODUCTION && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) return true;
  return false;
}

function originAllowed(req: Request): boolean {
  const origin = req.get("origin");
  if (origin) {
    return isOriginAllowed(origin);
  }

  const referer = req.get("referer");
  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      return isOriginAllowed(refererOrigin);
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
