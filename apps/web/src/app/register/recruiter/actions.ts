"use server";

import { recruiterRegisterSchema } from "@edulink/contracts";
import { registerRecruiter } from "@/lib/recruiters";
import { createSession } from "@/lib/session";
import { getLocale, getT } from "@/lib/i18n/server";
import { retryHintKey } from "@/lib/rate-limit";

export type RecruiterRegisterState = { ok: boolean; error?: string; field?: string };

/**
 * A recruiter's own account, from the web's /register/recruiter (4 Oct 2026):
 * the lib makes it (src/lib/recruiters.ts), this signs them in with a cookie
 * and the form sends them to /recruiter. Every refusal comes back as a
 * sentence in the reader's language, with the field it is about.
 */
export async function registerRecruiterAction(input: unknown): Promise<RecruiterRegisterState> {
  const t = await getT();
  const parsed = recruiterRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.checkTheForm") };
  const made = await registerRecruiter(parsed.data, await getLocale());
  if (!made.ok) {
    if (made.retryAfterSeconds) {
      const hint = retryHintKey(made.retryAfterSeconds);
      return { ok: false, error: t("join.tooManyAccounts", { when: t(hint.key, hint.vars) }) };
    }
    return { ok: false, error: t(made.errorKey), field: made.field };
  }
  await createSession(made.userId, { schoolId: null, role: "RECRUITER" });
  return { ok: true };
}
