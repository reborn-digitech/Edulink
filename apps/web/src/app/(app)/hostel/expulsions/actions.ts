"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headDecisionSchema, hostelExpulsionProposeSchema } from "@edulink/contracts";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { decideExpulsion, proposeExpulsion, withdrawExpulsion } from "@/lib/head-approvals";

/**
 * A hostel expulsion's forms (5 Oct 2026): the warden's or the office's
 * proposal, the principal's word, the proposer's withdrawal — each back to
 * /hostel/expulsions with ?ok= or ?error=. Who may do what is head-approvals.ts's.
 */
const BACK = "/hostel/expulsions";
const str = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

async function run(work: () => Promise<void>, done: "collegeDesks.expulsionProposed" | "collegeDesks.decided" | "collegeDesks.expulsionWithdrawn"): Promise<void> {
  const t = await getT();
  try {
    await work();
  } catch (error) {
    if (error instanceof AccessError) redirect(`${BACK}?error=${encodeURIComponent(t(error.key, error.vars))}`);
    throw error;
  }
  revalidatePath(BACK);
  redirect(`${BACK}?ok=${encodeURIComponent(t(done))}`);
}

export async function proposeExpulsionAction(formData: FormData): Promise<void> {
  await run(async () => {
    const ctx = await requireApiUser();
    const input = hostelExpulsionProposeSchema.safeParse({ allotmentId: str(formData, "allotmentId"), reason: str(formData, "reason"), incidentId: str(formData, "incidentId") || null, effectiveOn: str(formData, "effectiveOn") });
    if (!input.success) throw new AccessError("common.checkTheForm");
    await proposeExpulsion(ctx, input.data);
  }, "collegeDesks.expulsionProposed");
}

export async function decideExpulsionAction(formData: FormData): Promise<void> {
  await run(async () => {
    const ctx = await requireApiUser();
    await decideExpulsion(ctx, str(formData, "expulsionId"), headDecisionSchema.parse({ approve: str(formData, "decision") === "APPROVE", note: str(formData, "note") }));
  }, "collegeDesks.decided");
}

export async function withdrawExpulsionAction(formData: FormData): Promise<void> {
  await run(async () => {
    const ctx = await requireApiUser();
    await withdrawExpulsion(ctx, str(formData, "expulsionId"));
  }, "collegeDesks.expulsionWithdrawn");
}
