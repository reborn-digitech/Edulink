/**
 * The verifier's half of the figure builder: what is wrong with an item's figure, without storing
 * anything (scripts/verify-quiz.ts imports this, not attach.ts, so verifying needs no uploads store).
 */
import { QUIZ_FIGURE_LANGUAGES, type QuizFigureLanguage } from "@edulink/contracts";
import { parseFigure, renderFigureSvg } from "./render";

/** What the importer reads off an item; loose, because the bank's item types live with their writers. */
export type FigureItem = {
  figure?: unknown;
  imageKey?: string | null;
  imageAlt?: string | null;
  /** Each translation's own fields; only `imageAlt` is read here. */
  translations?: Record<string, unknown>;
};

/** A translation's figure words, trimmed; null when it has none. */
export function translatedAlt(item: FigureItem, lang: string): string | null {
  const tr = item.translations?.[lang];
  const alt = tr && typeof tr === "object" && "imageAlt" in tr ? (tr as { imageAlt?: unknown }).imageAlt : null;
  return typeof alt === "string" && alt.trim() ? alt.trim() : null;
}

/** The languages an item is drawn in: English and each translation it carries. */
export function figureLanguages(item: FigureItem): QuizFigureLanguage[] {
  const translated = Object.keys(item.translations ?? {}).filter((l): l is QuizFigureLanguage => l !== "en" && (QUIZ_FIGURE_LANGUAGES as readonly string[]).includes(l));
  return ["en", ...translated.sort()];
}

/**
 * What is wrong with an item's figure, as sentences for the verifier; empty when it can be drawn in
 * every language the item is read in and every one of those has words for it.
 */
export function figureProblems(item: FigureItem): string[] {
  if (item.figure === undefined || item.figure === null) return [];
  const out: string[] = [];
  if (item.imageKey) out.push("carries both an imageKey and a figure spec; one picture per item");
  try {
    parseFigure(item.figure);
  } catch (error) {
    return [...out, (error as Error).message];
  }
  if (!item.imageAlt?.trim()) out.push("has a figure but no imageAlt, the figure in words");
  for (const lang of figureLanguages(item)) {
    try {
      renderFigureSvg(item.figure, lang);
    } catch (error) {
      out.push(`figure cannot be drawn in ${lang}: ${(error as Error).message}`);
    }
    if (lang !== "en" && !translatedAlt(item, lang)) out.push(`has a figure but its ${lang} translation has no imageAlt`);
  }
  return out;
}

