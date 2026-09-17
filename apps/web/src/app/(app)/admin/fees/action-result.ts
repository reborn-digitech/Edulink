import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError } from "@/lib/tenancy";

/**
 * What every fees server action returns. `errorKey` is resolved by the form
 * in the reader's language; an `AccessError` from the libraries carries its
 * own key and, for the few refusals that name something, its vars.
 *
 * Deliberately NOT in an actions.ts: a "use server" module may only export
 * async functions, and a helper exported from one becomes a callable action.
 */
export type ActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

export function failure(error: unknown): ActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[fees]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}
