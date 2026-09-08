import { defineConfig } from "@playwright/test";

/**
 * The phone app's browser battery, against its web target.
 *
 * No webServer block on purpose, the same as the web's config: locally
 * `expo start --web` is already up on :8081 and the API on :3000; in CI the
 * sweep job starts both and points BASE and API at them. Sessions are bearer
 * tokens from the environment (EDULINK_TOKEN_TEACHER, _PARENT, _STUDENT),
 * minted by the web's `npm run zz:token -- TEACHER` on the ZZ fixture — no
 * password is typed anywhere, and a role without a token is skipped aloud.
 *
 * Nothing here touches Prisma or the database: the app is exercised exactly
 * as a person would exercise it, through the screen and the API.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]] : [["list"]],
  outputDir: "e2e/results",
  use: {
    baseURL: process.env.BASE ?? "http://localhost:8081",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
