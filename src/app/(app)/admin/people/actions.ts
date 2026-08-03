"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { suspendMembership, reinstateMembership } from "@/lib/membership";

/**
 * Pausing and restoring access, from the directory.
 *
 * The role is re-read from the SESSION on every call rather than passed in, and
 * the membership id travels in the request — so it is re-scoped to the admin's
 * own school inside `membership.ts`. A guessed id belonging to another school is
 * "not in this school", not somebody else's teacher.
 */

type Result = { ok: boolean; error?: string };

function failure(error: unknown): Result {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  console.error("[people]", error);
  return { ok: false, error: "Something went wrong. Try again in a moment." };
}

export async function suspend(membershipId: string, reason: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await suspendMembership(ctx, membershipId, reason);
    if (!result.ok) return { ok: false, error: result.error };
    revalidatePath("/admin/people");
    revalidatePath("/admin/safety");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function reinstate(membershipId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await reinstateMembership(ctx, membershipId);
    if (!result.ok) return { ok: false, error: result.error };
    revalidatePath("/admin/people");
    revalidatePath("/admin/safety");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
