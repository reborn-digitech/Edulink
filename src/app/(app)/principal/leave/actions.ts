"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { decideLeave } from "@/lib/leave";

/**
 * The principal's answer to a leave request.
 *
 * ADMIN is accepted as well as PRINCIPAL, for two reasons that are both about
 * the request not getting stuck: a school may not have filled the principal's
 * post, and a principal's own leave has to be decided by somebody who is not
 * them. `decideLeave` refuses self-approval regardless of role.
 */

type Result = { ok: boolean; error?: string; coversCreated?: number };

export async function decide(
  leaveId: string,
  decision: "APPROVED" | "DECLINED",
  opts: { note?: string; coverMembershipId?: string | null } = {},
): Promise<Result> {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const result = await decideLeave(ctx, leaveId, decision, opts);
    revalidatePath("/principal/leave");
    revalidatePath("/teacher/leave");
    revalidatePath("/admin/calendar");
    return { ok: result.ok, error: result.error, coversCreated: result.coversCreated };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[leave-decide]", error);
    return { ok: false, error: "Something went wrong. Try again in a moment." };
  }
}
