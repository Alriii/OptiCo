import type { Request, Response } from "express";

export class AppError extends Error {
  readonly statusCode: number;
  readonly errors?: unknown[];

  constructor(statusCode: number, message: string, errors?: unknown[]) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export type SuccessEnvelope<T> = {
  status: "success";
  message?: string;
  data: T;
};

export type ErrorEnvelope = {
  status: "error";
  message: string;
  code: number;
  errors?: unknown[];
};

export function success<T>(res: Response, data: T, message?: string, statusCode = 200) {
  const body: SuccessEnvelope<T> = { status: "success", data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}

export function failure(res: Response, statusCode: number, message: string, errors?: unknown[]) {
  const body: ErrorEnvelope = { status: "error", message, code: statusCode };
  if (errors && errors.length > 0) body.errors = errors;
  return res.status(statusCode).json(body);
}

export function assert(condition: unknown, statusCode: number, message: string): asserts condition {
  if (!condition) throw new AppError(statusCode, message);
}

/** Express 5 types route params as string | string[]; controllers always want one value. */
export function routeParam(req: Request, name: string): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
