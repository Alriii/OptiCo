import type { NextFunction, Request, Response } from "express";
import { setContextActor } from "@/lib/request-context";
import { verifyAccessToken } from "@/lib/jwt";
import { failure } from "@/lib/http";
import { UserRepository } from "@/repositories/user-repository";
import { toSessionUser, type SessionUser } from "@/services/auth/types";

export type AuthenticatedRequest = Request & {
  user?: SessionUser;
  authMethod?: "bearer" | "cookie";
  guestAppointmentId?: string;
};

const userRepository = new UserRepository();

function extractBearerToken(header?: string) {
  if (!header) return undefined;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return undefined;
  return token.trim();
}

export class AuthMiddleware {
  public execute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const bearer = extractBearerToken(req.headers.authorization);
      const token = bearer ?? (req.cookies?.accessToken as string | undefined);
      const authMethod = bearer ? "bearer" : "cookie";

      if (!token) return failure(res, 401, "Authentication required");

      const payload = verifyAccessToken(token);
      if (!payload) return failure(res, 401, "Invalid or expired session");

      // Authorization always uses current database state, never the token role alone.
      const user = await userRepository.findById(payload.sub);
      if (!user) return failure(res, 401, "Invalid or expired session");
      if (user.status !== "ACTIVE") return failure(res, 403, "This account is not active");

      authReq.user = toSessionUser(user);
      authReq.authMethod = authMethod;
      setContextActor(user.id, "USER");
      return next();
    } catch (error) {
      return next(error);
    }
  };

  /** Populates the user when present but lets anonymous requests continue. */
  public optional = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const bearer = extractBearerToken(req.headers.authorization);
      const token = bearer ?? (req.cookies?.accessToken as string | undefined);
      if (!token) return next();

      const payload = verifyAccessToken(token);
      if (!payload) return next();

      const user = await userRepository.findById(payload.sub);
      if (user?.status === "ACTIVE") {
        authReq.user = toSessionUser(user);
        authReq.authMethod = bearer ? "bearer" : "cookie";
        setContextActor(user.id, "USER");
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
