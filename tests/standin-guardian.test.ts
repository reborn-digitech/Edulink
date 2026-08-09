import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { syncStandinGuardian } from "@/lib/standin-guardian";
import type { ActiveContext } from "@/lib/session";

/**
 * The school as stand-in guardian, until a real one arrives.
 *
 * The claim under test is a lifecycle: a pupil with no parent on the app gets
 * their class teacher (or an admin) as guardian; the moment a parent claims
 * them the stand-in is revoked; and the reconciler is idempotent, so calling
 * it at every hook can never double-grant or reshuffle.
 *
 * ZZ fixtures throughout — a school, an admin, a LEAD teacher, a class and
 * three pupils — torn down at the end. Runs as the database owner like every
 * suite here; the tenant binding inside the reconciler is inert under owner,
 * and what is being tested is the DECISION, not the policies.
 */

const db = new PrismaClient();
const STAMP = Date.now();

let schoolId = "";
let classId = "";
let teacherUserId = "";
let adminUserId = "";
let parentUserId = "";
/** In the class, no parent. */
let pupilInClass = "";
/** In no class at all, no parent. */
let pupilNoClass = "";
/** Already claimed by a real parent. */
let pupilClaimed = "";

beforeAll(async () => {
  const school = await db.school.create({
    data: {
      name: `ZZ Standin High ${STAMP}`,
      slug: `zz-standin-${STAMP}`,
      code: `ZS${String(STAMP).slice(-6)}`,
      contactEmail: `zz-standin-school-${STAMP}@test.invalid`,
      timezone: "Asia/Kolkata",
    },
    select: { id: true },
  });
  schoolId = school.id;

  const mkUser = (name: string) =>
    db.user.create({
      data: { name, email: `zz-standin-${name.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` },
      select: { id: true },
    });

  const [admin, teacher, parent, childA, childB, childC] = await Promise.all([
    mkUser("Admin"), mkUser("Teacher"), mkUser("Parent"), mkUser("Child A"), mkUser("Child B"), mkUser("Child C"),
  ]);
  adminUserId = admin.id;
  teacherUserId = teacher.id;
  parentUserId = parent.id;

  const mkMembership = (userId: string, role: string, code?: string) =>
    db.membership.create({
      data: { userId, schoolId, role, status: "ACTIVE", studentCode: code ?? null },
      select: { id: true },
    });

  const adminM = await mkMembership(admin.id, "ADMIN");
  const teacherM = await mkMembership(teacher.id, "TEACHER");
  const a = await mkMembership(childA.id, "STUDENT", `ZZA${STAMP}`);
  const b = await mkMembership(childB.id, "STUDENT", `ZZB${STAMP}`);
  const c = await mkMembership(childC.id, "STUDENT", `ZZC${STAMP}`);
  pupilInClass = a.id;
  pupilNoClass = b.id;
  pupilClaimed = c.id;
  void adminM;

  const klass = await db.class.create({
    data: { schoolId, name: "ZZ Class 5", joinCode: `ZC${String(STAMP).slice(-6)}` },
    select: { id: true },
  });
  classId = klass.id;

  await db.classTeacher.create({
    data: { classId, schoolId, teacherMembershipId: teacherM.id, role: "LEAD" },
  });
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilInClass, status: "ACTIVE" },
  });
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilClaimed, status: "ACTIVE" },
  });

  // Child C's parent is already on the app.
  await db.guardianship.create({
    data: {
      parentUserId: parent.id,
      studentMembershipId: pupilClaimed,
      studentSchoolId: schoolId,
      relation: "PARENT",
      status: "ACTIVE",
    },
  });
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { action: { startsWith: "guardian.standin." }, schoolId } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } }); // cascades the rest
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const sync = (studentMembershipId: string) =>
  syncStandinGuardian({ schoolId, studentMembershipId, actorUserId: adminUserId });

/** An admin session for the cohort/membership functions the later tests call. */
function adminCtx(): ActiveContext {
  return {
    sessionId: "test",
    membershipId: null,
    schoolId,
    role: "ADMIN",
    user: {
      id: adminUserId,
      name: "Admin",
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

describe("granting", () => {
  it("⚠ gives an unclaimed pupil's class teacher the guardianship", async () => {
    const result = await sync(pupilInClass);
    expect(result).toEqual({ outcome: "granted", toUserId: teacherUserId });

    const row = await db.guardianship.findFirstOrThrow({
      where: { studentMembershipId: pupilInClass, status: "ACTIVE" },
    });
    expect(row.parentUserId).toBe(teacherUserId);
    expect(row.relation).toBe("SCHOOL");
  });

  it("is idempotent — a second sync changes nothing", async () => {
    const result = await sync(pupilInClass);
    expect(result).toEqual({ outcome: "kept-standin", userId: teacherUserId });
    const count = await db.guardianship.count({
      where: { studentMembershipId: pupilInClass, status: "ACTIVE" },
    });
    expect(count).toBe(1);
  });

  it("falls back to a school admin when the pupil has no class", async () => {
    const result = await sync(pupilNoClass);
    expect(result).toEqual({ outcome: "granted", toUserId: adminUserId });
  });

  it("⚠ never touches a pupil whose parent is already on the app", async () => {
    const result = await sync(pupilClaimed);
    expect(result).toEqual({ outcome: "kept-family" });

    const rows = await db.guardianship.findMany({
      where: { studentMembershipId: pupilClaimed, status: "ACTIVE" },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.parentUserId).toBe(parentUserId);
  });

  it("audits the grant against the school", async () => {
    const entry = await db.auditLog.findFirst({
      where: { action: "guardian.standin.grant", targetId: pupilInClass },
      select: { schoolId: true },
    });
    expect(entry?.schoolId).toBe(schoolId);
  });
});

describe("the parent arrives", () => {
  it("⚠ revokes the stand-in the moment a real guardianship is ACTIVE", async () => {
    // The parent claims child A — what claimChild's upsert does.
    await db.guardianship.create({
      data: {
        parentUserId,
        studentMembershipId: pupilInClass,
        studentSchoolId: schoolId,
        relation: "PARENT",
        status: "ACTIVE",
      },
    });

    const result = await sync(pupilInClass);
    expect(result).toEqual({ outcome: "released", fromUserId: teacherUserId });

    const active = await db.guardianship.findMany({
      where: { studentMembershipId: pupilInClass, status: "ACTIVE" },
    });
    expect(active).toHaveLength(1);
    expect(active[0]!.parentUserId).toBe(parentUserId);

    // Revoked, not deleted — the school's period as guardian stays on record.
    const revoked = await db.guardianship.findFirst({
      where: { studentMembershipId: pupilInClass, parentUserId: teacherUserId },
    });
    expect(revoked?.status).toBe("REVOKED");
  });

  it("…and the release is in the server's audit trail", async () => {
    const entry = await db.auditLog.findFirst({
      where: { action: "guardian.standin.release", targetId: pupilInClass },
      select: { schoolId: true },
    });
    expect(entry?.schoolId).toBe(schoolId);
  });

  it("⚠ the parent leaving again brings the stand-in back", async () => {
    await db.guardianship.updateMany({
      where: { studentMembershipId: pupilInClass, parentUserId },
      data: { status: "REVOKED" },
    });

    const result = await sync(pupilInClass);
    expect(result).toEqual({ outcome: "granted", toUserId: teacherUserId });

    const active = await db.guardianship.findFirstOrThrow({
      where: { studentMembershipId: pupilInClass, status: "ACTIVE" },
    });
    expect(active.parentUserId).toBe(teacherUserId);
    expect(active.relation).toBe("SCHOOL");
  });
});

describe("the holder changes", () => {
  it("moves the guardianship when the pupil gains a class teacher", async () => {
    // Child B's stand-in is the admin. Enrol them in the class: the LEAD
    // teacher should take over on the next sync.
    await db.enrollment.create({
      data: { classId, schoolId, studentMembershipId: pupilNoClass, status: "ACTIVE" },
    });

    const result = await sync(pupilNoClass);
    expect(result).toEqual({ outcome: "moved", fromUserId: adminUserId, toUserId: teacherUserId });

    const active = await db.guardianship.findMany({
      where: { studentMembershipId: pupilNoClass, status: "ACTIVE" },
    });
    expect(active).toHaveLength(1);
    expect(active[0]!.parentUserId).toBe(teacherUserId);
  });
});

describe("the class teacher changes", () => {
  /**
   * Through the REAL cohort functions, not by editing rows — what is being
   * pinned is that assignTeacher/unassignTeacher carry the guardianship with
   * them, which is the difference between "the reconciler is right" and "the
   * reconciler runs".
   */
  it("⚠ a newly assigned teacher takes the stand-ins over automatically", async () => {
    const { assignTeacher } = await import("@/lib/cohort");

    // A second teacher joins the school and takes the class.
    const newTeacher = await db.user.create({
      data: { name: "ZZ Teacher Two", email: `zz-standin-teacher-two-${STAMP}@test.invalid` },
      select: { id: true },
    });
    const newTeacherM = await db.membership.create({
      data: { userId: newTeacher.id, schoolId, role: "TEACHER", status: "ACTIVE" },
      select: { id: true },
    });
    // The old LEAD steps down to CO; the new teacher becomes LEAD.
    await db.classTeacher.updateMany({
      where: { classId, role: "LEAD" },
      data: { role: "CO" },
    });

    const result = await assignTeacher(adminCtx(), classId, newTeacherM.id, { role: "LEAD" });
    expect(result.ok).toBe(true);

    // Both unclaimed pupils of the class now have the NEW teacher standing in,
    // and the old teacher's rows are revoked, not deleted.
    for (const pupil of [pupilInClass, pupilNoClass]) {
      const active = await db.guardianship.findMany({
        where: { studentMembershipId: pupil, status: "ACTIVE" },
      });
      expect(active).toHaveLength(1);
      expect(active[0]!.parentUserId).toBe(newTeacher.id);
      expect(active[0]!.relation).toBe("SCHOOL");
    }
    const old = await db.guardianship.findFirst({
      where: { studentMembershipId: pupilInClass, parentUserId: teacherUserId },
    });
    expect(old?.status).toBe("REVOKED");

    // The claimed pupil's family guardianship never moved.
    const family = await db.guardianship.findMany({
      where: { studentMembershipId: pupilClaimed, status: "ACTIVE" },
    });
    expect(family).toHaveLength(1);
    expect(family[0]!.parentUserId).toBe(parentUserId);
  });

  it("⚠ unassigning the last teacher passes the stand-ins to the admin fallback", async () => {
    const { unassignTeacher } = await import("@/lib/cohort");


    // Remove every teacher from the class, new LEAD and demoted CO alike.
    const staff = await db.classTeacher.findMany({
      where: { classId },
      select: { teacherMembershipId: true },
    });
    for (const s of staff) {
      const result = await unassignTeacher(adminCtx(), classId, s.teacherMembershipId);
      expect(result.ok).toBe(true);
    }

    const active = await db.guardianship.findFirstOrThrow({
      where: { studentMembershipId: pupilInClass, status: "ACTIVE" },
    });
    expect(active.parentUserId).toBe(adminUserId);
    expect(active.relation).toBe("SCHOOL");
  });
});

describe("the teacher leaves the school", () => {
  /**
   * Through suspendMembership/reinstateMembership — the real "teacher leaves"
   * machinery, since staff never get `leftAt` (removeMembership is pupils
   * only). What is pinned: a suspended teacher's stand-ins pass to the admin
   * fallback in the same action, and reinstating them brings the class's
   * unclaimed pupils back.
   */
  it("⚠ suspending the holding teacher passes their stand-ins on", async () => {
    const { assignTeacher } = await import("@/lib/cohort");
    const { suspendMembership } = await import("@/lib/membership");

    // Put a dedicated teacher on the class and let them take the stand-ins.
    const t3 = await db.user.create({
      data: { name: "ZZ Teacher Three", email: `zz-standin-teacher-three-${STAMP}@test.invalid` },
      select: { id: true },
    });
    const t3M = await db.membership.create({
      data: { userId: t3.id, schoolId, role: "TEACHER", status: "ACTIVE" },
      select: { id: true },
    });
    expect((await assignTeacher(adminCtx(), classId, t3M.id, { role: "LEAD" })).ok).toBe(true);

    let active = await db.guardianship.findFirstOrThrow({
      where: { studentMembershipId: pupilInClass, status: "ACTIVE" },
    });
    expect(active.parentUserId).toBe(t3.id);

    // The admin pauses them. Their stand-ins must not wait for a backfill.
    const result = await suspendMembership(adminCtx(), t3M.id, "ZZ long leave");
    expect(result.ok).toBe(true);

    active = await db.guardianship.findFirstOrThrow({
      where: { studentMembershipId: pupilInClass, status: "ACTIVE" },
    });
    expect(active.parentUserId).toBe(adminUserId);
    expect(active.relation).toBe("SCHOOL");

    const theirs = await db.guardianship.findFirst({
      where: { studentMembershipId: pupilInClass, parentUserId: t3.id },
    });
    expect(theirs?.status).toBe("REVOKED");
  });

  it("⚠ reinstating them brings the class's unclaimed pupils back", async () => {
    const { reinstateMembership } = await import("@/lib/membership");

    const t3M = await db.membership.findFirstOrThrow({
      where: { schoolId, role: "TEACHER", status: "SUSPENDED" },
      select: { id: true, userId: true },
    });

    const result = await reinstateMembership(adminCtx(), t3M.id);
    expect(result.ok).toBe(true);

    const active = await db.guardianship.findFirstOrThrow({
      where: { studentMembershipId: pupilInClass, status: "ACTIVE" },
    });
    expect(active.parentUserId).toBe(t3M.userId);
    expect(active.relation).toBe("SCHOOL");
  });
});
