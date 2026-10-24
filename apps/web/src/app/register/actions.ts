"use server";

import { checkStreams } from "@/lib/streams";
import { passwordProblems } from "@/lib/crypto";
import { registerSchoolSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { getT, getLocale } from "@/lib/i18n/server";
import { consumeByCaller, retryHintKey, SIGNUPS } from "@/lib/rate-limit";
import { afterResponse } from "@/lib/after-response";
import { completeSchoolRegistration } from "@/lib/school-signup";

export type RegisterState = {
  ok: boolean;
  errors: FieldErrors;
  /**
   * Set on success: the one sentence a form in order is answered with,
   * whether or not the founder's address already had an account (QA-25).
   */
  sent?: string;
};

/**
 * Registers a school and its first admin.
 *
 * ⚠ THE SAME ANSWER WHETHER OR NOT THE ADDRESS IS TAKEN (QA-25, 24 Oct 2026).
 * This used to refuse a taken address with "an account already uses this
 * email", and the wizard asked the server on every blur whether an address
 * was free — so a signed-out caller could learn whether any parent's, pupil's
 * or teacher's address had an account. Now the refusals here are about the
 * form alone (the fields, the streams, the password's quality, the limit), a
 * form in order is answered "a message is on its way" and NO SESSION, and the
 * rest runs after the response (src/lib/school-signup.ts): a free address gets
 * its school, its admin account and the confirmation link, and the founder
 * signs in with the password they chose; the holder of a taken address is told
 * by email that somebody tried, and nothing is made. The time the answer takes
 * says nothing either, since the lookup and the transaction come after it.
 */
export async function registerSchool(input: unknown): Promise<RegisterState> {
  const parsed = registerSchoolSchema.safeParse(input);
  if (!parsed.success) {
    // Custom messages on the shared schemas are KEYS; `fieldErrors` turns
    // them into this reader's words when handed `t`.
    return { ok: false, errors: fieldErrors(parsed.error, await getT()) };
  }

  const { school, admin, kind, streams } = parsed.data;

  // A college says which streams it teaches (5 Oct 2026): none is refused here, on the field the wizard draws.
  const streamsRefusal = checkStreams(kind, streams);
  if (streamsRefusal) return { ok: false, errors: { streams: (await getT())(streamsRefusal) } };

  /**
   * ⚠ REGISTERING A SCHOOL MINTS A TENANT AND ITS ADMIN IN ONE PRESS, and an
   * admin can run intake — which links existing pupils by code and birthday.
   * The handshake in lib/pen.ts is what keeps a freshly minted school from
   * bringing anybody over; this is what keeps the minting itself from being
   * free. Same allowance as a parent signing up, in its own bucket.
   */
  const gate = await consumeByCaller("register", SIGNUPS);
  if (!gate.allowed) {
    const t = await getT();
    const hint = retryHintKey(gate.retryAfterSeconds);
    return { ok: false, errors: { _form: t("join.tooManyAccounts", { when: t(hint.key, hint.vars) }) } };
  }

  // Password quality is checked against the person's own details, which the
  // generic length rule cannot see.
  const problems = passwordProblems(admin.password, [admin.name, admin.email, school.name]);
  if (problems.length > 0) {
    return { ok: false, errors: { "admin.password": (await getT())(problems[0]!) } };
  }

  /**
   * ⚠ THE LANGUAGE THEY REGISTERED IN, not "en".
   *
   * This wrote `locale: "en"` flat. `getLocale` prefers `prefs.locale` the
   * moment a session exists, so a head teacher who read the landing page in
   * Marathi, filled this form in in Marathi and pressed the button was signed
   * straight into an English dashboard — and the only way back was a settings
   * page they now could not read. The cookie is the ONLY signal there is before
   * an account exists, which is exactly what it is for.
   */
  const locale = await getLocale();
  const t = await getT();

  afterResponse("register")(async () => {
    await completeSchoolRegistration(parsed.data, locale);
  });

  return { ok: true, errors: {}, sent: t("accountGuard.signupSent", { email: admin.email }) };
}
