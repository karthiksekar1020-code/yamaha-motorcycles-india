import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const root = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": root("./") } },
  test: { environment: "jsdom", include: ["tests/unit/**/*.test.{ts,tsx}"], setupFiles: ["tests/setup.ts"] },
});
