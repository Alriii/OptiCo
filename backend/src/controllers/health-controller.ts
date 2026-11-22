import type { Request, Response } from "express";
import { checkDatabase } from "@/db";
import { success, failure } from "@/lib/http";

export class HealthController {
  public live = (_req: Request, res: Response) => {
    return success(res, { status: "live", uptimeSeconds: Math.round(process.uptime()) });
  };

  public ready = async (_req: Request, res: Response) => {
    try {
      await checkDatabase();
      return success(res, { status: "ready", database: "up" });
    } catch {
      // Do not leak connection details.
      return failure(res, 503, "Database is not ready");
    }
  };
}
