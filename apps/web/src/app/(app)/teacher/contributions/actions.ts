"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { draftTranslations, reviseContribution, savePayee, submitContribution, withdrawContribution, type ContributionInput, type GigResult } from "@/lib/gig-questions";
import type { QuestionText } from "@/lib/translate";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function failure(error: unknown): Promise<{ ok: false; error: string }> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  console.error("[teacher-contributions]", error);
  return { ok: false, error: t("common.tryAgainMoment") };
}
async function refusal(result: Extract<GigResult, { ok: false }>): Promise<{ ok: false; error: string }> {
  return { ok: false, error: (await getT())(result.errorKey, result.vars) };
}

/** Sends a new question, or changes one that is still open. */
export async function saveContributionAction(contributionId: string | null, input: ContributionInput): Promise<Result<{ id: string }>> {
  try {
    const ctx = await requireApiRole("TEACHER");
    const result = contributionId ? await reviseContribution(ctx, contributionId, input) : await submitContribution(ctx, input);
    if (!result.ok) return refusal(result);
    revalidatePath("/teacher/contributions");
    return { ok: true, id: result.contribution.id };
  } catch (error) {
    return failure(error);
  }
}

export async function withdrawContributionAction(contributionId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER");
    const result = await withdrawContribution(ctx, contributionId);
    if (!result.ok) return refusal(result);
    revalidatePath("/teacher/contributions");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function draftTranslationsAction(english: QuestionText): Promise<Result<{ hi: QuestionText; mr: QuestionText }>> {
  try {
    const ctx = await requireApiRole("TEACHER");
    const result = await draftTranslations(ctx, english);
    if (!result.ok) return refusal(result);
    return { ok: true, hi: result.hi, mr: result.mr };
  } catch (error) {
    return failure(error);
  }
}

export async function savePayeeAction(input: { upiId: string; payeeName: string }): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER");
    const result = await savePayee(ctx, input);
    if (!result.ok) return refusal(result);
    revalidatePath("/teacher/contributions");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
