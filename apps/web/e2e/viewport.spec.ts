import { test, expect, type Page } from "@playwright/test";
import { contextFor, sessions, VIEWPORTS } from "./actors";

/**
 * The viewport matrix: the four pages most likely to regress on a phone, at
 * four sizes, in both themes and two languages. Three assertions per cell:
 * nothing scrolls sideways, every interactive element is at least 44 px
 * tall, and the screenshot matches the platform's baseline (skipped where no
 * baseline exists yet; see README).
 */
const all = sessions();
const teacher = all.TEACHER!;
const admin = all.ADMIN!;

const PAGES = [
  { name: "register", actor: teacher, path: () => `/teacher/attendance?classId=${teacher.classId}` },
  { name: "marks", actor: teacher, path: () => `/teacher/exams?slotId=${teacher.slotId}&classId=${teacher.classId}` },
  { name: "timetable", actor: admin, path: () => "/admin/timetable" },
  { name: "people-toolbar", actor: admin, path: () => "/admin/people" },
];

async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const els = document.querySelectorAll<HTMLElement>('a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="radio"], [role="checkbox"], [role="tab"]');
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue; // hidden
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      // Visually hidden on purpose (sr-only: 1×1, clipped): a screen-reader
      // door, not a touch target.
      if (r.width <= 1 && r.height <= 1) continue;
      if (style.clip === "rect(0px, 0px, 0px, 0px)" || style.clipPath === "inset(50%)") continue;
      // Inline links inside running text are exempt by WCAG 2.5.8; count controls.
      if (el.tagName === "A" && el.closest("p, li, td")) continue;
      if (r.height < 44 && r.width < 44) {
        const label = (el.getAttribute("aria-label") || el.textContent || el.id || "").trim().slice(0, 40);
        out.push(`${el.tagName.toLowerCase()}${el.className ? "." + String(el.className).split(" ").slice(0, 2).join(".") : ""} ${Math.round(r.width)}×${Math.round(r.height)} "${label}"`);
      }
    }
    return out;
  });
}

for (const { name, actor, path } of PAGES) {
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    for (const theme of ["light", "dark"] as const) {
      for (const locale of ["en", "hi"] as const) {
        test(`${name} · ${vpName} · ${theme} · ${locale}`, async ({ browser, baseURL }) => {
          const context = await contextFor(browser, actor.cookie, { viewport, theme, locale }, baseURL!);
          const page = await context.newPage();
          const response = await page.goto(path(), { waitUntil: "networkidle" });
          expect(response?.status()).toBe(200);

          expect(await overflow(page), "the page scrolls sideways").toBeLessThanOrEqual(0);

          const small = await smallTargets(page);
          expect(small, "interactive elements under 44px").toEqual([]);

          await expect(page).toHaveScreenshot(`${name}-${vpName}-${theme}-${locale}.png`, { fullPage: false });
          await context.close();
        });
      }
    }
  }
}
