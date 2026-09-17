"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/tenancy";
import { assignPlans, grantConcession, revokeConcession } from "@/lib/fees";
import { recordCounterPayment, requestRefund, reversePayment, type CounterPaymentInput } from "@/lib/fees-payments";
import type { FeeConcessionKind } from "@/lib/constants";
import { failure, type ActionResult } from "../../action-result";
import { pupilHref } from "../../labels";

function refresh(studentMembershipId: string) {
  revalidatePath(pupilHref(studentMembershipId));
  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/dues");
}

/** The counter. `clientId` is the form's own id, so a double submit records once. */
export async function recordPaymentAction(input: CounterPaymentInput): Promise<ActionResult & { paymentId?: string; receiptId?: string; serial?: string; already?: boolean }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await recordCounterPayment(ctx, input);
    refresh(input.studentMembershipId);
    return { ok: true, ...result };
  } catch (error) {
    return failure(error);
  }
}

export async function reversePaymentAction(studentMembershipId: string, paymentId: string, reason: string): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await reversePayment(ctx, paymentId, reason);
    refresh(studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function refundPaymentAction(studentMembershipId: string, paymentId: string, amountPaise: number, reason: string): Promise<ActionResult & { status?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await requestRefund(ctx, { paymentId, amountPaise, reason });
    refresh(studentMembershipId);
    return { ok: true, status: result.status };
  } catch (error) {
    return failure(error);
  }
}

export async function grantConcessionAction(input: { studentMembershipId: string; headId: string | null; kind: FeeConcessionKind; value: number; reason: string }): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await grantConcession(ctx, input);
    refresh(input.studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function revokeConcessionAction(studentMembershipId: string, concessionId: string): Promise<ActionResult> {
  try {
    const ctx = await requireApiRole("ADMIN");
    await revokeConcession(ctx, concessionId);
    refresh(studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** One pupil onto a published structure — the same library call the class-wide assign makes. */
export async function assignPupilAction(studentMembershipId: string, structureId: string): Promise<ActionResult & { refused?: boolean }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await assignPlans(ctx, { structureId, studentMembershipIds: [studentMembershipId] });
    refresh(studentMembershipId);
    if (result.refused.length > 0) return { ok: false, errorKey: "fees.refuseUnassignPaid", refused: true };
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
