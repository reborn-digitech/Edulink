import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { test, expect } from "@playwright/test";
import { LOCALES, THEMES, contextFor, rolesWithTokens, routesFor, settle, slugFor, tabBar, tabLabels } from "./actors";

/**
 * The UI/UX review set: every tab-bar route, as every role with a token, in
 * two themes and three languages, saved as plain PNGs under
 * e2e/screens/<role>/<route>-<theme>-<locale>.png for a person to look
 * through. Not a comparison — there is no baseline — just the pictures.
 *
 * One thing is asserted on the way: the tab bar is in the language asked
 * for. Its labels must be the dictionary's words for that language and, for
 * Hindi and Marathi, none of the English words may be left in it.
 */
const OUT = join(__dirname, "screens");

const actors = rolesWithTokens();

if (actors.length === 0) {
  test.skip("no role tokens in the environment (EDULINK_TOKEN_TEACHER, _PARENT, _STUDENT, _ADMIN, _PRINCIPAL, _EXPERT)", () => {});
}

for (const { role, token } of actors) {
  const folder = join(OUT, role.toLowerCase());
  for (const theme of THEMES) {
    for (const locale of LOCALES) {
      test.describe(`${role} · ${theme} · ${locale}`, () => {
        for (const route of routesFor(role)) {
          test(`${route}`, async ({ browser }) => {
            const context = await contextFor(browser, token, { theme, locale });
            const page = await context.newPage();
            const response = await page.goto(route, { waitUntil: "networkidle" });
            expect(response?.status(), `${route} answered ${response?.status()}`).toBeLessThan(400);
            await settle(page);

            // The tab bar speaks the language asked for.
            const bar = tabBar(page, role, locale);
            await expect(bar).toBeVisible();
            const text = await bar.innerText();
            for (const label of tabLabels(role, locale)) expect(text, `tab bar in ${locale} should say "${label}"`).toContain(label);
            if (locale !== "en") {
              for (const word of tabLabels(role, "en")) expect(text, `tab bar in ${locale} still says "${word}"`).not.toContain(word);
            }

            mkdirSync(folder, { recursive: true });
            await page.screenshot({ path: join(folder, `${slugFor(route)}-${theme}-${locale}.png`) });
            await context.close();
          });
        }
      });
    }
  }
}
