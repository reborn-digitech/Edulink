"use server";

import { revalidatePath } from "next/cache";
import { formatPaise } from "@edulink/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { requireApiOperator, AccessError } from "@/lib/tenancy";
import { gigSettings, recordGigPayment, saveGigSettings, type GigSettingsView } from "@/lib/gig-questions";
import { retrySeatPayment, setPaymentsEnabled } from "@/lib/gig-payments";

type Result = { ok: true; message: string } | { ok: false; error: string };

async function failure(error: unknown): Promise<{ ok: false; error: string }> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  console.error("[root-gigs]", error);
  return { ok: false, error: t("common.tryAgainMoment") };
}

/** The operator's dials, a group of them at a time: what is not sent stays as it is. Paise in the row, whatever the form showed. */
export async function saveGigSettingsAction(patch: Partial<GigSettingsView>): Promise<Result> {
  try {
    const ctx = await requireApiOperator();
    const result = await saveGigSettings(ctx, { ...(await gigSettings()), ...patch });
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

/** The kill switch for paid seats: every path reads it (decision 0004, amended 2026-10-02). */
export async function switchPaymentsAction(on: boolean): Promise<Result> {
  try {
    const ctx = await requireApiOperator();
    const result = await setPaymentsEnabled(ctx, on);
    const t = await getT();
    if (!result.ok) return { ok: false, error: t(result.errorKey, result.vars) };
    revalidatePath("/root/gigs");
    return { ok: true, message: t("gigs.opSwitched") };
  } catch (error) {
    return failure(error);
  }
}

/** A waiting release or refund tried at the gateway now. */
export async function retryPaymentAction(paymentId: string): Promise<Result> {
  try {
    const ctx = await requireApiOperator();
    const result = await retrySeatPayment(ctx, paymentId);
    const t = await getT();
    if (!result.ok) return { ok: false, error: t(result.errorKey, result.vars) };
    revalidatePath("/root/gigs");
    return { ok: true, message: t("gigs.opRetried", { outcome: result.outcome }) };
  } catch (error) {
    return failure(error);
  }
}
