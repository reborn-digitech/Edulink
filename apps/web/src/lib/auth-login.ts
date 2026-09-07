import "server-only";
import { db } from "./db";
import { fakePasswordWork, verifyPassword } from "./crypto";
import { findAccount } from "./passwords";
import { consume, LOGIN_ATTEMPTS } from "./rate-limit";
import { audit } from "./audit";

/**
 * The password check, apart from any session or cookie.
 *
 * The login server action and POST /api/v1/auth/login both need exactly this
 * and nothing else in common: the rate limit keyed on what was typed, the
 * account lookup, a constant-time refusal for an unknown or password-less
 * account (so an attacker cannot tell the two apart by timing), the audit
 * row on a wrong password. What happens next differs — a cookie for the
 * browser, a bearer token for the phone — so it is not here.
 */
export type PasswordSignIn =
  | { ok: true; userId: string; lastRole: string | null; lastSchoolId: string | null }
  | { ok: false; reason: "rate"; retryAfterSeconds: number }
  | { ok: false; reason: "noMatch" };

export async function signInWithPassword(identifier: string, password: string): Promise<PasswordSignIn> {
  const gate = await consume(`login:${identifier.toLowerCase()}`, LOGIN_ATTEMPTS.limit, LOGIN_ATTEMPTS.windowMs);
  if (!gate.allowed) return { ok: false, reason: "rate", retryAfterSeconds: gate.retryAfterSeconds };

  const account = await findAccount(identifier);
  if (!account || account.disabled) {
    await fakePasswordWork();
    return { ok: false, reason: "noMatch" };
  }

  const user = await db.user.findUnique({
    where: { id: account.userId },
    select: { id: true, passwordHash: true, lastRole: true, lastSchoolId: true },
  });
  if (!user?.passwordHash) {
    await fakePasswordWork();
    return { ok: false, reason: "noMatch" };
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await audit({ actorUserId: user.id, action: "auth.login.failed" });
    return { ok: false, reason: "noMatch" };
  }
  return { ok: true, userId: user.id, lastRole: user.lastRole, lastSchoolId: user.lastSchoolId };
}
