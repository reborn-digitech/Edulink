import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { NAV } from "../src/lib/nav";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, smallTargets } from "./checks";

/**
 * The accessibility gate: every navigation entry, as every role, at phone
 * width, in both themes. Zero serious or critical violations. Moderate and
 * minor ones are printed, not failed — the number should fall, not be hidden.
 * In the light theme the page is also measured as the phone app's are: no
 * sideways scroll, and no control under 44 px — the walk of 2026-10-01 found
 * 40 px reactions and 30 px chips on pages this suite had passed.
 */
const all = sessions();
const roles = (Object.keys(all) as (keyof typeof NAV)[]).filter((role) => NAV[role]);

/**
 * The content team and the operator have no menu in NAV — their pages hang
 * off /appadmin and /root with their own layouts — so until 2026-10-01 only
 * gig-questions.spec.ts opened them and nothing measured them. The same
 * gate, over the pages their layouts link to.
 */
const PLATFORM: Record<string, string[]> = {
  APPADMIN: ["/appadmin", "/appadmin/bank", "/appadmin/contributions", "/appadmin/new"],
  OPERATOR: ["/root", "/root/experts", "/root/content-team", "/root/gigs", "/root/audit", "/root/jobs", "/root/plans", "/root/metrics", "/root/new", "/appadmin", "/appadmin/bank", "/appadmin/contributions"],
};

const walked: [role: string, hrefs: string[], prefixes: Set<string>][] = [
  ...roles.map((role): [string, string[], Set<string>] => [
    role,
    Array.from(new Set(NAV[role].flatMap((item) => [item.href, ...(item.also ?? [])]))),
    new Set(NAV[role].flatMap((item) => item.also ?? []).filter((href) => !NAV[role].some((item) => item.href === href))),
  ]),
  ...Object.entries(PLATFORM).filter(([role]) => all[role]).map(([role, hrefs]): [string, string[], Set<string>] => [role, hrefs, new Set()]),
];

for (const [role, hrefs, prefixes] of walked) {
  const actor = all[role]!;
  // An entry's `also` is a PREFIX that counts as "here" for the highlight —
  // /certificates/<id> under Certificates, /incidents/<id> under Incidents —
  // and need not be a page of its own. One that is a page is tested like any
  // other; one that answers 404 is a prefix, and is skipped and said so. An
  // entry's own href is never excused.
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
          // A lost session is a redirect to the login page, which answers 200
          // and has its own axe results: the walk is of the signed-in pages.
          expect(new URL(page.url()).pathname, `${href} sent ${role} to the login page`).not.toBe("/login");
          const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
          const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
          const softer = results.violations.filter((v) => !serious.includes(v));
          if (softer.length) console.log(`  ${role} ${theme} ${href}: ${softer.map((v) => `${v.id}×${v.nodes.length}`).join(", ")}`);
          expect(
            serious.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
          ).toEqual([]);
          if (theme === "light") {
            expect(await overflow(page), `${href} scrolls sideways`).toBeLessThanOrEqual(0);
            expect(await smallTargets(page), `${href}: interactive elements under 44px`).toEqual([]);
          }
          await context.close();
        });
      }
    });
  }
}
