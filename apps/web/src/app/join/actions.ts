"use server";

import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { generateToken, hashPassword, hashToken, passwordProblems } from "@/lib/crypto";
import { createSession, getSession } from "@/lib/session";
import { studentCode } from "@/lib/codes";
import { ageInYears, parseDateOnly } from "@/lib/dates";
import { audit } from "@/lib/audit";
import { forSchool, forUser } from "@/lib/tenant-context";
import { requestToJoin } from "@/lib/join-requests";
import { writeJson } from "@/lib/json";
import { HANDLE_DOMAIN } from "@/lib/login-name";
import {
  consumeByCaller,
  retryHintKey,
  SIGNUPS,
} from "@/lib/rate-limit";
import { joinWithAccount, lookupJoinCode, type CodeLookup } from "@/lib/join";
import {
  fieldErrors,
  parentSignupSchema,
  studentJoinSchema,
  type FieldErrors,
} from "@/lib/validation";
import { CONSENT_AGE } from "@/lib/constants";
import { getT, getLocale } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { claimChildFor, type ClaimState } from "@/lib/claim-child";

/**
 * Opens an invitation ADDRESSED TO the signed-in person, from /join.
 *
 * The emailed link carries the only copy of the token; the database holds a
 * hash. So "offer the invitation right there" cannot rebuild the URL — it
 * mints a fresh token instead, exactly as Resend does, and sends the person
 * to the same /invite/<token> page every other acceptance goes through,
 * with all its branches intact. The old emailed link stops working, which
 * is fine: the person it was addressed to is the one who pressed this.
 *
 * PROOF OF ADDRESS: the session's own email, VERIFIED, equal to the
 * invitation's — the same standard the row policy applies, checked again
 * here because a policy is a fence, not an argument.
 */
export async function openMyInvite(inviteId: string): Promise<{ ok: false; errorKey: "invite.noLongerValid" } | never> {
  const session = await getSession();
  if (!session) redirect("/login");

  const me = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true, emailVerifiedAt: true } });
  const invite = me?.email && me.emailVerifiedAt
    ? await forUser(session.user.id, () =>
        db.invite.findFirst({
          where: { id: inviteId, email: me.email!.toLowerCase(), status: "PENDING", expiresAt: { gt: new Date() } },
          select: { id: true, schoolId: true },
        }),
      )
    : null;
  if (!invite) return { ok: false, errorKey: "invite.noLongerValid" };

  const token = generateToken();
  await forSchool(invite.schoolId, () =>
    db.invite.update({ where: { id: invite.id }, data: { tokenHash: hashToken(token) } }),
  );
  await audit({
    schoolId: invite.schoolId,
    actorUserId: session.user.id,
    action: "invite.open.self",
    targetType: "Invite",
    targetId: invite.id,
  });
  redirect(`/invite/${token}`);
}

/**
 * "in about 5 minutes", in the reader's language.
 *
 * A one-line wrapper so the four rate-limit refusals below read as sentences
 * rather than as two nested `t(…)` calls each. See `retryHintKey`.
 */
function hint(t: Translate, seconds: number): string {
  const h = retryHintKey(seconds);
  return t(h.key, h.vars);
}

/* -------------------------------------------------------------------------- */
/* Code lookup                                                                 */
/* -------------------------------------------------------------------------- */


/**
 * Resolves a school code OR a class code from the same box — the rules, and
 * the limit on grinding through codes, are `lookupJoinCode` in lib/join.ts,
 * which the phone's POST /api/v1/join/lookup calls too.
 */
export async function lookupCode(raw: string): Promise<CodeLookup> {
  const t = await getT();
  const result = await lookupJoinCode(raw, t);
  // The web's shape exactly: the limit's wait is already in the sentence.
  if (!result.ok) return { ok: false, error: result.error };
  return result;
}

/* -------------------------------------------------------------------------- */
/* Student join                                                                */
/* -------------------------------------------------------------------------- */

export type JoinState = { ok: boolean; errors: FieldErrors; redirectTo?: string };

/**
 * Creates a student account from a class or school code.
 *
 * Deliberately does NOT require an email address. A nine-year-old often has no
 * school email and no personal one, and demanding it either blocks them or
 * teaches them to invent one. The account is identified by a generated login
 * handle instead; a parent or teacher can attach an email later.
 */
export async function joinAsStudent(input: unknown): Promise<JoinState> {
  const t = await getT();
  // The language they filled the form in. See the note in register/actions.ts.
  const locale = await getLocale();
  const parsed = studentJoinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  const { schoolCode: rawCode, name, preferredName, avatarKey, birthdate, password } = parsed.data;

  /**
   * DELIBERATELY NO SEPARATE SIGNUP LIMIT HERE. `lookupCode` below refuses
   * without a valid class code and carries its own limit, so the rate is
   * already bounded and the code requirement is already the gate. A second
   * limit on the same address would only give a class of thirty children
   * joining together a second way to fail. See SIGNUPS.
   */
  const lookup = await lookupCode(rawCode);
  if (!lookup.ok) return { ok: false, errors: { schoolCode: lookup.error } };

  const problems = passwordProblems(password, [name, preferredName ?? ""]);
  if (problems.length > 0) return { ok: false, errors: { password: (await getT())(problems[0]!) } };

  const birthDate = birthdate ? parseDateOnly(birthdate) : null;
  if (birthdate && !birthDate) {
    return { ok: false, errors: { birthdate: t("join.useRealDate") } };
  }
  if (birthDate && birthDate.getTime() > Date.now()) {
    return { ok: false, errors: { birthdate: t("join.dateInFuture") } };
  }

  // Under the consent age gets the stricter defaults: no global-feed posting
  // without approval, parent consent gates on competitions. (§6 COPPA/GDPR-K)
  const age = birthDate ? ageInYears(birthDate) : null;
  const isMinor = age === null ? true : age < 18;
  const needsConsent = age !== null && age < CONSENT_AGE;

  const passwordHash = await hashPassword(password);

  /**
   * ⚠ AN ACCOUNT AND A REQUEST, AND NOTHING OF THE SCHOOL. This used to make
   * the membership and the enrolment here and sign the child in as a pupil.
   * The code is on a poster; it now earns a place in a queue
   * (lib/join-requests.ts), and the membership is made when the class's
   * teacher or the office lets them in. The session below has no school and
   * no role, so every page of the school is closed to it until then.
   */
  let userId: string;
  let handle: string;

  try {
    // Login handle: first name + 4 characters nobody else has. Readable
    // enough for a child to type, unique enough to not collide.
    const base = (preferredName || name).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "student";
    handle = `${base}.${studentCode().slice(-4).toLowerCase()}`;

    const user = await db.user.create({
      data: {
        name,
        preferredName: preferredName || name.split(" ")[0] || name,
        // Stored in the email column so the single unique login lookup keeps
        // working; the handle domain is never routable. See login-name.ts.
        email: `${handle}@${HANDLE_DOMAIN}`,
        passwordHash,
        avatarKey,
        birthdate: birthDate,
        isMinor,
        prefs: writeJson({ theme: "system", locale }),
      },
      select: { id: true },
    });
    userId = user.id;

    await requestToJoin(
      userId,
      lookup.kind === "class"
        ? { kind: "class", schoolId: lookup.schoolId, classId: lookup.classId }
        : { kind: "school", schoolId: lookup.schoolId },
    );
  } catch (error) {
    console.error("[joinAsStudent]", error);
    return {
      ok: false,
      errors: { _form: t("join.couldNotSetUp") },
    };
  }

  await audit({
    schoolId: lookup.schoolId,
    actorUserId: userId,
    action: "student.signup",
    meta: { via: lookup.kind, needsConsent },
  });

  await createSession(userId, { schoolId: null, role: null });

  return { ok: true, errors: {}, redirectTo: `/join/waiting?handle=${encodeURIComponent(handle)}` };
}

/* -------------------------------------------------------------------------- */
/* Parent signup + child claim                                                 */
/* -------------------------------------------------------------------------- */

export async function signUpParent(input: unknown): Promise<JoinState> {
  const t = await getT();
  const locale = await getLocale();
  const parsed = parentSignupSchema.safeParse(input);
  if (!parsed.success) {
    // Custom messages on the shared schemas are KEYS; `fieldErrors` turns
    // them into this reader's words when handed `t`.
    return { ok: false, errors: fieldErrors(parsed.error, t) };
  }

  const { name, email, password, consentNotifications } = parsed.data;

  const gate = await consumeByCaller("signup", SIGNUPS);
  if (!gate.allowed) {
    return {
      ok: false,
      errors: { _form: t("join.tooManyAccounts", { when: hint(t, gate.retryAfterSeconds) }) },
    };
  }

  const problems = passwordProblems(password, [name, email]);
  if (problems.length > 0) return { ok: false, errors: { password: (await getT())(problems[0]!) } };

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      ok: false,
      errors: { email: t("join.emailInUseParent") },
    };
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: {
      email,
      name,
      passwordHash,
      prefs: writeJson({
        theme: "system",
        locale,
        channels: { push: consentNotifications, email: consentNotifications },
      }),
    },
  });

  await audit({ actorUserId: user.id, action: "parent.signup" });
  await createSession(user.id, { schoolId: null, role: null });

  return { ok: true, errors: {}, redirectTo: "/parent/link" };
}


/**
 * Links a signed-in parent to a child: the web's /parent/link form. The rules
 * — both factors, both rate limits, indistinguishable failures — live in
 * `claimChildFor` (lib/claim-child.ts), which the phone's endpoint calls too.
 */
export async function claimChild(input: unknown): Promise<ClaimState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: t("common.logInAgain") } };
  return claimChildFor(session, input, t);
}

/* -------------------------------------------------------------------------- */
/* Join with a code ON THE ACCOUNT YOU ALREADY HAVE                            */
/* -------------------------------------------------------------------------- */

/**
 * A signed-in person ASKS to join a school or a class as a pupil with their
 * own account — no new user, no password, no second identity. The rules (a
 * parent's account and a staff post here are refused; asking twice is asking
 * once) are `joinWithAccount` in lib/join.ts, which the phone's POST
 * /api/v1/join calls too. The session is left as it was: there is nothing to
 * switch to until somebody has said yes.
 */
export async function joinWithMyAccount(rawCode: string): Promise<JoinState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: t("common.logInAgain") } };

  const joined = await joinWithAccount(session, rawCode, t);
  if (!joined.ok) return { ok: false, errors: joined.errors };

  return { ok: true, errors: {}, redirectTo: "/join/waiting" };
}
