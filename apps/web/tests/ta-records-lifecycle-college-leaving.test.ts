/**
 * A college student leaving through the people page: finding TA-268 of the
 * testing analysis of 13 November 2026, held by cases that FAIL while the
 * defect stands and pass once it is fixed.
 *
 *   TA-268  At a college, recordOrScheduleLeaving (the people page, the phone's
 *           person screen and POST /api/v1/admin/people/{id}/leaving) called
 *           recordDeparture or scheduleDeparture with no kind read: a student
 *           with an open LEAVING clearance left, the programme enrolment stayed
 *           ACTIVE and no caution return was recorded, where the college's own
 *           leaving door (leaveCollege) refuses and does both.
 *
 * One scratch ZZ college of this suite's own (its stamp in every name and
 * address), made through the owner connection and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { recordOrScheduleLeaving } from "@/lib/leaving";
import { runDueDepartures } from "@/lib/school-record";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-rl-college-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const ids: Record<string, string> = {};

function admin(): ActiveContext {
  return {
    sessionId: "zz-ta-rl-college",
    membershipId: ids.adminM!,
    schoolId: ids.college!,
    role: "ADMIN",
    user: {
      id: ids.admin!, name: "ZZ RL Registrar", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

async function student(who: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ RL ${who}`, email: MAIL(who), prefs: "{}", isMinor: false, birthdate: new Date("2005-01-01T00:00:00Z") }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role: "STUDENT", status: "ACTIVE", joinedAt: new Date(Date.now() - 300 * 86_400_000) }, select: { id: true } })).id;
  await db.programmeEnrolment.create({ data: { schoolId: ids.college!, studentMembershipId: ids[`${who}M`]!, programmeId: ids.programme!, yearOfEntry: 2025, category: "OPEN", quota: "CAP" } });
}

const enrolment = async (who: string) => (await db.programmeEnrolment.findFirst({ where: { studentMembershipId: ids[`${who}M`] }, select: { status: true } }))?.status ?? null;
const leftAt = async (who: string) => (await db.membership.findUniqueOrThrow({ where: { id: ids[`${who}M`] }, select: { leftAt: true } })).leftAt;

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ TA-RL College ${STAMP}`, slug: `zz-ta-rl-college-${STAMP}`, code: `ZZRLC${STAMP}`, contactEmail: MAIL("office"), timezone: TZ, kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ RL Registrar", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.college, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: `ZZ ${STAMP}`, startDate: new Date(`${addDaysToKey(TODAY, -100)}T00:00:00Z`), endDate: new Date(`${addDaysToKey(TODAY, 200)}T00:00:00Z`), isCurrent: true }, select: { id: true } })).id;
  const dept = await db.department.create({ data: { schoolId: ids.college, code: "PHY", name: "ZZ RL Physics" }, select: { id: true } });
  ids.programme = (await db.programme.create({ data: { schoolId: ids.college, departmentId: dept.id, code: "BSCPHY", name: "ZZ RL BSc Physics", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  await student("owing"); // an instalment fallen due and unpaid: the accounts line of the LEAVING clearance is open
  await student("clear");
  await student("later");
  await db.feeDemand.create({ data: { schoolId: ids.college, studentMembershipId: ids.owingM!, academicYearId: ids.year, label: "ZZ Term 1", dueDate: new Date(`${addDaysToKey(TODAY, -10)}T00:00:00Z`), grossPaise: 500_000, netPaise: 500_000, status: "OPEN" } });
});

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-268: at a college the people page's leaving is the college's leaving", () => {
  it("TA-268: a student with an open LEAVING clearance is refused, today or on a later day, and nothing is written", async () => {
    expect(await recordOrScheduleLeaving(admin(), ids.owingM!, { reason: "LEFT" })).toEqual({ ok: false, errorKey: "collegeOffice.refuseNoDuesOpen" });
    expect(await recordOrScheduleLeaving(admin(), ids.owingM!, { reason: "LEFT", leftOn: addDaysToKey(TODAY, 5) })).toEqual({ ok: false, errorKey: "collegeOffice.refuseNoDuesOpen" });
    expect(await leftAt("owing")).toBeNull();
    expect(await db.schoolRecord.count({ where: { studentMembershipId: ids.owingM } })).toBe(0);
    expect(await db.scheduledDeparture.count({ where: { membershipId: ids.owingM } })).toBe(0);
    expect(await enrolment("owing")).toBe("ACTIVE");
  });

  it("TA-268: a cleared student leaves with the programme enrolment closed and the caution return recorded on the clearance", async () => {
    const result = await recordOrScheduleLeaving(admin(), ids.clearM!, { reason: "LEFT" });
    expect(result.ok).toBe(true);
    expect(result.ok && result.recordId).toBeTruthy();
    expect(await leftAt("clear")).not.toBeNull();
    expect(await enrolment("clear")).toBe("LEFT");
    const clearance = await db.noDuesClearance.findFirst({ where: { studentMembershipId: ids.clearM, event: "LEAVING" }, select: { cautionReturnPaise: true, completedAt: true } });
    expect(clearance).toMatchObject({ cautionReturnPaise: 0 });
    expect(clearance?.completedAt).not.toBeNull();
  });

  it("TA-268: a later last day kept at a college is carried out as the college's leaving when it comes", async () => {
    const day = addDaysToKey(TODAY, 3);
    expect(await recordOrScheduleLeaving(admin(), ids.laterM!, { reason: "TRANSFERRED", leftOn: day })).toEqual({ ok: true, recordId: null, scheduledFor: day });
    const run = await runDueDepartures(new Date(`${addDaysToKey(TODAY, 5)}T06:00:00Z`), { schoolIds: [ids.college!] });
    expect(run.executed).toBe(1);
    expect(await leftAt("later")).not.toBeNull();
    expect(await enrolment("later")).toBe("LEFT");
    expect(await db.noDuesClearance.count({ where: { studentMembershipId: ids.laterM, event: "LEAVING" } })).toBe(1);
  });
});
