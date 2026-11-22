import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ENV } from "@/config/env";
import { logger } from "@/lib/logger";
import * as schema from "./schema";

// A single bounded pool for the whole process; never create one per request.
export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (error) => {
  logger.error("db_pool_error", { message: error.message });
});

export const db = drizzle({ client: pool, schema });

// Drizzle transactions expose the same query builder as the root client.
export type DbClient = any;

export async function checkDatabase(): Promise<boolean> {
  await pool.query("SELECT 1");
  return true;
}

export async function closePool(): Promise<void> {
  await pool.end();
}
