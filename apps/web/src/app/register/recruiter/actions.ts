"use server";

import { recruiterRegisterSchema } from "@edulink/contracts";
import { registerRecruiter } from "@/lib/recruiters";
import { afterResponse } from "@/lib/after-response";
import { getLocale, getT } from "@/lib/i18n/server";
import { retryHintKey } from "@/lib/rate-limit";

/** `sent`: the form was in order and a message is on its way to the address; nothing says whether an account was made. */
export type RecruiterRegisterState = { ok: boolean; error?: string; field?: string; sent?: string };

/**
 * A recruiter's own account, from the web's /register/recruiter (4 Oct 2026):
 * the lib makes it (src/lib/recruiters.ts) after the response. Every refusal
 * comes back as a sentence in the reader's language, with the field it is
 * about; a form in order is answered with one sentence and no session,
 * whether or not the address already had an account (QA-25, 24 Oct 2026).
 */
export async function registerRecruiterAction(input: unknown): Promise<RecruiterRegisterState> {
  const t = await getT();
  const parsed = recruiterRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: t("common.checkTheForm") };
  const made = await registerRecruiter(parsed.data, await getLocale(), { defer: afterResponse("recruiter-register") });
  if (!made.ok) {
    if (made.retryAfterSeconds) {
      const hint = retryHintKey(made.retryAfterSeconds);
      return { ok: false, error: t("join.tooManyAccounts", { when: t(hint.key, hint.vars) }) };
    }
    return { ok: false, error: t(made.errorKey), field: made.field };
  }
  return { ok: true, sent: t("accountGuard.signupSent", { email: parsed.data.email.trim().toLowerCase() }) };
}
