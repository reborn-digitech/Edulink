import "server-only";
import { weeksBetween, type TeachingPracticeDesk } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { streamsOf } from "./streams";
import { todayKey } from "./dates";
import { deskCaller } from "./duty-desks";
import { currentRecordsYear } from "./stream-records";
import { teachingPracticeSummary } from "./stream-summaries";
import { SEATED_NOW } from "./academics";
import type { ActiveContext } from "./session";

/**
 * TEACHING PRACTICE (an education college's; the duty
 * PRACTICE_TEACHING_COORDINATOR; 5 October 2026). The NCTE's B.Ed. norms ask
 * for twenty weeks of school internship over the programme
 * (NCTE_MIN_PRACTICE_WEEKS): the coordinator keeps the practice schools,
 * posts each student teacher to one for a span of days with the lessons
 * planned, and watches lessons — each observation a row with a grade; the
 * lessons observed are counted from those rows on read, never stored.
 *
 * The coordinator and the office manage schools and postings; only the
 * coordinator (a FACULTY or HOD holding the duty) records an observation, in
 * their own name. The head reads. A college with no EDUCATION stream is
 * answered with `offered: false` and refused every write (409).
 */

const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

async function educationOffered(schoolId: string): Promise<boolean> {
  return (await streamsOf(schoolId)).includes("EDUCATION");
}

/** The student teachers: ACTIVE seats on an EDUCATION programme, or at a college whose only stream is education, every active seat. */
async function studentTeachers(schoolId: string) {
  const [streams, seats] = await Promise.all([streamsOf(schoolId), db.studentProgramme.findMany({ where: { schoolId, ...SEATED_NOW }, select: { studentMembershipId: true, programme: { select: { code: true, stream: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } })]);
  const onlyEducation = streams.length === 1 && streams[0] === "EDUCATION";
  const education = seats.filter((s) => s.programme.stream === "EDUCATION");
  return (education.length || !onlyEducation ? education : seats).map((s) => ({ membershipId: s.studentMembershipId, name: nameOf(s.student.user), programmeCode: s.programme.code })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function teachingPracticeDesk(ctx: ActiveContext): Promise<TeachingPracticeDesk> {
  const c = await deskCaller(ctx, "PRACTICE_TEACHING_COORDINATOR", "ACADEMICS");
  const school = await db.school.findUniqueOrThrow({ where: { id: c.schoolId }, select: { timezone: true } });
  const offered = await educationOffered(c.schoolId);
  const [schools, postings, students, summary] = await Promise.all([
    db.practiceSchool.findMany({ where: { schoolId: c.schoolId, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, udise: true, contact: true, _count: { select: { postings: true } } } }),
    db.teachingPracticePosting.findMany({ where: { schoolId: c.schoolId }, orderBy: [{ fromKey: "desc" }], take: 500, select: { id: true, studentMembershipId: true, practiceSchoolId: true, fromKey: true, toKey: true, lessonsPlanned: true, practiceSchool: { select: { name: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } }, observations: { orderBy: { at: "asc" }, select: { id: true, at: true, observerMembershipId: true, grade: true, note: true } } } }),
    offered ? studentTeachers(c.schoolId) : Promise.resolve([]),
    teachingPracticeSummary(c.schoolId, currentRecordsYear(school.timezone)),
  ]);
  const observerIds = [...new Set(postings.flatMap((p) => p.observations.map((o) => o.observerMembershipId)))];
  const observers = observerIds.length ? await db.membership.findMany({ where: { id: { in: observerIds } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }) : [];
  const observerName = new Map(observers.map((o) => [o.id, nameOf(o.user)]));
  return {
    offered,
    canManage: offered && (c.role === "ADMIN" || c.holder),
    canObserve: offered && c.holder,
    schools: schools.map((s) => ({ id: s.id, name: s.name, udise: s.udise, contact: s.contact, postings: s._count.postings })),
    postings: postings.map((p) => ({
      id: p.id,
      studentMembershipId: p.studentMembershipId,
      studentName: nameOf(p.student.user),
      practiceSchoolId: p.practiceSchoolId,
      practiceSchoolName: p.practiceSchool.name,
      from: p.fromKey,
      to: p.toKey,
      weeks: weeksBetween(p.fromKey, p.toKey),
      lessonsPlanned: p.lessonsPlanned,
      observations: p.observations.map((o) => ({ id: o.id, at: o.at, observerName: observerName.get(o.observerMembershipId) ?? "", grade: o.grade as "A", note: o.note })),
    })),
    students,
    summary,
  };
}

async function manager(ctx: ActiveContext) {
  const c = await deskCaller(ctx, "PRACTICE_TEACHING_COORDINATOR", "ACADEMICS", ["ADMIN"]);
  if (!(await educationOffered(c.schoolId))) throw new RuleRefusal("duties.teachingPractice.refuseNotEducation", 409);
  return c;
}

/** A practice school added or corrected by the coordinator or the office; a second school of the same name is refused. */
export async function savePracticeSchool(ctx: ActiveContext, input: { id?: string; name: string; udise: string | null; contact: string }): Promise<{ id: string }> {
  const c = await manager(ctx);
  const name = input.name.trim();
  const clash = await db.practiceSchool.findFirst({ where: { schoolId: c.schoolId, name, ...(input.id ? { NOT: { id: input.id } } : {}) }, select: { id: true } });
  if (clash) throw new RuleRefusal("duties.teachingPractice.refuseDuplicateSchool", 409, undefined, "name");
  const data = { name, udise: input.udise, contact: input.contact.trim() };
  let id = input.id;
  if (id) {
    const done = await db.practiceSchool.updateMany({ where: { id, schoolId: c.schoolId }, data });
    if (!done.count) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  } else id = (await db.practiceSchool.create({ data: { schoolId: c.schoolId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.teachingPractice.school", targetType: "PracticeSchool", targetId: id, meta: { edit: Boolean(input.id), udise: Boolean(input.udise) } });
  return { id };
}

/** A student teacher posted to a practice school for a span of days; two postings of one student may not overlap. */
export async function savePracticePosting(ctx: ActiveContext, input: { id?: string; studentMembershipId: string; practiceSchoolId: string; from: string; to: string; lessonsPlanned: number }): Promise<{ id: string }> {
  const c = await manager(ctx);
  if (input.to < input.from) throw new RuleRefusal("duties.teachingPractice.refuseDates", 422, undefined, "to");
  const [student, place] = await Promise.all([
    db.membership.findFirst({ where: { id: input.studentMembershipId, schoolId: c.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { id: true } }),
    db.practiceSchool.findFirst({ where: { id: input.practiceSchoolId, schoolId: c.schoolId, archivedAt: null }, select: { id: true } }),
  ]);
  if (!student) throw new RuleRefusal("duties.teachingPractice.refuseStudent", 422, undefined, "studentMembershipId");
  if (!place) throw new RuleRefusal("duties.teachingPractice.refuseSchool", 422, undefined, "practiceSchoolId");
  const overlap = await db.teachingPracticePosting.findFirst({ where: { schoolId: c.schoolId, studentMembershipId: student.id, fromKey: { lte: input.to }, toKey: { gte: input.from }, ...(input.id ? { NOT: { id: input.id } } : {}) }, select: { id: true } });
  if (overlap) throw new RuleRefusal("duties.teachingPractice.refuseOverlap", 409, undefined, "from");
  const data = { studentMembershipId: student.id, practiceSchoolId: place.id, fromKey: input.from, toKey: input.to, lessonsPlanned: input.lessonsPlanned };
  let id = input.id;
  if (id) {
    // A posting with observed lessons keeps whose it is (TA-381): the grades were given to its student, so the student
    // stays and the days must still hold every observation; the school, the lessons planned and a wider span may change.
    const was = await db.teachingPracticePosting.findFirst({ where: { id, schoolId: c.schoolId }, select: { studentMembershipId: true, _count: { select: { observations: true } } } });
    if (!was) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    if (was._count.observations > 0) {
      if (was.studentMembershipId !== student.id) throw new RuleRefusal("duties.teachingPractice.refusePostingObserved", 409, { count: was._count.observations }, "studentMembershipId");
      const outside = await db.lessonObservation.count({ where: { postingId: id, OR: [{ at: { lt: input.from } }, { at: { gt: input.to } }] } });
      if (outside) throw new RuleRefusal("duties.teachingPractice.refusePostingObserved", 409, { count: outside }, "from");
    }
    const done = await db.teachingPracticePosting.updateMany({ where: { id, schoolId: c.schoolId }, data });
    if (!done.count) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  } else id = (await db.teachingPracticePosting.create({ data: { schoolId: c.schoolId, createdByUserId: c.userId, ...data }, select: { id: true } })).id;
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.teachingPractice.posting", targetType: "TeachingPracticePosting", targetId: id, meta: { weeks: weeksBetween(input.from, input.to), lessonsPlanned: input.lessonsPlanned, edit: Boolean(input.id) } });
  return { id };
}

/** A lesson watched by the coordinator, in their own name: on a day of the posting, not in the future. */
export async function addLessonObservation(ctx: ActiveContext, postingId: string, input: { at: string; grade: string; note: string }): Promise<{ id: string }> {
  const c = await deskCaller(ctx, "PRACTICE_TEACHING_COORDINATOR", "ACADEMICS", []);
  if (!(await educationOffered(c.schoolId))) throw new RuleRefusal("duties.teachingPractice.refuseNotEducation", 409);
  const posting = await db.teachingPracticePosting.findFirst({ where: { id: postingId, schoolId: c.schoolId }, select: { id: true, fromKey: true, toKey: true } });
  if (!posting) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({ where: { id: c.schoolId }, select: { timezone: true } });
  if (input.at < posting.fromKey || input.at > posting.toKey || input.at > todayKey(school.timezone)) throw new RuleRefusal("duties.teachingPractice.refuseObservationDay", 422, undefined, "at");
  const row = await db.lessonObservation.create({ data: { schoolId: c.schoolId, postingId: posting.id, at: input.at, observerMembershipId: c.membershipId, grade: input.grade, note: input.note.trim() }, select: { id: true } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.teachingPractice.observe", targetType: "TeachingPracticePosting", targetId: posting.id, meta: { grade: input.grade } });
  return row;
}
