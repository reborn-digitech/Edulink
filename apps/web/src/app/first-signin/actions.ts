"use server";

import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { createSession } from "@/lib/session";
import { redeemFirstSignIn } from "@/lib/first-signin";
import { ROLE_HOME } from "@/lib/constants";
import { consumeByCaller, retryHintKey, CODE_LOOKUPS } from "@/lib/rate-limit";
import { fieldErrors, passwordSchema, type FieldErrors } from "@/lib/validation";
import { refusalText } from "@/lib/i18n/refusal";

export type FirstSignInState = { ok: boolean; errors: FieldErrors; redirectTo?: string };

const schema = z.object({
  handle: z.string().trim().min(1, "refusal.enterHandle").max(80),
  code: z.string().trim().min(1, "refusal.enterCode").max(20),
  password: passwordSchema,
});

/**
 * Handle + code + chosen password, and the pupil is in.
 *
 * A SESSION IS CREATED HERE, unlike a reset, because the purpose is the
 * opposite: a reset locks everybody out, this lets one child in for the first
 * time, and the password they have just chosen is the one they would type on
 * the next screen anyway. Same limit as the login form — a code is a
 * credential, and guessing one must cost what guessing a password costs.
 */
export async function completeFirstSignIn(input: unknown): Promise<FirstSignInState> {
  const t = await getT();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  // A class signs in together from the school's one address (TA-278): the per-address allowance is a computer
  // room's, as the class code's lookup is (CODE_LOOKUPS). Guessing stays bounded by the five tries on each code.
  const gate = await consumeByCaller("first-signin", CODE_LOOKUPS);
  if (!gate.allowed) {
    const hint = retryHintKey(gate.retryAfterSeconds);
    return { ok: false, errors: { _form: t("login.tooManyAttempts", { when: t(hint.key, hint.vars) }) } };
  }

  const { handle, code, password } = parsed.data;
  const result = await redeemFirstSignIn(handle, code, password);
  if (!result.ok) {
    return { ok: false, errors: { _form: refusalText(t, { errorKey: result.errorKey }) } };
  }

  await createSession(result.userId, { schoolId: result.schoolId, role: result.role });
  // A support worker (owner-batch-item2a) lands on their own payslips; a pupil on the welcome that shows their handle.
  if (result.role === "SUPPORT") return { ok: true, errors: {}, redirectTo: ROLE_HOME.SUPPORT };
  return { ok: true, errors: {}, redirectTo: `/student?welcome=1&handle=${encodeURIComponent(handle.trim().toLowerCase())}` };
}
