"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { openEnquiry } from "@/lib/enquiries";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Result = { ok: boolean; errorKey?: TranslationKey; error?: string; enquiryId?: string };

/** A teacher's enquiry to another school's hiring contact. */
export async function askAboutVacancy(
  schoolId: string,
  jobPostingId: string,
  body: string,
): Promise<Result> {
  try {
    const ctx = await requireApiUser();
    const result = await openEnquiry(ctx, { schoolId, kind: "JOB", jobPostingId, body });
    if (!result.ok) return { ok: false, errorKey: result.errorKey };
    revalidatePath("/enquiries");
    return { ok: true, enquiryId: result.enquiryId };
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[vacancies]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}
