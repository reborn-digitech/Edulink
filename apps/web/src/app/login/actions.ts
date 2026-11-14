"use server";

import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/crypto";
import { signInWithPassword } from "@/lib/auth-login";
import { createSession } from "@/lib/session";
import {
  loginSchema,
  magicLinkSchema,
  resetRequestSchema,
  resetSchema,
  fieldErrors,
  type FieldErrors,
} from "@/lib/validation";
import { requestPasswordReset, resetPassword } from "@/lib/passwords";
import { consume, consumeByCaller, retryHintKey, LOGIN_PER_ADDRESS, RESET_REQUESTS } from "@/lib/rate-limit";
import { isDeliverableEmail } from "@/lib/login-name";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { localeForUser, sendMagicLink } from "@/lib/email";
import { audit } from "@/lib/audit";
import { resolveContext } from "@/lib/resolve-context";
import { MAGIC_LINK_TTL_MINUTES } from "@/lib/constants";
import { refusalText } from "@/lib/i18n/refusal";
import { cookies } from "next/headers";
import { twoFactorChallengeFor, twoFactorCookieOptions, TWO_FACTOR_COOKIE } from "@/lib/two-factor";
import { afterResponse } from "@/lib/after-response";

/** "in about 5 minutes", in the reader's language. See `retryHintKey`. */
function hint(t: Translate, seconds: number): string {
  const h = retryHintKey(seconds);
  return t(h.key, h.vars);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type LoginState = {
  ok: boolean;
  errors: FieldErrors;
  redirectTo?: string;
  /** The password was right and a code from the authenticator app is asked for next, at redirectTo. */
  twoFactor?: boolean;
};

/**
 * Password login, with whatever the person actually has.
 *
 * AN EMAIL, A MOBILE NUMBER, OR A HANDLE, resolved by shape in `findAccount` —
 * a pupil who joined with a class code has a generated handle like `amara.k4f9`
 * and no address at all, and a parent is far more likely to remember a phone
 * number than which address the school typed in.
 *
 * Failure is always the same message and always costs roughly the same time,
 * whether the account exists, has no password set, or the password is wrong.
 * Anything else turns the login form into an account-enumeration oracle — which
 * for a service holding children's records is a real safeguarding problem, not
 * a theoretical one. That is also why the message names no channel: "that login
 * and password do not match" says nothing about whether the login was one we
 * recognise.
 */
export async function login(input: unknown): Promise<LoginState> {
  const t = await getT();
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  const { identifier, password } = parsed.data;

  // The check itself lives in lib/auth-login.ts, shared with the phone's
  // sign-in endpoint; this action adds the words and the cookie.
  const signIn = await signInWithPassword(identifier, password);
  if (!signIn.ok) {
    if (signIn.reason === "rate") {
      return { ok: false, errors: { _form: t("login.tooManyAttempts", { when: hint(t, signIn.retryAfterSeconds) }) } };
    }
    // The operator closed this outside account (G4-28): said in a sentence, not as "no match".
    if (signIn.reason === "closed") return { ok: false, errors: { _form: t(signIn.kind === "RECRUITER" ? "riskDecisions.signInClosedRecruiter" : "riskDecisions.signInClosedExpert") } };
    return { ok: false, errors: { _form: t("login.noMatch") } };
  }
  const user = { id: signIn.userId, lastRole: signIn.lastRole, lastSchoolId: signIn.lastSchoolId };

  // Two-step sign-in: no session yet. The challenge rides a five-minute
  // cookie to /login/code, whose action mints the session the way this one
  // would have — see src/lib/two-factor.ts.
  const challenge = await twoFactorChallengeFor(user.id, "password");
  if (challenge) {
    const jar = await cookies();
    jar.set(TWO_FACTOR_COOKIE, challenge, twoFactorCookieOptions());
    return { ok: true, errors: {}, redirectTo: "/login/code", twoFactor: true };
  }

  const context = await resolveContext(user.id, user.lastRole, user.lastSchoolId);

  await createSession(user.id, { schoolId: context.schoolId, role: context.role });
  await audit({
    schoolId: context.schoolId,
    actorUserId: user.id,
    action: "auth.login",
    meta: { role: context.role },
  });

  return { ok: true, errors: {}, redirectTo: context.redirectTo };
}

/**
 * Magic link. Always reports success, again to avoid confirming whether an
 * address is registered.
 */
export async function requestMagicLink(input: unknown): Promise<LoginState> {
  const t = await getT();
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  const { email } = parsed.data;

  /**
   * ⚠ THIS SENDS MAIL AND HAD NO LIMIT, which went unnoticed while the link it
   * sent led nowhere. Building the route that redeems it turned a dead endpoint
   * into a working mailer, and a working mailer with no ceiling is the thing
   * `RESET_REQUESTS` was added to prevent — someone can put a registered
   * address in and hold the button.
   *
   * Keyed on what was TYPED and consumed BEFORE the lookup, for the reason the
   * reset flow spells out: an address matching nobody must be limited exactly
   * like one that does, or the limiter becomes the enumeration oracle this
   * function's "always report success" is careful not to be.
   */
  // TA-245: and per ADDRESS, whatever it typed, before anything else: the bucket below is per identifier, so one
  // caller walking a list of parents' addresses met a fresh limit at each and had the platform mail them all. The
  // same fifty a quarter-hour the reset gives one address (TA-002), known and unknown addresses alike.
  const address = await consumeByCaller("magic-addr", LOGIN_PER_ADDRESS);
  if (!address.allowed) {
    return {
      ok: false,
      errors: { _form: t("login.tooManyRequests", { when: hint(t, address.retryAfterSeconds) }) },
    };
  }

  const gate = await consume(`magic:${email}`, RESET_REQUESTS.limit, RESET_REQUESTS.windowMs);
  if (!gate.allowed) {
    return {
      ok: false,
      errors: { _form: t("login.tooManyRequests", { when: hint(t, gate.retryAfterSeconds) }) },
    };
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true, disabledAt: true } });

  /**
   * MINTED AND SENT AFTER THE RESPONSE, whether or not there is anybody to send
   * to. The answer used to wait on the SMTP round trip only when the account
   * existed, so the time it took to say "if that address is registered, we
   * have emailed it" was itself the answer to whether it was registered. The
   * lookup above costs the same either way; everything that does not is
   * deferred, so the form hears back at the same moment for a stranger and
   * for a member.
   */
  // A pupil's login name is not an address (TA-551, login-name.ts): no link is minted or mailed to one, and the
  // answer is the one an unknown address gets.
  const userId = user && !user.disabledAt && isDeliverableEmail(email) ? user.id : null;
  afterResponse("requestMagicLink")(async () => {
    if (!userId) return;
    const token = generateToken();
    await db.authToken.create({
      data: {
        userId,
        email,
        purpose: "MAGIC_LINK",
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60_000),
      },
    });
    await sendMagicLink(email, `${APP_URL}/magic?token=${token}`, MAGIC_LINK_TTL_MINUTES, await localeForUser(userId));
  });

  return { ok: true, errors: {} };
}

/* -------------------------------------------------------------------------- */
/* Forgotten passwords                                                         */
/* -------------------------------------------------------------------------- */

export type ResetRequestState = {
  ok: boolean;
  errors: FieldErrors;
  /** Last four digits of what the caller typed, for a phone. Never ours. */
  hint?: string;
  channel?: "EMAIL" | "PHONE";
};

/**
 * "Send me a code."
 *
 * Reports the same thing whether or not the account exists, exactly as the
 * magic link does — see the note on `requestPasswordReset`.
 */
export async function requestReset(input: unknown): Promise<ResetRequestState> {
  const t = await getT();
  const parsed = resetRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  // The code is written and sent after the response, whether or not there is anybody to send it to (QA-24).
  const result = await requestPasswordReset(parsed.data.identifier, { defer: afterResponse("requestReset") });
  if (!result.ok) {
    // The lib mints a KEY; this boundary turns it into the reader's words.
    return {
      ok: false,
      errors: {
        _form: result.errorKey
          ? refusalText(t, { errorKey: result.errorKey, retryAfterSeconds: result.retryAfterSeconds })
          : t("login.tryAgainShortly"),
      },
    };
  }
  return { ok: true, errors: {}, hint: result.hint, channel: result.channel };
}

/** "Here is the code, and my new password." */
export async function completeReset(input: unknown): Promise<LoginState> {
  const t = await getT();
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  const { identifier, code, password } = parsed.data;
  const result = await resetPassword(identifier, code, password);
  if (!result.ok) {
    return {
      ok: false,
      errors: {
        _form: result.errorKey
          ? refusalText(t, { errorKey: result.errorKey, retryAfterSeconds: result.retryAfterSeconds })
          : t("login.didNotWork"),
      },
    };
  }

  /**
   * NO SESSION IS CREATED HERE, on purpose. `resetPassword` has just revoked
   * every session this account had — signing the browser straight back in would
   * mean the one action whose purpose is "lock everybody out" ends with somebody
   * logged in, and it would do it before they have typed the new password once.
   * They go to the login form and use it.
   */
  return { ok: true, errors: {}, redirectTo: "/login?reset=1" };
}
