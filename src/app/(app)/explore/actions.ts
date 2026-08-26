"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { openEnquiry } from "@/lib/enquiries";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Result = { ok: boolean; errorKey?: TranslationKey; error?: string; enquiryId?: string };

/** A parent's admissions enquiry, from a school's profile page. */
export async function askAboutAdmission(schoolId: string, body: string): Promise<Result> {
  try {
    const ctx = await requireApiUser();
    const result = await openEnquiry(ctx, { schoolId, kind: "ADMISSION", body });
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/enquiries");
    return { ok: true, enquiryId: result.enquiryId };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[explore]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}
