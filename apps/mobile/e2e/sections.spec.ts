import { test, expect } from "@playwright/test";
import { allRoutesFor, contextFor, rolesWithTokens, settle } from "./actors";

/**
 * Every section the web's NAV gives a role is a screen on the phone: the
 * bar's routes and every entry More opens, as every role with a token. The
 * page answers under 400, the app draws its own header (not the sign-in
 * page, not a placeholder), and nothing on it is an alert — a refused or
 * misparsed answer shows as one, so a screen whose query is wrong for the
 * role fails here rather than on a phone.
 */
const actors = rolesWithTokens();

if (actors.length === 0) {
  test.skip("no role tokens in the environment (EDULINK_TOKEN_*)", () => {});
}

for (const { role, token } of actors) {
  test.describe(`${role} · every section`, () => {
    for (const route of allRoutesFor(role)) {
      test(`${route}`, async ({ browser }) => {
        const context = await contextFor(browser, token, { theme: "light", locale: "en" });
        const page = await context.newPage();
        const response = await page.goto(route, { waitUntil: "networkidle" });
        expect(response?.status(), `${route} answered ${response?.status()}`).toBeLessThan(400);
        await settle(page);
        const text = await page.locator("body").innerText();
        expect(text, `${route} shows the sign-in page`).not.toContain("Welcome back");
        expect(text, `${route} is still a placeholder`).not.toContain("Coming soon");
        const alerts = await page.getByRole("alert").allInnerTexts();
        expect(alerts, `${route} shows an alert`).toEqual([]);
        expect(await page.getByRole("heading").count(), `${route} has no heading`).toBeGreaterThan(0);
        await context.close();
      });
    }
  });
}
