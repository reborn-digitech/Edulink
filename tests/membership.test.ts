import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import {
  suspendMembership,
  reinstateMembership,
  suspendedSchoolsFor,
} from "@/lib/membership";
import type { ActiveContext } from "@/lib/session";

/**
 * Pausing somebody's access to a school.
 *
 * WHAT THESE TESTS CAN AND CANNOT SHOW. The suite connects as the database
 * OWNER, so row-level security is not in force: nothing here proves that a
 * paused person's queries come back empty. That is a fact about Postgres, it
 * lives in `npm run rls:verify` and in the route sweep, and it is the half that
 * actually does the revoking.
 *
 * What this file proves is the half a refactor breaks silently — the guards. A
 * suspension that works but lets a school pause its own last admin produces a
 * green test suite and a school nobody can get back into.
 *
 * The three that matter, and each has its own describe block below:
 *   * a school can never end up with no admin;
 *   * a suspension is school-scoped and touches nothing else;
 *   * nothing is deleted.
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

const SECOND_ADMIN_EMAIL = "second.admin.unit@riverside.test";
const TWO_SCHOOL_EMAIL = "works.at.both.unit@example.test";

let riversideId: string;
let oakfieldId: string;
let admin: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let teacher: ActiveContext;
let teacherMembershipId: string;
let studentMembershipId: string;
let studentUserId: string;
let adminMembershipId: string;
let samMembershipId: string;

/** A second admin, so the last-admin guard is not tripping on the seed's one. */
let secondAdminMembershipId: string;

/** Somebody with a membership in BOTH schools, for the blast-radius tests. */
let bothSchoolsUserId: string;
let bothAtRiverside: string;
let bothAtOakfield: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  riversideId = riverside.id;
  oakfieldId = oakfield.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });

  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riversideId, role: "TEACHER" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfieldId, role: "ADMIN" },
  });
  const someStudent = await db.membership.findFirstOrThrow({
    where: { schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
  });

  adminMembershipId = priyaAdmin.id;
  teacherMembershipId = tomTeacher.id;
  samMembershipId = samAdmin.id;
  studentMembershipId = someStudent.id;
  studentUserId = someStudent.userId;

  admin = ctx({
    userId: priya.id,
    membershipId: priyaAdmin.id,
    schoolId: riversideId,
    role: "ADMIN",
  });
  teacher = ctx({
    userId: tom.id,
    membershipId: tomTeacher.id,
    schoolId: riversideId,
    role: "TEACHER",
  });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfieldId,
    role: "ADMIN",
  });

  // A second Riverside admin. Without one, every admin-suspension test would be
  // testing the last-admin guard rather than the thing it meant to test.
  const second =
    (await db.user.findUnique({ where: { email: SECOND_ADMIN_EMAIL } })) ??
    (await db.user.create({
      data: { email: SECOND_ADMIN_EMAIL, name: "Second Admin", prefs: "{}" },
    }));
  secondAdminMembershipId = (
    await db.membership.upsert({
      where: {
        userId_schoolId_role: { userId: second.id, schoolId: riversideId, role: "ADMIN" },
      },
      create: { userId: second.id, schoolId: riversideId, role: "ADMIN", status: "ACTIVE" },
      update: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
    })
  ).id;

  // One person, two schools. This is the case the whole design turns on.
  const both =
    (await db.user.findUnique({ where: { email: TWO_SCHOOL_EMAIL } })) ??
    (await db.user.create({
      data: { email: TWO_SCHOOL_EMAIL, name: "Works At Both", prefs: "{}" },
    }));
  bothSchoolsUserId = both.id;
  bothAtRiverside = (
    await db.membership.upsert({
      where: { userId_schoolId_role: { userId: both.id, schoolId: riversideId, role: "TEACHER" } },
      create: { userId: both.id, schoolId: riversideId, role: "TEACHER", status: "ACTIVE" },
      update: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
    })
  ).id;
  bothAtOakfield = (
    await db.membership.upsert({
      where: { userId_schoolId_role: { userId: both.id, schoolId: oakfieldId, role: "TEACHER" } },
      create: { userId: both.id, schoolId: oakfieldId, role: "TEACHER", status: "ACTIVE" },
      update: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
    })
  ).id;
});

/** Everything back to ACTIVE, so no test can depend on another's leftovers. */
afterEach(async () => {
  await db.membership.updateMany({
    where: {
      id: {
        in: [
          teacherMembershipId,
          studentMembershipId,
          adminMembershipId,
          secondAdminMembershipId,
          samMembershipId,
          bothAtRiverside,
          bothAtOakfield,
        ],
      },
    },
    data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
  });
});

afterAll(async () => {
  await db.membership.deleteMany({
    where: { user: { email: { in: [SECOND_ADMIN_EMAIL, TWO_SCHOOL_EMAIL] } } },
  });
  await db.user.deleteMany({ where: { email: { in: [SECOND_ADMIN_EMAIL, TWO_SCHOOL_EMAIL] } } });
  await db.$disconnect();
});

const REASON = "Repeated abusive messages to another pupil";

describe("pausing somebody", () => {
  it("flips them to SUSPENDED and records when and why", async () => {
    const result = await suspendMembership(admin, teacherMembershipId, REASON);
    expect(result.ok).toBe(true);

    const row = await db.membership.findUniqueOrThrow({ where: { id: teacherMembershipId } });
    expect(row.status).toBe("SUSPENDED");
    expect(row.suspendedAt).not.toBeNull();
    expect(row.suspendedReason).toBe(REASON);
  });

  it("writes an audit entry naming who did it", async () => {
    await suspendMembership(admin, teacherMembershipId, REASON);
    const entry = await db.auditLog.findFirst({
      where: { action: "membership.suspend", targetId: teacherMembershipId },
      orderBy: { createdAt: "desc" },
    });
    expect(entry).not.toBeNull();
    expect(entry!.actorUserId).toBe(admin.user.id);
  });

  it("⚠ will not proceed without a stated reason", async () => {
    // A suspension nobody wrote a reason for is one nobody can review or appeal.
    for (const reason of ["", "   ", "x"]) {
      const result = await suspendMembership(admin, teacherMembershipId, reason);
      expect(result.ok).toBe(false);
    }
    const row = await db.membership.findUniqueOrThrow({ where: { id: teacherMembershipId } });
    expect(row.status).toBe("ACTIVE");
  });

  it("refuses to pause somebody already paused", async () => {
    await suspendMembership(admin, teacherMembershipId, REASON);
    const again = await suspendMembership(admin, teacherMembershipId, "Second thoughts");
    expect(again.ok).toBe(false);

    // The original reason must survive — the second call must not overwrite it.
    const row = await db.membership.findUniqueOrThrow({ where: { id: teacherMembershipId } });
    expect(row.suspendedReason).toBe(REASON);
  });

  it("truncates a very long reason rather than rejecting it", async () => {
    await suspendMembership(admin, teacherMembershipId, "n".repeat(900));
    const row = await db.membership.findUniqueOrThrow({ where: { id: teacherMembershipId } });
    expect(row.suspendedReason!.length).toBe(500);
  });
});

describe("⚠ a school can never end up with no admin", () => {
  it("refuses to let an admin pause themselves", async () => {
    // The single most likely way to lock a school out, and always a mistake
    // rather than a decision.
    const result = await suspendMembership(admin, adminMembershipId, REASON);
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ errorKey: "refusal.pauseSelf" });

    const row = await db.membership.findUniqueOrThrow({ where: { id: adminMembershipId } });
    expect(row.status).toBe("ACTIVE");
  });

  it("⚠ refuses to pause the last remaining admin", async () => {
    // Take the second admin out first, so the seed's admin is genuinely alone.
    await db.membership.update({
      where: { id: secondAdminMembershipId },
      data: { status: "SUSPENDED", suspendedAt: new Date() },
    });

    const secondAdminCtx = ctx({
      userId: (await db.membership.findUniqueOrThrow({ where: { id: secondAdminMembershipId } }))
        .userId,
      membershipId: secondAdminMembershipId,
      schoolId: riversideId,
      role: "ADMIN",
    });

    const result = await suspendMembership(secondAdminCtx, adminMembershipId, REASON);
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ errorKey: "refusal.onlyAdminLeft" });

    const row = await db.membership.findUniqueOrThrow({ where: { id: adminMembershipId } });
    expect(row.status).toBe("ACTIVE");
  });

  it("allows pausing an admin while another active one remains", async () => {
    const result = await suspendMembership(admin, secondAdminMembershipId, REASON);
    expect(result.ok).toBe(true);
  });

  it("⚠ serialises behind a lock on the school, so two at once cannot race", async () => {
    // THE OBVIOUS VERSION OF THIS TEST DOES NOT WORK. Firing two suspensions
    // through Promise.all and asserting that only one succeeds passes whether
    // or not the lock is there, because nothing forces the two transactions to
    // actually overlap — they usually serialise on their own and the second one
    // reads the first one's committed result. Removing the lock left it green.
    //
    // So this asserts the lock's observable behaviour instead: while another
    // transaction holds the school row, a suspension WAITS. That is the
    // property the race depends on, and it fails the moment the lock goes.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    // FOR NO KEY UPDATE, not FOR UPDATE, and the difference is the whole test.
    // Writing rows that reference School — an AuditLog entry, for instance —
    // makes Postgres take a FOR KEY SHARE lock on the parent to check the
    // foreign key. FOR KEY SHARE conflicts with FOR UPDATE, so a holder using
    // FOR UPDATE blocks the suspension whether or not this file locks anything,
    // and the first version of this test passed with the lock deleted.
    //
    // FOR NO KEY UPDATE conflicts with FOR UPDATE but NOT with FOR KEY SHARE.
    // So it blocks exactly one thing: the explicit lock in `suspendMembership`.
    const holder = db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "School" WHERE id = ${riversideId} FOR NO KEY UPDATE`;
        await gate;
      },
      { timeout: 10_000 },
    );

    // Let the holder actually take the lock before racing anything against it.
    await new Promise((resolve) => setTimeout(resolve, 150));

    let settled = false;
    const attempt = suspendMembership(admin, secondAdminMembershipId, REASON).then((result) => {
      settled = true;
      return result;
    });

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(settled, "the suspension ran straight through a held lock").toBe(false);

    release();
    await holder;

    // ...and once the lock is free it completes normally rather than erroring.
    expect((await attempt).ok).toBe(true);
  });

  it("⚠ leaves at least one admin standing when two are attempted together", async () => {
    // Weaker than the lock test above and kept for the outcome it names: however
    // the interleaving falls out, the school still has a way back in.
    const secondUserId = (
      await db.membership.findUniqueOrThrow({ where: { id: secondAdminMembershipId } })
    ).userId;
    const secondAdminCtx = ctx({
      userId: secondUserId,
      membershipId: secondAdminMembershipId,
      schoolId: riversideId,
      role: "ADMIN",
    });

    const [a, b] = await Promise.all([
      suspendMembership(admin, secondAdminMembershipId, REASON),
      suspendMembership(secondAdminCtx, adminMembershipId, REASON),
    ]);

    expect([a.ok, b.ok].filter(Boolean)).toHaveLength(1);

    const remaining = await db.membership.count({
      where: { schoolId: riversideId, role: "ADMIN", status: "ACTIVE", leftAt: null },
    });
    expect(remaining).toBeGreaterThanOrEqual(1);
  });
});

describe("⚠ it is school-scoped, and nothing wider", () => {
  it("refuses a membership belonging to another school", async () => {
    // The id is real; it is simply not this admin's to touch. It must read as
    // "not in this school", never as somebody else's teacher.
    const result = await suspendMembership(admin, samMembershipId, REASON);
    expect(result.ok).toBe(false);

    const row = await db.membership.findUniqueOrThrow({ where: { id: samMembershipId } });
    expect(row.status).toBe("ACTIVE");
  });

  it("⚠ pausing at one school leaves the same person's other school untouched", async () => {
    // The reason `User.disabledAt` is not reachable from here. Riverside must
    // not be able to lock somebody out of Oakfield.
    await suspendMembership(admin, bothAtRiverside, REASON);

    const atRiverside = await db.membership.findUniqueOrThrow({ where: { id: bothAtRiverside } });
    const atOakfield = await db.membership.findUniqueOrThrow({ where: { id: bothAtOakfield } });
    expect(atRiverside.status).toBe("SUSPENDED");
    expect(atOakfield.status).toBe("ACTIVE");
  });

  it("⚠ never touches the user account itself", async () => {
    await suspendMembership(admin, bothAtRiverside, REASON);
    const user = await db.user.findUniqueOrThrow({ where: { id: bothSchoolsUserId } });
    // disabledAt is the global kill switch and belongs to whoever runs the
    // server. A school admin reaching it would be a privilege escalation.
    expect(user.disabledAt).toBeNull();
  });

  it("refuses a teacher, however senior", async () => {
    await expect(suspendMembership(teacher, studentMembershipId, REASON)).rejects.toBeInstanceOf(
      AccessError,
    );
  });

  it("refuses an admin with no active school on the session", async () => {
    const roleless = ctx({ userId: admin.user.id, role: "ADMIN", schoolId: null });
    await expect(
      suspendMembership(roleless, teacherMembershipId, REASON),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses an admin of the OTHER school reaching in", async () => {
    const result = await suspendMembership(otherSchoolAdmin, teacherMembershipId, REASON);
    expect(result.ok).toBe(false);
    const row = await db.membership.findUniqueOrThrow({ where: { id: teacherMembershipId } });
    expect(row.status).toBe("ACTIVE");
  });
});

describe("⚠ nothing is deleted", () => {
  it("leaves marks, attendance and enrolments exactly where they were", async () => {
    const before = await Promise.all([
      db.grade.count({ where: { studentMembershipId } }),
      db.attendanceRecord.count({ where: { studentMembershipId } }),
      db.enrollment.count({ where: { studentMembershipId } }),
    ]);

    await suspendMembership(admin, studentMembershipId, "Under investigation");

    const after = await Promise.all([
      db.grade.count({ where: { studentMembershipId } }),
      db.attendanceRecord.count({ where: { studentMembershipId } }),
      db.enrollment.count({ where: { studentMembershipId } }),
    ]);
    expect(after).toEqual(before);
  });

  it("leaves the membership row itself, so restoring is one write", async () => {
    await suspendMembership(admin, studentMembershipId, "Under investigation");
    const row = await db.membership.findUnique({ where: { id: studentMembershipId } });
    expect(row).not.toBeNull();
    expect(row!.leftAt).toBeNull();
  });
});

describe("restoring", () => {
  it("puts them back and clears the reason with it", async () => {
    await suspendMembership(admin, teacherMembershipId, REASON);
    const result = await reinstateMembership(admin, teacherMembershipId);
    expect(result.ok).toBe(true);

    const row = await db.membership.findUniqueOrThrow({ where: { id: teacherMembershipId } });
    expect(row.status).toBe("ACTIVE");
    // A lifted suspension is not a note left on the file.
    expect(row.suspendedAt).toBeNull();
    expect(row.suspendedReason).toBeNull();
  });

  it("is audited too", async () => {
    await suspendMembership(admin, teacherMembershipId, REASON);
    await reinstateMembership(admin, teacherMembershipId);
    const entry = await db.auditLog.findFirst({
      where: { action: "membership.reinstate", targetId: teacherMembershipId },
      orderBy: { createdAt: "desc" },
    });
    expect(entry).not.toBeNull();
  });

  it("refuses somebody who is not paused", async () => {
    const result = await reinstateMembership(admin, teacherMembershipId);
    expect(result.ok).toBe(false);
  });

  it("⚠ refuses across a school boundary, same as pausing", async () => {
    await db.membership.update({
      where: { id: samMembershipId },
      data: { status: "SUSPENDED", suspendedAt: new Date() },
    });
    const result = await reinstateMembership(admin, samMembershipId);
    expect(result.ok).toBe(false);

    const row = await db.membership.findUniqueOrThrow({ where: { id: samMembershipId } });
    expect(row.status).toBe("SUSPENDED");
  });

  it("refuses a teacher", async () => {
    await suspendMembership(admin, studentMembershipId, REASON);
    await expect(reinstateMembership(teacher, studentMembershipId)).rejects.toBeInstanceOf(
      AccessError,
    );
  });
});

describe("what the paused person is told", () => {
  it("names the school that paused them", async () => {
    await suspendMembership(admin, bothAtRiverside, REASON);
    const schools = await suspendedSchoolsFor(bothSchoolsUserId);

    expect(schools).toHaveLength(1);
    expect(schools[0]!.schoolName).toBe("Riverside Primary School");
    expect(schools[0]!.at).not.toBeNull();
  });

  it("⚠ lists only the schools that paused them, not the ones that did not", async () => {
    await suspendMembership(admin, bothAtRiverside, REASON);
    const schools = await suspendedSchoolsFor(bothSchoolsUserId);
    expect(schools.map((s) => s.schoolId)).not.toContain(oakfieldId);
  });

  it("says nothing at all for somebody who was never paused", async () => {
    expect(await suspendedSchoolsFor(studentUserId)).toEqual([]);
  });

  it("goes quiet again once access is restored", async () => {
    await suspendMembership(admin, bothAtRiverside, REASON);
    await reinstateMembership(admin, bothAtRiverside);
    expect(await suspendedSchoolsFor(bothSchoolsUserId)).toEqual([]);
  });
});
