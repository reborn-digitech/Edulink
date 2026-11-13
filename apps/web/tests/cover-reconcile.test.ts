/**
 * Two cover models, one absence. The timetable grid reads `AttendanceCover`
 * (register duty, written when leave is approved) and the substitution board
 * reads `Substitution` (a lesson handed to somebody on a day). This suite
 * pins what keeps them in step: cancelling an approved leave removes both
 * kinds and tells the substitute; a register mark of PRESENT, LATE or
 * HALF_DAY takes a teacher on approved leave off the board; the grid shows
 * the board's substitute ahead of the register-duty cover; and "my covers"
 * hides a cover whose absence is gone, and everything on a closed day.
 *
 * Every date is pinned to one week, Monday to Friday, so nothing here depends
 * on the weekday the suite runs. The week is the first whose Monday is at
 * least fourteen days ahead (it was 2026-10-05): the applicant may withdraw an
 * approved leave only before its first day (TA-001), so the leave cancelled
 * below must still lie ahead. The school teaches Monday to Saturday.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { applyForLeave, cancelLeave, decideLeave } from "@/lib/leave";
import { assignSubstitute, myCovers, substitutionBoard } from "@/lib/substitutions";
import { classWeek } from "@/lib/timetable";
import { AccessError } from "@/lib/tenancy";
import { addDaysToKey, todayKey, weekdayOfKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const AHEAD = addDaysToKey(todayKey("Asia/Kolkata"), 14);
const MON = addDaysToKey(AHEAD, (8 - weekdayOfKey(AHEAD)) % 7);
const TUE = addDaysToKey(MON, 1);
const WED = addDaysToKey(MON, 2);
const THU = addDaysToKey(MON, 3);
const FRI = addDaysToKey(MON, 4);

let schoolId = "";
let classId = "";
let admin: ActiveContext;
let principal: ActiveContext;
let asha: ActiveContext; // the teacher who is away
let bhavna: ActiveContext; // the substitute the board names
let ashaId = "";
let bhavnaId = "";
let chetanId = ""; // the register-duty cover leave approval names
let bhavnaUserId = "";
const slotByDay = new Map<number, string>(); // weekday -> Asha's lesson on class 7A
let secondWedSlot = "";

function ctx(over: { userId: string; membershipId: string; role: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId,
    schoolId,
    role: over.role as ActiveContext["role"],
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  } as ActiveContext;
}

async function approvedLeave(from: string, to: string, coverMembershipId: string | null) {
  const applied = await applyForLeave(asha, { fromDateKey: from, toDateKey: to, kind: "SICK", reason: "Cover reconcile test" });
  expect(applied.ok).toBe(true);
  const row = await db.leaveRequest.findFirstOrThrow({ where: { teacherMembershipId: ashaId, status: "PENDING" }, select: { id: true } });
  const decided = await decideLeave(principal, row.id, "APPROVED", { coverMembershipId });
  expect(decided.ok).toBe(true);
  return row.id;
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Cover Reconcile ${STAMP}`, slug: `zz-cover-${STAMP}`, code: `ZC${suffix}`, contactEmail: `zz-cover-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", teachingDays: "1,2,3,4,5,6" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Cover ${who}`, email: `zz-cover-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, p, ta, tb, tc] = await Promise.all([mk("Admin"), mk("Principal"), mk("Asha"), mk("Bhavna"), mk("Chetan")]);
  bhavnaUserId = tb.id;
  const member = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } });
  const [ma, mp, mta, mtb, mtc] = await Promise.all([member(a.id, "ADMIN"), member(p.id, "PRINCIPAL"), member(ta.id, "TEACHER"), member(tb.id, "TEACHER"), member(tc.id, "TEACHER")]);
  ashaId = mta.id;
  bhavnaId = mtb.id;
  chetanId = mtc.id;
  admin = ctx({ userId: a.id, membershipId: ma.id, role: "ADMIN" });
  principal = ctx({ userId: p.id, membershipId: mp.id, role: "PRINCIPAL" });
  asha = ctx({ userId: ta.id, membershipId: ashaId, role: "TEACHER" });
  bhavna = ctx({ userId: tb.id, membershipId: bhavnaId, role: "TEACHER" });

  classId = (await db.class.create({ data: { schoolId, name: "ZZ 7A", gradeLevel: "7", joinCode: `ZC1${suffix}` }, select: { id: true } })).id;
  // Asha marks 7A's register, so approving her leave arranges register duty for the cover.
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: ashaId, role: "LEAD", canTakeAttendance: true } });
  const [p1, p2] = await Promise.all([
    db.timetablePeriod.create({ data: { schoolId, name: "ZZ P1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1 }, select: { id: true } }),
    db.timetablePeriod.create({ data: { schoolId, name: "ZZ P2", startMinute: 585, endMinute: 630, kind: "LESSON", position: 2 }, select: { id: true } }),
  ]);
  for (const weekday of [1, 2, 3, 4, 5]) {
    const slot = await db.timetableSlot.create({ data: { schoolId, classId, periodId: p1.id, weekday, subject: "Mathematics", teacherMembershipId: ashaId }, select: { id: true } });
    slotByDay.set(weekday, slot.id);
  }
  secondWedSlot = (await db.timetableSlot.create({ data: { schoolId, classId, periodId: p2.id, weekday: 3, subject: "English", teacherMembershipId: ashaId }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("cancelling an approved leave", () => {
  it("removes the register-duty cover AND the board's rows for the leave's days, tells the substitute, and leaves another absence's rows alone", async () => {
    const leaveId = await approvedLeave(MON, TUE, chetanId);
    expect(await db.attendanceCover.count({ where: { leaveRequestId: leaveId } })).toBe(1);
    // The board lists Asha on both days; the office hands Monday's lesson to Bhavna.
    expect((await substitutionBoard(admin, MON)).absent.map((r) => r.membershipId)).toEqual([ashaId]);
    expect(await assignSubstitute(admin, { dateKey: MON, slotId: slotByDay.get(1)!, substituteMembershipId: bhavnaId })).toEqual({ changed: true });
    // A separate absence: the register says ABSENT on Friday, outside the leave, and Bhavna takes that too.
    await db.staffAttendance.create({ data: { schoolId, membershipId: ashaId, dateKey: FRI, status: "ABSENT", source: "OFFICE", markedByUserId: admin.user.id } });
    expect(await assignSubstitute(admin, { dateKey: FRI, slotId: slotByDay.get(5)!, substituteMembershipId: bhavnaId })).toEqual({ changed: true });
    await db.notification.deleteMany({ where: { userId: bhavnaUserId } });

    expect((await cancelLeave(asha, leaveId)).ok).toBe(true);

    expect(await db.attendanceCover.count({ where: { leaveRequestId: leaveId } })).toBe(0);
    const left = await db.substitution.findMany({ where: { schoolId, absentMembershipId: ashaId }, select: { dateKey: true } });
    expect(left.map((r) => r.dateKey)).toEqual([FRI]);
    expect((await myCovers(bhavna, MON)).items).toEqual([]);
    expect((await substitutionBoard(admin, MON)).absent).toEqual([]);
    const told = await db.notification.findMany({ where: { userId: bhavnaUserId, schoolId }, select: { kind: true, meta: true } });
    expect(told).toHaveLength(1);
    expect(told[0]!.meta).toContain(slotByDay.get(1)!);
  });
});

describe("the register's word on the board", () => {
  it("a PRESENT, LATE or HALF_DAY mark takes a teacher on approved leave off the board; ABSENT and ON_LEAVE keep them on it", async () => {
    await approvedLeave(TUE, TUE, null);
    expect((await substitutionBoard(admin, TUE)).absent.map((r) => r.membershipId)).toEqual([ashaId]);

    const mark = (status: string) =>
      db.staffAttendance.upsert({
        where: { membershipId_dateKey: { membershipId: ashaId, dateKey: TUE } },
        create: { schoolId, membershipId: ashaId, dateKey: TUE, status, source: "OFFICE", markedByUserId: admin.user.id },
        update: { status },
      });
    for (const status of ["PRESENT", "LATE", "HALF_DAY"]) {
      await mark(status);
      const board = await substitutionBoard(admin, TUE);
      expect(board.absent, status).toEqual([]);
      expect(board.lessons, status).toEqual([]);
      await expect(assignSubstitute(admin, { dateKey: TUE, slotId: slotByDay.get(2)!, substituteMembershipId: bhavnaId })).rejects.toBeInstanceOf(AccessError);
    }
    await mark("ON_LEAVE");
    expect((await substitutionBoard(admin, TUE)).absent[0]).toMatchObject({ membershipId: ashaId, reason: "ON_LEAVE" });
    await mark("ABSENT");
    expect((await substitutionBoard(admin, TUE)).absent[0]).toMatchObject({ membershipId: ashaId, reason: "ABSENT" });
  });
});

describe("the timetable grid", () => {
  it("shows the board's substitute on the lesson it names, and the register-duty cover on the lessons it does not", async () => {
    await approvedLeave(WED, WED, chetanId);
    expect(await assignSubstitute(admin, { dateKey: WED, slotId: slotByDay.get(3)!, substituteMembershipId: bhavnaId })).toEqual({ changed: true });

    const grid = await classWeek(admin, classId, { weekOf: MON });
    const named = grid.slots.find((s) => s.id === slotByDay.get(3));
    const other = grid.slots.find((s) => s.id === secondWedSlot);
    expect(named).toMatchObject({ coveringMembershipId: bhavnaId, coveringName: "ZZ Cover Bhavna", uncovered: false });
    expect(other).toMatchObject({ coveringMembershipId: chetanId, coveringName: "ZZ Cover Chetan", uncovered: false });
    // Monday's lesson: the leave was cancelled, so nobody covers and nothing is uncovered.
    expect(grid.slots.find((s) => s.id === slotByDay.get(1))).toMatchObject({ coveringMembershipId: null, uncovered: false });
  });
});

describe("my covers", () => {
  it("hides a cover whose absent teacher is not away after all, and everything on a closed day", async () => {
    // Thursday: an ABSENT mark, a cover, and then the office corrects the mark to PRESENT.
    await db.staffAttendance.create({ data: { schoolId, membershipId: ashaId, dateKey: THU, status: "ABSENT", source: "OFFICE", markedByUserId: admin.user.id } });
    expect(await assignSubstitute(admin, { dateKey: THU, slotId: slotByDay.get(4)!, substituteMembershipId: bhavnaId })).toEqual({ changed: true });
    expect((await myCovers(bhavna, THU)).items.map((i) => i.slotId)).toEqual([slotByDay.get(4)]);
    await db.staffAttendance.update({ where: { membershipId_dateKey: { membershipId: ashaId, dateKey: THU } }, data: { status: "PRESENT" } });
    expect((await myCovers(bhavna, THU)).items).toEqual([]);

    // Friday's cover from the first test still stands, until the day is closed.
    expect((await myCovers(bhavna, FRI)).items.map((i) => i.slotId)).toEqual([slotByDay.get(5)]);
    await db.holiday.create({ data: { schoolId, name: "ZZ Closed", startDateKey: FRI, endDateKey: FRI } });
    expect((await myCovers(bhavna, FRI)).items).toEqual([]);
  });
});
