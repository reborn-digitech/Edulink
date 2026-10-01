/**
 * The Shalaghar marks, drawn from the bundled faces and written as the one
 * source every surface reads: `npm run brand:assets`.
 *
 *   • The wordmark in three scripts — "Shalaghar" in Inter, शालाघर (Hindi)
 *     and शाळाघर (Marathi) in Noto Sans Devanagari — as outlines, so no
 *     surface depends on a font being present. Over each word a roof: the
 *     Devanagari headline (the shirorekha every word carries) is extended
 *     by a chevron rising to a ridge, with a small warm dot at the ridge;
 *     the Latin word is given the same headline so the three read as one
 *     mark. The web and the phone draw the locale's wordmark from the path
 *     data written to packages/tokens/src/brand.ts, which is why the mark
 *     changes with the language.
 *   • The monogram: "Sg" under the same roof on a navy tile with the app's
 *     corner radius — the app icon, the PWA icons, the favicon, the Android
 *     adaptive layers and the splash — rendered to PNG at every size with
 *     sharp. The tile is the frame's navy (packages/tokens `frame`), the
 *     roof's dot the brand's one warm accent.
 *
 * Rerun after a change here; nothing under public/icons, public/brand or
 * apps/mobile/assets/images is edited by hand.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import * as fontkit from "fontkit";


const web = resolve(__dirname, "..");
const root = resolve(web, "../..");
const mobileImages = join(root, "apps/mobile/assets/images");
const brandDir = join(web, "public/brand");
const iconsDir = join(web, "public/icons");

/** The brand's colours. Ink is the frame's navy; the accent is the one warm colour the marks carry. */
export const BRAND = { ink: "#141924", inkOnDark: "#edf0f7", accent: "#f0a33a", tile: "#141924" } as const;

function outline(fontFile: string, text: string): { glyphs: { d: string; x: number }[]; advance: number; upm: number; top: number; bottom: number } {
  const font = fontkit.openSync(fontFile) as fontkit.Font;
  const run = font.layout(text);
  let x = 0;
  let top = -Infinity;
  let bottom = Infinity;
  const glyphs = run.glyphs.map((g: fontkit.Glyph, i: number) => {
    const pos = run.positions[i]!;
    const gx = x + pos.xOffset;
    const d = g.path.toSVG();
    top = Math.max(top, g.bbox.maxY);
    bottom = Math.min(bottom, g.bbox.minY);
    x += pos.xAdvance;
    return { d, x: gx };
  });
  return { glyphs, advance: x, upm: font.unitsPerEm, top, bottom };
}

/** Font y goes up; SVG y goes down. One transform per glyph, no path rewriting. */
function placed(glyphs: { d: string; x: number }[], scale: number, baselineY: number, left = 0): string {
  return glyphs.map((g) => `<path transform="translate(${(left + g.x * scale).toFixed(2)} ${baselineY.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})" d="${g.d}"/>`).join("");
}

/**
 * One wordmark: the word scaled to an em of 100 units, a headline over it
 * (the Devanagari word's own, the Latin word given one), and the roof.
 * Everything in `ink` is one group drawn in currentColor; the ridge dot is
 * the accent. Returned as the SVG and as the parts the apps draw.
 */
function wordmark(opts: { fontFile: string; text: string; devanagari: boolean }): { svg: string; viewBox: string; ink: string; accent: string; width: number; height: number } {
  const { glyphs, advance, upm, top } = outline(opts.fontFile, opts.text);
  const em = 100;
  const scale = em / upm;
  const wordWidth = advance * scale;
  // The headline: Devanagari's sits at its cap height (the bar is part of
  // the glyphs); the Latin word's is drawn just above its ascenders.
  const headTop = opts.devanagari ? 62.2 * (em / 100) : (top * scale) + 7;
  const stroke = opts.devanagari ? 10.5 : 9;
  const roofRise = Math.max(22, wordWidth * 0.115);
  const pad = 14;
  const ridgeDot = stroke * 0.95;
  const left = pad;
  const baselineY = pad + stroke * 2.1 + ridgeDot + roofRise + stroke + headTop;
  // The chevron meets the Devanagari word on the centre line of its own
  // headline, so the two read as one stroke; the Latin word's drawn headline
  // is centred on the same y.
  const headY = baselineY - headTop + (opts.devanagari ? stroke / 2 : 0);
  const ridgeY = headY - roofRise;
  const ridgeX = left + wordWidth / 2;
  const descent = 42; // room for the g's tail and the Devanagari matras below the line
  const height = baselineY + descent;
  const width = wordWidth + pad * 2;
  const roof = `M${left.toFixed(2)} ${headY.toFixed(2)} L${ridgeX.toFixed(2)} ${ridgeY.toFixed(2)} L${(left + wordWidth).toFixed(2)} ${headY.toFixed(2)}`;
  const latinHead = opts.devanagari ? "" : `<path d="M${(left + 1).toFixed(2)} ${headY.toFixed(2)} L${(left + wordWidth - 1).toFixed(2)} ${headY.toFixed(2)}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round"/>`;
  const ink = `<g fill="currentColor">${placed(glyphs, scale, baselineY, left)}</g>${latinHead}<path d="${roof}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const accent = `<circle cx="${ridgeX.toFixed(2)}" cy="${(ridgeY - stroke * 2.1).toFixed(2)}" r="${ridgeDot.toFixed(2)}" fill="${BRAND.accent}"/>`;
  const viewBox = `0 0 ${width.toFixed(2)} ${height.toFixed(2)}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${opts.text}" color="${BRAND.ink}">${ink}${accent}</svg>`;
  return { svg, viewBox, ink, accent, width, height };
}

/**
 * The monogram on a 1024 tile: the roof in the accent over "Sg" in white.
 * `cutout` leaves the tile off (for print and light surfaces, drawn in ink);
 * `mono` draws everything in one colour (Android's monochrome layer).
 */
function monogram(opts: { tile: boolean; mono?: string; fill?: string; corner?: number }): string {
  const size = 1024;
  const { glyphs, advance, top, bottom } = outline(join(web, "public/fonts/inter/inter-700.ttf"), "Sg");
  const capHeight = 1490; // Inter 700
  const scale = 330 / capHeight;
  const w = advance * scale;
  const ink = opts.mono ?? (opts.tile ? "#ffffff" : BRAND.ink);
  const accent = opts.mono ?? BRAND.accent;
  const stroke = 62;
  const eave = 70;
  const roofW = w + eave * 2;
  const rise = roofW * 0.3;
  const gap = 78;
  const tail = -bottom * scale; // the g below the baseline
  const total = stroke / 2 + rise + gap + top * scale + tail;
  const topY = (size - total) / 2 + stroke / 2;
  const ridgeY = topY;
  const eaveY = topY + rise;
  const baseline = eaveY + gap + top * scale;
  const left = (size - w) / 2;
  const roof = `<path d="M${(left - eave).toFixed(1)} ${eaveY.toFixed(1)} L${(size / 2).toFixed(1)} ${ridgeY.toFixed(1)} L${(left + w + eave).toFixed(1)} ${eaveY.toFixed(1)}" fill="none" stroke="${accent}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const tile = opts.tile ? `<rect width="${size}" height="${size}" rx="${opts.corner ?? 0}" fill="${opts.fill ?? BRAND.tile}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${tile}${roof}<g fill="${ink}">${placed(glyphs, scale, baseline, left)}</g></svg>`;
}

async function png(svg: string, size: number, out: string, opts: { flatten?: string } = {}): Promise<void> {
  let image = sharp(Buffer.from(svg), { density: 300 }).resize(size, size);
  if (opts.flatten) image = image.flatten({ background: opts.flatten });
  await image.png().toFile(out);
}

/** The monogram scaled into the middle of a larger transparent canvas (adaptive layers, the splash). */
function inset(inner: string, fraction: number, fill?: string): string {
  const size = 1024;
  const scale = fraction;
  const offset = (size - size * scale) / 2;
  const bg = fill ? `<rect width="${size}" height="${size}" fill="${fill}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${bg}<g transform="translate(${offset} ${offset}) scale(${scale})">${inner.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g></svg>`;
}

async function main() {
  mkdirSync(brandDir, { recursive: true });
  const devanagari = join(web, "public/fonts/notosansdevanagari/notosansdevanagari-700.ttf");
  const marks = {
    en: wordmark({ fontFile: join(web, "public/fonts/inter/inter-700.ttf"), text: "Shalaghar", devanagari: false }),
    hi: wordmark({ fontFile: devanagari, text: "शालाघर", devanagari: true }),
    mr: wordmark({ fontFile: devanagari, text: "शाळाघर", devanagari: true }),
  };
  for (const [locale, mark] of Object.entries(marks)) writeFileSync(join(brandDir, `wordmark-${locale}.svg`), mark.svg);

  const tileSvg = monogram({ tile: true, corner: 0 });
  const roundedSvg = monogram({ tile: true, corner: 225 });
  const cutoutSvg = monogram({ tile: false });
  const monoSvg = monogram({ tile: false, mono: "#ffffff" });
  writeFileSync(join(brandDir, "monogram.svg"), roundedSvg);
  writeFileSync(join(brandDir, "monogram-cutout.svg"), cutoutSvg);

  // The web: PWA icons (square tile; the browser rounds), maskable (navy
  // full bleed, the mark inside the 80 % safe zone), Apple's, the cutout.
  await png(tileSvg, 192, join(iconsDir, "icon-192.png"));
  await png(tileSvg, 512, join(iconsDir, "icon-512.png"));
  await png(inset(cutoutSvg.replace(/fill="#141924"/g, 'fill="#ffffff"').replace(/stroke="#f0a33a"/g, `stroke="${BRAND.accent}"`), 0.8, BRAND.tile), 192, join(iconsDir, "maskable-192.png"));
  await png(inset(cutoutSvg.replace(/fill="#141924"/g, 'fill="#ffffff"').replace(/stroke="#f0a33a"/g, `stroke="${BRAND.accent}"`), 0.8, BRAND.tile), 512, join(iconsDir, "maskable-512.png"));
  await png(tileSvg, 180, join(iconsDir, "apple-touch-icon.png"));
  await png(cutoutSvg, 512, join(iconsDir, "logo.png"));
  // Next's favicon is src/app/icon.png; public/favicon.ico stays for the
  // agents that ask for the old name (a PNG under that name, which browsers take).
  await png(tileSvg, 64, join(web, "src/app/icon.png"));
  await sharp(Buffer.from(tileSvg), { density: 300 }).resize(32, 32).png().toFile(join(web, "public/favicon.ico"));

  // The phone: Expo's square icon, Android's three adaptive layers, the splash and the web favicon.
  await png(tileSvg, 1024, join(mobileImages, "icon.png"));
  await png(inset(cutoutSvg.replace(/fill="#141924"/g, 'fill="#ffffff"'), 0.66), 1024, join(mobileImages, "android-icon-foreground.png"));
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="${BRAND.tile}"/></svg>`, 1024, join(mobileImages, "android-icon-background.png"));
  await png(inset(monoSvg, 0.66), 1024, join(mobileImages, "android-icon-monochrome.png"));
  await png(inset(cutoutSvg, 0.9), 600, join(mobileImages, "splash-icon.png"));
  await png(tileSvg, 48, join(mobileImages, "favicon.png"));

  // The path data both apps draw from.
  const brandTs = `/**
 * GENERATED by apps/web/scripts/brand-assets.ts — do not edit. The
 * Shalaghar wordmark in each language as outlines (ink in currentColor,
 * the ridge dot in the accent) and the brand colours. The web's Wordmark
 * and the phone's draw the active locale's mark from here, so the mark
 * follows the language switch.
 */
export const brandColors = ${JSON.stringify(BRAND, null, 2)} as const;

export type WordmarkLocale = "en" | "hi" | "mr";

export const wordmarks: Record<WordmarkLocale, { viewBox: string; width: number; height: number; ink: string; accent: string }> = ${JSON.stringify(
    Object.fromEntries(Object.entries(marks).map(([k, m]) => [k, { viewBox: m.viewBox, width: Number(m.width.toFixed(2)), height: Number(m.height.toFixed(2)), ink: m.ink, accent: m.accent }])),
    null,
    2,
  )};
`;
  writeFileSync(join(root, "packages/tokens/src/brand.ts"), brandTs);
  console.log(`brand assets written: ${Object.keys(marks).length} wordmarks, monogram, ${7 + 6} PNGs`);
}

void main();
