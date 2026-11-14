import type { Prisma } from "@prisma/client";

/**
 * WHAT THE BANK SERVES, in one place (the review queue, 10 October 2026; published without review, the
 * owner's decision of 11 October 2026).
 *
 * The authored bank (`generated` false — the files under content/quiz/, the content team's own
 * questions, the teachers' accepted contributions) is served as it always was.
 *
 * A GENERATED item (scripts/quiz-queue-load.ts loads content/quiz/generated/*.json, from quiz:queue or
 * the generation job) passed the generator's own checks — the critique, the blind solver, the form
 * checks, the verifier — and is served the moment it is loaded, its Hindi and Marathi rows with it; no
 * stamp. Two things keep one from a pupil:
 *
 *   TAKEN DOWN — `takenDownAt`, written by the bank desk (src/lib/quiz-review.ts) with a coded reason;
 *   from that moment it is not served anywhere, and Put back clears it. The answers pupils gave stay.
 *
 *   HELD FOR ITS FIGURE — the generator asked for a figure (`needsFigure`) and none is stored
 *   (`imageKey` null): the figure failed to draw on load. Served once the figure is drawn.
 *
 * Every read that hands a question to a pupil — the practice engine (quiz.ts, and through it the
 * phone's /api/v1/practice doors), revision (practice-insights.ts), worksheets (worksheets.ts) — and
 * the content team's bank list and sheet export, spreads SERVED_QUESTION into its where. A
 * translation is served whenever its question is.
 */
export const SERVED_QUESTION = {
  takenDownAt: null,
  NOT: { generated: true, needsFigure: true, imageKey: null },
} satisfies Prisma.QuizQuestionWhereInput;

/** The same rule on a row already read, for code that holds the question in hand. */
export function isServed(q: { generated: boolean; takenDownAt: Date | string | null; needsFigure: boolean; imageKey: string | null }): boolean {
  if (q.takenDownAt !== null) return false;
  return !(q.generated && q.needsFigure && !q.imageKey);
}

/**
 * A LANGUAGE ROW OLDER THAN THE ENGLISH IS NOT SERVED (TA-199 of the testing analysis of 13 November 2026). The desk's
 * Edit (quiz-review.ts) writes the English and only the language rows the reviewer corrected with it, and stamps
 * editedAfterSolvingAt; a Hindi or Marathi row last written before that stamp still holds the old words — an option
 * that is no longer the key's, a working that argues for the old answer — and the desk calls it stale. Every read that
 * hands a question to a pupil passes its translation through here, so a stale row gives way to the English (whose
 * options the stored answerIndex points into) until a person corrects that language. The desk's own STALE note is
 * the same comparison (quiz-review.ts toItem, bank-desk.ts wordsIn).
 */
export function servedTranslation<T extends { updatedAt: Date }>(translation: T | null | undefined, question: { editedAfterSolvingAt: Date | null }): T | null {
  if (!translation) return null;
  if (question.editedAfterSolvingAt && translation.updatedAt < question.editedAfterSolvingAt) return null;
  return translation;
}

/**
 * WHETHER A LANGUAGE ROW CAN BE CONFIRMED STILL RIGHT against a changed English (the owner's follow-up to TA-199, 14
 * November 2026). A translation's options are served by position against the stored answerIndex, so a row whose English
 * has since had its options reordered, or its answer moved to another option, cannot be right at any position, whatever
 * its words say: it is corrected, never confirmed. `base` is the English the row was written against (the desk's edit
 * history), `now` the English as it is or as it is being saved. Options are compared trimmed and in any case, as the
 * desk's checkEdit compares them for repeats. Pure; the edit form asks it too, to grey its tick.
 */
export function translationKeepsItsPlace(base: { choices: string[]; answerIndex: number }, now: { choices: string[]; answerIndex: number }): boolean {
  if (base.answerIndex !== now.answerIndex || base.choices.length !== now.choices.length) return false;
  const norm = (c: string) => c.trim().toLowerCase();
  const was = base.choices.map(norm);
  // An option that now stands where another option of the earlier English stood: the options were reordered.
  return now.choices.map(norm).every((c, i) => was.indexOf(c) === -1 || was.indexOf(c) === i);
}

/** Held: a generated item that needs a figure nobody has drawn yet. */
export function isHeldForFigure(q: { generated: boolean; needsFigure: boolean; imageKey: string | null }): boolean {
  return q.generated && q.needsFigure && !q.imageKey;
}
