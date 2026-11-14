/**
 * Colours and focus on the web (testing analysis of 13 November 2026), computed from the stylesheet's own numbers with
 * WCAG's relative luminance, as tests/tokens-drift.test.ts parses it:
 *
 *   TA-115 — dark with high contrast drew every status colour at 2.1 to 2.9:1 on black.
 *   TA-230 — white on dark's pale status fills (a pressed register mark, the offline bar, five done ticks).
 *   TA-231 — the light theme's focus outline, the role's pale ring, under 3:1 on white and the canvas.
 *   TA-330, TA-402 — the page header's muted back link and description on the role's wash, 3.8 to 4.4:1.
 *   TA-399 — nothing kept a focused control out from under the phone's top and bottom bars.
 *   TA-401 — a field in error looked the same focused and not.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fieldClass } from "@/components/ui/field-class";

const css = readFileSync("src/app/globals.css", "utf8");

function block(selectorPattern: RegExp): Record<string, string> {
  const m = selectorPattern.exec(css);
  if (!m) throw new Error(`no block for ${selectorPattern}`);
  const body = css.slice(m.index + m[0].length, css.indexOf("}", m.index));
  const out: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) out[name!] = value!.toLowerCase();
  return out;
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: [number, number, number]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a: string | [number, number, number], b: string | [number, number, number]) => {
  const la = luminance(typeof a === "string" ? rgb(a) : a);
  const lb = luminance(typeof b === "string" ? rgb(b) : b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};
/** color-mix(in srgb, a p%, b), as the wash draws its top. */
const mix = (a: string, b: string, p: number) => rgb(a).map((v, i) => Math.round(v * p + rgb(b)[i]! * (1 - p))) as [number, number, number];

const root = block(/^:root\s*\{/m);
const dark = block(/^\[data-theme="dark"\]\s*\{/m);
const high = block(/^\[data-contrast="high"\]\s*\{/m);
const darkHigh = block(/^\[data-theme="dark"\]\[data-contrast="high"\]\s*\{/m);
/** The cascade for dark with high contrast, in source order: dark, then high contrast, then the pair's own block. */
const resolvedDarkHigh = { ...root, ...dark, ...high, ...darkHigh };
const resolvedLightHigh = { ...root, ...high };
const STATUS = ["ok", "warn", "danger", "info", "att-present", "att-late", "att-absent", "att-excused"] as const;
const SOFT: Record<string, string> = { ok: "ok-soft", warn: "warn-soft", danger: "danger-soft", info: "info-soft", "att-present": "att-present-soft", "att-late": "att-late-soft", "att-absent": "att-absent-soft", "att-excused": "att-excused-soft" };
const FAMILIES = ["teacher", "student", "parent", "admin", "driver", "librarian", "warden", "alumnus", "faculty", "hod", "exam_controller", "iqac", "tpo", "accounts", "recruiter"] as const;
const roleBlock = (family: string) => block(new RegExp(`^\\[data-role="${family}"\\]\\s*\\{`, "m"));

describe("TA-115: dark with high contrast", () => {
  it("TA-115: every status and attendance colour is at least 7:1 on the page and on its own fill", () => {
    for (const name of STATUS) {
      const colour = resolvedDarkHigh[name]!;
      expect(ratio(colour, resolvedDarkHigh.surface!), `--${name} ${colour} on --surface ${resolvedDarkHigh.surface}`).toBeGreaterThanOrEqual(7);
      expect(ratio(colour, resolvedDarkHigh[SOFT[name]!]!), `--${name} on --${SOFT[name]}`).toBeGreaterThanOrEqual(7);
    }
    expect(ratio(resolvedDarkHigh["danger-fg"]!, resolvedDarkHigh.danger!), "--danger-fg on --danger").toBeGreaterThanOrEqual(4.5);
  });

  it("TA-115: light high contrast is unchanged, and still 7:1", () => {
    for (const name of STATUS) expect(ratio(resolvedLightHigh[name]!, resolvedLightHigh.surface!), `--${name}`).toBeGreaterThanOrEqual(7);
  });
});

describe("TA-230: text on a filled status colour", () => {
  it("TA-230: --status-fg reads at 4.5:1 or better on every status fill, in light, dark and both high contrasts", () => {
    for (const [theme, tokens] of [
      ["light", root],
      ["dark", { ...root, ...dark }],
      ["light high", resolvedLightHigh],
      ["dark high", resolvedDarkHigh],
    ] as const) {
      expect(tokens["status-fg"], `${theme} has --status-fg`).toBeDefined();
      for (const name of STATUS) expect(ratio(tokens["status-fg"]!, tokens[name]!), `${theme}: --status-fg on --${name}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(css).toMatch(/--color-status-fg:\s*var\(--status-fg\)/);
  });

  it("TA-230: the six places that drew white on a status fill draw --status-fg", () => {
    for (const file of [
      "src/app/(app)/teacher/attendance/register.tsx",
      "src/components/app-runtime.tsx",
      "src/app/(app)/admin/page.tsx",
      "src/app/(app)/admin/welcome-banner.tsx",
      "src/app/(app)/admin/calendar/year-panel.tsx",
      "src/app/register/wizard.tsx",
    ]) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/bg-(ok|warn|danger|info)\b[^"]*text-white|color:\s*"#fff"/);
    }
  });
});

describe("TA-231: the focus outline in the light theme", () => {
  it("TA-231: the light theme outlines focus in --accent-strong, at least 3:1 on white, the canvas and the wash for all fifteen roles", () => {
    expect(css).toMatch(/\[data-theme="light"\]:not\(\[data-contrast="high"\]\) :focus-visible \{\s*outline-color: var\(--accent-strong\);/);
    for (const family of FAMILIES) {
      const role = roleBlock(family);
      const ring = role["accent-strong"]!;
      for (const [where, behind] of [
        ["white", "#ffffff"],
        ["canvas", "#eef1f8"],
      ] as const) {
        expect(ratio(ring, behind), `${family} ${ring} on ${where}`).toBeGreaterThanOrEqual(3);
      }
      expect(ratio(ring, mix(role.accent!, "#eef1f8", 0.22)), `${family} on the wash`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("TA-330 and TA-402: the page header on the wash", () => {
  it("TA-330: the header's muted text is at least 4.5:1 on the top of every role's wash, and on white", () => {
    const header = block(/^\[data-theme="light"\]:not\(\[data-contrast="high"\]\) \[data-wash\] \[data-page-header\]\s*\{/m);
    expect(header["fg-muted"]).toBeDefined();
    for (const family of FAMILIES) {
      const top = mix(roleBlock(family).accent!, "#eef1f8", 0.22);
      expect(ratio(header["fg-muted"]!, top), `${family}: --fg-muted on the wash`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(header["fg-subtle"]!, top), `${family}: --fg-subtle on the wash`).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(header["fg-muted"]!, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("TA-402: the page header and its back link carry the attribute the rule reads", () => {
    const source = readFileSync("src/components/ui/page-header.tsx", "utf8");
    expect(source).toMatch(/<header data-page-header/);
    expect(source).toMatch(/<Link href=\{href\} data-page-header/);
  });
});

describe("TA-399: focus below the bars", () => {
  it("TA-399: below the desk's width the page keeps a scroll padding the height of the top and bottom bars", () => {
    expect(css).toMatch(/@media \(max-width: 1023\.98px\) \{\s*html \{\s*scroll-padding-top: calc\(3\.5rem[^;]*;\s*scroll-padding-bottom: calc\(4\.5rem/);
    // The register's rows sit under its sticky summary as well, so they keep a margin of their own.
    expect(readFileSync("src/app/(app)/teacher/attendance/register.tsx", "utf8")).toMatch(/scroll-mt-\[[^"]*"[\s\S]{0,400}data-testid="register-row"/);
  });
});

describe("TA-401: a field in error shows its focus", () => {
  it("TA-401: the invalid branch changes on focus", () => {
    const invalid = fieldClass(undefined, true).split(/\s+/);
    expect(invalid.some((c) => c.startsWith("focus:ring") || c.startsWith("focus-visible:ring"))).toBe(true);
    const focused = invalid.filter((c) => c.startsWith("focus:") && c !== "focus:outline-none");
    expect(focused.length, "a focus change beyond removing the outline").toBeGreaterThan(0);
  });
});
