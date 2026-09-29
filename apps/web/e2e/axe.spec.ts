import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { NAV } from "../src/lib/nav";
import { contextFor, sessions, VIEWPORTS } from "./actors";

/**
 * The accessibility gate: every navigation entry, as every role, at phone
 * width, in both themes. Zero serious or critical violations. Moderate and
 * minor ones are printed, not failed — the number should fall, not be hidden.
 */
const all = sessions();
const roles = Object.keys(all) as (keyof typeof NAV)[];

for (const role of roles) {
  const actor = all[role]!;
  const hrefs = Array.from(new Set(NAV[role].flatMap((item) => [item.href, ...(item.also ?? [])])));
  /**
   * An entry's `also` is a PREFIX that counts as "here" for the highlight —
   * /certificates/<id> under Certificates, /incidents/<id> under Incidents —
   * and need not be a page of its own. One that is a page is tested like any
   * other; one that answers 404 is a prefix, and is skipped and said so. An
   * entry's own href is never excused.
   */
  const prefixes = new Set(NAV[role].flatMap((item) => item.also ?? []).filter((href) => !NAV[role].some((item) => item.href === href)));
  for (const theme of ["light", "dark"] as const) {
    test.describe(`${role} · ${theme}`, () => {
      for (const href of hrefs) {
        test(`${href}`, async ({ browser, baseURL }) => {
          const context = await contextFor(browser, actor.cookie, { viewport: VIEWPORTS.iphone, theme, locale: "en" }, baseURL!);
          const page = await context.newPage();
          const response = await page.goto(href, { waitUntil: "networkidle" });
          if (response?.status() === 404 && prefixes.has(href)) {
            await context.close();
            test.skip(true, `${href} is a prefix of this entry's pages, not a page`);
          }
          expect(response?.status(), `${href} answered ${response?.status()}`).toBeLessThan(400);
          const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
          const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
          const softer = results.violations.filter((v) => !serious.includes(v));
          if (softer.length) console.log(`  ${role} ${theme} ${href}: ${softer.map((v) => `${v.id}×${v.nodes.length}`).join(", ")}`);
          expect(
            serious.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
          ).toEqual([]);
          await context.close();
        });
      }
    });
  }
}
