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
    // Prisma-backed integration tests share ONE Postgres database, so they must
    // not run concurrently against each other. (It was one SQLite file when this
    // was written; the reason survived the move, the wording had not.)
    //
    // Worth knowing when a suite goes red intermittently: this makes the runs
    // sequential, NOT repeatable. Vitest still sequences files by their cached
    // duration from the last run, so the order reshuffles a little every time —
    // which reads like parallel contention and is not. See the fixture notes in
    // README.md before hunting a neighbouring suite for it.
    fileParallelism: false,
    setupFiles: ["tests/setup.ts"],
  },
});
