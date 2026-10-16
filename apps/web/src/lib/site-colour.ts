/**
 * A SCHOOL WEBSITE'S COLOURS, AND WHETHER THEY CAN BE READ (website-two, 16 October 2026).
 *
 * Pure: the editor's swatches, the save's refusal and the renderer read the same rules. A site has a primary colour
 * (the header band, buttons, links) and an accent (the announcement bar, highlights), each from the palette or the
 * logo's own main colour, on a light or a dark page. A pair is refused when the words on it could not be read: white
 * text on the primary and on the accent must reach 4.5:1 (WCAG AA for body text), and the primary used as link
 * colour must reach 4.5:1 against the page (light) or is replaced by a light tint of itself (dark), which is checked
 * the same way.
 */

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("")}`;
}

export function isHexColour(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** The colour mixed toward white by `amount` (0 the colour, 1 white). */
export function mixWithWhite(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount]);
}

/** The colour mixed toward black by `amount`. */
export function mixWithBlack(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * (1 - amount), g * (1 - amount), b * (1 - amount)]);
}

export const SITE_PAGE_LIGHT = "#ffffff";
export const SITE_PAGE_DARK = "#14171c";
export const SITE_TEXT_ON_COLOUR = "#ffffff";
export const AA = 4.5;

/** The colour links are drawn in on the page: the primary on a light page, a light tint of it on a dark one. */
export function linkColourFor(primary: string, theme: "LIGHT" | "DARK"): string {
  if (theme === "LIGHT") return primary;
  for (let amount = 0.3; amount <= 0.9; amount += 0.1) {
    const tinted = mixWithWhite(primary, amount);
    if (contrastRatio(tinted, SITE_PAGE_DARK) >= AA) return tinted;
  }
  return mixWithWhite(primary, 0.9);
}

export type ColourProblem = "PRIMARY_TEXT" | "ACCENT_TEXT" | "LINKS";

/** What makes a pair unreadable, or null when it can be read. */
export function colourProblem(primary: string, accent: string, theme: "LIGHT" | "DARK"): ColourProblem | null {
  if (!isHexColour(primary) || !isHexColour(accent)) return "PRIMARY_TEXT";
  if (contrastRatio(primary, SITE_TEXT_ON_COLOUR) < AA) return "PRIMARY_TEXT";
  if (contrastRatio(accent, SITE_TEXT_ON_COLOUR) < AA) return "ACCENT_TEXT";
  const page = theme === "DARK" ? SITE_PAGE_DARK : SITE_PAGE_LIGHT;
  if (contrastRatio(linkColourFor(primary, theme), page) < AA) return "LINKS";
  return null;
}

/**
 * The logo's own colour made fit to carry white words: darkened step by step until white on it reaches 4.5:1. Null
 * when there is no colour (a logo of white, black and grey).
 */
export function readableFromLogo(rgb: Rgb | null): string | null {
  if (!rgb) return null;
  let hex = rgbToHex(rgb);
  for (let i = 0; i < 12 && contrastRatio(hex, SITE_TEXT_ON_COLOUR) < AA; i++) hex = mixWithBlack(hex, 0.12);
  return contrastRatio(hex, SITE_TEXT_ON_COLOUR) >= AA ? hex : null;
}
