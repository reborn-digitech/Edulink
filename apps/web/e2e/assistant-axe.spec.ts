import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { ASSISTANT_NOT_FOR } from "../src/lib/nav";
import { ROLE_HOME, type Role } from "../src/lib/constants";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, smallTargets } from "./checks";

/**
 * VIDURA'S BUTTON AND DRAWER under the accessibility gate (Vidura pass 1, 17 Oct 2026; Phase C's panel spec rewritten):
 * the round button at the bottom right of each role's home, the drawer it opens — a bottom sheet at phone width in both
 * themes, docked beside the page at a desk's width — with zero serious or critical axe violations, no sideways scroll,
 * no control under 44 px, the first screen drawn from the status door, Escape closing it and the focus going back to
 * the button. Named *axe.spec.ts so it runs in the `axe` project.
 *
 * The drawer reads GET /api/v1/assistant and the suggestions door only; nothing is asked of the model, so the model
 * servers need not be up. The button is drawn only where Vidura is the person's (the platform's ASSISTANT feature on,
 * the school's module on): with the feature off — the development database's resting state — every case is skipped.
 */
config({ path: ".env" });
const all = sessions();
const SKIP = new Set(["EXPERT", "RECRUITER", "APPADMIN", "OPERATOR"]);
const keys = Object.keys(all).filter((key) => {
  const actor = all[key]!;
  return !SKIP.has(key) && !ASSISTANT_NOT_FOR.includes(actor.role as Role) && !!actor.modules?.includes("ASSISTANT");
});

let featureOn = false;
test.beforeAll(async () => {
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
  featureOn = (await db.platformFeature.findUnique({ where: { code: "ASSISTANT" }, select: { enabled: true } }))?.enabled === true;
  await db.$disconnect();
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
    test(`${key} · ${theme} · Vidura's sheet on ${home} at 390 px`, async ({ browser, baseURL }) => {
      test.skip(!featureOn, "the ASSISTANT feature is off on this database");
      const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
      const page = await context.newPage();
      const response = await page.goto(home, { waitUntil: "networkidle" });
      expect(response?.status()).toBeLessThan(400);
      const button = page.getByTestId("vidura-button");
      await expect(button).toBeVisible();
      await button.click();
      const dialog = page.getByRole("dialog", { name: "Vidura" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      // The status door has answered: the first screen, or the sentence saying why the person may not ask.
      await expect(dialog.getByTestId("assistant-first-screen").or(dialog.getByTestId("assistant-unavailable"))).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(await serious(page)).toEqual([]);
      if (theme === "light") {
        expect(await overflow(page)).toBeLessThanOrEqual(0);
        expect(await smallTargets(page)).toEqual([]);
      }
      // Escape closes it and gives the focus back to the round button.
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(button).toBeFocused();
      await context.close();
    });
  }

  // 360 px: the round button keeps its 44 px above the bottom bar, nothing scrolls sideways, and the top bar's name is
  // for the screen reader only below 400 px (10 Oct 2026).
  test(`${key} · light · the round button on ${home} at 360 px`, async ({ browser, baseURL }) => {
    test.skip(!featureOn, "the ASSISTANT feature is off on this database");
    const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS["android-small"], theme: "light", locale: "en" }, baseURL!);
    const page = await context.newPage();
    const response = await page.goto(home, { waitUntil: "networkidle" });
    expect(response?.status()).toBeLessThan(400);
    const button = page.getByTestId("vidura-button");
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    // Bottom right, wholly inside the window and above the bottom bar.
    expect(box.x + box.width).toBeLessThanOrEqual(360);
    const bar = (await page.locator('nav[data-chrome][aria-label]').last().boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(bar.y + 1);
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
    await button.click();
    await expect(page.getByRole("dialog", { name: "Vidura" })).toBeVisible();
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    await context.close();
  });

  test(`${key} · light · Vidura's drawer docked beside ${home} at 1280 px`, async ({ browser, baseURL }) => {
    test.skip(!featureOn, "the ASSISTANT feature is off on this database");
    const context = await contextFor(browser, actor.cookie, { viewport: { width: 1280, height: 900 }, theme: "light", locale: "en" }, baseURL!);
    const page = await context.newPage();
    await page.goto(home, { waitUntil: "networkidle" });
    await page.getByTestId("vidura-button").click();
    const dialog = page.getByRole("dialog", { name: "Vidura" });
    await expect(dialog.getByTestId("assistant-first-screen").or(dialog.getByTestId("assistant-unavailable"))).toBeVisible();
    // Docked, not modal: the page makes room and stays usable beside it.
    await expect(dialog).toHaveAttribute("aria-modal", "false");
    await expect(dialog).toHaveAttribute("data-docked", "true");
    const drawer = (await dialog.boundingBox())!;
    const main = (await page.locator("#main").boundingBox())!;
    expect(main.x + main.width).toBeLessThanOrEqual(drawer.x + 1);
    await page.waitForLoadState("networkidle");
    expect(await serious(page)).toEqual([]);
    expect(await overflow(page)).toBeLessThanOrEqual(0);
    expect(await smallTargets(page)).toEqual([]);
    await context.close();
  });
}

/** A guardian's first screen names where the opt-out is, and the link lands on the card on the settings page. */
test("PARENT · the first screen's link to the opt-out lands on Vidura's card", async ({ browser, baseURL }) => {
  const actor = all.PARENT;
  test.skip(!actor || !featureOn, "no guardian in the fixtures, or the ASSISTANT feature is off");
  const context = await contextFor(browser, actor!.cookie, { viewport: VIEWPORTS.iphone, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await page.goto("/parent", { waitUntil: "networkidle" });
  await page.getByTestId("vidura-button").click();
  const dialog = page.getByRole("dialog", { name: "Vidura" });
  await expect(dialog.getByText("You can turn it off for a child in your settings.", { exact: false })).toBeVisible();
  await dialog.getByRole("link", { name: "Open your settings" }).click();
  await expect(page).toHaveURL(/\/parent\/settings/);
  // A phone's sheet closes when a link inside it is followed.
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("family-assistant-card")).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(await serious(page)).toEqual([]);
  expect(await smallTargets(page)).toEqual([]);
  await context.close();
});

/** The old page sends the person back where they came from with the drawer open. */
test("STUDENT · /assistant opens the drawer on the page it was opened from", async ({ browser, baseURL }) => {
  const actor = all.STUDENT;
  test.skip(!actor || !featureOn, "no pupil in the fixtures, or the ASSISTANT feature is off");
  const context = await contextFor(browser, actor!.cookie, { viewport: { width: 1280, height: 900 }, theme: "light", locale: "en" }, baseURL!);
  const page = await context.newPage();
  await page.goto("/assistant?from=%2Fstudent%2Fassignments", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/student\/assignments$/);
  const dialog = page.getByRole("dialog", { name: "Vidura" });
  await expect(dialog).toBeVisible();
  // Away from home, the first suggestion asks about the page itself.
  await expect(dialog.getByTestId("vidura-suggestions").getByRole("button", { name: "How do I use this page?" })).toBeVisible();
  await context.close();
});
