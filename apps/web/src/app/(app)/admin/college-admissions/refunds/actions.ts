"use server";

import { headDecisionSchema, refundExceptionAskSchema } from "@edulink/contracts";
import { parseRupees } from "@edulink/i18n";
import { requireApiUser } from "@/lib/tenancy";
import { answerForm } from "@/lib/form-action";
import type { FieldMap, FormState } from "@/lib/form-state";
import { askRefundException, decideRefundException } from "@/lib/head-approvals";

/**
 * A refund outside the slab's two forms (5 Oct 2026): the office's ask on a
 * cancelled seat's page, and the principal's word on it from the list or the
 * same page. Each answers in place on the page it came from; who may do what is head-approvals.ts's.
 */
const BACK = /^\/admin\/college-admissions(\/[\w-]*)*$/;
const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/** Answers in place (A3-journeys-27, risks batch): a refusal keeps the amount and reason typed, by their boxes; done is a toast. */
const ASK_FIELDS: FieldMap = { refundPaise: "amount" };
async function run(previous: FormState, formData: FormData, work: () => Promise<void>, done: "collegeDesks.refundAsked" | "collegeDesks.decided"): Promise<FormState> {
  const raw = str(formData, "back");
  const back = BACK.test(raw) ? raw : "/admin/college-admissions/refunds";
  return answerForm(
    previous,
    formData,
    async () => {
      await work();
      return done;
    },
    { revalidate: [back], fields: ASK_FIELDS },
  );
}

export async function askRefundExceptionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(
    previous,
    formData,
    async () => {
      const ctx = await requireApiUser();
      const input = refundExceptionAskSchema.parse({ refundPaise: parseRupees(str(formData, "amount")) ?? Number.NaN, reason: str(formData, "reason") });
      await askRefundException(ctx, str(formData, "applicationId"), input);
    },
    "collegeDesks.refundAsked",
  );
}

export async function decideRefundExceptionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(
    previous,
    formData,
    async () => {
      const ctx = await requireApiUser();
      const input = headDecisionSchema.parse({ approve: str(formData, "decision") === "APPROVE", note: str(formData, "note") });
      await decideRefundException(ctx, str(formData, "applicationId"), input);
    },
    "collegeDesks.decided",
  );
}
