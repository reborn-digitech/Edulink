import { test, expect, type Page } from "@playwright/test";
import { contextFor, sessions } from "./actors";

/**
 * THE FIRST HTML IS THE PAGE (campaign LOAD-12, 5 Oct 2026). A sign-in page
 * must be readable before a single script has run: the heading, the sentence
 * under it and the form are in the document the server sends, and nothing
 * hides them until hydration — no `hidden` toggled on mount, no opacity 0
 * lifted by an effect, no fallback-less Suspense segment parked in a
 * `<div hidden id="S:…">` until a client island resolves (the dictionary the
 * provider waits for, LOAD-4, must never blank the server's words).
 *
 * Each page is opened with JavaScript off, so what is checked is exactly what
 * the browser can paint from the HTML and the stylesheet. The same is checked
 * for a signed-in home (/parent), the page LOAD-12 compared /login with.
 */
const all = sessions();

/** Every reason an element in the DOM might not paint, read up its ancestors. */
async function whyNotPainted(page: Page, selector: string): Promise<string[]> {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return [`${s}: not in the document`];
    const reasons: string[] = [];
    const box = el.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) reasons.push(`${s}: zero size`);
    for (let node: Element | null = el; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      const name = `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}`;
      if (node.hasAttribute("hidden")) reasons.push(`${name}: hidden attribute`);
      if (style.display === "none") reasons.push(`${name}: display none`);
      if (style.visibility === "hidden") reasons.push(`${name}: visibility hidden`);
      if (Number(style.opacity) === 0) reasons.push(`${name}: opacity 0`);
      if (style.contentVisibility === "hidden") reasons.push(`${name}: content-visibility hidden`);
    }
    return reasons;
  }, selector);
}

/** The text sits in the server's shell, not in a streamed segment React would move in later. */
function inShell(html: string, text: string): boolean {
  const at = html.indexOf(text);
  const segment = html.search(/<div hidden id="S:\d+">/);
  return at >= 0 && (segment < 0 || at < segment);
}

test("signed out: /login paints its heading, sentence and form from the HTML alone", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  await context.addCookies([{ name: "edulink_locale", value: "en", url: baseURL! }]);
  const page = await context.newPage();
  const response = await page.goto("/login");
  expect(response?.status()).toBe(200);
  const html = await response!.text();

  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  const headingText = (await heading.innerText()).trim();
  expect(headingText.length).toBeGreaterThan(0);
  expect(inShell(html, headingText)).toBe(true);

  // The sentence under the heading: the element Lighthouse names as the page's largest paint.
  const sentence = page.locator("h1 + p");
  await expect(sentence).toBeVisible();
  expect((await sentence.innerText()).trim().length).toBeGreaterThan(10);

  const identifier = page.locator('input[autocomplete="username"]');
  const password = page.locator('input[type="password"]');
  const submit = page.locator('form button[type="submit"]');
  for (const field of [identifier, password, submit]) await expect(field).toBeVisible();
  await expect(page.getByRole("radiogroup")).toBeVisible();

  for (const selector of ["h1", "h1 + p", 'input[autocomplete="username"]', 'input[type="password"]', 'form button[type="submit"]']) {
    expect(await whyNotPainted(page, selector), selector).toEqual([]);
  }
  await context.close();
});

test("signed out: /register paints its form from the HTML alone", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  await context.addCookies([{ name: "edulink_locale", value: "en", url: baseURL! }]);
  const page = await context.newPage();
  const response = await page.goto("/register");
  expect(response?.status()).toBe(200);
  const html = await response!.text();
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  expect(inShell(html, (await heading.innerText()).trim())).toBe(true);
  await expect(page.locator("input:not([type=hidden])").first()).toBeVisible();
  for (const selector of ["h1", "input:not([type=hidden])"]) expect(await whyNotPainted(page, selector), selector).toEqual([]);
  await context.close();
});

test("signed in: /parent paints its heading and first sentence from the HTML alone", async ({ browser, baseURL }) => {
  const actor = all.PARENT!;
  const context = await contextFor(browser, actor.cookie, { viewport: { width: 390, height: 844 }, theme: "light", locale: "en", javaScriptEnabled: false }, baseURL!);
  const page = await context.newPage();
  const response = await page.goto("/parent");
  expect(response?.status()).toBe(200);
  const html = await response!.text();
  const heading = page.locator("main h1").first();
  await expect(heading).toBeVisible();
  expect(inShell(html, (await heading.innerText()).trim())).toBe(true);
  expect(await whyNotPainted(page, "main h1")).toEqual([]);
  expect(await whyNotPainted(page, "main p")).toEqual([]);
  await context.close();
});
