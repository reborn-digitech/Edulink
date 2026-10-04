/**
 * @edulink/tokens mirrors globals.css, and this is what keeps them the same:
 * the stylesheet is parsed, the package is read, and any colour that differs
 * fails. Edit the stylesheet, then the package, then watch this pass.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { accents, canvas, frame, frameAccents, palette, wash } from "@edulink/tokens";

const css = readFileSync("src/app/globals.css", "utf8");

function block(selectorPattern: RegExp): Record<string, string> {
  const m = selectorPattern.exec(css);
  if (!m) throw new Error(`no block for ${selectorPattern}`);
  const body = css.slice(m.index + m[0].length, css.indexOf("}", m.index));
  const out: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) out[name!] = value!.toLowerCase();
  return out;
}

const KEYS: Record<string, string> = {
  bg: "bg", surface: "surface", "surface-muted": "surfaceMuted", "surface-sunken": "surfaceSunken", border: "border", "border-strong": "borderStrong",
  fg: "fg", "fg-muted": "fgMuted", "fg-subtle": "fgSubtle", "fg-inverse": "fgInverse", ok: "ok", "ok-soft": "okSoft", warn: "warn", "warn-soft": "warnSoft",
  danger: "danger", "danger-soft": "dangerSoft", info: "info", "info-soft": "infoSoft", "att-present": "attPresent", "att-present-soft": "attPresentSoft",
  "att-late": "attLate", "att-late-soft": "attLateSoft", "att-absent": "attAbsent", "att-absent-soft": "attAbsentSoft", "att-excused": "attExcused",
  "att-excused-soft": "attExcusedSoft", "att-pending": "attPending", "att-pending-soft": "attPendingSoft",
};
const ACCENT: Record<string, string> = { accent: "accent", "accent-strong": "accentStrong", "accent-soft": "accentSoft", "accent-ring": "accentRing", "accent-fg": "accentFg" };

describe("the tokens package mirrors globals.css", () => {
  it("light and dark palettes", () => {
    const light = block(/^:root\s*\{/m);
    const dark = block(/^\[data-theme="dark"\]\s*\{/m);
    for (const [cssName, key] of Object.entries(KEYS)) {
      expect(palette.light[key as keyof typeof palette.light], `light --${cssName}`).toBe(light[cssName]);
      expect(palette.dark[key as keyof typeof palette.dark], `dark --${cssName}`).toBe(dark[cssName]);
    }
  });
  it("the fifteen role accents in both themes, and the default accent is the teacher's", () => {
    const root = block(/^:root\s*\{/m);
    for (const [cssName, key] of Object.entries(ACCENT)) expect(accents.light.teacher[key as keyof typeof accents.light.teacher], `root --${cssName}`).toBe(root[cssName]);
    for (const family of ["teacher", "student", "parent", "admin", "driver", "librarian", "warden", "alumnus", "faculty", "hod", "exam_controller", "iqac", "tpo", "accounts", "recruiter"] as const) {
      const light = block(new RegExp(`^\\[data-role="${family}"\\]\\s*\\{`, "m"));
      const dark = block(new RegExp(`^\\[data-theme="dark"\\]\\[data-role="${family}"\\],\\n\\[data-theme="dark"\\] \\[data-role="${family}"\\]\\s*\\{`, "m"));
      for (const [cssName, key] of Object.entries(ACCENT)) {
        expect(accents.light[family][key as keyof typeof accents.light.teacher], `light ${family} --${cssName}`).toBe(light[cssName]);
        expect(accents.dark[family][key as keyof typeof accents.dark.teacher], `dark ${family} --${cssName}`).toBe(dark[cssName]);
      }
    }
  });
});

describe("the frame of a light page mirrors globals.css too", () => {
  const FRAME_KEYS: Record<string, keyof typeof frame.light> = {
    surface: "surface", "surface-muted": "surfaceMuted", "surface-sunken": "surfaceSunken", border: "border", "border-strong": "borderStrong",
    fg: "fg", "fg-muted": "fgMuted", "fg-subtle": "fgSubtle", "fg-inverse": "fgInverse",
  };
  const LIGHT = '^\\[data-theme="light"\\]:not\\(\\[data-contrast="high"\\]\\) ';
  it("the frame's surfaces and text, and its accents for every family, are dark's", () => {
    const chrome = block(new RegExp(LIGHT + "\\[data-chrome\\]\\s*\\{", "m"));
    for (const [cssName, key] of Object.entries(FRAME_KEYS)) expect(frame.light[key], `frame --${cssName}`).toBe(chrome[cssName]);
    for (const [cssName, key] of Object.entries(ACCENT)) expect(frameAccents.light.teacher[key as keyof typeof accents.light.teacher], `frame --${cssName}`).toBe(chrome[cssName]);
    for (const family of ["student", "parent", "admin", "driver", "librarian", "warden", "alumnus", "faculty", "hod", "exam_controller", "iqac", "tpo", "accounts", "recruiter"] as const) {
      const rule = block(new RegExp(LIGHT + `\\[data-role="${family}"\\] \\[data-chrome\\]\\s*\\{`, "m"));
      for (const [cssName, key] of Object.entries(ACCENT)) expect(frameAccents.light[family][key as keyof typeof accents.light.teacher], `frame ${family} --${cssName}`).toBe(rule[cssName]);
    }
  });
  it("the canvas behind the cards and the wash", () => {
    const shell = block(new RegExp(LIGHT + "\\[data-shell\\]\\s*\\{", "m"));
    expect(canvas.light).toBe(shell.bg);
    const m = new RegExp(LIGHT + "\\[data-wash\\]\\s*\\{[^}]*var\\(--accent\\) (\\d+)%[^}]*var\\(--bg\\) (\\d+)px", "m").exec(css);
    expect(m, "the wash rule").not.toBeNull();
    expect(Number(m![1]) / 100).toBe(wash.alpha);
    expect(Number(m![2])).toBe(wash.height);
  });
});
