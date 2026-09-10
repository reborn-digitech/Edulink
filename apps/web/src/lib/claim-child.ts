import "server-only";
import { db } from "./db";
import { fakePasswordWork } from "./crypto";
import { setActiveContext, type ActiveContext } from "./session";
import { normalizeCode } from "./codes";
import { parseDateOnly, sameCalendarDay } from "./dates";
import { audit } from "./audit";
import { forJoinCode } from "./tenant-context";
import { sendParentClaimNotice } from "./email";
import { syncStandinGuardian } from "./standin-guardian";
import { consume, retryHintKey, CLAIM_ATTEMPTS, CLAIM_PER_CODE } from "./rate-limit";
import { claimChildSchema, fieldErrors, type FieldErrors } from "./validation";
import type { Translate } from "./i18n/dictionary";

/**
 * A guardian linking themselves to a child by the child's student code and
 * date of birth — the web's /parent/link form (through the claimChild server
 * action) and the phone's POST /api/v1/community/link-child, one function so
 * the two doors cannot drift in the one place drifting is dangerous: the
 * limits. Moved here from app/join/actions.ts unchanged, apart from the two
 * rate-limit refusals now also saying how long to wait, so an API can answer
 * 429 with Retry-After rather than a 422 that invites another go.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type ClaimState = {
  ok: boolean;
  errors: FieldErrors;
  child?: { name: string; schoolName: string };
  /** Set on the two rate-limit refusals only: seconds until another attempt counts. */
  retryAfterSeconds?: number;
};

/** "in about 5 minutes", in the reader's language — see `retryHintKey`. */
function hint(t: Translate, seconds: number): string {
  const h = retryHintKey(seconds);
  return t(h.key, h.vars);
}

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
export async function claimChildFor(session: ActiveContext, input: unknown, t: Translate): Promise<ClaimState> {

  const parsed = claimChildSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  const { studentCode: rawCode, birthdate, relation } = parsed.data;
  const generic: ClaimState = {
    ok: false,
    errors: {
      _form: t("join.claimMismatch"),
    },
  };

  const code = normalizeCode(rawCode);
  const birthDate = parseDateOnly(birthdate);
  if (!birthDate) return { ok: false, errors: { birthdate: t("join.useRealDate") } };

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
      errors: { _form: t("join.tooManyAttempts", { when: hint(t, perCaller.retryAfterSeconds) }) },
      retryAfterSeconds: perCaller.retryAfterSeconds,
    };
  }

  const perCode = await consume(`claim:code:${code}`, CLAIM_PER_CODE.limit, CLAIM_PER_CODE.windowMs);
  if (!perCode.allowed) {
    return {
      ok: false,
      errors: { _form: t("join.tooManyForCode", { when: hint(t, perCode.retryAfterSeconds) }) },
      retryAfterSeconds: perCode.retryAfterSeconds,
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
        _form: t("join.noBirthdateOnFile"),
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
      errors: { _form: t("join.alreadyLinked") },
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

  // A real guardian now exists, so the school's stand-in (the class teacher
  // or an admin holding guardian rights while no parent was on the app) is
  // revoked in the same breath. The parent replaces; they never share.
  await syncStandinGuardian({
    schoolId: membership.schoolId,
    studentMembershipId: membership.id,
    actorUserId: session.user.id,
  }).catch((error) => console.error("[claimChild] standin sync failed", error));

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
