"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AccessError } from "@/lib/tenancy";
import { hashPassword, passwordProblems } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import { acceptExpertInvite, readExpertInvite } from "@/lib/experts";
import { audit } from "@/lib/audit";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
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
    if (problems.length > 0) return { ok: false, error: problems[0]! };

    // An email already in use is refused rather than merged: silently attaching
    // an expert profile to somebody else's account would be an account takeover
    // by whoever holds the invite link.
    const taken = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) return { ok: false, errorKey: "expert.emailTaken" };

    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(input.password),
        // The language they accepted in. `"{}"` here meant every expert account
        // came out English whatever page they had just read.
        prefs: writeJson({ locale: await getLocale() }),
      },
      select: { id: true },
    });

    await acceptExpertInvite(token, user.id, { headline });

    await audit({
      schoolId: null,
      actorUserId: user.id,
      action: "expert.acceptInvite",
      targetType: "User",
      targetId: user.id,
      meta: { email },
    });

    await createSession(user.id, { schoolId: null, role: "EXPERT" });
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[expert-accept]", error);
    return { ok: false, errorKey: "expert.tryLinkAgain" };
  }

  // Outside the try: redirect() throws by design, and catching it here would
  // turn a successful signup into "Something went wrong".
  redirect("/expert/pending");
}
