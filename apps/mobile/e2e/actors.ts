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
export type Role = (typeof ROLES)[number];

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
export function rolesWithTokens(): { role: Role; token: string }[] {
  const out: { role: Role; token: string }[] = [];
  for (const role of ROLES) {
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
 * The screens opened from a row, a tile or a button rather than from the bar
 * or More, that need no id to open — so the section walk, the accessibility
 * gate and the UI/UX audit reach them too. (Screens that need an id — a
 * class, a post, a booking — are covered by their jest tests.)
 */
const EXTRA: Partial<Record<Role, string[]>> = {
  TEACHER: ["/worksheets", "/report-cards", "/remark-new", "/mentoring-setup", "/avatar"],
  STUDENT: ["/quiz?mode=revision", "/post-new", "/mentoring-setup", "/avatar"],
  PARENT: ["/link-child", "/mentoring-setup"],
  ADMIN: ["/invites", "/intake", "/directory-profile", "/class-new", "/timetable-editor", "/competition-new", "/post-new"],
  PRINCIPAL: ["/post-new"],
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
  opts: { theme: Theme; locale: Locale; viewport?: { width: number; height: number }; deviceScaleFactor?: number },
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
  await expect(page.getByRole("progressbar", { name: LOADING })).toHaveCount(0, { timeout });
  await page.waitForLoadState("networkidle", { timeout });
}
