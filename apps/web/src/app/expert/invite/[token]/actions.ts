"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AccessError } from "@/lib/tenancy";
import { hashPassword, passwordProblems } from "@/lib/crypto";
import { createSession, getSession, revokeAllAccess } from "@/lib/session";
import { acceptExpertInvite, readExpertInvite } from "@/lib/experts";
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
     * themselves: "log in first, then open this link" used to be a promise
     * with no path behind it. And an account under the invited address that
     * NEVER PROVED IT — a sign-up waiting on a verification mail nobody
     * opened — is reclaimed by the person who can open this one: the old
     * password goes with every session and token, the typed one is set, and
     * the address is marked verified. See the school invitation's note.
     */
    const taken = await db.user.findUnique({ where: { email }, select: { id: true, emailVerifiedAt: true, disabledAt: true } });
    const session = await getSession();
    const reclaims = taken !== null && taken.emailVerifiedAt === null && addressed === email && !taken.disabledAt;
    if (taken && session?.user.id !== taken.id && !reclaims) {
      return { ok: false, errorKey: "expert.emailTaken" };
    }

    if (taken && reclaims) {
      await db.user.update({
        where: { id: taken.id },
        data: { passwordHash: await hashPassword(input.password), emailVerifiedAt: new Date() },
      });
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
