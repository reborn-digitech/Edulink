import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * The three-year school simulation runs under vitest ONLY so that the
 * `server-only` and `next/headers` stubs apply and the library can be driven
 * directly, exactly as the unit suite drives it. It is never part of the
 * ordinary suite: run it by hand with
 *
 *   npx vitest run --config scripts/sim/vitest.config.ts
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "../../src"),
      "server-only": resolve(__dirname, "../../tests/stubs/server-only.ts"),
      "next/headers": resolve(__dirname, "../../tests/stubs/next-headers.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["scripts/sim/**/*.sim.ts"],
    fileParallelism: false,
    setupFiles: ["tests/setup.ts"],
    testTimeout: 60 * 60 * 1000,
    hookTimeout: 60 * 60 * 1000,
  },
});
