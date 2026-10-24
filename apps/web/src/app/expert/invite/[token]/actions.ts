"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AccessError } from "@/lib/tenancy";
import { hashPassword, passwordProblems } from "@/lib/crypto";
import { createSession, getSession, revokeAllAccess } from "@/lib/session";
import { acceptExpertInvite, inviteMadeAccount, readExpertInvite } from "@/lib/experts";
import { audit } from "@/lib/audit";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { getLocale, getT } from "@/lib/i18n/server";
import { writeJson } from "@/lib/json";

/**
 * ⚠ `errorKey` AND `error`, same split as the other expert actions.
 *
 * Everything this file decides itself travels as a key. Two things do not and
 * cannot yet: an `AccessError`, whose message is minted app-wide, and the first
 * line out of `passwordProblems`, which is shared with login, register, reset
 * and the school invitation. Both are still English and both are named here so
 * the gap is a stated one rather than a surprise on a Marathi form.
 */
export type AcceptState = { ok: boolean; errorKey?: TranslationKey; error?: string };

/**
 * Creates an expert account from an invitation link and signs them in.
 *
 * ACCOUNT FIRST, PROFILE SECOND, AND THE INVITE CONSUMED WITH THE PROFILE.
 * `acceptExpertInvite` marks the invitation used in the SAME transaction that
 * writes the profile, so a link clicked twice in quick succession produces one
 * expert and not two.
 *
 * The profile is created UNPUBLISHED, so this route cannot put a stranger in
 * front of schools — it creates an account that lands on the holding page until
 * a person curates it.
 */
export async function acceptInvite(
  token: string,
  input: { name: string; email: string; password: string; headline: string },
): Promise<AcceptState> {
  try {
    const state = await readExpertInvite(token);
    if (!state.ok) return { ok: false, errorKey: "expert.inviteCannotBeUsed" };

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const headline = input.headline.trim();
    if (name.length < 2) return { ok: false, errorKey: "expert.giveYourName" };
    if (!email.includes("@")) return { ok: false, errorKey: "expert.emailLooksWrong" };
    if (headline.length < 3) return { ok: false, errorKey: "expert.sayWhatYouDo" };

    const problems = passwordProblems(input.password, [name, email]);
    if (problems.length > 0) return { ok: false, error: (await getT())(problems[0]!) };

    /**
     * BOUND TO THE ADDRESS IT WAS SENT TO. An invitation addressed to
     * somebody used to accept any email typed into the form, so the account
     * it created carried whatever address the holder of the link chose —
     * unverified, and free to be a head teacher's. The link was emailed to
     * one address; that is the only address it may create or attach to.
     */
    const addressed = state.email?.trim().toLowerCase() ?? null;
    if (addressed && addressed !== email) {
      return { ok: false, errorKey: "expert.inviteForAnotherAddress" };
    }

    /**
     * An email already in use is refused rather than merged — silently
     * attaching an expert profile to somebody else's account would be an
     * account takeover by whoever holds the link — with TWO exceptions. The
     * SIGNED-IN owner of that very account may attach the profile to
     * themselves, and nothing about the account changes. And the account the
     * operator's approval of an application made FOR THIS INVITATION (no
     * password, the address unproved, created in the same transaction as the
     * invitation whose mail this link came in) is finished here: the typed
     * password is set and the address marked proved.
     *
     * ⚠ NO OTHER RECLAIM (QA-01, 24 Oct 2026). This used to reclaim ANY
     * account under the invited address that had never proved it — the old
     * password gone with every session and token, the typed one set — on the
     * argument that "opening a link we emailed to this address proves it".
     * The staff door broke the argument by answering the link to its caller,
     * so a teacher anywhere could take over any unproved parent, pupil or
     * admin. The door no longer answers the link, and this no longer trusts
     * that it never will: an unproved holder who cannot sign in resets the
     * password from the login page (the reset mail proves the mailbox), signs
     * in, and opens this link again.
     */
    const taken = await db.user.findUnique({ where: { email }, select: { id: true, emailVerifiedAt: true, disabledAt: true, passwordHash: true } });
    const session = await getSession();
    const owner = taken !== null && session?.user.id === taken.id;
    const reclaims =
      taken !== null &&
      !owner &&
      addressed === email &&
      taken.emailVerifiedAt === null &&
      taken.passwordHash === null &&
      !taken.disabledAt &&
      (await inviteMadeAccount(state.inviteId, taken.id));
    if (taken && !owner && !reclaims) {
      return { ok: false, errorKey: "expertInviteClaim.accountExists" };
    }

    if (taken && reclaims) {
      // Conditional, so the first password set is the only one: a second submit of the form finds it set and is refused.
      const finished = await db.user.updateMany({
        where: { id: taken.id, passwordHash: null, emailVerifiedAt: null },
        data: { passwordHash: await hashPassword(input.password), emailVerifiedAt: new Date() },
      });
      if (finished.count === 0) return { ok: false, errorKey: "expertInviteClaim.accountExists" };
      await revokeAllAccess(taken.id, { tokens: true });
    }

    // Created INSIDE the acceptance transaction, so a refused invite strands
    // nothing — see acceptExpertInvite.
    const person = taken
      ? { userId: taken.id }
      : {
          create: {
            email,
            name,
            passwordHash: await hashPassword(input.password),
            // Opening a link we emailed to this address proves it.
            ...(addressed ? { emailVerifiedAt: new Date() } : {}),
            // The language they accepted in. `"{}"` here meant every expert
            // account came out English whatever page they had just read.
            prefs: writeJson({ locale: await getLocale() }),
          },
        };

    const accepted = await acceptExpertInvite(token, person, { headline });

    await audit({
      schoolId: null,
      actorUserId: accepted.userId,
      action: "expert.acceptInvite",
      targetType: "User",
      targetId: accepted.userId,
      meta: { email, reclaimed: reclaims },
    });

    await createSession(accepted.userId, { schoolId: null, role: "EXPERT" });
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[expert-accept]", error);
    return { ok: false, errorKey: "expert.tryLinkAgain" };
  }

  // Outside the try: redirect() throws by design, and catching it here would
  // turn a successful signup into "Something went wrong".
  redirect("/expert/pending");
}
