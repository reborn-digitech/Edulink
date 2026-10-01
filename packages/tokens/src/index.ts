/**
 * @edulink/tokens — the design system's numbers, once.
 *
 * The web's globals.css is the ORIGIN of these values and stays hand-edited:
 * a stylesheet with comments about contrast ratios is a better home for a
 * palette than a TypeScript object. This package mirrors it for the phone,
 * and a test in the web app reads globals.css and refuses a drift, so the two
 * cannot disagree for longer than one test run. Colours are hex; sizes are in
 * points (the web's rem × 16); the role accents are the four families the
 * web keys on data-role, in both themes.
 */
export type Theme = "light" | "dark";
export type RoleFamily = "teacher" | "student" | "parent" | "admin";

export type Palette = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  surfaceSunken: string;
  border: string;
  borderStrong: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  fgInverse: string;
  ok: string;
  okSoft: string;
  warn: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  attPresent: string;
  attPresentSoft: string;
  attLate: string;
  attLateSoft: string;
  attAbsent: string;
  attAbsentSoft: string;
  attExcused: string;
  attExcusedSoft: string;
  attPending: string;
  attPendingSoft: string;
};

export type Accent = { accent: string; accentStrong: string; accentSoft: string; accentRing: string; accentFg: string };

export const palette: Record<Theme, Palette> = {
  light: {
    bg: "#f6f7fb", surface: "#ffffff", surfaceMuted: "#f1f3f8", surfaceSunken: "#e9edf5",
    border: "#e0e5ef", borderStrong: "#c8d0e0",
    fg: "#101420", fgMuted: "#57607a", fgSubtle: "#5f6983", fgInverse: "#ffffff",
    ok: "#15803d", okSoft: "#ecfdf3", warn: "#b45309", warnSoft: "#fffbeb", danger: "#be123c", dangerSoft: "#fff1f2", info: "#0369a1", infoSoft: "#f0f9ff",
    attPresent: "#15803d", attPresentSoft: "#ecfdf3", attLate: "#b45309", attLateSoft: "#fffbeb", attAbsent: "#be123c", attAbsentSoft: "#fff1f2",
    attExcused: "#0369a1", attExcusedSoft: "#f0f9ff", attPending: "#7b849c", attPendingSoft: "#f1f3f8",
  },
  dark: {
    bg: "#0b0e15", surface: "#141924", surfaceMuted: "#1b2231", surfaceSunken: "#232c3d",
    border: "#2a3446", borderStrong: "#3b475e",
    fg: "#edf0f7", fgMuted: "#a6b0c4", fgSubtle: "#8b95aa", fgInverse: "#0b0e15",
    ok: "#4ade80", okSoft: "#0f2a1c", warn: "#fbbf24", warnSoft: "#2a2010", danger: "#fb7185", dangerSoft: "#2d1219", info: "#38bdf8", infoSoft: "#0c2436",
    attPresent: "#4ade80", attPresentSoft: "#0f2a1c", attLate: "#fbbf24", attLateSoft: "#2a2010", attAbsent: "#fb7185", attAbsentSoft: "#2d1219",
    attExcused: "#38bdf8", attExcusedSoft: "#0c2436", attPending: "#7d879c", attPendingSoft: "#1b2231",
  },
};

/** The default accent (the web's :root) is the teacher family's. */
export const accents: Record<Theme, Record<RoleFamily, Accent>> = {
  light: {
    teacher: { accent: "#2563eb", accentStrong: "#1d4ed8", accentSoft: "#eff6ff", accentRing: "#60a5fa", accentFg: "#ffffff" },
    student: { accent: "#15803d", accentStrong: "#166534", accentSoft: "#f0fdf4", accentRing: "#4ade80", accentFg: "#ffffff" },
    parent: { accent: "#7e22ce", accentStrong: "#6b21a8", accentSoft: "#faf5ff", accentRing: "#c084fc", accentFg: "#ffffff" },
    admin: { accent: "#475569", accentStrong: "#334155", accentSoft: "#f8fafc", accentRing: "#94a3b8", accentFg: "#ffffff" },
  },
  dark: {
    teacher: { accent: "#60a5fa", accentStrong: "#93c5fd", accentSoft: "#10203a", accentRing: "#3b82f6", accentFg: "#06121f" },
    student: { accent: "#4ade80", accentStrong: "#86efac", accentSoft: "#0f2a1c", accentRing: "#22c55e", accentFg: "#04140b" },
    parent: { accent: "#c084fc", accentStrong: "#d8b4fe", accentSoft: "#221037", accentRing: "#a855f7", accentFg: "#14061f" },
    admin: { accent: "#94a3b8", accentStrong: "#cbd5e1", accentSoft: "#1e2635", accentRing: "#64748b", accentFg: "#0b0e15" },
  },
};

/**
 * The frame of a light page: the menu on a desk, the bars on a phone. Light
 * was one white sheet — the page three per cent off the cards — where dark
 * has two clear tones, and the owner chose on 30 Sep 2026 to give light the
 * same two: the frame in dark's navy, the page behind the cards tinted so
 * the white cards stand off it, and a wash of the role's colour fading
 * behind the page title. In dark the frame is the surface, as it was; high
 * contrast keeps its black on white and never takes the frame. The frame's
 * accents are dark's, whose pairs are checked for contrast on navy.
 */
export type Frame = Pick<Palette, "surface" | "surfaceMuted" | "surfaceSunken" | "border" | "borderStrong" | "fg" | "fgMuted" | "fgSubtle" | "fgInverse">;

export const frame: Record<Theme, Frame> = {
  light: {
    surface: "#141924", surfaceMuted: "#1b2231", surfaceSunken: "#232c3d", border: "#2a3446", borderStrong: "#3b475e",
    fg: "#edf0f7", fgMuted: "#a6b0c4", fgSubtle: "#8b95aa", fgInverse: "#0b0e15",
  },
  dark: {
    surface: "#141924", surfaceMuted: "#1b2231", surfaceSunken: "#232c3d", border: "#2a3446", borderStrong: "#3b475e",
    fg: "#edf0f7", fgMuted: "#a6b0c4", fgSubtle: "#8b95aa", fgInverse: "#0b0e15",
  },
};

/** The frame's accents: dark's in both themes. */
export const frameAccents: Record<Theme, Record<RoleFamily, Accent>> = { light: accents.dark, dark: accents.dark };

/** The page behind the cards inside the signed-in shell (the web's --bg there): tinted in light, dark's own in dark. */
export const canvas: Record<Theme, string> = { light: "#eef1f8", dark: "#0b0e15" };

/** How much of the role's colour the wash behind a page title starts with, fading to the canvas over `washHeight` points. */
export const wash = { alpha: 0.22, height: 260 } as const;

/** Which accent family a role uses: the principal shares the admin's, an expert the teacher's. */
export function familyFor(role: string | null | undefined): RoleFamily {
  switch (role) {
    case "STUDENT":
      return "student";
    case "PARENT":
      return "parent";
    case "ADMIN":
    case "PRINCIPAL":
      return "admin";
    default:
      return "teacher";
  }
}

/** Radii in points: the web's 0.5 / 0.875 / 1.25 / 1.75 rem. */
export const radius = { sm: 8, md: 14, lg: 20, xl: 28 } as const;

/** A 4-point spacing scale, the same steps Tailwind gave the web. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;

/** The minimum touch target the web enforces (--tap) and the matrix asserts. */
export const tap = 48;

/** Type scale in points, matching Tailwind's text-xs … text-3xl the web uses. */
export const type = {
  xs: { size: 12, line: 16 },
  sm: { size: 14, line: 20 },
  base: { size: 16, line: 24 },
  lg: { size: 18, line: 28 },
  xl: { size: 20, line: 28 },
  "2xl": { size: 24, line: 32 },
  "3xl": { size: 30, line: 36 },
} as const;

export const motion = { fast: 120, base: 200, slow: 340 } as const;

/** The Shalaghar marks: colours and the wordmark outlines per language (generated by apps/web/scripts/brand-assets.ts). */
export { brandColors, wordmarks, type WordmarkLocale } from "./brand";
