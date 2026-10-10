"use server";

import { revalidatePath } from "next/cache";
import { leavingSettleBodySchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { settleOnLeaving } from "@/lib/leaving-settlement";

/** The office's settlement on leaving (R-61 Q2, 10 Oct 2026), as the ledger page calls it; the rule and the one writer are the library's. */
export type SettlementActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

export async function settleOnLeavingAction(studentMembershipId: string, input: unknown): Promise<SettlementActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = leavingSettleBodySchema.safeParse(input);
    if (!parsed.success || typeof studentMembershipId !== "string" || !studentMembershipId) return { ok: false, errorKey: "common.checkTheForm" };
    await settleOnLeaving(ctx, studentMembershipId, parsed.data);
    revalidatePath(`/admin/fees/pupils/${studentMembershipId}`);
    revalidatePath("/admin/fees/dues");
    revalidatePath("/parent/fees");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError || error instanceof RuleRefusal) return { ok: false, errorKey: error.key, errorVars: error.vars };
    console.error("[leaving-settlement]", error);
    return { ok: false, errorKey: "common.tryAgain" };
  }
}
