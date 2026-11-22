import type { Request, Response } from "express";
import { success } from "@/lib/http";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth-cookies";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import {
  acceptInviteService,
  getCsrfTokenService,
  getUserSessionService,
  loginService,
  logoutService,
  refreshTokenService,
  signupService,
} from "@/services/auth";

export class AuthController {
  public getCsrfToken = (req: Request, res: Response) => {
    const result = getCsrfTokenService(req, res);
    return success(res, result);
  };

  public signup = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const result = await signupService({ name, email, password });
    setAuthCookies(res, result.tokens);
    return success(res, { user: result.user }, "Account created", 201);
  };

  public login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await loginService({ email, password });
    setAuthCookies(res, result.tokens);
    return success(res, { user: result.user }, "Signed in");
  };

  public refresh = async (req: Request, res: Response) => {
    const rawToken = (req.body?.refreshToken as string | undefined) ?? (req.cookies?.refreshToken as string | undefined);
    const result = await refreshTokenService(rawToken);
    setAuthCookies(res, result.tokens);
    return success(res, { user: result.user }, "Session refreshed");
  };

  public logout = async (req: Request, res: Response) => {
    const rawToken = (req.body?.refreshToken as string | undefined) ?? (req.cookies?.refreshToken as string | undefined);
    await logoutService(rawToken);
    clearAuthCookies(res);
    return success(res, { loggedOut: true }, "Signed out");
  };

  public session = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const result = await getUserSessionService(user.id);
    return success(res, result);
  };

  public acceptInvite = async (req: Request, res: Response) => {
    const { token, password } = req.body;
    const result = await acceptInviteService({ token, password });
    setAuthCookies(res, result.tokens);
    return success(res, { user: result.user }, "Invitation accepted");
  };
}
