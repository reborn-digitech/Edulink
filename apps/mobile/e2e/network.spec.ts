import { test, expect, type Page } from "@playwright/test";
import { en } from "@edulink/i18n/en";
import { contextFor, settle, tokenFor } from "./actors";

/**
 * A slow and lossy network: every /api/v1 response held back 2000 ms, and a
 * deterministic one in twenty requests dropped — the count decides, never a
 * random number, so a run that fails can be re-run to the same request.
 *
 * A cold load of the teacher's Today makes exactly two requests of its own,
 * in order: /api/v1/me (the session) and /api/v1/staff/today (the screen);
 * the tab bar's badge counts are let through uncounted. The tests
 * start the counter where the rule lands on the screen's own fetch, and
 * assert which URL was dropped, so a change in the app's request order
 * shows up as a failed assertion rather than a silently different test.
 */
const token = tokenFor("TEACHER");
const DELAY_MS = 2000;
const DROP_EVERY = 20;

test.skip(!token, "EDULINK_TOKEN_TEACHER is not set");

type Harsh = { dropped: string[]; passed: string[] };

/** The network under test: delay everything; drop request n when `drop(n)` says so. */
async function harshNetwork(page: Page, opts: { from?: number; drop: (n: number) => boolean }): Promise<Harsh> {
  const log: Harsh = { dropped: [], passed: [] };
  let n = opts.from ?? 0;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    // The bar's two badge counts (unread messages, unread notices) ride
    // along on every cold load; they are neither counted nor delayed here,
    // so the twentieth request stays the screen's own fetch.
    if (BADGES.has(path)) {
      await route.continue();
      return;
    }
    const index = ++n;
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    if (opts.drop(index)) {
      log.dropped.push(path);
      await route.abort("connectionreset");
      return;
    }
    log.passed.push(path);
    await route.continue();
  });
  return log;
}

const BADGES = new Set(["/api/v1/shared/inbox", "/api/v1/shared/notifications"]);
const everyTwentieth = (n: number) => n % DROP_EVERY === 0;

test("slow: Today still renders with every response 2 s late", async ({ browser }) => {
  const context = await contextFor(browser, token!, { theme: "light", locale: "en" });
  const page = await context.newPage();
  const net = await harshNetwork(page, { drop: everyTwentieth });
  const started = Date.now();
  await page.goto("/", { waitUntil: "commit" });

  // While the data is late the screen says it is loading, not nothing.
  await expect(page.getByRole("progressbar").first()).toBeVisible({ timeout: 15_000 });
  await settle(page, 40_000);

  await expect(page.getByRole("heading", { name: en.teacher.today })).toBeVisible();
  await expect(page.getByRole("heading", { name: en.teacher.yourLessons })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(net.dropped).toEqual([]);
  expect(net.passed).toEqual(["/api/v1/me", "/api/v1/staff/today"]);
  expect(Date.now() - started, "two sequential responses at 2 s each").toBeGreaterThanOrEqual(2 * DELAY_MS);
  await context.close();
});

test("lossy: the twentieth request — the Today fetch — is dropped, and the screen's one automatic retry carries it", async ({ browser }) => {
  const context = await contextFor(browser, token!, { theme: "light", locale: "en" });
  const page = await context.newPage();
  // Counter at 18: /me is the nineteenth request, /staff/today the twentieth.
  const net = await harshNetwork(page, { from: DROP_EVERY - 2, drop: everyTwentieth });
  await page.goto("/", { waitUntil: "commit" });
  await settle(page, 40_000);

  expect(net.dropped).toEqual(["/api/v1/staff/today"]);
  expect(net.passed).toEqual(["/api/v1/me", "/api/v1/staff/today"]);
  await expect(page.getByRole("heading", { name: en.teacher.yourLessons })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await context.close();
});

test("dropped twice: the screen shows Failed with a retry, and the retry succeeds", async ({ browser }) => {
  const context = await contextFor(browser, token!, { theme: "light", locale: "en" });
  const page = await context.newPage();
  // The twentieth request and its one automatic retry (the twenty-first)
  // both go: the screen has to say so, and hand the person a way back.
  const net = await harshNetwork(page, { from: DROP_EVERY - 2, drop: (n) => n === DROP_EVERY || n === DROP_EVERY + 1 });
  await page.goto("/", { waitUntil: "commit" });

  const failed = page.getByRole("alert");
  await expect(failed).toBeVisible({ timeout: 40_000 });
  expect(net.dropped).toEqual(["/api/v1/staff/today", "/api/v1/staff/today"]);
  const retry = page.getByRole("button", { name: en.common.retry });
  await expect(retry).toBeVisible();

  await retry.click();
  await settle(page, 40_000);
  await expect(page.getByRole("heading", { name: en.teacher.yourLessons })).toBeVisible();
  await expect(failed).toHaveCount(0);
  expect(net.passed).toEqual(["/api/v1/me", "/api/v1/staff/today"]);
  await context.close();
});
