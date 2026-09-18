import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError } from "@/lib/tenancy";

/**
 * What every messaging server action returns. `errorKey` is resolved by the
 * form in the reader's language; an `AccessError` from messaging.ts carries
 * its own key. Same shape as the fees pages' result, and kept out of
 * actions.ts for the same reason: a helper exported from a "use server"
 * module becomes a callable action.
 */
export type ActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

export function failure(error: unknown): ActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[messaging]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}
