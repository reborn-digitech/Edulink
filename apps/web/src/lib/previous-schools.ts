import "server-only";
import type { PreviousSchool, PreviousSchoolsView } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { readJson } from "./json";
import { assertGuardianAccess } from "./tenancy";
import type { ActiveContext } from "./session";

/**
 * THE PREVIOUS SCHOOLS (R-70, the owner's decision of 10 October 2026): on the
 * pupil's record at the new school and on the family's child page, each
 * school the pupil has left — its leaving certificate (the TC the family
 * already holds) and its PUBLISHED report cards — read-only, the old school
 * named, no per-school switch: a published card is the family's.
 *
 * WHO READS, AND THROUGH WHICH CLAUSE. Every read here runs under the
 * reader's ORDINARY binding; nothing widens to the old school. The rows are
 * opened by the row policies (scripts/gen-rls.ts), and this file asks for the
 * same thing in its WHERE so the fence holds in a test that runs as the
 * owner:
 *   - the office of the school the child attends NOW (ADMIN, PRINCIPAL):
 *     the roll clause — the child on its roll as a STUDENT, ACTIVE, not left
 *     — opens the live SchoolRecord (MEMBER_READABLE) and, through it, the
 *     PUBLISHED cards of the membership that record names. A pupil who has
 *     left this school too reads nothing (the fence is `leftAt IS NULL`);
 *   - a guardian: the guardian clause, keyed on the OLD membership
 *     (GUARDIAN_READABLE on SchoolRecord, OWN_RECORD_READABLE on
 *     ReportCard) — a parent linked only at the new school reads the old
 *     school's papers once the old school links them too, as the TC itself
 *     works today;
 *   - the pupil: their own rows, through their user id.
 * A draft card is never listed (the policy opens PUBLISHED alone), nor the
 * marks behind a card: the subjects are the card's frozen snapshot.
 */

type CardRow = { id: string; title: string; fromDateKey: string; toDateKey: string; publishedAt: Date | null; attendancePresent: number; attendanceTotal: number; overallPercentMilli: number | null; overallLetter: string | null; gradePointsMilli: number | null; subjects: string | null; remark: string | null; studentMembershipId: string };
type SubjectSnapshot = { subject?: string; percent?: number | null; letter?: string | null };

function cardView(c: CardRow) {
  const subjects = readJson<SubjectSnapshot[]>(c.subjects, []);
  return {
    id: c.id,
    title: c.title,
    fromDateKey: c.fromDateKey,
    toDateKey: c.toDateKey,
    publishedAt: c.publishedAt?.toISOString() ?? null,
    attendancePresent: c.attendancePresent,
    attendanceTotal: c.attendanceTotal,
    overallPercent: c.overallPercentMilli === null ? null : c.overallPercentMilli / 1000,
    overallLetter: c.overallLetter,
    gradePoints: c.gradePointsMilli === null ? null : c.gradePointsMilli / 1000,
    subjects: subjects.filter((s) => typeof s.subject === "string").map((s) => ({ subject: s.subject!, percent: typeof s.percent === "number" ? s.percent : null, letter: s.letter ?? null })),
    remark: c.remark,
  };
}

/**
 * The child this read is about, and the clause the reader comes through:
 * the office by the roll (the child on ITS roll now), a guardian by the
 * guardianship, the pupil by themself.
 */
async function subjectOf(ctx: ActiveContext, studentMembershipId: string): Promise<{ userId: string; name: string; hereSchoolId: string; onRollHere: boolean; clause: "ROLL" | "GUARDIAN" | "SELF" }> {
  if (ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") {
    if (!ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
    const m = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId: ctx.schoolId, role: "STUDENT" }, select: { userId: true, status: true, leftAt: true, user: { select: { name: true, preferredName: true } } } });
    if (!m) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    return { userId: m.userId, name: m.user.preferredName ?? m.user.name, hereSchoolId: ctx.schoolId, onRollHere: m.status === "ACTIVE" && m.leftAt === null, clause: "ROLL" };
  }
  if (ctx.role === "PARENT") {
    const link = await assertGuardianAccess(ctx.user.id, studentMembershipId);
    return { userId: link.student.userId, name: link.student.user.preferredName ?? link.student.user.name, hereSchoolId: link.student.schoolId, onRollHere: true, clause: "GUARDIAN" };
  }
  if (ctx.role === "STUDENT") {
    const m = await db.membership.findFirst({ where: { id: studentMembershipId, userId: ctx.user.id, role: "STUDENT" }, select: { userId: true, schoolId: true, user: { select: { name: true, preferredName: true } } } });
    if (!m) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    return { userId: m.userId, name: m.user.preferredName ?? m.user.name, hereSchoolId: m.schoolId, onRollHere: true, clause: "SELF" };
  }
  throw new AccessError("access.wrongRoleForThisAction");
}

/** The pupil's previous schools as this reader may see them (see the docblock). */
export async function previousSchoolsFor(ctx: ActiveContext, studentMembershipId: string): Promise<PreviousSchoolsView> {
  const who = await subjectOf(ctx, studentMembershipId);
  // The roll clause spelled out: a pupil who has left this school too reads nothing of the schools before it.
  if (!who.onRollHere) return { studentMembershipId, studentName: who.name, schools: [] };
  const byReader =
    who.clause === "GUARDIAN"
      ? { membership: { guardianships: { some: { parentUserId: ctx.user.id, status: "ACTIVE" } } } }
      : who.clause === "SELF"
        ? { studentUserId: ctx.user.id }
        : {};
  const records = await db.schoolRecord.findMany({
    where: { studentUserId: who.userId, supersededAt: null, schoolId: { not: who.hereSchoolId }, studentMembershipId: { not: null }, ...byReader },
    orderBy: { leftAt: "desc" },
    select: { id: true, schoolId: true, schoolName: true, serial: true, className: true, gradeLevel: true, joinedAt: true, leftAt: true, reason: true, conduct: true, attendanceMarked: true, attendancePresent: true, reportCardCount: true, studentMembershipId: true },
  });
  const memberships = records.map((r) => r.studentMembershipId!).filter(Boolean);
  const cards: CardRow[] = memberships.length
    ? await db.reportCard.findMany({
        where: { studentMembershipId: { in: memberships }, status: "PUBLISHED", ...(who.clause === "GUARDIAN" ? { student: { guardianships: { some: { parentUserId: ctx.user.id, status: "ACTIVE" } } } } : who.clause === "SELF" ? { student: { userId: ctx.user.id } } : {}) },
        orderBy: [{ toDateKey: "desc" }, { createdAt: "desc" }],
        select: { id: true, title: true, fromDateKey: true, toDateKey: true, publishedAt: true, attendancePresent: true, attendanceTotal: true, overallPercentMilli: true, overallLetter: true, gradePointsMilli: true, subjects: true, remark: true, studentMembershipId: true },
      })
    : [];
  const schools: PreviousSchool[] = records.map((r) => ({
    recordId: r.id,
    schoolName: r.schoolName,
    serial: r.serial,
    className: r.className,
    gradeLevel: r.gradeLevel,
    joinedAt: r.joinedAt.toISOString(),
    leftAt: r.leftAt.toISOString(),
    reason: r.reason,
    conduct: r.conduct,
    attendanceMarked: r.attendanceMarked,
    attendancePresent: r.attendancePresent,
    reportCardCount: r.reportCardCount,
    cards: cards.filter((c) => c.studentMembershipId === r.studentMembershipId).map(cardView),
  }));
  return { studentMembershipId, studentName: who.name, schools };
}
