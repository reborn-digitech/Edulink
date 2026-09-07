import "server-only";
import { db } from "./db";
import { hashToken } from "./crypto";

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
