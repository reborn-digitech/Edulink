/**
 * The importer's image step for an item that carries a figure spec (`figure`): the figure is drawn in
 * English and in every language the item has a translation for, each PNG is stored in the uploads
 * store the way a document's bytes are kept (src/lib/storage.ts storeFile: sniffed, stripped, a random
 * name), and the rows point at them:
 *
 *   QuizQuestion.imageKey                — the English drawing; imageAlt the English words
 *   QuizQuestionTranslation.imageKey     — that language's drawing (the same spec, its own labels);
 *                                          imageAlt that language's words
 *   QuizQuestion.imageSpec               — {"v": FIGURE_RENDER_VERSION, "figure": …}, what was drawn
 *
 * Two calls around the row writes, because the question row may not exist yet: `prepareFigure` before
 * (renders and stores, or keeps the stored files when the spec and the renderer are unchanged), then
 * `finishFigure` once the question and its translation rows are written (points the translation rows
 * at their files, records the spec, and deletes the files a changed figure replaced). An item whose
 * spec the contract refuses, or whose drawing throws (a label with no Hindi text, a character no
 * bundled face has), throws here, and the importer refuses it.
 *
 * Used by scripts/import-quiz.ts; the review queue's loader can call the same pair.
 */
import type { PrismaClient } from "@prisma/client";
import type { QuizFigureLanguage } from "@edulink/contracts";
import { figureLanguages, translatedAlt, type FigureItem } from "./check";
import { deleteStoredFile, readStoredFile, storeFile } from "../../../src/lib/storage";
import { FIGURE_RENDER_VERSION, parseFigure, renderFigurePng, renderFigureSvg } from "./render";

export { figureProblems, type FigureItem } from "./check";

export type PreparedFigure = {
  /** The English drawing's fileId, for QuizQuestion.imageKey. */
  imageKey: string;
  /** Each translated language's drawing. */
  byLanguage: Partial<Record<QuizFigureLanguage, string>>;
  imageSpec: string;
  /** Files the new drawings replace, deleted once the rows point at the new ones. */
  stale: string[];
  /** Whether anything was drawn (false: the stored files were kept). */
  drawn: boolean;
};

async function storePng(svg: string, name: string): Promise<string> {
  const png = await renderFigurePng(svg);
  const stored = await storeFile(new File([new Uint8Array(png)], name, { type: "image/png" }), { maxBytes: 2 * 1024 * 1024 });
  return stored.fileId;
}

/** Draws and stores the item's figure, or keeps what is stored when nothing changed. Throws on a figure that cannot be drawn. */
export async function prepareFigure(db: PrismaClient, currentQuestionId: string | null, item: FigureItem): Promise<PreparedFigure> {
  const figure = parseFigure(item.figure);
  const languages = figureLanguages(item);
  const imageSpec = JSON.stringify({ v: FIGURE_RENDER_VERSION, figure });
  // Every language is drawn before anything is stored, so a refusal in Marathi leaves no English file behind.
  const svgs = languages.map((lang) => [lang, renderFigureSvg(figure, lang)] as const);

  const current = currentQuestionId
    ? await db.quizQuestion.findUnique({
        where: { id: currentQuestionId },
        select: { imageKey: true, imageSpec: true, translations: { select: { language: true, imageKey: true } } },
      })
    : null;
  const currentBy = new Map((current?.translations ?? []).map((t) => [t.language, t.imageKey]));

  if (current?.imageKey && current.imageSpec === imageSpec && languages.every((l) => l === "en" || currentBy.get(l))) {
    const keys = [current.imageKey, ...languages.filter((l) => l !== "en").map((l) => currentBy.get(l)!)];
    const present = await Promise.all(keys.map(async (k) => Boolean(await readStoredFile(k))));
    if (present.every(Boolean)) {
      const byLanguage: PreparedFigure["byLanguage"] = {};
      for (const l of languages) if (l !== "en") byLanguage[l] = currentBy.get(l)!;
      return { imageKey: current.imageKey, byLanguage, imageSpec, stale: [], drawn: false };
    }
  }

  const byLanguage: PreparedFigure["byLanguage"] = {};
  let imageKey = "";
  for (const [lang, svg] of svgs) {
    const fileId = await storePng(svg, `figure.${lang}.png`);
    if (lang === "en") imageKey = fileId;
    else byLanguage[lang] = fileId;
  }
  // Only files this step drew are replaced; a question's hand-supplied imageKey (no imageSpec) is the importer's business.
  const stale = current?.imageSpec ? [current.imageKey, ...[...currentBy.values()]].filter((k): k is string => Boolean(k)) : [];
  return { imageKey, byLanguage, imageSpec, stale, drawn: true };
}

/** The question row as it stood before the importer wrote it: what finishFigure needs to retire a drawing. */
export type FigureBefore = { imageKey: string | null; imageSpec: string | null } | null;

/**
 * After the rows are written: the translation rows point at their drawings and carry their words, the
 * question records what was drawn, and replaced files go. With `prepared` null (the item has no figure
 * any more, or its figure failed to draw) a drawing this step made earlier is retired whole: the
 * translations' files and the English one, and the row's spec.
 *
 * ⚠ THE ENGLISH FILE IS NAMED BY `before`, NOT BY THE ROW. Both callers (scripts/import-quiz.ts and
 * scripts/quiz-queue-load.ts) write the question row first with the item's own imageKey — null for an
 * item with no figure — so by the time this runs the row no longer names the English drawing, and the
 * first version of this function deleted the Hindi and Marathi PNGs and left the English one in the store
 * with nothing pointing at it (integration, 11 Oct 2026). The callers pass the row they read before the
 * write; without it the row's own key is used when it still carries the spec.
 */
export async function finishFigure(
  db: PrismaClient,
  questionId: string,
  item: FigureItem,
  prepared: PreparedFigure | null,
  before: FigureBefore = null,
): Promise<void> {
  if (!prepared) {
    const row = await db.quizQuestion.findUnique({
      where: { id: questionId },
      select: { imageKey: true, imageSpec: true, translations: { select: { id: true, imageKey: true } } },
    });
    if (!row) return;
    const wasDrawn = Boolean(before?.imageSpec || row.imageSpec);
    if (!wasDrawn) return;
    // The English drawing this step made: the key the row held before the write, else the row's own.
    const english = before?.imageSpec ? before.imageKey : row.imageSpec ? row.imageKey : null;
    for (const t of row.translations) {
      if (t.imageKey) await deleteStoredFile(t.imageKey);
    }
    await db.quizQuestionTranslation.updateMany({ where: { questionId }, data: { imageKey: null, imageAlt: null } });
    // A row still pointing at the drawing (a caller that left imageKey alone) lets go of it too; a hand
    // image the caller has just stored in its place is kept.
    const clearEnglish = english !== null && row.imageKey === english;
    await db.quizQuestion.update({
      where: { id: questionId },
      data: { imageSpec: null, ...(clearEnglish ? { imageKey: null, imageAlt: null } : {}) },
    });
    if (english) await deleteStoredFile(english);
    return;
  }
  for (const [lang, fileId] of Object.entries(prepared.byLanguage)) {
    await db.quizQuestionTranslation.updateMany({
      where: { questionId, language: lang },
      data: { imageKey: fileId, imageAlt: translatedAlt(item, lang) },
    });
  }
  await db.quizQuestion.update({ where: { id: questionId }, data: { imageSpec: prepared.imageSpec, imageKey: prepared.imageKey } });
  const kept = new Set([prepared.imageKey, ...Object.values(prepared.byLanguage)]);
  for (const fileId of prepared.stale) if (!kept.has(fileId)) await deleteStoredFile(fileId);
}
