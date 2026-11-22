import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { runWithContext } from "@/lib/request-context";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.get("x-request-id");
  const requestId = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  res.setHeader("x-request-id", requestId);
  runWithContext({ requestId }, () => next());
}
