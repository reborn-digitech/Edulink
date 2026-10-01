"use server";

import { revalidatePath } from "next/cache";
import type { FamilyUnlinked } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { unlinkChild } from "@/lib/guardianship";

/**
 * The guardian removes a child from their account. The rule — the last
 * family guardian hands over to the school's stand-in, or is refused when
 * nobody can stand in — is settled in src/lib/guardianship.ts; this only
 * shapes the result. Only async functions and types may be exported from a
 * "use server" file — see tests/use-server-exports.test.ts.
 */
export type UnlinkResult = { ok: true; data: FamilyUnlinked } | { ok: false; errorKey: TranslationKey; errorVars?: Record<string, string | number> };

export async function unlinkChildAction(studentMembershipId: string): Promise<UnlinkResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof studentMembershipId !== "string" || !studentMembershipId) return { ok: false, errorKey: "common.checkTheForm" };
    const data = await unlinkChild(ctx, studentMembershipId);
    revalidatePath("/parent/settings");
    revalidatePath("/parent");
    return { ok: true, data };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[unlinkChild]", error);
    return { ok: false, errorKey: "common.tryAgain" };
  }
}
