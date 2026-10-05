import { createHash } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { NAV, PRIMARY_ACTION } from "../src/lib/nav";
import { ROLE_HOME, type Role } from "../src/lib/constants";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, smallTargets } from "./checks";

config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
test.afterAll(async () => {
  await db.$disconnect();
});

/**
 * The accessibility gate: every navigation entry, as every role, at phone
 * width, in both themes. Zero serious or critical violations. Moderate and
 * minor ones are printed, not failed — the number should fall, not be hidden.
 * In the light theme the page is also measured as the phone app's are: no
 * sideways scroll, and no control under 44 px — the walk of 2026-10-01 found
 * 40 px reactions and 30 px chips on pages this suite had passed.
 */
const all = sessions();
/**
 * Every actor whose real role has a menu — the school's at ZZ Northgate, and since 4 October the college's office,
 * head and student at ZZ Vidya (COLLEGE_ADMIN, COLLEGE_PRINCIPAL, COLLEGE_STUDENT, whose `role` is ADMIN, PRINCIPAL
 * and STUDENT). Each walks the entries its menu SHOWS: an entry whose module the actor's school has off is hidden by
 * the shell and was walked anyway, so ADMIN's /principal/college answered 404 at a school (B-21).
 */
const keys = Object.keys(all).filter((key) => NAV[all[key]!.role as Role]);
const shown = (key: string) => {
  const actor = all[key]!;
  // As the shell shows them (5 Oct 2026): the module on, the duty held, and at a college with streams one of the entry's.
  return NAV[actor.role as Role].filter(
    (item) =>
      (!item.module || !actor.modules || actor.modules.includes(item.module)) &&
      (!item.duty || (actor.duties ?? []).includes(item.duty)) &&
      (!item.streams || !actor.streams?.length || item.streams.some((s) => actor.streams!.includes(s))),
  );
};

/**
 * The streams' pages no menu entry leads to (5 Oct 2026): the office's and the head's records and the duties' desks
 * they read, the councils' returns behind the IQAC's documents, and the HOD's NBA report. The walk of 5 October found
 * their empty states with no way on and their links under 44 px; the gate keeps them.
 */
const STREAM_PAGES: Record<string, string[]> = {
  COLLEGE_ADMIN: ["/admin/stream-records/lab-batches", "/admin/stream-records/moot-courts", "/admin/stream-records/practicals", "/duties/lab", "/duties/nss", "/duties/ncc", "/duties/research", "/duties/exam-squad", "/duties/anti-ragging", "/iqac/documents/nba", "/iqac/documents/bci"],
  COLLEGE_PRINCIPAL: ["/admin/stream-records", "/admin/stream-records/lab-batches", "/duties/lab", "/iqac/documents"],
  IQAC: ["/iqac/documents/pci", "/iqac/documents/ncte"],
  HOD: ["/hod/nba"],
};

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
  ...keys.map((key): [string, string[], Set<string>] => {
    const items = shown(key);
    // The floating action's page too (/admin/invites/new, /teacher/attendance): the walk found an unlabelled control
    // on the office's, which no menu entry leads to (B-08, B-21).
    const action = PRIMARY_ACTION[all[key]!.role as Role];
    return [
      key,
      Array.from(new Set([...items.flatMap((item) => [item.href, ...(item.also ?? [])]), ...(action ? [action.href] : []), ...(STREAM_PAGES[key] ?? [])])),
      new Set(items.flatMap((item) => item.also ?? []).filter((href) => !items.some((item) => item.href === href))),
    ];
  }),
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
          const broken = watchMarkup(page);
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
          expect(broken, `${href}: invalid nesting or duplicate keys`).toEqual([]);
          await context.close();
        });
      }
    });
  }
}

/**
 * Markup React can only report in the console: a link inside a link (/mentoring failed hydration on every render,
 * B-09) and two list items with one key (the IQAC predictor, B-10). Hydration mismatches from a dev server's
 * recompiles are not counted here: they come and go with the compiler, not with the page.
 */
function watchMarkup(page: Page): string[] {
  const found: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/cannot be a descendant of|cannot contain a nested|Encountered two children with the same key/.test(text)) found.push(text.slice(0, 160));
  });
  return found;
}

/** The account behind an actor's minted session: its prefs are what a signed-in page's language follows. */
async function userOf(cookie: string): Promise<{ id: string; prefs: string } | null> {
  const token = cookie.split("=")[1]!;
  const session = await db.session.findFirst({ where: { tokenHash: createHash("sha256").update(token).digest("hex") }, select: { user: { select: { id: true, prefs: true } } } });
  return session?.user ?? null;
}

const homeOf = (key: string): string => {
  const actor = all[key]!;
  return NAV[actor.role as Role] ? ROLE_HOME[actor.role as Role] : PLATFORM[key]![0]!;
};
const homeKeys = [...keys, ...Object.keys(PLATFORM).filter((key) => all[key])];

/**
 * The homes at a desk's width (B-21). The gate walked 390 px only, where the timetable grid is a list, so the faded
 * shut-day cells' contrast (B-07) and a floating button over a row (B-19) were never in front of it.
 */
test.describe("homes at 1280 px", () => {
  for (const key of homeKeys) {
    for (const theme of ["light", "dark"] as const) {
      test(`${key} · ${theme} · ${homeOf(key)}`, async ({ browser, baseURL }) => {
        const context = await contextFor(browser, all[key]!.cookie, { viewport: { width: 1280, height: 900 }, theme, locale: "en" }, baseURL!);
        const page = await context.newPage();
        const broken = watchMarkup(page);
        const response = await page.goto(homeOf(key), { waitUntil: "networkidle" });
        expect(response?.status()).toBeLessThan(400);
        expect(new URL(page.url()).pathname).not.toBe("/login");
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
        expect(await overflow(page)).toBeLessThanOrEqual(0);
        expect(broken).toEqual([]);
        await context.close();
      });
    }
  }
});

/**
 * The homes in Marathi (G-8): the gate was English-only, and the walk found 17×16 px "सर्व" and 39×20 px "जुने"
 * where the English words passed (B-20). The language of a signed-in page is the account's preference, so it is set
 * for the test and the account's own prefs are written back after, as the viewport matrix does (one worker).
 */
test.describe("homes in Marathi at 390 px", () => {
  for (const key of homeKeys) {
    test(`${key} · mr · ${homeOf(key)}`, async ({ browser, baseURL }) => {
      const user = await userOf(all[key]!.cookie);
      test.skip(!user, "no account behind this session");
      let prefs: Record<string, unknown> = {};
      try {
        prefs = JSON.parse(user!.prefs) as Record<string, unknown>;
      } catch {
        prefs = {};
      }
      await db.user.update({ where: { id: user!.id }, data: { prefs: JSON.stringify({ ...prefs, locale: "mr" }) } });
      try {
        const context = await contextFor(browser, all[key]!.cookie, { viewport: VIEWPORTS.iphone, theme: "light", locale: "mr" }, baseURL!);
        const page = await context.newPage();
        const broken = watchMarkup(page);
        const response = await page.goto(homeOf(key), { waitUntil: "networkidle" });
        expect(response?.status()).toBeLessThan(400);
        expect(await page.evaluate(() => document.documentElement.lang)).toBe("mr");
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
        const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(serious.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
        expect(await overflow(page)).toBeLessThanOrEqual(0);
        expect(await smallTargets(page)).toEqual([]);
        expect(broken).toEqual([]);
        await context.close();
      } finally {
        await db.user.update({ where: { id: user!.id }, data: { prefs: user!.prefs } });
      }
    });
  }
});
