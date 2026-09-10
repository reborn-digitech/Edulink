import { test, expect } from "@playwright/test";
import { allRoutesFor, contextFor, rolesWithTokens, settle, type Role } from "./actors";

/**
 * The UI/UX audit on the web target, measured rather than eyeballed, for
 * every screen a role can open from the bar or from More:
 *
 *   - nothing scrolls sideways at 320 px (the narrowest phone in use) or 390;
 *   - every control a thumb presses is at least 44 px tall (Apple's floor;
 *     the app's own token is 48);
 *   - no tab label is cut off, in English, Hindi or Marathi — a clipped label
 *     is the one truncation that hides which screen you are on.
 *
 * Other ellipsised text (a long pupil name in a row) is printed, not failed:
 * a row that ends in "…" is a choice; a tab that does is a bug.
 */
const actors = rolesWithTokens();
if (actors.length === 0) test.skip("no role tokens in the environment (EDULINK_TOKEN_*)", () => {});

const WIDTHS = [
  { name: "320", width: 320, height: 640 },
  { name: "390", width: 390, height: 844 },
] as const;

type Measure = { overflow: number; short: string[]; clippedTabs: string[]; clippedOther: string[] };

async function measure(page: import("@playwright/test").Page): Promise<Measure> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const overflow = root.scrollWidth - root.clientWidth;
    const short: string[] = [];
    const controls = document.querySelectorAll<HTMLElement>('[role="button"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"], a[href], input, textarea');
    for (const el of controls) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || style.pointerEvents === "none") continue;
      if (r.height < 44) {
        const label = (el.getAttribute("aria-label") || el.innerText || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 40);
        short.push(`${el.getAttribute("role") ?? el.tagName.toLowerCase()} ${Math.round(r.width)}×${Math.round(r.height)} "${label}"`);
      }
    }
    const clippedTabs: string[] = [];
    const clippedOther: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("div, span")) {
      if (el.children.length > 0) continue;
      const style = getComputedStyle(el);
      if (style.textOverflow !== "ellipsis" || el.scrollWidth <= el.clientWidth + 1) continue;
      const text = el.innerText.trim().slice(0, 40);
      if (!text) continue;
      if (el.closest('[role="tab"]')) clippedTabs.push(text);
      else clippedOther.push(text);
    }
    return { overflow, short, clippedTabs, clippedOther };
  });
}

for (const { role, token } of actors) {
  test.describe(`${role} · UI/UX audit`, () => {
    for (const route of allRoutesFor(role as Role)) {
      for (const w of WIDTHS) {
        test(`${route} · ${w.name}px`, async ({ browser }) => {
          const context = await contextFor(browser, token, { theme: "light", locale: "en" });
          const page = await context.newPage();
          await page.setViewportSize({ width: w.width, height: w.height });
          const response = await page.goto(route, { waitUntil: "networkidle" });
          expect(response?.status(), `${route} answered ${response?.status()}`).toBeLessThan(400);
          await settle(page);
          const m = await measure(page);
          if (m.clippedOther.length) console.log(`  ${role} ${route} ${w.name}px ellipsised: ${m.clippedOther.slice(0, 5).join(" | ")}`);
          expect(m.overflow, `${route} scrolls sideways at ${w.name}px`).toBeLessThanOrEqual(0);
          expect(m.short, `${route} has controls under 44px at ${w.name}px`).toEqual([]);
          expect(m.clippedTabs, `${route} clips a tab label at ${w.name}px`).toEqual([]);
          await context.close();
        });
      }
    }
    for (const locale of ["hi", "mr"] as const) {
      test(`the bar fits in ${locale} at 320px`, async ({ browser }) => {
        const context = await contextFor(browser, token, { theme: "light", locale });
        const page = await context.newPage();
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto("/", { waitUntil: "networkidle" });
        await settle(page);
        const m = await measure(page);
        expect(m.clippedTabs, `a tab label is cut off in ${locale}`).toEqual([]);
        expect(m.overflow).toBeLessThanOrEqual(0);
        await context.close();
      });
    }
  });
}
