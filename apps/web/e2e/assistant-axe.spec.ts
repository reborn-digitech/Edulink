import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { NAV } from "../src/lib/nav";
import { ROLE_HOME, type Role } from "../src/lib/constants";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, smallTargets } from "./checks";

/**
 * The assistant's panel under the accessibility gate (Phase C, 10 Oct 2026; the plan's section 9.11): opened from the
 * shell on each role's home, at phone width in both themes and at a desk's width, with zero serious or critical axe
 * violations, no sideways scroll, no control under 44 px, and the first screen drawn from the status door. Named
 * *axe.spec.ts so it runs in the `axe` project beside the walk of every menu entry, which covers /assistant itself
 * (every role that belongs to a school has it in its menu, lib/nav.ts).
 *
 * The panel reads GET /api/v1/assistant only; nothing is asked of the model, so the model servers need not be up.
 */
const all = sessions();
const keys = Object.keys(all).filter((key) => {
  const role = all[key]!.role as Role;
  return NAV[role]?.some((item) => item.href === "/assistant") && (!all[key]!.modules || all[key]!.modules!.includes("ASSISTANT"));
});

async function serious(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}

for (const key of keys) {
  const actor = all[key]!;
  const home = ROLE_HOME[actor.role as Role];
  for (const theme of ["light", "dark"] as const) {
    test(`${key} · ${theme} · the assistant's panel on ${home} at 390 px`, async ({ browser, baseURL }) => {
      const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
      const page = await context.newPage();
      const response = await page.goto(home, { waitUntil: "networkidle" });
      expect(response?.status()).toBeLessThan(400);
      await page.getByTestId("assistant-launcher").click();
      const dialog = page.getByRole("dialog", { name: "Assistant" });
      await expect(dialog).toBeVisible();
      // The status door has answered: the first screen, or the sentence saying why the person may not ask.
      await expect(dialog.getByTestId("assistant-first-screen").or(dialog.getByTestId("assistant-unavailable"))).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(await serious(page)).toEqual([]);
      if (theme === "light") {
        expect(await overflow(page)).toBeLessThanOrEqual(0);
        expect(await smallTargets(page)).toEqual([]);
      }
      // Escape closes it and gives the focus back to the launcher.
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(page.getByTestId("assistant-launcher")).toBeFocused();
      await context.close();
    });
  }
  // 360 px (10 Oct 2026): the three round buttons of the top bar left the school name one letter wide, so below
  // 400 px the name is for the screen reader only and the launcher keeps its 44 px; nothing scrolls sideways.
  test(`${key} · light · the launcher on ${home} at 360 px`, async ({ browser, baseURL }) => {
    const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS["android-small"], theme: "light", locale: "en" }, baseURL!);
    const page = await context.newPage();
    const response = await page.goto(home, { waitUntil: "networkidle" });
    expect(response?.status()).toBeLessThan(400);
    const launcher = page.getByTestId("assistant-launcher");
    await expect(launcher).toBeVisible();
    const box = (await launcher.boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    // The name is in the top bar's link for assistive technology, clipped to a pixel for everyone else.
    const nameWidth = await page.evaluate(() => {
      const header = document.querySelector("header[data-chrome]");
      const spans = header ? [...header.querySelectorAll("a span span")] : [];
      const name = spans.find((s) => s.classList.contains("font-bold"));
      return name ? (name as HTMLElement).getBoundingClientRect().width : -1;
    });
    expect(nameWidth).toBeGreaterThanOrEqual(0);
    expect(nameWidth).toBeLessThanOrEqual(1);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(await smallTargets(page)).toEqual([]);
    expect(await serious(page)).toEqual([]);
    await launcher.click();
    await expect(page.getByRole("dialog", { name: "Assistant" })).toBeVisible();
    await context.close();
  });

  test(`${key} · light · the assistant's panel on ${home} at 1280 px`, async ({ browser, baseURL }) => {
    const context = await contextFor(browser, actor.cookie, { viewport: { width: 1280, height: 900 }, theme: "light", locale: "en" }, baseURL!);
    const page = await context.newPage();
    await page.goto(home, { waitUntil: "networkidle" });
    await page.getByTestId("assistant-launcher-rail").click();
    const dialog = page.getByRole("dialog", { name: "Assistant" });
    await expect(dialog.getByTestId("assistant-first-screen").or(dialog.getByTestId("assistant-unavailable"))).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(await serious(page)).toEqual([]);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await context.close();
  });
}

/** A guardian's first screen names where the opt-out is, and the link lands on the card on the settings page. */
test("PARENT · the first screen's link to the opt-out lands on the assistant's card", async ({ browser, baseURL }) => {
  const actor = all.PARENT;
  test.skip(!actor, "no guardian in the fixtures");
  const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.iphone, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await page.goto("/parent", { waitUntil: "networkidle" });
  await page.getByTestId("assistant-launcher").click();
  const dialog = page.getByRole("dialog", { name: "Assistant" });
  await expect(dialog.getByText("You can turn it off for a child in your settings.", { exact: false })).toBeVisible();
  await dialog.getByRole("link", { name: "Open your settings" }).click();
  await expect(page).toHaveURL(/\/parent\/settings/);
  await expect(page.getByTestId("family-assistant-card")).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(await serious(page)).toEqual([]);
  expect(await smallTargets(page)).toEqual([]);
  await context.close();
});
