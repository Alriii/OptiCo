import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ENV } from "@/config/env";
import { AppError, failure } from "@/lib/http";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

type PostgresError = { code?: string; detail?: string; constraint?: string };

function postgresMessage(code: string | undefined): { status: number; message: string } | null {
  switch (code) {
    case "23P01":
      return { status: 409, message: "That slot was just taken. Please choose another time." };
    case "23505":
      return { status: 409, message: "That record already exists" };
    case "23503":
      return { status: 400, message: "A related record is missing" };
    case "22P02":
    case "22007":
      return { status: 400, message: "Invalid input format" };
    default:
      return null;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  return failure(res, 404, `Cannot ${req.method} ${req.path}`);
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = getRequestId();

  if (err instanceof ZodError) {
    return failure(
      res,
      400,
      "Validation failed",
      err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  }

  if (err instanceof AppError) {
    return failure(res, err.statusCode, err.message, err.errors);
  }

  const bodyError = err as { type?: string; status?: number; message?: string };
  if (bodyError?.type === "entity.too.large") {
    return failure(res, 413, "Request body is too large");
  }
  if (bodyError?.type === "entity.parse.failed") {
    return failure(res, 400, "Request body must be valid JSON");
  }

  const pg = postgresMessage((err as PostgresError)?.code);
  if (pg) {
    logger.warn("database_constraint_error", {
      requestId,
      path: req.path,
      constraint: (err as PostgresError).constraint,
    });
    return failure(res, pg.status, pg.message);
  }

  const statusCode = typeof bodyError?.status === "number" && bodyError.status < 500 ? bodyError.status : 500;
  logger.error("unhandled_error", {
    requestId,
    path: req.path,
    method: req.method,
    message: err instanceof Error ? err.message : "unknown",
    stack: ENV.IS_PRODUCTION ? undefined : err instanceof Error ? err.stack : undefined,
  });

  const message =
    ENV.IS_PRODUCTION || statusCode >= 500 ? "Internal server error" : (err instanceof Error ? err.message : "Request failed");
  return failure(res, statusCode, message);
}
