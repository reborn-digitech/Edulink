import "server-only";
import { db } from "./db";
import { closedOutsideAccount } from "./resolve-context";
import { revokeAllAccess } from "./session";

/**
 * Who a spent sign-in link lets in, for the web's /magic and the phone's
 * POST /api/v1/auth/magic-link/consume alike (TA-040): the phone's door read
 * only `disabledAt`, so a link mailed to an address the account has since
 * left still answered a bearer session there while /magic refused it, and an
 * outside account the operator closed was given a session the web refuses.
 * The three checks live here once, and both doors ask them.
 *
 * AND THE LINK TAKES A NEVER-VERIFIED ACCOUNT BACK (TA-035), as SSO and an
 * invitation do (assessment 2026-09-24, item 3): an account made under an
 * address nobody proved, whose password and sessions belong to whoever typed
 * it, is the address's owner's the moment they open a link mailed there. The
 * earlier password, second step, sessions, tokens and push registrations go,
 * and the address is marked verified.
 */
export const CLEAR_SECOND_STEP = { totpSecretEnc: null, totpPendingEnc: null, totpEnabledAt: null, totpRecoveryHashes: [], totpLastStep: null };

export type MagicLinkHolder =
  | { ok: true; user: { id: string; lastRole: string | null; lastSchoolId: string | null }; reclaimed: boolean }
  | { ok: false; reason: "bad" | "closedRecruiter" | "closedExpert" };

/**
 * Takes a never-verified account back for the person who has just proved the
 * mailbox (a sign-in link, an SSO identity with a verified address). Shared by
 * the link and by SSO (TA-036), so neither leaves the earlier holder's second
 * step standing between the address's owner and the account.
 */
export async function reclaimUnverifiedAccount(userId: string): Promise<void> {
  await db.user.update({ where: { id: userId }, data: { passwordHash: null, emailVerifiedAt: new Date(), ...CLEAR_SECOND_STEP } });
  await revokeAllAccess(userId, { tokens: true });
  // A code page opened by the earlier holder is no way back in either.
  await db.twoFactorChallenge.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
}

export async function magicLinkHolder(claim: { userId: string; email: string | null }): Promise<MagicLinkHolder> {
  const user = await db.user.findUnique({
    where: { id: claim.userId },
    select: { id: true, email: true, emailVerifiedAt: true, disabledAt: true, lastRole: true, lastSchoolId: true },
  });
  if (!user || user.disabledAt) return { ok: false, reason: "bad" };
  // The link was sent to one address; the account must still be at it.
  if (claim.email && claim.email.toLowerCase() !== (user.email ?? "").toLowerCase()) return { ok: false, reason: "bad" };

  // An outside account the operator closed, the person's only way in (G4-28, risks batch 5 Oct 2026): told, not let in.
  const closed = await closedOutsideAccount(user.id);
  if (closed) return { ok: false, reason: closed === "RECRUITER" ? "closedRecruiter" : "closedExpert" };

  const reclaimed = user.emailVerifiedAt === null;
  // Both doors' auth.login rows say so (meta.reclaimed), as auth.ssoLink does for SSO.
  if (reclaimed) await reclaimUnverifiedAccount(user.id);
  return { ok: true, user: { id: user.id, lastRole: user.lastRole, lastSchoolId: user.lastSchoolId }, reclaimed };
}
