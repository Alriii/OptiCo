import app from "@/app";
import { ENV } from "@/config/env";
import { closePool } from "@/db";
import { logger } from "@/lib/logger";
import { startEmailWorker, stopEmailWorker } from "@/services/notifications/email-worker";

const server = app.listen(ENV.PORT, "0.0.0.0", () => {
  logger.info("server_started", { port: ENV.PORT, env: ENV.NODE_ENV });
});

if (!ENV.IS_TEST) {
  startEmailWorker();
}

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("shutdown_started", { signal });

  const forceExit = setTimeout(() => {
    logger.error("shutdown_forced");
    process.exit(1);
  }, 15_000);
  forceExit.unref();

  server.close(async () => {
    try {
      await stopEmailWorker();
      await closePool();
      logger.info("shutdown_complete");
      process.exit(0);
    } catch (error) {
      logger.error("shutdown_failed", { message: error instanceof Error ? error.message : "unknown" });
      process.exit(1);
    }
  });
}

server.on("error", (error) => {
  logger.error("server_error", { message: error.message });
  process.exit(1);
});

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
