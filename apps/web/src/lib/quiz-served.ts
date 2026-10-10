import type { Prisma } from "@prisma/client";

/**
 * WHAT THE BANK SERVES, in one place (the review queue, 10 October 2026).
 *
 * The authored bank (`generated` false — the files under content/quiz/, the content team's own
 * questions, the teachers' accepted contributions) is served as it always was: reviewedAt has never
 * gated it, and 6,963 rows carried none on the day this was written.
 *
 * A GENERATED item (scripts/quiz-queue.ts loads content/quiz/generated/*.json) is served only once a
 * reviewer has stamped it — reviewedAt, written by src/lib/quiz-review.ts's stamp writer alone. A
 * discarded one keeps reviewedAt null, so it is never served either.
 *
 * Its Hindi or Marathi row is served only once that language is stamped as well (hiReviewedAt /
 * mrReviewedAt); until then the reader falls back to the English, field by field, exactly as an
 * untranslated question does today. The authored bank's drafts stay served unstamped (decision 0002,
 * gap 8): the owner's amendment is about the machine's generated bank, not about a translation a
 * person on the content team saved.
 *
 * Every read that hands a question to a pupil — the practice engine (quiz.ts, and through it the
 * phone's /api/v1/practice doors), revision (practice-insights.ts), worksheets (worksheets.ts) — and
 * the content team's bank list and sheet export, spreads SERVED_QUESTION into its where, and reads a
 * translation through servedTranslationWhere.
 */
export const SERVED_QUESTION = { NOT: { generated: true, reviewedAt: null } } satisfies Prisma.QuizQuestionWhereInput;

/** The condition on the translation's question for a row in `language` to be read out to a pupil. */
export function servedTranslationWhere(language: string): Prisma.QuizQuestionWhereInput {
  if (language === "hi") return { OR: [{ generated: false }, { hiReviewedAt: { not: null } }] };
  if (language === "mr") return { OR: [{ generated: false }, { mrReviewedAt: { not: null } }] };
  // A language the queue has no stamp for: a generated item's row in it is never served.
  return { generated: false };
}

/** The same two rules on a row already read, for code that holds the question in hand. */
export function isServed(q: { generated: boolean; reviewedAt: Date | string | null }): boolean {
  return !q.generated || q.reviewedAt !== null;
}

export function isTranslationServed(
  q: { generated: boolean; hiReviewedAt: Date | string | null; mrReviewedAt: Date | string | null },
  language: string,
): boolean {
  if (!q.generated) return true;
  if (language === "hi") return q.hiReviewedAt !== null;
  if (language === "mr") return q.mrReviewedAt !== null;
  return false;
}
