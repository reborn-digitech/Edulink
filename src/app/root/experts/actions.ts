"use server";

import { revalidatePath } from "next/cache";
import { requireSuperuser, AccessError } from "@/lib/tenancy";
import { setExpertStanding } from "@/lib/superuser";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/** See the note in `expert/availability/actions.ts` on the two-field shape. */
type Result = { ok: boolean; errorKey?: TranslationKey; error?: string };

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
    if (!result.ok) return { ok: false, error: result.error };
    revalidatePath("/root/experts");
    // The marketplace reads the same row. Without this a school browsing
    // `/experts` keeps seeing yesterday's list.
    revalidatePath("/experts");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[root-experts]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}
