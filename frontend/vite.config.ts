import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.BACKEND_INTERNAL_URL || process.env.BACKEND_INTERNAL_URL || "http://localhost:7000";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
        "next/link": path.resolve(__dirname, "./lib/next-link-shim.tsx"),
        "next/navigation": path.resolve(__dirname, "./lib/next-navigation-shim.ts"),
      },
    },
    server: {
      port: 3001,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3001,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
      },
    },
  };
});
