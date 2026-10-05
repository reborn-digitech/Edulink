import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { overallPercent, weightedPercent, weightsAreUsable, type CategoryWeight } from "./grading";
import { addDaysToKey, todayKey, zonedStartOfDay } from "./dates";
import { registersDue } from "./attendance";
import type { ActiveContext } from "./session";
import type { AttendanceStatus } from "./constants";

/**
 * The school, seen whole — for a principal.
 *
 * THIS APP DELIBERATELY HAS NO LEADERBOARDS, and that rule is written into
 * `badges.ts` and the practice page in capital letters: a child comparing their
 * number with the child next to them is the thing this software is meant not to
 * do. A dashboard that ranks pupils is exactly that, one level up.
 *
 * So this does not rank anybody. It answers a different question — "who is not
 * getting what they need?" — with THRESHOLDS rather than an ordering. A child
 * below the attendance line appears because they are below the line, not
 * because they are twenty-eighth. The list is short, alphabetical, and stops
 * being a list when nobody is on it. A principal who wants to know how a
 * particular child is doing opens that child's report card, which is a document
 * about them and not a position among their friends.
 *
 * The same rule bites on classes, and there it is looser: comparing CLASSES is a
 * legitimate management question, and no eleven-year-old is being compared with
 * their friend by it. Classes are still shown in their own order rather than
 * sorted best-first, because a principal reading a list top to bottom should not
 * be told what to conclude by the sort.
 */

export const DEFAULT_WINDOW_DAYS = 30;

/** Below this, a pupil's attendance is worth a principal's attention. */
export const ATTENDANCE_CONCERN_PERCENT = 85;

export type Window = { fromDateKey: string; toDateKey: string };

/**
 * The window as instants, for the columns that hold a timestamp rather than a
 * day key: [first day 00:00, day after the last 00:00) on the school's clock.
 * A mark graded at 21:00 on the window's last day is in it; one graded the
 * morning after is not.
 */
function instantsOf(window: Window, timezone: string): { gte: Date; lt: Date } {
  return {
    gte: zonedStartOfDay(window.fromDateKey, timezone),
    lt: zonedStartOfDay(addDaysToKey(window.toDateKey, 1), timezone),
  };
}

export type ClassInsight = {
  classId: string;
  name: string;
  section: string | null;
  gradeLevel: string | null;
  pupils: number;
  /** Registers actually taken in the window — the denominator nobody thinks about. */
  sessionsTaken: number;
  attendance: {
    counts: Record<AttendanceStatus, number>;
    marks: number;
    percent: number | null;
  };
  progress: {
    /** Mean of each pupil's own overall. See the note on why this is not the mistake. */
    percent: number | null;
    pupilsCounted: number;
    pupilsWithNoMarks: number;
  };
  reportCards: { title: string; published: number; drafts: number }[];
};

export type PupilInsight = {
  membershipId: string;
  name: string;
  attendancePercent: number | null;
  attendanceMarks: number;
  overallPercent: number | null;
  hasMarks: boolean;
  latestCard: { id: string; title: string; status: string } | null;
};

function assertOversight(ctx: ActiveContext) {
  if (ctx.role !== "PRINCIPAL" && ctx.role !== "ADMIN") {
    throw new AccessError("access.onlyThePrincipalOrAnAdminCan3");
  }
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  return ctx.schoolId;
}

export async function defaultWindow(schoolId: string, days = DEFAULT_WINDOW_DAYS): Promise<Window> {
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true },
  });
  const toDateKey = todayKey(school.timezone);
  return { fromDateKey: addDaysToKey(toDateKey, -days), toDateKey };
}

/**
 * How far back the head's figures look.
 *
 * Three trailing spans and one that is not trailing at all: "the academic
 * year so far" runs from the day the current year began to today. It used to
 * be "half a year" — a flat 180 days — which in an Indian school answers a
 * question nobody asks: in September it reached back into last year's
 * classes, and in April it was mostly the summer holiday. The year is the
 * unit the head thinks in, so the window is the year.
 *
 * Arrives from the URL, so it is PARSED rather than trusted — anything that
 * is not one of the four becomes the default.
 */
export type Span = 7 | 30 | 90 | "year";
export const SPANS: readonly Span[] = [7, 30, 90, "year"];

export function parseSpan(raw: string | undefined): Span {
  if (raw === "year") return "year";
  const n = Number(raw);
  return n === 7 || n === 90 ? n : DEFAULT_WINDOW_DAYS;
}

export async function windowFor(schoolId: string, span: Span): Promise<Window> {
  if (span !== "year") return defaultWindow(schoolId, span);
  const [school, year] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } }),
    db.academicYear.findFirst({
      where: { schoolId, isCurrent: true },
      orderBy: { startDate: "desc" },
      select: { startDate: true },
    }),
  ]);
  const toDateKey = todayKey(school.timezone);
  // No year started yet: the honest fallback is a long trailing window, not
  // an empty one — the head still wants to see the school.
  if (!year) return { fromDateKey: addDaysToKey(toDateKey, -180), toDateKey };
  // The same reading of `startDate` as badges, terms and report cards use:
  // the row holds UTC midnight of the day the office typed, so the ISO date
  // IS the day. Reading it in the school's zone put a school west of UTC one
  // day early.
  const start = year.startDate.toISOString().slice(0, 10);
  return { fromDateKey: start > toDateKey ? toDateKey : start, toDateKey };
}

/* -------------------------------------------------------------------------- */
/* The whole school, class by class                                            */
/* -------------------------------------------------------------------------- */

export async function classInsights(
  ctx: ActiveContext,
  window: Window,
): Promise<ClassInsight[]> {
  const schoolId = assertOversight(ctx);

  const [classes, school] = await Promise.all([
    db.class.findMany({
      where: { schoolId, archivedAt: null },
      select: { id: true, name: true, section: true, gradeLevel: true },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    }),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } }),
  ]);
  if (classes.length === 0) return [];
  const gradedIn = instantsOf(window, school.timezone);

  const classIds = classes.map((c) => c.id);

  const [enrolments, sessions, cards] = await Promise.all([
    db.enrollment.findMany({
      where: { schoolId, classId: { in: classIds }, status: "ACTIVE" },
      select: { classId: true, studentMembershipId: true },
    }),
    db.attendanceSession.findMany({
      where: {
        schoolId,
        classId: { in: classIds },
        dateKey: { gte: window.fromDateKey, lte: window.toDateKey },
      },
      select: { id: true, classId: true },
    }),
    db.reportCard.groupBy({
      by: ["classId", "title", "status"],
      where: { schoolId, classId: { in: classIds } },
      _count: true,
    }),
  ]);

  // GROUPED IN THE DATABASE, not by loading every record. A term of registers
  // for a school of five hundred is a hundred thousand rows, and pulling them
  // into Node to count them is how a dashboard becomes the slowest page in the
  // app. AttendanceRecord has no classId, so the join happens through the
  // session ids gathered above.
  const marks =
    sessions.length === 0
      ? []
      : await db.attendanceRecord.groupBy({
          by: ["sessionId", "status"],
          where: { schoolId, sessionId: { in: sessions.map((s) => s.id) } },
          _count: true,
        });

  const classOfSession = new Map(sessions.map((s) => [s.id, s.classId]));

  const attendanceByClass = new Map<string, Record<AttendanceStatus, number>>();
  for (const mark of marks) {
    const classId = classOfSession.get(mark.sessionId);
    if (!classId) continue;
    const bucket =
      attendanceByClass.get(classId) ??
      ({ PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>);
    bucket[mark.status as AttendanceStatus] += mark._count;
    attendanceByClass.set(classId, bucket);
  }

  const sessionsByClass = new Map<string, number>();
  for (const session of sessions) {
    sessionsByClass.set(session.classId, (sessionsByClass.get(session.classId) ?? 0) + 1);
  }

  const rollByClass = new Map<string, string[]>();
  for (const row of enrolments) {
    const list = rollByClass.get(row.classId) ?? [];
    list.push(row.studentMembershipId);
    rollByClass.set(row.classId, list);
  }

  const progress = await progressByClass(schoolId, classIds, rollByClass, gradedIn);

  const cardsByClass = new Map<string, Map<string, { published: number; drafts: number }>>();
  for (const row of cards) {
    const byTitle = cardsByClass.get(row.classId) ?? new Map();
    const entry = byTitle.get(row.title) ?? { published: 0, drafts: 0 };
    if (row.status === "PUBLISHED") entry.published += row._count;
    else entry.drafts += row._count;
    byTitle.set(row.title, entry);
    cardsByClass.set(row.classId, byTitle);
  }

  return classes.map((klass) => {
    const counts =
      attendanceByClass.get(klass.id) ??
      ({ PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 } as Record<AttendanceStatus, number>);
    const total = counts.PRESENT + counts.LATE + counts.ABSENT + counts.EXCUSED;

    return {
      classId: klass.id,
      name: klass.name,
      section: klass.section,
      gradeLevel: klass.gradeLevel,
      pupils: rollByClass.get(klass.id)?.length ?? 0,
      sessionsTaken: sessionsByClass.get(klass.id) ?? 0,
      attendance: {
        counts,
        marks: total,
        // LATE counts as present. A child who arrived is not absent, and a
        // percentage that says otherwise makes lateness look like truancy.
        percent: total === 0 ? null : Math.round(((counts.PRESENT + counts.LATE) * 100) / total),
      },
      progress: progress.get(klass.id) ?? {
        percent: null,
        pupilsCounted: 0,
        pupilsWithNoMarks: 0,
      },
      reportCards: [...(cardsByClass.get(klass.id) ?? new Map())]
        .map(([title, entry]) => ({ title, ...entry }))
        .sort((a, b) => b.title.localeCompare(a.title)),
    };
  });
}

/**
 * Each class's academic figure.
 *
 * MEAN OF THE PUPILS' OWN OVERALLS, and that is deliberately NOT the mistake
 * `overallPercent` warns about. That warning is about averaging per-assignment
 * percentages, which weights a 5-point quiz like a 100-point exam and produces a
 * different and wrong number. This averages per-PUPIL figures, each computed the
 * correct way, and the unit really is the pupil: a class of thirty is thirty
 * children who each count once, not one pile of marks. Summing everybody's
 * points instead would let one child who sat every paper outweigh five who sat
 * none.
 *
 * Pupils with no marks at all are EXCLUDED from the mean and counted separately,
 * so a class where half the work is unmarked cannot quietly report the other
 * half's average as the class's.
 *
 * AND IT IS THE WINDOW'S FIGURE. The page shows the span beside the number,
 * and only marks graded inside it count — the same rule the attendance
 * column has always followed. A pupil whose marks all fall outside the
 * window is a pupil with no marks in it.
 */
async function progressByClass(
  schoolId: string,
  classIds: string[],
  rollByClass: Map<string, string[]>,
  gradedIn: { gte: Date; lt: Date },
): Promise<Map<string, { percent: number | null; pupilsCounted: number; pupilsWithNoMarks: number }>> {
  const [grades, categories] = await Promise.all([
    db.grade.findMany({
      where: { schoolId, gradedAt: gradedIn, assignment: { classId: { in: classIds } } },
      select: {
        studentMembershipId: true,
        scoreMilli: true,
        assignment: { select: { classId: true, pointsMilli: true, category: true } },
      },
    }),
    db.gradeCategory.findMany({
      where: { schoolId, classId: { in: classIds } },
      select: { classId: true, name: true, weightBps: true },
    }),
  ]);

  const weightsByClass = new Map<string, CategoryWeight[]>();
  for (const row of categories) {
    const list = weightsByClass.get(row.classId) ?? [];
    list.push({ name: row.name, weightBps: row.weightBps });
    weightsByClass.set(row.classId, list);
  }

  type Entry = { scoreMilli: number | null; maxMilli: number | null; category: string | null };
  const byClassAndPupil = new Map<string, Map<string, Entry[]>>();
  for (const grade of grades) {
    const classId = grade.assignment.classId;
    // A college offering's work (R-48) is no class's.
    if (!classId) continue;
    const pupils = byClassAndPupil.get(classId) ?? new Map<string, Entry[]>();
    const list = pupils.get(grade.studentMembershipId) ?? [];
    list.push({
      scoreMilli: grade.scoreMilli,
      maxMilli: grade.assignment.pointsMilli,
      category: grade.assignment.category,
    });
    pupils.set(grade.studentMembershipId, list);
    byClassAndPupil.set(classId, pupils);
  }

  const out = new Map<string, { percent: number | null; pupilsCounted: number; pupilsWithNoMarks: number }>();

  for (const classId of classIds) {
    const roll = rollByClass.get(classId) ?? [];
    const pupils = byClassAndPupil.get(classId) ?? new Map<string, Entry[]>();
    const weights = weightsByClass.get(classId) ?? [];
    const useWeights = weightsAreUsable(weights);

    const percents: number[] = [];
    let withNoMarks = 0;

    for (const membershipId of roll) {
      const entries = pupils.get(membershipId) ?? [];
      const percent = useWeights
        ? weightedPercent(entries, weights).percent
        : overallPercent(entries);
      if (percent === null) withNoMarks++;
      else percents.push(percent);
    }

    out.set(classId, {
      percent:
        percents.length === 0
          ? null
          : Math.round(percents.reduce((a, b) => a + b, 0) / percents.length),
      pupilsCounted: percents.length,
      pupilsWithNoMarks: withNoMarks,
    });
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/* One class, pupil by pupil                                                   */
/* -------------------------------------------------------------------------- */

export async function pupilInsights(
  ctx: ActiveContext,
  classId: string,
  window: Window,
): Promise<{ klass: { id: string; name: string; section: string | null }; pupils: PupilInsight[] }> {
  const schoolId = assertOversight(ctx);

  const [klass, school] = await Promise.all([
    db.class.findFirst({
      where: { id: classId, schoolId },
      select: { id: true, name: true, section: true },
    }),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } }),
  ]);
  if (!klass) throw new AccessError("access.thatClassIsNotInThisSchool", "NOT_FOUND");

  const roll = await db.enrollment.findMany({
    where: { schoolId, classId, status: "ACTIVE" },
    select: {
      studentMembershipId: true,
      student: { select: { user: { select: { name: true, preferredName: true } } } },
    },
  });
  if (roll.length === 0) return { klass, pupils: [] };

  const membershipIds = roll.map((r) => r.studentMembershipId);

  const [marks, grades, categories, cards] = await Promise.all([
    db.attendanceRecord.groupBy({
      by: ["studentMembershipId", "status"],
      where: {
        schoolId,
        studentMembershipId: { in: membershipIds },
        session: { classId, dateKey: { gte: window.fromDateKey, lte: window.toDateKey } },
      },
      _count: true,
    }),
    // The window's marks only, like the register beside them.
    db.grade.findMany({
      where: {
        schoolId,
        studentMembershipId: { in: membershipIds },
        gradedAt: instantsOf(window, school.timezone),
        assignment: { classId },
      },
      select: {
        studentMembershipId: true,
        scoreMilli: true,
        assignment: { select: { pointsMilli: true, category: true } },
      },
    }),
    db.gradeCategory.findMany({
      where: { schoolId, classId },
      select: { name: true, weightBps: true },
    }),
    db.reportCard.findMany({
      where: { schoolId, classId, studentMembershipId: { in: membershipIds } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, studentMembershipId: true },
    }),
  ]);

  const attendance = new Map<string, { present: number; total: number }>();
  for (const mark of marks) {
    const bucket = attendance.get(mark.studentMembershipId) ?? { present: 0, total: 0 };
    bucket.total += mark._count;
    if (mark.status === "PRESENT" || mark.status === "LATE") bucket.present += mark._count;
    attendance.set(mark.studentMembershipId, bucket);
  }

  const entriesByPupil = new Map<
    string,
    { scoreMilli: number | null; maxMilli: number | null; category: string | null }[]
  >();
  for (const grade of grades) {
    const list = entriesByPupil.get(grade.studentMembershipId) ?? [];
    list.push({
      scoreMilli: grade.scoreMilli,
      maxMilli: grade.assignment.pointsMilli,
      category: grade.assignment.category,
    });
    entriesByPupil.set(grade.studentMembershipId, list);
  }

  const weights = categories.map((c) => ({ name: c.name, weightBps: c.weightBps }));
  const useWeights = weightsAreUsable(weights);

  const latestCard = new Map<string, { id: string; title: string; status: string }>();
  for (const card of cards) {
    if (!latestCard.has(card.studentMembershipId)) {
      latestCard.set(card.studentMembershipId, {
        id: card.id,
        title: card.title,
        status: card.status,
      });
    }
  }

  const pupils: PupilInsight[] = roll.map((row) => {
    const bucket = attendance.get(row.studentMembershipId);
    const entries = entriesByPupil.get(row.studentMembershipId) ?? [];
    const percent = useWeights
      ? weightedPercent(entries, weights).percent
      : overallPercent(entries);

    return {
      membershipId: row.studentMembershipId,
      name: row.student.user.preferredName ?? row.student.user.name,
      attendancePercent:
        !bucket || bucket.total === 0 ? null : Math.round((bucket.present * 100) / bucket.total),
      attendanceMarks: bucket?.total ?? 0,
      overallPercent: percent,
      hasMarks: entries.length > 0,
      latestCard: latestCard.get(row.studentMembershipId) ?? null,
    };
  });

  // ALPHABETICAL, DELIBERATELY. Sorting by attendance or by mark would make this
  // a ranking of children, which is the one thing this app has said repeatedly
  // it will not build. Whoever needs attention is flagged, not placed.
  pupils.sort((a, b) => a.name.localeCompare(b.name));

  return { klass, pupils };
}

/* -------------------------------------------------------------------------- */
/* The school in one line                                                      */
/* -------------------------------------------------------------------------- */

export type SchoolSummary = {
  pupils: number;
  classes: number;
  attendancePercent: number | null;
  /** Registers not taken today — the thing a principal can still fix today. */
  registersMissingToday: number;
  pendingLeave: number;
  concerns: number;
  /** False on a day the school is shut (not a teaching day, or a closing holiday). */
  openToday: boolean;
  /** The closing holiday's name on such a day, when one is declared. */
  holidayToday: string | null;
  /**
   * Classes with at least one mark in the window. Zero means no attendance
   * was taken at all, and "every class is at or above the line" would be a
   * sentence made of nothing (B-11).
   */
  classesWithAttendance: number;
};

export async function schoolSummary(
  ctx: ActiveContext,
  insights: ClassInsight[],
  /** The clock, for tests that need "today" to be a holiday or a Sunday. */
  now: Date = new Date(),
): Promise<SchoolSummary> {
  const schoolId = assertOversight(ctx);
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true },
  });
  const today = todayKey(school.timezone, now);

  // "Missing" is what the school EXPECTS and has not got: nothing on a closed
  // day, nothing from a class with nobody in it. `registersDue` carries the
  // reasoning; here it is only the difference.
  const [pupils, due, pendingLeave] = await Promise.all([
    db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
    registersDue(schoolId, today),
    db.leaveRequest.count({ where: { schoolId, status: "PENDING" } }),
  ]);

  // Summed over the whole school rather than averaged across classes, because
  // here the unit really is the mark: a class of 5 and a class of 40 should not
  // count equally towards "how well is this school attending?".
  let present = 0;
  let total = 0;
  for (const klass of insights) {
    present += klass.attendance.counts.PRESENT + klass.attendance.counts.LATE;
    total += klass.attendance.marks;
  }

  return {
    pupils,
    classes: insights.length,
    attendancePercent: total === 0 ? null : Math.round((present * 100) / total),
    registersMissingToday: due.missing.length,
    pendingLeave,
    concerns: insights.filter(
      (k) => k.attendance.percent !== null && k.attendance.percent < ATTENDANCE_CONCERN_PERCENT,
    ).length,
    openToday: due.open,
    holidayToday: due.holidayName,
    classesWithAttendance: insights.filter((k) => k.attendance.marks > 0).length,
  };
}
