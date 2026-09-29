import { existsSync } from "node:fs";
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * The three measurements the suites share: sideways scroll, touch targets
 * under 44 px, and serious or critical axe violations. And the screenshot
 * rule the README states: compared where this platform has a baseline,
 * written when the run was asked to write them, and otherwise left alone, so
 * a page new to the matrix does not fail CI for want of a Linux picture.
 */
export async function overflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

export async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const els = document.querySelectorAll<HTMLElement>('a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="radio"], [role="checkbox"], [role="tab"]');
    for (const el of els) {
      // A checkbox or a radio inside its own label is pressed by pressing the label: the row is the target, and
      // is what is measured. One with no label around it is measured as itself.
      const row = (el.tagName === "INPUT" && ["checkbox", "radio"].includes((el as HTMLInputElement).type) && el.closest("label")) || el;
      const r = row.getBoundingClientRect();
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

export async function seriousViolations(page: Page, label: string): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const softer = results.violations.filter((v) => !serious.includes(v));
  if (softer.length) console.log(`  ${label}: ${softer.map((v) => `${v.id}×${v.nodes.length}`).join(", ")}`);
  return serious.map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
}

/**
 * Everything pinned to the window is hidden before an element is pictured.
 * A picture of an element taller than the window is taken in strips, and
 * the header, the bottom bar and the "Offline" banner that comes and goes
 * under load were drawn across each strip: the record's form failed eleven
 * comparisons on 2026-09-30 with nothing of the form having changed.
 */
export async function hidePinned(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      const position = getComputedStyle(el).position;
      if (position === "fixed" || position === "sticky") el.style.setProperty("visibility", "hidden", "important");
    }
  });
}

export async function screenshotWhereBaselined(target: Page | Locator, name: string, info: TestInfo): Promise<void> {
  const writing = info.config.updateSnapshots !== "missing" && info.config.updateSnapshots !== "none";
  if (!writing && !existsSync(info.snapshotPath(name))) {
    info.annotations.push({ type: "no baseline", description: `${name}: no baseline on this platform; not compared` });
    return;
  }
  await expect(target).toHaveScreenshot(name);
}
