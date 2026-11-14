import "server-only";
import { fixtureTopicsWhere, schoolSeesFixtureTopics } from "../quiz-fixtures";
import { practiceTopicsWhereFor } from "../practice-audience"; // college-content (12 Oct 2026)
import type {
  AttendanceClasses,
  MarksGridBody,
  PrincipalClasses,
  PrincipalOverview,
  PrincipalTimetable,
  RegisterBody,
  StaffAssignments,
  StaffClassDetail,
  StaffClasses,
  StaffExamSheets,
  StaffExams,
  StaffExperts,
  StaffLeave,
  StaffMeetings,
  StaffPractice,
  StaffProfile,
  StaffTimetable,
  StaffToday,
} from "@edulink/contracts";
import { db } from "@/lib/db";
import type { ActiveContext } from "@/lib/session";
import type { Role } from "@/lib/constants";
import { AccessError, assertClassAccess, formClassIds, teachesClass } from "@/lib/tenancy";
import { classReach, inGradeOrder, offeredSubjects, workInReach } from "@/lib/teaching-reach";
import { addDaysToKey, todayKey, weekdayOfKey } from "@/lib/dates";
import { myCovers } from "@/lib/substitutions";
import { closedOn, schoolDayOn } from "@/lib/holidays";
import { assertClassAccessForRegister, classesIMayTake, registerClosedFor, registerDuty } from "@/lib/register-duty";
import { getAttendanceSummary, getRegister, TAKEN_BY_A_PERSON } from "@/lib/attendance";
import { EXAM_CATEGORY, dateSheetsFor, examClassesFor, marksGrid, marksTodoFor } from "@/lib/exams";
import { WEIGHT_SCALE, listGradeCategories, saveGradeCategories, weightsAreUsable } from "@/lib/grading";
import { currentAcademicYear } from "@/lib/academic-year";
import { classWeek, teacherWeek, timetableClasses, weekStartKey } from "@/lib/timetable";
import { normaliseLanguage } from "@/lib/quiz";
import { assignmentsForClass, classGapAlerts, classPracticeHeatmap, classWeekly } from "@/lib/practice-insights";
import { teacherSlots } from "@/lib/meetings";
import { COVER_ROLES, myLeave } from "@/lib/leave";
import { leaveDecidedBy } from "@edulink/contracts";
import { leaveBalanceFor, staffRecordFor } from "@/lib/staff-records";
import { schoolReviewDashboard, teacherReviewAggregate } from "@/lib/reviews";
import { mayEditOwnBirthdate, setOwnBirthdate } from "@/lib/birthdate";
import { readJsonArray } from "@/lib/json";
import { audit } from "@/lib/audit";
import { AVATAR_PRESETS } from "@/components/ui/avatar";
import { listBookings, listMarketplace } from "@/lib/experts";
import { EXPERT_OFFERING_META } from "@/lib/constants";
import { ATTENDANCE_CONCERN_PERCENT, classInsights, parseSpan, schoolSummary, windowFor } from "@/lib/insights";
import { currentTerms } from "@/lib/terms";
import { syllabusCoverage } from "@/lib/syllabus";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The staff pages' reads, for /api/v1/staff.
 *
 * Each function reproduces ONE page's data path — the same lib calls, the
 * same inline queries, the same access checks in the same order — and hands
 * back the shape the page renders, as plain JSON-ready values. Where a page
 * calls a lib function directly the handler calls it too; what lives here is
 * the glue a page.tsx used to hold inline.
 */

type Staff = ActiveContext & { role: Role; schoolId: string; membershipId: string };

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

async function schoolZone(schoolId: string): Promise<{ timezone: string; name: string }> {
  return db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true, name: true } });
}


/* ------------------------------------------------------------------------- */
/* /teacher                                                                   */
/* ------------------------------------------------------------------------- */

export async function staffToday(ctx: Staff, now: Date = new Date()): Promise<StaffToday> {
  const school = await schoolZone(ctx.schoolId);
  const dateKey = todayKey(school.timezone, now);

  const marksTodo = await marksTodoFor(ctx, dateKey);
  // Form classes only: the block below is registers left and the form class's work. A class the
  // timetable sends this teacher to is in their lessons above and on Classes (owner's item 1).
  const classIds = await formClassIds(ctx.schoolId, ctx.membershipId);

  const week = await teacherWeek(ctx, ctx.membershipId, { weekOf: dateKey, todayKey: dateKey });
  const weekday = weekdayOfKey(dateKey);
  const today = week.days.find((day) => day.weekday === weekday);
  const closed = today?.closed ?? false;
  const periodOrder = new Map(week.periods.map((period) => [period.id, period]));
  const lessons = closed
    ? []
    : week.slots
        .filter((slot) => slot.weekday === weekday)
        .sort((a, b) => (periodOrder.get(a.periodId)?.position ?? 0) - (periodOrder.get(b.periodId)?.position ?? 0));

  const lessonsBlock: StaffToday["lessons"] = {
    closed,
    closedName: today?.closedName ?? null,
    items: lessons.map((slot) => {
      const period = periodOrder.get(slot.periodId);
      return {
        slotId: slot.id,
        periodId: slot.periodId,
        periodName: period?.name ?? null,
        startMinute: period?.startMinute ?? null,
        endMinute: period?.endMinute ?? null,
        subject: slot.subject,
        classId: slot.classId,
        className: slot.className,
        room: slot.room,
        borrowed: slot.borrowed,
      };
    }),
    coveringToday: lessons.filter((slot) => slot.borrowed).length,
    classesTaughtThisWeek: new Set(week.slots.map((slot) => slot.classId)).size,
  };

  const covers = (await myCovers(ctx, dateKey)).items.map((c) => ({ slotId: c.slotId, periodName: c.periodName, startMinute: c.startMinute, endMinute: c.endMinute, subject: c.subject, classId: c.classId, className: c.className, room: c.room, absentName: c.absentName, note: c.note }));
  // A Sunday or a closing holiday is no school, not "every register taken" (B-11).
  const day = await schoolDayOn(ctx.schoolId, dateKey);
  const noSchool = day.open ? null : { holidayName: day.holidayName };
  const base = { dateKey, schoolName: school.name, noSchool, marksTodo: marksTodo.map((row) => ({ ...row })), lessons: lessonsBlock, covers };
  if (classIds.length === 0) return { ...base, formClasses: null };

  const [classes, sessionsToday, dueSoon, ungraded] = await Promise.all([
    db.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, color: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
    }),
    db.attendanceSession.findMany({ where: { schoolId: ctx.schoolId, dateKey, classId: { in: classIds }, ...TAKEN_BY_A_PERSON }, select: { classId: true } }),
    db.assignment.findMany({
      where: { schoolId: ctx.schoolId, classId: { in: classIds }, publishedAt: { not: null }, dueAt: { gte: now } },
      select: { id: true, title: true, dueAt: true, class: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 4,
    }),
    db.submission.count({ where: { schoolId: ctx.schoolId, status: "SUBMITTED", assignment: { classId: { in: classIds } } } }),
  ]);
  const done = new Set(sessionsToday.map((s) => s.classId));
  return {
    ...base,
    formClasses: {
      classes: classes.map((k) => ({ id: k.id, name: k.name, color: k.color, students: k._count.enrollments, registerTaken: done.has(k.id) })),
      registersLeft: noSchool ? 0 : classes.filter((k) => !done.has(k.id)).length,
      toGrade: ungraded,
      dueSoon: dueSoon.map((a) => ({ id: a.id, title: a.title, dueAt: iso(a.dueAt), className: a.class?.name ?? "" })),
    },
  };
}

/* ------------------------------------------------------------------------- */
/* /teacher/attendance                                                        */
/* ------------------------------------------------------------------------- */

async function calendarNotice(schoolId: string, dateKey: string) {
  const calendar = await closedOn(schoolId, dateKey);
  return { closed: calendar.closed, entries: calendar.entries, nonTeachingDay: !calendar.teachingDay };
}

export async function attendanceClasses(ctx: Staff, date?: string): Promise<AttendanceClasses> {
  const school = await schoolZone(ctx.schoolId);
  const today = todayKey(school.timezone);
  const dateKey = date ?? today;
  const [calendar, classIds] = await Promise.all([calendarNotice(ctx.schoolId, dateKey), classesIMayTake(ctx, dateKey)]);
  if (classIds.length === 0) return { dateKey, today, calendar, classes: [], unmarkedCount: 0 };

  const [classes, taken] = await Promise.all([
    db.class.findMany({
      where: { id: { in: classIds }, schoolId: ctx.schoolId },
      select: { id: true, name: true, subject: true, color: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
    }),
    db.attendanceSession.findMany({ where: { schoolId: ctx.schoolId, dateKey, classId: { in: classIds }, ...TAKEN_BY_A_PERSON }, select: { classId: true } }),
  ]);
  const takenSet = new Set(taken.map((t) => t.classId));
  const rows = classes.map((k) => ({ id: k.id, name: k.name, subject: k.subject, color: k.color, students: k._count.enrollments, taken: takenSet.has(k.id) }));
  return { dateKey, today, calendar, classes: rows, unmarkedCount: rows.filter((k) => !k.taken).length };
}

/**
 * The register, the way the page and /api/attendance GET open it: the duty
 * first ("am I down to mark it?"), then the tenant boundary drawn so a cover
 * row counts for the teacher it names.
 */
export async function registerFor(ctx: Staff, classId: string, date?: string): Promise<RegisterBody> {
  const school = await schoolZone(ctx.schoolId);
  const today = todayKey(school.timezone);
  const dateKey = date ?? today;
  const duty = await registerDuty(ctx, classId, dateKey);
  if (!duty.may) {
    // The same line assertClassAccess draws for /api/attendance: a teacher
    // with no ClassTeacher row for this class gets 404 whether or not the
    // class exists at their school, so an id cannot be probed for existence;
    // only a teacher attached to the class, whose duty is off today, or the
    // office, is told "not yours".
    const attached =
      ctx.role === "ADMIN"
        ? await db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId }, select: { id: true } })
        : await db.classTeacher.findFirst({ where: { classId, schoolId: ctx.schoolId, teacherMembershipId: ctx.membershipId }, select: { id: true } });
    if (!attached) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
    throw new AccessError("access.notYourRegister");
  }
  await assertClassAccessForRegister(ctx, classId, duty);
  const register = await getRegister(ctx.schoolId, classId, dateKey);
  if (!register) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
  return {
    class: register.class,
    dateKey,
    roster: register.roster,
    finalizedAt: iso(register.finalizedAt),
    takenAt: iso(register.takenAt),
    duty: { reason: duty.reason as "ADMIN" | "COVER" | "CLASS_TEACHER", coverUntil: duty.coverUntil ?? null },
    readOnly: dateKey > today,
    // Past its correction window for a class teacher or cover (TA-285): drawn read-only, with the closing sentence.
    closed: registerClosedFor(duty, dateKey, today),
    calendar: await calendarNotice(ctx.schoolId, dateKey),
  };
}

/* ------------------------------------------------------------------------- */
/* /teacher/classes                                                           */
/* ------------------------------------------------------------------------- */

export async function staffClasses(ctx: Staff): Promise<StaffClasses> {
  // A teacher's form classes and the classes the timetable sends them to (owner's item 1, 27 Oct 2026).
  const reach = await classReach(ctx);
  const classIds = [...reach.keys()];
  if (classIds.length === 0) return { classes: [], students: 0 };
  const school = await schoolZone(ctx.schoolId);
  const dateKey = todayKey(school.timezone);
  const [classRowsByName, takenToday] = await Promise.all([
    db.class.findMany({
      where: { id: { in: classIds } },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        subject: true,
        room: true,
        color: true,
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.attendanceSession.findMany({ where: { schoolId: ctx.schoolId, dateKey, classId: { in: classIds }, ...TAKEN_BY_A_PERSON }, select: { classId: true } }),
  ]);
  const classes = inGradeOrder(classRowsByName);
  // The work counted is the work this person may open: all of a form class's, their own elsewhere.
  const work = await db.assignment.groupBy({ by: ["classId"], where: { schoolId: ctx.schoolId, ...workInReach(ctx.membershipId, reach) }, _count: { _all: true } });
  const workBy = new Map(work.map((w) => [w.classId, w._count._all]));
  const done = new Set(takenToday.map((s) => s.classId));
  return {
    classes: classes.map((k) => ({
      id: k.id,
      name: k.name,
      subject: k.subject,
      room: k.room,
      color: k.color,
      students: k._count.enrollments,
      assignments: workBy.get(k.id) ?? 0,
      registerTaken: done.has(k.id),
      ...(ctx.role === "ADMIN" ? {} : { formTeacher: reach.get(k.id)?.formTeacher ?? true }),
      subjects: reach.get(k.id)?.subjects ?? [],
    })),
    students: classes.reduce((sum, k) => sum + k._count.enrollments, 0),
  };
}

const RANGE_DAYS = 28;

export async function staffClassDetail(ctx: Staff, classId: string): Promise<StaffClassDetail> {
  // A class in another school, or one this teacher does not teach (no ClassTeacher row and no lesson
  // on the timetable), is a 404.
  const klass = await assertClassAccess(ctx, classId);
  const teaching = (await teachesClass(ctx, classId)) ?? { formTeacher: true, subjects: [] };
  // A teacher the timetable sends here sees the work they set, not the rest of the class's (owner's item 1).
  const mine = teaching.formTeacher ? {} : { authorMembershipId: ctx.membershipId };
  const school = await schoolZone(ctx.schoolId);
  const today = todayKey(school.timezone);
  const from = addDaysToKey(today, -RANGE_DAYS);

  const [enrollments, todaySession, assignments, ungraded] = await Promise.all([
    db.enrollment.findMany({
      where: { classId, status: "ACTIVE" },
      include: {
        student: {
          include: {
            user: { select: { name: true, preferredName: true, avatarKey: true } },
            guardianships: { where: { status: "ACTIVE" }, select: { id: true } },
          },
        },
      },
    }),
    db.attendanceSession.findUnique({ where: { classId_dateKey: { classId, dateKey: today } }, select: { takenAt: true, takenByMembershipId: true, _count: { select: { records: true } } } }),
    db.assignment.findMany({
      where: { classId, schoolId: ctx.schoolId, ...mine },
      select: { id: true, title: true, dueAt: true, publishedAt: true, _count: { select: { grades: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    db.submission.count({ where: { schoolId: ctx.schoolId, status: "SUBMITTED", assignment: { classId, ...mine } } }),
  ]);

  const roster = await Promise.all(
    enrollments.map(async (enrollment) => {
      const summary = await getAttendanceSummary(ctx.schoolId, enrollment.studentMembershipId, from, today);
      return {
        membershipId: enrollment.studentMembershipId,
        name: enrollment.student.user.preferredName ?? enrollment.student.user.name,
        fullName: enrollment.student.user.name,
        avatarKey: enrollment.student.user.avatarKey,
        percent: summary.percent,
        absences: summary.counts.ABSENT,
        hasGuardian: enrollment.student.guardianships.length > 0,
      };
    }),
  );
  roster.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const [weights, usedCategories] = await Promise.all([
    listGradeCategories(ctx, classId),
    db.assignment.findMany({ where: { classId, schoolId: ctx.schoolId, category: { not: null } }, select: { category: true }, distinct: ["category"] }),
  ]);

  return {
    class: {
      id: klass.id,
      name: klass.name,
      subject: klass.subject,
      gradeLevel: klass.gradeLevel,
      room: klass.room,
      color: klass.color,
      // The code lets a pupil join the class: the form teacher's and the office's to hand out, never a teacher the
      // timetable alone sends here (qb-B, QB-02 of the QA pass of 31 October 2026; item 1's decision 2).
      joinCode: teaching.formTeacher ? klass.joinCode : null,
      archived: klass.archivedAt !== null,
    },
    today: { dateKey: today, registerTakenAt: todaySession?.takenByMembershipId ? iso(todaySession.takenAt) : null /* a device's start is not a taking (TA-032) */, recordsToday: todaySession?._count.records ?? 0 },
    roster,
    ofConcern: roster.filter((r) => r.percent !== null && r.percent < 90).length,
    withoutGuardian: roster.filter((r) => !r.hasGuardian).length,
    toGrade: ungraded,
    recentAssignments: assignments.map((a) => ({ id: a.id, title: a.title, dueAt: iso(a.dueAt), publishedAt: iso(a.publishedAt), graded: a._count.grades })),
    weights,
    categoriesInUse: usedCategories
      .map((a) => a.category!)
      .filter((c) => c.trim().length > 0)
      .sort(),
    formTeacher: teaching.formTeacher,
    subjects: teaching.subjects,
  };
}

/** Percentages in, basis points to the lib — the same boundary the form's action draws. */
export async function saveClassWeights(ctx: Staff, classId: string, rows: { name: string; percent: number }[]): Promise<void> {
  const categories = rows
    .filter((r) => r.name.trim().length > 0)
    .map((r) => ({ name: r.name, weightBps: Math.round((r.percent * WEIGHT_SCALE) / 100) }));
  await saveGradeCategories(ctx, classId, categories);
}

/* ------------------------------------------------------------------------- */
/* /teacher/assignments                                                       */
/* ------------------------------------------------------------------------- */

export async function staffAssignments(
  ctx: Staff,
  query: { years?: "all"; classId?: string; state?: "tomark" | "draft" | "overdue" },
): Promise<StaffAssignments> {
  // A teacher's form classes and the classes the timetable sends them to; in the latter, their own work
  // only (owner's item 1, 27 Oct 2026). The office: every living class.
  const reach = await classReach(ctx);
  const classIds = [...reach.keys()];
  const empty = { year: null, showingAllYears: true, classOptions: [], filters: { classId: null, state: null }, total: 0, assignments: [] };
  if (classIds.length === 0) return empty;

  const year = await currentAcademicYear(ctx.schoolId);
  const thisYear = year ? { createdAt: { gte: year.startDate, lte: new Date(year.endDate.getTime() + 86_400_000) } } : {};
  const showAll = query.years === "all" || !year;
  const baseWhere = { schoolId: ctx.schoolId, ...workInReach(ctx.membershipId, reach) };
  const [thisYearCount, allCount] = await Promise.all([
    db.assignment.count({ where: { ...baseWhere, ...thisYear } }),
    db.assignment.count({ where: baseWhere }),
  ]);

  const classFilter = query.classId && classIds.includes(query.classId) ? query.classId : null;
  const state = query.state ?? null;
  const classRows = inGradeOrder(await db.class.findMany({ where: { id: { in: classIds }, archivedAt: null }, select: { id: true, name: true, gradeLevel: true }, orderBy: { name: "asc" } }));
  const offered = await offeredSubjects(ctx.schoolId, reach, classRows.map((k) => k.id));
  // Each class says whether it is the person's form class or which subjects they take there, and what a new piece of work may name.
  // `formTeacher` is a teacher's: the office reaches every class whole and is no class's form teacher.
  const classOptions = classRows.map((k) => ({ id: k.id, name: k.name, ...(ctx.role === "ADMIN" ? {} : { formTeacher: reach.get(k.id)?.formTeacher ?? true }), subjects: offered.get(k.id) ?? [] }));

  const now = new Date();
  const fetched = await db.assignment.findMany({
    where: {
      ...baseWhere,
      ...(showAll ? {} : thisYear),
      ...(classFilter ? { classId: classFilter } : {}),
      ...(state === "draft" ? { publishedAt: null } : {}),
      ...(state === "tomark" ? { submissions: { some: { status: "SUBMITTED", grade: { is: null } } } } : {}),
      ...(state === "overdue" ? { dueAt: { lt: now } } : {}),
    },
    include: {
      class: { select: { id: true, name: true, color: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } },
      _count: { select: { submissions: true, grades: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  // Every row is a class's (the WHERE names the caller's classes); a college offering's work (R-48) has its own doors.
  const assignments = fetched.flatMap((a) => (a.class ? [{ ...a, class: a.class }] : [])).filter((a) => (state === "overdue" ? a._count.grades < a.class._count.enrollments : true));

  return {
    year: year ? { name: year.name, thisYearCount, allCount } : null,
    showingAllYears: showAll,
    classOptions,
    filters: { classId: classFilter, state },
    total: showAll ? allCount : thisYearCount,
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      subject: a.subject,
      pointsMilli: a.pointsMilli,
      dueAt: iso(a.dueAt),
      publishedAt: iso(a.publishedAt),
      createdAt: a.createdAt.toISOString(),
      class: { id: a.class.id, name: a.class.name, color: a.class.color, students: a.class._count.enrollments },
      submissions: a._count.submissions,
      graded: a._count.grades,
    })),
  };
}

/* ------------------------------------------------------------------------- */
/* /teacher/exams and /exams                                                  */
/* ------------------------------------------------------------------------- */

export async function staffExams(ctx: Staff): Promise<StaffExams> {
  const classes = await examClassesFor(ctx);
  return {
    classes: classes.map((k) => ({
      id: k.id,
      name: k.name,
      gradeLevel: k.gradeLevel,
      series: k.series.map((s) => ({
        id: s.id,
        name: s.name,
        kind: s.kind,
        publishedAt: iso(s.publishedAt),
        slots: s.slots.map((slot) => ({
          id: slot.id,
          subject: slot.subject,
          dateKey: slot.dateKey,
          startMinute: slot.startMinute,
          endMinute: slot.endMinute,
          maxMarks: slot.pointsMilli / 1000,
        })),
      })),
    })),
  };
}

/**
 * The grid for one class and one paper. With no paper named the first one
 * self-selects, as the page does; a class this person may not mark for reads
 * as not found, the same as one in another school.
 */
export async function staffMarksGrid(ctx: Staff, classId: string, slotId?: string): Promise<MarksGridBody> {
  const classes = await examClassesFor(ctx);
  const klass = classes.find((c) => c.id === classId);
  if (!klass) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
  const slots = klass.series.flatMap((s) => s.slots);
  const slot = slotId ? slots.find((s) => s.id === slotId) : slots[0];
  if (slotId && !slot) throw new AccessError("access.examNotFound", "NOT_FOUND");
  if (!slot) return { classId, slotId: null, grid: null, examUnweighted: false, version: null };

  // Taken BEFORE the marks are read (TA-010): a mark written after it is one this sheet may not have shown, and a save based on it leaves that mark alone.
  const version = new Date().toISOString();
  const grid = await marksGrid(ctx, slot.id, classId);
  const weights = await listGradeCategories(ctx, classId);
  const examUnweighted = weightsAreUsable(weights) && !weights.some((w) => w.name === EXAM_CATEGORY && w.weightBps > 0);
  return { classId, slotId: slot.id, grid, examUnweighted, version };
}

export async function staffExamSheets(ctx: Staff): Promise<StaffExamSheets> {
  const [sheets, classes] = await Promise.all([
    dateSheetsFor(ctx),
    db.class.findMany({
      where: {
        schoolId: ctx.schoolId,
        archivedAt: null,
        ...(ctx.role === "TEACHER" ? { teachers: { some: { teacherMembershipId: ctx.membershipId } } } : {}),
      },
      select: { id: true, name: true, _count: { select: { reportCards: { where: { status: "PUBLISHED" } } } } },
      orderBy: { name: "asc" },
    }),
  ]);
  return { sheets, classes: classes.map((k) => ({ id: k.id, name: k.name, publishedCards: k._count.reportCards })) };
}

/* ------------------------------------------------------------------------- */
/* /timetable and /principal/timetable                                        */
/* ------------------------------------------------------------------------- */

export async function staffTimetable(ctx: Staff, week?: string): Promise<StaffTimetable> {
  const school = await schoolZone(ctx.schoolId);
  const today = todayKey(school.timezone);
  const monday = weekStartKey(week ?? today);
  const grid = await teacherWeek(ctx, ctx.membershipId, { weekOf: monday, todayKey: today });
  return { weekOf: monday, today, isThisWeek: monday === weekStartKey(today), grid: plainGrid(grid) };
}

function plainGrid(grid: Awaited<ReturnType<typeof teacherWeek>>) {
  return {
    periods: grid.periods.map(({ id, name, startMinute, endMinute, kind, position }) => ({ id, name, startMinute, endMinute, kind, position })),
    days: grid.days,
    slots: grid.slots,
  };
}

export async function principalTimetable(ctx: Staff, week?: string, classId?: string): Promise<PrincipalTimetable> {
  const [school, classes] = await Promise.all([schoolZone(ctx.schoolId), timetableClasses(ctx)]);
  const today = todayKey(school.timezone);
  const monday = weekStartKey(week ?? today);
  // The page falls back to the first class for an id it does not know; a
  // client naming one must hear that it is not here rather than get another.
  const selected = classId ? (classes.find((k) => k.id === classId) ?? null) : (classes[0] ?? null);
  if (classId && !selected) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
  const grid = selected ? await classWeek(ctx, selected.id, { weekOf: monday, todayKey: today }) : null;
  return {
    weekOf: monday,
    today,
    isThisWeek: monday === weekStartKey(today),
    classes,
    selectedClassId: selected?.id ?? null,
    grid: grid ? plainGrid(grid) : null,
    gaps: grid?.slots.filter((slot) => slot.uncovered).length ?? 0,
    unstaffed: grid?.slots.filter((slot) => !slot.teacherMembershipId).length ?? 0,
  };
}

/* ------------------------------------------------------------------------- */
/* /teacher/practice                                                          */
/* ------------------------------------------------------------------------- */

export async function staffPractice(ctx: Staff, classId?: string): Promise<StaffPractice> {
  const classes = await db.class.findMany({
    where: { schoolId: ctx.schoolId, archivedAt: null, teachers: { some: { teacherMembershipId: ctx.membershipId } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, gradeLevel: true },
  });
  const empty = { classes, selectedClassId: null, heatmap: null, assignments: [], weekly: null, gaps: [], topicOptions: [] };
  if (classes.length === 0) return empty;
  const selected = classes.find((c) => c.id === classId) ?? classes[0]!;
  if (classId && selected.id !== classId) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");

  const language = normaliseLanguage(ctx.user.prefs.locale);
  const [heatmap, assignments, weekly, gaps] = await Promise.all([
    classPracticeHeatmap(ctx, selected.id, language),
    assignmentsForClass(ctx, selected.id, language),
    classWeekly(ctx, selected.id),
    classGapAlerts(ctx, selected.id, language),
  ]);
  const grade = Number.parseInt(selected.gradeLevel ?? "", 10);
  const topicOptions = await db.quizTopic.findMany({
    // college-content (12 Oct 2026): only the chapters the school or college lists (practice-audience.ts).
    where: { ...(Number.isInteger(grade) ? { classLevel: grade } : {}), AND: [fixtureTopicsWhere(await schoolSeesFixtureTopics(ctx.schoolId)), await practiceTopicsWhereFor(ctx.schoolId)] },
    orderBy: [{ classLevel: "asc" }, { subject: "asc" }, { position: "asc" }],
    select: { slug: true, name: true, subject: true, classLevel: true },
  });
  return {
    classes,
    selectedClassId: selected.id,
    heatmap,
    assignments: assignments.map((a) => ({ ...a, dueAt: iso(a.dueAt), createdAt: a.createdAt.toISOString() })),
    weekly,
    gaps,
    topicOptions,
  };
}

/* ------------------------------------------------------------------------- */
/* /teacher/meetings                                                          */
/* ------------------------------------------------------------------------- */

export async function staffMeetings(ctx: Staff): Promise<StaffMeetings> {
  const [slots, school] = await Promise.all([teacherSlots(ctx), schoolZone(ctx.schoolId)]);
  return {
    timezone: school.timezone,
    slots: slots.map((s) => ({ ...s, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString() })),
  };
}

/* ------------------------------------------------------------------------- */
/* /teacher/leave                                                             */
/* ------------------------------------------------------------------------- */

export async function staffLeave(ctx: Staff): Promise<StaffLeave> {
  const school = await schoolZone(ctx.schoolId);
  const [requests, staff, balance, principals] = await Promise.all([
    myLeave(ctx),
    db.membership.findMany({
      where: { schoolId: ctx.schoolId, role: { in: [...COVER_ROLES] }, status: "ACTIVE", leftAt: null, id: { not: ctx.membershipId } },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    leaveBalanceFor(ctx.schoolId, ctx.membershipId),
    // Who answers (G4-27): applyForLeave tells every active PRINCIPAL and ADMIN; the form names the principal only where there is one.
    db.membership.count({ where: { schoolId: ctx.schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null, id: { not: ctx.membershipId } } }),
  ]);
  return {
    today: todayKey(school.timezone),
    balance,
    requests: requests.map((r) => ({ ...r, decidedAt: iso(r.decidedAt) })),
    staff: staff.map((p) => ({ membershipId: p.id, name: p.user.preferredName ?? p.user.name })),
    decidedBy: leaveDecidedBy(ctx.role, principals > 0),
  };
}

/* ------------------------------------------------------------------------- */
/* /teacher/profile                                                           */
/* ------------------------------------------------------------------------- */

export async function staffProfile(ctx: Staff): Promise<StaffProfile> {
  const membership = await db.membership.findUniqueOrThrow({
    where: { id: ctx.membershipId },
    include: {
      user: { select: { name: true, preferredName: true, bio: true, avatarKey: true, email: true, birthdate: true } },
      school: { select: { name: true } },
      classTeachers: { include: { class: { select: { id: true, name: true } } } },
    },
  });
  const classIds = membership.classTeachers.map((row) => row.classId);
  const pupilsTaught =
    classIds.length > 0
      ? await db.enrollment
          .findMany({ where: { classId: { in: classIds }, status: "ACTIVE" }, select: { studentMembershipId: true }, distinct: ["studentMembershipId"] })
          .then((rows) => rows.length)
      : 0;
  const [agg, record, balance, birthdateEditable] = await Promise.all([
    teacherReviewAggregate(ctx, ctx.membershipId),
    staffRecordFor(ctx, ctx.membershipId),
    leaveBalanceFor(ctx.schoolId, ctx.membershipId),
    mayEditOwnBirthdate(ctx),
  ]);
  return {
    schoolName: membership.school.name,
    title: membership.title,
    classes: membership.classTeachers.map((row) => ({ id: row.class.id, name: row.class.name })),
    pupilsTaught,
    sinceYear: membership.joinedAt.getFullYear(),
    subjects: readJsonArray<string>(membership.subjects),
    user: {
      name: membership.user.name,
      preferredName: membership.user.preferredName,
      bio: membership.user.bio,
      avatarKey: membership.user.avatarKey,
      email: membership.user.email,
      birthdate: membership.user.birthdate?.toISOString().slice(0, 10) ?? null,
      birthdateEditable,
    },
    reviews: { responseCount: agg.responseCount, byQuestion: agg.byQuestion as Record<string, number>, overall: agg.overall },
    record: record
      ? {
          staffNumber: record.staffNumber,
          designation: record.designation,
          qualification: record.qualification,
          joinedOnKey: record.joinedOnKey,
          birthdateKey: record.birthdateKey,
          serviceJoinedOnKey: record.serviceJoinedOnKey,
          leaveDaysPerYear: record.leaveDaysPerYear,
          gender: record.gender,
          socialCategory: record.socialCategory,
          academicQualification: record.academicQualification,
          professionalQualification: record.professionalQualification,
          appointmentType: record.appointmentType,
          appointedSubject: record.appointedSubject,
        }
      : null,
    balance,
  };
}

/**
 * A teacher editing their own profile — the same rules as the form's action
 * (student/profile/actions.ts), for the one role this area serves: scoped to
 * the signed-in user, the avatar checked against the preset list, the legal
 * name never touched, the birthdate through its own rule. Returns the field
 * errors as translation keys; the handler puts them in the caller's language.
 */
export async function saveStaffProfile(
  ctx: Staff,
  input: { preferredName: string; bio: string; avatarKey: string; birthdate?: string },
): Promise<{ ok: true } | { ok: false; issues: Partial<Record<"preferredName" | "bio" | "avatarKey" | "birthdate", TranslationKey>> }> {
  const issues: Partial<Record<"preferredName" | "bio" | "avatarKey" | "birthdate", TranslationKey>> = {};
  const preferredName = input.preferredName.trim();
  const bio = input.bio.trim();
  if (!AVATAR_PRESETS.includes(input.avatarKey)) issues.avatarKey = "common.checkTheForm";

  if (typeof input.birthdate === "string") {
    const current = await db.user.findUniqueOrThrow({ where: { id: ctx.user.id }, select: { birthdate: true } });
    const before = current.birthdate?.toISOString().slice(0, 10) ?? "";
    if (input.birthdate !== before) {
      const result = await setOwnBirthdate(ctx, input.birthdate);
      if (!result.ok) issues.birthdate = result.errorKey;
    }
  }
  if (Object.keys(issues).length > 0) return { ok: false, issues };

  await db.user.update({
    where: { id: ctx.user.id },
    data: { preferredName: preferredName || null, bio: bio || null, avatarKey: input.avatarKey },
  });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "profile.update", targetType: "User", targetId: ctx.user.id });
  return { ok: true };
}

/* ------------------------------------------------------------------------- */
/* /experts                                                                   */
/* ------------------------------------------------------------------------- */

export async function staffExperts(ctx: Staff, query: { q?: string; offering?: string; specialism?: string }): Promise<StaffExperts> {
  const [allExperts, bookings] = await Promise.all([listMarketplace(ctx), listBookings(ctx)]);
  const specialisms = [...new Set(allExperts.flatMap((e) => e.specialisms))].sort();
  const offering = query.offering && Object.hasOwn(EXPERT_OFFERING_META, query.offering) ? query.offering : null;
  const specialism = query.specialism && specialisms.includes(query.specialism) ? query.specialism : null;
  const needle = (query.q ?? "").trim().toLowerCase();
  const experts = allExperts.filter(
    (e) =>
      (!offering || e.offering === offering) &&
      (!specialism || e.specialisms.includes(specialism)) &&
      (!needle || [e.name, e.headline, e.organisation ?? ""].join(" ").toLowerCase().includes(needle)),
  );
  return {
    specialisms,
    experts: experts.map((e) => ({
      ...e,
      openSlots: e.openSlots.map((s) => ({ ...s, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString() })),
    })),
    bookings: bookings
      .filter((b) => b.status !== "CANCELLED")
      .map((b) => ({ ...b, startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString() })),
  };
}

/* ------------------------------------------------------------------------- */
/* /principal and /principal/classes                                          */
/* ------------------------------------------------------------------------- */

export async function principalOverview(ctx: Staff, days?: string): Promise<PrincipalOverview> {
  const span = parseSpan(days);
  const window = await windowFor(ctx.schoolId, span);
  const [insights, reviews, school, academicYear, coverage] = await Promise.all([
    classInsights(ctx, window),
    schoolReviewDashboard(ctx),
    schoolZone(ctx.schoolId),
    currentAcademicYear(ctx.schoolId),
    syllabusCoverage(ctx).catch(() => null),
  ]);
  const [summary, terms] = await Promise.all([schoolSummary(ctx, insights), academicYear ? currentTerms(ctx.schoolId, school.timezone) : Promise.resolve([])]);
  const runningTerm = terms.find((term) => term.current && !term.finishedAt) ?? terms.filter((term) => !term.finishedAt).at(-1) ?? null;
  return {
    span,
    window,
    summary,
    academicYear: academicYear ? { id: academicYear.id, name: academicYear.name } : null,
    syllabus: coverage ? { overallPercent: coverage.overallPercent, classesBehind: coverage.classesBehind, yearElapsedPercent: coverage.yearElapsedPercent } : null,
    runningTerm: runningTerm ? { id: runningTerm.id, name: runningTerm.name, endDateKey: runningTerm.endDateKey } : null,
    concerns: insights.filter((k) => k.attendance.percent !== null && k.attendance.percent < ATTENDANCE_CONCERN_PERCENT),
    classes: insights,
    reviews: reviews.map((r) => ({ ...r, allTime: { ...r.allTime, byQuestion: r.allTime.byQuestion as Record<string, number> } })),
  };
}

export async function principalClasses(
  ctx: Staff,
  query: { days?: string; sort?: "name" | "attendance" | "progress"; grade?: string },
): Promise<PrincipalClasses> {
  const span = parseSpan(query.days);
  const window = await windowFor(ctx.schoolId, span);
  const allInsights = await classInsights(ctx, window);
  const sort = query.sort ?? "name";
  const grades = [...new Set(allInsights.map((k) => k.gradeLevel).filter((g): g is string => Boolean(g)))].sort(
    new Intl.Collator(undefined, { numeric: true }).compare,
  );
  const gradeFilter = query.grade && grades.includes(query.grade) ? query.grade : null;
  // Lowest first for the two figures: the head is looking for the class that needs a visit.
  const classes = allInsights
    .filter((k) => !gradeFilter || k.gradeLevel === gradeFilter)
    .sort((a, b) => {
      if (sort === "attendance") return (a.attendance.percent ?? 101) - (b.attendance.percent ?? 101);
      if (sort === "progress") return (a.progress.percent ?? 101) - (b.progress.percent ?? 101);
      return 0;
    });
  return { span, window, sort, grades, gradeFilter, concernPercent: ATTENDANCE_CONCERN_PERCENT, classes };
}
