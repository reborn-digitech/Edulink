"use server";

import { revalidatePath } from "next/cache";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { updateOwnProfile } from "@/lib/experts";
import type { ExpertOffering } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/** See the note in `expert/availability/actions.ts` on the two-field shape. */
type Result = { ok: boolean; errorKey?: TranslationKey; error?: string };

export async function save(input: {
  headline: string;
  bio: string;
  organisation: string;
  specialisms: string[];
  timezone: string;
  offering: ExpertOffering;
  mentorCapacity: number | null;
}): Promise<Result> {
  try {
    await updateOwnProfile(await requireApiUser(), input);
    // The marketplace reads the same row, so a school looking at this expert
    // sees the edit rather than a cached version of the old headline.
    revalidatePath("/expert/profile");
    revalidatePath("/experts");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[expert-profile]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}
