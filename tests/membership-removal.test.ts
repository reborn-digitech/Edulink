import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { removeMembership } from "@/lib/membership";
import { recordDeparture } from "@/lib/school-record";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * Removing somebody who was never really here.
 *
 * THE THIRD VERB, and every test in this file is about keeping it apart from
 * the other two. A school pauses a pupil who is coming back, records one who
 * has gone to another school, and removes one who was added by mistake — and
 * the last of those is the only thing in this codebase that deletes.
 *
 * SO THE PRECONDITION IS WHAT IS UNDER TEST, far more than the deletion. The
 * guard is not a confirmation dialog, which an admin clicks through at four
 * o'clock on a Friday; it is a refusal that fires the moment there is anything
 * a school would have had to certify. `⚠ refuses` below is the file.
 *
 * Fixtures own their school, for the reason at the top of account-merge.test.ts
 * — a suite that DELETES memberships pointed at seeded people would take other
 * suites' fixtures with it.
 */

const db = new PrismaClient();

const SCHOOL_NAME = "ZZ Removal Test School";
const SCHOOL_SLUG = "zz-removal-test";
const ADMIN_EMAIL = "removal.admin@zzremoval.test";
const PUPIL_EMAIL = "removal.pupil@zzremoval.test";
const STAFF_EMAIL = "removal.staff@zzremoval.test";
const CLASS_CODE = "ZZZ-REMOVAL";

let schoolId: string;
let classId: string;
let assignmentId: string;
let admin: ActiveContext;
let pupilMembershipId: string;
let pupilUserId: string;
let staffMembershipId: string;

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
  const school = await db.school.upsert({
    where: { slug: SCHOOL_SLUG },
    create: {
      name: SCHOOL_NAME,
      slug: SCHOOL_SLUG,
      code: "ZZREMOVE",
      contactEmail: "office@zzremoval.test",
    },
    update: { name: SCHOOL_NAME },
  });
  schoolId = school.id;

  const klass = await db.class.upsert({
    where: { joinCode: CLASS_CODE },
    create: { schoolId, name: "ZZ Removal Class", gradeLevel: "5", joinCode: CLASS_CODE },
    update: {},
  });
  classId = klass.id;

  const adminUser = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: { email: ADMIN_EMAIL, name: "Removal Admin", prefs: "{}" },
    update: {},
  });
  const adminMembership = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: adminUser.id, schoolId, role: "ADMIN" } },
    create: { userId: adminUser.id, schoolId, role: "ADMIN", status: "ACTIVE" },
    update: { status: "ACTIVE", leftAt: null },
  });
  admin = ctx({
    userId: adminUser.id,
    membershipId: adminMembership.id,
    schoolId,
    role: "ADMIN",
  });

  const assignment = await db.assignment.upsert({
    where: { id: "zz-removal-assignment" },
    create: {
      id: "zz-removal-assignment",
      schoolId,
      classId,
      authorMembershipId: adminMembership.id,
      title: "ZZ Removal Homework",
      dueAt: new Date("2026-05-01T00:00:00Z"),
    },
    update: {},
  });
  assignmentId = assignment.id;
});

/** A pupil added this morning, with nothing behind them yet. */
async function makeFreshPupil(): Promise<void> {
  await wipe();
  const user = await db.user.create({
    data: { email: PUPIL_EMAIL, name: "Mis Typed", preferredName: "Mis", prefs: "{}" },
  });
  pupilUserId = user.id;
  const membership = await db.membership.create({
    data: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE", gradeLevel: "5" },
  });
  pupilMembershipId = membership.id;
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: membership.id, status: "ACTIVE" },
  });

  const staff = await db.user.create({
    data: { email: STAFF_EMAIL, name: "Real Teacher", prefs: "{}" },
  });
  const staffMembership = await db.membership.create({
    data: { userId: staff.id, schoolId, role: "TEACHER", status: "ACTIVE" },
  });
  staffMembershipId = staffMembership.id;
}

async function wipe(): Promise<void> {
  const users = await db.user.findMany({
    where: { email: { in: [PUPIL_EMAIL, STAFF_EMAIL] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return;
  await db.schoolRecord.deleteMany({ where: { studentUserId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}

afterEach(wipe);

afterAll(async () => {
  await wipe();
  await db.assignment.deleteMany({ where: { id: assignmentId } });
  await db.school.deleteMany({ where: { slug: SCHOOL_SLUG } });
  await db.user.deleteMany({ where: { email: ADMIN_EMAIL } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("removing a pupil added by mistake", () => {
  it("takes the row and their enrolments with it", async () => {
    await makeFreshPupil();

    const result = await removeMembership(admin, pupilMembershipId);
    expect(result).toEqual({ ok: true });

    expect(await db.membership.findUnique({ where: { id: pupilMembershipId } })).toBeNull();
    // Cascaded, not orphaned — a class roll must not keep a ghost on it.
    expect(await db.enrollment.count({ where: { studentMembershipId: pupilMembershipId } })).toBe(0);
  });

  it("leaves the person's ACCOUNT alone — they may be at another school", async () => {
    await makeFreshPupil();
    await removeMembership(admin, pupilMembershipId);

    // The membership is the school's; the User is the person's. Deleting the
    // account here would be a school reaching outside itself, which is the one
    // thing this whole codebase is arranged to prevent.
    const user = await db.user.findUnique({ where: { id: pupilUserId } });
    expect(user).not.toBeNull();
    expect(user!.disabledAt).toBeNull();
  });

  it("⚠ leaves an audit line, which is the only evidence left that they were here", async () => {
    await makeFreshPupil();
    const removedId = pupilMembershipId;
    await removeMembership(admin, removedId);

    const entry = await db.auditLog.findFirst({
      where: { schoolId, action: "membership.remove", targetId: removedId },
    });
    expect(entry).not.toBeNull();
    expect(entry!.actorUserId).toBe(admin.user.id);
  });
});

describe("⚠ what it refuses, because removing would destroy a record", () => {
  it("refuses a pupil who has been marked on a register", async () => {
    await makeFreshPupil();
    const session = await db.attendanceSession.upsert({
      where: { classId_dateKey: { classId, dateKey: "2026-04-06" } },
      create: { schoolId, classId, dateKey: "2026-04-06", takenAt: new Date() },
      update: {},
    });
    await db.attendanceRecord.create({
      data: { schoolId, sessionId: session.id, studentMembershipId: pupilMembershipId, status: "PRESENT" },
    });

    const result = await removeMembership(admin, pupilMembershipId);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.blockers?.attendance).toBe(1);
    // …and points at the verb that does not destroy anything.
    expect(result.ok === false && result.error).toMatch(/left/i);

    expect(await db.membership.findUnique({ where: { id: pupilMembershipId } })).not.toBeNull();
  });

  it("refuses a pupil who has a mark", async () => {
    await makeFreshPupil();
    await db.grade.create({
      data: {
        schoolId,
        assignmentId,
        studentMembershipId: pupilMembershipId,
        scoreMilli: 8000,
      },
    });

    const result = await removeMembership(admin, pupilMembershipId);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.blockers?.marks).toBe(1);
  });

  it("refuses a pupil who has handed work in", async () => {
    await makeFreshPupil();
    await db.submission.create({
      data: { schoolId, assignmentId, studentMembershipId: pupilMembershipId, status: "SUBMITTED" },
    });

    const result = await removeMembership(admin, pupilMembershipId);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.blockers?.submissions).toBe(1);
  });

  it("refuses a pupil who has a report card, even an unpublished one", async () => {
    await makeFreshPupil();
    await db.reportCard.create({
      data: {
        schoolId,
        classId,
        studentMembershipId: pupilMembershipId,
        title: "Summer 2026",
        status: "DRAFT",
        fromDateKey: "2026-01-05",
        toDateKey: "2026-04-01",
      },
    });

    const result = await removeMembership(admin, pupilMembershipId);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.blockers?.reportCards).toBe(1);
  });

  it("⚠ reports EVERY reason at once, not the first one it met", async () => {
    await makeFreshPupil();
    const session = await db.attendanceSession.upsert({
      where: { classId_dateKey: { classId, dateKey: "2026-04-07" } },
      create: { schoolId, classId, dateKey: "2026-04-07", takenAt: new Date() },
      update: {},
    });
    await db.attendanceRecord.create({
      data: { schoolId, sessionId: session.id, studentMembershipId: pupilMembershipId, status: "PRESENT" },
    });
    await db.grade.create({
      data: { schoolId, assignmentId, studentMembershipId: pupilMembershipId, scoreMilli: 5000 },
    });

    // An admin told "they have attendance", who clears it and comes back to be
    // told about marks, has been given the answer twice and helped neither time.
    const result = await removeMembership(admin, pupilMembershipId);
    expect(result.ok === false && result.blockers).toEqual({
      attendance: 1,
      marks: 1,
      submissions: 0,
      reportCards: 0,
    });
  });

  it("refuses a pupil already recorded as having left, because that is a document", async () => {
    await makeFreshPupil();
    const departure = await recordDeparture(admin, pupilMembershipId, { reason: "TRANSFERRED" });
    expect(departure.ok).toBe(true);

    const result = await removeMembership(admin, pupilMembershipId);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/already recorded as having left/i);
    expect(await db.membership.findUnique({ where: { id: pupilMembershipId } })).not.toBeNull();
  });
});

describe("⚠ who may do it, and to whom", () => {
  it("refuses a member of staff — a teacher's classes are not this function's business", async () => {
    await makeFreshPupil();

    const result = await removeMembership(admin, staffMembershipId);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/pupil/i);
    expect(await db.membership.findUnique({ where: { id: staffMembershipId } })).not.toBeNull();
  });

  it("⚠ refuses an admin removing themselves, AND says the right thing", async () => {
    const result = await removeMembership(admin, admin.membershipId!);
    expect(result.ok).toBe(false);
    expect(await db.membership.findUnique({ where: { id: admin.membershipId! } })).not.toBeNull();

    /**
     * THE MESSAGE IS WHAT THIS TEST IS FOR, and mutation testing is why.
     *
     * Deleting the self-check changes nothing about the OUTCOME: an admin's own
     * membership is an ADMIN row, so the pupils-only guard below it refuses
     * anyway, and every assertion above still passed with the guard gone.
     *
     * It survives on the sentence alone — and the sentence it replaces is
     * actively bad, because "pause a member of staff's access instead" tells an
     * admin to lock themselves out of their own school, which
     * `suspendMembership` then refuses as the single most likely way to strand
     * one. Asserting the outcome could never have shown that. Asserting the
     * words can.
     */
    expect(result.ok === false && result.error).toMatch(/yourself/i);
    expect(result.ok === false && result.error).not.toMatch(/pause/i);
  });

  it("⚠ refuses a membership in another school, as 'not in this school'", async () => {
    await makeFreshPupil();
    const stranger = ctx({
      userId: admin.user.id,
      membershipId: admin.membershipId,
      // A real admin, acting for a school this pupil is not in.
      schoolId: "some-other-school-id",
      role: "ADMIN",
    });

    const result = await removeMembership(stranger, pupilMembershipId);
    expect(result.ok).toBe(false);
    // Never "somebody else's pupil" — assert, don't accept.
    expect(result.ok === false && result.error).toMatch(/not in this school/i);
    expect(await db.membership.findUnique({ where: { id: pupilMembershipId } })).not.toBeNull();
  });

  it("throws for a teacher, rather than returning a polite refusal", async () => {
    await makeFreshPupil();
    const teacher = ctx({
      userId: admin.user.id,
      membershipId: staffMembershipId,
      schoolId,
      role: "TEACHER",
    });

    await expect(removeMembership(teacher, pupilMembershipId)).rejects.toBeInstanceOf(AccessError);
  });
});
