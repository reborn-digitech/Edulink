/**
 * QA-16 (QA campaign of 24 October 2026, E2E-A7): the office and the head
 * naming two different teachers for one uncovered lesson at the same moment
 * were both answered `changed: true`, both teachers were told to cover it,
 * both audits said `replaced: false`, and one row was stored. The teacher
 * whose row was overwritten was never told they were not needed. The clash
 * check (one teacher, two lessons of one period) was read-then-write too.
 *
 * Now the slot row is locked and the substitute's day is serialised inside a
 * $tenantTransaction, and `existing` and the clash are read under the locks.
 * A board that says what it saw (`replacing`, null for an uncovered lesson)
 * has the second press refused 409 naming who covers; a caller that says
 * nothing replaces, and the person replaced is released and told.
 *
 * At a ZZ school of this suite's own (people at @test.invalid), deleted by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { assignSubstitute } from "@/lib/substitutions";
import { addDaysToKey, todayKey, weekdayOfKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const ids = { school: "", admin: "", adminM: "", head: "", headM: "", period: "", period2: "", klassA: "", klassB: "", klassC: "" };
const teachers: Record<"away1" | "away2" | "away3" | "anjum" | "arjun" | "third", { userId: string; membershipId: string }> = {} as never;
let dayKey = "";

function ctx(userId: string, membershipId: string, role: "ADMIN" | "PRINCIPAL"): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId: ids.school,
    role,
    user: { id: userId, name: "ZZ Cover Race", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: false, email: false }, quietHours: null } as never },
  };
}
const office = () => ctx(ids.admin, ids.adminM, "ADMIN");
const head = () => ctx(ids.head, ids.headM, "PRINCIPAL");

async function slot(classId: string, periodId: string, teacher: string, subject: string): Promise<string> {
  return (await db.timetableSlot.create({ data: { schoolId: ids.school, classId, periodId, weekday: weekdayOfKey(dayKey), subject, teacherMembershipId: teacher }, select: { id: true } })).id;
}
const told = (userId: string, titleKey: string) => db.notification.count({ where: { userId, titleKey } });

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Cover Race ${STAMP}`, slug: `zz-cover-race-${STAMP}`, code: `ZCR${SUFFIX}`, contactEmail: `zz-cover-race-${STAMP}@test.invalid`, timezone: TZ, locale: "en", verifiedAt: new Date(), gradeLow: "1", gradeHigh: "10" }, select: { id: true } })).id;
  const person = async (who: string, role: "ADMIN" | "PRINCIPAL" | "TEACHER") => {
    const userId = (await db.user.create({ data: { name: `ZZ Cover ${who}`, email: `zz-cover-race-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    const membershipId = (await db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } })).id;
    return { userId, membershipId };
  };
  const a = await person("Admin", "ADMIN");
  const h = await person("Head", "PRINCIPAL");
  [ids.admin, ids.adminM, ids.head, ids.headM] = [a.userId, a.membershipId, h.userId, h.membershipId];
  teachers.away1 = await person("Farida", "TEACHER");
  teachers.away2 = await person("Away2", "TEACHER");
  teachers.away3 = await person("Away3", "TEACHER");
  teachers.anjum = await person("Anjum", "TEACHER");
  teachers.arjun = await person("Arjun", "TEACHER");
  teachers.third = await person("Third", "TEACHER");
  // The next Monday: a teaching day of the default week, whatever day the suite runs.
  let key = addDaysToKey(todayKey(TZ), 1);
  while (weekdayOfKey(key) !== 1) key = addDaysToKey(key, 1);
  dayKey = key;
  ids.period = (await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "Period 2", startMinute: 600, endMinute: 645, position: 2 }, select: { id: true } })).id;
  ids.period2 = (await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "Period 3", startMinute: 645, endMinute: 690, position: 3 }, select: { id: true } })).id;
  ids.klassA = (await db.class.create({ data: { schoolId: ids.school, name: "Grade 6 · A", gradeLevel: "6", joinCode: `ZCA${SUFFIX}` }, select: { id: true } })).id;
  ids.klassB = (await db.class.create({ data: { schoolId: ids.school, name: "Grade 6 · B", gradeLevel: "6", joinCode: `ZCB${SUFFIX}` }, select: { id: true } })).id;
  ids.klassC = (await db.class.create({ data: { schoolId: ids.school, name: "Grade 7 · A", gradeLevel: "7", joinCode: `ZCC${SUFFIX}` }, select: { id: true } })).id;
  for (const away of [teachers.away1, teachers.away2, teachers.away3]) {
    await db.staffAttendance.create({ data: { schoolId: ids.school, membershipId: away.membershipId, dateKey: dayKey, status: "ABSENT" } });
  }
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { user: { email: { contains: `-${STAMP}@test.invalid` } } }] } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  expect(await db.school.count({ where: { id: ids.school } })).toBe(0);
  expect(await db.user.count({ where: { email: { contains: `-${STAMP}@test.invalid` } } })).toBe(0);
  await db.$disconnect();
});

describe("QA-16: two people name two substitutes for one lesson at once", () => {
  it("the board's two presses (each saying the lesson was uncovered): one stored, the other refused naming who covers", async () => {
    const slotId = await slot(ids.klassA, ids.period, teachers.away1.membershipId, "English");
    const results = await Promise.allSettled([
      assignSubstitute(office(), { dateKey: dayKey, slotId, substituteMembershipId: teachers.anjum.membershipId, replacing: null }),
      assignSubstitute(head(), { dateKey: dayKey, slotId, substituteMembershipId: teachers.arjun.membershipId, replacing: null }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const refused = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(refused).toHaveLength(1);
    expect(String(refused[0]!.reason)).toContain("substitutions.changedMeanwhile");
    const rows = await db.substitution.findMany({ where: { slotId, dateKey: dayKey }, select: { substituteMembershipId: true } });
    expect(rows).toHaveLength(1);
    const kept = rows[0]!.substituteMembershipId === teachers.anjum.membershipId ? teachers.anjum : teachers.arjun;
    const lost = kept === teachers.anjum ? teachers.arjun : teachers.anjum;
    // The refusal names the person who covers.
    expect((refused[0]!.reason as { vars?: { name?: string } }).vars?.name).toBe(kept === teachers.anjum ? "ZZ Cover Anjum" : "ZZ Cover Arjun");
    expect(await told(kept.userId, "notifTitle.coverAssigned")).toBe(1);
    expect(await told(lost.userId, "notifTitle.coverAssigned")).toBe(0);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "substitutions.assign", targetId: slotId } })).toBe(1);
  });

  it("a caller that says nothing of what it saw: the later press replaces, and the person replaced is released and told", async () => {
    const slotId = await slot(ids.klassA, ids.period2, teachers.away1.membershipId, "Mathematics");
    const results = await Promise.allSettled([
      assignSubstitute(office(), { dateKey: dayKey, slotId, substituteMembershipId: teachers.anjum.membershipId }),
      assignSubstitute(head(), { dateKey: dayKey, slotId, substituteMembershipId: teachers.arjun.membershipId }),
    ]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const row = await db.substitution.findUniqueOrThrow({ where: { slotId_dateKey: { slotId, dateKey: dayKey } }, select: { substituteMembershipId: true } });
    const kept = row.substituteMembershipId === teachers.anjum.membershipId ? teachers.anjum : teachers.arjun;
    const lost = kept === teachers.anjum ? teachers.arjun : teachers.anjum;
    const audits = await db.auditLog.findMany({ where: { schoolId: ids.school, action: "substitutions.assign", targetId: slotId }, select: { meta: true } });
    expect(audits).toHaveLength(2);
    const replaced = audits.map((a) => JSON.parse(String(a.meta)).replaced as boolean).sort();
    expect(replaced).toEqual([false, true]);
    // The one whose cover was overwritten is released; the one who stands in is not.
    const releasedMeta = await db.notification.findMany({ where: { titleKey: "notifTitle.coverReleased", userId: { in: [kept.userId, lost.userId] }, meta: { contains: slotId } }, select: { userId: true } });
    expect(releasedMeta.map((n) => n.userId)).toEqual([lost.userId]);
  });

  it("one teacher named for two lessons of one period by two people at once: one stored, the other refused as a clash", async () => {
    const lesson1 = await slot(ids.klassB, ids.period, teachers.away2.membershipId, "Science");
    const target2 = await slot(ids.klassC, ids.period, teachers.away3.membershipId, "History");
    const results = await Promise.allSettled([
      assignSubstitute(office(), { dateKey: dayKey, slotId: lesson1, substituteMembershipId: teachers.third.membershipId, replacing: null }),
      assignSubstitute(head(), { dateKey: dayKey, slotId: target2, substituteMembershipId: teachers.third.membershipId, replacing: null }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const refused = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(refused).toHaveLength(1);
    expect(String(refused[0]!.reason)).toContain("substitutions.clash");
    expect(await db.substitution.count({ where: { schoolId: ids.school, dateKey: dayKey, substituteMembershipId: teachers.third.membershipId } })).toBe(1);
    expect(await told(teachers.third.userId, "notifTitle.coverAssigned")).toBe(1);
  });

  it("the board naming someone else after it saw the cover: the replacement goes through and the first is released", async () => {
    const row = await db.substitution.findFirstOrThrow({ where: { schoolId: ids.school, dateKey: dayKey, slot: { classId: ids.klassA, periodId: ids.period } }, select: { slotId: true, substituteMembershipId: true } });
    const now = row.substituteMembershipId === teachers.anjum.membershipId ? teachers.anjum : teachers.arjun;
    const other = now === teachers.anjum ? teachers.arjun : teachers.anjum;
    const releasedBefore = await told(now.userId, "notifTitle.coverReleased");
    const r = await assignSubstitute(office(), { dateKey: dayKey, slotId: row.slotId, substituteMembershipId: other.membershipId, replacing: now.membershipId });
    expect(r).toEqual({ changed: true });
    expect(await told(now.userId, "notifTitle.coverReleased")).toBe(releasedBefore + 1);
    // The same press again (what the board saw is now stale, but it names the person who covers): nothing changes.
    expect(await assignSubstitute(head(), { dateKey: dayKey, slotId: row.slotId, substituteMembershipId: other.membershipId, replacing: now.membershipId })).toEqual({ changed: false });
  });
});
