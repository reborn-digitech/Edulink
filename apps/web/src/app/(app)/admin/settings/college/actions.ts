"use server";

import { revalidatePath } from "next/cache";
import { collegeProfileSetSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setCollegeProfile } from "@/lib/college-profile";
import { RuleRefusal } from "@/lib/rule-refusal";

/** A college's regulator references and streams from /admin/settings/college: the office's alone, audited by setCollegeProfile (and college.streams.set). */
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
    // A list of streams that cannot stand (none, 5 Oct 2026) is the rule's own sentence.
    if (error instanceof RuleRefusal) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[saveCollegeProfile]", error);
    return { ok: false, error: (await getT())("common.tryAgain") };
  }
}
