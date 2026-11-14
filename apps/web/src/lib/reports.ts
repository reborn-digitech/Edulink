import "server-only";
import { db } from "./db";
import { AccessError, assertGuardianAccess, assertStudentAccess } from "./tenancy";
import { parentMaySee } from "./student-consent";
import { getAttendanceSummary, computeBestStreak } from "./attendance";
import { overallForStudent, workLabel } from "./grading";
import { ATTENDANCE_BADGE_IDS, getBadges } from "./badges";
import { addDaysToKey, todayKey, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import type { AttendanceStatus } from "./constants";

/**
 * The progress report: one child, one window, on one sheet.
 *
 * NOTHING IS CALCULATED HERE. Every figure comes from the helper that already
 * owns it — `getAttendanceSummary` for the register, `overallPercent` for the
 * grade, `getBadges` for the badges — because the one thing a report must never
 * do is disagree with the pages it summarises. A parent holding a printout that
 * says 88% next to a screen that says 86% has been given a reason to distrust
 * both, and re-deriving any of it here is how that happens: the "average of the
 * percentages" mistake would reappear in exactly the document most likely to be
 * read aloud at a parents' evening.
 *
 * The window is a real input, not a decoration. "How is she doing?" means
 * something different in October and in June, so the caller says, and the report
 * says back what it covered — and the marks follow it as the register does:
 * only work graded inside the window, on the school's clock, is listed or
 * counted in the overall. A report that printed "the last twelve weeks" over
 * every mark the child ever had was a lifetime average with a term's label.
 */

export const DEFAULT_REPORT_DAYS = 84; // twelve weeks — about a term

export type ProgressReport = {
  student: {
    membershipId: string;
    name: string;
    preferredName: string | null;
    gradeLevel: string | null;
    avatarKey: string | null;
  };
  school: { name: string; timezone: string; logoPath: string | null };
  window: { fromKey: string; toKey: string };
  attendance: {
    percent: number | null;
    counts: Record<AttendanceStatus, number>;
    total: number;
    bestStreak: number;
    /** An adult college student has not granted this guardian ATTENDANCE: nothing above is theirs to read (TA-556). */
    withheld: boolean;
  };
  grades: {
    overallPercent: number | null;
    /**
     * TA-388 (owner's decision, 14 November 2026): the window's homework alone (work that is not an exam sitting) and
     * its exam papers alone, each by the same helper as the overall, printed above it. The homework figure is the one
     * the family's home tile shows (homeworkAverage below), so the home number is found on the report.
     */
    homeworkPercent: number | null;
    homeworkCount: number;
    testsPercent: number | null;
    testsCount: number;
    method: "points" | "weighted";
    uncategorised: number;
    marked: {
      title: string;
      className: string;
      category: string | null;
      scoreMilli: number | null;
      pointsMilli: number | null;
      gradedAt: Date | null;
      comment: string | null;
    }[];
  };
  badges: { id: string; labelKey: TranslationKey; descriptionKey: TranslationKey }[];
  generatedAt: Date;
};

/**
 * Who may read a child's report.
 *
 * Exactly the people who may already see the things it is made of, and it says
 * so by ASKING them rather than by re-deciding: `assertStudentAccess` for staff
 * (which scopes a teacher to classes they actually teach, not merely to the
 * school), `assertGuardianAccess` for a parent, and the child themselves. A
 * report is a summary, and a summary must never be a way around the rules that
 * protect its parts.
 */
async function assertReportAccess(session: ActiveContext, studentMembershipId: string) {
  if (session.role === "PARENT") {
    await assertGuardianAccess(session.user.id, studentMembershipId, "RESULTS");
    return;
  }

  if (session.role === "STUDENT") {
    if (session.membershipId !== studentMembershipId) {
      throw new AccessError("access.reportNotFound", "NOT_FOUND");
    }
    return;
  }

  if ((session.role === "ADMIN" || session.role === "TEACHER") && session.schoolId && session.membershipId) {
    await assertStudentAccess(
      { schoolId: session.schoolId, membershipId: session.membershipId, role: session.role },
      studentMembershipId,
    );
    return;
  }

  throw new AccessError("access.reportNotFound", "NOT_FOUND");
}

export async function buildProgressReport(
  session: ActiveContext,
  studentMembershipId: string,
  range: { fromKey?: string; toKey?: string } = {},
): Promise<ProgressReport> {
  await assertReportAccess(session, studentMembershipId);

  const membership = await db.membership.findUnique({
    where: { id: studentMembershipId },
    include: {
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      school: { select: { name: true, timezone: true, logoPath: true } },
    },
  });
  // The access check above passed, so a miss here means the row is gone rather
  // than hidden — but the message stays the same either way.
  if (!membership) throw new AccessError("access.reportNotFound", "NOT_FOUND");

  const timezone = membership.school.timezone;
  const toKey = range.toKey ?? todayKey(timezone);
  const fromKey = range.fromKey ?? addDaysToKey(toKey, -DEFAULT_REPORT_DAYS);
  if (fromKey > toKey) throw new AccessError("access.thatDateRangeRunsBackwards");
  const gradedIn = gradedWithin(fromKey, toKey, timezone);

  // A guardian is admitted under RESULTS; an adult college student's register is a grant of its own (ATTENDANCE), and
  // without it the report says so instead of printing the days (TA-556).
  const attendanceWithheld = session.role === "PARENT" && !(await parentMaySee(studentMembershipId, "ATTENDANCE"));
  const [attendance, grades, badges] = await Promise.all([
    attendanceWithheld
      ? Promise.resolve({ percent: null, counts: { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 }, total: 0, days: [] })
      : getAttendanceSummary(membership.schoolId, studentMembershipId, fromKey, toKey),
    db.grade.findMany({
      where: {
        studentMembershipId,
        schoolId: membership.schoolId,
        scoreMilli: { not: null },
        gradedAt: gradedIn,
      },
      include: {
        assignment: {
          select: {
            title: true,
            category: true,
            pointsMilli: true,
            classId: true,
            offeringId: true,
            examSlotId: true,
            class: { select: { name: true } },
            offering: { select: { course: { select: { code: true, name: true } } } },
          },
        },
      },
      orderBy: { gradedAt: "desc" },
    }),
    getBadges(membership.schoolId, studentMembershipId, timezone),
  ]);

  // A college offering's work (R-48) has no class and no weights: points-weighted under the offering's id.
  const classIds = [...new Set(grades.map((g) => g.assignment.classId).filter((id): id is string => id !== null))];
  const categories = await db.gradeCategory.findMany({
    where: { schoolId: membership.schoolId, classId: { in: classIds } },
    select: { classId: true, name: true, weightBps: true },
    orderBy: { position: "asc" },
  });
  const weightsByClass = new Map<string, { name: string; weightBps: number }[]>();
  for (const category of categories) {
    const list = weightsByClass.get(category.classId) ?? [];
    list.push({ name: category.name, weightBps: category.weightBps });
    weightsByClass.set(category.classId, list);
  }

  // The shared helper, so the report card and the parent's own screen cannot
  // print different numbers for the same child.
  const overall = overallForStudent(
    grades.map((g) => ({
      classId: g.assignment.classId ?? g.assignment.offeringId ?? "",
      scoreMilli: g.scoreMilli,
      maxMilli: g.assignment.pointsMilli,
      category: g.assignment.category,
    })),
    weightsByClass,
  );
  // TA-388: the two populations the overall is made of, each averaged by the same rule.
  const homework = averageOf(grades.filter((g) => g.assignment.examSlotId === null), weightsByClass);
  const tests = averageOf(grades.filter((g) => g.assignment.examSlotId !== null), weightsByClass);

  return {
    student: {
      membershipId: studentMembershipId,
      name: membership.user.name,
      preferredName: membership.user.preferredName,
      gradeLevel: membership.gradeLevel,
      avatarKey: membership.user.avatarKey,
    },
    school: membership.school,
    window: { fromKey, toKey },
    attendance: {
      percent: attendance.percent,
      counts: attendance.counts,
      total: attendance.total,
      bestStreak: computeBestStreak(attendance.days),
      withheld: attendanceWithheld,
    },
    grades: {
      // The shared helper: points earned over points available, divided ONCE.
      // Averaging the per-assignment percentages weights a 5-point quiz like a
      // 100-point exam, and on the seeded data the two disagree by two points.
      overallPercent: overall.percent,
      homeworkPercent: homework.percent,
      homeworkCount: homework.count,
      testsPercent: tests.percent,
      testsCount: tests.count,
      // Named on the report itself. A parent comparing this term's number with
      // last term's is entitled to know whether the RULE changed underneath it.
      method: overall.method,
      uncategorised: overall.uncategorised,
      marked: grades.map((g) => ({
        title: g.assignment.title,
        className: workLabel(g.assignment),
        category: g.assignment.category,
        scoreMilli: g.scoreMilli,
        pointsMilli: g.assignment.pointsMilli,
        gradedAt: g.gradedAt,
        comment: g.comment,
      })),
    },
    // EARNED ones only. A progress report is a record of what a child has done;
    // listing the badges they have not got turns it into a list of ways they
    // fell short, which is not what this document is for.
    // Nor, with the register withheld, the badges that are the register in other words (TA-556).
    badges: badges
      .filter((b) => b.earned && !(attendanceWithheld && ATTENDANCE_BADGE_IDS.includes(b.id)))
      .map((b) => ({ id: b.id, labelKey: b.labelKey, descriptionKey: b.descriptionKey })),
    generatedAt: new Date(),
  };
}

/** [first day 00:00, day after the last 00:00) on the school's clock: the marks a window covers. */
function gradedWithin(fromKey: string, toKey: string, timezone: string) {
  return {
    gte: zonedStartOfDay(fromKey, timezone),
    lt: zonedStartOfDay(addDaysToKey(toKey, 1), timezone),
  };
}

/**
 * Is this the family's home tile's window, the last DEFAULT_REPORT_DAYS days to today on the school's clock (TA-388)?
 * Only then is the report's homework average the figure on the home page, so the page says so only then: a custom
 * ?from=&to= window prints the two averages without that sentence. Pure.
 */
export function isHomeWindow(window: { fromKey: string; toKey: string }, timezone: string, now: Date = new Date()): boolean {
  const today = todayKey(timezone, now);
  return window.toKey === today && window.fromKey === addDaysToKey(today, -DEFAULT_REPORT_DAYS);
}

type MarkRow = {
  scoreMilli: number | null;
  assignment: { classId: string | null; offeringId: string | null; pointsMilli: number | null; category: string | null };
};

/**
 * One population's average by the shared helper, and how many marked pieces it stands on (a mark with points to be
 * out of, as the home tile has always counted them). A college offering's work (R-48) has no class and no weights:
 * points-weighted under the offering's id.
 */
function averageOf(rows: MarkRow[], weightsByClass: Map<string, { name: string; weightBps: number }[]>) {
  const result = overallForStudent(
    rows.map((g) => ({
      classId: g.assignment.classId ?? g.assignment.offeringId ?? "",
      scoreMilli: g.scoreMilli,
      maxMilli: g.assignment.pointsMilli,
      category: g.assignment.category,
    })),
    weightsByClass,
  );
  return { percent: result.percent, count: rows.filter((g) => g.scoreMilli !== null && g.assignment.pointsMilli).length };
}

/**
 * The family's home tile, "Homework average" (TA-388, owner's decision of 14 November 2026): the homework marked in
 * the report's own default window (the last DEFAULT_REPORT_DAYS days to today, on the school's clock), exam sittings
 * left out, by the same helper and the same weights, so the number is the report's homework average. One reader for
 * the web home and GET /api/v1/family/overview (the phone's tile). The caller has already checked the guardian.
 */
export async function homeworkAverage(
  schoolId: string,
  studentMembershipId: string,
  timezone: string,
): Promise<{ percent: number | null; count: number }> {
  const toKey = todayKey(timezone);
  const fromKey = addDaysToKey(toKey, -DEFAULT_REPORT_DAYS);
  const rows = await db.grade.findMany({
    where: {
      studentMembershipId,
      schoolId,
      scoreMilli: { not: null },
      gradedAt: gradedWithin(fromKey, toKey, timezone),
      assignment: { examSlotId: null },
    },
    select: { scoreMilli: true, assignment: { select: { pointsMilli: true, category: true, classId: true, offeringId: true } } },
  });
  const classIds = [...new Set(rows.map((g) => g.assignment.classId).filter((id): id is string => id !== null))];
  const categories = classIds.length
    ? await db.gradeCategory.findMany({
        where: { schoolId, classId: { in: classIds } },
        select: { classId: true, name: true, weightBps: true },
        orderBy: { position: "asc" },
      })
    : [];
  const weightsByClass = new Map<string, { name: string; weightBps: number }[]>();
  for (const category of categories) {
    const list = weightsByClass.get(category.classId) ?? [];
    list.push({ name: category.name, weightBps: category.weightBps });
    weightsByClass.set(category.classId, list);
  }
  return averageOf(rows, weightsByClass);
}
