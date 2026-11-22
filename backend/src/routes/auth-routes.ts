import { Router } from "express";
import { AuthController } from "@/controllers/auth-controller";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import { authRateLimit, csrfRateLimit, refreshRateLimit } from "@/middlewares/rate-limit";
import {
  acceptInviteSchema,
  loginSchema,
  refreshSchema,
  signupSchema,
} from "@/schema/auth-schema";

const router = Router();
const controller = new AuthController();
const auth = new AuthMiddleware();
const schema = new SchemaMiddleware();

router.get("/csrf-token", csrfRateLimit, controller.getCsrfToken);
router.post("/signup", authRateLimit, schema.validate(signupSchema), controller.signup);
router.post("/login", authRateLimit, schema.validate(loginSchema), controller.login);
router.post("/refresh", refreshRateLimit, schema.validate(refreshSchema), controller.refresh);
router.post("/logout", refreshRateLimit, controller.logout);
router.get("/session", auth.execute, controller.session);
router.post("/accept-invite", authRateLimit, schema.validate(acceptInviteSchema), controller.acceptInvite);

export default router;
