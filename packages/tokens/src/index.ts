/**
 * @edulink/tokens — the design system's numbers, once.
 *
 * The web's globals.css is the ORIGIN of these values and stays hand-edited:
 * a stylesheet with comments about contrast ratios is a better home for a
 * palette than a TypeScript object. This package mirrors it for the phone,
 * and a test in the web app reads globals.css and refuses a drift, so the two
 * cannot disagree for longer than one test run. Colours are hex; sizes are in
 * points (the web's rem × 16); the role accents are the eight families the
 * web keys on data-role, in both themes (four more, the module roles,
 * since 3 October 2026, and seven, the college's roles, since 4 October).
 */
export type Theme = "light" | "dark";
export type RoleFamily = "teacher" | "student" | "parent" | "admin" | "driver" | "librarian" | "warden" | "alumnus"
  // The college's seven roles (4 Oct 2026).
  | "faculty" | "hod" | "exam_controller" | "iqac" | "tpo" | "accounts" | "recruiter";

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
    driver: { accent: "#c2410c", accentStrong: "#9a3412", accentSoft: "#fff7ed", accentRing: "#fb923c", accentFg: "#ffffff" },
    librarian: { accent: "#0f766e", accentStrong: "#115e59", accentSoft: "#f0fdfa", accentRing: "#2dd4bf", accentFg: "#ffffff" },
    warden: { accent: "#4338ca", accentStrong: "#3730a3", accentSoft: "#eef2ff", accentRing: "#818cf8", accentFg: "#ffffff" },
    alumnus: { accent: "#a16207", accentStrong: "#854d0e", accentSoft: "#fefce8", accentRing: "#facc15", accentFg: "#ffffff" },
    faculty: { accent: "#0369a1", accentStrong: "#075985", accentSoft: "#f0f9ff", accentRing: "#38bdf8", accentFg: "#ffffff" },
    hod: { accent: "#be123c", accentStrong: "#9f1239", accentSoft: "#fff1f2", accentRing: "#fb7185", accentFg: "#ffffff" },
    exam_controller: { accent: "#b91c1c", accentStrong: "#991b1b", accentSoft: "#fef2f2", accentRing: "#f87171", accentFg: "#ffffff" },
    iqac: { accent: "#a21caf", accentStrong: "#86198f", accentSoft: "#fdf4ff", accentRing: "#e879f9", accentFg: "#ffffff" },
    tpo: { accent: "#4d7c0f", accentStrong: "#3f6212", accentSoft: "#f7fee7", accentRing: "#a3e635", accentFg: "#ffffff" },
    accounts: { accent: "#0e7490", accentStrong: "#155e75", accentSoft: "#ecfeff", accentRing: "#22d3ee", accentFg: "#ffffff" },
    recruiter: { accent: "#6d28d9", accentStrong: "#5b21b6", accentSoft: "#f5f3ff", accentRing: "#a78bfa", accentFg: "#ffffff" },
  },
  dark: {
    teacher: { accent: "#60a5fa", accentStrong: "#93c5fd", accentSoft: "#10203a", accentRing: "#3b82f6", accentFg: "#06121f" },
    student: { accent: "#4ade80", accentStrong: "#86efac", accentSoft: "#0f2a1c", accentRing: "#22c55e", accentFg: "#04140b" },
    parent: { accent: "#c084fc", accentStrong: "#d8b4fe", accentSoft: "#221037", accentRing: "#a855f7", accentFg: "#14061f" },
    admin: { accent: "#94a3b8", accentStrong: "#cbd5e1", accentSoft: "#1e2635", accentRing: "#64748b", accentFg: "#0b0e15" },
    driver: { accent: "#fb923c", accentStrong: "#fdba74", accentSoft: "#2b1608", accentRing: "#f97316", accentFg: "#1a0a02" },
    librarian: { accent: "#2dd4bf", accentStrong: "#5eead4", accentSoft: "#0b2826", accentRing: "#14b8a6", accentFg: "#031513" },
    warden: { accent: "#818cf8", accentStrong: "#a5b4fc", accentSoft: "#1a1c3d", accentRing: "#6366f1", accentFg: "#0c0d24" },
    alumnus: { accent: "#facc15", accentStrong: "#fde047", accentSoft: "#2a2306", accentRing: "#eab308", accentFg: "#1a1500" },
    faculty: { accent: "#38bdf8", accentStrong: "#7dd3fc", accentSoft: "#082032", accentRing: "#0ea5e9", accentFg: "#03131f" },
    hod: { accent: "#fb7185", accentStrong: "#fda4af", accentSoft: "#2d0a12", accentRing: "#f43f5e", accentFg: "#1f0309" },
    exam_controller: { accent: "#f87171", accentStrong: "#fca5a5", accentSoft: "#2c0b0b", accentRing: "#ef4444", accentFg: "#1f0404" },
    iqac: { accent: "#e879f9", accentStrong: "#f0abfc", accentSoft: "#2a0a2e", accentRing: "#d946ef", accentFg: "#1c041f" },
    tpo: { accent: "#a3e635", accentStrong: "#bef264", accentSoft: "#1a2606", accentRing: "#84cc16", accentFg: "#0f1702" },
    accounts: { accent: "#22d3ee", accentStrong: "#67e8f9", accentSoft: "#072a30", accentRing: "#06b6d4", accentFg: "#021618" },
    recruiter: { accent: "#a78bfa", accentStrong: "#c4b5fd", accentSoft: "#1e1238", accentRing: "#8b5cf6", accentFg: "#0f0722" },
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
    case "DRIVER":
    case "SUPPORT": // owner-batch-item2a: support staff share the driver's colour
      return "driver";
    case "LIBRARIAN":
      return "librarian";
    case "WARDEN":
      return "warden";
    case "ALUMNUS":
      return "alumnus";
    case "FACULTY":
      return "faculty";
    case "HOD":
      return "hod";
    case "EXAM_CONTROLLER":
      return "exam_controller";
    case "IQAC":
      return "iqac";
    case "TPO":
      return "tpo";
    case "ACCOUNTS":
      return "accounts";
    case "RECRUITER":
      return "recruiter";
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
