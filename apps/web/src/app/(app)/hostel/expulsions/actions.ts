"use server";

import { headDecisionSchema, hostelExpulsionProposeSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";
import { decideExpulsion, proposeExpulsion, withdrawExpulsion } from "@/lib/head-approvals";

/**
 * A hostel expulsion's forms (5 Oct 2026): the warden's or the office's
 * proposal, the principal's word, the proposer's withdrawal — each back to
 * /hostel/expulsions, answering in place. Who may do what is head-approvals.ts's.
 */
const BACK = "/hostel/expulsions";
const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

/** Answers in place (A3-journeys-27, risks batch): a refusal keeps the reason typed and sits under its box; done is a toast. */
async function run(previous: FormState, formData: FormData, work: () => Promise<void>, done: "collegeDesks.expulsionProposed" | "collegeDesks.decided" | "collegeDesks.expulsionWithdrawn"): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      await work();
      return done;
    },
    { revalidate: [BACK] },
  );
}

export async function proposeExpulsionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async () => {
    const ctx = await requireApiUser();
    // A schema refusal names its box (the reason too short, the day not a day).
    await proposeExpulsion(ctx, hostelExpulsionProposeSchema.parse({ allotmentId: str(formData, "allotmentId"), reason: str(formData, "reason"), incidentId: str(formData, "incidentId") || null, effectiveOn: str(formData, "effectiveOn") }));
  }, "collegeDesks.expulsionProposed");
}

export async function decideExpulsionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async () => {
    const ctx = await requireApiUser();
    await decideExpulsion(ctx, str(formData, "expulsionId"), headDecisionSchema.parse({ approve: str(formData, "decision") === "APPROVE", note: str(formData, "note") }));
  }, "collegeDesks.decided");
}

export async function withdrawExpulsionAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async () => {
    const ctx = await requireApiUser();
    await withdrawExpulsion(ctx, str(formData, "expulsionId"));
  }, "collegeDesks.expulsionWithdrawn");
}
