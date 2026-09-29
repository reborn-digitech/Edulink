import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  listClosedYears,
  closedYearsForPupil,
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
      createdByMembershipId: teacherM,
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

  /**
   * ⚠ A pupil's chips are THEIR years, not the school's history. A child who
   * joined in the school's third year was offered every earlier closed year,
   * each opening a page of "nothing was recorded" — accurate about the school,
   * baffling about the child. Found by a person testing a three-year archive.
   */
  it("⚠ a pupil is offered only the years they lived", async () => {
    // The fixture pupil joined at the year's start and is still here.
    const lived = await closedYearsForPupil(schoolId, pupilM);
    expect(lived.map((y) => y.name)).toEqual(["ZZ 2024–25"]);

    // Joined AFTER the closed year ended: the chip is not theirs.
    const late = await db.user.create({
      data: { name: "ZZ Late Joiner", email: `zz-archive-late-${STAMP}@test.invalid`, prefs: "{}" },
    });
    const lateM = await db.membership.create({
      data: { userId: late.id, schoolId, role: "STUDENT", status: "ACTIVE", joinedAt: new Date("2026-04-01T00:00:00Z") },
      select: { id: true },
    });
    expect(await closedYearsForPupil(schoolId, lateM.id)).toEqual([]);

    // Left BEFORE the closed year began: not theirs either.
    const early = await db.user.create({
      data: { name: "ZZ Early Leaver", email: `zz-archive-early-${STAMP}@test.invalid`, prefs: "{}" },
    });
    const earlyM = await db.membership.create({
      data: {
        userId: early.id, schoolId, role: "STUDENT", status: "ACTIVE",
        joinedAt: new Date("2023-06-01T00:00:00Z"), leftAt: new Date("2024-03-31T00:00:00Z"),
      },
      select: { id: true },
    });
    expect(await closedYearsForPupil(schoolId, earlyM.id)).toEqual([]);

    // A leaver who lived the year keeps it — leaving does not erase.
    const grad = await db.user.create({
      data: { name: "ZZ Graduate", email: `zz-archive-grad-${STAMP}@test.invalid`, prefs: "{}" },
    });
    const gradM = await db.membership.create({
      data: {
        userId: grad.id, schoolId, role: "STUDENT", status: "ACTIVE",
        joinedAt: Y_START, leftAt: Y_END,
      },
      select: { id: true },
    });
    expect((await closedYearsForPupil(schoolId, gradM.id)).map((y) => y.name)).toEqual(["ZZ 2024–25"]);

    // A membership of another school reads as nothing, not as the school list.
    expect(await closedYearsForPupil(schoolId, "not-a-membership")).toEqual([]);

    // These four are this test's own; the office-numbers test downstream
    // counts the fixture roll and must not find them.
    await db.membership.deleteMany({ where: { id: { in: [lateM.id, earlyM.id, gradM.id] } } });
    await db.user.deleteMany({ where: { id: { in: [late.id, early.id, grad.id] } } });
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

  it("⚠ the year's figure is marks earned over marks available, not the mean of each piece's percent", async () => {
    const at = new Date("2025-01-15T06:00:00.000Z");
    const mk = async (title: string, pointsMilli: number, scoreMilli: number) => {
      const a = await db.assignment.create({ data: { schoolId, classId, authorMembershipId: teacherM, title, pointsMilli, publishedAt: at }, select: { id: true } });
      await db.grade.create({ data: { schoolId, assignmentId: a.id, studentMembershipId: pupilM, scoreMilli, gradedAt: at } });
      return a.id;
    };
    const quiz = await mk("ZZ Five Mark Quiz", 5_000, 1_000);
    const paper = await mk("ZZ Hundred Mark Paper", 100_000, 90_000);
    try {
      const data = await pupilYearArchive(pupilCtx(), pupilM, closedYearId);
      // With the fixture's 8 of 10: 99 of 115 is 86 %. The mean of 80 %, 20 % and 90 % would have said 63 %.
      expect(data.marks.graded).toBe(3);
      expect(data.marks.averagePercent).toBe(86);
    } finally {
      await db.assignment.deleteMany({ where: { id: { in: [quiz, paper] } } });
    }
  });

  /**
   * ⚠ THE YEAR ENDS AT MIDNIGHT ON THE SCHOOL'S CLOCK, not at 00:00 UTC of
   * its last day. The window used to be `≤ endDate`, which for this Kolkata
   * school was 05:30 on 30 April: a mark entered that afternoon fell into no
   * year at all. Now 10:00Z on the last day (15:30 IST) is in, and 19:00Z
   * (00:30 IST on 1 May) is out.
   */
  it("⚠ a mark graded on the afternoon of the year's last day is in that year", async () => {
    const mk = async (title: string, gradedAt: Date) => {
      const a = await db.assignment.create({
        data: { schoolId, classId, authorMembershipId: teacherM, title, pointsMilli: 10_000, publishedAt: gradedAt },
        select: { id: true },
      });
      await db.grade.create({
        data: { schoolId, assignmentId: a.id, studentMembershipId: pupilM, scoreMilli: 10_000, gradedAt },
      });
      return a.id;
    };
    const lastAfternoon = await mk("ZZ Last Afternoon", new Date("2025-04-30T10:00:00.000Z"));
    const nextMorning = await mk("ZZ Next Morning", new Date("2025-04-30T19:00:00.000Z"));
    const firstMorning = await mk("ZZ First Morning", new Date("2024-05-31T19:00:00.000Z")); // 00:30 IST on 1 June: in
    const beforeStart = await mk("ZZ Night Before", new Date("2024-05-31T18:00:00.000Z")); // 23:30 IST on 31 May: out
    try {
      const data = await pupilYearArchive(pupilCtx(), pupilM, closedYearId);
      expect(data.marks.graded).toBe(3); // the fixture's 8/10, the last afternoon and the first morning
      expect(data.marks.averagePercent).toBe(93);
    } finally {
      await db.assignment.deleteMany({ where: { id: { in: [lastAfternoon, nextMorning, firstMorning, beforeStart] } } });
    }
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

  /**
   * ⚠ THE TEACHER'S OWN HAND. A register somebody else took in the same class
   * is not one this teacher took, a card the lead wrote is not the
   * co-teacher's, and a class the teacher no longer holds still shows the work
   * they did in it that year.
   */
  it("⚠ counts only the registers this teacher took, the cards they wrote, and the classes of that year", async () => {
    const other = await db.user.create({
      data: { name: "ZZ Other Teacher", email: `zz-archive-other-${STAMP}@test.invalid`, prefs: "{}" },
      select: { id: true },
    });
    const otherM = await db.membership.create({
      data: { userId: other.id, schoolId, role: "TEACHER", status: "ACTIVE", joinedAt: Y_START },
      select: { id: true },
    });
    const oldClass = await db.class.create({
      data: { schoolId, name: "ZZ Class 6 (handed on)", joinCode: `ZAO${String(STAMP).slice(-6)}` },
      select: { id: true },
    });
    await db.classTeacher.create({ data: { classId: oldClass.id, schoolId, teacherMembershipId: otherM.id, role: "LEAD" } });
    // In the fixture class: a register the OTHER teacher took, one nobody signed, a card the other wrote.
    await db.attendanceSession.create({ data: { schoolId, classId, dateKey: "2024-09-03", takenByMembershipId: otherM.id } });
    await db.attendanceSession.create({ data: { schoolId, classId, dateKey: "2024-09-04" } });
    await db.reportCard.create({
      data: {
        schoolId, classId, studentMembershipId: pupilM, academicYearId: closedYearId, createdByMembershipId: otherM.id,
        title: "ZZ Other's Card", status: "PUBLISHED", publishedAt: new Date("2025-03-02T00:00:00.000Z"),
        fromDateKey: "2024-11-01", toDateKey: "2025-03-01",
      },
    });
    // In a class this teacher no longer holds: one register they took that year.
    await db.attendanceSession.create({ data: { schoolId, classId: oldClass.id, dateKey: "2024-08-12", takenByMembershipId: teacherM } });
    try {
      const data = await teacherYearArchive(
        ctx({ userId: teacherUserId, membershipId: teacherM, schoolId, role: "TEACHER" }),
        closedYearId,
      );
      expect(data.classes.map((c) => [c.className, c.registersTaken, c.assignmentsSet, c.reportCardsPublished])).toEqual([
        ["ZZ Class 6 (handed on)", 1, 0, 0],
        ["ZZ Class 7", 2, 1, 1],
      ]);
      const theirs = await teacherYearArchive(
        ctx({ userId: other.id, membershipId: otherM.id, schoolId, role: "TEACHER" }),
        closedYearId,
      );
      expect(theirs.classes).toEqual([
        { classId, className: "ZZ Class 7", registersTaken: 1, assignmentsSet: 0, reportCardsPublished: 1 },
      ]);
    } finally {
      await db.attendanceSession.deleteMany({ where: { schoolId, dateKey: { in: ["2024-09-03", "2024-09-04", "2024-08-12"] } } });
      await db.reportCard.deleteMany({ where: { schoolId, title: "ZZ Other's Card" } });
      await db.class.deleteMany({ where: { id: oldClass.id } });
      await db.membership.deleteMany({ where: { id: otherM.id } });
      await db.user.deleteMany({ where: { id: other.id } });
    }
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
    expect(data.leavers).toBe(0);
  });

  /**
   * ⚠ WHO WAS ON THE ROLL, AND WHO LEFT.
   * The roll is by the admission date the office recorded — a school that
   * came onto the platform in the year's second term has pupils whose
   * platform join date is after the year began — a suspended membership is
   * not on it, and a leaver is counted from the membership's own leaving
   * date, because the departure record is what a readmission deletes.
   */
  it("⚠ the roll follows the admission date and skips the suspended; leavers survive a readmission", async () => {
    const mk = async (tag: string, data: { joinedAt: Date; leftAt?: Date; status?: string; admissionDate?: Date }) => {
      const user = await db.user.create({
        data: { name: `ZZ ${tag}`, email: `zz-archive-${tag.toLowerCase().replace(/\s+/g, "-")}-${STAMP}@test.invalid`, prefs: "{}" },
        select: { id: true },
      });
      const m = await db.membership.create({
        data: { userId: user.id, schoolId, role: "STUDENT", status: data.status ?? "ACTIVE", joinedAt: data.joinedAt, leftAt: data.leftAt ?? null },
        select: { id: true },
      });
      if (data.admissionDate) {
        await db.pupilRecord.create({ data: { schoolId, studentMembershipId: m.id, admissionDate: data.admissionDate } });
      }
      return { userId: user.id, membershipId: m.id };
    };
    const made = await Promise.all([
      // Suspended: not on the roll.
      mk("Suspended", { joinedAt: Y_START, status: "SUSPENDED" }),
      // Admitted in 2023 by the record; the platform only saw them in 2025-06.
      mk("Early Admit", { joinedAt: new Date("2025-06-15T00:00:00.000Z"), admissionDate: new Date("2023-06-01T00:00:00.000Z") }),
      // Left at 20:30 IST on the last day (15:00Z): a leaver of this year, no departure record.
      mk("Leaver", { joinedAt: Y_START, leftAt: new Date("2025-04-30T15:00:00.000Z") }),
      // Left after the year: on this year's roll, not a leaver of it.
      mk("Later Leaver", { joinedAt: Y_START, leftAt: new Date("2025-04-30T19:00:00.000Z") }),
      // Joined after the year on the platform with an admission date after it too: out.
      mk("Late Admit", { joinedAt: new Date("2025-06-15T00:00:00.000Z"), admissionDate: new Date("2025-05-01T00:00:00.000Z") }),
    ]);
    expect(await db.schoolRecord.count({ where: { schoolId } })).toBe(0);
    try {
      const data = await schoolYearArchive(ctx({ userId: adminUserId, schoolId, role: "ADMIN" }), closedYearId);
      // The fixture pupil, the early admit, the leaver and the later leaver.
      expect(data.pupilsOnRoll).toBe(4);
      expect(data.leavers).toBe(1);
    } finally {
      await db.membership.deleteMany({ where: { id: { in: made.map((m) => m.membershipId) } } });
      await db.user.deleteMany({ where: { id: { in: made.map((m) => m.userId) } } });
    }
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
