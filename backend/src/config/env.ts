import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  APP_NAME: z.string().min(1).default("OptiCo API"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(7000),
  FRONTEND_URL: z.url().default("http://localhost:3000"),
  FRONTEND_ORIGINS: z.string().optional(),
  BACKEND_URL: z.url().default("http://localhost:7000"),
  DATABASE_URL: z.string().min(1).optional(),
  MIGRATION_DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
  CSRF_SECRET: z.string().min(32, "CSRF_SECRET must be at least 32 characters").optional(),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanFromString.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_NAME: z.string().default("OptiCo"),
  SMTP_FROM_EMAIL: z.email().optional(),
  APP_PUBLIC_URL: z.url().default("http://localhost:3000"),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Print field names only; never echo values that may contain secrets.
  const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Invalid environment configuration: ${fields}`);
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === "production";

const missing: string[] = [];
if (isProduction && !raw.DATABASE_URL) missing.push("DATABASE_URL");
if (!raw.JWT_SECRET) missing.push("JWT_SECRET");
if (!raw.CSRF_SECRET) missing.push("CSRF_SECRET");

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

if (isProduction) {
  if (raw.JWT_SECRET === raw.CSRF_SECRET) {
    throw new Error("JWT_SECRET and CSRF_SECRET must be different values");
  }
  if (raw.FRONTEND_ORIGINS?.includes("*")) {
    throw new Error("FRONTEND_ORIGINS must be an explicit allowlist");
  }
}

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:4173",
  "https://opti-co.vercel.app",
];

const configuredOrigins = (raw.FRONTEND_ORIGINS ?? raw.FRONTEND_URL)
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const frontendOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

export const ENV = {
  ...raw,
  JWT_SECRET: raw.JWT_SECRET as string,
  CSRF_SECRET: raw.CSRF_SECRET as string,
  IS_PRODUCTION: isProduction,
  IS_TEST: raw.NODE_ENV === "test",
  FRONTEND_ORIGINS: frontendOrigins,
  ACCESS_TOKEN_TTL_SECONDS: raw.ACCESS_TOKEN_TTL_MINUTES * 60,
  REFRESH_TOKEN_TTL_SECONDS: raw.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
};

export type AppEnv = typeof ENV;
