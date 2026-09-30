"use server";

import { revalidatePath } from "next/cache";
import { formatPaise } from "@edulink/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { requireApiOperator, AccessError } from "@/lib/tenancy";
import { recordGigPayment, saveGigSettings, type GigSettingsView } from "@/lib/gig-questions";

type Result = { ok: true; message: string } | { ok: false; error: string };

async function failure(error: unknown): Promise<{ ok: false; error: string }> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  console.error("[root-gigs]", error);
  return { ok: false, error: t("common.tryAgainMoment") };
}

/** The operator's dials. Rupees on the form, paise in the row. */
export async function saveGigSettingsAction(input: { rateRupees: number; freeCount: number; monthlyCap: number; budgetRupees: number; dailyLimit: number; pendingLimit: number }): Promise<Result> {
  try {
    const ctx = await requireApiOperator();
    const settings: GigSettingsView = { questionRatePaise: Math.round(input.rateRupees * 100), questionFreeCount: input.freeCount, questionMonthlyCap: input.monthlyCap, questionMonthlyBudgetPaise: Math.round(input.budgetRupees * 100), questionDailyLimit: input.dailyLimit, questionPendingLimit: input.pendingLimit };
    const result = await saveGigSettings(ctx, settings);
    const t = await getT();
    if (!result.ok) return { ok: false, error: t(result.errorKey, result.vars) };
    revalidatePath("/root/gigs");
    return { ok: true, message: t("gigs.settingsSaved") };
  } catch (error) {
    return failure(error);
  }
}

/** The reference of a transfer the operator has already made; the amount is the server's. */
export async function recordGigPaymentAction(input: { userId: string; utr: string; note?: string }): Promise<Result> {
  try {
    const ctx = await requireApiOperator();
    const result = await recordGigPayment(ctx, input);
    const t = await getT();
    if (!result.ok) return { ok: false, error: t(result.errorKey, result.vars) };
    revalidatePath("/root/gigs");
    return { ok: true, message: t("gigs.paymentRecorded", { amount: formatPaise(result.payment.amountPaise, await getLocale()) }) };
  } catch (error) {
    return failure(error);
  }
}
