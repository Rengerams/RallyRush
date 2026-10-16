import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: frontendRoot,
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(frontendRoot, "src"),
    },
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    headers: {
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  },
  build: {
    outDir: "dist",
  },
});
