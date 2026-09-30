"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiAppAdmin, AccessError } from "@/lib/tenancy";
import { decideContribution, type ContributionDecision, type ContributionInput } from "@/lib/gig-questions";

type Result = { ok: true } | { ok: false; error: string };

/** The content team adds a teacher's question to the bank (with its own corrections, if any), returns it or rejects it. */
export async function decideContributionAction(contributionId: string, input: { decision: ContributionDecision; note?: string; edit?: Omit<ContributionInput, "terms"> }): Promise<Result> {
  try {
    const ctx = await requireApiAppAdmin();
    const result = await decideContribution(ctx, contributionId, { decision: input.decision, note: input.note, edit: input.edit ? { ...input.edit, terms: true } : undefined });
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey, result.vars) };
    revalidatePath("/appadmin/contributions");
    return { ok: true };
  } catch (error) {
    const t = await getT();
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[appadmin-contributions]", error);
    return { ok: false, error: t("common.tryAgainMoment") };
  }
}
