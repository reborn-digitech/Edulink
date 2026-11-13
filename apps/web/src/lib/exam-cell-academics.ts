import "server-only";
import { db } from "./db";
import { creditsOf } from "./academics-rules";
import { eligibilityForTerm } from "./academics-attendance";
import { gradingTableOf, rulesOf, type ExamRules, type GradeRow } from "./exam-cell-rules";

/**
 * WHAT THE EXAM CELL READS OF THE ACADEMICS MODULE (4 October 2026), in one
 * place: terms (AcademicTerm), courses with their scheme's grading table and
 * passing rules (Course, Scheme), who is registered on what (CourseRegistration
 * on a CourseOffering), the internal totals the HOD locked (InternalLock — the
 * one table the academics builder hands over), a student's seat (PRN,
 * division; StudentProgramme) and the attendance eligibility for a term.
 * Nothing here writes: those are the academics module's rows, and the exam
 * cell keeps only their ids.
 */

export type TermFacts = { id: string; name: string; academicYear: string; startsOn: string; endsOn: string };
export type CourseFacts = { id: string; code: string; name: string; semester: number; creditsTenths: number; schemeId: string; programmeId: string; rules: ExamRules; table: GradeRow[] };

export async function termsOf(schoolId: string): Promise<TermFacts[]> {
  const rows = await db.academicTerm.findMany({ where: { schoolId }, orderBy: [{ startsOn: "desc" }], select: { id: true, name: true, academicYear: true, startsOn: true, endsOn: true } });
  return rows;
}

export async function termOf(schoolId: string, termId: string): Promise<TermFacts | null> {
  return db.academicTerm.findFirst({ where: { id: termId, schoolId }, select: { id: true, name: true, academicYear: true, startsOn: true, endsOn: true } });
}

export async function termNames(schoolId: string, termIds: readonly string[]): Promise<Map<string, string>> {
  if (termIds.length === 0) return new Map();
  const rows = await db.academicTerm.findMany({ where: { schoolId, id: { in: [...new Set(termIds)] } }, select: { id: true, name: true } });
  return new Map(rows.map((r) => [r.id, r.name]));
}

/** Courses by id, each with its scheme's rules and table read once per scheme. */
export async function coursesOf(schoolId: string, courseIds: readonly string[]): Promise<Map<string, CourseFacts>> {
  const ids = [...new Set(courseIds)];
  if (ids.length === 0) return new Map();
  const rows = await db.course.findMany({
    where: { schoolId, id: { in: ids } },
    select: { id: true, code: true, name: true, semester: true, creditsL: true, creditsT: true, creditsP: true, schemeId: true, scheme: { select: { programmeId: true, gradingTable: true, passingRules: true } } },
  });
  const schemes = new Map<string, { rules: ExamRules; table: GradeRow[] }>();
  const out = new Map<string, CourseFacts>();
  for (const r of rows) {
    let s = schemes.get(r.schemeId);
    if (!s) {
      s = { rules: rulesOf(r.scheme.passingRules), table: gradingTableOf(r.scheme.gradingTable) };
      schemes.set(r.schemeId, s);
    }
    out.set(r.id, { id: r.id, code: r.code, name: r.name, semester: r.semester, creditsTenths: creditsOf(r) * 10, schemeId: r.schemeId, programmeId: r.scheme.programmeId, rules: s.rules, table: s.table });
  }
  return out;
}

/** Every student REGISTERED on a course in the term: student → course ids. */
export async function registrationsOf(schoolId: string, termId: string, studentIds?: readonly string[]): Promise<Map<string, string[]>> {
  const rows = await db.courseRegistration.findMany({
    where: { schoolId, termId, status: "REGISTERED", ...(studentIds ? { studentMembershipId: { in: [...studentIds] } } : {}), student: { status: "ACTIVE" } },
    select: { studentMembershipId: true, offering: { select: { courseId: true } } },
  });
  const out = new Map<string, string[]>();
  for (const r of rows) {
    const list = out.get(r.studentMembershipId) ?? [];
    if (!list.includes(r.offering.courseId)) list.push(r.offering.courseId);
    out.set(r.studentMembershipId, list);
  }
  return out;
}

/** The term's courses with how many are registered on each (across its offerings). */
export async function termCourses(schoolId: string, termId: string): Promise<{ courseId: string; code: string; name: string; creditsTenths: number; registered: number }[]> {
  const offerings = await db.courseOffering.findMany({
    where: { schoolId, termId },
    select: { courseId: true, course: { select: { code: true, name: true, creditsL: true, creditsT: true, creditsP: true } }, _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
  });
  const by = new Map<string, { courseId: string; code: string; name: string; creditsTenths: number; registered: number }>();
  for (const o of offerings) {
    const had = by.get(o.courseId);
    if (had) had.registered += o._count.registrations;
    else by.set(o.courseId, { courseId: o.courseId, code: o.course.code, name: o.course.name, creditsTenths: creditsOf(o.course) * 10, registered: o._count.registrations });
  }
  return [...by.values()].sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * The internal totals the HOD locked for the term's offerings, by
 * `${studentMembershipId}|${courseId}`, in thousandths of a mark on the
 * scheme's internal maximum (InternalLock keeps hundredths out of `outOf`).
 */
export async function lockedInternals(schoolId: string, termId: string): Promise<Map<string, number>> {
  const locks = await db.internalLock.findMany({ where: { schoolId, termId }, select: { outOf: true, totalsJson: true, offering: { select: { courseId: true } } } });
  const out = new Map<string, number>();
  for (const l of locks) {
    let totals: { studentMembershipId?: unknown; totalHundredths?: unknown }[] = [];
    try {
      const parsed = JSON.parse(l.totalsJson) as unknown;
      if (Array.isArray(parsed)) totals = parsed as typeof totals;
    } catch {
      totals = [];
    }
    for (const t of totals) {
      if (typeof t.studentMembershipId !== "string" || typeof t.totalHundredths !== "number") continue;
      out.set(`${t.studentMembershipId}|${l.offering.courseId}`, Math.round(t.totalHundredths * 10));
    }
  }
  return out;
}

/** A student's seat: the university's PRN, the division, the programme and the year they entered. */
export async function seatsOf(schoolId: string, studentIds: readonly string[]): Promise<Map<string, { prn: string | null; divisionId: string | null; programmeId: string; programmeName: string; entryYear: number; semester: number }>> {
  if (studentIds.length === 0) return new Map();
  const rows = await db.studentProgramme.findMany({
    where: { schoolId, studentMembershipId: { in: [...new Set(studentIds)] } },
    select: { studentMembershipId: true, prn: true, divisionId: true, programmeId: true, entryYear: true, semester: true, programme: { select: { name: true } } },
  });
  return new Map(rows.map((r) => [r.studentMembershipId, { prn: r.prn, divisionId: r.divisionId, programmeId: r.programmeId, programmeName: r.programme.name, entryYear: r.entryYear, semester: r.semester }]));
}

export type Eligibility = { eligible: boolean; courses: { courseId: string; percent: number | null; threshold: number; condoned: boolean }[] };

/**
 * Whether each student may sit the term's papers on attendance: the
 * academics module's own eligibility list (`eligibilityForTerm` — every
 * registered course at or above the programme's threshold, or condoned),
 * by student and course.
 */
export async function eligibilityOf(schoolId: string, termId: string, studentIds: readonly string[]): Promise<Map<string, Eligibility>> {
  const ids = [...new Set(studentIds)];
  const out = new Map<string, Eligibility>();
  if (ids.length === 0) return out;
  const rows = (ids.length === 1 ? await eligibilityForTerm(termId, { studentMembershipId: ids[0] }) : await eligibilityForTerm(termId)).filter((r) => ids.includes(r.studentMembershipId));
  const offerings = rows.length ? await db.courseOffering.findMany({ where: { schoolId, id: { in: [...new Set(rows.map((r) => r.offeringId))] } }, select: { id: true, courseId: true } }) : [];
  const courseOf = new Map(offerings.map((o) => [o.id, o.courseId]));
  for (const id of ids) out.set(id, { eligible: true, courses: [] });
  for (const r of rows) {
    const e = out.get(r.studentMembershipId)!;
    e.courses.push({ courseId: courseOf.get(r.offeringId) ?? r.offeringId, percent: r.percent, threshold: r.threshold, condoned: r.condoned });
    if (!r.eligible) e.eligible = false;
  }
  return out;
}

/** The term's offerings with their faculty and division, for pass rates by faculty and division. */
export async function offeringsOfTerm(schoolId: string, termId: string, departmentId?: string): Promise<{ offeringId: string; courseId: string; facultyMembershipId: string | null; facultyName: string | null; divisionId: string | null; divisionName: string | null; students: string[] }[]> {
  const rows = await db.courseOffering.findMany({
    where: { schoolId, termId, ...(departmentId ? { course: { scheme: { programme: { departmentId } } } } : {}) },
    select: { id: true, courseId: true, divisionId: true, facultyMembershipId: true, registrations: { where: { status: "REGISTERED" }, select: { studentMembershipId: true } } },
  });
  const facultyIds = [...new Set(rows.map((r) => r.facultyMembershipId).filter((x): x is string => Boolean(x)))];
  const divisionIds = [...new Set(rows.map((r) => r.divisionId).filter((x): x is string => Boolean(x)))];
  const [faculty, divisions] = await Promise.all([
    facultyIds.length ? db.membership.findMany({ where: { id: { in: facultyIds } }, select: { id: true, user: { select: { name: true } } } }) : Promise.resolve([]),
    divisionIds.length ? db.division.findMany({ where: { id: { in: divisionIds } }, select: { id: true, class: { select: { name: true } } } }) : Promise.resolve([]),
  ]);
  const fName = new Map(faculty.map((f) => [f.id, f.user.name]));
  const dName = new Map(divisions.map((d) => [d.id, d.class.name]));
  return rows.map((r) => ({ offeringId: r.id, courseId: r.courseId, facultyMembershipId: r.facultyMembershipId, facultyName: r.facultyMembershipId ? (fName.get(r.facultyMembershipId) ?? null) : null, divisionId: r.divisionId, divisionName: r.divisionId ? (dName.get(r.divisionId) ?? null) : null, students: r.registrations.map((x) => x.studentMembershipId) }));
}

/** The academics module's room by id, for a hall named after one. */
export async function roomOf(schoolId: string, roomId: string): Promise<{ id: string; name: string; capacity: number } | null> {
  return db.room.findFirst({ where: { id: roomId, schoolId }, select: { id: true, name: true, capacity: true } });
}

/**
 * The internal totals locked for these courses in ANY term, by
 * `${studentMembershipId}|${courseId}`, in thousandths: a backlog sat this
 * session keeps the internal of the term the course was taught in. The
 * latest lock wins.
 */
export async function internalsFor(schoolId: string, courseIds: readonly string[]): Promise<Map<string, number>> {
  return new Map([...(await lockedInternalsFor(schoolId, courseIds))].map(([k, v]) => [k, v.milli]));
}

/**
 * The same totals with the maximum each was locked out of (TA-070): `outOf`, the scheme's internal maximum at the
 * lock, which the run compares with the scheme's maximum now before adding the total to an external.
 */
export async function lockedInternalsFor(schoolId: string, courseIds: readonly string[]): Promise<Map<string, { milli: number; outOf: number }>> {
  const out = new Map<string, { milli: number; outOf: number }>();
  if (courseIds.length === 0) return out;
  const locks = await db.internalLock.findMany({ where: { schoolId, offering: { courseId: { in: [...new Set(courseIds)] } } }, orderBy: { lockedAt: "asc" }, select: { outOf: true, totalsJson: true, offering: { select: { courseId: true } } } });
  for (const l of locks) {
    let totals: { studentMembershipId?: unknown; totalHundredths?: unknown }[] = [];
    try {
      const parsed = JSON.parse(l.totalsJson) as unknown;
      if (Array.isArray(parsed)) totals = parsed as typeof totals;
    } catch {
      totals = [];
    }
    for (const t of totals) if (typeof t.studentMembershipId === "string" && typeof t.totalHundredths === "number") out.set(`${t.studentMembershipId}|${l.offering.courseId}`, { milli: Math.round(t.totalHundredths * 10), outOf: l.outOf });
  }
  return out;
}

/** The university's numbers for each student: the PRN (the seat's, else the record's) and the APAAR id the Academic Bank credits against. */
export async function studentIdsOf(schoolId: string, studentIds: readonly string[]): Promise<Map<string, { prn: string | null; apaarId: string | null; abcId: string | null }>> {
  const ids = [...new Set(studentIds)];
  if (ids.length === 0) return new Map();
  const [seats, records] = await Promise.all([
    db.studentProgramme.findMany({ where: { schoolId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true, prn: true } }),
    db.pupilRecord.findMany({ where: { schoolId, studentMembershipId: { in: ids } }, select: { studentMembershipId: true, prn: true, apaarId: true, abcId: true } }),
  ]);
  const seat = new Map(seats.map((s) => [s.studentMembershipId, s.prn]));
  const rec = new Map(records.map((r) => [r.studentMembershipId, r]));
  // The record's PRN is the truth (one writer: the office's admission and seat page); the seat's is its copy (4 Oct 2026).
  return new Map(ids.map((id) => [id, { prn: rec.get(id)?.prn ?? seat.get(id) ?? null, apaarId: rec.get(id)?.apaarId ?? null, abcId: rec.get(id)?.abcId ?? null }]));
}
