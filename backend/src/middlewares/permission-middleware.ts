import type { NextFunction, Request, Response } from "express";
import { failure } from "@/lib/http";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";

export class PermissionMiddleware {
  public require = (...permissions: Permission[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as AuthenticatedRequest).user;
      if (!user) return failure(res, 401, "Authentication required");
      if (user.status !== "ACTIVE") return failure(res, 403, "This account is not active");

      const allowed = permissions.every((permission) => hasPermission(user.role, permission));
      if (!allowed) return failure(res, 403, "You are not authorized to perform this action");
      return next();
    };
  };
}
