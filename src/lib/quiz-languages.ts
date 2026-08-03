/**
 * The languages Abhyaas can be read in.
 *
 * ITS OWN FILE, and deliberately free of `server-only`. The language switch is a
 * client component — it has to be, because choosing a language is a click — and
 * a client component importing `quiz.ts` drags `server-only` into the browser
 * bundle and fails the build. These three constants are the only part of the
 * quiz module a client needs, so they live where a client may have them.
 *
 * `quiz.ts` re-exports all of it, so server code carries on importing from
 * `@/lib/quiz` and nothing had to learn about this split.
 */

/**
 * Each language is named IN ITSELF — "हिन्दी", not "Hindi". A child choosing a
 * language they read should not have to read English first in order to escape
 * it. The English name rides alongside for everyone else.
 */
export const QUIZ_LANGUAGES = [
  { code: "en", native: "English", english: "English" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "mr", native: "मराठी", english: "Marathi" },
] as const;

export type QuizLanguage = (typeof QUIZ_LANGUAGES)[number]["code"];

const LANGUAGE_CODES = new Set(QUIZ_LANGUAGES.map((l) => l.code as string));

/**
 * Whatever arrived, reduced to a language we actually have.
 *
 * Anything unrecognised becomes English rather than throwing. This value comes
 * from a query string and from a stored preference that an older build may have
 * written, and neither is worth a 500 — an unknown language means the child
 * reads the original, which is exactly what they got before this existed.
 */
export function normaliseLanguage(raw: string | null | undefined): QuizLanguage {
  const value = (raw ?? "").trim().toLowerCase();
  return (LANGUAGE_CODES.has(value) ? value : "en") as QuizLanguage;
}
