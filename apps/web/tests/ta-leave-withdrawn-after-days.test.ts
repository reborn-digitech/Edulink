/**
 * TA-001 (testing analysis of 13 November 2026, High): an approved leave can be
 * withdrawn by its applicant after the days have passed.
 *
 * `cancelLeave` (src/lib/leave.ts) asks who is calling and whether the request
 * is already closed, and never compares the leave's days with today. So a
 * teacher whose UNPAID leave was approved and taken presses Withdraw the day
 * after: the request becomes CANCELLED, the rows that say who marked their
 * register and who took their lesson are deleted, and every reader of
 * "APPROVED leave" forgets the days: the staff register no longer derives
 * ON_LEAVE for them and the month's payroll draft pays them.
 *
 * One ZZ school of this suite's own (made here, removed after), with payroll
 * on: an applicant, the colleague who covered, a head and an admin. The leave
 * is two working days that ended at least two days ago by the school's own
 * clock, written as the rows an approval made before those days leaves behind.
 * The arrangement and the one act happen once; each consequence the finding
 * names is its own case, so a run shows which of them hold.
 *
 * EXPECTED ONCE FIXED (any shape the entry names): the applicant's withdrawal
 * of a leave whose days are past is refused — an `ok: false` or a thrown
 * AccessError / RuleRefusal — and nothing below moves.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { cancelLeave } from "@/lib/leave";
import { staffMonth, staffRegister } from "@/lib/staff-attendance";
import { draftRun, saveSalary, saveStructure } from "@/lib/payroll";
import { addDaysToKey, todayKey, weekdayOfKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const MAIL = (who: string) => `zz-ta001-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

/**
 * Two consecutive days, Monday to Friday, in one month, the later of them at
 * least two days before today in the school's zone: wholly past whatever the
 * hour the suite runs at, working days under any teaching week a school keeps,
 * and one payroll month.
 */
function pastWorkingPair(today: string): { from: string; to: string } {
  for (let back = 2; back < 40; back += 1) {
    const to = addDaysToKey(today, -back);
    const from = addDaysToKey(to, -1);
    const weekdays = [weekdayOfKey(from), weekdayOfKey(to)];
    if (weekdays.every((d) => d >= 1 && d <= 5) && from.slice(0, 7) === to.slice(0, 7)) return { from, to };
  }
  throw new Error("no pair of past working days found");
}

const TODAY = todayKey(TZ);
const { from: FROM, to: TO } = pastWorkingPair(TODAY);
const MONTH = TO.slice(0, 7);

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

type State = {
  status: string;
  covers: number;
  substitutions: number;
  registerFrom: string | null;
  registerTo: string | null;
  monthOnLeave: number;
  monthUnmarked: number;
  lopDays: number;
};

/** What the school's own readers say about the two days, read through the library as the office reads it. */
async function readState(): Promise<State> {
  const row = await db.leaveRequest.findUniqueOrThrow({ where: { id: ids.leave! }, select: { status: true } });
  const covers = await db.attendanceCover.count({ where: { schoolId: ids.school!, leaveRequestId: ids.leave! } });
  const substitutions = await db.substitution.count({ where: { schoolId: ids.school!, absentMembershipId: ids.applicantM!, dateKey: { gte: FROM, lte: TO } } });
  const admin = await as("admin", "ADMIN");
  const statusOn = async (day: string) => (await staffRegister(admin, day)).rows.find((r) => r.membershipId === ids.applicantM)?.status ?? null;
  const registerFrom = await statusOn(FROM);
  const registerTo = await statusOn(TO);
  const month = (await staffMonth(admin, MONTH)).rows.find((r) => r.membershipId === ids.applicantM);
  const run = await draftRun(admin, MONTH);
  const slip = run.slips?.find((s) => s.membershipId === ids.applicantM);
  if (!month || !slip) throw new Error("the applicant is missing from the staff month or the payroll draft");
  return { status: row.status, covers, substitutions, registerFrom, registerTo, monthOnLeave: month.onLeave, monthUnmarked: month.unmarked, lopDays: slip.lopDays };
}

let before: State;
let after: State;
let outcome: { refused: boolean; said: string };

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA001 Leave School ${STAMP}`, slug: `zz-ta001-${STAMP}`, code: `ZTA1${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: TZ, isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  await db.schoolModule.create({ data: { schoolId: S, module: "PAYROLL" } });
  for (const [who, role] of [["admin", "ADMIN"], ["head", "PRINCIPAL"], ["applicant", "TEACHER"], ["cover", "TEACHER"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA001 ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: S, role, status: "ACTIVE" }, select: { id: true } })).id;
  }

  // The applicant's class and one lesson of theirs on the leave's last day.
  ids.klass = (await db.class.create({ data: { schoolId: S, name: "ZZ TA001 5A", gradeLevel: "5", joinCode: classCode() }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId: S, classId: ids.klass, teacherMembershipId: ids.applicantM!, role: "LEAD", canTakeAttendance: true } });
  ids.period = (await db.timetablePeriod.create({ data: { schoolId: S, name: "ZZ P1", startMinute: 540, endMinute: 585, position: 1 }, select: { id: true } })).id;
  ids.slot = (
    await db.timetableSlot.create({ data: { schoolId: S, classId: ids.klass, periodId: ids.period, weekday: weekdayOfKey(TO), subject: "ZZ Science", teacherMembershipId: ids.applicantM! }, select: { id: true } })
  ).id;

  // The salary the month's draft pays from.
  const admin = await as("admin", "ADMIN");
  const structure = await saveStructure(admin, { name: "ZZ TA001 Teaching", components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }] });
  await saveSalary(admin, { membershipId: ids.applicantM!, structureId: structure.id, effectiveFrom: "2026-04-01", basicPaise: 3_000_000, overrides: {}, pfUan: "", esiNumber: "", pan: "", bankAccount: "", bankIfsc: "", bankName: "", paymentMode: "CASH" });

  // The leave as an approval made before its days leaves it: APPROVED, the register's cover for both days, and the
  // colleague who took the lesson on the last day.
  const decidedAt = new Date(new Date(`${FROM}T00:00:00+05:30`).getTime() - 2 * 86_400_000);
  ids.leave = (
    await db.leaveRequest.create({
      data: { schoolId: S, teacherMembershipId: ids.applicantM!, fromDateKey: FROM, toDateKey: TO, kind: "UNPAID", reason: "ZZ TA-001 family matter", status: "APPROVED", nominatedCoverMembershipId: ids.coverM!, decidedByMembershipId: ids.headM!, decidedAt, createdAt: new Date(decidedAt.getTime() - 86_400_000) },
      select: { id: true },
    })
  ).id;
  await db.attendanceCover.create({ data: { schoolId: S, classId: ids.klass, coveringMembershipId: ids.coverM!, fromDateKey: FROM, toDateKey: TO, reason: "Leave", createdByMembershipId: ids.headM!, leaveRequestId: ids.leave } });
  await db.substitution.create({ data: { schoolId: S, dateKey: TO, slotId: ids.slot, absentMembershipId: ids.applicantM!, substituteMembershipId: ids.coverM!, createdByUserId: ids.admin!, acknowledgedAt: decidedAt } });

  before = await readState();

  // THE ACT: the applicant, in their own session, withdraws the leave after its days.
  const applicant = await as("applicant", "TEACHER");
  try {
    const result = await cancelLeave(applicant, ids.leave);
    outcome = { refused: result.ok === false, said: result.ok ? "ok: true" : `ok: false (${result.errorKey ?? "no key"})` };
  } catch (error) {
    if (!(error instanceof AccessError) && !(error instanceof RuleRefusal)) throw error;
    outcome = { refused: true, said: `threw ${error.name}` };
  }

  after = await readState();
}, 120_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { endsWith: `-${STAMP}@test.invalid`, startsWith: "zz-ta001-" } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-001: an approved leave whose days have passed", () => {
  it("the arrangement: two past working days of approved unpaid leave, covered, on leave in the register and unpaid in the draft", () => {
    expect(TO < TODAY).toBe(true);
    expect(before).toEqual({ status: "APPROVED", covers: 1, substitutions: 1, registerFrom: "ON_LEAVE", registerTo: "ON_LEAVE", monthOnLeave: 2, monthUnmarked: before.monthUnmarked, lopDays: 2 });
  });

  it("⚠ is not the applicant's to withdraw: the call is refused", () => {
    expect(outcome, `cancelLeave by the applicant, for ${FROM} to ${TO} with today ${TODAY}, answered ${outcome.said}`).toMatchObject({ refused: true });
  });

  it("⚠ stays APPROVED", () => {
    expect(after.status).toBe("APPROVED");
  });

  it("⚠ keeps the record of who covered: the register's cover and the lesson's substitution are still there", () => {
    expect({ covers: after.covers, substitutions: after.substitutions }).toEqual({ covers: 1, substitutions: 1 });
  });

  it("⚠ still reads as on leave in the staff register and in the staff month", () => {
    expect({ registerFrom: after.registerFrom, registerTo: after.registerTo, monthOnLeave: after.monthOnLeave, monthUnmarked: after.monthUnmarked }).toEqual({
      registerFrom: "ON_LEAVE",
      registerTo: "ON_LEAVE",
      monthOnLeave: 2,
      monthUnmarked: before.monthUnmarked,
    });
  });

  it("⚠ still costs its two unpaid days in the month's payroll draft", () => {
    expect(after.lopDays).toBe(2);
  });
});
