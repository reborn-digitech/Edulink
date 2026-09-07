"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { updateSchoolProfile, setProfilePublished } from "@/lib/school-profile";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Result = { ok: boolean; errorKey?: TranslationKey; error?: string };

async function run(work: () => Promise<Result>): Promise<Result> {
  try {
    const result = await work();
    revalidatePath("/admin/directory");
    revalidatePath("/explore");
    return result;
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[admin/directory]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

export async function saveProfile(input: {
  about: string;
  admissionsContactMembershipId: string | null;
}) {
  return run(async () => updateSchoolProfile(await requireApiRole("ADMIN"), input));
}

export async function setPublished(publish: boolean) {
  return run(async () => setProfilePublished(await requireApiRole("ADMIN"), publish));
}
