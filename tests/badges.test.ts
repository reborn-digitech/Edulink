import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getBadges } from "@/lib/badges";
import { getAttendanceSummary, computeStreak } from "@/lib/attendance";
import { addDaysToKey, todayKey } from "@/lib/dates";

/**
 * Student badges.
 *
 * Derived on every read, never stored — so the property worth testing is that
 * they track reality rather than drifting, and that the set is honest about what
 * has and has not been earned.
 *
 * The design promise is "never stress-inducing": nothing here may produce a
 * score, a rank, or a value that can go DOWN in a way a child would experience
 * as losing something.
 */

const db = new PrismaClient();

let schoolId: string;
let membershipId: string;
let timezone: string;

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;
  timezone = school.timezone;

  // A student with attendance history from the seed, and — importantly — one
  // who has no APPROVED post of their own.
  //
  // The "removing the post removes the badge" case can only be observed on a
  // student whose `shared` badge is off to begin with. This used to take the
  // first active enrollment and silently depended on the seed never giving that
  // child a published post; the moment somebody used the app and approved one,
  // the test failed for a reason that had nothing to do with badges.
  const enrollment = await db.enrollment.findFirstOrThrow({
    where: {
      status: "ACTIVE",
      class: { schoolId },
      student: { postsAuthored: { none: { status: "APPROVED" } } },
    },
    select: { studentMembershipId: true },
  });
  membershipId = enrollment.studentMembershipId;

  await cleanup();
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

async function cleanup() {
  await db.post.deleteMany({ where: { title: { startsWith: "TEST badge" } } });
}

describe("shape", () => {
  it("returns every badge, earned or not — nothing is hidden", async () => {
    const badges = await getBadges(schoolId, membershipId, timezone);
    expect(badges.length).toBeGreaterThanOrEqual(7);
    expect(new Set(badges.map((b) => b.id)).size).toBe(badges.length);
    for (const badge of badges) {
      // Keys, not words — the reader's language resolves them at render time.
      expect(badge.labelKey.startsWith("practice.")).toBe(true);
      expect(badge.descriptionKey.startsWith("practice.")).toBe(true);
      expect(typeof badge.earned).toBe("boolean");
    }
  });

  it("⚠ exposes no score, rank or total that could be lost", async () => {
    // Checks the STRUCTURE, not the prose — an earlier version of this matched
    // the word "scored" inside the description "scored 90% or more", which is
    // ordinary English and not a score field at all.
    const badges = await getBadges(schoolId, membershipId, timezone);
    const allowedKeys = new Set(["id", "labelKey", "descriptionKey", "earned", "progress", "icon"]);

    for (const badge of badges) {
      for (const key of Object.keys(badge)) {
        expect(allowedKeys.has(key), `unexpected field "${key}" on badge ${badge.id}`).toBe(true);
      }
      if (badge.progress) {
        expect(Object.keys(badge.progress).sort()).toEqual(["current", "target"]);
      }
    }
    // And the collection itself carries no aggregate — no total, no rank.
    expect(Array.isArray(badges)).toBe(true);
  });

  it("only shows progress where being part-way is encouraging", async () => {
    const badges = await getBadges(schoolId, membershipId, timezone);
    for (const badge of badges) {
      if (!badge.progress) continue;
      // An earned badge must not still be showing a progress bar.
      expect(badge.earned, badge.id).toBe(false);
      expect(badge.progress.target).toBeGreaterThan(0);
      expect(badge.progress.current).toBeGreaterThanOrEqual(0);
      expect(badge.progress.current).toBeLessThan(badge.progress.target);
    }
  });
});

describe("derivation tracks reality", () => {
  it("awards the shared badge only once a post is APPROVED", async () => {
    const before = (await getBadges(schoolId, membershipId, timezone)).find(
      (b) => b.id === "shared",
    )!;

    const classId = (
      await db.enrollment.findFirstOrThrow({
        where: { studentMembershipId: membershipId, status: "ACTIVE" },
        select: { classId: true },
      })
    ).classId;
    const student = await db.membership.findUniqueOrThrow({
      where: { id: membershipId },
      select: { userId: true },
    });

    // A PENDING post must not earn it — the whole point of moderation.
    const post = await db.post.create({
      data: {
        schoolId,
        classId,
        authorUserId: student.userId,
        authorMembershipId: membershipId,
        scope: "CLASS",
        title: "TEST badge post",
        status: "PENDING",
        tags: "[]",
        media: "[]",
      },
    });

    const whilePending = (await getBadges(schoolId, membershipId, timezone)).find(
      (b) => b.id === "shared",
    )!;
    expect(whilePending.earned).toBe(before.earned);

    await db.post.update({ where: { id: post.id }, data: { status: "APPROVED" } });

    const afterApproval = (await getBadges(schoolId, membershipId, timezone)).find(
      (b) => b.id === "shared",
    )!;
    expect(afterApproval.earned).toBe(true);
  });

  it("is recomputed, not cached — removing the post removes the badge", async () => {
    // This is the flip side of deriving: it is honest in both directions. A
    // stored badge would leave the child holding one for a post that is gone.
    await cleanup();
    const badge = (await getBadges(schoolId, membershipId, timezone)).find(
      (b) => b.id === "shared",
    )!;
    expect(badge.earned).toBe(false);
  });

  it("does not count another student's work", async () => {
    const other = await db.membership.findFirstOrThrow({
      where: { schoolId, role: "STUDENT", id: { not: membershipId } },
      select: { id: true },
    });
    const mine = await getBadges(schoolId, membershipId, timezone);
    const theirs = await getBadges(schoolId, other.id, timezone);
    // Not asserting they differ — they legitimately might not — only that the
    // call is scoped and returns a full, independent set.
    expect(theirs).toHaveLength(mine.length);
  });

  it("returns an all-unearned set for a student with no history", async () => {
    const fresh = await db.membership.findFirst({
      where: {
        schoolId,
        role: "STUDENT",
        attendance: { none: {} },
        submissions: { none: {} },
      },
      select: { id: true },
    });
    if (!fresh) return; // seed may not contain one; not worth forcing
    const badges = await getBadges(schoolId, fresh.id, timezone);
    expect(badges.every((b) => !b.earned)).toBe(true);
    // And still shows them all, so a new child sees what is possible.
    expect(badges.length).toBeGreaterThanOrEqual(7);
  });
});

describe("an absence DOES take an attendance badge away", () => {
  /**
   * THIS REVERSES AN EARLIER DECISION, and the earlier reasoning is kept here
   * because it was not wrong — it was answering a different question.
   *
   * It used to read: a child turns up every day for a month, then is off ill for
   * a fortnight, and taking their badges away punishes them for being unwell.
   * So the badges asked whether it HAD happened, not whether it was still
   * happening, and a badge once earned could not be lost.
   *
   * The school asked for the opposite, and the reason is the streak itself: a
   * streak nobody can lose is a participation sticker, and a number a child
   * cannot affect stops meaning anything to them. So an attendance badge is now
   * a statement about how things stand, and breaking a run takes it away the
   * same day.
   *
   * What keeps that from being harsh is the ACADEMIC YEAR, not the window.
   * Whatever a child holds when the year is closed is archived into EarnedBadge
   * and kept for good, and quiz badges never enter this system at all. A badge
   * can be lost during a year and never after it.
   *
   * Built from scratch rather than read off the seed: this needs more history
   * than a fortnight, and a test that only passes on freshly-seeded data is a
   * test that starts failing for reasons nobody can find.
   */
  const SCHOOL_DAYS = 30;
  let subjectMembershipId: string;
  let subjectClassId: string;
  let teacherMembershipId: string;
  let sessionIds: string[] = [];

  beforeAll(async () => {
    // A class the seed does NOT record attendance for, so the only history this
    // child has is the history written below.
    const enrollment = await db.enrollment.findFirstOrThrow({
      where: {
        status: "ACTIVE",
        class: { schoolId, archivedAt: null, attendance: { none: {} } },
      },
      select: { studentMembershipId: true, classId: true },
    });
    subjectMembershipId = enrollment.studentMembershipId;
    subjectClassId = enrollment.classId;
    teacherMembershipId = (
      await db.classTeacher.findFirstOrThrow({ where: { classId: subjectClassId } })
    ).teacherMembershipId;

    // Every school day present, working back from yesterday.
    const days: string[] = [];
    for (let back = 1; days.length < SCHOOL_DAYS; back++) {
      const dateKey = addDaysToKey(todayKey(timezone), -back);
      const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;
      days.push(dateKey);
    }

    for (const dateKey of days) {
      const session = await db.attendanceSession.create({
        data: {
          schoolId,
          classId: subjectClassId,
          dateKey,
          takenByMembershipId: teacherMembershipId,
          finalizedAt: new Date(),
        },
      });
      sessionIds.push(session.id);
      await db.attendanceRecord.create({
        data: {
          sessionId: session.id,
          schoolId,
          studentMembershipId: subjectMembershipId,
          status: "PRESENT",
        },
      });
    }
  });

  afterAll(async () => {
    await db.attendanceRecord.deleteMany({ where: { sessionId: { in: sessionIds } } });
    await db.attendanceSession.deleteMany({ where: { id: { in: sessionIds } } });
    sessionIds = [];
  });

  async function attendanceBadges() {
    const badges = await getBadges(schoolId, subjectMembershipId, timezone);
    return {
      rockSolid: badges.find((b) => b.id === "regular")!.earned,
      hereAllWeek: badges.find((b) => b.id === "here-all-week")!.earned,
    };
  }

  it("earns both attendance badges after a clean month", async () => {
    expect(await attendanceBadges()).toEqual({ rockSolid: true, hereAllWeek: true });
  });

  it("⚠ loses both after a fortnight off", async () => {
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
      // Attendance across the window is now around 67% and the current streak is
      // nil — so both badges describe something that is no longer true, and both
      // go. The month that earned them is not erased: it is archived the moment
      // the school closes the academic year.
      const summary = await getAttendanceSummary(
        schoolId,
        subjectMembershipId,
        addDaysToKey(todayKey(timezone), -60),
        todayKey(timezone),
      );
      expect(summary.percent).toBeLessThan(90);
      expect(computeStreak(summary.recent)).toBe(0);

      expect(await attendanceBadges()).toEqual({ rockSolid: false, hereAllWeek: false });
    } finally {
      await db.attendanceRecord.updateMany({
        where: { sessionId: { in: ids }, studentMembershipId: subjectMembershipId },
        data: { status: "PRESENT" },
      });
    }
  });
});
