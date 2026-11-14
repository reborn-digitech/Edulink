import "server-only";
import { db } from "./db";
import { notify } from "./notify";
import { addDaysToKey, todayKey } from "./dates";
import { readJson } from "./json";
import { DEFAULT_PREFS, type UserPrefs } from "./session";
import { translator, type Translate } from "./i18n/dictionary";
import { normaliseLocale } from "./i18n/locales";
import { guardiansToTell } from "./student-consent";

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
      // Answers, not reveals (TA-600): a revealed solution's row has no choice.
      where: { attempt: { studentMembershipId, schoolId: membership.schoolId }, answeredAt: { gte: since }, chosenIndex: { not: null } },
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

/**
 * One child's line, in the PARENT's language — the digest is composed here
 * rather than through bodyKey because it is several sentences joined, and
 * the recipient is known before it is written.
 */
function lineFor(week: ChildDigest, t: Translate): string {
  const parts: string[] = [];
  if (week.attended !== null) parts.push(t("digest.attendedDays", { n: week.attended, total: week.attendanceTotal }));
  if (week.practiceAnswers > 0) parts.push(t("digest.answeredPractice", { n: week.practiceAnswers }));
  if (week.badges > 0) parts.push(week.badges === 1 ? t("digest.earnedBadgeOne") : t("digest.earnedBadges", { n: week.badges }));
  if (week.homeworkDue > 0)
    parts.push(week.homeworkDue === 1 ? t("digest.homeworkDueOne") : t("digest.homeworkDue", { n: week.homeworkDue }));
  if (week.examsSoon > 0)
    parts.push(week.examsSoon === 1 ? t("digest.examsSoonOne") : t("digest.examsSoon", { n: week.examsSoon }));
  if (parts.length === 0) parts.push(t("digest.quietWeek"));
  return `${week.childName}: ${parts.join(", ")}.`;
}

/**
 * Send this week's digest to every family that has not had one in six days.
 * Returns honest counts; a caller (or a cron log) can see what happened.
 *
 * COVERAGE, NOT JUST SENDS. Per school, every family the run considered lands
 * in exactly one bucket: `digests`/`children` when a message went, `quiet`
 * when there was nothing worth saying, `skipped` when this week's had already
 * arrived — so "3 digests" can finally be read against how many families
 * there were to reach, on the school's own card and the operator's page
 * alike. Quiet and skipped families are attributed through the membership's
 * school (one batched read), which also catches the family whose child holds
 * a membership but no active enrolment. The one deliberate asymmetry: a SENT
 * digest counts only toward the schools it actually mentions — a family
 * served about one school's child is not "quiet" at the sibling's school,
 * it is simply not counted there, because saying either number would lie.
 */
export async function sendWeeklyDigests(
  opts: { onlyParentUserIds?: string[] } = {},
): Promise<{
  sent: number;
  skipped: number;
  quiet: number;
  perSchool: Record<string, { digests?: number; children?: number; quiet?: number; skipped?: number }>;
}> {
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
  const perSchool: Record<string, { digests?: number; children?: number; quiet?: number; skipped?: number }> = {};
  const bump = (schoolId: string, key: "digests" | "children" | "quiet" | "skipped") => {
    const row = (perSchool[schoolId] ??= {});
    row[key] = (row[key] ?? 0) + 1;
  };

  // One batched read of every child's school, chunked for the large platform,
  // so quiet and skipped families can be attributed without a query each.
  const childSchool = new Map<string, string>();
  const allChildIds = [...new Set(parents.map((link) => link.studentMembershipId))];
  // What an adult college student lets their guardians see (TA-176): the register line under ATTENDANCE, the
  // practice, badges, homework and exams under RESULTS; a child with neither is left out of the digest.
  // Each guardian on their own grant (TA-555): the pairs "child|guardian" each line is open to.
  const seesAttendance = new Set<string>();
  const seesResults = new Set<string>();
  const pair = (childId: string, parentUserId: string) => `${childId}|${parentUserId}`;
  for (let i = 0; i < allChildIds.length; i += 1000) {
    const chunk = allChildIds.slice(i, i + 1000);
    const rows = await db.membership.findMany({
      where: { id: { in: chunk } },
      select: { id: true, schoolId: true },
    });
    for (const row of rows) childSchool.set(row.id, row.schoolId);
    for (const [id, guardians] of await guardiansToTell(chunk, "ATTENDANCE")) for (const g of guardians) seesAttendance.add(pair(id, g));
    for (const [id, guardians] of await guardiansToTell(chunk, "RESULTS")) for (const g of guardians) seesResults.add(pair(id, g));
  }
  const familySchools = (childIds: string[]) =>
    new Set(childIds.map((id) => childSchool.get(id)).filter((x): x is string => x !== undefined));

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
      for (const schoolId of familySchools(childIds)) bump(schoolId, "skipped");
      continue;
    }

    const weeks = (await Promise.all(childIds.filter((id) => seesAttendance.has(pair(id, parentUserId)) || seesResults.has(pair(id, parentUserId))).map(async (id) => {
      const week = await childWeek(id);
      if (!week) return null;
      return {
        ...week,
        ...(seesAttendance.has(pair(id, parentUserId)) ? {} : { attended: null, attendanceTotal: 0 }),
        ...(seesResults.has(pair(id, parentUserId)) ? {} : { practiceAnswers: 0, badges: 0, homeworkDue: 0, examsSoon: 0 }),
      };
    }))).filter(
      (w): w is ChildDigest => w !== null,
    );
    if (weeks.length === 0) {
      quiet += 1;
      for (const schoolId of familySchools(childIds)) bump(schoolId, "quiet");
      continue;
    }
    // A week with nothing at all to report for any child sends nothing —
    // an empty digest teaches a family to ignore the full ones.
    const somethingHappened = weeks.some(
      (w) => w.attendanceTotal > 0 || w.practiceAnswers > 0 || w.badges > 0 || w.homeworkDue > 0 || w.examsSoon > 0,
    );
    if (!somethingHappened) {
      quiet += 1;
      for (const schoolId of familySchools(childIds)) bump(schoolId, "quiet");
      continue;
    }

    const parent = await db.user.findUnique({ where: { id: parentUserId }, select: { prefs: true } });
    const t = translator(normaliseLocale(readJson<UserPrefs>(parent?.prefs ?? "{}", DEFAULT_PREFS).locale));
    await notify({
      userId: parentUserId,
      schoolId: weeks[0]!.schoolId,
      kind: "SYSTEM",
      titleKey: "notifTitle.thisWeekAtSchool",
      body: weeks.map((week) => lineFor(week, t)).join("\n"),
      url: "/parent",
      meta: { flag: DIGEST_FLAG },
    });
    sent += 1;
    for (const schoolId of new Set(weeks.map((w) => w.schoolId))) bump(schoolId, "digests");
    for (const week of weeks) bump(week.schoolId, "children");
  }

  return { sent, skipped, quiet, perSchool };
}
