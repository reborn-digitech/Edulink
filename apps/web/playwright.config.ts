import { defineConfig } from "@playwright/test";

/**
 * The viewport matrix and the accessibility gate, against a running server.
 *
 * Not a webServer block on purpose: locally the dev server is already up on
 * :3000, and in CI the sweep job starts `next start` first and points BASE at
 * it. Sessions come from e2e/global-setup.ts, which mints them straight in
 * the database the way the sweep does — no passwords are typed anywhere.
 *
 * Screenshots are compared only where a baseline exists for this platform;
 * the first run on a new platform writes them (see e2e/README.md).
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]] : [["list"]],
  outputDir: "e2e/results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{platform}/{testFilePath}/{arg}{ext}",
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: "disabled" } },
  use: {
    baseURL: process.env.BASE ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
