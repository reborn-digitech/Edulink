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
  // The switch is a chip beside whichever box has focus, and nowhere until one has.
  const sw = page.getByTestId("typing-switch").first();
  await expect(sw).toHaveAttribute("data-language", "en");
  await expect(sw).toBeHidden();
  const name = page.getByTestId("template-name");
  await name.click();
  await expect(sw).toBeVisible();
  await expect(sw).toHaveText("Typing: EN");
  await sw.click();
  await expect(sw).toHaveAttribute("data-language", "hi");
  await sw.click();
  await expect(sw).toHaveAttribute("data-language", "mr");
  // The box kept its focus through the presses.
  await expect(name).toBeFocused();

  // An ordinary box: what the word will become is shown while it is typed, and written when it ends.
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("shaaLaa");
  await expect(page.getByTestId("typing-hint")).toHaveText("shaaLaa → शाळा");
  await page.keyboard.type(" ");
  await expect(name).toHaveValue("शाळा ");
  await expect(page.getByTestId("typing-hint")).toHaveCount(0);
  // A number and a word already in Devanagari are left alone; a word typed in English on the English setting too.
  await page.keyboard.type("2026 ");
  await expect(name).toHaveValue("शाळा 2026 ");

  // The certificate's paragraph, which is an editable region and not a box. A paragraph is typed in its
  // face's script over the switch, and "same as the paper" is the template's language: a Marathi template.
  await page.getByTestId("template-language").selectOption("mr");
  const intro = page.getByTestId("template-intro");
  await intro.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("namaste ");
  await expect(intro).toHaveText("नमस्ते ");
  await expect(page.getByTestId("preview-intro")).toHaveText("नमस्ते");

  // Back to English: letters stay letters. The chip beside a paragraph that chooses its own language cycles that
  // box alone, so the plain box is focused first to turn the switch itself.
  await name.click();
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

test("a paragraph set in a Devanagari face is typed in Devanagari and one in a Latin face in English, whatever the switch says, and each wears its face on the preview", async ({ browser, baseURL }) => {
  const context = await contextFor(browser, admin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  expect((await page.goto("/admin/certificates/new", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const sw = page.getByTestId("typing-switch").first();
  await expect(sw).toHaveAttribute("data-language", "en");
  const intro = page.getByTestId("template-intro");
  const outro = page.getByTestId("template-outro");
  const title = page.getByTestId("template-title");
  const typeInto = async (box: typeof intro, text: string) => {
    await box.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(text);
  };

  // An English template with the switch on English: "same as the paper" types English.
  await expect(intro).toHaveAttribute("data-typing", "en");
  // The opening paragraph set in Hind: typed in Hindi with the switch still on English, the hint shown, the face on the box and the preview.
  await page.getByTestId("template-intro-font").selectOption("hind");
  await expect(intro).toHaveAttribute("data-typing", "hi");
  await expect(intro).toHaveCSS("font-family", /Hind/);
  await expect(page.getByText("Typed in Hindi, as its typeface asks, whatever the keyboard switch says.")).toBeVisible();
  await typeInto(intro, "namaste");
  await expect(page.getByTestId("typing-hint")).toHaveText("namaste → नमस्ते");
  await page.keyboard.type(" ");
  await expect(intro).toHaveText("नमस्ते ");
  await expect(page.getByTestId("preview-intro")).toHaveText("नमस्ते");
  await expect(page.getByTestId("preview-intro")).toHaveCSS("font-family", /Hind/);
  // The chip beside the paragraph says Hindi, the box's own default, and can still be pressed: for this box alone
  // (the owner, 2026-10-01). Pressed twice, past Marathi to English, the same letters stay letters; the switch itself
  // is untouched, and the hint under the box is about the default.
  await expect(sw).toHaveAttribute("data-own", "hi");
  await expect(sw).toHaveAttribute("data-language", "en");
  await sw.click();
  await expect(sw).toHaveAttribute("data-own", "mr");
  await sw.click();
  await expect(sw).toHaveAttribute("data-own", "");
  await expect(sw).toHaveAttribute("data-language", "en");
  await page.keyboard.type("namaste ");
  await expect(intro).toHaveText("नमस्ते namaste ");
  // Back to the box's own Hindi, by pressing on: the override is the box's, and the heading never had one.
  await sw.click();
  await expect(sw).toHaveAttribute("data-own", "hi");
  await page.keyboard.type("namaste ");
  await expect(intro).toHaveText("नमस्ते namaste नमस्ते ");
  // The heading, which has no face of its own, still follows the switch: English letters stay letters.
  await typeInto(title, "namaste ");
  await expect(title).toHaveValue("namaste ");

  // The switch on Marathi and the closing paragraph set in Merriweather: English letters stay letters there, and the heading becomes Devanagari.
  await sw.click();
  await sw.click();
  await expect(sw).toHaveAttribute("data-language", "mr");
  await page.getByTestId("template-outro-font").selectOption("merriweather");
  await expect(outro).toHaveAttribute("data-typing", "en");
  await typeInto(outro, "namaste ");
  await expect(outro).toHaveText("namaste ");
  await expect(page.getByTestId("preview-outro")).toHaveCSS("font-family", /Merriweather/);
  await typeInto(title, "shaaLaa ");
  await expect(title).toHaveValue("शाळा ");

  // A Marathi template with the switch back on English: a paragraph set "same as the paper" is typed in Marathi.
  await sw.click();
  await expect(sw).toHaveAttribute("data-language", "en");
  await page.getByTestId("template-outro-font").selectOption("default");
  await page.getByTestId("template-language").selectOption("mr");
  await expect(outro).toHaveAttribute("data-typing", "mr");
  await typeInto(outro, "shaaLaa ");
  await expect(outro).toHaveText("शाळा ");
  await page.evaluate(() => window.localStorage.removeItem("edulink.typing"));
  await context.close();
});

for (const theme of ["light", "dark"] as const) {
  test(`the post composer with its typeface, and the switch in the header · ${theme}`, async ({ browser, baseURL }) => {
    const context = await contextFor(browser, admin.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
    const page = await context.newPage();
    expect((await page.goto("/bulletin/new", { waitUntil: "networkidle" }))?.status()).toBe(200);
    await expect(page.getByTestId("post-font")).toBeVisible();
    // Nowhere until a box has focus; then once, beside it.
    await expect(page.locator('[data-testid="typing-switch"]:visible')).toHaveCount(0);
    await page.locator("textarea").first().click();
    await expect(page.locator('[data-testid="typing-switch"]:visible')).toHaveCount(1);
    expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);
    expect(await smallTargets(page), "interactive elements under 44px").toEqual([]);
    expect(await seriousViolations(page, `composer ${theme}`)).toEqual([]);
    await context.close();
  });
}
