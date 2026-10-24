/**
 * THE GUIDE IN HINDI AND MARATHI (docs/plans/vidura.md, pass 2, 17 Oct 2026): the user guide (docs/guide/*.md) is
 * written in English; its section headings and paragraphs are rendered once into Hindi and Marathi by the local model
 * (`npm run help:index -- --render=hi,mr`, scripts/help-index.ts), stored UNREVIEWED in HelpRendering, and indexed
 * beside the English so a Hindi or Marathi question meets help written in its own language, and the drawer suggests
 * the guide's own questions in that language. A speaker reads each rendering on the operator's panel
 * (renderings.ts): approved, edited or rejected.
 *
 * Pure: the units, the prompt, the glossary of the screen's own words and the check of what the model wrote
 * (tests/vidura-two.test.ts). The script makes the model calls; the library writes nothing.
 */
import { createHash } from "node:crypto";
import type { ChatMessage } from "../assistant-model";
import { guideRenderMessages } from "./prompt";
import { readableQuotes } from "./readable-quotes";
export { readableQuotes };

export type RenderLanguage = "hi" | "mr";
export const RENDER_LANGUAGES: readonly RenderLanguage[] = ["hi", "mr"];
export type GuideUnitKind = "HEADING" | "PARAGRAPH";
export type GuideUnit = { kind: GuideUnitKind; text: string; sourceFile: string; key: string };

/** The separator help-index.ts writes between a guide's heading levels. */
export const HEADING_SEPARATOR = " › ";

/** A unit's identity across rebuilds: the kind and the English text, hashed. Pure. */
export function sourceKeyOf(kind: GuideUnitKind, text: string): string {
  return createHash("sha256").update(`${kind}\n${text.trim()}`).digest("hex").slice(0, 40);
}

/** Is this help row one of the guide's English paragraphs? */
export function isGuideRow(row: { kind: string; language: string; sourceFile: string }): boolean {
  return row.kind === "doc" && row.language === "en" && row.sourceFile.startsWith("docs/guide/");
}

/**
 * The units to render, from the help index's English rows: every guide paragraph once and every heading segment once
 * (a section's heading is shared by its paragraphs), in the guides' order. Pure.
 */
export function guideUnits(rows: readonly { kind: string; language: string; sourceFile: string; title: string; text: string }[]): GuideUnit[] {
  const out: GuideUnit[] = [];
  const seen = new Set<string>();
  const add = (kind: GuideUnitKind, text: string, sourceFile: string) => {
    const t = text.trim();
    if (!t) return;
    const key = sourceKeyOf(kind, t);
    if (seen.has(key)) return;
    seen.add(key);
    // Rendered without the quoted sentences' placeholders (QA-64); the key stays the English row's own.
    out.push({ kind, text: readableQuotes(t), sourceFile, key });
  };
  for (const r of rows) {
    if (!isGuideRow(r)) continue;
    for (const segment of r.title.split(HEADING_SEPARATOR)) add("HEADING", segment, r.sourceFile);
    add("PARAGRAPH", r.text, r.sourceFile);
  }
  return out;
}

/** A guide row's heading path in the rendered language: each segment's rendering, or its English where none is kept. Pure. */
export function renderedTitle(title: string, headings: ReadonlyMap<string, string>): string {
  return title
    .split(HEADING_SEPARATOR)
    .map((segment) => headings.get(sourceKeyOf("HEADING", segment)) ?? segment)
    .join(HEADING_SEPARATOR);
}

type Dict = Record<string, unknown>;

/** Every short sentence of a dictionary by its key path, for the glossary. */
function flatten(dict: Dict, prefix = "", out = new Map<string, string>()): Map<string, string> {
  for (const [k, v] of Object.entries(dict)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else if (v && typeof v === "object") flatten(v as Dict, key, out);
  }
  return out;
}

/**
 * THE SCREEN'S OWN WORDS. A label the guide quotes ("Save and publish") is a name on the screen, which the person
 * reads in their own language: the glossary gives the dictionary's Hindi or Marathi for every quoted English label
 * the dictionaries hold word for word, so the rendering names the button the person will see. Built once per run.
 */
export function glossaryIndex(en: Dict, other: Dict): Map<string, string> {
  const enFlat = flatten(en);
  const otherFlat = flatten(other);
  const out = new Map<string, string>();
  for (const [key, value] of enFlat) {
    if (value.length > 80 || value.includes("{")) continue;
    const said = otherFlat.get(key);
    if (!said || said === value || out.has(value)) continue;
    out.set(value, said);
  }
  return out;
}

/** The glossary lines for one unit: its quoted labels the index knows, at most forty. Pure. */
export function glossaryFor(text: string, index: ReadonlyMap<string, string>): [string, string][] {
  const out: [string, string][] = [];
  const seen = new Set<string>();
  for (const m of text.matchAll(/"([^"\n]{1,80})"/g)) {
    const label = m[1]!.trim();
    const said = index.get(label);
    if (!said || seen.has(label)) continue;
    seen.add(label);
    out.push([label, said]);
    if (out.length >= 40) break;
  }
  return out;
}

/** The rendering's prompt lives with every other instruction the model reads (prompt.ts, the one channel). */
export function renderGuideMessages(unit: Pick<GuideUnit, "kind" | "text">, language: RenderLanguage, glossary: readonly [string, string][]): ChatMessage[] {
  return guideRenderMessages(unit, language, glossary);
}

const PATH = /(?<![\w.:/-])\/(?:[a-z0-9-]+)(?:\/[A-Za-z0-9_\-[\]{}]+)*/g;

/** The page paths a text names. Pure. */
export function pathsOf(text: string): string[] {
  return [...new Set((text.match(PATH) ?? []).map((p) => p.replace(/[.,;:)]+$/, "")))];
}

/**
 * What the model wrote, checked: mostly Devanagari, every page path of the English kept, not much longer than the
 * English, one line for a heading; the trimmed rendering, or null to leave the unit unrendered. Pure.
 */
export function checkGuideRendering(unit: Pick<GuideUnit, "kind" | "text">, raw: string): string | null {
  let text = raw.trim().replace(/^<text>\s*|\s*<\/text>$/g, "").replace(/^(?:translation|अनुवाद|भाषांतर)\s*[:：]\s*/i, "").trim();
  if (unit.kind === "HEADING") {
    // A heading is one line: a second line is the model explaining, which no heading carries.
    if (/\n/.test(text)) return null;
    text = text.replace(/^#+\s*/, "").replace(/\s+/g, " ");
  }
  if (!text || /<\/?(?:text|glossary)>/.test(text)) return null;
  if (unit.kind === "HEADING" && text.length > Math.max(120, unit.text.length * 3)) return null;
  if (text.length > unit.text.length * 3 + 200) return null;
  const words = text.replace(PATH, " ").replace(/\{[^}]*\}/g, " ");
  const deva = (words.match(/[ऀ-ॿ]/g) ?? []).length;
  const latin = (words.match(/[A-Za-z]/g) ?? []).length;
  if (deva === 0 || deva < latin) return null;
  const have = new Set(pathsOf(text));
  if (pathsOf(unit.text).some((p) => !have.has(p))) return null;
  return text;
}
