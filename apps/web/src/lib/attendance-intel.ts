import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { guardiansToTell } from "./student-consent";
import { addDaysToKey, todayKey } from "./dates";
import type { ActiveContext } from "./session";

/**
 * Attendance intelligence: the register, read for the child instead of the
 * day. The register pages answer "who was here on Tuesday"; this module
 * answers "which children are quietly slipping" — the question a school
 * should not need a spreadsheet afternoon to ask.
 *
 * NAMES APPEAR HERE, deliberately. The no-names rule protects children from
 * being compared with each other; chronic absence is not a comparison, it is
 * a welfare flag, and a welfare flag with no name on it helps nobody. It is
 * staff-only (admin and principal) and notifying a family is a separate,
 * audited act — never automatic, because a text about absence landing at the
 * wrong moment can do real harm in a real family.
 */

const CHRONIC_THRESHOLD_PERCENT = 75;
/** Below this many marks a percentage is noise, not a pattern. */
const MIN_MARKS = 8;
const CONSECUTIVE_ABSENT = 3;

function assertOversight(ctx: ActiveContext): string {
  if (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") {
    throw new AccessError("access.onlyThePrincipalOrAnAdminCan3");
  }
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  return ctx.schoolId;
}

export type AbsenceFlag = {
  studentMembershipId: string;
  name: string;
  className: string;
  percent: number;
  marks: number;
  /** Days in a row absent, counted back from the most recent register day. */
  currentRun: number;
  /** Which rule tripped: the rate, the run, or both. */
  chronic: boolean;
  consecutive: boolean;
  guardianCount: number;
};

/** The raw-query slice of the transaction client. */
type RawTx = { $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T> };

/**
 * FOLDED IN THE DATABASE (TA-505). One status per pupil per day — a child on two
 * registers the same day, a class register and a subject one, is absent once,
 * not twice, and the worse mark stands: ABSENT over EXCUSED over LATE over
 * PRESENT (severity 3, 2, 1, 0 in the CASE below). The page used to read every mark of
 * the school for up to ninety days into the process as an object per mark, and
 * the eight weeks again for the trend, on every view; now Postgres folds the
 * days and answers one row per pupil (the flags) or per day (the trend).
 * Children on the roll only (ON_ROLL: membership ACTIVE and not left).
 */
async function pupilFolds(
  schoolId: string,
  fromKey: string,
  toKey: string,
  classId: string | null,
): Promise<{ studentMembershipId: string; marks: number; attended: number; run: number }[]> {
  return db.$tenantTransaction(async (raw) =>
    (raw as unknown as RawTx).$queryRaw<{ studentMembershipId: string; marks: number; attended: number; run: number }[]>`
      WITH days AS (
        SELECT r."studentMembershipId" AS pupil, s."dateKey" AS day,
               MAX(CASE r."status" WHEN 'ABSENT' THEN 3 WHEN 'EXCUSED' THEN 2 WHEN 'LATE' THEN 1 ELSE 0 END) AS sev
        FROM "AttendanceRecord" r
        JOIN "AttendanceSession" s ON s."id" = r."sessionId"
        JOIN "Membership" m ON m."id" = r."studentMembershipId"
        WHERE r."schoolId" = ${schoolId}
          AND s."dateKey" BETWEEN ${fromKey} AND ${toKey}
          AND r."status" IN ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED')
          AND m."status" = 'ACTIVE' AND m."leftAt" IS NULL
          AND (${classId}::text IS NULL OR s."classId" = ${classId}::text)
        GROUP BY 1, 2
      ), per AS (
        SELECT pupil, COUNT(*)::int AS marks, (COUNT(*) FILTER (WHERE sev IN (0, 1)))::int AS attended, MAX(day) FILTER (WHERE sev IN (0, 1)) AS last_in FROM days GROUP BY pupil
      )
      -- The run: ABSENT days after the last day present or late. An EXCUSED day is neither, so it is skipped, not a break.
      SELECT per.pupil AS "studentMembershipId", per.marks, per.attended,
             (SELECT COUNT(*) FROM days d WHERE d.pupil = per.pupil AND d.sev = 3 AND (per.last_in IS NULL OR d.day > per.last_in))::int AS run
      FROM per`,
  );
}

/** Pupil-days per school day, folded as pupilFolds folds them: one row per day. */
async function dayFolds(schoolId: string, fromKey: string, toKey: string): Promise<{ day: string; marks: number; attended: number }[]> {
  return db.$tenantTransaction(async (raw) =>
    (raw as unknown as RawTx).$queryRaw<{ day: string; marks: number; attended: number }[]>`
      WITH days AS (
        SELECT r."studentMembershipId" AS pupil, s."dateKey" AS day,
               MAX(CASE r."status" WHEN 'ABSENT' THEN 3 WHEN 'EXCUSED' THEN 2 WHEN 'LATE' THEN 1 ELSE 0 END) AS sev
        FROM "AttendanceRecord" r
        JOIN "AttendanceSession" s ON s."id" = r."sessionId"
        JOIN "Membership" m ON m."id" = r."studentMembershipId"
        WHERE r."schoolId" = ${schoolId}
          AND s."dateKey" BETWEEN ${fromKey} AND ${toKey}
          AND r."status" IN ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED')
          AND m."status" = 'ACTIVE' AND m."leftAt" IS NULL
        GROUP BY 1, 2
      )
      SELECT day, COUNT(*)::int AS marks, (COUNT(*) FILTER (WHERE sev IN (0, 1)))::int AS attended FROM days GROUP BY day`,
  );
}

/** Only children on the roll: membership ACTIVE and not left. Leavers and the suspended are nobody's flag. */
const ON_ROLL = { status: "ACTIVE", leftAt: null } as const;

/**
 * Every child on the roll whose last `days` of register reads below the
 * threshold, or who is absent right now and has been for three days running.
 * Scoped to one class's registers when `classId` is given. Sorted worst-first.
 */
export async function absenceFlags(
  ctx: ActiveContext,
  opts: { days?: number; classId?: string } = {},
): Promise<AbsenceFlag[]> {
  const schoolId = assertOversight(ctx);
  const days = opts.days ?? 30;
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true },
  });
  const toKey = todayKey(school.timezone);
  const fromKey = addDaysToKey(toKey, -days);

  const folds = await pupilFolds(schoolId, fromKey, toKey, opts.classId ?? null);
  if (folds.length === 0) return [];

  const flaggedIds: string[] = [];
  const computed = new Map<string, { percent: number; marks: number; run: number }>();
  for (const { studentMembershipId: membershipId, marks, attended, run } of folds) {
    // The run (counted in pupilFolds): trailing ABSENT days, newest first. An
    // EXCUSED day is neither absent nor present — the school already knows — so
    // it is skipped, not a break; a PRESENT or LATE day ends the run.
    const percent = Math.round((attended * 100) / marks);
    computed.set(membershipId, { percent, marks, run });
    const chronic = marks >= MIN_MARKS && percent < CHRONIC_THRESHOLD_PERCENT;
    const consecutive = run >= CONSECUTIVE_ABSENT;
    if (chronic || consecutive) flaggedIds.push(membershipId);
  }
  if (flaggedIds.length === 0) return [];

  const members = await db.membership.findMany({
    where: { id: { in: flaggedIds }, schoolId, ...ON_ROLL },
    select: {
      id: true,
      user: { select: { name: true, preferredName: true } },
      enrollments: {
        where: { status: "ACTIVE", ...(opts.classId ? { classId: opts.classId } : {}) },
        select: { class: { select: { name: true } } },
        take: 1,
      },
      guardianships: { where: { status: "ACTIVE" }, select: { id: true } },
    },
  });

  return members
    .map((m) => {
      const c = computed.get(m.id)!;
      return {
        studentMembershipId: m.id,
        name: m.user.preferredName ?? m.user.name,
        className: m.enrollments[0]?.class.name ?? "",
        percent: c.percent,
        marks: c.marks,
        currentRun: c.run,
        chronic: c.marks >= MIN_MARKS && c.percent < CHRONIC_THRESHOLD_PERCENT,
        consecutive: c.run >= CONSECUTIVE_ABSENT,
        guardianCount: m.guardianships.length,
      };
    })
    .sort((a, b) => a.percent - b.percent);
}

/**
 * Tell one flagged child's guardians, as a deliberate act with a person behind
 * it. Deduplicated over a week so a daily glance at the page cannot turn into
 * a daily message to a struggling family.
 */
export async function sendAbsenceAlert(
  ctx: ActiveContext,
  studentMembershipId: string,
): Promise<{ notified: number; skipped: boolean }> {
  const schoolId = assertOversight(ctx);

  const membership = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId, role: "STUDENT" },
    select: {
      id: true,
      user: { select: { name: true, preferredName: true } },
      guardianships: {
        where: { status: "ACTIVE" },
        select: { parentUserId: true },
      },
    },
  });
  if (!membership) throw new AccessError("access.pupilNotFoundInThisSchool", "NOT_FOUND");
  if (membership.guardianships.length === 0) return { notified: 0, skipped: false };
  // An adult college student's guardians are told only where ATTENDANCE is granted to them (TA-281), each on their
  // own grant (TA-555): one who was granted nothing is told nothing while another is told.
  const mayTell = new Set((await guardiansToTell([membership.id], "ATTENDANCE")).get(membership.id) ?? []);
  const guardians = membership.guardianships.filter((g) => mayTell.has(g.parentUserId));
  if (guardians.length === 0) return { notified: 0, skipped: false };

  const childName = membership.user.preferredName ?? membership.user.name;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = await db.notification.findFirst({
    where: {
      schoolId,
      kind: "ATTENDANCE",
      userId: { in: guardians.map((g) => g.parentUserId) },
      meta: { contains: `"absence:${membership.id}"` },
      createdAt: { gte: weekAgo },
    },
    select: { id: true },
  });
  if (recent) return { notified: 0, skipped: true };

  await Promise.all(
    guardians.map((g) =>
      notify({
        userId: g.parentUserId,
        schoolId,
        kind: "ATTENDANCE",
        titleKey: "notifTitle.aboutAttendance",
        titleVars: { name: childName },
        bodyKey: "notifBody.missingSchoolLately",
        bodyVars: { name: childName },
        url: "/parent/attendance",
        meta: { flag: `absence:${membership.id}` },
        text: { templateKey: "absence", vars: { child: childName }, purpose: "absence" },
      }),
    ),
  );

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "attendance.alert",
    targetType: "Membership",
    targetId: membership.id,
    meta: { guardians: guardians.length },
  });

  // The guardians actually told (TA-555): an adult's guardian without the ATTENDANCE grant was not.
  return { notified: guardians.length, skipped: false };
}

export type TrendPoint = { label: string; percent: number | null; marks: number };

/**
 * School attendance percent per week, oldest first, the last eight weeks.
 * Counts pupil-days the way the flags do: children on the roll, one mark per
 * child per day, the worse of two registers standing.
 */
export async function attendanceTrend(ctx: ActiveContext): Promise<TrendPoint[]> {
  const schoolId = assertOversight(ctx);
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true },
  });
  const toKey = todayKey(school.timezone);
  const fromKey = addDaysToKey(toKey, -7 * 8);

  // One row per school day, folded in the database (TA-505).
  const perDay = await dayFolds(schoolId, fromKey, toKey);

  const points: TrendPoint[] = [];
  for (let week = 7; week >= 0; week--) {
    const start = addDaysToKey(toKey, -7 * (week + 1));
    const end = addDaysToKey(toKey, -7 * week);
    let attended = 0;
    let marks = 0;
    for (const d of perDay) {
      if (d.day > start && d.day <= end) {
        marks += d.marks;
        attended += d.attended;
      }
    }
    points.push({
      // dd/mm, like every date — a week is named by the day it ends on.
      label: [end.slice(8, 10), end.slice(5, 7)].join("/"),
      percent: marks === 0 ? null : Math.round((attended * 100) / marks),
      marks,
    });
  }
  return points;
}
