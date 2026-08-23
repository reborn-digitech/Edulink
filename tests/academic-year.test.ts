import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  awardPermanentBadge,
  badgeHistory,
  closeAcademicYear,
  createAcademicYear,
  currentAcademicYear,
} from "@/lib/academic-year";
import { getBadges, getBadgesForMany } from "@/lib/badges";
import { addDaysToKey, todayKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";

/**
 * The academic year, and the one thing it exists to get right.
 *
 * Attendance badges are now LOSABLE — break a streak and it goes the same day.
 * That is only fair if a year's achievements are kept, so closing the year
 * writes down whatever each child holds at that moment and nothing recalculates
 * it again.
 *
 * The ordering is the whole feature and it is the easiest thing to get wrong:
 * snapshot FIRST, flip SECOND. Do it the other way and every badge is
 * recalculated against a fresh year, reads as unearned, and the archive records
 * that a school's children achieved nothing — silently, once a year, in the one
 * operation nobody runs twice to check.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
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

let admin: ActiveContext;
let teacher: ActiveContext;
let schoolId: string;
let timezone: string;
let subjectMembershipId: string;
const sessionIds: string[] = [];

async function cleanup() {
  await db.earnedBadge.deleteMany({ where: { schoolId } });
  await db.academicYear.deleteMany({ where: { schoolId, name: { startsWith: "TEST " } } });
  await db.examSeries.deleteMany({ where: { schoolId, name: { startsWith: "TEST " } } });
  await db.reviewRound.deleteMany({ where: { schoolId, closesDateKey: { startsWith: "1999" } } });
}

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  timezone = school.timezone;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId, role: "TEACHER" },
  });

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId, role: "ADMIN" });
  teacher = ctx({ userId: tom.id, membershipId: tomTeacher.id, schoolId, role: "TEACHER" });

  // A child with a clean month, in a class the seed records no attendance for,
  // so the only history is the history written here.
  const enrollment = await db.enrollment.findFirstOrThrow({
    where: { status: "ACTIVE", class: { schoolId, archivedAt: null, attendance: { none: {} } } },
    select: { studentMembershipId: true, classId: true },
  });
  subjectMembershipId = enrollment.studentMembershipId;
  const teacherMembershipId = (
    await db.classTeacher.findFirstOrThrow({ where: { classId: enrollment.classId } })
  ).teacherMembershipId;

  const days: string[] = [];
  for (let back = 1; days.length < 30; back++) {
    const dateKey = addDaysToKey(todayKey(timezone), -back);
    const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    days.push(dateKey);
  }

  for (const dateKey of days) {
    const session = await db.attendanceSession.create({
      data: {
        schoolId,
        classId: enrollment.classId,
        dateKey,
        takenByMembershipId: teacherMembershipId,
        finalizedAt: new Date(),
      },
    });
    sessionIds.push(session.id);
    await db.attendanceRecord.create({
      data: { sessionId: session.id, schoolId, studentMembershipId: subjectMembershipId, status: "PRESENT" },
    });
  }

  await cleanup();
});

afterEach(cleanup);

afterAll(async () => {
  await db.attendanceRecord.deleteMany({ where: { sessionId: { in: sessionIds } } });
  await db.attendanceSession.deleteMany({ where: { id: { in: sessionIds } } });
  await cleanup();
  await db.$disconnect();
});

/**
 * Two years, positioned RELATIVE TO THE FIXTURE rather than at fixed dates.
 *
 * The child's clean month was written into the last thirty school days, so the
 * outgoing year has to contain those days and the incoming one has to start
 * after them — otherwise "the new year starts empty" is not being tested at all,
 * it is just being asserted next to a window that still includes the old
 * register. Fixed dates got this wrong once already.
 */
async function twoYears() {
  const today = new Date(`${todayKey(timezone)}T00:00:00.000Z`);
  const yearAgo = new Date(today.getTime() - 300 * 86_400_000);
  const tomorrow = new Date(today.getTime() + 86_400_000);

  const first = await createAcademicYear(admin, {
    name: "TEST outgoing",
    startDate: yearAgo,
    endDate: today,
  });
  const second = await createAcademicYear(admin, {
    name: "TEST incoming",
    // Starts tomorrow: nothing in the register belongs to it yet, which is
    // exactly the state a school is in on the first morning of term.
    startDate: tomorrow,
    endDate: new Date(tomorrow.getTime() + 300 * 86_400_000),
  });
  return { first, second };
}

describe("setting up a year", () => {
  it("the first one a school creates becomes current", async () => {
    const id = await createAcademicYear(admin, {
      name: "TEST 2025–26",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2026-04-30"),
    });
    expect((await currentAcademicYear(schoolId))?.id).toBe(id);
  });

  it("⚠ a later one does NOT — adding next year's dates must not end this year", async () => {
    const { first, second } = await twoYears();
    const current = await currentAcademicYear(schoolId);
    expect(current?.id).toBe(first);
    expect(current?.id).not.toBe(second);
  });

  it("refuses a year that ends before it starts", async () => {
    await expect(
      createAcademicYear(admin, {
        name: "TEST backwards",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2025-06-01"),
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ refuses everyone who is not an admin", async () => {
    await expect(
      createAcademicYear(teacher, {
        name: "TEST teacher's year",
        startDate: new Date("2025-06-01"),
        endDate: new Date("2026-04-30"),
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});

describe("closing a year", () => {
  it("⚠ archives the badges a child holds AT THAT MOMENT", async () => {
    const { first, second } = await twoYears();

    const live = (await getBadges(schoolId, subjectMembershipId, timezone)).filter((b) => b.earned);
    expect(live.length).toBeGreaterThan(0); // the clean month earned something

    await closeAcademicYear(admin, first, second);

    const archived = await badgeHistory(schoolId, subjectMembershipId);
    for (const badge of live) {
      expect(archived.map((a) => a.badgeId)).toContain(badge.id);
    }
  });

  it("⚠ and those archived badges SURVIVE the streak breaking afterwards", async () => {
    // The whole point. A badge can be lost during a year and never after it.
    const { first, second } = await twoYears();
    await closeAcademicYear(admin, first, second);

    const before = await badgeHistory(schoolId, subjectMembershipId);
    expect(before.length).toBeGreaterThan(0);

    const recent = await db.attendanceSession.findMany({
      where: { id: { in: sessionIds } },
      orderBy: { dateKey: "desc" },
      take: 10,
      select: { id: true },
    });
    const ids = recent.map((r) => r.id);
    await db.attendanceRecord.updateMany({
      where: { sessionId: { in: ids }, studentMembershipId: subjectMembershipId },
      data: { status: "ABSENT" },
    });

    try {
      // Live badges are gone…
      const nowLive = (await getBadges(schoolId, subjectMembershipId, timezone)).filter((b) => b.earned);
      expect(nowLive.some((b) => b.id === "regular")).toBe(false);

      // …and the archive is untouched.
      const after = await badgeHistory(schoolId, subjectMembershipId);
      expect(after.map((a) => a.badgeId).sort()).toEqual(before.map((a) => a.badgeId).sort());
    } finally {
      await db.attendanceRecord.updateMany({
        where: { sessionId: { in: ids }, studentMembershipId: subjectMembershipId },
        data: { status: "PRESENT" },
      });
    }
  });

  it("⚠ the new year starts EMPTY — badges reset at the boundary", async () => {
    // The requirement in one assertion. The child's clean month is behind them
    // and the register for the new year has not started, so they hold nothing
    // live — while the archive above still records what they did.
    const { first, second } = await twoYears();
    const before = (await getBadges(schoolId, subjectMembershipId, timezone)).filter((b) => b.earned);
    expect(before.some((b) => b.id === "regular")).toBe(true);

    await closeAcademicYear(admin, first, second);

    const after = (await getBadges(schoolId, subjectMembershipId, timezone)).filter((b) => b.earned);
    expect(after.some((b) => b.id === "regular")).toBe(false);
    expect(after.some((b) => b.id === "here-all-week")).toBe(false);
  });

  it("moves the school into the next year and closes the old one", async () => {
    const { first, second } = await twoYears();
    await closeAcademicYear(admin, first, second);

    expect((await currentAcademicYear(schoolId))?.id).toBe(second);
    const closed = await db.academicYear.findUniqueOrThrow({ where: { id: first } });
    expect(closed.isCurrent).toBe(false);
    expect(closed.closedAt).not.toBeNull();
  });

  it("⚠ running it twice archives nothing extra", async () => {
    // An admin unsure whether it worked will press it again.
    const { first, second } = await twoYears();
    await closeAcademicYear(admin, first, second);
    const once = await badgeHistory(schoolId, subjectMembershipId);

    const again = await closeAcademicYear(admin, first, second);
    const twice = await badgeHistory(schoolId, subjectMembershipId);

    expect(twice.length).toBe(once.length);
    // And it SAYS so: the count is rows this run added, not rows that exist.
    expect(again.badgesArchived).toBe(0);
  });

  it("⚠ the batch the close reads is the profile the child sees — same function, list of one", async () => {
    // The snapshot now reads the whole school in chunks. If the batched read
    // and the single read ever disagreed, the archive would quietly record a
    // different year from the one the child watched.
    const pupils = await db.membership.findMany({
      where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
      select: { id: true },
    });
    const ids = pupils.map((p) => p.id);
    expect(ids).toContain(subjectMembershipId);

    const batch = await getBadgesForMany(schoolId, ids, timezone);
    expect(batch.size).toBe(ids.length);
    for (const id of ids.slice(0, 25).concat(subjectMembershipId)) {
      expect(batch.get(id)).toEqual(await getBadges(schoolId, id, timezone));
    }
    expect(batch.get(subjectMembershipId)!.find((b) => b.id === "here-all-week")!.earned).toBe(true);
  });

  it("⚠ archives every pupil in the school, not only the first chunk", async () => {
    const { first, second } = await twoYears();
    const pupils = await db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } });
    const result = await closeAcademicYear(admin, first, second);
    expect(result.studentsArchived).toBe(pupils);
    // The subject's clean month is in there, whichever chunk it landed in.
    expect((await badgeHistory(schoolId, subjectMembershipId)).map((a) => a.badgeId)).toContain("here-all-week");
  });

  it("⚠ refuses everyone who is not an admin", async () => {
    const { first, second } = await twoYears();
    await expect(closeAcademicYear(teacher, first, second)).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses closing a year into itself", async () => {
    const { first } = await twoYears();
    await expect(closeAcademicYear(admin, first, first)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("permanent badges", () => {
  it("⚠ are kept forever and belong to no year", async () => {
    await awardPermanentBadge(schoolId, subjectMembershipId, {
      badgeId: "abhyaas:maths-fractions",
      label: "Fractions, solved",
      description: "Finished every question without opening a solution",
    });

    const history = await badgeHistory(schoolId, subjectMembershipId);
    const badge = history.find((b) => b.badgeId === "abhyaas:maths-fractions");
    expect(badge?.permanent).toBe(true);
    expect(badge?.yearName).toBeNull();
  });

  it("⚠ survive a year being closed, and are not duplicated by it", async () => {
    await awardPermanentBadge(schoolId, subjectMembershipId, {
      badgeId: "abhyaas:maths-fractions",
      label: "Fractions, solved",
    });
    const { first, second } = await twoYears();
    await closeAcademicYear(admin, first, second);

    const history = await badgeHistory(schoolId, subjectMembershipId);
    const matching = history.filter((b) => b.badgeId === "abhyaas:maths-fractions");
    expect(matching).toHaveLength(1);
    expect(matching[0]!.permanent).toBe(true);
  });

  it("awarding the same one twice is a no-op", async () => {
    await awardPermanentBadge(schoolId, subjectMembershipId, { badgeId: "abhyaas:x", label: "X" });
    await awardPermanentBadge(schoolId, subjectMembershipId, { badgeId: "abhyaas:x", label: "X" });

    const history = await badgeHistory(schoolId, subjectMembershipId);
    expect(history.filter((b) => b.badgeId === "abhyaas:x")).toHaveLength(1);
  });
});

describe("the year tidies itself", () => {
  it("archives the year's exam series and closes its open rounds — and leaves next year's alone", async () => {
    const { first, second } = await twoYears();
    const today = todayKey(timezone);
    // Two series: one whose papers sat in the outgoing year, one dated after it.
    const gone = await db.examSeries.create({
      data: { schoolId, name: "TEST last year's final", gradeLevel: "5", slots: { create: [{ schoolId, subject: "Maths", dateKey: today, pointsMilli: 50_000, position: 0 }] } },
    });
    const stays = await db.examSeries.create({
      data: { schoolId, name: "TEST next year's unit test", gradeLevel: "5", slots: { create: [{ schoolId, subject: "Maths", dateKey: "2999-01-01", pointsMilli: 50_000, position: 0 }] } },
    });
    const round = await db.reviewRound.create({
      data: { schoolId, audience: "STUDENTS", closesDateKey: "1999-12-31", status: "OPEN" },
    });

    const result = await closeAcademicYear(admin, first, second);
    expect(result.seriesArchived).toBeGreaterThanOrEqual(1);
    expect(result.roundsClosed).toBeGreaterThanOrEqual(1);

    expect((await db.examSeries.findUniqueOrThrow({ where: { id: gone.id } })).archivedAt).not.toBeNull();
    expect((await db.examSeries.findUniqueOrThrow({ where: { id: stays.id } })).archivedAt).toBeNull();
    expect((await db.reviewRound.findUniqueOrThrow({ where: { id: round.id } })).status).toBe("CLOSED");
    await db.examSeries.deleteMany({ where: { id: { in: [gone.id, stays.id] } } });
  });
});
