import { test, expect } from "@playwright/test";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, seriousViolations, smallTargets } from "./checks";

/**
 * A typeface chosen for a paper and drawn on it; and the keyboard switched
 * to Marathi, so that English letters become Devanagari as a word ends, in
 * an ordinary box and in the certificate's editable paragraph alike. The
 * pages are only read and typed in here; nothing is saved.
 */
const admin = sessions().ADMIN!;
const DESK = { width: 1280, height: 900 };

test("a template's typeface is offered by its language, drawn on the preview, and loaded from the app's own files", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  expect((await page.goto("/admin/certificates/new", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const select = page.getByTestId("template-font");
  await expect(select).toHaveValue("default");
  // An English document: the Latin faces come first.
  const groups = await select.locator("optgroup").evaluateAll((els) => els.map((el) => el.getAttribute("label")));
  expect(groups[0]).toBe("Latin (English)");
  await select.selectOption("merriweather");
  await expect(page.getByTestId("preview-paper")).toHaveCSS("font-family", /Merriweather/);
  expect(await page.evaluate(async () => { await document.fonts.load('16px "Merriweather"'); return document.fonts.check('16px "Merriweather"'); })).toBe(true);
  // A Marathi document: the Devanagari faces first, and Hind drawn.
  await page.getByTestId("template-language").selectOption("mr");
  expect((await select.locator("optgroup").evaluateAll((els) => els.map((el) => el.getAttribute("label"))))[0]).toBe("Devanagari (Hindi, Marathi)");
  await select.selectOption("hind");
  await expect(page.getByTestId("preview-paper")).toHaveCSS("font-family", /Hind/);
  await context.close();
});

test("the report card rules offer a typeface and the sample card wears it", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  expect((await page.goto("/admin/report-cards", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await page.getByTestId("rules-tab-layout").click();
  await page.getByTestId("layout-font").selectOption("notoserifdevanagari");
  await expect(page.getByTestId("preview-paper")).toHaveCSS("font-family", /Noto Serif Devanagari/);
  await context.close();
});

test("the keyboard switched to Marathi turns English letters into Devanagari as a word ends, in a box and in the editable paragraph, and remembers the choice", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  expect((await page.goto("/admin/certificates/new", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const sw = page.getByTestId("typing-switch").first();
  await expect(sw).toHaveAttribute("data-language", "en");
  await sw.click();
  await expect(sw).toHaveAttribute("data-language", "hi");
  await sw.click();
  await expect(sw).toHaveAttribute("data-language", "mr");

  // An ordinary box: what the word will become is shown while it is typed, and written when it ends.
  const name = page.getByTestId("template-name");
  await name.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("shaaLaa");
  await expect(page.getByTestId("typing-hint")).toHaveText("shaaLaa → शाळा");
  await page.keyboard.type(" ");
  await expect(name).toHaveValue("शाळा ");
  await expect(page.getByTestId("typing-hint")).toHaveCount(0);
  // A number and a word already in Devanagari are left alone; a word typed in English on the English setting too.
  await page.keyboard.type("2026 ");
  await expect(name).toHaveValue("शाळा 2026 ");

  // The certificate's paragraph, which is an editable region and not a box.
  const intro = page.getByTestId("template-intro");
  await intro.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("namaste ");
  await expect(intro).toHaveText("नमस्ते ");
  await expect(page.getByTestId("preview-intro")).toHaveText("नमस्ते");

  // Back to English: letters stay letters.
  await sw.click();
  await expect(sw).toHaveAttribute("data-language", "en");
  await name.click();
  await page.keyboard.press("End");
  await page.keyboard.type("namaste ");
  await expect(name).toHaveValue("शाळा 2026 namaste ");

  // The choice is the device's: switched to Hindi and the page opened again, it is still Hindi.
  await sw.click();
  await expect(sw).toHaveAttribute("data-language", "hi");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByTestId("typing-switch").first()).toHaveAttribute("data-language", "hi");
  await page.evaluate(() => window.localStorage.removeItem("edulink.typing"));
  await context.close();
});

for (const theme of ["light", "dark"] as const) {
  test(`the post composer with its typeface, and the switch in the header · ${theme}`, async ({ browser, baseURL }) => {
    const context = await contextFor(browser, admin.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
    const page = await context.newPage();
    expect((await page.goto("/bulletin/new", { waitUntil: "networkidle" }))?.status()).toBe(200);
    await expect(page.getByTestId("post-font")).toBeVisible();
    await expect(page.locator('[data-testid="typing-switch"]:visible')).toHaveCount(1);
    expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);
    expect(await smallTargets(page), "interactive elements under 44px").toEqual([]);
    expect(await seriousViolations(page, `composer ${theme}`)).toEqual([]);
    await context.close();
  });
}
