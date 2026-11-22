import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Migrations prefer the direct Neon connection; the pooled runtime URL is a local fallback.
const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: url ? { url } : undefined,
  strict: true,
  verbose: true,
});
