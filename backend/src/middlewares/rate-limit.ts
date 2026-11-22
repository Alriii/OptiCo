import { rateLimit } from "express-rate-limit";
import { failure } from "@/lib/http";
import { ENV } from "@/config/env";

// In-memory store is fine for one Render instance. Use a shared store before scaling out.
function limiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit: ENV.IS_PRODUCTION ? limit : limit * 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => failure(res, 429, "Too many requests. Please try again later."),
  });
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const authRateLimit = limiter(15 * MINUTE, 10);
export const refreshRateLimit = limiter(15 * MINUTE, 60);
export const csrfRateLimit = limiter(15 * MINUTE, 60);
export const publicBookingRateLimit = limiter(HOUR, 20);
export const guestExchangeRateLimit = limiter(HOUR, 20);
export const availabilityRateLimit = limiter(MINUTE, 120);
export const emailTriggerRateLimit = limiter(HOUR, 10);
