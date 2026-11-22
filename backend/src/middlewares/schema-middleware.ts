import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import { failure } from "@/lib/http";

export class SchemaMiddleware {
  public validate = (schema: ZodType) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parsed = (await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        })) as { body?: unknown; query?: unknown; params?: unknown };

        // Assign parsed values so unknown keys never reach controllers.
        req.body = parsed.body ?? {};
        if (parsed.params) req.params = parsed.params as Request["params"];
        if (parsed.query) {
          Object.defineProperty(req, "query", {
            value: parsed.query,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
        return next();
      } catch (error) {
        if (error instanceof ZodError) {
          return failure(
            res,
            400,
            "Validation failed",
            error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
          );
        }
        return next(error);
      }
    };
  };
}
