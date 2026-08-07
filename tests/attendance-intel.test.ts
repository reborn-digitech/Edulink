import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { absenceFlags, sendAbsenceAlert, attendanceTrend } from "@/lib/attendance-intel";
import { addDaysToKey, todayKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";

/**
 * Attendance intelligence on real register rows: ten sessions in a disposable
 * ZZ class, one child slipping (three absents running, 30% rate), one steady.
 * The flags name the slipping child and nobody else; telling the family writes
 * one notification per guardian and refuses to repeat itself within a week.
 */

const db = new PrismaClient();
const ADMIN_EMAIL = "zz.admin.absence@riverside.test";
const SLIPPING_EMAIL = "zz.slipping.absence@riverside.test";
const STEADY_EMAIL = "zz.steady.absence@riverside.test";
const PARENT_EMAIL = "zz.parent.absence@riverside.test";

let schoolId: string;
let classId: string;
let admin: ActiveContext;
let slippingMembershipId: string;
let steadyMembershipId: string;
let parentUserId: string;

function ctxFor(userId: string, membershipId: string, role: "ADMIN"): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId,
    role,
    user: {
      id: userId,
      name: "ZZ Absence Admin",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;

  const [adminUser, slippingUser, steadyUser, parentUser] = await Promise.all([
    db.user.create({ data: { email: ADMIN_EMAIL, name: "ZZ Absence Admin", prefs: "{}" } }),
    db.user.create({ data: { email: SLIPPING_EMAIL, name: "ZZ Slipping Pupil", prefs: "{}" } }),
    db.user.create({ data: { email: STEADY_EMAIL, name: "ZZ Steady Pupil", prefs: "{}" } }),
    db.user.create({ data: { email: PARENT_EMAIL, name: "ZZ Absence Parent", prefs: "{}" } }),
  ]);
  parentUserId = parentUser.id;

  const adminMembership = await db.membership.create({
    data: { userId: adminUser.id, schoolId, role: "ADMIN", status: "ACTIVE" },
  });
  const slipping = await db.membership.create({
    data: { userId: slippingUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  const steady = await db.membership.create({
    data: { userId: steadyUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  slippingMembershipId = slipping.id;
  steadyMembershipId = steady.id;

  const klass = await db.class.create({
    data: { schoolId, name: "ZZ Absence Class", gradeLevel: "4", joinCode: "ZZABSEN001" },
  });
  classId = klass.id;
  await db.enrollment.createMany({
    data: [
      { classId, schoolId, studentMembershipId: slipping.id },
      { classId, schoolId, studentMembershipId: steady.id },
    ],
  });
  await db.guardianship.create({
    data: { parentUserId: parentUser.id, studentMembershipId: slipping.id, studentSchoolId: schoolId },
  });

  // Ten registers over the last two weeks. The slipping child: present for the
  // first three, absent for the last seven (so 30%, and 3+ running). The
  // steady child: present throughout.
  const today = todayKey(school.timezone);
  for (let i = 0; i < 10; i++) {
    const dateKey = addDaysToKey(today, -(9 - i));
    const session = await db.attendanceSession.create({
      data: { schoolId, classId, dateKey },
    });
    await db.attendanceRecord.createMany({
      data: [
        {
          sessionId: session.id,
          schoolId,
          studentMembershipId: slipping.id,
          status: i < 3 ? "PRESENT" : "ABSENT",
        },
        { sessionId: session.id, schoolId, studentMembershipId: steady.id, status: "PRESENT" },
      ],
    });
  }

  admin = ctxFor(adminUser.id, adminMembership.id, "ADMIN");
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId: parentUserId } });
  await db.attendanceRecord.deleteMany({ where: { session: { classId } } });
  await db.attendanceSession.deleteMany({ where: { classId } });
  await db.guardianship.deleteMany({ where: { parentUserId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  for (const email of [ADMIN_EMAIL, SLIPPING_EMAIL, STEADY_EMAIL, PARENT_EMAIL]) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  expect(await db.class.count({ where: { id: classId } })).toBe(0);
  expect(
    await db.user.count({
      where: { email: { in: [ADMIN_EMAIL, SLIPPING_EMAIL, STEADY_EMAIL, PARENT_EMAIL] } },
    }),
  ).toBe(0);
  await db.$disconnect();
});

describe("attendance intelligence", () => {
  it("flags the slipping child and leaves the steady one alone", async () => {
    const flags = await absenceFlags(admin);
    const slipping = flags.find((f) => f.studentMembershipId === slippingMembershipId);
    expect(slipping).toBeDefined();
    expect(slipping!.chronic).toBe(true); // 30% < 75%
    expect(slipping!.consecutive).toBe(true); // 7 >= 3 running
    expect(slipping!.percent).toBe(30);
    expect(slipping!.guardianCount).toBe(1);
    expect(flags.find((f) => f.studentMembershipId === steadyMembershipId)).toBeUndefined();
  });

  it("tells the family once, and refuses to nag within a week", async () => {
    const first = await sendAbsenceAlert(admin, slippingMembershipId);
    expect(first).toEqual({ notified: 1, skipped: false });
    expect(
      await db.notification.count({ where: { userId: parentUserId, kind: "ATTENDANCE" } }),
    ).toBe(1);

    const second = await sendAbsenceAlert(admin, slippingMembershipId);
    expect(second).toEqual({ notified: 0, skipped: true });
    expect(
      await db.notification.count({ where: { userId: parentUserId, kind: "ATTENDANCE" } }),
    ).toBe(1);
  });

  it("the trend counts this fortnight's marks", async () => {
    const trend = await attendanceTrend(admin);
    expect(trend).toHaveLength(8);
    const recentMarks = trend.slice(-2).reduce((sum, p) => sum + p.marks, 0);
    expect(recentMarks).toBeGreaterThanOrEqual(20); // our 10 sessions × 2 pupils
  });
});
