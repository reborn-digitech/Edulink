import type { Translate, TranslationKey } from "./dictionary";
import { retryHintKey } from "@/lib/rate-limit";

/**
 * ⚠ THE SHAPE A LIB REFUSAL TRAVELS IN — a key, never a sentence.
 *
 * A refusal minted inside a lib is read by whoever asked, in whatever language
 * they read, so the lib names WHAT went wrong and the action boundary owns the
 * words. This is the leave.ts pattern, shared here so eight libs do not each
 * grow their own copy of the retry-hint composition.
 *
 * `retryAfterSeconds` is separate from `errorVars` because it is not a word —
 * it is a number the boundary turns into "in about 5 minutes" IN THE READER'S
 * LANGUAGE via `retryHintKey`, and then splices in as `{hint}`.
 */
export type Refusal = {
  errorKey: TranslationKey;
  errorVars?: Record<string, string | number>;
  retryAfterSeconds?: number;
};

/** Turns a lib refusal into the reader's words, at the action boundary. */
export function refusalText(t: Translate, refusal: Refusal): string {
  const vars: Record<string, string | number> = { ...(refusal.errorVars ?? {}) };
  if (refusal.retryAfterSeconds !== undefined) {
    const hint = retryHintKey(refusal.retryAfterSeconds);
    vars.hint = t(hint.key, hint.vars);
  }
  return t(refusal.errorKey, vars);
}
