/**
 * Reads of the whole roll that stopped at a fixed count: finding TA-508 of the
 * testing analysis of 13 November 2026, held by cases that FAIL while the
 * defect stands and pass once it is fixed.
 *
 *   TA-508  officeRecords read 2,000 pupils ordered by name and reported that
 *           as the total, so requestRecords refused a named pupil sorting
 *           later; the daily fee reminder read 2,000 demands per due day and
 *           the rest were never reminded for that bucket; the UDISE+ student
 *           sheet read 5,000 pupils and filed no more.
 *
 * One scratch ZZ school of this suite's own with 5,100 pupils (its stamp in
 * every name and address), made through the owner connection and removed in
 * afterAll. The reminder job is run with a clock in 2999, when nothing of any
 * other school falls due, on demands of this school's own dated then.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { officeRecords, requestRecords } from "@/lib/pupil-records";
import { udiseStudentsExport } from "@/lib/filings";
import { sendFeeReminders } from "@/lib/fees-reports";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-rl-roll-${who}-${STAMP}@test.invalid`;
const PUPILS = 5_100;
const OWING = 2_100;
const ids: Record<string, string> = {};
const pad = (n: number) => String(n).padStart(4, "0");

function admin(): ActiveContext {
  return {
    sessionId: "zz-ta-rl-roll",
    membershipId: ids.adminM!,
    schoolId: ids.school!,
    role: "ADMIN",
    user: {
      id: ids.admin!, name: "ZZ RL Roll Admin", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

let memberships: { id: string; name: string }[] = [];

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA-RL Whole Roll ${STAMP}`, slug: `zz-ta-rl-roll-${STAMP}`, code: `ZZRLR${STAMP}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ RL Roll Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await db.user.createMany({ data: Array.from({ length: PUPILS }, (_, i) => ({ name: `ZZ RL Roll ${pad(i + 1)}`, email: MAIL(`p${pad(i + 1)}`), prefs: "{}" })) });
  const users = await db.user.findMany({ where: { email: { startsWith: "zz-ta-rl-roll-p", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.membership.createMany({ data: users.map((u) => ({ userId: u.id, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE" })) });
  memberships = (await db.membership.findMany({ where: { schoolId: ids.school, role: "STUDENT" }, select: { id: true, user: { select: { name: true } } } }))
    .map((m) => ({ id: m.id, name: m.user.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  // A year current in 2999 and one instalment each for 2,100 pupils, all due on the same day of it.
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: `ZZ 2999 ${STAMP}`, startDate: new Date("2999-04-01T00:00:00Z"), endDate: new Date("3000-03-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  await db.feeDemand.createMany({ data: memberships.slice(0, OWING).map((m) => ({ schoolId: ids.school!, studentMembershipId: m.id, academicYearId: ids.year!, label: "ZZ Term 1", dueDate: new Date("2999-06-15T00:00:00Z"), grossPaise: 100_000, netPaise: 100_000, status: "OPEN" })) });
}, 180_000);

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
}, 180_000);

describe("TA-508: the whole roll is read whole", () => {
  it("TA-508: the records page counts all 5,100 pupils, and a pupil sorting last can be asked for", async () => {
    const records = await officeRecords(admin(), false);
    expect({ total: records.total, rows: records.rows.length }).toEqual({ total: PUPILS, rows: PUPILS });
    const last = memberships[memberships.length - 1]!;
    expect(await requestRecords(admin(), [last.id])).toEqual({ asked: 1, families: 0 });
  }, 120_000);

  it("TA-508: the UDISE+ student sheet carries every pupil on the roll", async () => {
    const sheet = await udiseStudentsExport(admin());
    expect(sheet.rows).toBe(PUPILS);
  }, 120_000);

  it("TA-508: the daily reminder reaches every one of the 2,100 demands falling due the same day", async () => {
    // A week before 15 June 2999 in Kolkata: the D-7 bucket.
    await sendFeeReminders(new Date("2999-06-08T03:00:00Z"));
    const reminded = await db.feeDemand.count({ where: { schoolId: ids.school, lastReminderKey: { startsWith: "D-7:" } } });
    expect(reminded).toBe(OWING);
  }, 180_000);
});
