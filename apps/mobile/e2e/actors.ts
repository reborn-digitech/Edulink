import { expect, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";
import type { RoleCode } from "@edulink/contracts";
import { lookup, type Locale } from "@edulink/i18n";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { MENU, TABS } from "../src/lib/nav";

/**
 * Who the battery signs in as, and how.
 *
 * The web target keeps the session token in localStorage under the same key
 * the app's key store reads (KEYS.token in src/lib/storage.ts) and the
 * language under KEYS.locale; both are set with an init script before the
 * first navigation, so the app's own SessionProvider finds them on start and
 * loads /api/v1/me the way it would on a phone that was already signed in.
 *
 * Tokens come from the environment, minted on the ZZ Northgate fixture by
 * the web's `npm run zz:token -- TEACHER` (also PARENT, STUDENT, ADMIN,
 * PRINCIPAL, EXPERT). A role
 * whose token is absent is skipped with a printed line, never failed.
 */
export const BASE = process.env.BASE ?? "http://localhost:8081";
export const API = process.env.API ?? "http://localhost:3000";

export const ROLES = ["TEACHER", "PARENT", "STUDENT", "ADMIN", "PRINCIPAL", "EXPERT"] as const satisfies readonly RoleCode[];
/**
 * Every role the phone signs in as (B-22, campaign 2026-10-04): the six above
 * and the eleven the walk of 4 October found no suite reaching — the module
 * staff and the alumnus at ZZ Northgate, the college's six at ZZ Vidya
 * College, and the recruiter (`npm run zz:token -- FACULTY` and so on). The
 * section walk and the accessibility gate take all of them; the screenshot,
 * store and perf suites keep to ROLES.
 */
export const ALL_ROLES = [...ROLES, "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "RECRUITER"] as const satisfies readonly RoleCode[];
export type Role = (typeof ALL_ROLES)[number];

export const LOCALES = ["en", "hi", "mr"] as const satisfies readonly Locale[];
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** iPhone-sized, the same entry as the web's VIEWPORTS.iphone. */
export const PHONE = { width: 390, height: 844 } as const;

export function tokenFor(role: Role): string | null {
  const value = process.env[`EDULINK_TOKEN_${role}`]?.trim();
  return value ? value : null;
}

const announced = new Set<string>();

/** The roles this run can sign in as; the others are named once on stdout. */
export function rolesWithTokens(roles: readonly Role[] = ROLES): { role: Role; token: string }[] {
  const out: { role: Role; token: string }[] = [];
  for (const role of roles) {
    const token = tokenFor(role);
    if (token) {
      out.push({ role, token });
      continue;
    }
    if (!announced.has(role)) {
      announced.add(role);
      console.log(`  skipping ${role}: EDULINK_TOKEN_${role} is not set (mint one with \`cd apps/web && npm run --silent zz:token -- ${role}\`)`);
    }
  }
  return out;
}

/**
 * Every route in this role's tab bar — "index" is "/", the rest "/<name>" —
 * plus More and the bell, which every role reaches from the bar.
 */
export function routesFor(role: Role): string[] {
  const tabs = TABS[role].map((tab) => (tab.name === "index" ? "/" : `/${tab.name}`));
  return Array.from(new Set([...tabs, "/more", "/notifications"]));
}

/**
 * The bar's routes and every screen the role's More sheet opens in the app
 * (the entries that open the web are not routes here). The accessibility
 * gate walks this set; the screenshot set keeps to the bar.
 */
export function allRoutesFor(role: Role): string[] {
  const more = MENU[role].flatMap((item) => (item.screen ? [item.screen.replace("/(app)", "")] : []));
  return Array.from(new Set([...routesFor(role), ...more, ...(EXTRA[role] ?? [])]));
}

/**
 * The module a route of this role's bar or More hangs on, if any (B-22): the
 * app hides such an entry while the school has the module off, so a walk
 * that opens it anyway meets the server's MODULE_OFF alert, which is right
 * and is not the screen's failure. A route reached from both a plain entry
 * and a module's entry hangs on nothing.
 */
export function moduleOf(role: Role, route: string): string | null {
  const entries = [
    ...TABS[role].map((tab) => ({ route: tab.name === "index" ? "/" : `/${tab.name}`, module: tab.module ?? null })),
    ...MENU[role].flatMap((item) => (item.screen ? [{ route: item.screen.replace("/(app)", ""), module: item.module ?? null }] : [])),
  ].filter((e) => e.route === route);
  if (entries.length === 0 || entries.some((e) => e.module === null)) return null;
  return entries[0]!.module;
}

const modulesSeen = new Map<string, string[]>();
/**
 * What /api/v1/me says is switched on for this session (a family's: its children's schools'), read once per
 * token; null when the server did not say (a restart, a slow answer), which walks the route rather than skip it.
 */
export async function modulesFor(token: string): Promise<string[] | null> {
  const seen = modulesSeen.get(token);
  if (seen) return seen;
  try {
    const r = await fetch(`${API}/api/v1/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const modules = ((await r.json()) as { modules?: string[] }).modules ?? [];
    modulesSeen.set(token, modules);
    return modules;
  } catch {
    return null;
  }
}

/** Why this route is not walked for this session, or null when it is: its module is off. */
export async function moduleOffReason(role: Role, route: string, token: string): Promise<string | null> {
  const module = moduleOf(role, route);
  if (!module) return null;
  const on = await modulesFor(token);
  return on === null || on.includes(module) ? null : `${module} is off for ${role}; the app hides ${route}`;
}

/**
 * The screens opened from a row, a tile or a button rather than from the bar
 * or More, that need no id to open — so the section walk, the accessibility
 * gate and the UI/UX audit reach them too. (Screens that need an id — a
 * class, a post, a booking — are covered by their jest tests.)
 */
const EXTRA: Partial<Record<Role, string[]>> = {
  TEACHER: ["/worksheets", "/report-cards", "/remark-new", "/mentoring-setup", "/avatar", "/contribution"],
  STUDENT: ["/quiz?mode=revision", "/post-new", "/mentoring-setup", "/avatar"],
  PARENT: ["/link-child", "/mentoring-setup"],
  ADMIN: ["/invites", "/intake", "/directory-profile", "/class-new", "/timetable-editor", "/competition-new", "/post-new", "/fees-dues", "/fee-claims", "/messaging-new"],
  PRINCIPAL: ["/post-new", "/fees-dues"],
  EXPERT: ["/avatar"],
};

export const DICTIONARIES = { en, hi, mr } as const;

/** One dictionary's word for a key, or a thrown error naming the gap. */
export function word(locale: Locale, key: string): string {
  const found = lookup(DICTIONARIES[locale] as Parameters<typeof lookup>[0], key);
  if (!found) throw new Error(`${locale} has no ${key}`);
  return found;
}

/** The labels of this role's tab bar, More last, in one language. */
/**
 * Words on a screen that are a key of the dictionary and not a sentence. A
 * release bundles only the keys scripts/i18n-subset.cjs finds the phone can
 * ask for, and the translator answers a key it does not hold with the key
 * itself: on the exported web target, which is such a bundle, one left out
 * shows here and on no other check.
 */
const KEYS = new Set<string>();
(function keysOf(tree: unknown, prefix = ""): void {
  for (const [name, value] of Object.entries(tree as Record<string, unknown>)) {
    if (typeof value === "string") KEYS.add(prefix + name);
    else keysOf(value, `${prefix}${name}.`);
  }
})(en);

export function rawKeys(text: string): string[] {
  return [...new Set(text.split(/\s+/).map((part) => part.replace(/[.,:;!?()]+$/, "")).filter((part) => KEYS.has(part)))];
}

export function tabLabels(role: Role, locale: Locale): string[] {
  return [...TABS[role].map((tab) => tab.labelKey), "nav.more"].map((key) => word(locale, key));
}

/**
 * The bottom tab bar: the tablist that holds the More tab. Screens may carry
 * a tablist of their own (the family's Due / Handed in / Marked segments),
 * so the role alone is not enough.
 */
export function tabBar(page: Page, role: Role, locale: Locale): Locator {
  return page.getByRole("tablist").filter({ has: page.getByRole("tab", { name: word(locale, "nav.more"), exact: true }) });
}

/** "/" → "index", "/attendance" → "attendance", "/messages/room" → "messages-room". */
export function slugFor(route: string): string {
  const s = route.replace(/^\/+/, "").replace(/\//g, "-");
  return s === "" ? "index" : s;
}

/**
 * A browser context signed in as one actor, in one theme and one language,
 * at phone size with touch. The colour scheme goes through the browser's own
 * prefers-color-scheme, which is what react-native-web's useColorScheme
 * reads; the language through the key store and the browser locale both, so
 * the first paint and the saved preference agree.
 */
export async function contextFor(
  browser: Browser,
  token: string,
  opts: { theme: Theme; locale: Locale; viewport?: { width: number; height: number }; deviceScaleFactor?: number; live?: boolean },
): Promise<BrowserContext> {
  const context = await browser.newContext({
    baseURL: BASE,
    viewport: opts.viewport ?? PHONE,
    deviceScaleFactor: opts.deviceScaleFactor,
    isMobile: true,
    hasTouch: true,
    colorScheme: opts.theme,
    reducedMotion: "reduce",
    locale: `${opts.locale}-IN`,
  });
  await context.addInitScript(
    ({ token, locale }: { token: string; locale: string }) => {
      try {
        window.localStorage.setItem("edulink.session.token", token);
        window.localStorage.setItem("edulink.locale", locale);
      } catch {
        /* storage blocked: the app shows the sign-in screen, and the test says so */
      }
    },
    { token, locale: opts.locale },
  );
  // The live event stream never goes quiet, so "networkidle" never comes on a screen that listens (the
  // substitution board timed out, B-22). Refused as the web's suites refuse it; a spec about the stream passes `live`.
  if (!opts.live) await context.route("**/api/v1/events", (route) => route.abort("connectionrefused"));
  return context;
}

/**
 * Expo's development overlay (#error-overlay) sits over the whole page after
 * an uncaught error and swallows every tap. It is not the product — a
 * production web build has none — so a spec that needs the screen beneath
 * removes it and reports the error it came with through page.on("pageerror").
 * Returns whether there was one to remove.
 */
export async function dismissDevOverlay(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const el = document.getElementById("error-overlay");
    if (!el) return false;
    el.remove();
    return true;
  });
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The Loading state's accessible name, in any of the three languages. */
export const LOADING = new RegExp(`^(${LOCALES.map((l) => escape(word(l, "ui.loading"))).join("|")})$`);

/**
 * Wait for a screen's data: the network quiet, and no Loading state left on
 * the page. Every Loading is role=progressbar named "Loading…" (see
 * src/components/states.tsx); a screen's own meter — the practice page's
 * weekly goal is one — is a progressbar too, and is not waited on.
 */
export async function settle(page: Page, timeout = 30_000): Promise<void> {
  await page.waitForLoadState("networkidle", { timeout });
  // "networkidle" fires once per navigation, and can fire while the bundle is still booting, before the app has
  // asked for /api/v1/me: nothing is drawn yet, so "no Loading" held and the heading check failed in under a
  // second (the run of 4 October 2026 under a loaded machine, with the event stream refused). Wait for the app to
  // draw its header, an alert or the sign-in form first.
  await expect(page.getByRole("heading").or(page.getByRole("alert")).first()).toBeVisible({ timeout });
  await expect(page.getByRole("progressbar", { name: LOADING })).toHaveCount(0, { timeout });
  await page.waitForLoadState("networkidle", { timeout });
}
