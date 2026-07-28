import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the "@/*" path alias in tsconfig.json.
      "@": resolve(__dirname, "./src"),
      // Both of these only work inside a Next request/RSC context. Stubbing
      // them lets the real business logic be tested directly, rather than
      // testing a mock of it. (§13 "tests that mirror the implementation")
      "server-only": resolve(__dirname, "./tests/stubs/server-only.ts"),
      "next/headers": resolve(__dirname, "./tests/stubs/next-headers.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "tests/**/*.test.ts"],
    // Prisma-backed integration tests share one SQLite file, so they must not
    // run concurrently against each other.
    fileParallelism: false,
    setupFiles: ["tests/setup.ts"],
  },
});
