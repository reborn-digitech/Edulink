"use server";

import { revalidatePath } from "next/cache";
import { studentConsentSetSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setStudentConsent } from "@/lib/student-consent";
import { decideClaim } from "@/lib/guardian-claims";
import { endGuardianLinkAsStudent } from "@/lib/guardianship";

type Result = { ok: boolean; error?: string };

/** One boundary for the page's three writes: a refusal in the reader's words, anything else "try again". */
async function act(name: string, run: () => Promise<void>): Promise<Result> {
  try {
    await run();
    revalidatePath("/student/consent");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error(`[${name}]`, error);
    return { ok: false, error: (await getT())("common.tryAgain") };
  }
}

/**
 * Grant or revoke one thing ONE guardian may see (the guardianship named; with none named, every family guardian
 * linked now), from /student/consent: the student's alone, audited by setStudentConsent.
 */
export async function saveConsent(input: unknown): Promise<Result> {
  return act("saveConsent", async () => {
    const ctx = await requireApiRole("STUDENT");
    const parsed = studentConsentSetSchema.safeParse(input);
    if (!parsed.success) throw new AccessError("common.tryAgain");
    await setStudentConsent(ctx, parsed.data.grant, parsed.data.on, parsed.data.guardianshipId);
  });
}

/** The student's own yes or no to somebody asking to be their guardian (TA-555): decideClaim's rule decides who may. */
export async function answerGuardianClaim(claimId: string, decision: "APPROVE" | "DECLINE"): Promise<Result> {
  return act("answerGuardianClaim", async () => {
    const ctx = await requireApiRole("STUDENT");
    if (typeof claimId !== "string" || (decision !== "APPROVE" && decision !== "DECLINE")) throw new AccessError("common.tryAgain");
    await decideClaim(ctx, claimId, decision);
  });
}

/** The student ends one of their own guardians' links (TA-555): its grants go with it, audited by endGuardianLinkAsStudent. */
export async function endGuardianLink(guardianshipId: string): Promise<Result> {
  return act("endGuardianLink", async () => {
    const ctx = await requireApiRole("STUDENT");
    if (typeof guardianshipId !== "string") throw new AccessError("common.tryAgain");
    await endGuardianLinkAsStudent(ctx, guardianshipId);
  });
}
