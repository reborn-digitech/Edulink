/**
 * The timetable, three findings of the testing analysis of 13 November 2026 (attendance-timetable batch):
 *
 *   TA-284  copyDay deleted the target day and then wrote it lesson by lesson outside a transaction, so a create that
 *           failed half-way (a teacher placed elsewhere after the busy read) left the class's day partly empty.
 *   TA-282  A cover that was declined, whose absent teacher came in after all, or that names somebody who is no longer
 *           the slot's teacher, was still drawn as the covering teacher on the dated weeks.
 *   TA-283  Lessons left in a retired period still counted as a day's lessons: on the substitution board, in the
 *           teacher's own week and in the leave desk's cover search.
 *
 * One ZZ school of this suite's own (made here, removed after). The race of TA-284 is played for real: a second
 * connection holds an uncommitted placement of the teacher at the target time while the copy runs, and commits once
 * the copy is waiting on it.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { classWeek, copyDay, teacherWeek } from "@/lib/timetable";
import { substitutionBoard } from "@/lib/substitutions";
import { coverCandidates } from "@/lib/leave";
import { addDaysToKey, todayKey, weekdayOfKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

// Under a machine shared with other runs the default five and ten seconds are not enough.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const MAIL = (who: string) => `zz-taatt-tt-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const TODAY = todayKey(TZ);

/** The next Monday-to-Friday day after today: a teaching day under the default week, and never today. */
function nextWeekday(from: string): string {
  for (let n = 1; n < 10; n += 1) {
    const day = addDaysToKey(from, n);
    const w = weekdayOfKey(day);
    if (w >= 1 && w <= 5) return day;
  }
  throw new Error("no weekday found");
}
const DAY = nextWeekday(TODAY);
const WD = weekdayOfKey(DAY);

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

async function person(who: string, role: string): Promise<string> {
  ids[who] = (await db.user.create({ data: { name: `ZZ TAATT ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role: role as never, status: "ACTIVE" }, select: { id: true } })).id;
  return ids[`${who}M`]!;
}

async function klass(name: string): Promise<string> {
  return (await db.class.create({ data: { schoolId: ids.school!, name: `ZZ TAATT ${name}`, gradeLevel: "5", joinCode: classCode() }, select: { id: true } })).id;
}

async function period(name: string, position: number, archived = false): Promise<string> {
  return (await db.timetablePeriod.create({ data: { schoolId: ids.school!, name, startMinute: 480 + position * 45, endMinute: 480 + position * 45 + 40, position, archivedAt: archived ? new Date() : null }, select: { id: true } })).id;
}

async function slot(classId: string, periodId: string, weekday: number, subject: string, teacher: string | null): Promise<string> {
  return (await db.timetableSlot.create({ data: { schoolId: ids.school!, classId, periodId, weekday, subject, teacherMembershipId: teacher }, select: { id: true } })).id;
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAATT Timetable School ${STAMP}`, slug: `zz-taatt-tt-${STAMP}`, code: `ZTT${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: TZ, isTestFixture: true },
      select: { id: true },
    })
  ).id;
  await person("admin", "ADMIN");
  await person("head", "PRINCIPAL");
  for (const t of ["x", "y", "away", "sub", "sub2", "back", "newer"]) await person(t, "TEACHER");
  ids.p1 = await period("ZZ P1", 1);
  ids.p2 = await period("ZZ P2", 2);
  ids.p3 = await period("ZZ P3", 3);
  ids.p4 = await period("ZZ P4", 4);
  ids.p8 = await period("ZZ P8 retired", 8, true);
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-taatt-tt-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
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

describe("TA-284: copying a day is all or nothing", () => {
  it("TA-284: a create that fails half-way leaves the target day as it was, or copies every lesson; never a part", async () => {
    const A = await klass("Copy A");
    const B = await klass("Copy B");
    // Monday of class A: P1 with teacher y, P2 with teacher x. Tuesday of class A holds one lesson, P3 Art.
    await slot(A, ids.p1!, 1, "ZZ Maths", ids.yM!);
    await slot(A, ids.p2!, 1, "ZZ Science", ids.xM!);
    await slot(A, ids.p3!, 2, "ZZ Art", null);
    const before = await db.timetableSlot.findMany({ where: { classId: A, weekday: 2 }, select: { periodId: true, subject: true, teacherMembershipId: true } });

    // A second admin places teacher x in class B's Tuesday P2 and has not committed when the copy reads who is busy.
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    let placed!: () => void;
    const placedYet = new Promise<void>((resolve) => (placed = resolve));
    const blocker = db.$transaction(
      async (tx) => {
        await tx.timetableSlot.create({ data: { schoolId: ids.school!, classId: B, periodId: ids.p2!, weekday: 2, subject: "ZZ Science", teacherMembershipId: ids.xM! } });
        placed();
        await gate;
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
    await placedYet;

    const admin = await as("admin", "ADMIN");
    const copy = copyDay(admin, A, 1, 2).then(
      (r) => ({ threw: false as const, result: r }),
      (e: unknown) => ({ threw: true as const, error: String(e) }),
    );
    // Long enough for the copy to reach the create that waits on the placement's uncommitted row.
    await new Promise((r) => setTimeout(r, 2_000));
    release();
    await blocker;
    await copy;

    const after = await db.timetableSlot.findMany({ where: { classId: A, weekday: 2 }, select: { periodId: true, subject: true, teacherMembershipId: true } });
    const key = (rows: { periodId: string; subject: string; teacherMembershipId: string | null }[]) => rows.map((r) => `${r.periodId}|${r.subject}|${r.teacherMembershipId ?? "-"}`).sort();
    const unchanged = JSON.stringify(key(after)) === JSON.stringify(key(before));
    const fullCopy = JSON.stringify(key(after)) === JSON.stringify(key([
      { periodId: ids.p1!, subject: "ZZ Maths", teacherMembershipId: ids.yM! },
      { periodId: ids.p2!, subject: "ZZ Science", teacherMembershipId: null },
    ]));
    expect({ after: key(after), unchangedOrWhole: unchanged || fullCopy }).toMatchObject({ unchangedOrWhole: true });
  }, 60_000);
});

describe("TA-282: who the dated week draws as covering", () => {
  it("TA-282: a declined cover under an approved leave is drawn as uncovered, not as the decliner", async () => {
    const C = await klass("Decline");
    const s = await slot(C, ids.p1!, WD, "ZZ History", ids.awayM!);
    await db.leaveRequest.create({ data: { schoolId: ids.school!, teacherMembershipId: ids.awayM!, fromDateKey: DAY, toDateKey: DAY, kind: "UNPAID", reason: "ZZ TA-282", status: "APPROVED", decidedByMembershipId: ids.headM!, decidedAt: new Date() } });
    await db.substitution.create({ data: { schoolId: ids.school!, dateKey: DAY, slotId: s, absentMembershipId: ids.awayM!, substituteMembershipId: ids.subM!, declinedAt: new Date(), declineReason: "ZZ teaching elsewhere" } });
    const head = await as("head", "PRINCIPAL");
    const week = await classWeek(head, C, { weekOf: DAY, todayKey: TODAY });
    const view = week.slots.find((v) => v.id === s)!;
    expect({ covering: view.coveringMembershipId, uncovered: view.uncovered }).toEqual({ covering: null, uncovered: true });
  });

  it("TA-282: a cover whose absent teacher is in after all on the staff register is not drawn", async () => {
    const C = await klass("Back");
    const s = await slot(C, ids.p2!, WD, "ZZ Geography", ids.backM!);
    await db.staffAttendance.create({ data: { schoolId: ids.school!, membershipId: ids.backM!, dateKey: DAY, status: "PRESENT" } });
    await db.substitution.create({ data: { schoolId: ids.school!, dateKey: DAY, slotId: s, absentMembershipId: ids.backM!, substituteMembershipId: ids.sub2M! } });
    const head = await as("head", "PRINCIPAL");
    const view = (await classWeek(head, C, { weekOf: DAY, todayKey: TODAY })).slots.find((v) => v.id === s)!;
    expect(view.coveringMembershipId).toBeNull();
  });

  it("TA-282: a cover that names somebody who is no longer the slot's teacher is not drawn", async () => {
    const C = await klass("Changed");
    const s = await slot(C, ids.p3!, WD, "ZZ Music", ids.newerM!);
    await db.substitution.create({ data: { schoolId: ids.school!, dateKey: DAY, slotId: s, absentMembershipId: ids.backM!, substituteMembershipId: ids.sub2M! } });
    const head = await as("head", "PRINCIPAL");
    const view = (await classWeek(head, C, { weekOf: DAY, todayKey: TODAY })).slots.find((v) => v.id === s)!;
    expect(view.coveringMembershipId).toBeNull();
  });
});

describe("TA-283: a lesson left in a retired period", () => {
  it("TA-283: is not on the board, not in the teacher's own week and not in the leave desk's lesson count", async () => {
    const R = await klass("Retired");
    const live = await slot(R, ids.p4!, WD, "ZZ English", ids.awayM!);
    const retired = await slot(R, ids.p8!, WD, "ZZ Old Eighth", ids.awayM!);
    // The teacher is away on DAY (TA-282's approved leave of the same day, made above or here).
    const leave = await db.leaveRequest.findFirst({ where: { schoolId: ids.school!, teacherMembershipId: ids.awayM!, fromDateKey: DAY } });
    if (!leave) await db.leaveRequest.create({ data: { schoolId: ids.school!, teacherMembershipId: ids.awayM!, fromDateKey: DAY, toDateKey: DAY, kind: "UNPAID", reason: "ZZ TA-283", status: "APPROVED", decidedByMembershipId: ids.headM!, decidedAt: new Date() } });

    const head = await as("head", "PRINCIPAL");
    const board = await substitutionBoard(head, DAY);
    const slotIds = board.lessons.map((l) => l.slotId);
    expect(slotIds).toContain(live);
    expect(slotIds).not.toContain(retired);

    const away = await as("away", "TEACHER");
    const own = await teacherWeek(away, ids.awayM!, { weekOf: DAY, todayKey: TODAY });
    expect(own.slots.map((v) => v.id)).toContain(live);
    expect(own.slots.map((v) => v.id)).not.toContain(retired);

    const headAgain = await as("head", "PRINCIPAL");
    const suggestions = await coverCandidates(headAgain, ids.awayM!, DAY, DAY);
    const counted = suggestions.groups.filter((g) => g.classId === R).map((g) => g.subject).sort();
    expect(counted).toEqual(["ZZ English"]);
  });
});
