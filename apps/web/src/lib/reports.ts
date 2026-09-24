import "server-only";
import { db } from "./db";
import { AccessError, assertGuardianAccess, assertStudentAccess } from "./tenancy";
import { getAttendanceSummary, computeBestStreak } from "./attendance";
import { overallForStudent } from "./grading";
import { getBadges } from "./badges";
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
  };
  grades: {
    overallPercent: number | null;
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
    await assertGuardianAccess(session.user.id, studentMembershipId);
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
  // [first day 00:00, day after the last 00:00) on the school's clock.
  const gradedIn = {
    gte: zonedStartOfDay(fromKey, timezone),
    lt: zonedStartOfDay(addDaysToKey(toKey, 1), timezone),
  };

  const [attendance, grades, badges] = await Promise.all([
    getAttendanceSummary(membership.schoolId, studentMembershipId, fromKey, toKey),
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
            class: { select: { name: true } },
          },
        },
      },
      orderBy: { gradedAt: "desc" },
    }),
    getBadges(membership.schoolId, studentMembershipId, timezone),
  ]);

  const classIds = [...new Set(grades.map((g) => g.assignment.classId))];
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
      classId: g.assignment.classId,
      scoreMilli: g.scoreMilli,
      maxMilli: g.assignment.pointsMilli,
      category: g.assignment.category,
    })),
    weightsByClass,
  );

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
    },
    grades: {
      // The shared helper: points earned over points available, divided ONCE.
      // Averaging the per-assignment percentages weights a 5-point quiz like a
      // 100-point exam, and on the seeded data the two disagree by two points.
      overallPercent: overall.percent,
      // Named on the report itself. A parent comparing this term's number with
      // last term's is entitled to know whether the RULE changed underneath it.
      method: overall.method,
      uncategorised: overall.uncategorised,
      marked: grades.map((g) => ({
        title: g.assignment.title,
        className: g.assignment.class.name,
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
    badges: badges
      .filter((b) => b.earned)
      .map((b) => ({ id: b.id, labelKey: b.labelKey, descriptionKey: b.descriptionKey })),
    generatedAt: new Date(),
  };
}
