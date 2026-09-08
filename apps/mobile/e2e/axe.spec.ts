import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { THEMES, contextFor, rolesWithTokens, routesFor, settle } from "./actors";

/**
 * The accessibility gate on the web target: every route of the role's tab
 * bar, plus More and the bell, as every role with a token, in both colour
 * schemes. Zero serious or critical violations is the assertion; moderate
 * and minor ones are printed, not failed — the number should fall, not be
 * hidden. The page must also have answered under 400.
 */
const actors = rolesWithTokens();

if (actors.length === 0) {
  test.skip("no role tokens in the environment (EDULINK_TOKEN_TEACHER, _PARENT, _STUDENT)", () => {});
}

for (const { role, token } of actors) {
  for (const theme of THEMES) {
    test.describe(`${role} · ${theme}`, () => {
      for (const route of routesFor(role)) {
        test(`${route}`, async ({ browser }) => {
          const context = await contextFor(browser, token, { theme, locale: "en" });
          const page = await context.newPage();
          const response = await page.goto(route, { waitUntil: "networkidle" });
          expect(response?.status(), `${route} answered ${response?.status()}`).toBeLessThan(400);
          await settle(page);
          const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
          const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
          const softer = results.violations.filter((v) => !serious.includes(v));
          if (softer.length) console.log(`  ${role} ${theme} ${route}: ${softer.map((v) => `${v.id}×${v.nodes.length}`).join(", ")}`);
          expect(
            serious.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
          ).toEqual([]);
          await context.close();
        });
      }
    });
  }
}
