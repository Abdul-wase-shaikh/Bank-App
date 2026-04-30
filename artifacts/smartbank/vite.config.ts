import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig(({ command }) => {
  const rawPort = process.env.PORT;
  let port: number | undefined;
  if (command === "serve") {
    if (!rawPort) {
      throw new Error("PORT environment variable is required but was not provided.");
    }
    const parsed = Number(rawPort);
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error(`Invalid PORT value: "${rawPort}"`);
    }
    port = parsed;
  }

  return {
  base: basePath,
  server: {
    host: "0.0.0.0",
    port,
    strictPort: true,
    allowedHosts: true,
    hmr: { overlay: false },
  },
  preview: {
    host: "0.0.0.0",
    port,
    allowedHosts: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
    ],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  };
});
