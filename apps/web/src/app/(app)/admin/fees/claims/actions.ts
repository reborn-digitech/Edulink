"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { confirmClaim, matchBankRows, rejectClaim, type BankMatch } from "@/lib/fees-payments";
import { getT } from "@/lib/i18n/server";
import { failure, type ActionResult } from "../action-result";

function refresh() {
  revalidatePath("/admin/fees/claims");
  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/dues");
}

export async function confirmClaimAction(paymentId: string): Promise<ActionResult & { receiptId?: string; serial?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const result = await confirmClaim(ctx, paymentId);
    refresh();
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}

export async function rejectClaimAction(paymentId: string, reason: string): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await rejectClaim(ctx, paymentId, reason);
    refresh();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** Writes nothing: the preview of what a pasted statement would confirm. */
export async function matchBankAction(csv: string): Promise<ActionResult & { matches?: BankMatch[] }> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const { matches } = await matchBankRows(ctx, csv);
    return { ok: true, matches };
  } catch (error) {
    return failure(error);
  }
}

/** Confirms the matched claims one by one; a refusal on one does not stop the rest, and each is reported by name. */
export async function applyMatchesAction(paymentIds: string[]): Promise<ActionResult & { confirmed?: number; failed?: { paymentId: string; error: string }[] }> {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const t = await getT();
    let confirmed = 0;
    const failed: { paymentId: string; error: string }[] = [];
    for (const paymentId of [...new Set(paymentIds)].slice(0, 500)) {
      try {
        await confirmClaim(ctx, paymentId);
        confirmed += 1;
      } catch (error) {
        failed.push({ paymentId, error: error instanceof AccessError ? t(error.key, error.vars) : t("common.somethingWrong") });
      }
    }
    refresh();
    return { ok: true, confirmed, failed };
  } catch (error) {
    return failure(error);
  }
}
