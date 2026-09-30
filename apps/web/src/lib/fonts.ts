/**
 * The typefaces a paper or a post can be set in. Bundled, so a paper looks
 * the same on every device: the app used to take whatever the device had,
 * and a certificate drawn in Pune and opened in Nagpur wore two faces. Each
 * is under the SIL Open Font Licence; the files and the licences are under
 * public/fonts/<key>/, and the same files are what the PDFs are set in.
 *
 * A FONT IS OF A SCRIPT. A Devanagari face for Hindi and Marathi, a Latin
 * face for English, and Mukta, which has both. The editor offers the faces
 * of the document's language, and the document's own default is the face
 * every paper had before there was a choice.
 *
 * No server-only import: the editor's select reads this in the browser.
 */
export type Script = "latin" | "devanagari";
export type FontKey = "default" | "mukta" | "notosansdevanagari" | "notoserifdevanagari" | "hind" | "tirodevanagarimarathi" | "inter" | "notosans" | "notoserif" | "merriweather";

export type FontFace = {
  key: FontKey;
  /** The CSS family name, and the name the PDF registers. */
  family: string;
  /** Which scripts it sets well; Mukta sets both. */
  scripts: Script[];
  /** The weights the files hold: a face with no bold is made bold by the browser and the PDF. */
  weights: (400 | 700)[];
};

export const FONTS: FontFace[] = [
  { key: "mukta", family: "Mukta", scripts: ["devanagari", "latin"], weights: [400, 700] },
  { key: "notosansdevanagari", family: "Noto Sans Devanagari", scripts: ["devanagari"], weights: [400, 700] },
  { key: "notoserifdevanagari", family: "Noto Serif Devanagari", scripts: ["devanagari"], weights: [400, 700] },
  { key: "hind", family: "Hind", scripts: ["devanagari"], weights: [400, 700] },
  { key: "tirodevanagarimarathi", family: "Tiro Devanagari Marathi", scripts: ["devanagari"], weights: [400] },
  { key: "inter", family: "Inter", scripts: ["latin"], weights: [400, 700] },
  { key: "notosans", family: "Noto Sans", scripts: ["latin"], weights: [400, 700] },
  { key: "notoserif", family: "Noto Serif", scripts: ["latin"], weights: [400, 700] },
  { key: "merriweather", family: "Merriweather", scripts: ["latin"], weights: [400, 700] },
];

export const FONT_KEYS = ["default", ...FONTS.map((f) => f.key)] as const;

export const scriptOf = (locale: string): Script => (locale === "hi" || locale === "mr" ? "devanagari" : "latin");

/** The faces the editor offers for a document in this language, the default first. */
export function fontsFor(locale: string): FontFace[] {
  const script = scriptOf(locale);
  return FONTS.filter((f) => f.scripts.includes(script));
}

export const fontByKey = (key: string | null | undefined): FontFace | null => FONTS.find((f) => f.key === key) ?? null;

/**
 * The CSS the page sets its text in: the chosen face first, then what a
 * paper always fell back to, so a face that fails to load leaves the words
 * readable. "default" is the paper's own stack, unchanged.
 */
export function fontStack(key: string | null | undefined, locale: string): string | undefined {
  const face = fontByKey(key);
  if (!face) return undefined;
  const fallback = scriptOf(locale) === "devanagari" ? '"Mukta", "Noto Sans Devanagari", sans-serif' : "ui-sans-serif, system-ui, sans-serif";
  return `"${face.family}", ${fallback}`;
}

/** The file a weight of a face is in, under public/fonts. */
export const fontFile = (face: FontFace, weight: 400 | 700): string => `fonts/${face.key}/${face.key}-${face.weights.includes(weight) ? weight : 400}.ttf`;
