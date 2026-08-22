import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { attendanceHistory, historyClassesFor, shiftMonth } from "@/lib/attendance-history";
import type { ActiveContext } from "@/lib/session";

/**
 * Who may read a class's registers back, and what the month grid says.
 *
 * The reading rule is narrower than the taking rule on purpose: a week's
 * cover lets somebody mark today's register and nothing more. The grid's
 * arithmetic is checked against a register laid down by hand, including a
 * child marked on one day and not the other — a blank, never an absence.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
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

const MONTH = "2031-03";
const DAY_ONE = "2031-03-02";
const DAY_TWO = "2031-03-03";
const PRINCIPAL_EMAIL = "principal.history.unit@riverside.test";
const SPARE_EMAIL = "spare.history.unit@riverside.test";
const PUPIL_EMAILS = ["pupil1.history.unit@riverside.test", "pupil2.history.unit@riverside.test"];
const MADE = [PRINCIPAL_EMAIL, SPARE_EMAIL, ...PUPIL_EMAILS];

let riversideId: string;
let classId: string;
let admin: ActiveContext;
let principal: ActiveContext;
let classTeacher: ActiveContext;
let coverTeacher: ActiveContext;
let pupilIds: string[] = [];

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  riversideId = riverside.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riversideId, role: "TEACHER" },
  });
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  classTeacher = ctx({ userId: tom.id, membershipId: tomTeacher.id, schoolId: riversideId, role: "TEACHER" });

  async function person(email: string, role: "PRINCIPAL" | "TEACHER" | "STUDENT") {
    const user =
      (await db.user.findUnique({ where: { email } })) ??
      (await db.user.create({ data: { email, name: `ZZ ${email.split(".")[0]}`, prefs: "{}" } }));
    const membership = await db.membership.upsert({
      where: { userId_schoolId_role: { userId: user.id, schoolId: riversideId, role } },
      create: { userId: user.id, schoolId: riversideId, role, status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });
    return { user, membership };
  }

  const p = await person(PRINCIPAL_EMAIL, "PRINCIPAL");
  principal = ctx({ userId: p.user.id, membershipId: p.membership.id, schoolId: riversideId, role: "PRINCIPAL" });
  const s = await person(SPARE_EMAIL, "TEACHER");
  coverTeacher = ctx({ userId: s.user.id, membershipId: s.membership.id, schoolId: riversideId, role: "TEACHER" });

  // This suite's own class — see register-duty.test.ts for why it is never a
  // seeded one.
  const klass = await db.class.upsert({
    where: { joinCode: "ZZZ-HIST" },
    create: { schoolId: riversideId, name: "ZZ History Test Class", gradeLevel: "4", joinCode: "ZZZ-HIST" },
    update: {},
  });
  classId = klass.id;

  await db.classTeacher.upsert({
    where: { classId_teacherMembershipId: { classId, teacherMembershipId: tomTeacher.id } },
    create: { classId, schoolId: riversideId, teacherMembershipId: tomTeacher.id, role: "LEAD", canTakeAttendance: true },
    update: { canTakeAttendance: true },
  });
  // The spare is COVERING this month, which is enough to take a register.
  await db.attendanceCover.create({
    data: {
      schoolId: riversideId,
      classId,
      coveringMembershipId: s.membership.id,
      fromDateKey: `${MONTH}-01`,
      toDateKey: `${MONTH}-31`,
      createdByMembershipId: priyaAdmin.id,
    },
  });

  pupilIds = [];
  for (const email of PUPIL_EMAILS) {
    const pupil = await person(email, "STUDENT");
    pupilIds.push(pupil.membership.id);
    await db.enrollment.upsert({
      where: { classId_studentMembershipId: { classId, studentMembershipId: pupil.membership.id } },
      create: { classId, schoolId: riversideId, studentMembershipId: pupil.membership.id, status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });
  }

  // Day one: both marked, one late. Day two: only the first is marked.
  for (const [dateKey, marks] of [
    [DAY_ONE, [["PRESENT", 0], ["LATE", 1]]],
    [DAY_TWO, [["ABSENT", 0]]],
  ] as const) {
    await db.attendanceSession.create({
      data: {
        schoolId: riversideId,
        classId,
        dateKey,
        takenByMembershipId: tomTeacher.id,
        records: {
          create: marks.map(([status, i]) => ({
            schoolId: riversideId,
            studentMembershipId: pupilIds[i]!,
            status,
          })),
        },
      },
    });
  }
});

afterAll(async () => {
  await db.attendanceCover.deleteMany({ where: { classId } });
  await db.attendanceRecord.deleteMany({ where: { session: { classId } } });
  await db.attendanceSession.deleteMany({ where: { classId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.notification.deleteMany({ where: { user: { email: { in: MADE } } } });
  await db.membership.deleteMany({ where: { user: { email: { in: MADE } } } });
  await db.user.deleteMany({ where: { email: { in: MADE } } });
  await db.class.deleteMany({ where: { id: classId } });
  await db.$disconnect();
});

describe("who may read a class's registers back", () => {
  it("the class teacher, the admin and the principal all may", async () => {
    for (const who of [classTeacher, admin, principal]) {
      const classes = await historyClassesFor(who);
      expect(classes.map((c) => c.id)).toContain(classId);
    }
  });

  it("an admin and a principal see every class; the teacher only their own", async () => {
    const mine = await historyClassesFor(classTeacher);
    const all = await historyClassesFor(principal);
    expect(all.length).toBeGreaterThan(mine.length);
  });

  it("⚠ a teacher covering the class this month still may not", async () => {
    expect((await historyClassesFor(coverTeacher)).map((c) => c.id)).not.toContain(classId);
    await expect(attendanceHistory(coverTeacher, classId, MONTH)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses a garbage month before touching the database", async () => {
    await expect(attendanceHistory(admin, classId, "2031-3")).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the month grid", () => {
  it("lists every register day, each pupil's marks, and honest totals", async () => {
    const history = await attendanceHistory(classTeacher, classId, MONTH);
    expect(history.days.map((d) => d.dateKey)).toEqual([DAY_ONE, DAY_TWO]);

    const [first, second] = history.pupils.sort((a, b) =>
      pupilIds.indexOf(a.membershipId) - pupilIds.indexOf(b.membershipId),
    );
    expect(first!.marks).toEqual({ [DAY_ONE]: "PRESENT", [DAY_TWO]: "ABSENT" });
    expect(first!.percent).toBe(50);

    // Marked late on day one, not marked at all on day two: one mark, 100%,
    // and no ABSENT invented for the blank.
    expect(second!.marks).toEqual({ [DAY_ONE]: "LATE" });
    expect(second!.percent).toBe(100);

    expect(history.days[0]).toMatchObject({ present: 1, late: 1, absent: 0, percent: 100 });
    expect(history.days[1]).toMatchObject({ present: 0, absent: 1, percent: 0 });
    // Two of three marks were present-or-late.
    expect(history.percent).toBe(67);
  });

  it("an empty month is an empty grid, not an error", async () => {
    const history = await attendanceHistory(principal, classId, shiftMonth(MONTH, -1));
    expect(history.days).toEqual([]);
    expect(history.percent).toBeNull();
    expect(history.pupils.every((p) => p.percent === null)).toBe(true);
  });

  it("shiftMonth crosses the year", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});
