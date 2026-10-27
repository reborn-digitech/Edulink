import { test, expect, type Page } from "@playwright/test";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, seriousViolations, smallTargets } from "./checks";

/**
 * THE OFFICE'S MENU IN SEVEN GROUPS (the owner's decision of 27 October 2026, item 3), in a browser: the rail on a desk
 * and the More sheet at a phone's width, as the fixture's office (ZZ Northgate) and head. The axe walk (axe.spec.ts)
 * measures every page at a phone's width, where the rail is not drawn and the More sheet is shut; this opens them.
 * Each test is a fresh browser context, so the remembered groups start empty and nothing is left behind.
 */
const all = sessions();
const DESK = { width: 1280, height: 900 } as const;

async function open(browserCookie: string, browser: import("@playwright/test").Browser, baseURL: string, viewport: { width: number; height: number }, theme: "light" | "dark" = "light") {
  const context = await contextFor(browser, browserCookie, { viewport, theme, locale: "en" }, baseURL);
  return { context, page: await context.newPage() };
}

const groupButton = (page: Page, scope: string, name: string) => page.locator(scope).getByRole("button", { name, exact: true });

for (const role of ["ADMIN", "PRINCIPAL"] as const) {
  test.describe(`${role} · the rail on a desk`, () => {
    test.skip(!all[role], `no ${role} session`);

    for (const theme of ["light", "dark"] as const) {
      test(`seven groups, Setup closed, one nav landmark, no serious axe violation (${theme})`, async ({ browser, baseURL }) => {
        const { context, page } = await open(all[role]!.cookie, browser, baseURL!, DESK, theme);
        await page.goto(role === "ADMIN" ? "/admin" : "/principal", { waitUntil: "networkidle" });
        const rail = page.locator("aside nav");
        await expect(rail).toHaveCount(1);
        // The rail is still the one navigation landmark on a desk (the phone's bar and the floating action are hidden).
        expect(await page.getByRole("navigation").evaluateAll((els) => els.filter((el) => (el as HTMLElement).offsetParent !== null).length)).toBe(1);
        for (const name of ["Teaching", "People and records", "Attendance and cover", "Money", "Communication"]) {
          await expect(groupButton(page, "aside nav", name)).toHaveAttribute("aria-expanded", "true");
        }
        await expect(groupButton(page, "aside nav", "Setup")).toHaveAttribute("aria-expanded", "false");
        // Setup's pages are in the page, hidden until it opens.
        await expect(rail.locator('a[href="/admin/signatures"]')).toHaveCount(1);
        await expect(rail.locator('a[href="/admin/signatures"]')).toBeHidden();
        // The person's own pages are not in the rail.
        await expect(rail.getByRole("link", { name: "My letters" })).toHaveCount(0);
        expect(await seriousViolations(page, `${role} ${theme} rail`)).toEqual([]);
        await context.close();
      });
    }

    test("a group opens and closes from the keyboard, and the choice is kept for the next page", async ({ browser, baseURL }) => {
      const { context, page } = await open(all[role]!.cookie, browser, baseURL!, DESK);
      await page.goto(role === "ADMIN" ? "/admin" : "/principal", { waitUntil: "networkidle" });
      const setup = groupButton(page, "aside nav", "Setup");
      await setup.focus();
      await page.keyboard.press("Enter");
      await expect(setup).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator('aside nav a[href="/admin/signatures"]')).toBeVisible();
      const money = groupButton(page, "aside nav", "Money");
      await money.focus();
      await page.keyboard.press("Space");
      await expect(money).toHaveAttribute("aria-expanded", "false");
      const kept = await page.evaluate((key) => window.localStorage.getItem(key), `edulink.nav.groups.${role}`);
      expect(JSON.parse(kept ?? "{}")).toEqual({ setup: true, money: false });
      await page.reload({ waitUntil: "networkidle" });
      await expect(groupButton(page, "aside nav", "Setup")).toHaveAttribute("aria-expanded", "true");
      await expect(groupButton(page, "aside nav", "Money")).toHaveAttribute("aria-expanded", "false");
      await context.close();
    });

    test("the group holding the page is open whatever was chosen", async ({ browser, baseURL }) => {
      const { context, page } = await open(all[role]!.cookie, browser, baseURL!, DESK);
      await context.addInitScript((key) => window.localStorage.setItem(key, JSON.stringify({ setup: false, money: false })), `edulink.nav.groups.${role}`);
      await page.goto("/admin/signatures", { waitUntil: "networkidle" });
      const setup = groupButton(page, "aside nav", "Setup");
      await expect(setup).toHaveAttribute("aria-expanded", "true");
      await expect(setup).toHaveAttribute("aria-disabled", "true");
      await expect(page.locator('aside nav a[href="/admin/signatures"]')).toHaveAttribute("aria-current", "page");
      await expect(groupButton(page, "aside nav", "Money")).toHaveAttribute("aria-expanded", "false");
      await context.close();
    });

    test("a closed group's pages are still found by the search (⌘K)", async ({ browser, baseURL }) => {
      const { context, page } = await open(all[role]!.cookie, browser, baseURL!, DESK);
      await page.goto(role === "ADMIN" ? "/admin" : "/principal", { waitUntil: "networkidle" });
      await expect(groupButton(page, "aside nav", "Setup")).toHaveAttribute("aria-expanded", "false");
      await page.keyboard.press("ControlOrMeta+k");
      const palette = page.getByRole("dialog", { name: "Search and commands" });
      await expect(palette).toBeVisible();
      await palette.getByRole("textbox", { name: "Search pages and actions" }).fill("Signatures");
      await expect(palette.locator('a[href="/admin/signatures"]')).toBeVisible();
      await context.close();
    });

    test("the account menu opens from the avatar with the person's own pages, and Escape closes it", async ({ browser, baseURL }) => {
      const { context, page } = await open(all[role]!.cookie, browser, baseURL!, DESK);
      await page.goto(role === "ADMIN" ? "/admin" : "/principal", { waitUntil: "networkidle" });
      const button = page.getByTestId("account-menu-button-rail");
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await button.click();
      const menu = page.getByTestId("account-menu-rail");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("link", { name: "Your account" })).toBeVisible();
      await expect(menu.getByRole("link", { name: "My letters" })).toBeVisible();
      expect(await seriousViolations(page, `${role} account menu`)).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(button).toBeFocused();
      await context.close();
    });
  });

  test.describe(`${role} · the More sheet at a phone's width`, () => {
    test.skip(!all[role], `no ${role} session`);

    for (const theme of ["light", "dark"] as const) {
      test(`the same groups in the sheet, 44 px headers, no serious axe violation (${theme})`, async ({ browser, baseURL }) => {
        const { context, page } = await open(all[role]!.cookie, browser, baseURL!, VIEWPORTS.iphone, theme);
        await page.goto(role === "ADMIN" ? "/admin" : "/principal", { waitUntil: "networkidle" });
        await page.getByRole("button", { name: "More", exact: true }).click();
        const sheet = page.getByRole("dialog", { name: "More" });
        await expect(sheet).toBeVisible();
        await expect(sheet.getByRole("button", { name: "Teaching", exact: true })).toHaveAttribute("aria-expanded", "true");
        await expect(sheet.getByRole("button", { name: "Setup", exact: true })).toHaveAttribute("aria-expanded", "false");
        await sheet.getByRole("button", { name: "Setup", exact: true }).click();
        await expect(sheet.getByRole("button", { name: "Setup", exact: true })).toHaveAttribute("aria-expanded", "true");
        expect(await seriousViolations(page, `${role} ${theme} sheet`)).toEqual([]);
        if (theme === "light") {
          expect(await overflow(page)).toBeLessThanOrEqual(0);
          expect(await smallTargets(page)).toEqual([]);
        }
        await context.close();
      });
    }

    test("the avatar in the top bar opens the account menu", async ({ browser, baseURL }) => {
      const { context, page } = await open(all[role]!.cookie, browser, baseURL!, VIEWPORTS.iphone);
      await page.goto(role === "ADMIN" ? "/admin" : "/principal", { waitUntil: "networkidle" });
      await page.getByTestId("account-menu-button-bar").click();
      const menu = page.getByTestId("account-menu-bar");
      await expect(menu).toBeVisible();
      await expect(menu.getByRole("link", { name: "My letters" })).toBeVisible();
      expect(await smallTargets(page)).toEqual([]);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      expect(await seriousViolations(page, `${role} bar account menu`)).toEqual([]);
      await menu.getByRole("link", { name: "My letters" }).click();
      await page.waitForURL("**/account/letters");
      await expect(menu).toBeHidden();
      await context.close();
    });
  });
}
