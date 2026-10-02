import "server-only";
import { randomUUID } from "node:crypto";
import { isCloudflareAddress } from "./cloudflare";
import { db } from "./db";
import type { TranslationKey } from "./i18n/dictionary";

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
    // One statement, so N requests arriving together see N different counts.
    // A read-then-write here let every request of a burst read the same
    // count and all pass; the insert-or-update returns the count this request
    // made, and the window resets in the same statement when it has passed.
    // The columns are timestamps without a zone, stored as UTC; the values are
    // passed as ISO text and read as UTC explicitly, so a database session in
    // another zone cannot shift the comparison by its offset.
    const windowEndsAt = new Date(now.getTime() + windowMs);
    const nowIso = now.toISOString();
    const endIso = windowEndsAt.toISOString();
    const rows = await db.$queryRaw<{ hits: number; windowEndsAt: Date }[]>`
      INSERT INTO "RateLimit" ("id", "bucket", "hits", "windowEndsAt", "createdAt", "updatedAt")
      VALUES (${randomUUID()}, ${bucket}, 1, (${endIso}::timestamptz AT TIME ZONE 'UTC'), (${nowIso}::timestamptz AT TIME ZONE 'UTC'), (${nowIso}::timestamptz AT TIME ZONE 'UTC'))
      ON CONFLICT ("bucket") DO UPDATE SET
        "hits" = CASE WHEN "RateLimit"."windowEndsAt" <= (${nowIso}::timestamptz AT TIME ZONE 'UTC') THEN 1 ELSE "RateLimit"."hits" + 1 END,
        "windowEndsAt" = CASE WHEN "RateLimit"."windowEndsAt" <= (${nowIso}::timestamptz AT TIME ZONE 'UTC') THEN (${endIso}::timestamptz AT TIME ZONE 'UTC') ELSE "RateLimit"."windowEndsAt" END,
        "updatedAt" = (${nowIso}::timestamptz AT TIME ZONE 'UTC')
      RETURNING "hits", "windowEndsAt"`;
    const row = rows[0];
    if (!row) throw new Error("rate limit row not returned");
    const hits = Number(row.hits);
    const retryAfterSeconds = Math.max(1, Math.ceil((new Date(row.windowEndsAt).getTime() - now.getTime()) / 1000));
    if (hits > limit) {
      return { allowed: false, remaining: 0, retryAfterSeconds };
    }
    return { allowed: true, remaining: Math.max(0, limit - hits), retryAfterSeconds: 0 };
  } catch (error) {
    // See the note above: a limiter outage must not be an authentication
    // outage. Logged rather than swallowed, so it is visible in the one place
    // somebody would look.
    console.error("[rate-limit] failing open:", error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * How long to say, as a KEY the caller resolves with its own `t`.
 *
 * "Try again in about 5 minutes" beats "in 287 seconds" — and ROUNDED UP,
 * always: telling somebody to come back in 4 minutes when it is really
 * 4 minutes 50 earns a second refusal and a worse mood.
 *
 * There used to be an English twin here for `lib/passwords.ts`, kept alive
 * only until those messages were translated. They are, so it is gone — a
 * caller that wants the sentence goes through `refusalText`.
 */
export type RetryHint = { key: TranslationKey; vars?: { count: number } };

export function retryHintKey(seconds: number): RetryHint {
  if (seconds <= 60) return { key: "common.retryInAMinute" };
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return minutes === 1
      ? { key: "common.retryInMinutesOne" }
      : { key: "common.retryInMinutesMany", vars: { count: minutes } };
  }
  const hours = Math.ceil(minutes / 60);
  return hours === 1
    ? { key: "common.retryInHoursOne" }
    : { key: "common.retryInHoursMany", vars: { count: hours } };
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
 * Changing the email address on an account.
 *
 * The same shape and the same reasoning as the two above — it sends a message to
 * an address the caller types — but its OWN BUCKET rather than sharing the phone
 * one. Sharing would mean somebody who had just confirmed a mobile number could
 * not then correct a typo in their email, and a person doing both on the same
 * afternoon is the ordinary case rather than the suspicious one.
 *
 * Keyed on the signed-in user, not on the address, for the reason spelled out on
 * `PHONE_VERIFY_REQUESTS`: a caller who swapped the address each time would
 * otherwise get a fresh allowance per address, which is exactly the loop that
 * turns this into a way to send strangers mail.
 */
export const EMAIL_CHANGE_REQUESTS = { limit: 3, windowMs: 15 * 60_000 };

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

/** Files through POST /api/v1/uploads, per person: up to 100 MB each, so the count is the cap that matters. */
export const UPLOADS = { limit: 60, windowMs: 60 * 60_000 };

/**
 * "Report a problem" and crash reports from the phone, per person.
 *
 * A report is cheap to send and a crash loop sends one per app start, so
 * without this a single broken phone fills a school's audit log by lunchtime.
 * Ten is far more than a person with something to say sends in an hour, and
 * the eleventh is refused with a 429 the app reads rather than a row nobody
 * wanted.
 */
export const APP_REPORTS = { limit: 10, windowMs: 60 * 60_000 };

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
/**
 * The caller's address as the proxy in front of us saw it. Fly puts it in
 * Fly-Client-IP; a generic proxy APPENDS to X-Forwarded-For, so the last
 * entry is the hop it saw and the first is whatever the client chose to
 * send — which was, for a while, the entry every per-address limit keyed on.
 *
 * Behind Cloudflare's proxy that hop is a Cloudflare edge, shared by everyone
 * routed through it. With TRUST_CLOUDFLARE=1, and only when the hop really is
 * inside Cloudflare's published ranges, the caller is CF-Connecting-IP instead
 * (cloudflare.ts) — a request that reaches the origin directly with the header
 * set keys on its own address, as before.
 */
export function clientAddress(hdrs: Headers): string | null {
  const peer = proxyHop(hdrs);
  if (peer && trustCloudflare() && isCloudflareAddress(peer)) {
    const cf = hdrs.get("cf-connecting-ip")?.trim();
    if (cf) return cf;
  }
  return peer;
}

/** The address the proxy in front of the app saw connect to it. */
function proxyHop(hdrs: Headers): string | null {
  // Fly-Client-IP is Fly's word, and only Fly's: anywhere else a client
  // could send the header itself and key every per-address limit on a
  // string of its choosing. Trusted on Fly (FLY_APP_NAME is set by the
  // platform) or where the operator says the proxy sets it.
  const fly = trustFlyHeader() ? hdrs.get("fly-client-ip")?.trim() : undefined;
  if (fly) return fly;
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last;
  }
  const real = hdrs.get("x-real-ip")?.trim();
  return real || null;
}

function trustFlyHeader(): boolean {
  return Boolean(process.env.FLY_APP_NAME) || process.env.TRUST_FLY_CLIENT_IP === "1";
}

function trustCloudflare(): boolean {
  return process.env.TRUST_CLOUDFLARE === "1";
}

export async function callerKey(): Promise<string | null> {
  let hdrs: Headers;
  try {
    const { headers } = await import("next/headers");
    hdrs = await headers();
  } catch {
    // No request scope. Not a caller — see above.
    return null;
  }
  return clientAddress(hdrs) ?? "unknown";
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

/* -------------------------------------------------------------------------- */
/* Bringing a pupil over, and the front door                                   */
/* -------------------------------------------------------------------------- */

/**
 * Intake lists that carry a student code or a PEN, per SCHOOL.
 *
 * A row with a code or a PEN and a date of birth links an EXISTING account —
 * which is what makes it the one intake row worth guessing at. A list of five
 * hundred rows was five hundred guesses at one child's birthday in a single
 * call, from any school anybody had just registered. Ten such lists an hour
 * is more than an office bringing a cohort over ever sends; a list carrying
 * more than `INTAKE_MAX_LINKS` linking rows is refused outright rather than
 * counted. A list that links nobody — plain new pupils — is bounded by
 * `INTAKE_MAX_ROWS` as before and does not count here.
 */
export const INTAKE_RUNS = { limit: 10, windowMs: 60 * 60_000 };
export const INTAKE_MAX_LINKS = 50;

/**
 * The register wizard's "is this address free?" check, per address. It
 * answers a yes/no about whether an account exists, which is an enumeration
 * oracle when it is unlimited; at the limit it answers "free" — the same
 * shape — and the submit itself still refuses a taken address.
 */
export const EMAIL_CHECKS = { limit: 30, windowMs: 15 * 60_000 };

/* -------------------------------------------------------------------------- */
/* Finishing what a code started, and the two ceilings on guessing passwords   */
/* -------------------------------------------------------------------------- */

/**
 * Completing a reset, or confirming a phone or email code.
 *
 * The token itself dies after five wrong codes, and this is the second wall
 * behind it: ten completions per fifteen minutes per identifier (the normalised
 * login for a reset, the signed-in user for a confirm), so a script cannot ask
 * for a fresh code and burn its five guesses in a loop — thirty guesses an
 * hour, not thirty a second.
 */
export const RESET_COMPLETIONS = { limit: 10, windowMs: 15 * 60_000 };

/**
 * Password failures from one address, whatever the identifier.
 *
 * `LOGIN_ATTEMPTS` is keyed on the login being tried, so spraying one password
 * across a school's worth of logins never touched it. Fifty failures from one
 * address in fifteen minutes is far past a household mistyping, and a school
 * behind one NAT that meets it is met with a clear message rather than a
 * silent one. Failures only: a success costs nothing here.
 */
export const LOGIN_PER_ADDRESS = { limit: 50, windowMs: 15 * 60_000 };

/**
 * Password failures across the whole service.
 *
 * The ceiling on a spray from many addresses: two thousand wrong passwords in
 * fifteen minutes is not a morning of tired parents, and refusing everyone for
 * a few minutes is the cheaper outcome. Failures only, as above.
 */
export const LOGIN_GLOBAL = { limit: 2_000, windowMs: 15 * 60_000 };

/**
 * Says whether `bucket` is already exhausted, WITHOUT counting this call.
 *
 * For the limits that count failures only: the check runs before the password
 * is verified and the charge after it fails, so a person signing in correctly
 * consumes nothing. Fails open exactly as `consume` does, and for the same
 * reason.
 */
export async function peek(bucket: string, limit: number): Promise<RateLimitResult> {
  try {
    const row = await db.rateLimit.findUnique({
      where: { bucket },
      select: { hits: true, windowEndsAt: true },
    });
    const now = Date.now();
    if (!row || row.windowEndsAt.getTime() <= now || row.hits < limit) {
      return { allowed: true, remaining: row ? Math.max(0, limit - row.hits) : limit, retryAfterSeconds: 0 };
    }
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((row.windowEndsAt.getTime() - now) / 1000)),
    };
  } catch (error) {
    console.error("[rate-limit] failing open:", error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/**
 * Joining a school by its code, per ACCOUNT. The lookup's limit above is per
 * address, which one person behind a school's shared connection exhausts for
 * the whole staffroom and one person with a pool of addresses never meets. A
 * school code makes an active pupil on the roll at once, so the account that
 * keeps typing them is counted too — a child joins one school, perhaps two
 * in a year, never five in a day.
 */
export const SCHOOL_CODE_JOINS = { limit: 5, windowMs: 24 * 60 * 60_000 };

/**
 * Invitation emails a school may send in a day, counted from the Invite rows
 * it created in the window (see admin/invites/actions.ts). Three hundred is
 * a whole staff room and a year's intake in one sitting; a thousand a day
 * from one school is a compromised admin account sending mail in our name.
 */
export const INVITE_EMAILS_DAILY = { limit: 300, windowMs: 24 * 60 * 60_000 };

/**
 * Bytes one person may upload in a day, counted from the UploadTicket rows
 * (the stored files' own sizes) in the window. Five hundred megabytes is a
 * sports day of video; the sixty-an-hour ceiling above stops the loop, this
 * stops the disk filling at one file each.
 */
export const UPLOAD_BYTES_DAILY = { limit: 500 * 1024 * 1024, windowMs: 24 * 60 * 60_000 };
