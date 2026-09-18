"use server";

import { revalidatePath } from "next/cache";
import { substitutionAssignSchema, substitutionClearSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { assignSubstitute, clearSubstitution } from "@/lib/substitutions";

/**
 * The office's two writes on the substitution board — name who covers a
 * lesson, take the cover away — as the web board calls them. Who may do
 * either is settled inside src/lib/substitutions.ts; this file only checks
 * the shape and turns a refusal into a key the board can say in the reader's
 * language. Only async functions and types may be exported from a
 * "use server" file — see tests/use-server-exports.test.ts.
 */
export type SubstitutionActionResult = { ok: boolean; changed?: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

function failure(error: unknown): SubstitutionActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[substitutions]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function refresh() {
  revalidatePath("/admin/substitutions");
  revalidatePath("/admin/substitutions/print");
  revalidatePath("/teacher");
}

export async function assignSubstituteAction(input: unknown): Promise<SubstitutionActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = substitutionAssignSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const { changed } = await assignSubstitute(ctx, parsed.data);
    refresh();
    return { ok: true, changed };
  } catch (error) {
    return failure(error);
  }
}

export async function clearSubstitutionAction(input: unknown): Promise<SubstitutionActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = substitutionClearSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const { changed } = await clearSubstitution(ctx, parsed.data);
    refresh();
    return { ok: true, changed };
  } catch (error) {
    return failure(error);
  }
}
