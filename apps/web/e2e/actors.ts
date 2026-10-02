import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser, BrowserContext } from "@playwright/test";
import type { Sessions } from "./global-setup";

export const VIEWPORTS = {
  "android-small": { width: 360, height: 800 },
  iphone: { width: 390, height: 844 },
  "android-large": { width: 412, height: 915 },
  tablet: { width: 768, height: 1024 },
} as const;

export function sessions(): Sessions {
  return JSON.parse(readFileSync(join(__dirname, ".sessions.json"), "utf8")) as Sessions;
}

/**
 * A browser context signed in as one actor, in one theme and one language.
 * Theme goes through the same localStorage key the theme script reads, so the
 * first paint is already right; language through the cookie the server reads.
 * `live: true` lets the page hold its event stream (see below); the default
 * refuses it.
 */
export async function contextFor(
  browser: Browser,
  cookie: string,
  opts: { viewport: { width: number; height: number }; theme: "light" | "dark"; locale: "en" | "hi"; live?: boolean },
  baseURL: string,
): Promise<BrowserContext> {
  const url = new URL(baseURL);
  const [name, value] = cookie.split("=") as [string, string];
  const context = await browser.newContext({
    viewport: opts.viewport,
    colorScheme: opts.theme,
    locale: opts.locale === "hi" ? "hi-IN" : "en-IN",
    reducedMotion: "reduce",
    isMobile: opts.viewport.width < 768,
    hasTouch: opts.viewport.width < 768,
  });
  await context.addCookies([
    { name, value, domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "edulink_locale", value: opts.locale, domain: url.hostname, path: "/", sameSite: "Lax" },
  ]);
  // A production build names the cookie with the __Host- prefix, which a
  // browser takes only as Secure; a dev server reads the plain name above.
  // The same token under both, so the suite runs against either. By domain
  // and path, not `url`: Chromium refuses a Secure cookie given with an
  // http:// url ("Invalid cookie fields"), and a .catch here once swallowed
  // that, so every page of CI's production-server run was the login page
  // (run 36851296484). Chromium sends a Secure cookie to http://localhost.
  await context.addCookies([{ name: `__Host-${name}`, value, domain: url.hostname, path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
  // The pages that hear the event stream (the register, the substitution
  // board, a remark thread) hold one EventSource open for as long as the tab
  // is visible, and Playwright's "networkidle" counts that as traffic, so a
  // goto of the board never settled and the axe walk timed out on
  // /admin/substitutions (run 36959968186). The walk is of what the pages
  // draw, not of what a colleague's action does to them (the live behaviour
  // was checked by hand in two tabs); the stream is refused here, the browser
  // retries it every few seconds, and the page is a page again. The one spec
  // that is about the live behaviour (flow-live-register.spec.ts) asks for
  // `live: true`, keeps the stream, and never waits for "networkidle".
  if (!opts.live) await context.route("**/api/v1/events", (route) => route.abort("connectionrefused"));
  await context.addInitScript((theme: string) => {
    try {
      window.localStorage.setItem("edulink.appearance", JSON.stringify({ theme, motion: "reduced" }));
    } catch {
      /* storage blocked: the OS setting applies */
    }
  }, opts.theme);
  return context;
}
