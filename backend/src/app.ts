import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import hpp from "hpp";
import { ENV } from "@/config/env";
import routes from "@/routes";
import { CsrfMiddleware } from "@/middlewares/csrf-middleware";
import { requestIdMiddleware } from "@/middlewares/request-id-middleware";
import { requestLoggerMiddleware } from "@/middlewares/request-logger-middleware";
import { errorHandler, notFoundHandler } from "@/middlewares/error-handler";

const app = express();
const csrf = new CsrfMiddleware();

// Render terminates TLS upstream; one proxy hop is trusted for client IPs.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const clean = origin.replace(/\/$/, "");
      if (
        ENV.FRONTEND_ORIGINS.includes(clean) ||
        /^https:\/\/opti-co(-[a-z0-9-]+)?\.vercel\.app$/.test(clean) ||
        (!ENV.IS_PRODUCTION && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(clean))
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token", "x-request-id"],
    exposedHeaders: ["x-request-id"],
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(cookieParser());
app.use(hpp());
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);

// All unsafe requests pass through CSRF before reaching a route.
app.use(csrf.execute);

// Root status endpoint for browser checks and platform uptime monitors.
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    service: "OptiCo API",
    version: "1.0.0",
    message: "OptiCo Optical Clinic API is live and operational",
    endpoints: {
      health: "/api/v1/health/live",
      ready: "/api/v1/health/ready",
      services: "/api/v1/public/services",
    },
  });
});

// Keep the old monitor path working without exposing any environment detail.
app.get("/api/health", (_req, res) => res.redirect(308, "/api/v1/health/live"));

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
