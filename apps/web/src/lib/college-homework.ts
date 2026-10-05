import "server-only";
import type { CollegeOfferingWork, CollegeWorkGradebook, CollegeWorkHome } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { writeJson, type Attachment } from "./json";
import { toMilli } from "./validation";
import { academicsCaller, hodDepartment, TEACHING, type Caller } from "./academics";
import { saveInternalMarks } from "./academics-assessment";
import { getGradebook, publishAssignment, saveGrades, type GradeInput } from "./grading";
import type { ActiveContext } from "./session";

/**
 * HOMEWORK AT A COLLEGE (R-48 / A3-inventory-6, the risks batch of 5 October 2026).
 *
 * A college teacher teaches a CourseOffering, not a class: an elective is
 * shared across divisions and has no class at all, and its students are the
 * offering's REGISTERED registrations. So a college's piece of work is the
 * school's own Assignment row with `offeringId` set and `classId` null (a CHECK
 * in migration 20261005171208_college_homework holds exactly one of the two).
 *
 * WHO. Set, published and marked by the offering's faculty member or the HOD of
 * the department whose programme owns the course — the same two who enter its
 * internal marks (academics-assessment.ts). The office reads the list and the
 * marking sheet; it does not set or mark a college's work.
 *
 * WHAT IS REUSED. Everything after the row is written is the school's:
 * `assertAssignmentAccess` (tenancy.ts) knows both kinds of row, `workAudience`
 * (grading.ts) answers "who is it for" for both, so the gradebook, the marks
 * save (`saveGrades`), the publish notice (`publishAssignment`), the student's
 * work list (`getStudentWork`, through `ownWorkScope`), the hand-in with its
 * photographs (/student/work, /api/v1/family/student/submissions) and the file
 * gate (files.ts) serve a college's work unchanged.
 *
 * POSTING TO AN INTERNAL COMPONENT. Optional: the work's marks scaled to one of
 * the offering's internal components, written through `saveInternalMarks` —
 * THE ONE WRITER of InternalMark — so the lock, the release, the countersign
 * rule and the audit row are that writer's own, not a second copy here.
 */

const OFFERING = {
  id: true,
  facultyMembershipId: true,
  term: { select: { name: true } },
  course: { select: { code: true, name: true, scheme: { select: { programme: { select: { departmentId: true } } } } } },
  divisionId: true,
} as const;

type OfferingRow = { id: string; facultyMembershipId: string | null; term: { name: string }; course: { code: string; name: string; scheme: { programme: { departmentId: string } } }; divisionId: string | null };

/** The offering, when the caller teaches it or heads its department; otherwise refused (404 for another college's id). */
async function teacherOf(c: Caller, offeringId: string): Promise<{ o: OfferingRow; mine: boolean }> {
  const o = await db.courseOffering.findFirst({ where: { id: offeringId, schoolId: c.schoolId }, select: OFFERING });
  if (!o) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const mine = o.facultyMembershipId === c.membershipId;
  const heads = c.role === "HOD" && (await hodDepartment(c))?.id === o.course.scheme.programme.departmentId;
  if (!mine && !heads) throw new AccessError("academics.refuseNotYours");
  return { o, mine };
}

async function divisionNames(ids: (string | null)[]): Promise<Map<string, string>> {
  const clean = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!clean.length) return new Map();
  const rows = await db.division.findMany({ where: { id: { in: clean } }, select: { id: true, class: { select: { name: true } } } });
  return new Map(rows.map((d) => [d.id, d.class.name]));
}

const registeredCount = (offeringId: string) => db.courseRegistration.count({ where: { offeringId, status: "REGISTERED" } });

/** The components marks may still be posted into: not released, and the offering not locked. */
async function openComponents(offeringId: string): Promise<{ locked: boolean; components: { id: string; name: string; maxMarks: number }[] }> {
  const [lock, components] = await Promise.all([
    db.internalLock.findUnique({ where: { offeringId }, select: { id: true } }),
    db.internalComponent.findMany({ where: { offeringId, releasedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true, name: true, maxMarks: true } }),
  ]);
  return { locked: Boolean(lock), components: lock ? [] : components };
}

/** The offerings the caller teaches, and for an HOD the department's others, each with how much work it has and how much waits to be marked. */
export async function collegeWorkHome(ctx: ActiveContext): Promise<CollegeWorkHome> {
  const c = await academicsCaller(ctx, TEACHING);
  const dept = await hodDepartment(c);
  const offerings = await db.courseOffering.findMany({
    where: {
      schoolId: c.schoolId,
      OR: [{ facultyMembershipId: c.membershipId }, ...(dept ? [{ course: { scheme: { programme: { departmentId: dept.id } } } }] : [])],
    },
    select: {
      ...OFFERING,
      term: { select: { name: true, startsOn: true } },
      _count: { select: { registrations: { where: { status: "REGISTERED" } }, assignments: true } },
    },
    orderBy: [{ term: { startsOn: "desc" } }, { course: { code: "asc" } }],
    take: 100,
  });
  const ids = offerings.map((o) => o.id);
  const [waiting, divisions] = await Promise.all([
    // Handed in and not yet marked, per offering.
    db.submission.findMany({ where: { schoolId: c.schoolId, status: "SUBMITTED", grade: { is: null }, assignment: { offeringId: { in: ids } } }, select: { assignment: { select: { offeringId: true } } }, take: 5000 }),
    divisionNames(offerings.map((o) => o.divisionId)),
  ]);
  const markBy = new Map<string, number>();
  for (const w of waiting) if (w.assignment.offeringId) markBy.set(w.assignment.offeringId, (markBy.get(w.assignment.offeringId) ?? 0) + 1);
  return {
    offerings: offerings.map((o) => ({
      offeringId: o.id,
      courseCode: o.course.code,
      courseName: o.course.name,
      termName: o.term.name,
      divisionName: o.divisionId ? (divisions.get(o.divisionId) ?? null) : null,
      registered: o._count.registrations,
      mine: o.facultyMembershipId === c.membershipId,
      work: o._count.assignments,
      toMark: markBy.get(o.id) ?? 0,
    })),
  };
}

/** One offering's work, newest first, with the components its marks may go into. */
export async function offeringWork(ctx: ActiveContext, offeringId: string): Promise<CollegeOfferingWork> {
  const c = await academicsCaller(ctx, TEACHING);
  const { o } = await teacherOf(c, offeringId);
  const [rows, registered, divisions, open] = await Promise.all([
    db.assignment.findMany({
      where: { schoolId: c.schoolId, offeringId },
      orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      take: 200,
      select: { id: true, title: true, category: true, pointsMilli: true, dueAt: true, publishedAt: true, _count: { select: { grades: true } }, submissions: { where: { submittedAt: { not: null } }, select: { id: true } } },
    }),
    registeredCount(offeringId),
    divisionNames([o.divisionId]),
    openComponents(offeringId),
  ]);
  return {
    offeringId,
    courseCode: o.course.code,
    courseName: o.course.name,
    termName: o.term.name,
    divisionName: o.divisionId ? (divisions.get(o.divisionId) ?? null) : null,
    registered,
    items: rows.map((a) => ({ id: a.id, title: a.title, category: a.category, pointsMilli: a.pointsMilli, dueAt: a.dueAt?.toISOString() ?? null, publishedAt: a.publishedAt?.toISOString() ?? null, submitted: a.submissions.length, graded: a._count.grades, registered })),
    components: open.components,
    locked: open.locked,
  };
}

/**
 * Set a piece of work on an offering. A draft tells nobody; publishing tells
 * the registered students (and the guardians an adult student has let see
 * their results), through the school's own publish. A due date already past is
 * refused unless the teacher confirms it, as on the school's form.
 */
export async function setOfferingWork(
  ctx: ActiveContext,
  offeringId: string,
  input: { title: string; body: string; category?: string; points?: number; dueAt?: string; publish: boolean; confirmPastDue?: boolean; attachments?: Attachment[] },
): Promise<{ assignmentId: string; notified: number }> {
  const c = await academicsCaller(ctx, TEACHING);
  await teacherOf(c, offeringId);
  if (input.dueAt && new Date(input.dueAt).getTime() < Date.now() && !input.confirmPastDue) throw new RuleRefusal("collegeWork.refusePastDue", 422, undefined, "dueAt");
  const row = await db.assignment.create({
    data: {
      schoolId: c.schoolId,
      offeringId,
      classId: null,
      authorMembershipId: c.membershipId,
      title: input.title,
      body: input.body,
      category: input.category || null,
      pointsMilli: input.points === undefined ? null : toMilli(input.points),
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      attachments: writeJson(input.attachments ?? []),
    },
    select: { id: true },
  });
  if (!input.publish) {
    await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "assignment.draft", targetType: "Assignment", targetId: row.id, meta: { offeringId, title: input.title } });
    return { assignmentId: row.id, notified: 0 };
  }
  await publishAssignment({ schoolId: c.schoolId, membershipId: c.membershipId, role: c.role as "FACULTY" | "HOD", userId: c.userId }, row.id);
  return { assignmentId: row.id, notified: await registeredCount(offeringId) };
}

/** The offering's work, as the teacher: refused for a class's work, another offering's, or another college's. */
async function offeringWorkRow(c: Caller, assignmentId: string): Promise<{ id: string; offeringId: string; pointsMilli: number | null; title: string }> {
  const a = await db.assignment.findFirst({ where: { id: assignmentId, schoolId: c.schoolId, offeringId: { not: null } }, select: { id: true, offeringId: true, pointsMilli: true, title: true } });
  if (!a?.offeringId) throw new AccessError("access.assignmentNotFound", "NOT_FOUND");
  await teacherOf(c, a.offeringId);
  return { ...a, offeringId: a.offeringId };
}

const grader = (c: Caller) => ({ schoolId: c.schoolId, membershipId: c.membershipId, role: c.role as "FACULTY" | "HOD", userId: c.userId });

/** The marking sheet: the school's gradebook over the offering's registered students, and the components marks may go into. */
export async function offeringWorkGradebook(ctx: ActiveContext, assignmentId: string): Promise<CollegeWorkGradebook> {
  const c = await academicsCaller(ctx, TEACHING);
  const a = await offeringWorkRow(c, assignmentId);
  const [book, open] = await Promise.all([getGradebook(grader(c), assignmentId), openComponents(a.offeringId)]);
  const iso = (d: Date | null) => d?.toISOString() ?? null;
  return {
    assignment: { id: book.assignment.id, offeringId: a.offeringId, title: book.assignment.title, body: book.assignment.body, category: book.assignment.category, pointsMilli: book.assignment.pointsMilli, dueAt: iso(book.assignment.dueAt), publishedAt: iso(book.assignment.publishedAt), label: book.assignment.className, attachments: book.assignment.attachments },
    rows: book.rows.map((r) => ({ membershipId: r.membershipId, name: r.name, fullName: r.fullName, avatarKey: r.avatarKey, submittedAt: iso(r.submittedAt), submissionStatus: r.submissionStatus, late: r.late, scoreMilli: r.scoreMilli, letter: r.letter, comment: r.comment, gradedAt: iso(r.gradedAt), work: r.work ? { body: r.work.body, attachments: r.work.attachments } : null })),
    stats: book.stats,
    components: open.components,
    locked: open.locked,
  };
}

/** Marks for the offering's work: the school's batch save (first marks tell the student). */
export async function saveOfferingWorkGrades(ctx: ActiveContext, assignmentId: string, inputs: GradeInput[]): Promise<{ saved: number; cleared: number; rejected: number }> {
  const c = await academicsCaller(ctx, TEACHING);
  await offeringWorkRow(c, assignmentId);
  const result = await saveGrades(grader(c), assignmentId, inputs);
  return { saved: result.saved, cleared: result.cleared, rejected: result.rejected.length };
}

/** Publish a draft: the registered students are told. Work already published is answered as it stands (a phone's queued publish replayed tells nobody twice). */
export async function publishOfferingWork(ctx: ActiveContext, assignmentId: string): Promise<{ ok: true }> {
  const c = await academicsCaller(ctx, TEACHING);
  await offeringWorkRow(c, assignmentId);
  const row = await db.assignment.findUnique({ where: { id: assignmentId }, select: { publishedAt: true } });
  if (row?.publishedAt) return { ok: true };
  await publishAssignment(grader(c), assignmentId);
  return { ok: true };
}

/**
 * The work's marks into an internal component, scaled from the work's points
 * to the component's maximum and rounded to a tenth of a mark; a mark above
 * the points (bonus) is held to the component's maximum. Only the students
 * still registered and already marked are posted. Written by saveInternalMarks.
 */
export async function postWorkToInternal(ctx: ActiveContext, assignmentId: string, componentId: string): Promise<{ posted: number; notMarked: number; componentId: string }> {
  const c = await academicsCaller(ctx, TEACHING);
  const a = await offeringWorkRow(c, assignmentId);
  if (!a.pointsMilli) throw new RuleRefusal("collegeWork.refuseNoPoints", 422, undefined, "componentId");
  const component = await db.internalComponent.findFirst({ where: { id: componentId, offeringId: a.offeringId }, select: { id: true, maxMarks: true } });
  if (!component) throw new RuleRefusal("academics.refuseUnknownComponent", 422, undefined, "componentId");
  const [grades, registrations] = await Promise.all([
    db.grade.findMany({ where: { assignmentId, scoreMilli: { not: null } }, select: { studentMembershipId: true, scoreMilli: true } }),
    db.courseRegistration.findMany({ where: { offeringId: a.offeringId, status: "REGISTERED" }, select: { studentMembershipId: true } }),
  ]);
  const registered = new Set(registrations.map((r) => r.studentMembershipId));
  const entries = grades
    .filter((g) => registered.has(g.studentMembershipId) && g.scoreMilli !== null)
    .map((g) => ({ studentMembershipId: g.studentMembershipId, marks: scaledMarks(g.scoreMilli!, a.pointsMilli!, component.maxMarks) }));
  if (!entries.length) throw new RuleRefusal("collegeWork.refuseNothingMarked", 409);
  const saved = await saveInternalMarks(ctx, a.offeringId, { componentId: component.id, entries });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.work.postInternal", targetType: "Assignment", targetId: assignmentId, meta: { offeringId: a.offeringId, componentId: component.id, posted: saved.saved } });
  return { posted: saved.saved, notMarked: registered.size - entries.length, componentId: component.id };
}

/** A mark out of the work's points, as marks out of the component's maximum, to a tenth; never above the maximum. */
export function scaledMarks(scoreMilli: number, pointsMilli: number, maxMarks: number): number {
  const tenths = Math.round((scoreMilli * maxMarks * 10) / pointsMilli);
  return Math.min(tenths, maxMarks * 10) / 10;
}
