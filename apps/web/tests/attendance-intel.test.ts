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
const TWICE_EMAIL = "zz.twice.absence@riverside.test";
const EXCUSED_EMAIL = "zz.excused.absence@riverside.test";
const LEAVER_EMAIL = "zz.leaver.absence@riverside.test";
const ALL_EMAILS = [ADMIN_EMAIL, SLIPPING_EMAIL, STEADY_EMAIL, PARENT_EMAIL, TWICE_EMAIL, EXCUSED_EMAIL, LEAVER_EMAIL];

let schoolId: string;
let classId: string;
let classBId: string;
let admin: ActiveContext;
let slippingMembershipId: string;
let steadyMembershipId: string;
let twiceMembershipId: string;
let excusedMembershipId: string;
let leaverMembershipId: string;
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
      isAppAdmin: false,
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

  // Three more children, each a way the old count went wrong.
  //   twice:   absent on the last day on BOTH this class's register and a
  //            second class's — one day, not a run of two; six early absences
  //            make the rate chronic so the flag is there to read.
  //   excused: absent, absent, EXCUSED, absent on the last four days — a run
  //            of three, the excused day skipped rather than a reset.
  //   leaver:  three absences running, but left the school — no flag.
  const made = await Promise.all(
    [TWICE_EMAIL, EXCUSED_EMAIL, LEAVER_EMAIL].map((email) =>
      db.user.create({ data: { email, name: `ZZ ${email.split(".")[1]} Pupil`, prefs: "{}" } }),
    ),
  );
  const [twice, excused, leaver] = await Promise.all(
    made.map((u, i) =>
      db.membership.create({
        data: { userId: u.id, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: i === 2 ? new Date() : null },
      }),
    ),
  );
  twiceMembershipId = twice!.id;
  excusedMembershipId = excused!.id;
  leaverMembershipId = leaver!.id;
  const classB = await db.class.create({
    data: { schoolId, name: "ZZ Absence Class B", gradeLevel: "4", joinCode: "ZZABSEN002" },
  });
  classBId = classB.id;
  await db.enrollment.createMany({
    data: [
      { classId, schoolId, studentMembershipId: twice!.id },
      { classId: classBId, schoolId, studentMembershipId: twice!.id },
      { classId, schoolId, studentMembershipId: excused!.id },
      { classId, schoolId, studentMembershipId: leaver!.id, status: "REMOVED", removedAt: new Date() },
    ],
  });
  const sessions = await db.attendanceSession.findMany({ where: { classId }, orderBy: { dateKey: "asc" }, select: { id: true, dateKey: true } });
  const statusFor = (who: "twice" | "excused" | "leaver", i: number) => {
    if (who === "twice") return i < 6 || i === 9 ? "ABSENT" : "PRESENT";
    if (who === "excused") return i < 6 ? "PRESENT" : i === 8 ? "EXCUSED" : "ABSENT";
    return i < 7 ? "PRESENT" : "ABSENT";
  };
  await db.attendanceRecord.createMany({
    data: sessions.flatMap((session, i) => [
      { sessionId: session.id, schoolId, studentMembershipId: twice!.id, status: statusFor("twice", i) },
      { sessionId: session.id, schoolId, studentMembershipId: excused!.id, status: statusFor("excused", i) },
      { sessionId: session.id, schoolId, studentMembershipId: leaver!.id, status: statusFor("leaver", i) },
    ]),
  });
  // Class B's register on the last day marks the same child absent again.
  await db.attendanceSession.create({
    data: {
      schoolId,
      classId: classBId,
      dateKey: sessions[9]!.dateKey,
      records: { create: [{ schoolId, studentMembershipId: twice!.id, status: "ABSENT" }] },
    },
  });

  admin = ctxFor(adminUser.id, adminMembership.id, "ADMIN");
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId: parentUserId } });
  await db.attendanceRecord.deleteMany({ where: { session: { classId: { in: [classId, classBId] } } } });
  await db.attendanceSession.deleteMany({ where: { classId: { in: [classId, classBId] } } });
  await db.guardianship.deleteMany({ where: { parentUserId } });
  await db.enrollment.deleteMany({ where: { classId: { in: [classId, classBId] } } });
  await db.class.deleteMany({ where: { id: { in: [classId, classBId] } } });
  for (const email of ALL_EMAILS) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  expect(await db.class.count({ where: { id: classId } })).toBe(0);
  expect(
    await db.user.count({
      where: { email: { in: ALL_EMAILS } },
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

  it("a day on two registers is one absent day: a run of 1, ten marks", async () => {
    const flags = await absenceFlags(admin);
    const twice = flags.find((f) => f.studentMembershipId === twiceMembershipId);
    expect(twice).toBeDefined();
    expect(twice!.chronic).toBe(true); // 3 of 10 days there
    expect(twice!.percent).toBe(30);
    expect(twice!.marks).toBe(10);
    expect(twice!.currentRun).toBe(1);
    expect(twice!.consecutive).toBe(false);
  });

  it("an EXCUSED day between two ABSENT days does not reset the run", async () => {
    const flags = await absenceFlags(admin);
    const excused = flags.find((f) => f.studentMembershipId === excusedMembershipId);
    expect(excused).toBeDefined();
    expect(excused!.currentRun).toBe(3); // A, A, E, A — the E is skipped
    expect(excused!.consecutive).toBe(true);
  });

  it("a leaver with three absences running is not flagged", async () => {
    const flags = await absenceFlags(admin);
    expect(flags.find((f) => f.studentMembershipId === leaverMembershipId)).toBeUndefined();
  });

  it("scoped to a class, only that class's registers count", async () => {
    const inA = await absenceFlags(admin, { classId });
    expect(inA.map((f) => f.studentMembershipId)).toContain(slippingMembershipId);
    const inB = await absenceFlags(admin, { classId: classBId });
    // One absent day in class B: a mark, not a pattern.
    expect(inB).toEqual([]);
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
    // 10 days × 4 pupils on the roll: the leaver's marks and the second
    // register's repeat of the last day are not counted.
    expect(recentMarks).toBeGreaterThanOrEqual(40);
  });
});
