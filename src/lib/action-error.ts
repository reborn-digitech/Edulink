import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * The message for a failed server action, in the reader's language.
 *
 * THREE SOURCES AND ONE STRING OUT, because a server action has three ways to
 * fail and only one of them can be keyed today:
 *
 *   `errorKey`  what the action itself decided. A key, resolved here.
 *   `error`     an `AccessError` from the tenancy layer, whose message is
 *               minted app-wide and shared by every route. English, for now.
 *   fallback    what to say when a call fails with neither, which happens
 *               when something throws before either is set.
 *
 * ⚠ WRITTEN ONCE RATHER THAN TWENTY TIMES. The first two versions of this lived
 * inline in `day-panel.tsx` and `grid-editor.tsx`, and the moment a third
 * screen needed it the copies would have started to disagree about which source
 * wins. They do not disagree now because there is one of them.
 *
 * Returns `undefined` with no fallback and nothing to say, so it can be dropped
 * straight into a toast's optional `description` without printing "undefined".
 */
export type ActionFailure = {
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  error?: string;
};

export function actionError(t: Translate, result: ActionFailure, fallback: TranslationKey): string;
export function actionError(t: Translate, result: ActionFailure): string | undefined;
export function actionError(
  t: Translate,
  result: ActionFailure,
  fallback?: TranslationKey,
): string | undefined {
  if (result.errorKey) return t(result.errorKey, result.errorVars);
  if (result.error) return result.error;
  return fallback ? t(fallback) : undefined;
}
