import { defineConfig } from "@playwright/test";

/**
 * The viewport matrix and the accessibility gate, against a running server.
 *
 * Not a webServer block on purpose: locally the dev server is already up on
 * :3000, and in CI the web-e2e job starts `next start` first and points BASE
 * at it. Sessions come from e2e/global-setup.ts, which mints them straight in
 * the database the way the sweep does — no passwords are typed anywhere.
 *
 * Screenshots are compared only where a baseline exists for this platform;
 * the first run on a new platform writes them (see e2e/README.md).
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // The harness's exam and its sessions, removed after the run (QA-73).
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  /**
   * ONE WORKER. With two, a file ran beside another, and two of the files
   * change what their actor reads: the viewport matrix sets the admin's and
   * the teacher's language to Hindi for half its cells, and the record's
   * sets the guardian's. A test in another file that signed in as the same
   * admin meanwhile was drawn in Hindi and failed on an English word
   * (2026-09-30, seven failures in one run and none in the next). The
   * accounts are the fixture's and there is one of each, so the files take
   * turns.
   */
  workers: 1,
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
  /**
   * Two projects, both Chromium, cut by file: `axe` is the accessibility walk
   * alone (354 pages, about 21 minutes on CI), `pages` is every other spec —
   * the viewport matrix, the record, the flows, the editors. CI runs them as
   * two parallel jobs (`--project axe`, `--project pages`); a bare
   * `npx playwright test` still runs everything, one worker, as before. The
   * screenshot path has no project name in it, so the baselines did not move.
   */
  projects: [
    // fullyParallel on the walk alone: Playwright shards a file-serial project by FILE, and the walk is one file,
    // so `--shard 2/2` of it ran nothing on CI run 41415675038 (2 November 2026) while 1/2 took the whole walk.
    // Each page is its own test and the order never mattered; one worker still runs them one at a time.
    { name: "axe", testMatch: /axe\.spec\.ts$/, fullyParallel: true, use: { browserName: "chromium" } },
    { name: "pages", testIgnore: /axe\.spec\.ts$/, use: { browserName: "chromium" } },
  ],
});
