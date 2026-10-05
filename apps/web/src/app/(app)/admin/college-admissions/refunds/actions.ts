"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headDecisionSchema, refundExceptionAskSchema } from "@edulink/contracts";
import { parseRupees } from "@edulink/i18n";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { askRefundException, decideRefundException } from "@/lib/head-approvals";

/**
 * A refund outside the slab's two forms (5 Oct 2026): the office's ask on a
 * cancelled seat's page, and the principal's word on it from the list or the
 * same page. Each returns to the page it came from with ?ok= or ?error= in
 * the reader's language; who may do what is head-approvals.ts's.
 */
const BACK = /^\/admin\/college-admissions(\/[\w-]*)*$/;
const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

async function run(formData: FormData, work: () => Promise<void>, done: "collegeDesks.refundAsked" | "collegeDesks.decided"): Promise<void> {
  const raw = str(formData, "back");
  const back = BACK.test(raw) ? raw : "/admin/college-admissions/refunds";
  const t = await getT();
  try {
    await work();
  } catch (error) {
    if (error instanceof AccessError) redirect(`${back}?error=${encodeURIComponent(t(error.key, error.vars))}`);
    throw error;
  }
  revalidatePath(back);
  redirect(`${back}?ok=${encodeURIComponent(t(done))}`);
}

export async function askRefundExceptionAction(formData: FormData): Promise<void> {
  await run(
    formData,
    async () => {
      const ctx = await requireApiUser();
      const input = refundExceptionAskSchema.safeParse({ refundPaise: parseRupees(str(formData, "amount")) ?? Number.NaN, reason: str(formData, "reason") });
      if (!input.success) throw new AccessError("common.checkTheForm");
      await askRefundException(ctx, str(formData, "applicationId"), input.data);
    },
    "collegeDesks.refundAsked",
  );
}

export async function decideRefundExceptionAction(formData: FormData): Promise<void> {
  await run(
    formData,
    async () => {
      const ctx = await requireApiUser();
      const input = headDecisionSchema.parse({ approve: str(formData, "decision") === "APPROVE", note: str(formData, "note") });
      await decideRefundException(ctx, str(formData, "applicationId"), input);
    },
    "collegeDesks.decided",
  );
}
