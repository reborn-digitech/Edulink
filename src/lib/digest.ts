import "server-only";
import { db } from "./db";
import { notify } from "./notify";
import { addDaysToKey, todayKey } from "./dates";

/**
 * The parent weekly digest: one message per family, once a week, saying what
 * actually happened — days attended, practice done, badges earned, homework
 * due, exams coming. Composed from data the app already holds; delivered
 * through the ordinary notification machinery (in-app always, push when the
 * family switched it on). Wider transports stay out until they are real —
 * a digest that silently doesn't deliver is worse than none.
 *
 * A JOB, NOT A REQUEST. `sendWeeklyDigests` walks every active guardianship,
 * so it takes no session and is run from `npm run digest:weekly` (cron-ready)
 * rather than from any page. Idempotent over a six-day window: running it
 * twice on Monday sends nothing twice.
 */

const DIGEST_FLAG = "weekly-digest";

export type ChildDigest = {
  childName: string;
  schoolId: string;
  attended: number | null;
  attendanceTotal: number;
  practiceAnswers: number;
  badges: number;
  homeworkDue: number;
  examsSoon: number;
};

/** One child's week, from the rows the app already keeps. */
async function childWeek(studentMembershipId: string): Promise<ChildDigest | null> {
  const membership = await db.membership.findUnique({
    where: { id: studentMembershipId },
    select: {
      id: true,
      schoolId: true,
      user: { select: { name: true, preferredName: true } },
      school: { select: { timezone: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        select: { classId: true, class: { select: { gradeLevel: true } } },
      },
    },
  });
  if (!membership || membership.enrollments.length === 0) return null;

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const toKey = todayKey(membership.school.timezone);
  const fromKey = addDaysToKey(toKey, -7);
  const soonKey = addDaysToKey(toKey, 14);
  const classIds = membership.enrollments.map((e) => e.classId);
  const grades = membership.enrollments
    .map((e) => e.class.gradeLevel)
    .filter((g): g is string => g !== null);

  const [attendance, practiceAnswers, badges, homeworkDue, examsSoon] = await Promise.all([
    db.attendanceRecord.findMany({
      where: {
        schoolId: membership.schoolId,
        studentMembershipId,
        session: { dateKey: { gte: fromKey, lte: toKey } },
      },
      select: { status: true },
    }),
    db.quizResponse.count({
      where: { attempt: { studentMembershipId, schoolId: membership.schoolId }, answeredAt: { gte: since } },
    }),
    db.earnedBadge.count({
      where: { schoolId: membership.schoolId, studentMembershipId, earnedAt: { gte: since } },
    }),
    db.assignment.count({
      where: {
        schoolId: membership.schoolId,
        classId: { in: classIds },
        publishedAt: { not: null },
        dueAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        // Not yet handed in by this child.
        submissions: { none: { studentMembershipId, submittedAt: { not: null } } },
      },
    }),
    grades.length === 0
      ? Promise.resolve(0)
      : db.examSlot.count({
          where: {
            schoolId: membership.schoolId,
            dateKey: { gte: toKey, lte: soonKey },
            series: { gradeLevel: { in: grades }, publishedAt: { not: null }, archivedAt: null },
          },
        }),
  ]);

  return {
    childName: membership.user.preferredName ?? membership.user.name,
    schoolId: membership.schoolId,
    attended: attendance.length === 0
      ? null
      : attendance.filter((r) => r.status === "PRESENT" || r.status === "LATE").length,
    attendanceTotal: attendance.length,
    practiceAnswers,
    badges,
    homeworkDue,
    examsSoon,
  };
}

function lineFor(week: ChildDigest): string {
  const parts: string[] = [];
  if (week.attended !== null) parts.push(`attended ${week.attended}/${week.attendanceTotal} days`);
  if (week.practiceAnswers > 0) parts.push(`answered ${week.practiceAnswers} practice questions`);
  if (week.badges > 0) parts.push(`earned ${week.badges} badge${week.badges === 1 ? "" : "s"}`);
  if (week.homeworkDue > 0)
    parts.push(`${week.homeworkDue} homework item${week.homeworkDue === 1 ? "" : "s"} due this week`);
  if (week.examsSoon > 0)
    parts.push(`${week.examsSoon} exam paper${week.examsSoon === 1 ? "" : "s"} in the next fortnight`);
  if (parts.length === 0) parts.push("a quiet week");
  return `${week.childName}: ${parts.join(", ")}.`;
}

/**
 * Send this week's digest to every family that has not had one in six days.
 * Returns honest counts; a caller (or a cron log) can see what happened.
 */
export async function sendWeeklyDigests(
  opts: { onlyParentUserIds?: string[] } = {},
): Promise<{ sent: number; skipped: number; quiet: number }> {
  const parents = await db.guardianship.findMany({
    where: {
      status: "ACTIVE",
      // The cron sends to everyone; a test sends to its own fixtures only.
      ...(opts.onlyParentUserIds ? { parentUserId: { in: opts.onlyParentUserIds } } : {}),
    },
    select: { parentUserId: true, studentMembershipId: true },
  });

  const byParent = new Map<string, string[]>();
  for (const link of parents) {
    const list = byParent.get(link.parentUserId) ?? [];
    list.push(link.studentMembershipId);
    byParent.set(link.parentUserId, list);
  }

  let sent = 0;
  let skipped = 0;
  let quiet = 0;
  const window = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);

  for (const [parentUserId, childIds] of byParent) {
    const recent = await db.notification.findFirst({
      where: {
        userId: parentUserId,
        meta: { contains: `"${DIGEST_FLAG}"` },
        createdAt: { gte: window },
      },
      select: { id: true },
    });
    if (recent) {
      skipped += 1;
      continue;
    }

    const weeks = (await Promise.all(childIds.map((id) => childWeek(id)))).filter(
      (w): w is ChildDigest => w !== null,
    );
    if (weeks.length === 0) {
      quiet += 1;
      continue;
    }
    // A week with nothing at all to report for any child sends nothing —
    // an empty digest teaches a family to ignore the full ones.
    const somethingHappened = weeks.some(
      (w) => w.attendanceTotal > 0 || w.practiceAnswers > 0 || w.badges > 0 || w.homeworkDue > 0 || w.examsSoon > 0,
    );
    if (!somethingHappened) {
      quiet += 1;
      continue;
    }

    await notify({
      userId: parentUserId,
      schoolId: weeks[0]!.schoolId,
      kind: "SYSTEM",
      title: "This week at school",
      body: weeks.map(lineFor).join("\n"),
      url: "/parent",
      meta: { flag: DIGEST_FLAG },
    });
    sent += 1;
  }

  return { sent, skipped, quiet };
}
