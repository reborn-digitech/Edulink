"use server";

import { cookies } from "next/headers";
import { createSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { resolveContext } from "@/lib/resolve-context";
import { callerKey, retryHintKey } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { TWO_FACTOR_COOKIE, twoFactorCookieOptions, verifyTwoFactor } from "@/lib/two-factor";
import type { LoginState } from "../actions";

/**
 * The second step of a web sign-in: the code from the authenticator app (or
 * a recovery code) against the challenge the first step left in the cookie.
 *
 * A right code mints the session exactly as `login` would have — the same
 * resolveContext, createSession and audit line, with how the first step was
 * passed in the meta. A dead challenge (expired, spent, five wrong codes)
 * sends the person back to the start with one sentence; the cookie goes
 * with it.
 */
export async function completeTwoFactor(input: unknown): Promise<LoginState> {
  const t = await getT();
  const code = typeof input === "object" && input !== null && typeof (input as { code?: unknown }).code === "string" ? (input as { code: string }).code : "";
  if (code.trim().length < 6) return { ok: false, errors: { code: t("totp.wrongCode") } };

  const jar = await cookies();
  const challenge = jar.get(TWO_FACTOR_COOKIE)?.value ?? "";
  const result = await verifyTwoFactor(challenge, code, { caller: await callerKey() });
  if (!result.ok) {
    if (result.reason === "rate") {
      const h = retryHintKey(result.retryAfterSeconds);
      return { ok: false, errors: { _form: t("login.tooManyAttempts", { when: t(h.key, h.vars) }) } };
    }
    if (result.reason === "wrong") return { ok: false, errors: { code: t("totp.wrongCodeLeft", { count: result.attemptsLeft }) } };
    jar.set(TWO_FACTOR_COOKIE, "", { ...twoFactorCookieOptions(), maxAge: 0 });
    return { ok: false, errors: {}, redirectTo: "/login?step=expired" };
  }

  const context = await resolveContext(result.userId, result.lastRole, result.lastSchoolId);
  await createSession(result.userId, { schoolId: context.schoolId, role: context.role });
  await audit({
    schoolId: context.schoolId,
    actorUserId: result.userId,
    action: "auth.login",
    meta: { via: `totp:${result.via}`, role: context.role, recovery: result.recovery },
  });
  jar.set(TWO_FACTOR_COOKIE, "", { ...twoFactorCookieOptions(), maxAge: 0 });
  return { ok: true, errors: {}, redirectTo: context.redirectTo };
}
