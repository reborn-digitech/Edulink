"use server";

import { revalidatePath } from "next/cache";
import { collegeProfileSetSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setCollegeProfile } from "@/lib/college-profile";

/** A college's regulator references from /admin/settings/college: the office's alone, audited by setCollegeProfile. */
export async function saveCollegeProfile(input: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = collegeProfileSetSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())("college.profileCheck") };
    await setCollegeProfile(ctx, parsed.data);
    revalidatePath("/admin/settings/college");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[saveCollegeProfile]", error);
    return { ok: false, error: (await getT())("common.tryAgain") };
  }
}
