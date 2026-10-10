/**
 * Words as outlines, through fontkit and the Mukta faces the certificates already ship
 * (src/lib/pdf-fonts, OFL): one face carries Latin and Devanagari, and fontkit's Indic shaper joins
 * the conjuncts (क्ष, त्र) and moves the i-matra before its consonant, so a Marathi label is drawn as a
 * reader expects. Outlines rather than <text> so nothing depends on the fonts of the machine that
 * shows or rasterises the SVG.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";

export type TextAnchor = "start" | "middle" | "end";
export type TextWeight = "regular" | "bold";

const FONT_DIR = join(__dirname, "..", "..", "..", "src", "lib", "pdf-fonts");
/** Noto Sans (public/fonts, OFL) for what Mukta lacks: the Greek letters a figure names (θ, α, Ω). */
const FALLBACK_DIR = join(__dirname, "..", "..", "..", "public", "fonts", "notosans");
const faces = new Map<string, fontkit.Font>();

function load(key: string, path: string): fontkit.Font {
  let f = faces.get(key);
  if (!f) {
    f = fontkit.create(readFileSync(path)) as fontkit.Font;
    faces.set(key, f);
  }
  return f;
}

function chain(weight: TextWeight): fontkit.Font[] {
  return [
    load(`mukta-${weight}`, join(FONT_DIR, weight === "bold" ? "Mukta-Bold.ttf" : "Mukta-Regular.ttf")),
    load(`noto-${weight}`, join(FALLBACK_DIR, weight === "bold" ? "notosans-700.ttf" : "notosans-400.ttf")),
  ];
}

/** Thrown for a character no bundled face can draw, so a figure never ships a blank box. */
export class MissingGlyphError extends Error {
  constructor(readonly char: string) {
    super(`no bundled font draws "${char}" (U+${char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")})`);
    this.name = "MissingGlyphError";
  }
}

/** The string cut into runs, each in the first face that has all of its characters; marks stay with their letter. */
function runs(str: string, weight: TextWeight): { font: fontkit.Font; text: string }[] {
  const fonts = chain(weight);
  const out: { font: fontkit.Font; text: string }[] = [];
  for (const ch of str) {
    const cp = ch.codePointAt(0)!;
    // Spaces, joiners and Devanagari signs ride with the run they are in.
    const neutral = /\s/.test(ch) || cp === 0x200c || cp === 0x200d;
    let font = neutral && out.length ? out[out.length - 1]!.font : fonts.find((f) => f.hasGlyphForCodePoint(cp));
    if (!font) throw new MissingGlyphError(ch);
    if (neutral && !out.length) font = fonts[0]!;
    const last = out[out.length - 1];
    if (last && last.font === font) last.text += ch;
    else out.push({ font, text: ch });
  }
  return out;
}

const r2 = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) || r === 0 ? "0" : String(r);
};

/** The advance width of `str` at `size`, in viewBox units. */
export function textWidth(str: string, size: number, weight: TextWeight = "regular"): number {
  return runs(str, weight).reduce((w, r) => w + (r.font.layout(r.text).advanceWidth * size) / r.font.unitsPerEm, 0);
}

/** Outline path data for `str` with its baseline at y and its anchor at x; empty for empty text. */
export function textOutline(str: string, x: number, y: number, size: number, anchor: TextAnchor, weight: TextWeight): { d: string; width: number; x: number } {
  const width = textWidth(str, size, weight);
  const left = anchor === "start" ? x : anchor === "middle" ? x - width / 2 : x - width;
  let penX = left;
  const out: string[] = [];
  for (const { font, text } of runs(str, weight)) {
    const run = font.layout(text);
    const scale = size / font.unitsPerEm;
    let pen = 0;
    run.glyphs.forEach((glyph, i) => {
      const pos = run.positions[i]!;
      const ox = penX + (pen + pos.xOffset) * scale;
      const oy = y - pos.yOffset * scale;
      for (const c of glyph.path.commands) {
        const a = c.args;
        const P = (j: number) => `${r2(ox + a[j]! * scale)} ${r2(oy - a[j + 1]! * scale)}`;
        switch (c.command) {
          case "moveTo":
            out.push(`M${P(0)}`);
            break;
          case "lineTo":
            out.push(`L${P(0)}`);
            break;
          case "quadraticCurveTo":
            out.push(`Q${P(0)} ${P(2)}`);
            break;
          case "bezierCurveTo":
            out.push(`C${P(0)} ${P(2)} ${P(4)}`);
            break;
          case "closePath":
            out.push("Z");
            break;
        }
      }
      pen += pos.xAdvance;
    });
    penX += run.advanceWidth * scale;
  }
  return { d: out.join(""), width, x: left };
}
