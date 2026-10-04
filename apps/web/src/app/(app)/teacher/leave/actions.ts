"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { applyForLeave, cancelLeave, LEAVE_APPLICANT_ROLES, type ApplyInput } from "@/lib/leave";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * Applying for leave, and withdrawing it.
 *
 * PRINCIPAL is accepted here as well as TEACHER: a principal is staff and takes
 * leave like anybody else. The approval side refuses self-approval separately,
 * so a principal's own request has to be answered by an admin or another
 * principal.
 */

type Result = {
  ok: boolean;
  error?: string;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
};

async function failure(error: unknown): Promise<Result> {
  if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
  console.error("[leave]", error);
  return { ok: false, error: (await getT())("common.tryAgainMoment") };
}

export async function apply(input: ApplyInput): Promise<Result> {
  try {
    // The module roles and the college's six staff roles apply from /account/leave (4 Oct 2026).
    const ctx = await requireApiRole(...LEAVE_APPLICANT_ROLES);
    const result = await applyForLeave(ctx, input);
    revalidatePath("/teacher/leave");
    revalidatePath("/account/leave");
    revalidatePath("/principal/leave");
    // The lib mints a KEY; forward it whole. Stripping it here was why an
    // overlap or a backwards date range answered with the generic fallback.
    return { ok: result.ok, error: result.error, errorKey: result.errorKey, errorVars: result.errorVars };
  } catch (error) {
    return failure(error);
  }
}

export async function withdraw(leaveId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole(...LEAVE_APPLICANT_ROLES, "ADMIN");
    const result = await cancelLeave(ctx, leaveId);
    revalidatePath("/teacher/leave");
    revalidatePath("/account/leave");
    revalidatePath("/principal/leave");
    // The lib mints a KEY; forward it whole. Stripping it here was why an
    // overlap or a backwards date range answered with the generic fallback.
    return { ok: result.ok, error: result.error, errorKey: result.errorKey, errorVars: result.errorVars };
  } catch (error) {
    return failure(error);
  }
}
