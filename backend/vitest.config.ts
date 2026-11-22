import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    restoreMocks: true,
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-jwt-secret-at-least-32-characters-long-12345678",
      CSRF_SECRET: "test-csrf-secret-at-least-32-characters-long-987654",
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/optico_test",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
