import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  saveAttendanceBatch,
  getRegister,
  getAttendanceSummary,
  computeStreak,
  computeBestStreak,
  bestAttendanceSpell,
} from "@/lib/attendance";
import { todayKey } from "@/lib/dates";

/**
 * Integration tests against the real seeded database.
 *
 * These exist because the attendance write path is the one place where a
 * plausible-looking implementation silently corrupts data: a replayed offline
 * batch double-writing, or a late replay resurrecting a mark the teacher
 * already corrected. Neither is visible from the UI until a parent complains.
 *
 * Run `npm run db:reset` first — these assume the seed.
 */

const db = new PrismaClient();

type Fixture = {
  schoolId: string;
  classId: string;
  teacherMembershipId: string;
  teacherUserId: string;
  students: string[];
  otherSchoolId: string;
  otherStudentId: string;
  timezone: string;
};

let fx: Fixture;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });

  const klass = await db.class.findFirstOrThrow({
    where: { schoolId: riverside.id },
    orderBy: { name: "asc" },
  });

  const teacher = await db.membership.findFirstOrThrow({
    where: { schoolId: riverside.id, role: "TEACHER" },
  });

  const enrollments = await db.enrollment.findMany({
    where: { classId: klass.id, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });

  const otherStudent = await db.membership.findFirstOrThrow({
    where: { schoolId: oakfield.id, role: "STUDENT" },
  });

  fx = {
    schoolId: riverside.id,
    classId: klass.id,
    teacherMembershipId: teacher.id,
    teacherUserId: teacher.userId,
    students: enrollments.map((e) => e.studentMembershipId),
    otherSchoolId: oakfield.id,
    otherStudentId: otherStudent.id,
    timezone: riverside.timezone,
  };

  expect(fx.students.length).toBeGreaterThan(3);

  await cleanSyntheticData();
});

afterAll(async () => {
  await cleanSyntheticData();
  await db.$disconnect();
});

/**
 * Removes everything these tests write.
 *
 * Necessary because the suite runs against the shared dev database rather than
 * a throwaway one, and an earlier failing run used to leave rows behind that
 * made the NEXT run fail for the wrong reason — the worst kind of flake, since
 * it implicates innocent code. Synthetic sessions all sit in 2025-XX, well
 * clear of the seed's rolling two-week window.
 */
async function cleanSyntheticData() {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" }, select: { id: true } });
  // Scoped to this suite's school: an unscoped delete by date once took every school's 2025 registers with it (2026-09-24).
  await db.attendanceRecord.deleteMany({
    where: { session: { schoolId: riverside.id, dateKey: { startsWith: "2025-" } } },
  });
  await db.attendanceSession.deleteMany({ where: { schoolId: riverside.id, dateKey: { startsWith: "2025-" } } });
  // Belt and braces: any cross-tenant row a regression might have written.
  await db.attendanceRecord.deleteMany({
    where: { schoolId: fx.schoolId, student: { schoolId: fx.otherSchoolId } },
  });
}

function save(dateKey: string, marks: Parameters<typeof saveAttendanceBatch>[0]["marks"]) {
  return saveAttendanceBatch({
    schoolId: fx.schoolId,
    classId: fx.classId,
    dateKey,
    marks,
    takenByMembershipId: fx.teacherMembershipId,
    actorUserId: fx.teacherUserId,
    notify: false, // notification fan-out is tested separately
  });
}

/** Each test gets its own past date so they cannot interfere with each other. */
let dayCounter = 0;
function freshDate(): string {
  dayCounter++;
  return `2025-0${(dayCounter % 9) + 1}-1${dayCounter % 9}`;
}

describe("saveAttendanceBatch — idempotency", () => {
  it("applies a first batch", async () => {
    const dateKey = freshDate();
    const result = await save(dateKey, [
      { studentMembershipId: fx.students[0]!, status: "PRESENT", clientId: "c-1" },
      { studentMembershipId: fx.students[1]!, status: "ABSENT", clientId: "c-2" },
    ]);
    expect(result.applied).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.rejected).toEqual([]);
  });

  it("is a no-op when the identical batch is replayed", async () => {
    const dateKey = freshDate();
    const marks = [
      { studentMembershipId: fx.students[0]!, status: "PRESENT" as const, clientId: "replay-1" },
      { studentMembershipId: fx.students[1]!, status: "LATE" as const, clientId: "replay-2" },
    ];

    const first = await save(dateKey, marks);
    const second = await save(dateKey, marks);
    const third = await save(dateKey, marks);

    expect(first.applied).toBe(2);
    expect(second.applied).toBe(0);
    expect(second.skipped).toBe(2);
    expect(third.applied).toBe(0);

    // The decisive check: exactly one row per student, not three.
    const rows = await db.attendanceRecord.count({
      where: { session: { classId: fx.classId, dateKey } },
    });
    expect(rows).toBe(2);
  });

  it("creates exactly one session for a class and date under repeated writes", async () => {
    const dateKey = freshDate();
    await Promise.all([
      save(dateKey, [{ studentMembershipId: fx.students[0]!, status: "PRESENT", clientId: "s-a" }]),
      save(dateKey, [{ studentMembershipId: fx.students[1]!, status: "PRESENT", clientId: "s-b" }]),
    ]);
    const sessions = await db.attendanceSession.count({
      where: { classId: fx.classId, dateKey },
    });
    expect(sessions).toBe(1);
  });

  it("applies a genuine correction that arrives after the original", async () => {
    const dateKey = freshDate();
    const student = fx.students[0]!;

    await save(dateKey, [
      { studentMembershipId: student, status: "ABSENT", clientId: "orig", markedAt: "2025-05-01T09:00:00.000Z" },
    ]);
    const correction = await save(dateKey, [
      { studentMembershipId: student, status: "PRESENT", clientId: "fix", markedAt: "2025-05-01T09:05:00.000Z" },
    ]);

    expect(correction.applied).toBe(1);
    const row = await db.attendanceRecord.findFirstOrThrow({
      where: { session: { classId: fx.classId, dateKey }, studentMembershipId: student },
    });
    expect(row.status).toBe("PRESENT");
  });

  it("does NOT let a stale replay undo a newer correction", async () => {
    // The scenario: teacher marks ABSENT offline at 09:00, corrects to PRESENT
    // at 09:05 once back online, and only THEN does Background Sync deliver the
    // original 09:00 batch. Last-write-wins by wall clock would be wrong here;
    // the newer correction has to survive.
    const dateKey = freshDate();
    const student = fx.students[0]!;

    await save(dateKey, [
      { studentMembershipId: student, status: "PRESENT", clientId: "new", markedAt: "2025-05-02T09:05:00.000Z" },
    ]);
    const lateReplay = await save(dateKey, [
      { studentMembershipId: student, status: "ABSENT", clientId: "old", markedAt: "2025-05-02T09:00:00.000Z" },
    ]);

    expect(lateReplay.applied).toBe(0);
    expect(lateReplay.skipped).toBe(1);

    const row = await db.attendanceRecord.findFirstOrThrow({
      where: { session: { classId: fx.classId, dateKey }, studentMembershipId: student },
    });
    expect(row.status).toBe("PRESENT");
  });

  it("applies a same-millisecond retry rather than deadlocking on equality", async () => {
    const dateKey = freshDate();
    const student = fx.students[0]!;
    const stamp = "2025-05-03T09:00:00.000Z";

    await save(dateKey, [
      { studentMembershipId: student, status: "PRESENT", clientId: "t-1", markedAt: stamp },
    ]);
    const same = await save(dateKey, [
      { studentMembershipId: student, status: "LATE", clientId: "t-2", markedAt: stamp },
    ]);

    expect(same.applied).toBe(1);
  });
});

describe("saveAttendanceBatch — tenant isolation", () => {
  it("refuses to mark a student from another school", async () => {
    const dateKey = freshDate();
    const result = await save(dateKey, [
      { studentMembershipId: fx.otherStudentId, status: "PRESENT", clientId: "x-1" },
    ]);

    expect(result.applied).toBe(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]!.studentMembershipId).toBe(fx.otherStudentId);

    // And nothing was written for them anywhere.
    const leaked = await db.attendanceRecord.count({
      where: { studentMembershipId: fx.otherStudentId, schoolId: fx.schoolId },
    });
    expect(leaked).toBe(0);
  });

  it("rejects a cross-school student while still applying the valid marks", async () => {
    const dateKey = freshDate();
    const result = await save(dateKey, [
      { studentMembershipId: fx.students[0]!, status: "PRESENT", clientId: "mix-1" },
      { studentMembershipId: fx.otherStudentId, status: "PRESENT", clientId: "mix-2" },
      { studentMembershipId: fx.students[1]!, status: "LATE", clientId: "mix-3" },
    ]);

    // A poisoned entry must not discard the teacher's legitimate work.
    expect(result.applied).toBe(2);
    expect(result.rejected).toHaveLength(1);
  });

  it("refuses a student who is in this school but not in this class", async () => {
    const dateKey = freshDate();
    const outsider = await db.membership.findFirst({
      where: {
        schoolId: fx.schoolId,
        role: "STUDENT",
        enrollments: { none: { classId: fx.classId } },
      },
    });
    // The seed spreads students across classes, so this should exist.
    expect(outsider).not.toBeNull();

    const result = await save(dateKey, [
      { studentMembershipId: outsider!.id, status: "PRESENT", clientId: "out-1" },
    ]);
    expect(result.applied).toBe(0);
    expect(result.rejected).toHaveLength(1);
  });

  it("never returns another school's roster from getRegister", async () => {
    const register = await getRegister(fx.otherSchoolId, fx.classId, todayKey(fx.timezone));
    // Riverside's class id, queried with Oakfield's school id -> nothing.
    expect(register).toBeNull();
  });
});

describe("saveAttendanceBatch — no register for a save of nothing", () => {
  // The session row is what every "register taken" reader counts, so a batch
  // that stores no mark must not leave one behind — the data audit found
  // eighteen registers "taken" with nothing in them. Dates of their own, in a
  // month `freshDate` never reaches, because that counter wraps and the
  // assertion here is that NO session exists for the day.
  it("⚠ a batch of only rejected marks leaves no session, and still names each rejection", async () => {
    const dateKey = "2025-11-03";
    const result = await save(dateKey, [
      { studentMembershipId: fx.otherStudentId, status: "PRESENT", clientId: "none-1" },
      { studentMembershipId: "zz-not-a-membership", status: "ABSENT", clientId: "none-2" },
    ]);

    expect(result.applied).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.rejected.map((r) => r.studentMembershipId)).toEqual([fx.otherStudentId, "zz-not-a-membership"]);
    expect(result.rejected.every((r) => r.reason === "Not enrolled in this class")).toBe(true);
    expect(result.sessionId).toBeNull();

    const session = await db.attendanceSession.findUnique({
      where: { classId_dateKey: { classId: fx.classId, dateKey } },
    });
    expect(session).toBeNull();
  });

  it("an empty batch leaves no session either", async () => {
    const dateKey = "2025-11-04";
    const result = await save(dateKey, []);
    expect(result).toEqual({ applied: 0, skipped: 0, rejected: [], sessionId: null });
    expect(await db.attendanceSession.count({ where: { classId: fx.classId, dateKey } })).toBe(0);
  });

  it("a batch with one valid mark still creates the session, taken by the teacher", async () => {
    const dateKey = "2025-11-05";
    const result = await save(dateKey, [
      { studentMembershipId: fx.students[0]!, status: "PRESENT", clientId: "one-1" },
      { studentMembershipId: fx.otherStudentId, status: "PRESENT", clientId: "one-2" },
    ]);

    expect(result.applied).toBe(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.sessionId).not.toBeNull();

    const session = await db.attendanceSession.findUnique({
      where: { classId_dateKey: { classId: fx.classId, dateKey } },
    });
    expect(session?.id).toBe(result.sessionId);
    expect(session?.takenByMembershipId).toBe(fx.teacherMembershipId);
  });
});

describe("getAttendanceSummary", () => {
  it("counts late arrivals as attended and returns a whole-number percent", async () => {
    const student = fx.students[0]!;
    const summary = await getAttendanceSummary(fx.schoolId, student, "2020-01-01", "2030-01-01");

    expect(summary.total).toBeGreaterThan(0);
    expect(Number.isInteger(summary.percent)).toBe(true);
    expect(summary.percent).toBeGreaterThanOrEqual(0);
    expect(summary.percent).toBeLessThanOrEqual(100);

    const attended = summary.counts.PRESENT + summary.counts.LATE;
    expect(summary.percent).toBe(Math.round((attended * 100) / summary.total));
  });

  it("returns null rather than NaN when there is no data at all", async () => {
    const summary = await getAttendanceSummary(fx.schoolId, fx.students[0]!, "1999-01-01", "1999-01-02");
    expect(summary.total).toBe(0);
    expect(summary.percent).toBeNull();
  });

  it("does not leak another school's records", async () => {
    const summary = await getAttendanceSummary(fx.otherSchoolId, fx.students[0]!, "2020-01-01", "2030-01-01");
    expect(summary.total).toBe(0);
  });
});

describe("currentStreakFor", () => {
  it("⚠ counts a run longer than the home page's four-week window, and stops at the first day not attended", async () => {
    const { currentStreakFor } = await import("@/lib/attendance");
    const student = fx.students[3]!;
    const others = fx.students.filter((s) => s !== student);
    // Forty consecutive marked days, the oldest an absence, all within the
    // synthetic 2025 range the suite cleans up.
    const days: string[] = [];
    for (let i = 0; i < 41; i++) {
      const d = new Date(Date.UTC(2025, 9, 1) + i * 86_400_000);
      days.push(d.toISOString().slice(0, 10));
    }
    for (const [i, dateKey] of days.entries()) {
      await save(dateKey, [{ studentMembershipId: student, status: i === 0 ? "ABSENT" : "PRESENT", clientId: `streak-${i}` }, ...others.slice(0, 1).map((s) => ({ studentMembershipId: s, status: "PRESENT" as const, clientId: `streak-o-${i}` }))]);
    }
    const streak = await currentStreakFor(fx.schoolId, student, days[days.length - 1]!);
    expect(streak).toBe(40);
    // The thirty-mark list the pages used to read would have said 30.
    const summary = await getAttendanceSummary(fx.schoolId, student, days[days.length - 28]!, days[days.length - 1]!);
    expect(computeStreak(summary.recent)).toBeLessThan(40);
    // As of a day inside the run, the run is what it was then.
    expect(await currentStreakFor(fx.schoolId, student, days[10]!)).toBe(10);
  });
});

describe("computeStreak", () => {
  it("counts consecutive attended days from the most recent backwards", () => {
    expect(
      computeStreak([
        { dateKey: "2026-07-27", status: "PRESENT" },
        { dateKey: "2026-07-24", status: "LATE" },
        { dateKey: "2026-07-23", status: "PRESENT" },
        { dateKey: "2026-07-22", status: "ABSENT" },
        { dateKey: "2026-07-21", status: "PRESENT" },
      ]),
    ).toBe(3);
  });

  it("is zero when the most recent day was an absence", () => {
    expect(
      computeStreak([
        { dateKey: "2026-07-27", status: "ABSENT" },
        { dateKey: "2026-07-24", status: "PRESENT" },
      ]),
    ).toBe(0);
  });

  it("is zero for no history, not NaN or undefined", () => {
    expect(computeStreak([])).toBe(0);
  });

  it("does not depend on the input already being sorted", () => {
    expect(
      computeStreak([
        { dateKey: "2026-07-21", status: "PRESENT" },
        { dateKey: "2026-07-27", status: "PRESENT" },
        { dateKey: "2026-07-23", status: "ABSENT" },
      ]),
    ).toBe(1);
  });
});

describe("computeBestStreak", () => {
  /**
   * `computeStreak` says "are you on a run"; this says "did you ever have one".
   * The badge uses this one, because the first question takes a reward away from
   * a child the morning after a day off sick.
   */
  it("finds the longest run anywhere in the window, not the current one", () => {
    expect(
      computeBestStreak([
        { dateKey: "2026-07-27", status: "ABSENT" },
        { dateKey: "2026-07-24", status: "PRESENT" },
        { dateKey: "2026-07-23", status: "PRESENT" },
        { dateKey: "2026-07-22", status: "LATE" },
        { dateKey: "2026-07-21", status: "PRESENT" },
        { dateKey: "2026-07-20", status: "PRESENT" },
      ]),
    ).toBe(5);
  });

  it("⚠ survives a later absence — the run still happened", () => {
    const week = [
      { dateKey: "2026-07-06", status: "PRESENT" as const },
      { dateKey: "2026-07-07", status: "PRESENT" as const },
      { dateKey: "2026-07-08", status: "PRESENT" as const },
      { dateKey: "2026-07-09", status: "PRESENT" as const },
      { dateKey: "2026-07-10", status: "PRESENT" as const },
    ];
    expect(computeBestStreak(week)).toBe(5);
    expect(computeBestStreak([...week, { dateKey: "2026-07-13", status: "ABSENT" }])).toBe(5);
  });

  it("counts a late arrival as being there", () => {
    expect(
      computeBestStreak([
        { dateKey: "2026-07-06", status: "LATE" },
        { dateKey: "2026-07-07", status: "LATE" },
      ]),
    ).toBe(2);
  });

  it("is zero for no history", () => {
    expect(computeBestStreak([])).toBe(0);
  });

  it("does not depend on the input already being sorted", () => {
    expect(
      computeBestStreak([
        { dateKey: "2026-07-08", status: "PRESENT" },
        { dateKey: "2026-07-06", status: "PRESENT" },
        { dateKey: "2026-07-07", status: "PRESENT" },
      ]),
    ).toBe(3);
  });
});

describe("bestAttendanceSpell", () => {
  const perfect = (n: number, from = 1) =>
    Array.from({ length: n }, (_, i) => ({
      dateKey: `2026-07-${String(from + i).padStart(2, "0")}`,
      status: "PRESENT" as const,
    }));

  it("⚠ refuses to judge before there is enough history", () => {
    // One day present is "100% attendance". Without this a child earns the
    // badge on their first morning, which makes it mean nothing.
    expect(bestAttendanceSpell(perfect(3), 10)).toBeNull();
    expect(bestAttendanceSpell([], 10)).toBeNull();
  });

  it("is 100 for a clean stretch", () => {
    expect(bestAttendanceSpell(perfect(10), 10)).toBe(100);
  });

  it("⚠ keeps the good spell when a bad one follows", () => {
    // Ten clean days, then a fortnight off. Whole-window attendance is 42%;
    // what happened is that they attended ten days in a row.
    const days = [
      ...perfect(10),
      ...Array.from({ length: 14 }, (_, i) => ({
        dateKey: `2026-08-${String(i + 1).padStart(2, "0")}`,
        status: "ABSENT" as const,
      })),
    ];
    expect(bestAttendanceSpell(days, 10)).toBe(100);
  });

  it("finds a good spell that comes AFTER a bad one", () => {
    // A child who was ill in September and perfect since must not be judged on
    // September forever.
    const days = [
      ...Array.from({ length: 10 }, (_, i) => ({
        dateKey: `2026-06-${String(i + 1).padStart(2, "0")}`,
        status: "ABSENT" as const,
      })),
      ...perfect(10),
    ];
    expect(bestAttendanceSpell(days, 10)).toBe(100);
  });

  it("reports the real figure when no stretch is clean", () => {
    const days = [
      ...perfect(9),
      { dateKey: "2026-07-10", status: "ABSENT" as const },
    ];
    // Ten days, nine attended — and no shorter window is allowed to flatter it.
    expect(bestAttendanceSpell(days, 10)).toBe(90);
  });
});
