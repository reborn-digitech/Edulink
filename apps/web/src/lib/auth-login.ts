import "server-only";
import { db } from "./db";
import { fakePasswordWork, verifyPassword } from "./crypto";
import { findAccount, loginIdentityKey } from "./passwords";
import { callerKey, consume, peek, LOGIN_ATTEMPTS, LOGIN_GLOBAL, LOGIN_PER_ADDRESS } from "./rate-limit";
import { audit } from "./audit";
import { closedOutsideAccount } from "./resolve-context";

/**
 * The password check, apart from any session or cookie.
 *
 * The login server action and POST /api/v1/auth/login both need exactly this
 * and nothing else in common: the rate limits, the account lookup, a
 * constant-time refusal for an unknown or password-less account (so an
 * attacker cannot tell the two apart by timing), the audit row on a wrong
 * password. What happens next differs — a cookie for the browser, a bearer
 * token for the phone — so it is not here.
 *
 * THREE LIMITS, because they stop three different attacks:
 *
 *   PER LOGIN, ten in fifteen minutes, keyed on the NORMALISED identity so
 *   `98765 43210`, `+919876543210` and `handle` / `handle@edulink.local` share
 *   one count. Keyed on the raw spelling, as it was, each spelling had its own
 *   ten. Counts every attempt, so it applies to logins that exist and logins
 *   that do not identically — the message may say so without leaking.
 *
 *   PER ADDRESS, fifty FAILURES in fifteen minutes whatever the login — the
 *   one that bounds spraying one password across a school's worth of logins.
 *
 *   GLOBAL, two thousand failures in fifteen minutes across the service — the
 *   one that bounds the same spray from many addresses.
 *
 * The last two are checked before the password is verified and charged only
 * after it fails, so a person signing in correctly consumes nothing from them;
 * a household that mistypes is nowhere near either.
 */
export type PasswordSignIn =
  | { ok: true; userId: string; lastRole: string | null; lastSchoolId: string | null }
  | { ok: false; reason: "rate"; retryAfterSeconds: number }
  | { ok: false; reason: "noMatch" }
  /** The password matched an outside account the operator closed, the person's only way in (G4-28): told, not let in. */
  | { ok: false; reason: "closed"; kind: "RECRUITER" | "EXPERT" };

const GLOBAL_BUCKET = "login-global";

export async function signInWithPassword(
  identifier: string,
  password: string,
  /**
   * Who is asking, when the caller already knows: `null` for nobody (a script,
   * a test), a string for an address. Left out, the request's own address is
   * read — which a test has none of, so a test that wants the per-address wall
   * passes one.
   */
  opts: { caller?: string | null } = {},
): Promise<PasswordSignIn> {
  const caller = opts.caller === undefined ? await callerKey() : opts.caller;
  const addressBucket = caller === null ? null : `login-addr:${caller}`;

  const gate = await consume(`login:${loginIdentityKey(identifier)}`, LOGIN_ATTEMPTS.limit, LOGIN_ATTEMPTS.windowMs);
  if (!gate.allowed) return { ok: false, reason: "rate", retryAfterSeconds: gate.retryAfterSeconds };

  if (addressBucket) {
    const address = await peek(addressBucket, LOGIN_PER_ADDRESS.limit);
    if (!address.allowed) return { ok: false, reason: "rate", retryAfterSeconds: address.retryAfterSeconds };
  }
  const global = await peek(GLOBAL_BUCKET, LOGIN_GLOBAL.limit);
  if (!global.allowed) return { ok: false, reason: "rate", retryAfterSeconds: global.retryAfterSeconds };

  // A failure, of any kind, is what the last two buckets count.
  const failed = async (): Promise<PasswordSignIn> => {
    if (addressBucket) await consume(addressBucket, LOGIN_PER_ADDRESS.limit, LOGIN_PER_ADDRESS.windowMs);
    await consume(GLOBAL_BUCKET, LOGIN_GLOBAL.limit, LOGIN_GLOBAL.windowMs);
    return { ok: false, reason: "noMatch" };
  };

  const account = await findAccount(identifier);
  if (!account || account.disabled) {
    await fakePasswordWork();
    return failed();
  }

  const user = await db.user.findUnique({
    where: { id: account.userId },
    select: { id: true, passwordHash: true, lastRole: true, lastSchoolId: true },
  });
  if (!user?.passwordHash) {
    await fakePasswordWork();
    return failed();
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await audit({ actorUserId: user.id, action: "auth.login.failed" });
    return failed();
  }
  // A right password to an account the operator closed (G4-28, risks batch 5 Oct 2026): a sentence, never a session.
  const closed = await closedOutsideAccount(user.id);
  if (closed) {
    await audit({ actorUserId: user.id, action: "auth.login.closed", meta: { kind: closed } });
    return { ok: false, reason: "closed", kind: closed };
  }
  return { ok: true, userId: user.id, lastRole: user.lastRole, lastSchoolId: user.lastSchoolId };
}
