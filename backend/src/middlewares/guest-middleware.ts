import type { NextFunction, Request, Response } from "express";
import { failure } from "@/lib/http";
import { verifyGuestToken } from "@/lib/jwt";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";

export const GUEST_COOKIE = "guestToken";

export function guestMiddleware(req: Request, res: Response, next: NextFunction) {
  const payload = verifyGuestToken(req.cookies?.[GUEST_COOKIE] as string | undefined);
  if (!payload) return failure(res, 401, "This guest link session is invalid or has expired");
  (req as AuthenticatedRequest).guestAppointmentId = payload.appointmentId;
  return next();
}
