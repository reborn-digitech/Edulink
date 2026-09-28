import "server-only";
import { db } from "./db";
import { createHash, timingSafeEqual } from "node:crypto";
import { hashToken } from "./crypto";
import { readJson } from "./json";

/**
 * Redeeming a link that arrived by email.
 *
 * ⚠ TWO OF THESE LINKS HAD NO ROUTE TO LAND ON. Registration minted an
 * `EMAIL_VERIFY` token and emailed `${APP_URL}/verify?token=…`; the login page's
 * "email me a link instead" minted a `MAGIC_LINK` token and emailed
 * `${APP_URL}/magic?token=…`. Neither path existed. Every school admin who ever
 * registered got a button leading to a 404, and the magic-link login — offered
 * in three clicks from the front door, and listed in this repo's README as
 * verified working — could not sign anybody in at all.
 *
 * SO THE CONSUMING HALF LIVES HERE, ONCE. Both routes need the same five
 * refusals in the same order, and the bug above is what a rule written down in
 * no shared place looks like at the end.
 *
 * THE TOKEN IS THE PROOF, AND NO SESSION IS REQUIRED. It is 32 random bytes sent
 * to one address; holding it is evidence of reading that inbox, which is the
 * whole claim being tested. Demanding a session as well would break the ordinary
 * case — mail opened on a phone, in an app that launches its own browser, signed
 * in to nothing.
 */

export type TokenClaim =
  | { ok: true; userId: string; email: string | null }
  /** No token in the URL at all, or one that matches no row. */
  | { ok: false; reason: "UNKNOWN" }
  /** Real, but the window has passed. Offer a fresh one. */
  | { ok: false; reason: "EXPIRED"; userId: string; email: string | null }
  /** Real, and already redeemed. Usually the person pressing back. */
  | { ok: false; reason: "USED"; userId: string; email: string | null };

/**
 * Spends a token, or says why it cannot.
 *
 * ⚠ CONSUMED BY A CONDITIONAL UPDATE, not by read-then-write. `updateMany` with
 * the freshness conditions in its own WHERE is a single statement, so two
 * requests racing on the same link — a mail client prefetching it and the person
 * then clicking it, which is the ordinary case rather than an attack — see
 * exactly one success between them. Reading first and writing second has a
 * window where both reads say "live", and for `MAGIC_LINK` that window mints two
 * sessions from one link.
 *
 * The distinct reasons are deliberate, and safe: somebody holding an expired
 * token already had it emailed to them, so telling them it expired discloses
 * nothing they did not know and is the only message they can act on. An unknown
 * token gets no detail — that one might be a guess.
 */
/** RFC 7636, S256: the challenge a verifier answers to. */
export function pkceChallengeOf(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Spends the phone's one-time hand-off code, and only for the app that began
 * the sign-in: the code was minted against a challenge, and the caller must
 * hold the verifier that hashes to it.
 *
 * THE CODE IS SPENT FIRST, RIGHT OR WRONG. A caller with the code and the
 * wrong verifier has the code from somewhere it should not have been, and a
 * code that survived a wrong answer could be tried against until right — not
 * that a 256-bit verifier can be guessed, but a burnt code asks nobody to
 * reason about it. The real app then finds its code used and signs in again.
 *
 * A code minted with no challenge is refused: none is minted that way now,
 * and one from before this rule has two minutes to live.
 */
export async function claimAppExchange(rawCode: string | undefined | null, verifier: string): Promise<TokenClaim> {
  const code = rawCode?.trim();
  if (!code) return { ok: false, reason: "UNKNOWN" };
  const claim = await claimToken(code, "APP_EXCHANGE");
  if (!claim.ok) return claim;
  const row = await db.authToken.findUnique({ where: { tokenHash: hashToken(code) }, select: { meta: true } });
  const challenge = readJson<{ challenge?: unknown }>(row?.meta, {}).challenge;
  if (typeof challenge !== "string") return { ok: false, reason: "UNKNOWN" };
  const expected = Buffer.from(challenge);
  const given = Buffer.from(pkceChallengeOf(verifier));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "UNKNOWN" };
  return claim;
}

export async function claimToken(
  rawToken: string | undefined | null,
  purpose: "EMAIL_VERIFY" | "MAGIC_LINK" | "APP_EXCHANGE",
): Promise<TokenClaim> {
  const token = rawToken?.trim();
  if (!token) return { ok: false, reason: "UNKNOWN" };

  const tokenHash = hashToken(token);
  const now = new Date();

  const spent = await db.authToken.updateMany({
    where: { tokenHash, purpose, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now },
  });

  /**
   * Read AFTER the update, and only to find out which of the three it was.
   * Nothing here decides whether the claim succeeded — `spent.count` already
   * did, atomically.
   */
  const row = await db.authToken.findUnique({
    where: { tokenHash },
    select: { userId: true, email: true, purpose: true, expiresAt: true },
  });

  // A token minted for a different job is not this route's business, and is
  // reported as unknown rather than as expired — saying "that link is for
  // something else" tells a guesser which purposes exist.
  if (!row || row.purpose !== purpose || !row.userId) {
    return { ok: false, reason: "UNKNOWN" };
  }

  if (spent.count === 1) {
    return { ok: true, userId: row.userId, email: row.email };
  }

  return row.expiresAt.getTime() <= now.getTime()
    ? { ok: false, reason: "EXPIRED", userId: row.userId, email: row.email }
    : { ok: false, reason: "USED", userId: row.userId, email: row.email };
}
