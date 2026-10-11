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

/** Held: a generated item that needs a figure nobody has drawn yet. */
export function isHeldForFigure(q: { generated: boolean; needsFigure: boolean; imageKey: string | null }): boolean {
  return q.generated && q.needsFigure && !q.imageKey;
}
