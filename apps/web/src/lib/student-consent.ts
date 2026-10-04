import "server-only";
import { isCollegeKind, STUDENT_CONSENT_GRANTS, type StudentConsentGrant } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { isMinorOn } from "./adulthood";
import type { ActiveContext } from "./session";

export { STUDENT_CONSENT_GRANTS, type StudentConsentGrant };

/**
 * WHAT AN ADULT STUDENT LETS A GUARDIAN SEE (the owner's college plan of 4
 * October 2026). At a school a guardian sees their child's day without
 * asking, and that does not change. At a college the student is usually an
 * adult, and an adult's attendance, results, money, hostel and bus, placement
 * and messages are theirs: the guardian sees each only while the student has
 * granted it, and the student may take any grant back whenever they like.
 *
 * WHO IT APPLIES TO. A student whose institution is a COLLEGE or an
 * AUTONOMOUS_COLLEGE and whose own row says they are not a minor
 * (User.isMinor, kept to the birthday by refreshMinority). A minor at a
 * college — a seventeen-year-old in the first year — and every pupil at a
 * school or a junior college: the guardian keeps everything, no grant asked.
 *
 * THE DEFAULT IS NOTHING. An adult who has never opened the consent page has
 * granted nothing, so their guardian sees nothing that a grant guards; the
 * student is the only writer (`setStudentConsent`), and every change is in the
 * audit log.
 *
 * WHAT A FAMILY DOOR CALLS: `parentMaySee(studentMembershipId, grant)` — true
 * or false — or `assertParentMaySee`, which throws a 403 with the reason. The
 * guardianship check itself (`assertGuardianAccess` in tenancy.ts) is still
 * the door's first lock; this is the second, for an adult at a college.
 */

type ConsentSubject = { schoolId: string; isMinor: boolean; kind: string };

/**
 * The facts that decide whether a grant is needed at all, for one student
 * membership; null when there is no such student. Adulthood is decided from
 * the date of birth on the school's own calendar day at the moment of reading
 * (LIFECYCLE-2): the stored `isMinor` is refreshed by the night's job, which
 * left a guardian reading an adult's results until the next night's run. An
 * account with no date keeps the stored flag.
 */
async function subjectOf(studentMembershipId: string, now: Date = new Date()): Promise<ConsentSubject | null> {
  const m = await db.membership.findFirst({
    where: { id: studentMembershipId, role: "STUDENT" },
    select: { schoolId: true, user: { select: { isMinor: true, birthdate: true } }, school: { select: { kind: true, timezone: true } } },
  });
  if (!m) return null;
  return { schoolId: m.schoolId, isMinor: isMinorToday(m.user, m.school.timezone, now), kind: m.school.kind };
}

/** A minor today on the school's calendar, from the date of birth when there is one, else the stored flag. */
export function isMinorToday(user: { birthdate: Date | null; isMinor: boolean }, timeZone: string, now: Date = new Date()): boolean {
  return user.birthdate ? isMinorOn(user.birthdate, now, timeZone) : user.isMinor;
}

/** Whether the grants apply to this student at all: an adult at a college. */
export async function consentApplies(studentMembershipId: string, now: Date = new Date()): Promise<boolean> {
  const subject = await subjectOf(studentMembershipId, now);
  return subject !== null && isCollegeKind(subject.kind) && !subject.isMinor;
}

/**
 * Whether a guardian of this student may see what `grant` guards: always for a
 * minor or a pupil at a school or a junior college; for an adult at a college,
 * only while the student has granted it. Does NOT check that the caller is the
 * student's guardian — the door's guardianship check does that first.
 */
export async function parentMaySee(studentMembershipId: string, grant: StudentConsentGrant, now: Date = new Date()): Promise<boolean> {
  const subject = await subjectOf(studentMembershipId, now);
  if (!subject) return false;
  if (!isCollegeKind(subject.kind) || subject.isMinor) return true;
  const row = await db.studentConsent.findUnique({
    where: { studentMembershipId_grant: { studentMembershipId, grant } },
    select: { revokedAt: true },
  });
  return row !== null && row.revokedAt === null;
}

/** `parentMaySee`, as a refusal a door answers 403. */
export async function assertParentMaySee(studentMembershipId: string, grant: StudentConsentGrant): Promise<void> {
  if (!(await parentMaySee(studentMembershipId, grant))) throw new AccessError("consent.refuseNotGranted");
}

export type StudentConsentView = {
  applies: boolean;
  grants: { grant: StudentConsentGrant; on: boolean; grantedAt: Date | null }[];
  guardians: { name: string }[];
};

function assertStudent(ctx: ActiveContext): asserts ctx is ActiveContext & { schoolId: string; membershipId: string } {
  if (ctx.role !== "STUDENT" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
}

/** The student's own grants, every one listed with whether it is on, and who their guardians are. */
export async function myStudentConsent(ctx: ActiveContext): Promise<StudentConsentView> {
  assertStudent(ctx);
  const [applies, rows, guardians] = await Promise.all([
    consentApplies(ctx.membershipId),
    db.studentConsent.findMany({ where: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId }, select: { grant: true, grantedAt: true, revokedAt: true } }),
    db.guardianship.findMany({
      where: { studentMembershipId: ctx.membershipId, status: "ACTIVE", relation: { not: "SCHOOL" } },
      select: { parent: { select: { name: true, preferredName: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const byGrant = new Map(rows.map((r) => [r.grant, r]));
  return {
    applies,
    grants: STUDENT_CONSENT_GRANTS.map((grant) => {
      const row = byGrant.get(grant);
      // Where the grants do not apply the guardian sees everything, and the list says so.
      const on = applies ? Boolean(row && !row.revokedAt) : true;
      return { grant, on, grantedAt: on && row ? row.grantedAt : null };
    }),
    guardians: guardians.map((g) => ({ name: g.parent.preferredName ?? g.parent.name })),
  };
}

/**
 * Grant or revoke one. The student's alone, and only where the grants apply
 * (an adult at a college): a minor's guardian already sees everything, and a
 * page that let them "revoke" would be telling them something false.
 * Idempotent: granting what is granted, or revoking what is not, changes
 * nothing and writes no audit row.
 */
export async function setStudentConsent(ctx: ActiveContext, grant: StudentConsentGrant, on: boolean): Promise<{ changed: boolean }> {
  assertStudent(ctx);
  if (!(STUDENT_CONSENT_GRANTS as readonly string[]).includes(grant)) throw new AccessError("consent.refuseUnknownGrant");
  if (!(await consentApplies(ctx.membershipId))) throw new AccessError("consent.refuseNotAdult");
  const { schoolId, membershipId } = ctx;
  const existing = await db.studentConsent.findUnique({
    where: { studentMembershipId_grant: { studentMembershipId: membershipId, grant } },
    select: { id: true, revokedAt: true },
  });
  const isOn = existing !== null && existing.revokedAt === null;
  if (isOn === on) return { changed: false };
  if (on) {
    if (existing) await db.studentConsent.update({ where: { id: existing.id }, data: { grantedAt: new Date(), revokedAt: null } });
    else await db.studentConsent.create({ data: { schoolId, studentMembershipId: membershipId, grant } });
  } else {
    await db.studentConsent.updateMany({ where: { id: existing!.id, schoolId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: on ? "student.consent.grant" : "student.consent.revoke",
    targetType: "Membership",
    targetId: membershipId,
    meta: { grant },
  });
  return { changed: true };
}
