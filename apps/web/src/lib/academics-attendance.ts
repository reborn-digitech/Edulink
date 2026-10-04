import "server-only";
import type { z } from "zod";
import type { attendanceReportSchema, Condonation, CourseAttendance, eligibilitySchema, LectureRow, LectureSheet, lecturesSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { parentMaySee } from "./student-consent";
import { addDaysToKey, dateKeyRange, isDateKey, parseTeachingDays, todayKey, weekdayOfKey } from "./dates";
import { academicsCaller, currentTerm, divisionNames, ensureLecturesForDay, hodDepartment, nameOf, type Caller } from "./academics";
import { canMissMore, isEligible, percentOf } from "./academics-rules";
import type { ActiveContext } from "./session";

/**
 * LECTURE ATTENDANCE (the college's academics, 4 October 2026).
 *
 * A faculty member marks each lecture — from the phone, through the offline
 * outbox, or on the web. A batch carries a clientId the device minted; the
 * same batch a second time writes nothing, so a replay after a dropped
 * signal is harmless. Late counts as attended.
 *
 * THE RULE. A student's percentage on an offering is the lectures they
 * attended over the lectures marked for them, computed on read and never
 * stored, against their programme's threshold (75; pharmacy 80; law 70 —
 * Programme.attendanceThreshold). Below it they are a defaulter unless a
 * condonation was approved. The projection is how many of the lectures
 * still on the timetable before the term ends may be missed.
 *
 * NOTICES, AND NO JOB. A defaulter is told (and their guardians, where
 * the consent record lets them see attendance) at most once a week per
 * offering: when a mark first takes them under the line, or when their
 * HOD opens the defaulter list. DefaulterNotice is the once-a-week record.
 *
 * CONDONATION. The student asks with a ground and a document; the HOD of
 * their programme's department approves when the shortfall is above the
 * department's floor (Department.condoneFloorPercent), forwards otherwise or
 * refuses; the principal decides what was forwarded.
 *
 * FOR THE EXAMS MODULE: `eligibilityForTerm(termId)` — every registered
 * student on every offering of the term, with the percentage, the
 * threshold, whether condoned and whether eligible to sit.
 */

const ATTENDED = ["PRESENT", "LATE"];
const NOTICE_EVERY_MS = 7 * 24 * 60 * 60 * 1000;

/* -------------------------------------------------------- the arithmetic */

type RegRow = { studentMembershipId: string; offeringId: string; name: string; courseCode: string; courseName: string; departmentId: string; threshold: number };

/** Lectures each offering still has on the timetable from `from` to the term's end, on teaching days the college is open. */
async function remainingBy(schoolId: string, offeringIds: string[], from: string, to: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!offeringIds.length || from > to) return out;
  const [slots, school, holidays] = await Promise.all([
    db.offeringSlot.findMany({ where: { offeringId: { in: offeringIds } }, select: { offeringId: true, weekday: true } }),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { teachingDays: true } }),
    db.holiday.findMany({ where: { schoolId, startDateKey: { lte: to }, endDateKey: { gte: from } }, select: { startDateKey: true, endDateKey: true } }),
  ]);
  const teaching = new Set(parseTeachingDays(school.teachingDays));
  const perWeekday = new Map<number, number>();
  const days = dateKeyRange(from, to, 400).filter((d) => teaching.has(weekdayOfKey(d)) && !holidays.some((h) => h.startDateKey <= d && h.endDateKey >= d));
  for (const d of days) perWeekday.set(weekdayOfKey(d), (perWeekday.get(weekdayOfKey(d)) ?? 0) + 1);
  for (const s of slots) out.set(s.offeringId, (out.get(s.offeringId) ?? 0) + (perWeekday.get(s.weekday) ?? 0));
  return out;
}

/** Held and attended per offering and student, counted by the database. */
async function countsBy(offeringIds: string[], studentIds?: string[]): Promise<Map<string, { held: number; attended: number }>> {
  const out = new Map<string, { held: number; attended: number }>();
  if (!offeringIds.length) return out;
  const rows = await db.lectureAttendance.findMany({
    where: { lecture: { offeringId: { in: offeringIds }, cancelledAt: null }, ...(studentIds ? { studentMembershipId: { in: studentIds } } : {}) },
    select: { studentMembershipId: true, status: true, lecture: { select: { offeringId: true } } },
  });
  for (const r of rows) {
    const k = `${r.lecture.offeringId}|${r.studentMembershipId}`;
    const v = out.get(k) ?? { held: 0, attended: 0 };
    v.held += 1;
    if (ATTENDED.includes(r.status)) v.attended += 1;
    out.set(k, v);
  }
  return out;
}

/** The term's approved condonations: by student, for one offering or (null) every course. */
async function condonedBy(schoolId: string, termId: string): Promise<(studentId: string, offeringId: string) => boolean> {
  const rows = await db.attendanceCondonation.findMany({ where: { schoolId, termId, status: { in: ["HOD_APPROVED", "PRINCIPAL_APPROVED"] } }, select: { studentMembershipId: true, offeringId: true } });
  return (s, o) => rows.some((r) => r.studentMembershipId === s && (r.offeringId === null || r.offeringId === o));
}

/**
 * Every registered student's attendance on the term's offerings, narrowed
 * as asked. One function for the student's page, the family's, the
 * defaulter lists, the condonation desk and the exams module.
 */
export async function attendanceRows(schoolId: string, termId: string, filter: { studentMembershipId?: string; offeringIds?: string[]; departmentId?: string } = {}): Promise<(CourseAttendance & { studentMembershipId: string; name: string; departmentId: string })[]> {
  const term = await db.academicTerm.findUniqueOrThrow({ where: { id: termId }, select: { endsOn: true } });
  const regs = await db.courseRegistration.findMany({
    where: {
      schoolId,
      termId,
      status: "REGISTERED",
      ...(filter.studentMembershipId ? { studentMembershipId: filter.studentMembershipId } : {}),
      ...(filter.offeringIds ? { offeringId: { in: filter.offeringIds } } : {}),
      ...(filter.departmentId ? { offering: { course: { scheme: { programme: { departmentId: filter.departmentId } } } } } : {}),
    },
    select: {
      studentMembershipId: true,
      offeringId: true,
      student: { select: { user: { select: { name: true, preferredName: true } }, academicSeat: { select: { programme: { select: { attendanceThreshold: true } } } } } },
      offering: { select: { course: { select: { code: true, name: true, scheme: { select: { programme: { select: { departmentId: true, attendanceThreshold: true } } } } } } } },
    },
  });
  const rows: RegRow[] = regs.map((r) => ({
    studentMembershipId: r.studentMembershipId,
    offeringId: r.offeringId,
    name: nameOf(r.student.user),
    courseCode: r.offering.course.code,
    courseName: r.offering.course.name,
    departmentId: r.offering.course.scheme.programme.departmentId,
    // The student's own programme's rule: a law student on another department's elective is still held to 70.
    threshold: r.student.academicSeat?.programme.attendanceThreshold ?? r.offering.course.scheme.programme.attendanceThreshold,
  }));
  const offeringIds = [...new Set(rows.map((r) => r.offeringId))];
  const tz = (await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } })).timezone;
  const [counts, condoned, remaining] = await Promise.all([
    countsBy(offeringIds, filter.studentMembershipId ? [filter.studentMembershipId] : undefined),
    condonedBy(schoolId, termId),
    remainingBy(schoolId, offeringIds, addDaysToKey(todayKey(tz), 1), term.endsOn),
  ]);
  return rows
    .map((r) => {
      const c = counts.get(`${r.offeringId}|${r.studentMembershipId}`) ?? { held: 0, attended: 0 };
      const percent = percentOf(c.attended, c.held);
      const left = remaining.get(r.offeringId) ?? 0;
      const isCondoned = condoned(r.studentMembershipId, r.offeringId);
      return { ...r, held: c.held, attended: c.attended, percent, remaining: left, canMiss: canMissMore({ attended: c.attended, held: c.held, remaining: left, threshold: r.threshold }), condoned: isCondoned, eligible: isEligible(percent, r.threshold, isCondoned) };
    })
    .sort((a, b) => a.courseCode.localeCompare(b.courseCode) || a.name.localeCompare(b.name));
}

/**
 * THE ELIGIBILITY LIST, for the exams module's forms: every student
 * registered on every offering of the term, with the percentage (null when
 * nothing is marked yet), the threshold, whether a condonation covers it
 * and whether they may sit. Read through the caller's session (row-level
 * security keeps it to their college); the caller decides who may ask.
 */
export async function eligibilityForTerm(termId: string, opts: { studentMembershipId?: string } = {}): Promise<{ studentMembershipId: string; name: string; offeringId: string; courseCode: string; percent: number | null; threshold: number; condoned: boolean; eligible: boolean }[]> {
  const term = await db.academicTerm.findUnique({ where: { id: termId }, select: { schoolId: true } });
  if (!term) return [];
  const rows = await attendanceRows(term.schoolId, termId, opts);
  return rows.map((r) => ({ studentMembershipId: r.studentMembershipId, name: r.name, offeringId: r.offeringId, courseCode: r.courseCode, percent: r.percent, threshold: r.threshold, condoned: r.condoned, eligible: r.eligible }));
}

/** GET /academics/eligibility — the list as the office, the head, an HOD (their department) or the exam controller reads it. */
export async function eligibilityList(ctx: ActiveContext, termId: string): Promise<z.infer<typeof eligibilitySchema>> {
  const c = await academicsCaller(ctx, ["ADMIN", "PRINCIPAL", "HOD", "EXAM_CONTROLLER"]);
  const term = await db.academicTerm.findFirst({ where: { id: termId, schoolId: c.schoolId }, select: { id: true } });
  if (!term) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const dept = c.role === "HOD" ? await hodDepartment(c) : null;
  const rows = await attendanceRows(c.schoolId, term.id, c.role === "HOD" ? { departmentId: dept?.id ?? "-" } : {});
  return { termId: term.id, rows: rows.map((r) => ({ studentMembershipId: r.studentMembershipId, name: r.name, offeringId: r.offeringId, courseCode: r.courseCode, percent: r.percent, threshold: r.threshold, condoned: r.condoned, eligible: r.eligible })) };
}

/* ---------------------------------------------------------------- notices */

/** Tell each defaulter (and their guardians, where allowed) once a week per offering at most. Returns how many were told. */
async function sendDefaulterNotices(schoolId: string, rows: { studentMembershipId: string; offeringId: string; courseCode: string; courseName: string; percent: number | null; threshold: number }[]): Promise<number> {
  let sent = 0;
  const since = new Date(Date.now() - NOTICE_EVERY_MS);
  for (const r of rows) {
    if (r.percent === null) continue;
    const recent = await db.defaulterNotice.findFirst({ where: { offeringId: r.offeringId, studentMembershipId: r.studentMembershipId, sentAt: { gte: since } }, select: { id: true } });
    if (recent) continue;
    const student = await db.membership.findUnique({ where: { id: r.studentMembershipId }, select: { userId: true } });
    if (!student) continue;
    await db.defaulterNotice.create({ data: { schoolId, studentMembershipId: r.studentMembershipId, offeringId: r.offeringId, percentTenths: Math.round(r.percent * 10) } });
    const vars = { course: `${r.courseCode} ${r.courseName}`, percent: String(r.percent), threshold: r.threshold };
    await notify({ userId: student.userId, schoolId, kind: "ATTENDANCE", titleKey: "academics.notifyDefaulterTitle", titleVars: vars, bodyKey: "academics.notifyDefaulterBody", bodyVars: vars, url: "/student/academics" });
    if (await parentMaySee(r.studentMembershipId, "ATTENDANCE")) {
      await notifyGuardians(r.studentMembershipId, (child) => ({ schoolId, kind: "ATTENDANCE", titleKey: "academics.notifyDefaulterGuardianTitle", titleVars: { child }, bodyKey: "academics.notifyDefaulterGuardianBody", bodyVars: { ...vars, child }, url: "/parent/academics" }));
    }
    sent += 1;
  }
  return sent;
}

/**
 * The attendance report: an offering's, a department's or the term's, all
 * students or the defaulters. Faculty read their own offerings; the HOD
 * their department — and opening the defaulter list is when the defaulters
 * who have not heard this week are told.
 */
export async function attendanceReport(ctx: ActiveContext, query: { termId?: string; offeringId?: string; departmentId?: string; defaultersOnly?: "0" | "1" }): Promise<z.infer<typeof attendanceReportSchema>> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD", "ADMIN", "PRINCIPAL"]);
  const today = todayKey(c.timeZone);
  const term = query.termId ? await db.academicTerm.findFirst({ where: { id: query.termId, schoolId: c.schoolId } }) : await currentTerm(c.schoolId, today);
  if (!term) return { termId: null, rows: [], noticesSent: 0 };
  const filter: { offeringIds?: string[]; departmentId?: string } = {};
  if (c.role === "FACULTY") {
    const mine = await db.courseOffering.findMany({ where: { schoolId: c.schoolId, termId: term.id, facultyMembershipId: c.membershipId, ...(query.offeringId ? { id: query.offeringId } : {}) }, select: { id: true } });
    filter.offeringIds = mine.map((m) => m.id);
  } else if (c.role === "HOD") {
    const dept = await hodDepartment(c);
    filter.departmentId = dept?.id ?? "-";
    if (query.offeringId) filter.offeringIds = [query.offeringId];
  } else {
    if (query.offeringId) filter.offeringIds = [query.offeringId];
    if (query.departmentId) filter.departmentId = query.departmentId;
  }
  let rows = await attendanceRows(c.schoolId, term.id, filter);
  if (query.defaultersOnly === "1") rows = rows.filter((r) => !r.eligible);
  let noticesSent = 0;
  if (c.role === "HOD" && query.defaultersOnly === "1") noticesSent = await sendDefaulterNotices(c.schoolId, rows.filter((r) => !r.eligible));
  const last = rows.length ? await db.defaulterNotice.groupBy({ by: ["offeringId", "studentMembershipId"], where: { schoolId: c.schoolId, offeringId: { in: [...new Set(rows.map((r) => r.offeringId))] } }, _max: { sentAt: true } }) : [];
  const lastBy = new Map(last.map((l) => [`${l.offeringId}|${l.studentMembershipId}`, l._max.sentAt]));
  return { termId: term.id, rows: rows.map((r) => ({ ...r, lastNoticeAt: lastBy.get(`${r.offeringId}|${r.studentMembershipId}`)?.toISOString() ?? null })), noticesSent };
}

/* --------------------------------------------------------------- lectures */

const LECTURE_SELECT = {
  id: true,
  offeringId: true,
  dateKey: true,
  startMinute: true,
  endMinute: true,
  kind: true,
  roomId: true,
  substituteMembershipId: true,
  offering: { select: { divisionId: true, facultyMembershipId: true, roomId: true, course: { select: { code: true, name: true, scheme: { select: { programme: { select: { departmentId: true } } } } } }, _count: { select: { registrations: { where: { status: "REGISTERED" } } } } } },
  _count: { select: { attendance: true } },
} as const;
type LectureFull = { id: string; offeringId: string; dateKey: string; startMinute: number; endMinute: number; kind: string; roomId: string | null; substituteMembershipId: string | null; offering: { divisionId: string | null; facultyMembershipId: string | null; roomId: string | null; course: { code: string; name: string; scheme: { programme: { departmentId: string } } }; _count: { registrations: number } }; _count: { attendance: number } };

async function lectureRows(lectures: LectureFull[], me: string): Promise<LectureRow[]> {
  const divisions = await divisionNames(lectures.map((l) => l.offering.divisionId));
  const roomIds = [...new Set(lectures.map((l) => l.roomId ?? l.offering.roomId).filter((x): x is string => Boolean(x)))];
  const rooms = new Map((roomIds.length ? await db.room.findMany({ where: { id: { in: roomIds } }, select: { id: true, name: true } }) : []).map((r) => [r.id, r.name]));
  return lectures.map((l) => {
    const room = l.roomId ?? l.offering.roomId;
    return { lectureId: l.id, offeringId: l.offeringId, dateKey: l.dateKey, startMinute: l.startMinute, endMinute: l.endMinute, kind: l.kind as "LECTURE", courseCode: l.offering.course.code, courseName: l.offering.course.name, divisionName: l.offering.divisionId ? (divisions.get(l.offering.divisionId) ?? null) : null, roomName: room ? (rooms.get(room) ?? null) : null, registered: l.offering._count.registrations, marked: l._count.attendance, substitute: l.substituteMembershipId === me };
  });
}

/** A teaching member's lectures on a day — their own offerings' and any they stand in for — made from the timetable on first read. */
export async function lecturesFor(c: Caller, date?: string): Promise<z.infer<typeof lecturesSchema>> {
  const dateKey = date && isDateKey(date) ? date : todayKey(c.timeZone);
  const mine = await db.courseOffering.findMany({ where: { schoolId: c.schoolId, facultyMembershipId: c.membershipId }, select: { id: true } });
  const { closed } = await ensureLecturesForDay(c.schoolId, dateKey, mine.map((m) => m.id));
  const lectures = await db.lecture.findMany({ where: { schoolId: c.schoolId, dateKey, cancelledAt: null, OR: [{ offering: { facultyMembershipId: c.membershipId }, substituteMembershipId: null }, { substituteMembershipId: c.membershipId }] }, select: LECTURE_SELECT, orderBy: { startMinute: "asc" } });
  return { dateKey, closed, lectures: await lectureRows(lectures, c.membershipId) };
}

export async function myLectures(ctx: ActiveContext, date?: string): Promise<z.infer<typeof lecturesSchema>> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  return lecturesFor(c, date);
}

/** Who may mark a lecture: its faculty member (unless someone stands in), the one standing in, or the department's HOD. */
async function lectureFor(c: Caller, lectureId: string, mode: "read" | "mark") {
  const lecture = await db.lecture.findFirst({ where: { id: lectureId, schoolId: c.schoolId }, select: { ...LECTURE_SELECT, cancelledAt: true } });
  if (!lecture) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  const own = lecture.substituteMembershipId ? lecture.substituteMembershipId === c.membershipId : lecture.offering.facultyMembershipId === c.membershipId;
  const hod = c.role === "HOD" && (await hodDepartment(c))?.id === lecture.offering.course.scheme.programme.departmentId;
  const office = c.role === "ADMIN" || c.role === "PRINCIPAL";
  if (!own && !hod && !(office && mode === "read")) throw new AccessError("academics.refuseNotYours");
  return { lecture, canMark: own || hod };
}

export async function lectureSheet(ctx: ActiveContext, lectureId: string): Promise<LectureSheet> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD", "ADMIN", "PRINCIPAL"]);
  const { lecture, canMark } = await lectureFor(c, lectureId, "read");
  const [regs, marks, term] = await Promise.all([
    db.courseRegistration.findMany({ where: { offeringId: lecture.offeringId, status: "REGISTERED" }, select: { studentMembershipId: true, termId: true, student: { select: { user: { select: { name: true, preferredName: true } }, academicSeat: { select: { divisionId: true, programme: { select: { attendanceThreshold: true } } } }, enrollments: { where: { status: "ACTIVE", class: { division: { isNot: null } } }, select: { rollNumber: true, class: { select: { division: { select: { id: true } } } } } } } } } }),
    db.lectureAttendance.findMany({ where: { lectureId }, select: { studentMembershipId: true, status: true } }),
    db.courseOffering.findUniqueOrThrow({ where: { id: lecture.offeringId }, select: { termId: true, course: { select: { scheme: { select: { programme: { select: { attendanceThreshold: true } } } } } } } }),
  ]);
  const statusBy = new Map(marks.map((m) => [m.studentMembershipId, m.status]));
  const rows = await attendanceRows(c.schoolId, term.termId, { offeringIds: [lecture.offeringId] });
  const percentBy = new Map(rows.map((r) => [r.studentMembershipId, r.percent]));
  const entries = regs
    .map((r) => {
      const e = r.student.enrollments.find((x) => x.class.division?.id === r.student.academicSeat?.divisionId);
      return { studentMembershipId: r.studentMembershipId, name: nameOf(r.student.user), rollNumber: e?.rollNumber ?? null, status: (statusBy.get(r.studentMembershipId) ?? null) as "PRESENT" | null, percent: percentBy.get(r.studentMembershipId) ?? null };
    })
    .sort((a, b) => (a.rollNumber ?? 9999) - (b.rollNumber ?? 9999) || a.name.localeCompare(b.name));
  const today = todayKey(c.timeZone);
  return { lecture: (await lectureRows([lecture], c.membershipId))[0]!, threshold: term.course.scheme.programme.attendanceThreshold, canMark: canMark && lecture.dateKey <= today && !lecture.cancelledAt, entries };
}

/**
 * A lecture's marks. Replay-safe by clientId: a batch already recorded
 * answers what stands and writes nothing. Students not registered on the
 * offering are refused; a lecture in the future cannot be marked. A student
 * the mark first takes under the line is told (once a week at most).
 */
export async function markLecture(ctx: ActiveContext, lectureId: string, input: { clientId: string; entries: { studentMembershipId: string; status: "PRESENT" | "ABSENT" | "LATE" }[] }): Promise<{ lectureId: string; present: number; absent: number; late: number; replay: boolean; noticesSent: number }> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  const { lecture } = await lectureFor(c, lectureId, "mark");
  const counts = async (replay: boolean, noticesSent = 0) => {
    const rows = await db.lectureAttendance.groupBy({ by: ["status"], where: { lectureId }, _count: { _all: true } });
    const n = (s: string) => rows.find((r) => r.status === s)?._count._all ?? 0;
    return { lectureId, present: n("PRESENT"), absent: n("ABSENT"), late: n("LATE"), replay, noticesSent };
  };
  if (await db.lectureAttendance.findFirst({ where: { lectureId, clientId: input.clientId }, select: { id: true } })) return counts(true);
  if (lecture.cancelledAt) throw new RuleRefusal("academics.refuseCancelled", 409);
  if (lecture.dateKey > todayKey(c.timeZone)) throw new RuleRefusal("academics.refuseFutureLecture", 409);
  const offering = await db.courseOffering.findUniqueOrThrow({ where: { id: lecture.offeringId }, select: { termId: true } });
  const registered = new Set((await db.courseRegistration.findMany({ where: { offeringId: lecture.offeringId, status: "REGISTERED" }, select: { studentMembershipId: true } })).map((r) => r.studentMembershipId));
  if (input.entries.some((e) => !registered.has(e.studentMembershipId))) throw new RuleRefusal("academics.refuseNotRegistered", 422, undefined, "entries");
  const students = input.entries.map((e) => e.studentMembershipId);
  const before = new Map((await attendanceRows(c.schoolId, offering.termId, { offeringIds: [lecture.offeringId] })).filter((r) => students.includes(r.studentMembershipId)).map((r) => [r.studentMembershipId, r]));
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    for (const e of input.entries) {
      await tx.lectureAttendance.upsert({
        where: { lectureId_studentMembershipId: { lectureId, studentMembershipId: e.studentMembershipId } },
        create: { schoolId: c.schoolId, lectureId, studentMembershipId: e.studentMembershipId, status: e.status, markedByMembershipId: c.membershipId, clientId: input.clientId },
        update: { status: e.status, markedByMembershipId: c.membershipId, markedAt: new Date(), clientId: input.clientId },
      });
    }
  });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.lecture.mark", targetType: "Lecture", targetId: lectureId, meta: { entries: input.entries.length, absent: input.entries.filter((e) => e.status === "ABSENT").length, dateKey: lecture.dateKey } });
  const after = (await attendanceRows(c.schoolId, offering.termId, { offeringIds: [lecture.offeringId] })).filter((r) => students.includes(r.studentMembershipId));
  // Told when this mark first takes them under the line: above it (or unmarked) before, under it now.
  const crossed = after.filter((r) => !r.eligible && (() => {
    const b = before.get(r.studentMembershipId);
    return !b || b.percent === null || b.eligible;
  })());
  const noticesSent = await sendDefaulterNotices(c.schoolId, crossed);
  return counts(false, noticesSent);
}

/* ------------------------------------------------------------ condonation */

const CONDONATION_SELECT = {
  id: true,
  studentMembershipId: true,
  termId: true,
  offeringId: true,
  ground: true,
  note: true,
  documentFileId: true,
  status: true,
  createdAt: true,
  decidedAt: true,
  hodDecidedAt: true,
  decisionNote: true,
  term: { select: { name: true } },
  student: { select: { userId: true, user: { select: { name: true, preferredName: true } }, academicSeat: { select: { programme: { select: { departmentId: true, department: { select: { condoneFloorPercent: true } } } } } } } },
} as const;
type CondonationRow = { id: string; studentMembershipId: string; termId: string; offeringId: string | null; ground: string; note: string; documentFileId: string | null; status: string; createdAt: Date; decidedAt: Date | null; hodDecidedAt: Date | null; decisionNote: string | null; term: { name: string }; student: { userId: string; user: { name: string; preferredName: string | null }; academicSeat: { programme: { departmentId: string; department: { condoneFloorPercent: number } } } | null } };

/** The percentage a condonation is about: the offering's, or the lowest of the student's courses. */
async function percentFor(schoolId: string, r: { studentMembershipId: string; termId: string; offeringId: string | null }): Promise<number | null> {
  const rows = await attendanceRows(schoolId, r.termId, { studentMembershipId: r.studentMembershipId, ...(r.offeringId ? { offeringIds: [r.offeringId] } : {}) });
  const ps = rows.map((x) => x.percent).filter((p): p is number => p !== null);
  return ps.length ? Math.min(...ps) : null;
}

async function condonationViews(schoolId: string, rows: CondonationRow[]): Promise<Condonation[]> {
  const offerings = await db.courseOffering.findMany({ where: { id: { in: rows.map((r) => r.offeringId).filter((x): x is string => Boolean(x)) } }, select: { id: true, course: { select: { code: true } } } });
  const codeBy = new Map(offerings.map((o) => [o.id, o.course.code]));
  const out: Condonation[] = [];
  for (const r of rows) {
    out.push({
      id: r.id,
      studentMembershipId: r.studentMembershipId,
      studentName: nameOf(r.student.user),
      termId: r.termId,
      termName: r.term.name,
      offeringId: r.offeringId,
      courseCode: r.offeringId ? (codeBy.get(r.offeringId) ?? null) : null,
      ground: r.ground as "MEDICAL",
      note: r.note,
      hasDocument: Boolean(r.documentFileId),
      documentFileId: r.documentFileId,
      status: r.status as "ASKED",
      percent: await percentFor(schoolId, r),
      floor: r.student.academicSeat?.programme.department.condoneFloorPercent ?? 65,
      createdAt: r.createdAt.toISOString(),
      decidedAt: (r.decidedAt ?? r.hodDecidedAt)?.toISOString() ?? null,
      decisionNote: r.decisionNote,
    });
  }
  return out;
}

/** The condonation desk: a student's own asks; an HOD's department's; what was forwarded to the principal; everything for the office (read). */
export async function listCondonations(ctx: ActiveContext, status: "OPEN" | "ALL" = "OPEN"): Promise<{ items: Condonation[]; canDecide: boolean }> {
  const c = await academicsCaller(ctx, ["STUDENT", "HOD", "PRINCIPAL", "ADMIN"]);
  return condonationsFor(c, status);
}

export async function condonationsFor(c: Caller, status: "OPEN" | "ALL"): Promise<{ items: Condonation[]; canDecide: boolean }> {
  let where: Record<string, unknown> = { schoolId: c.schoolId };
  if (c.role === "STUDENT") where = { ...where, studentMembershipId: c.membershipId };
  else if (c.role === "HOD") {
    const dept = await hodDepartment(c);
    where = { ...where, student: { academicSeat: { programme: { departmentId: dept?.id ?? "-" } } }, ...(status === "OPEN" ? { status: "ASKED" } : {}) };
  } else if (c.role === "PRINCIPAL") where = { ...where, ...(status === "OPEN" ? { status: "FORWARDED" } : {}) };
  else if (status === "OPEN") where = { ...where, status: { in: ["ASKED", "FORWARDED"] } };
  const rows = await db.attendanceCondonation.findMany({ where, select: CONDONATION_SELECT, orderBy: { createdAt: "desc" }, take: 200 });
  return { items: await condonationViews(c.schoolId, rows), canDecide: c.role === "HOD" || c.role === "PRINCIPAL" };
}

/** A student asks for their shortfall to be condoned, with a ground and (optionally) a document — a stored file of theirs or an upload ticket, spent here. */
export async function askCondonation(ctx: ActiveContext, input: { termId: string; offeringId: string | null; ground: string; note: string; documentFileId: string | null }, stored: { fileId?: string | null } = {}): Promise<Condonation> {
  const c = await academicsCaller(ctx, ["STUDENT"]);
  const term = await db.academicTerm.findFirst({ where: { id: input.termId, schoolId: c.schoolId }, select: { id: true, name: true } });
  if (!term) throw new RuleRefusal("academics.refuseUnknownTerm", 422, undefined, "termId");
  if (input.offeringId && !(await db.courseRegistration.findFirst({ where: { offeringId: input.offeringId, studentMembershipId: c.membershipId, termId: term.id, status: "REGISTERED" }, select: { id: true } }))) throw new RuleRefusal("academics.refuseNotRegistered", 422, undefined, "offeringId");
  const open = await db.attendanceCondonation.findFirst({ where: { studentMembershipId: c.membershipId, termId: term.id, offeringId: input.offeringId, status: { in: ["ASKED", "FORWARDED"] } }, select: { id: true } });
  if (open) throw new RuleRefusal("academics.refuseAlreadyAsked", 409);
  let documentFileId = stored.fileId ?? null;
  if (!documentFileId && input.documentFileId) {
    const spent = await db.uploadTicket.updateMany({ where: { fileId: input.documentFileId, userId: c.userId, consumedAt: null }, data: { consumedAt: new Date() } });
    if (spent.count === 0) throw new RuleRefusal("academics.refuseTicket", 422, undefined, "documentFileId");
    documentFileId = input.documentFileId;
  }
  const row = await db.attendanceCondonation.create({ data: { schoolId: c.schoolId, studentMembershipId: c.membershipId, termId: term.id, offeringId: input.offeringId, ground: input.ground, note: input.note, documentFileId }, select: CONDONATION_SELECT });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "academics.condonation.ask", targetType: "AttendanceCondonation", targetId: row.id, meta: { termId: term.id, offeringId: input.offeringId, ground: input.ground, document: Boolean(documentFileId) } });
  const dept = row.student.academicSeat?.programme.departmentId;
  const head = dept ? await db.department.findUnique({ where: { id: dept }, select: { hodMembershipId: true } }) : null;
  const hod = head?.hodMembershipId ? await db.membership.findUnique({ where: { id: head.hodMembershipId }, select: { userId: true } }) : null;
  if (hod) await notify({ userId: hod.userId, schoolId: c.schoolId, kind: "ATTENDANCE", titleKey: "academics.notifyCondonationAskTitle", bodyKey: "academics.notifyCondonationAskBody", bodyVars: { name: nameOf(row.student.user), term: term.name }, url: "/hod/condonations" });
  return (await condonationViews(c.schoolId, [row]))[0]!;
}

/**
 * The HOD decides an ask from their department: approves when the
 * percentage is at or above the department's floor, forwards to the
 * principal otherwise (or by choice), or refuses. The principal approves or
 * refuses what was forwarded. The student is told; every step is audited.
 */
export async function decideCondonation(ctx: ActiveContext, id: string, input: { decision: "APPROVE" | "FORWARD" | "REFUSE"; note: string }): Promise<Condonation> {
  const c = await academicsCaller(ctx, ["HOD", "PRINCIPAL"]);
  const row = await db.attendanceCondonation.findFirst({ where: { id, schoolId: c.schoolId }, select: CONDONATION_SELECT });
  if (!row) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  let next: string;
  const data: Record<string, unknown> = { decisionNote: input.note || null };
  if (c.role === "HOD") {
    const dept = await hodDepartment(c);
    if (!dept || row.student.academicSeat?.programme.departmentId !== dept.id) throw new AccessError("academics.refuseOtherDepartment");
    if (row.status !== "ASKED") throw new RuleRefusal("academics.refuseDecided", 409);
    if (input.decision === "APPROVE") {
      const percent = await percentFor(c.schoolId, row);
      if (percent !== null && percent < dept.condoneFloorPercent) throw new RuleRefusal("academics.refuseBelowFloor", 409, { floor: dept.condoneFloorPercent });
      next = "HOD_APPROVED";
    } else next = input.decision === "FORWARD" ? "FORWARDED" : "REFUSED";
    Object.assign(data, { hodDecidedByUserId: c.userId, hodDecidedAt: new Date() }, next === "FORWARDED" ? {} : { decidedByUserId: c.userId, decidedAt: new Date() });
  } else {
    if (row.status !== "FORWARDED") throw new RuleRefusal("academics.refuseDecided", 409);
    if (input.decision === "FORWARD") throw new RuleRefusal("academics.refuseDecided", 409);
    next = input.decision === "APPROVE" ? "PRINCIPAL_APPROVED" : "REFUSED";
    Object.assign(data, { decidedByUserId: c.userId, decidedAt: new Date() });
  }
  const moved = await db.attendanceCondonation.updateMany({ where: { id, status: row.status }, data: { ...data, status: next } });
  if (!moved.count) throw new RuleRefusal("academics.refuseDecided", 409);
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: `academics.condonation.${next === "FORWARDED" ? "forward" : next === "REFUSED" ? "refuse" : "approve"}`, targetType: "AttendanceCondonation", targetId: id, meta: { by: c.role, status: next } });
  const vars = { term: row.term.name };
  if (next === "FORWARDED") {
    const principals = await db.membership.findMany({ where: { schoolId: c.schoolId, role: "PRINCIPAL", status: "ACTIVE" }, select: { userId: true } });
    for (const p of principals) await notify({ userId: p.userId, schoolId: c.schoolId, kind: "ATTENDANCE", titleKey: "academics.notifyCondonationForwardTitle", bodyKey: "academics.notifyCondonationAskBody", bodyVars: { name: nameOf(row.student.user), term: row.term.name }, url: "/admin/academics/condonations" });
  }
  const studentKey = next === "FORWARDED" ? "academics.notifyCondonationForwarded" : next === "REFUSED" ? "academics.notifyCondonationRefused" : "academics.notifyCondonationApproved";
  await notify({ userId: row.student.userId, schoolId: c.schoolId, kind: "ATTENDANCE", titleKey: studentKey, titleVars: vars, bodyKey: "academics.notifyCondonationBody", bodyVars: vars, url: "/student/academics" });
  const fresh = await db.attendanceCondonation.findUniqueOrThrow({ where: { id }, select: CONDONATION_SELECT });
  return (await condonationViews(c.schoolId, [fresh]))[0]!;
}


/**
 * A DAY'S LECTURES BY DEPARTMENT (the principal's college at a glance and the
 * operator's health view, 4 Oct 2026, the integration builder): for each
 * department, the lectures on the timetable that day (made from the timetable
 * on first read, as everywhere else here), how many were marked, and the
 * present and absent marks across them. Computed on read; plain client — the
 * caller has already bound the person and the college.
 */
export async function lectureDayByDepartment(schoolId: string, dateKey: string): Promise<{ departmentId: string; name: string; lectures: number; marked: number; present: number; absent: number; presentPercent: number | null }[]> {
  await ensureLecturesForDay(schoolId, dateKey);
  const [departments, lectures] = await Promise.all([
    db.department.findMany({ where: { schoolId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.lecture.findMany({
      where: { schoolId, dateKey, cancelledAt: null },
      select: { offering: { select: { course: { select: { scheme: { select: { programme: { select: { departmentId: true } } } } } } } }, attendance: { select: { status: true } } },
    }),
  ]);
  const by = new Map(departments.map((d) => [d.id, { departmentId: d.id, name: d.name, lectures: 0, marked: 0, present: 0, absent: 0 }]));
  for (const l of lectures) {
    const row = by.get(l.offering.course.scheme.programme.departmentId);
    if (!row) continue;
    row.lectures += 1;
    if (l.attendance.length > 0) row.marked += 1;
    for (const a of l.attendance) {
      if (a.status === "ABSENT") row.absent += 1;
      else row.present += 1;
    }
  }
  return [...by.values()].map((r) => ({ ...r, presentPercent: r.present + r.absent > 0 ? Math.round((r.present / (r.present + r.absent)) * 1000) / 10 : null }));
}
