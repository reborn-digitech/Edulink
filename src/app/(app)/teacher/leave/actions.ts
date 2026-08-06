"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { applyForLeave, cancelLeave, type ApplyInput } from "@/lib/leave";

/**
 * Applying for leave, and withdrawing it.
 *
 * PRINCIPAL is accepted here as well as TEACHER: a principal is staff and takes
 * leave like anybody else. The approval side refuses self-approval separately,
 * so a principal's own request has to be answered by an admin or another
 * principal.
 */

type Result = { ok: boolean; error?: string };

async function failure(error: unknown): Promise<Result> {
  if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
  console.error("[leave]", error);
  return { ok: false, error: (await getT())("common.tryAgainMoment") };
}

export async function apply(input: ApplyInput): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "PRINCIPAL");
    const result = await applyForLeave(ctx, input);
    revalidatePath("/teacher/leave");
    revalidatePath("/principal/leave");
    return { ok: result.ok, error: result.error };
  } catch (error) {
    return failure(error);
  }
}

export async function withdraw(leaveId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("TEACHER", "PRINCIPAL", "ADMIN");
    const result = await cancelLeave(ctx, leaveId);
    revalidatePath("/teacher/leave");
    revalidatePath("/principal/leave");
    return { ok: result.ok, error: result.error };
  } catch (error) {
    return failure(error);
  }
}
