import { test, expect, type Page } from "@playwright/test";
import { contextFor, sessions } from "./actors";

/**
 * The dictionary travels as a cached static file, not inside every page
 * (campaign LOAD-4, 4 Oct 2026; src/lib/i18n/delivery.ts). Each test opens a
 * fresh context, so the file is fetched cold: the page must come alive from it
 * with no hydration error and no raw key, a client-side navigation must not
 * fetch it again, and the language switch must re-label the page with the
 * same words the server draws in that language. Nothing is saved: the
 * signed-out switch writes only the context's own cookie.
 */
const all = sessions();

/** A dictionary key on screen: a namespace, a dot, a camelCase name ("shell.skipToContent"). */
const RAW_KEY = /\b[a-z][a-zA-Z]+\.[a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*\b/;

function watchErrors(page: Page): string[] {
  const found: string[] = [];
  page.on("pageerror", (error) => found.push(error.message.slice(0, 200)));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|did not match|Update hook|i18n:/i.test(message.text())) found.push(message.text().slice(0, 200));
  });
  return found;
}

const hydrated = (page: Page, selector: string) =>
  page.waitForFunction((s) => {
    const el = document.querySelector(s);
    return !!el && Object.keys(el).some((k) => k.startsWith("__reactFiber"));
  }, selector);

test("signed out: /login carries no dictionary, comes alive from the file, and the switch re-labels it as the server would", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{ name: "edulink_locale", value: "en", url: baseURL! }]);
  const page = await context.newPage();
  const errors = watchErrors(page);
  const response = await page.goto("/login", { waitUntil: "networkidle" });
  const html = await response!.text();
  expect(html).not.toContain('\\"dictionary\\"');
  expect(html).toMatch(/<link rel="preload" href="\/i18n\/en\.[0-9a-f]{16}\.json" as="fetch" crossorigin="anonymous"\/>/);
  await hydrated(page, '[role="radiogroup"] button');
  expect(await page.locator("body").innerText()).not.toMatch(RAW_KEY);

  await page.getByRole("radio", { name: /हिन्दी/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  await expect(page.getByRole("radio", { name: /हिन्दी/ })).toHaveAttribute("aria-checked", "true");
  // The client's words are the server's: the same page fetched in Hindi labels the switch the same way.
  const server = await (await context.request.get("/login")).text();
  const label = server.match(/role="radiogroup" aria-label="([^"]+)"/)?.[1];
  expect(label).toBeTruthy();
  expect(label).not.toBe("Choose a language");
  await expect(page.getByRole("radiogroup")).toHaveAttribute("aria-label", label!);
  expect(await page.locator("body").innerText()).not.toMatch(RAW_KEY);
  expect(errors).toEqual([]);
  await context.close();
});

test("signed in: a home comes alive from the file, and the next page reuses it", async ({ browser, baseURL }) => {
  const actor = all.TEACHER!;
  const context = await contextFor(browser, actor.cookie, { viewport: { width: 1280, height: 900 }, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  const errors = watchErrors(page);
  const fetched: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/i18n/")) fetched.push(request.url());
  });
  const response = await page.goto("/teacher", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  expect(await response!.text()).not.toContain('\\"dictionary\\"');
  await hydrated(page, "main a[href], nav a[href]");
  expect(await page.locator("body").innerText()).not.toMatch(RAW_KEY);
  const before = fetched.length;
  expect(before).toBeGreaterThan(0);

  // A client-side navigation: the root layout is not rendered again, and the words are already in the tab.
  const link = page.locator('nav a[href^="/"]:not([href="/teacher"])').first();
  const target = await link.getAttribute("href");
  await link.click();
  await page.waitForURL((url) => url.pathname === target);
  await page.waitForLoadState("networkidle");
  expect(await page.locator("body").innerText()).not.toMatch(RAW_KEY);
  expect(fetched.length).toBe(before);
  expect(errors).toEqual([]);
  await context.close();
});
