"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { decideJoin } from "@/lib/join-requests";
import { decideClaim } from "@/lib/guardian-claims";
import { getT } from "@/lib/i18n/server";

export type DecisionResult = { ok: boolean; error?: string };

async function decided(tag: string, work: () => Promise<void>): Promise<DecisionResult> {
  try {
    await work();
    revalidatePath("/joins");
    revalidatePath("/parent/claims");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error(tag, error);
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}

/** Lets somebody who typed a code in, or does not. Who may is `decideJoin`'s rule. */
export async function decideJoinRequest(requestId: string, decision: "APPROVE" | "DECLINE", reason?: string): Promise<DecisionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  return decided("[decide-join]", () => decideJoin(session, requestId, decision, reason));
}

/** Makes a claimant a child's guardian, or does not. Who may is `decideClaim`'s rule. */
export async function decideGuardianClaim(claimId: string, decision: "APPROVE" | "DECLINE", reason?: string): Promise<DecisionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };
  return decided("[decide-claim]", () => decideClaim(session, claimId, decision, reason));
}
