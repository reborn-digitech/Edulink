import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  listClosedYears,
  pupilYearArchive,
  teacherYearArchive,
  schoolYearArchive,
} from "@/lib/year-archive";
import type { ActiveContext } from "@/lib/session";

/**
 * The past-years archive.
 *
 * What is pinned: the year filter NARROWS and never widens — a closed year
 * shows the rows inside its window and its linked badges, the current year is
 * never listed, and each role's function refuses everybody else. ZZ fixtures:
 * one school, one closed year with data inside AND outside its window, one
 * open year, a class, a teacher, a pupil, a guardian.
 */

const db = new PrismaClient();
const STAMP = Date.now();

// The closed year: calendar 2024–25, closed. The open year: current.
const Y_START = new Date("2024-06-01T00:00:00.000Z");
const Y_END = new Date("2025-04-30T23:59:59.000Z");

let schoolId = "";
let closedYearId = "";
let classId = "";
let teacherM = "";
let teacherUserId = "";
let pupilM = "";
let pupilUserId = "";
let parentUserId = "";
let adminUserId = "";

function ctx(over: {
  userId: string;
  membershipId?: string | null;
  schoolId?: string | null;
  role?: ActiveContext["role"];
}): ActiveContext {
  return {
    sessionId: "test",
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

beforeAll(async () => {
  const school = await db.school.create({
    data: {
      name: `ZZ Archive High ${STAMP}`,
      slug: `zz-archive-${STAMP}`,
      code: `ZA${String(STAMP).slice(-6)}`,
      contactEmail: `zz-archive-school-${STAMP}@test.invalid`,
      timezone: "Asia/Kolkata",
    },
    select: { id: true },
  });
  schoolId = school.id;

  const closed = await db.academicYear.create({
    data: {
      schoolId,
      name: "ZZ 2024–25",
      startDate: Y_START,
      endDate: Y_END,
      closedAt: new Date("2025-05-01T00:00:00.000Z"),
    },
    select: { id: true },
  });
  closedYearId = closed.id;
  await db.academicYear.create({
    data: {
      schoolId,
      name: "ZZ 2025–26",
      startDate: new Date("2025-06-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
      isCurrent: true,
    },
  });

  const mkUser = (tag: string) =>
    db.user.create({
      data: { name: `ZZ ${tag}`, email: `zz-archive-${tag.toLowerCase()}-${STAMP}@test.invalid` },
      select: { id: true },
    });
  const [teacher, pupil, parent, admin] = await Promise.all([
    mkUser("Teacher"), mkUser("Pupil"), mkUser("Parent"), mkUser("Admin"),
  ]);
  teacherUserId = teacher.id;
  pupilUserId = pupil.id;
  parentUserId = parent.id;
  adminUserId = admin.id;

  const mkMembership = (userId: string, role: string, joinedAt: Date) =>
    db.membership.create({
      data: { userId, schoolId, role, status: "ACTIVE", joinedAt },
      select: { id: true },
    });
  const tM = await mkMembership(teacher.id, "TEACHER", Y_START);
  const pM = await mkMembership(pupil.id, "STUDENT", Y_START);
  await mkMembership(admin.id, "ADMIN", Y_START);
  teacherM = tM.id;
  pupilM = pM.id;

  await db.guardianship.create({
    data: {
      parentUserId: parent.id,
      studentMembershipId: pupilM,
      studentSchoolId: schoolId,
      relation: "PARENT",
      status: "ACTIVE",
    },
  });

  const klass = await db.class.create({
    data: { schoolId, name: "ZZ Class 7", joinCode: `ZAC${String(STAMP).slice(-6)}` },
    select: { id: true },
  });
  classId = klass.id;
  await db.classTeacher.create({
    data: { classId, schoolId, teacherMembershipId: teacherM, role: "LEAD" },
  });
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilM, status: "ACTIVE" },
  });

  // Two registers inside the window (one present, one absent), one outside it.
  for (const [dateKey, status] of [
    ["2024-07-01", "PRESENT"],
    ["2024-07-02", "ABSENT"],
    ["2025-07-01", "PRESENT"], // the NEXT year — must not count
  ] as const) {
    const sess = await db.attendanceSession.create({
      data: { schoolId, classId, dateKey, takenByMembershipId: teacherM },
      select: { id: true },
    });
    await db.attendanceRecord.create({
      data: { sessionId: sess.id, schoolId, studentMembershipId: pupilM, status },
    });
  }

  // A published report card linked to the closed year, and one in the open year.
  await db.reportCard.create({
    data: {
      schoolId,
      classId,
      studentMembershipId: pupilM,
      academicYearId: closedYearId,
      title: "ZZ Term 2 Card",
      status: "PUBLISHED",
      publishedAt: new Date("2025-03-01T00:00:00.000Z"),
      fromDateKey: "2024-11-01",
      toDateKey: "2025-03-01",
    },
  });
  await db.reportCard.create({
    data: {
      schoolId,
      classId,
      studentMembershipId: pupilM,
      title: "ZZ Next Year Card",
      status: "PUBLISHED",
      publishedAt: new Date("2025-09-01T00:00:00.000Z"),
      fromDateKey: "2025-06-01",
      toDateKey: "2025-09-01",
    },
  });

  // A badge archived for the closed year.
  await db.earnedBadge.create({
    data: {
      schoolId,
      studentMembershipId: pupilM,
      academicYearId: closedYearId,
      badgeId: "zz-archive-badge",
      label: "ZZ Full Week",
      description: "ZZ five days straight",
      permanent: false,
    },
  });

  // One graded assignment inside the window: 8/10.
  const assignment = await db.assignment.create({
    data: {
      schoolId,
      classId,
      authorMembershipId: teacherM,
      title: "ZZ Fractions",
      pointsMilli: 10_000,
      createdAt: new Date("2024-08-01T00:00:00.000Z"),
      publishedAt: new Date("2024-08-01T00:00:00.000Z"),
    },
    select: { id: true },
  });
  await db.grade.create({
    data: {
      schoolId,
      assignmentId: assignment.id,
      studentMembershipId: pupilM,
      scoreMilli: 8_000,
      gradedAt: new Date("2024-08-10T00:00:00.000Z"),
    },
  });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } }); // cascades the rest
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("listing years", () => {
  it("⚠ lists only CLOSED years — the current one belongs to the ordinary pages", async () => {
    const years = await listClosedYears(schoolId);
    expect(years.map((y) => y.name)).toEqual(["ZZ 2024–25"]);
  });
});

describe("the pupil's year", () => {
  const pupilCtx = () => ctx({ userId: pupilUserId, membershipId: pupilM, schoolId, role: "STUDENT" });

  it("shows the report card, the window's attendance, the badge and the marks", async () => {
    const data = await pupilYearArchive(pupilCtx(), pupilM, closedYearId);

    expect(data.reportCards.map((c) => c.title)).toEqual(["ZZ Term 2 Card"]);
    // Two marked days in the window, one present; the next-year register is out.
    expect(data.attendance).toEqual({ marked: 2, present: 1 });
    expect(data.badges.map((b) => b.label)).toEqual(["ZZ Full Week"]);
    expect(data.marks.graded).toBe(1);
    expect(data.marks.averagePercent).toBe(80);
  });

  it("a guardian reads the same through their guardianship", async () => {
    const data = await pupilYearArchive(ctx({ userId: parentUserId, role: "PARENT" }), pupilM, closedYearId);
    expect(data.reportCards).toHaveLength(1);
  });

  it("⚠ a stranger is refused", async () => {
    await expect(
      pupilYearArchive(ctx({ userId: adminUserId, role: "PARENT" }), pupilM, closedYearId),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ an OPEN year is not servable at all", async () => {
    const open = await db.academicYear.findFirstOrThrow({
      where: { schoolId, isCurrent: true },
      select: { id: true },
    });
    await expect(pupilYearArchive(pupilCtx(), pupilM, open.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("the teacher's year", () => {
  it("counts the class's registers, assignments and cards inside the window", async () => {
    const data = await teacherYearArchive(
      ctx({ userId: teacherUserId, membershipId: teacherM, schoolId, role: "TEACHER" }),
      closedYearId,
    );
    expect(data.classes).toHaveLength(1);
    expect(data.classes[0]).toMatchObject({
      className: "ZZ Class 7",
      registersTaken: 2, // the next-year register is out of the window
      assignmentsSet: 1,
      reportCardsPublished: 1,
    });
  });

  it("⚠ refuses a pupil", async () => {
    await expect(
      teacherYearArchive(ctx({ userId: pupilUserId, membershipId: pupilM, schoolId, role: "STUDENT" }), closedYearId),
    ).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the school's year", () => {
  it("adds the office's numbers up", async () => {
    const data = await schoolYearArchive(
      ctx({ userId: adminUserId, schoolId, role: "ADMIN" }),
      closedYearId,
    );
    expect(data.pupilsOnRoll).toBe(1);
    expect(data.attendance).toEqual({ marked: 2, present: 1 });
    expect(data.reportCardsPublished).toBe(1);
    expect(data.badgesArchived).toBe(1);
  });

  it("⚠ refuses a teacher", async () => {
    await expect(
      schoolYearArchive(
        ctx({ userId: teacherUserId, membershipId: teacherM, schoolId, role: "TEACHER" }),
        closedYearId,
      ),
    ).rejects.toBeInstanceOf(AccessError);
  });
});
