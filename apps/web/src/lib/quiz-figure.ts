/**
 * The figure a served question shows (the quiz bank's figure builder, 10 Oct 2026): the drawing for the
 * language the stem is served in when the translation has its own (its labels in that language), else
 * the question's, and its words the same way. No picture without words: a figure with no alt is not
 * served, since a pupil whose picture did not load, and a screen reader, would have nothing.
 */
export type ServedFigure = { fileId: string; alt: string };

type Imaged = { imageKey: string | null; imageAlt: string | null };

export function servedFigure(question: Imaged, translation: Imaged | null | undefined): ServedFigure | null {
  const fileId = translation?.imageKey ?? question.imageKey;
  const alt = (translation?.imageAlt ?? question.imageAlt)?.trim();
  return fileId && alt ? { fileId, alt } : null;
}
