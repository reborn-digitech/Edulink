"use server";

import { revalidatePath } from "next/cache";
import { appraisalSaveSchema } from "@edulink/contracts";
import { z } from "zod";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { createAppraisal, deleteAppraisal, updateAppraisal } from "@/lib/appraisal";

/**
 * The head's three writes on a member of staff's timeline, as the page
 * calls them. Who may write is settled in src/lib/appraisal.ts (the head,
 * never about themselves); this file checks the shape and turns a refusal
 * into a key the page can say in the reader's language.
 */
export type AppraisalActionResult = { ok: boolean; id?: string; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/);

function failure(error: unknown): AppraisalActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[appraisal]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function refresh(membershipId: string) {
  revalidatePath(`/principal/staff/${membershipId}/appraisal`);
  revalidatePath("/teacher/appraisals");
}

export async function createAppraisalAction(input: { membershipId: string; entry: unknown }): Promise<AppraisalActionResult> {
  try {
    const ctx = await requireApiUser();
    const id = cuid.safeParse(input.membershipId);
    const parsed = appraisalSaveSchema.safeParse(input.entry);
    if (!id.success || !parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const row = await createAppraisal(ctx, id.data, parsed.data);
    refresh(id.data);
    return { ok: true, id: row.id };
  } catch (error) {
    return failure(error);
  }
}

export async function updateAppraisalAction(input: { membershipId: string; appraisalId: string; entry: unknown }): Promise<AppraisalActionResult> {
  try {
    const ctx = await requireApiUser();
    const id = cuid.safeParse(input.appraisalId);
    const parsed = appraisalSaveSchema.safeParse(input.entry);
    if (!id.success || !parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    await updateAppraisal(ctx, id.data, parsed.data);
    refresh(input.membershipId);
    return { ok: true, id: id.data };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteAppraisalAction(input: { membershipId: string; appraisalId: string }): Promise<AppraisalActionResult> {
  try {
    const ctx = await requireApiUser();
    const id = cuid.safeParse(input.appraisalId);
    if (!id.success) return { ok: false, errorKey: "common.checkTheForm" };
    await deleteAppraisal(ctx, id.data);
    refresh(input.membershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
