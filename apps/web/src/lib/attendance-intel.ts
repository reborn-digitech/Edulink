import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { parentMaySee } from "./student-consent";
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

type DayStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
/** Worst first: a day on two registers takes the worse of its two marks. */
const SEVERITY: Record<DayStatus, number> = { ABSENT: 3, EXCUSED: 2, LATE: 1, PRESENT: 0 };

type MarkRow = { status: string; studentMembershipId: string; session: { dateKey: string } };

/**
 * One status per pupil per day. A child on two registers the same day — a
 * class register and a subject one — is absent once, not twice, and the
 * worse mark stands: ABSENT over EXCUSED over LATE over PRESENT.
 */
function foldDays(records: MarkRow[]): Map<string, Map<string, DayStatus>> {
  const byPupil = new Map<string, Map<string, DayStatus>>();
  for (const r of records) {
    const status = r.status as DayStatus;
    if (!(status in SEVERITY)) continue;
    const days = byPupil.get(r.studentMembershipId) ?? new Map<string, DayStatus>();
    const held = days.get(r.session.dateKey);
    if (held === undefined || SEVERITY[status] > SEVERITY[held]) days.set(r.session.dateKey, status);
    byPupil.set(r.studentMembershipId, days);
  }
  return byPupil;
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

  const records = await db.attendanceRecord.findMany({
    where: {
      schoolId,
      student: ON_ROLL,
      session: {
        dateKey: { gte: fromKey, lte: toKey },
        ...(opts.classId ? { classId: opts.classId } : {}),
      },
    },
    select: {
      status: true,
      studentMembershipId: true,
      session: { select: { dateKey: true } },
    },
  });
  if (records.length === 0) return [];

  const flaggedIds: string[] = [];
  const computed = new Map<string, { percent: number; marks: number; run: number }>();
  for (const [membershipId, byDay] of foldDays(records)) {
    const dayKeys = [...byDay.keys()].sort();
    let attended = 0;
    for (const key of dayKeys) {
      const status = byDay.get(key)!;
      if (status === "PRESENT" || status === "LATE") attended += 1;
    }
    // The run: trailing ABSENT days, newest first. An EXCUSED day is neither
    // absent nor present — the school already knows — so it is skipped, not a
    // break; a PRESENT or LATE day ends the run.
    let run = 0;
    for (let i = dayKeys.length - 1; i >= 0; i--) {
      const status = byDay.get(dayKeys[i]!)!;
      if (status === "ABSENT") run += 1;
      else if (status !== "EXCUSED") break;
    }
    const marks = dayKeys.length;
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
  // An adult college student who has not granted ATTENDANCE: their guardians are told nothing of it (TA-281).
  if (!(await parentMaySee(membership.id, "ATTENDANCE"))) return { notified: 0, skipped: false };

  const childName = membership.user.preferredName ?? membership.user.name;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = await db.notification.findFirst({
    where: {
      schoolId,
      kind: "ATTENDANCE",
      userId: { in: membership.guardianships.map((g) => g.parentUserId) },
      meta: { contains: `"absence:${membership.id}"` },
      createdAt: { gte: weekAgo },
    },
    select: { id: true },
  });
  if (recent) return { notified: 0, skipped: true };

  await Promise.all(
    membership.guardianships.map((g) =>
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
    meta: { guardians: membership.guardianships.length },
  });

  return { notified: membership.guardianships.length, skipped: false };
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

  const records = await db.attendanceRecord.findMany({
    where: { schoolId, student: ON_ROLL, session: { dateKey: { gte: fromKey, lte: toKey } } },
    select: { status: true, studentMembershipId: true, session: { select: { dateKey: true } } },
  });
  const pupilDays: { dateKey: string; status: DayStatus }[] = [];
  for (const byDay of foldDays(records).values()) {
    for (const [dateKey, status] of byDay) pupilDays.push({ dateKey, status });
  }

  const points: TrendPoint[] = [];
  for (let week = 7; week >= 0; week--) {
    const start = addDaysToKey(toKey, -7 * (week + 1));
    const end = addDaysToKey(toKey, -7 * week);
    let attended = 0;
    let marks = 0;
    for (const d of pupilDays) {
      if (d.dateKey > start && d.dateKey <= end) {
        marks += 1;
        if (d.status === "PRESENT" || d.status === "LATE") attended += 1;
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
