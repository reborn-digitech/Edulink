"use server";

import { revalidatePath } from "next/cache";
import { filingIdentitySaveSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { saveFilingIdentity } from "@/lib/filings";

/**
 * The office's one write on the filings page: what the portals know the
 * school as. Who may write it is settled inside src/lib/filings.ts (an
 * admin, not the principal); this file only checks the shape and turns a
 * refusal into a key the page can say in the reader's language. Only async
 * functions and types may be exported from a "use server" file — see
 * tests/use-server-exports.test.ts.
 */
export type FilingsActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

function failure(error: unknown): FilingsActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[filings]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

export async function saveFilingIdentityAction(input: unknown): Promise<FilingsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = filingIdentitySaveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    await saveFilingIdentity(ctx, parsed.data);
    revalidatePath("/admin/filings");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
