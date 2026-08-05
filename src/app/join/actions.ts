"use server";

import { db } from "@/lib/db";
import { fakePasswordWork, hashPassword, passwordProblems } from "@/lib/crypto";
import { createSession, getSession, setActiveContext } from "@/lib/session";
import { normalizeCode, studentCode } from "@/lib/codes";
import { ageInYears, parseDateOnly, sameCalendarDay } from "@/lib/dates";
import { audit } from "@/lib/audit";
import { forJoinCode, forSchool } from "@/lib/tenant-context";
import { writeJson } from "@/lib/json";
import { sendParentClaimNotice } from "@/lib/email";
import { HANDLE_DOMAIN } from "@/lib/login-name";
import {
  consume,
  consumeByCaller,
  retryHint,
  CLAIM_ATTEMPTS,
  CLAIM_PER_CODE,
  CODE_LOOKUPS,
  SIGNUPS,
} from "@/lib/rate-limit";
import {
  claimChildSchema,
  fieldErrors,
  parentSignupSchema,
  studentJoinSchema,
  type FieldErrors,
} from "@/lib/validation";
import { CONSENT_AGE } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* -------------------------------------------------------------------------- */
/* Code lookup                                                                 */
/* -------------------------------------------------------------------------- */

export type CodeLookup =
  | { ok: true; kind: "school"; schoolId: string; schoolName: string; logoPath: string | null; brandPrimary: string | null }
  | { ok: true; kind: "class"; schoolId: string; schoolName: string; classId: string; className: string; logoPath: string | null; brandPrimary: string | null }
  | { ok: false; error: string };

/**
 * Resolves a school code OR a class code from the same box.
 *
 * One input rather than two: a child holding a code off the whiteboard does not
 * know, and should not have to know, which kind it is. (§7 no dead ends)
 */
export async function lookupCode(raw: string): Promise<CodeLookup> {
  const code = normalizeCode(raw ?? "");
  if (code.length < 4) return { ok: false, error: "That code looks too short." };
  if (code.length > 32) return { ok: false, error: "That code looks too long." };

  /**
   * ⚠ NOT A SECRET, BUT NOT ENUMERABLE EITHER.
   *
   * A class code is printed on a poster and photographed off a whiteboard, and
   * this function is deliberately readable with no session because working out
   * which school a code belongs to IS the question. What it must not be is a
   * loop: grind the space, find a real class, and `joinAsStudent` turns that
   * into a pupil account inside somebody's school.
   *
   * Keyed on the client address, with the caveat spelled out on CODE_LOOKUPS —
   * behind a proxy that sets `x-forwarded-for` this is the caller; in front of
   * one it is forgeable. It raises the cost of enumeration from nothing to
   * something rather than being a wall, and the reason that is tolerable is
   * that a code grants a PENDING membership and sight of nothing.
   */
  const gate = await consumeByCaller("code-lookup", CODE_LOOKUPS);
  if (!gate.allowed) {
    return { ok: false, error: `Too many tries. Wait ${retryHint(gate.retryAfterSeconds)}.` };
  }

  // BOTH lookups run under the code itself. There is no school to scope them to
  // — working out which school this code belongs to is the entire question — so
  // the policies let exactly the row whose code matches come back, and nothing
  // else. Without this every join code on the installation reads as "we could
  // not find that code", which is what it did.
  //
  // TWO PASSES for the class, and NOT one query with `include: { school }`. The
  // code opens exactly the row it names: a CLASS join code does not match the
  // school's own code, so the joined school came back null and Prisma refused
  // the required relation — a 500 in place of a welcome screen. The class names
  // its school, and having been shown the class is what earns the right to read
  // it, so the second pass is scoped to that school by id.
  const klass = await forJoinCode(code, () =>
    db.class.findUnique({ where: { joinCode: code } }),
  );

  if (klass && !klass.archivedAt) {
    const school = await forSchool(klass.schoolId, () =>
      db.school.findUniqueOrThrow({
        where: { id: klass.schoolId },
        select: { id: true, name: true, logoPath: true, brandPrimary: true },
      }),
    );

    return {
      ok: true,
      kind: "class",
      schoolId: klass.schoolId,
      schoolName: school.name,
      classId: klass.id,
      className: klass.name,
      logoPath: school.logoPath,
      brandPrimary: school.brandPrimary,
    };
  }

  const school = await forJoinCode(code, () =>
    db.school.findUnique({
      where: { code },
      select: { id: true, name: true, logoPath: true, brandPrimary: true },
    }),
  );

  if (school) {
    return {
      ok: true,
      kind: "school",
      schoolId: school.id,
      schoolName: school.name,
      logoPath: school.logoPath,
      brandPrimary: school.brandPrimary,
    };
  }

  return {
    ok: false,
    error: "We could not find that code. Check each letter — it is easy to mix up a 3 and an E.",
  };
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
  const parsed = studentJoinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

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
  if (problems.length > 0) return { ok: false, errors: { password: problems[0]! } };

  const birthDate = birthdate ? parseDateOnly(birthdate) : null;
  if (birthdate && !birthDate) {
    return { ok: false, errors: { birthdate: "Use a real date." } };
  }
  if (birthDate && birthDate.getTime() > Date.now()) {
    return { ok: false, errors: { birthdate: "That date is in the future." } };
  }

  // Under the consent age gets the stricter defaults: no global-feed posting
  // without approval, parent consent gates on competitions. (§6 COPPA/GDPR-K)
  const age = birthDate ? ageInYears(birthDate) : null;
  const isMinor = age === null ? true : age < 18;
  const needsConsent = age !== null && age < CONSENT_AGE;

  const passwordHash = await hashPassword(password);

  let userId: string;
  let handle: string;

  try {
    // `$tenantTransaction`, wrapped in the school the code named — NOT a plain
    // `db.$transaction`. The per-query extension does not reach inside an
    // interactive transaction: the callback gets a raw client, so nothing sets
    // `app.school_ids` and every INSERT below is refused by the policy. There is
    // no session yet either, so the school has to come from the lookup.
    const created = await forSchool(lookup.schoolId, () =>
      db.$tenantTransaction(async (rawTx) => {
        const tx = rawTx as typeof db;
      // Login handle: first name + 4 chars of their student code. Readable
      // enough for a child to type, unique enough to not collide.
      const code = studentCode();
      const base = (preferredName || name).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "student";
      const loginHandle = `${base}.${code.slice(-4).toLowerCase()}`;

      const user = await tx.user.create({
        data: {
          name,
          preferredName: preferredName || name.split(" ")[0] || name,
          // Stored in the email column so the single unique login lookup keeps
          // working; the handle domain is never routable. See login-name.ts.
          email: `${loginHandle}@${HANDLE_DOMAIN}`,
          passwordHash,
          avatarKey,
          birthdate: birthDate,
          isMinor,
          prefs: writeJson({ theme: "system", locale: "en" }),
        },
      });

      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          schoolId: lookup.schoolId,
          role: "STUDENT",
          status: "ACTIVE",
          studentCode: code,
        },
      });

      if (lookup.kind === "class") {
        await tx.enrollment.create({
          data: {
            classId: lookup.classId,
            schoolId: lookup.schoolId,
            studentMembershipId: membership.id,
            status: "ACTIVE",
          },
        });
      }

        return { userId: user.id, handle: loginHandle };
      }),
    );

    userId = created.userId;
    handle = created.handle;
  } catch (error) {
    console.error("[joinAsStudent]", error);
    return {
      ok: false,
      errors: { _form: "We could not set that up just then. Please try again." },
    };
  }

  await audit({
    schoolId: lookup.schoolId,
    actorUserId: userId,
    action: "student.join",
    meta: { via: lookup.kind, needsConsent },
  });

  await createSession(userId, { schoolId: lookup.schoolId, role: "STUDENT" });

  return { ok: true, errors: {}, redirectTo: `/student?welcome=1&handle=${encodeURIComponent(handle)}` };
}

/* -------------------------------------------------------------------------- */
/* Parent signup + child claim                                                 */
/* -------------------------------------------------------------------------- */

export async function signUpParent(input: unknown): Promise<JoinState> {
  const parsed = parentSignupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { name, email, password, consentNotifications } = parsed.data;

  const gate = await consumeByCaller("signup", SIGNUPS);
  if (!gate.allowed) {
    return {
      ok: false,
      errors: { _form: `Too many accounts from here just now. Try again ${retryHint(gate.retryAfterSeconds)}.` },
    };
  }

  const problems = passwordProblems(password, [name, email]);
  if (problems.length > 0) return { ok: false, errors: { password: problems[0]! } };

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      ok: false,
      errors: { email: "An account already uses this email. Log in and add your child from there." },
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
        locale: "en",
        channels: { push: consentNotifications, email: consentNotifications },
      }),
    },
  });

  await audit({ actorUserId: user.id, action: "parent.signup" });
  await createSession(user.id, { schoolId: null, role: null });

  return { ok: true, errors: {}, redirectTo: "/parent/link" };
}

export type ClaimState = {
  ok: boolean;
  errors: FieldErrors;
  child?: { name: string; schoolName: string };
};

/**
 * Links a signed-in parent to a child.
 *
 * Requires BOTH the student code and the child's date of birth. The code alone
 * is not treated as a credential — it gets written on things, photographed, and
 * read aloud — so the birthdate is the second factor.
 *
 * Every failure returns the same message and does the same work, so this cannot
 * be used to test whether a code is real.
 *
 * ⚠ THAT SENTENCE USED TO CONTINUE "…or to brute-force a birthdate against a
 * known-good code", AND IT WAS WRONG. Indistinguishable failures stop an
 * attacker learning WHICH guess was close; they do nothing about how many
 * guesses are possible. A schoolchild's date of birth has a few thousand
 * plausible values, and there was no limit at all — so a known-good code plus a
 * loop got somebody a guardianship over another family's child in minutes, with
 * their attendance, marks, messages and record behind it. That is the most
 * serious thing an unlimited form in this app could do.
 *
 * The rate is now bounded from both directions — see CLAIM_ATTEMPTS and
 * CLAIM_PER_CODE, which stop different attacks and neither of which is
 * sufficient alone.
 */
export async function claimChild(input: unknown): Promise<ClaimState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: "Please log in again." } };

  const parsed = claimChildSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { studentCode: rawCode, birthdate, relation } = parsed.data;
  const generic: ClaimState = {
    ok: false,
    errors: {
      _form:
        "That code and date of birth do not match a student. Check both with the school — the code is on the letter they sent home.",
    },
  };

  const code = normalizeCode(rawCode);
  const birthDate = parseDateOnly(birthdate);
  if (!birthDate) return { ok: false, errors: { birthdate: "Use a real date." } };

  /**
   * BOTH LIMITS BEFORE ANY LOOKUP, so a refusal costs the same whether the code
   * is real or not — the same reason the failures below are indistinguishable.
   *
   * Per CALLER first: every attempt costs a signed-in account, which is what
   * makes grinding expensive. Per CODE second, and loosely, so many accounts
   * cannot grind one child — loose because a tight limit here would let an
   * attacker lock a real parent out of claiming their own child.
   */
  const perCaller = await consume(
    `claim:user:${session.user.id}`,
    CLAIM_ATTEMPTS.limit,
    CLAIM_ATTEMPTS.windowMs,
  );
  if (!perCaller.allowed) {
    return {
      ok: false,
      errors: { _form: `Too many attempts. Try again ${retryHint(perCaller.retryAfterSeconds)}.` },
    };
  }

  const perCode = await consume(`claim:code:${code}`, CLAIM_PER_CODE.limit, CLAIM_PER_CODE.windowMs);
  if (!perCode.allowed) {
    return {
      ok: false,
      errors: { _form: `Too many attempts for that code. Try again ${retryHint(perCode.retryAfterSeconds)}.` },
    };
  }

  // Same bootstrap as a join code: a parent claiming their child has no
  // membership of that school and cannot be scoped to it, so the student code
  // itself is what opens exactly the one row. The date of birth checked below is
  // the second factor — the code alone gets a look, never a link.
  const membership = await forJoinCode(code, () =>
    db.membership.findUnique({
      where: { studentCode: code },
      include: {
        user: { select: { id: true, name: true, preferredName: true, birthdate: true } },
        school: { select: { id: true, name: true } },
      },
    }),
  );

  if (!membership || membership.role !== "STUDENT" || membership.status !== "ACTIVE") {
    await fakePasswordWork(); // keep the timing indistinguishable
    return generic;
  }

  // No birthdate on file means the code alone would be enough — refuse rather
  // than silently downgrading to single-factor.
  if (!membership.user.birthdate) {
    await fakePasswordWork();
    return {
      ok: false,
      errors: {
        _form:
          "We cannot verify this student's date of birth. Ask the school to link you instead — they can do it in seconds.",
      },
    };
  }

  if (!sameCalendarDay(membership.user.birthdate, birthDate)) {
    await fakePasswordWork();
    await audit({
      schoolId: membership.schoolId,
      actorUserId: session.user.id,
      action: "parent.claim.failed",
      targetType: "Membership",
      targetId: membership.id,
    });
    return generic;
  }

  const existing = await db.guardianship.findUnique({
    where: {
      parentUserId_studentMembershipId: {
        parentUserId: session.user.id,
        studentMembershipId: membership.id,
      },
    },
    select: { id: true, status: true },
  });

  if (existing?.status === "ACTIVE") {
    return {
      ok: false,
      errors: { _form: "You are already linked to this student." },
    };
  }

  await db.guardianship.upsert({
    where: {
      parentUserId_studentMembershipId: {
        parentUserId: session.user.id,
        studentMembershipId: membership.id,
      },
    },
    create: {
      parentUserId: session.user.id,
      studentMembershipId: membership.id,
      studentSchoolId: membership.schoolId,
      relation,
      status: "ACTIVE",
      consentSharingAt: new Date(),
      consentNotificationsAt: new Date(),
    },
    update: { status: "ACTIVE", relation, consentSharingAt: new Date() },
  });

  await audit({
    schoolId: membership.schoolId,
    actorUserId: session.user.id,
    action: "parent.claim",
    targetType: "Membership",
    targetId: membership.id,
  });

  // Switch the live session into the parent role. Without this a brand-new
  // parent lands on the role picker immediately after claiming, which reads as
  // "did that work?" rather than as success.
  await setActiveContext(session.sessionId, session.user.id, { schoolId: null, role: "PARENT" });

  const childName = membership.user.preferredName ?? membership.user.name;

  if (session.user.email) {
    await sendParentClaimNotice(
      session.user.email,
      childName,
      membership.school.name,
      `${APP_URL}/parent`,
    ).catch((error) => console.error("[claimChild] notice failed", error));
  }

  return {
    ok: true,
    errors: {},
    child: { name: childName, schoolName: membership.school.name },
  };
}
