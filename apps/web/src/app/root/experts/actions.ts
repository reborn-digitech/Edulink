"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireSuperuser, AccessError } from "@/lib/tenancy";
import { setExpertStanding } from "@/lib/superuser";
import { decideKyc } from "@/lib/expert-kyc";
import { setExpertAccess } from "@/lib/operator-college";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/** See the note in `expert/availability/actions.ts` on the two-field shape. */
type Result = { ok: boolean; errorKey?: TranslationKey; error?: string; sessionsEnded?: number };

/**
 * Publishing an expert, and taking one back off the list.
 *
 * `published` and `verified` travel together because the form shows them
 * together — an operator sets the standing they intend, rather than pressing two
 * buttons and living with whatever the interleaving produced.
 */
export async function setStanding(
  profileId: string,
  next: { published: boolean; verified: boolean },
): Promise<Result> {
  try {
    const session = await requireSuperuser();
    const result = await setExpertStanding(session, profileId, next);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/experts");
    // The marketplace reads the same row. Without this a school browsing
    // `/experts` keeps seeing yesterday's list.
    revalidatePath("/experts");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[root-experts]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

/** The operator answers an expert's identity papers; the marketplace badge follows (one truth, see expert-kyc.ts). */
export async function decideKycAction(profileId: string, input: { decision: "VERIFIED" | "REJECTED"; note: string }): Promise<Result> {
  try {
    const session = await requireSuperuser();
    const result = await decideKyc(session, profileId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/experts");
    revalidatePath("/experts");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[root-experts-kyc]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

/**
 * Close an expert's account, or open it again (G4-28, risks batch 5 Oct 2026): the same library call as
 * POST /api/v1/operator/experts/{profileId}/access — no sign-in, no bookings, their sessions ended, told by email in
 * their own language; audited with the reason.
 */
export async function setExpertAccessAction(profileId: string, input: { disabled: boolean; reason?: string }): Promise<Result> {
  try {
    const session = await requireSuperuser();
    if (typeof input?.disabled !== "boolean") return { ok: false, error: (await getT())("common.tryAgain") };
    const result = await setExpertAccess(session, profileId, { disabled: input.disabled, reason: typeof input.reason === "string" ? input.reason.slice(0, 500) : undefined });
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/root/experts");
    revalidatePath("/experts");
    return { ok: true, sessionsEnded: result.sessionsEnded };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[root-experts-access]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}
