import { test, expect, type Page, type BrowserContext, type Locator } from "@playwright/test";
import { en } from "@edulink/i18n/en";
import { API, contextFor, dismissDevOverlay, settle, tokenFor } from "./actors";

/**
 * The outbox on the web target, which keeps it in memory with the same
 * flush logic as the phone (src/lib/outbox.ts, outbox-runner.ts).
 *
 * The write is the marks grid: the ZZ teacher's paper "ZZ E2E Unit Test" in
 * ZZ Grade 10 · A, unmarked, one mark entered for the first pupil and the
 * sheet saved — POST /api/v1/marks, a ZZ-fixture write. Every test ends by
 * saving that pupil blank again, which the API treats as "clear the mark"
 * (saveMarks deletes the grade), so the fixture is left as it was found.
 *
 * Two ways of being offline, because they differ on this target:
 *
 *  1. The transport is cut at the network layer (page.route aborts every
 *     API request) while the browser still believes it is online. That is
 *     the phone's situation — React Query's onlineManager is never wired on
 *     native, so a write always runs, fails, and reaches writeOrQueue. The
 *     queued item is shown, and context.setOffline(true → false) is the
 *     reconnect signal that flushes it with the X-Edulink-Replay header.
 *
 *  2. The browser itself is offline (context.setOffline(true)), so
 *     navigator.onLine is false. React Query's default networkMode "online"
 *     then PAUSES the save mutation instead of running it: nothing reaches
 *     the outbox, no badge shows, and on reconnect the paused mutation posts
 *     directly. It did exactly that when this spec was first run; since
 *     src/lib/query.ts gives mutations networkMode "always" (Phase 5) the
 *     save reaches the outbox and this test passes.
 */
const token = tokenFor("TEACHER");
const CLASS = /^ZZ Grade 10 · A/;
const PAPER = /ZZ E2E Unit Test/;
const MARK = "5";

test.skip(!token, "EDULINK_TOKEN_TEACHER is not set");

/**
 * Uncaught errors the screen throws, collected so the test can name them.
 * Expo's dev overlay that follows one would swallow every tap, so it is
 * removed before each; the error itself is still reported at the end.
 */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function tap(page: Page, target: Locator) {
  await dismissDevOverlay(page);
  await target.click();
}

/** Open the ZZ paper's sheet and hand back the first pupil's box. */
async function openSheet(page: Page) {
  await page.goto("/marks", { waitUntil: "networkidle" });
  await settle(page);
  await tap(page, page.getByRole("button", { name: CLASS }));
  await tap(page, page.getByRole("radio", { name: PAPER }));
  await settle(page);
  const boxes = page.getByRole("textbox");
  await expect(boxes.first()).toBeVisible();
  return boxes.first();
}

const isMarksPost = (r: { url(): string; method(): string }) => r.url() === `${API}/api/v1/marks` && r.method() === "POST";

/** Save the first pupil blank so the ZZ paper is unmarked again, and prove it. */
async function restore(page: Page, context: BrowserContext) {
  await context.setOffline(false);
  await page.unroute("**/api/**");
  const first = page.getByRole("textbox").first();
  await first.fill("");
  const saved = page.waitForResponse((r) => isMarksPost(r.request()));
  await tap(page, page.getByRole("button", { name: en.exams.saveMarks }));
  expect((await saved).status(), "restoring the blank mark").toBe(200);
  await expect(page.getByText(en.exams.savedNote)).toBeVisible();
  await settle(page);
  await expect(first).toHaveValue("");
}

test("the marks screen opens without an uncaught error", async ({ browser }) => {
  const context = await contextFor(browser, token!, { theme: "light", locale: "en" });
  const page = await context.newPage();
  const errors = watchErrors(page);
  await openSheet(page);
  // A native-only call reaching the web target lands here (the dev overlay
  // it raises would otherwise swallow every tap on the grid).
  expect(errors, "the marks screen threw on the web target").toEqual([]);
  await context.close();
});

test("a save with the network cut is kept on the device, shown as waiting, and replayed on reconnect", async ({ browser }) => {
  const context = await contextFor(browser, token!, { theme: "light", locale: "en" });
  const page = await context.newPage();
  try {
    const first = await openSheet(page);
    await expect(first).toHaveValue("");

    // The network goes away under the app's feet: every API call fails the
    // way a phone's does in a lift, while the browser still says it is online.
    let cut = 0;
    await page.route("**/api/**", (route) => {
      cut++;
      return route.abort("internetdisconnected");
    });
    await first.fill(MARK);
    await tap(page, page.getByRole("button", { name: en.exams.saveMarks }));

    // Saved on the device: the screen says so, and the outbox badge counts it
    // (twice — the screen's badge and the sheet's own, both from countQueued).
    await expect(page.getByText(en.common.queuedOffline)).toBeVisible();
    await expect(page.getByText(en.shell.outboxOne).first()).toBeVisible();
    expect(cut, "the save actually went to the network and was cut").toBeGreaterThan(0);

    // Back: the outbox runner listens to onlineManager, which follows the
    // browser's offline → online transition; the replay carries its header.
    await page.unroute("**/api/**");
    const replayed = page.waitForRequest((r) => isMarksPost(r) && r.headers()["x-edulink-replay"] === "1");
    const answered = page.waitForResponse((r) => isMarksPost(r.request()));
    await context.setOffline(true);
    await context.setOffline(false);
    const request = await replayed;
    expect(JSON.parse(request.postData() ?? "{}")).toMatchObject({ entries: expect.arrayContaining([expect.objectContaining({ marks: Number(MARK) })]) });
    expect((await answered).status()).toBe(200);
    await expect(page.getByText(en.shell.outboxOne)).toHaveCount(0);
  } finally {
    await restore(page, context);
    await context.close();
  }
});

test("browser offline: the save reaches the outbox instead of pausing", async ({ browser }) => {
  const context = await contextFor(browser, token!, { theme: "light", locale: "en" });
  const page = await context.newPage();
  try {
    const first = await openSheet(page);
    await expect(first).toHaveValue("");

    await context.setOffline(true);
    await first.fill(MARK);
    await tap(page, page.getByRole("button", { name: en.exams.saveMarks }));
    await expect(page.getByText(en.common.queuedOffline)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(en.shell.outboxOne).first()).toBeVisible();

    const replayed = page.waitForRequest((r) => isMarksPost(r) && r.headers()["x-edulink-replay"] === "1");
    await context.setOffline(false);
    expect((await (await replayed).response())?.status()).toBe(200);
    await expect(page.getByText(en.shell.outboxOne)).toHaveCount(0);
  } finally {
    // Whatever happened above — queued, paused and posted on reconnect, or
    // nothing — the pupil goes back to blank.
    await restore(page, context);
    await context.close();
  }
});
