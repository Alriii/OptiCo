import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "lib/**/*.test.{ts,tsx}",
      "components/**/*.test.{ts,tsx}",
      "src/**/*.test.{ts,tsx}"
    ],
    exclude: ["node_modules/**", "dist/**"],
    css: false,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "next/link": path.resolve(__dirname, "./lib/next-link-shim.tsx"),
      "next/navigation": path.resolve(__dirname, "./lib/next-navigation-shim.ts"),
    },
  },
});
