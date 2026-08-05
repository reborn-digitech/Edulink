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
