import { SITE_SWATCHES, type SiteSwatch } from "@edulink/contracts";

/**
 * THE SWATCH NEAREST A SCHOOL'S LOGO (website-builder A, 15 October 2026): the Look screen's default colour.
 *
 * Pure TypeScript over raw RGB pixels — the decode is sharp's, which the file store already uses for its sized
 * copies (storage.ts); site-admin.ts reads the logo, shrinks it to 24×24 and hands the pixels here. No image
 * library of its own.
 *
 * THE MAIN COLOUR is the fullest bucket of a coarse histogram (four bits a channel) over the pixels that carry
 * colour: near-white, near-black, transparent-looking grey and washed-out pixels are skipped, since a logo's
 * ground is usually white and its outline black. The swatch is then the nearest of the six by a weighted RGB
 * distance (the "redmean" approximation of how far apart two colours look). A logo with no colour at all — a
 * black-and-white crest — gives null, and the flow falls back to the first swatch.
 */

export type Rgb = [number, number, number];

/** The fullest colour bucket's mean, or null when no pixel carries colour. `pixels` is RGB or RGBA, row after row. */
export function dominantColour(pixels: Uint8Array, channels: 3 | 4 = 3): Rgb | null {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i + channels - 1 < pixels.length; i += channels) {
    const r = pixels[i]!;
    const g = pixels[i + 1]!;
    const b = pixels[i + 2]!;
    if (channels === 4 && pixels[i + 3]! < 128) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 40 || min > 225) continue; // black or white
    if (max - min < 30) continue; // grey: no colour to speak of
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const cell = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    cell.n += 1;
    cell.r += r;
    cell.g += g;
    cell.b += b;
    buckets.set(key, cell);
  }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const cell of buckets.values()) if (!best || cell.n > best.n) best = cell;
  return best ? [Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n)] : null;
}

function rgbOf(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** How far apart two colours look, roughly ("redmean"). */
export function colourDistance(a: Rgb, b: Rgb): number {
  const rm = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}

/** The swatch nearest a colour. */
export function nearestSwatch(colour: Rgb): SiteSwatch {
  let best: SiteSwatch = SITE_SWATCHES[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const swatch of SITE_SWATCHES) {
    const d = colourDistance(colour, rgbOf(swatch));
    if (d < bestDistance) {
      best = swatch;
      bestDistance = d;
    }
  }
  return best;
}
