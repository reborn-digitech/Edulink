import "server-only";
import { db } from "./db";

/**
 * How many times something may be tried in a window.
 *
 * THE FIRST ONE IN THIS CODEBASE, and it exists because password reset by mobile
 * number changed what an unlimited form can do. An unlimited LOGIN form lets
 * somebody guess a password, slowly, against argon2 — bad, bounded, and noisy in
 * the audit log. An unlimited RESET form makes the app send a text to a number
 * the caller types, as often as they ask: pick a stranger's number and this
 * software becomes the thing harassing them, billed to whoever runs it.
 *
 * ONE FUNCTION, AND CALLERS NAME THEIR OWN BUCKET. `reset:+919876…`,
 * `login:amara@school.test`. Keeping the naming at the call site means the two
 * limits cannot accidentally share a counter — which would let a failed login
 * consume somebody's reset allowance, and is the sort of thing that is invisible
 * until the day it matters.
 *
 * IT FAILS OPEN, DELIBERATELY, AND THAT IS THE UNCOMFORTABLE CHOICE. If the
 * database is unreachable this returns "allowed" rather than throwing. The
 * alternative is that a limiter outage locks every person out of every account,
 * turning a degraded database into a total one. The threat this defends against
 * — somebody sending a stranger texts — is real and is not worth trading a
 * whole-service outage for. Said out loud rather than discovered.
 */

export type RateLimitResult = {
  allowed: boolean;
  /** How many are left in this window, after this call. */
  remaining: number;
  /** Seconds until the window resets. 0 when allowed. */
  retryAfterSeconds: number;
};

/**
 * Records one attempt against `bucket` and says whether it may proceed.
 *
 * A FIXED WINDOW. The honest limit: an attacker timing a burst either side of a
 * boundary gets twice the allowance for one moment. Against "send a stranger
 * three texts" that is a rounding error, and a sliding window costs a row per
 * hit and a range scan to answer instead of one upsert.
 *
 * COUNTS THE REFUSED ATTEMPTS TOO, which is what stops a caller sitting on the
 * boundary forever: every call inside the window pushes the count up, so a
 * script hammering the endpoint stays refused rather than being let through one
 * in every N.
 */
export async function consume(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();

  try {
    const existing = await db.rateLimit.findUnique({
      where: { bucket },
      select: { hits: true, windowEndsAt: true },
    });

    // No row, or the window has passed: this attempt starts a fresh one.
    if (!existing || existing.windowEndsAt.getTime() <= now.getTime()) {
      const windowEndsAt = new Date(now.getTime() + windowMs);
      await db.rateLimit.upsert({
        where: { bucket },
        create: { bucket, hits: 1, windowEndsAt },
        update: { hits: 1, windowEndsAt },
      });
      return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0 };
    }

    const hits = existing.hits + 1;
    await db.rateLimit.update({ where: { bucket }, data: { hits } });

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.windowEndsAt.getTime() - now.getTime()) / 1000),
    );

    if (hits > limit) {
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    return { allowed: true, remaining: limit - hits, retryAfterSeconds: 0 };
  } catch (error) {
    // See the note above: a limiter outage must not be an authentication
    // outage. Logged rather than swallowed, so it is visible in the one place
    // somebody would look.
    console.error("[rate-limit] failing open:", error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * How long to say. "Try again in about 5 minutes" beats "in 287 seconds".
 *
 * ROUNDED UP, always: telling somebody to come back in 4 minutes when it is
 * really 4 minutes 50 earns a second refusal and a worse mood.
 */
export function retryHint(seconds: number): string {
  if (seconds <= 60) return "in a minute";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `in about ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `in about ${hours} hour${hours === 1 ? "" : "s"}`;
}

/* -------------------------------------------------------------------------- */
/* The limits themselves, in one place so they can be read together            */
/* -------------------------------------------------------------------------- */

/**
 * Sending a code to a phone or an address.
 *
 * THREE IN FIFTEEN MINUTES, keyed on what the caller TYPED rather than on the
 * account it resolves to. That is deliberate and it is the whole point: an
 * identifier that matches nobody must be limited exactly like one that does, or
 * the limiter becomes the enumeration oracle the reset flow spent its effort
 * avoiding — "this one refused me quickly, so it must be real".
 *
 * Three is enough for a person whose first text did not arrive and who tried
 * again, and few enough that a stranger's phone is not a nuisance.
 */
export const RESET_REQUESTS = { limit: 3, windowMs: 15 * 60_000 };

/**
 * Guessing a password.
 *
 * TEN IN FIFTEEN MINUTES. Generous on purpose: this can be used to lock a
 * legitimate person out of their own account by burning their allowance, so the
 * number has to be well above what a real person mistyping their password does,
 * and the window short enough that being caught by it is an inconvenience
 * rather than a lockout.
 *
 * The message SAYS SO, which does not leak anything as long as the limit
 * applies to identifiers that exist and identifiers that do not, identically.
 * It does.
 */
export const LOGIN_ATTEMPTS = { limit: 10, windowMs: 15 * 60_000 };

/**
 * Confirming a mobile number you just typed.
 *
 * Same shape as the reset limit and for the same reason — this also sends a
 * text — but keyed on the signed-in USER rather than on the number, because
 * that is the thing that cannot be swapped to get a fresh allowance.
 */
export const PHONE_VERIFY_REQUESTS = { limit: 3, windowMs: 15 * 60_000 };

/**
 * ⚠ CLAIMING A CHILD, and this is the most serious limit in this file.
 *
 * `claimChild` takes a student code and the child's date of birth, and its own
 * comment said it "cannot be used to brute-force a birthdate against a
 * known-good code". That was true of DISTINGUISHABILITY — every failure returns
 * the same message and does the same work — and false of RATE. A schoolchild's
 * date of birth has a few thousand plausible values; unlimited attempts grind
 * through them in minutes, and succeeding makes somebody the GUARDIAN of
 * another family's child, with their attendance, marks, messages and record.
 *
 * TWO BUCKETS, because they stop different attacks and one alone stops neither:
 *
 *   PER CALLER, tightly. Every attempt costs a signed-in account, so this is
 *   the one that makes grinding expensive.
 *
 *   PER STUDENT CODE, loosely. Otherwise many accounts grind one child. Loose
 *   ON PURPOSE: an attacker who could exhaust a code's allowance cheaply would
 *   be able to stop a real parent claiming their own child, so the number sits
 *   well above a family's fumbling and far below a birthday search.
 */
export const CLAIM_ATTEMPTS = { limit: 10, windowMs: 15 * 60_000 };
export const CLAIM_PER_CODE = { limit: 20, windowMs: 60 * 60_000 };

/**
 * Typing a join code into the front door, signed out.
 *
 * ⚠ THE FIRST VERSION OF THIS WAS 20 PER 15 MINUTES AND WOULD HAVE BROKEN THE
 * FLAGSHIP FLOW ON DAY ONE. A teacher writes a class code on the board and
 * thirty children type it — from one school's wifi, behind one public address,
 * which is the only thing there is to key on when nobody is signed in. Thirty
 * children plus retypes is comfortably past twenty, so the limit would have
 * refused a classroom while an attacker went unbothered. A test that legitimately
 * called `lookupCode` two dozen times is what surfaced it.
 *
 * WHAT ACTUALLY DEFEATS ENUMERATION IS THE CODE SPACE, not this. A class code is
 * seven characters from a 21-character alphabet — about 1.8 billion, ~31 bits.
 * At a thousand guesses a second that is weeks per code found, and a found code
 * grants a PENDING membership and sight of nothing. So the job of this limit is
 * to stop a naive script and bound the cost of one, not to be the wall.
 *
 * Set high enough for a class, low enough that a loop is not free. A whole
 * school onboarding in one sitting from one address may still meet it — and
 * will meet it as a clear message rather than a silent failure.
 *
 * THE HONEST CAVEAT: `x-forwarded-for` is trustworthy behind a proxy that sets
 * it and forgeable in front of one.
 */
export const CODE_LOOKUPS = { limit: 120, windowMs: 15 * 60_000 };

/**
 * Creating a PARENT account from the front door.
 *
 * Student signup is deliberately NOT limited here, and that is worth stating:
 * `joinAsStudent` cannot proceed without a valid class code, so the code
 * requirement is already the gate and `CODE_LOOKUPS` already bounds the rate.
 * Adding a second limit keyed on the same address would only make a class of
 * thirty children joining together fail for a second reason.
 *
 * A parent signup carries no code at all, which is why it gets one.
 */
export const SIGNUPS = { limit: 20, windowMs: 60 * 60_000 };

/**
 * Redeeming an invitation link.
 *
 * The token is 32 random bytes, so this is NOT about guessing it — that is
 * infeasible and the limit would not be what stopped it. It is about the same
 * thing `SIGNUPS` is: the endpoint creates accounts, and an endpoint that
 * creates accounts should not be free to call in a loop.
 */
export const INVITE_ACCEPTS = { limit: 10, windowMs: 60 * 60_000 };

/* -------------------------------------------------------------------------- */
/* Who is asking, when nobody is signed in                                     */
/* -------------------------------------------------------------------------- */

/**
 * A key for an anonymous caller, or NULL when there is no caller to speak of.
 *
 * TWO DIFFERENT ABSENCES, and collapsing them was a bug. Both used to return
 * the string `unknown`:
 *
 *   A REQUEST WITH NO ADDRESS ON IT — a deployment with nothing in front of the
 *   app setting `x-forwarded-for`. There IS a caller; we just cannot tell them
 *   apart. Everybody shares one bucket, which is the strict direction and the
 *   right one: too tight is visible, does-nothing is not.
 *
 *   NO REQUEST AT ALL — a script, a seed, a test. `headers()` throws. There is
 *   no caller, nothing to protect anybody from, and the code is already running
 *   server-side with a database handle. Limiting it protects nothing and does
 *   real harm: every suite in the repo shared one `unknown` bucket, so two
 *   parallel test files hammering the same endpoint failed each other — in
 *   files nobody had edited. That is the collision this split removes.
 *
 * Callers skip the limit entirely on null. See the use sites.
 *
 * THE HONEST CAVEAT on the first case: `x-forwarded-for` is trustworthy behind
 * a proxy that sets it and forgeable in front of one.
 */
export async function callerKey(): Promise<string | null> {
  let hdrs: Headers;
  try {
    const { headers } = await import("next/headers");
    hdrs = await headers();
  } catch {
    // No request scope. Not a caller — see above.
    return null;
  }
  const forwarded = hdrs.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || hdrs.get("x-real-ip");
  return ip && ip.length > 0 ? ip : "unknown";
}

/**
 * `consume`, but only when there is a caller to attribute it to.
 *
 * Exists so the three anonymous limits do not each have to repeat the null
 * check and, more importantly, cannot each get it slightly differently.
 */
export async function consumeByCaller(
  prefix: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const key = await callerKey();
  if (key === null) return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  return consume(`${prefix}:${key}`, limit, windowMs);
}
