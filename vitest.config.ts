import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const root = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": root("./"), "server-only": root("./tests/server-only-stub.ts") } },
  test: { environment: "jsdom", include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}", "tests/db/**/*.test.ts"], setupFiles: ["tests/setup.ts"] },
});
