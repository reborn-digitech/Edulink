"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { replyToEnquiry, closeEnquiry } from "@/lib/enquiries";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Result = { ok: boolean; errorKey?: TranslationKey; error?: string };

async function run(work: () => Promise<Result>): Promise<Result> {
  try {
    const result = await work();
    revalidatePath("/enquiries");
    return result;
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[enquiries]", error);
    return { ok: false, errorKey: "common.somethingWrong" };
  }
}

/** Either side replies; the lib decides who may. */
export async function reply(enquiryId: string, body: string) {
  return run(async () => replyToEnquiry(await requireApiUser(), enquiryId, body));
}

/** The school side ends the conversation. */
export async function close(enquiryId: string) {
  return run(async () => closeEnquiry(await requireApiUser(), enquiryId));
}
