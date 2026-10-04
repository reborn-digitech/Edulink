"use server";

import { revalidatePath } from "next/cache";
import { studentConsentSetSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { setStudentConsent } from "@/lib/student-consent";

/** Grant or revoke one thing a guardian may see, from /student/consent: the student's alone, audited by setStudentConsent. */
export async function saveConsent(input: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = studentConsentSetSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: (await getT())("common.tryAgain") };
    await setStudentConsent(ctx, parsed.data.grant, parsed.data.on);
    revalidatePath("/student/consent");
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[saveConsent]", error);
    return { ok: false, error: (await getT())("common.tryAgain") };
  }
}
