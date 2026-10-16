import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: frontendRoot,
  base: "./",
  plugins: [react(), tailwindcss()],
  html: {
    cspNonce: process.env.DESKTOP_CSP_NONCE || undefined,
  },
  resolve: {
    alias: {
      "@": path.resolve(frontendRoot, "src"),
    },
  },
  server: {
    host: process.env.HOST || true,
    port: 3000,
    strictPort: true,
    headers: {
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  },
  build: {
    outDir: "dist",
  },
  test: {
    browser: {
      enabled: true,
      headless: true, // Zorgt ervoor dat er geen browserinterface opent
      provider: playwright(),
      instances: [
        { browser: "chromium" },
      ],
    },
  },
});