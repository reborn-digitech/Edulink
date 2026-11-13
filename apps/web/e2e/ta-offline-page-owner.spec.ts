import { test, expect, type APIRequestContext, type APIResponse, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { sessions, VIEWPORTS } from "./actors";

/**
 * TA-215, in a browser: the offline fallback document, built for whoever
 * the worker's install request was for, deletes the queued writes and the
 * page cache of the person it is shown to (testing analysis of 13 November
 * 2026; the unit chain is tests/ta-offline-page-owner.test.ts).
 *
 * THE WORKER'S PART IS PLAYED BY THIS SPEC, because a development server has
 * no worker (next.config.ts: `disable: process.env.NODE_ENV === "development"`)
 * and the finding's own test needs a production build. What the worker does
 * is two things, both read from src/sw.ts and next.config.ts and done here by
 * hand:
 *
 *   - at install it fetches /offline once and keeps the answer. Here: /offline
 *     is fetched from outside the browser, once with no session (an install
 *     from the login page) and once with the teacher's (the control);
 *   - offline, it answers a navigation it has no copy of with that kept
 *     answer, and build files and the dictionary from its caches. Here: with
 *     the browser offline, the navigation to a page never opened is answered
 *     with the kept document, scripts, styles, pictures and the dictionary
 *     are handed over from outside the browser, and every other request
 *     fails as it does with no network.
 *
 * Everything else is the app's own: the teacher's session (minted by the
 * harness), her marks sheet, the form that puts the sheet in the outbox when
 * the device is offline, the document the server built for /offline, React
 * bringing that document to life, and the outbox in the browser's IndexedDB.
 *
 * NOTHING IS WRITTEN. The sheet is saved only while the browser is offline,
 * every request that is not a GET is refused in the browser from the first
 * page on, and the context (with its IndexedDB) is thrown away at the end.
 *
 * No real worker is allowed to register in this spec's browser (see
 * `teacherContext`), so the worker's part is played here on any server. It has
 * been run against the development server only; the run the finding asks for,
 * a real worker installed from the login page of a production build, is still
 * to be made.
 */
const teacher = sessions().TEACHER!;
/** A page of hers this browser has never opened. */
const NEVER_OPENED = "/teacher/timetable";

type Outbox = { rows: { url: string; tag: string; owner: string | null }[]; owner: string | null; pageCache: boolean };

/**
 * The teacher's browser, as actors.ts `contextFor` makes it (the minted session under both cookie names, English, phone
 * width, the event stream refused), with one difference: no service worker may register. On a development server there
 * is none to register; on a production build this keeps every request the page's own, so the routes below see them all.
 */
async function teacherContext(browser: Browser, baseURL: string): Promise<BrowserContext> {
  const url = new URL(baseURL);
  const [name, value] = teacher.cookie.split("=") as [string, string];
  const context = await browser.newContext({ viewport: VIEWPORTS.iphone, colorScheme: "light", locale: "en-IN", reducedMotion: "reduce", isMobile: true, hasTouch: true, serviceWorkers: "block" });
  await context.addCookies([
    { name, value, domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "edulink_locale", value: "en", domain: url.hostname, path: "/", sameSite: "Lax" },
    { name: `__Host-${name}`, value, domain: url.hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" },
  ]);
  await context.route("**/api/v1/events", (route) => route.abort("connectionrefused"));
  return context;
}

/** The outbox as it lies in this browser: db "edulink", stores "outbox" and "meta" (src/lib/offline-queue.ts), and the worker's page cache. */
function outboxOf(page: Page): Promise<Outbox> {
  return page.evaluate(
    () =>
      new Promise<Outbox>((resolve, reject) => {
        const open = indexedDB.open("edulink");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          if (!database.objectStoreNames.contains("outbox") || !database.objectStoreNames.contains("meta")) {
            database.close();
            void caches.has("edulink-pages").then((pageCache) => resolve({ rows: [], owner: null, pageCache }));
            return;
          }
          const tx = database.transaction(["outbox", "meta"], "readonly");
          const rows = tx.objectStore("outbox").getAll();
          const owner = tx.objectStore("meta").get("owner");
          tx.oncomplete = () => {
            database.close();
            void caches.has("edulink-pages").then((pageCache) =>
              resolve({
                rows: (rows.result as { url: string; tag: string; owner: string | null; createdAt: number }[]).sort((a, b) => a.createdAt - b.createdAt).map((row) => ({ url: row.url, tag: row.tag, owner: row.owner })),
                owner: (owner.result as string | null | undefined) ?? null,
                pageCache,
              }),
            );
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
}

/**
 * The teacher saves a marks sheet with no signal, then opens a page the
 * worker never cached and is shown the `kept` copy of /offline. Returns her
 * outbox as it stood before the fallback and as it stands after.
 */
async function shownTheFallback(browser: Browser, baseURL: string, outside: APIRequestContext, kept: APIResponse, label: string): Promise<{ her: string; before: Outbox; after: Outbox }> {
  const context = await teacherContext(browser, baseURL);
  const refused: string[] = [];
  await context.route("**/*", (route) => {
    const request = route.request();
    if (request.method() === "GET" || request.method() === "HEAD") return route.fallback();
    refused.push(`${request.method()} ${new URL(request.url()).pathname}`);
    return route.abort("internetdisconnected");
  });
  const page = await context.newPage();

  /* ---- she is signed in on this browser and opens her marks sheet ---- */
  expect((await page.goto(`/teacher/exams?slotId=${teacher.slotId}&classId=${teacher.classId}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("marks-save")).toBeVisible();
  // The runtime on her own page has said whose device this is.
  await expect.poll(async () => (await outboxOf(page)).owner, { timeout: 15_000 }).not.toBeNull();
  const her = (await outboxOf(page)).owner!;
  // And the worker keeps the pages she opens (its NetworkFirst page cache).
  await page.evaluate(async () => {
    const cache = await caches.open("edulink-pages");
    await cache.put("/teacher/exams", new Response("<!doctype html><title>the marks sheet, as she last saw it</title>", { headers: { "content-type": "text/html" } }));
  });

  /* ---- the signal goes; she types two marks and saves: the outbox takes the sheet ---- */
  await context.setOffline(true);
  const boxes = page.locator('input[id^="marks-"]');
  expect(await boxes.count()).toBeGreaterThanOrEqual(2);
  await boxes.nth(0).fill("41");
  await boxes.nth(1).fill("37");
  await page.getByTestId("marks-save").click();
  await expect.poll(async () => (await outboxOf(page)).rows.length, { timeout: 15_000 }).toBe(1);
  const before = await outboxOf(page);
  expect(before).toEqual({ rows: [{ url: "/api/v1/marks", tag: `marks:${teacher.classId}`, owner: her }], owner: her, pageCache: true });

  /* ---- she opens a page the worker never cached: the worker's answer, played ---- */
  let fallbackServed = 0;
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== "GET") return route.fallback(); // refused above
    // A navigation with no network and no cached copy: the precached /offline.
    if (request.isNavigationRequest()) {
      fallbackServed++;
      return route.fulfill({ response: kept });
    }
    // Build files are precached, the dictionary and pictures are in the worker's caches.
    const type = request.resourceType();
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/i18n/") || type === "script" || type === "stylesheet" || type === "font" || type === "image") {
      const response = await outside.get(request.url()).catch(() => null);
      return response ? route.fulfill({ response }) : route.abort("internetdisconnected");
    }
    // API reads and everything else are network only.
    return route.abort("internetdisconnected");
  });
  await page.goto(NEVER_OPENED, { waitUntil: "load" });
  expect(fallbackServed, "the navigation was answered with the kept /offline document").toBe(1);
  expect(new URL(page.url()).pathname).toBe(NEVER_OPENED);
  await expect(page.getByRole("heading", { level: 1, name: "You are offline" })).toBeVisible();
  // The document comes to life (React hydrates it from its own payload) and its effects run.
  const hydrated = await page
    .waitForFunction(() => Object.keys(document.querySelector("main#main") ?? {}).some((key) => key.startsWith("__reactFiber$")), null, { timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  expect(hydrated, "the fallback document's script came up").toBe(true);
  await page.waitForTimeout(2_000);
  // The page in front of her says her work is safe.
  await expect(page.getByText("Pages you have opened recently still work offline")).toBeVisible();

  const after = await outboxOf(page);
  console.log(`TA-215 (${label}): browser offline: ${!(await page.evaluate(() => navigator.onLine))}; before the fallback ${JSON.stringify(before)}; after it ${JSON.stringify(after)}; writes that tried to leave the browser: ${JSON.stringify(refused)}`);
  await context.close();
  return { her, before, after };
}

/** The runtime's props as the server wrote them into a document's payload. */
const runtimeProps = (html: string) => /\{\\"owner\\":[^}]*\}/.exec(html)?.[0].replace(/\\"/g, '"') ?? "(no owner prop found)";

test.describe("TA-215: the offline fallback shown to a teacher with an unsent marks sheet", () => {
  test.skip(!teacher.classId || !teacher.slotId, "the harness made no marks sheet for the teacher");

  test("control: a copy of /offline the worker kept while SHE was signed in leaves her outbox and her page cache alone", async ({ browser, baseURL, playwright }) => {
    const outside = await playwright.request.newContext({ baseURL });
    const install = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { cookie: teacher.cookie } });
    const kept = await install.get("/offline");
    expect(kept.status()).toBe(200);
    console.log(`TA-215 (control): the /offline document kept at an install made while she was signed in carries the runtime's props ${runtimeProps(await kept.text()).replace(/"owner":"[^"]+"/, '"owner":"<her id>"')}`);

    const { before, after } = await shownTheFallback(browser, baseURL!, outside, kept, "control");

    expect(after.rows).toEqual(before.rows);
    expect(after.pageCache).toBe(true);
    await install.dispose();
    await outside.dispose();
  });

  test("⚠ a copy of /offline the worker kept while NOBODY was signed in (an install from the login page) leaves them alone too", async ({ browser, baseURL, playwright }) => {
    const outside = await playwright.request.newContext({ baseURL });
    // The worker's install, from the login page: /offline fetched once, no session.
    const kept = await outside.get("/offline");
    expect(kept.status()).toBe(200);
    console.log(`TA-215: the /offline document kept at an install made signed out carries the runtime's props ${runtimeProps(await kept.text())}`);

    const { before, after } = await shownTheFallback(browser, baseURL!, outside, kept, "signed-out copy");

    expect.soft(after.rows, "her unsent marks sheet is gone from the outbox").toEqual(before.rows);
    expect.soft(after.pageCache, "the pages the worker kept for her (edulink-pages) were deleted").toBe(true);
    await outside.dispose();
  });
});
