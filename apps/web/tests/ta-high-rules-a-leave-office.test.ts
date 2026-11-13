/**
 * TA-001, the other half: once an approved leave has begun, its applicant may not withdraw it (the copied suite
 * tests/ta-leave-withdrawn-after-days.test.ts holds a leave wholly past); the head or the office still may, and then
 * only what lies ahead is released: a cover of past days is kept (one that straddles today now ends yesterday), a
 * substitution of a past day is kept, and the head's pages are told. A leave still wholly ahead is the applicant's to
 * withdraw as before.
 *
 * One ZZ school of this suite's own (made here, removed after): a head, an admin, the applicant and the colleague who
 * covers. The leave runs from two days before today to two days after, by the school's own clock.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { cancelLeave } from "@/lib/leave";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const MAIL = (who: string) => `zz-tahra-${who}-${STAMP}@test.invalid`;
const TODAY = todayKey(TZ);
const FROM = addDaysToKey(TODAY, -2);
const TO = addDaysToKey(TODAY, 2);
const ids: Record<string, string> = {};

function ctx(who: string, role: string): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: ids[`${who}M`]!,
    schoolId: ids.school!,
    role: role as ActiveContext["role"],
    user: {
      id: ids[who]!,
      name: `ZZ TAHRA ${who}`,
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

async function approvedLeave(from: string, to: string): Promise<string> {
  const S = ids.school!;
  const leave = await db.leaveRequest.create({
    data: { schoolId: S, teacherMembershipId: ids.applicantM!, fromDateKey: from, toDateKey: to, kind: "UNPAID", reason: "ZZ TA-001 office case", status: "APPROVED", decidedByMembershipId: ids.headM!, decidedAt: new Date() },
    select: { id: true },
  });
  await db.attendanceCover.create({ data: { schoolId: S, classId: ids.klass!, coveringMembershipId: ids.coverM!, fromDateKey: from, toDateKey: to, reason: "Leave", createdByMembershipId: ids.headM!, leaveRequestId: leave.id } });
  return leave.id;
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAHRA Leave School ${STAMP}`, slug: `zz-tahra-${STAMP}`, code: `ZTHR${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: TZ, isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  for (const [who, role] of [["admin", "ADMIN"], ["head", "PRINCIPAL"], ["applicant", "TEACHER"], ["cover", "TEACHER"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TAHRA ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: S, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  ids.klass = (await db.class.create({ data: { schoolId: S, name: "ZZ TAHRA 6B", gradeLevel: "6", joinCode: classCode() }, select: { id: true } })).id;
  const period = await db.timetablePeriod.create({ data: { schoolId: S, name: "ZZ P1", startMinute: 540, endMinute: 585, position: 1 }, select: { id: true } });
  ids.slot = (await db.timetableSlot.create({ data: { schoolId: S, classId: ids.klass, periodId: period.id, weekday: 1, subject: "ZZ Science", teacherMembershipId: ids.applicantM! }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-tahra-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-001: an approved leave that has begun", () => {
  it("TA-001: the applicant cannot withdraw it while it is still running", async () => {
    const leaveId = await approvedLeave(FROM, TO);
    const result = await cancelLeave(ctx("applicant", "TEACHER"), leaveId);
    expect(result).toEqual({ ok: false, errorKey: "leaveKind.alreadyBegun" });
    expect((await db.leaveRequest.findUniqueOrThrow({ where: { id: leaveId }, select: { status: true } })).status).toBe("APPROVED");
    expect(await db.attendanceCover.count({ where: { leaveRequestId: leaveId } })).toBe(1);
    await db.attendanceCover.deleteMany({ where: { leaveRequestId: leaveId } });
    await db.leaveRequest.delete({ where: { id: leaveId } });
  });

  it("TA-001: the office may, and releases only what lies ahead; the head is told", async () => {
    const leaveId = await approvedLeave(FROM, TO);
    const S = ids.school!;
    for (const dateKey of [FROM, TODAY, TO]) {
      await db.substitution.create({ data: { schoolId: S, dateKey, slotId: ids.slot!, absentMembershipId: ids.applicantM!, substituteMembershipId: ids.coverM!, createdByUserId: ids.admin! } });
    }
    await db.notification.deleteMany({ where: { userId: { in: [ids.head!, ids.admin!, ids.cover!] } } });

    expect(await cancelLeave(ctx("admin", "ADMIN"), leaveId)).toEqual({ ok: true });

    expect((await db.leaveRequest.findUniqueOrThrow({ where: { id: leaveId }, select: { status: true } })).status).toBe("CANCELLED");
    const covers = await db.attendanceCover.findMany({ where: { leaveRequestId: leaveId }, select: { fromDateKey: true, toDateKey: true } });
    expect(covers).toEqual([{ fromDateKey: FROM, toDateKey: addDaysToKey(TODAY, -1) }]);
    const lessons = await db.substitution.findMany({ where: { schoolId: S, absentMembershipId: ids.applicantM! }, select: { dateKey: true } });
    expect(lessons.map((l) => l.dateKey)).toEqual([FROM]);

    const headTold = await db.notification.findMany({ where: { userId: ids.head!, schoolId: S }, select: { title: true } });
    expect(headTold.map((n) => n.title)).toEqual(["Approved leave withdrawn"]);
    // Whoever withdrew it is not told of their own act.
    expect(await db.notification.count({ where: { userId: ids.admin!, schoolId: S } })).toBe(0);
    await db.substitution.deleteMany({ where: { schoolId: S, absentMembershipId: ids.applicantM! } });
  });

  it("TA-001: a leave still wholly ahead is the applicant's to withdraw, with its cover", async () => {
    const leaveId = await approvedLeave(addDaysToKey(TODAY, 5), addDaysToKey(TODAY, 6));
    expect(await cancelLeave(ctx("applicant", "TEACHER"), leaveId)).toEqual({ ok: true });
    expect(await db.attendanceCover.count({ where: { leaveRequestId: leaveId } })).toBe(0);
  });
});
