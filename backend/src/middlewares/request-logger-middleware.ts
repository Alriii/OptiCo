import type { NextFunction, Request, Response } from "express";
import { getRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();
  res.on("finish", () => {
    // Log the path only: query strings can carry one-time guest tokens.
    logger.info("http_request", {
      requestId: getRequestId(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });
  next();
}
