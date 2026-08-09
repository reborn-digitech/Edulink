import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createPost, listFeed, acknowledgePost, ackReport } from "@/lib/bulletin";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * Circulars: audience targeting and "seen and understood", end to end on real
 * rows. A disposable ZZ class in the seeded school, a disposable pupil, their
 * guardian, and a teacher. Everything created here is deleted in afterAll and
 * the deletion is asserted, not assumed.
 *
 * The claims under test are the design claims: targeting is a courtesy filter
 * by role and grade; an ack is idempotent; and the delivery report counts the
 * FAMILY as the unit for a parents' circular — a child is "reached" when any
 * guardian acknowledged.
 */

const db = new PrismaClient();
const PUPIL_EMAIL = "zz.pupil.circulars@riverside.test";
const TEACHER_EMAIL = "zz.teacher.circulars@riverside.test";
const PARENT_EMAIL = "zz.parent.circulars@riverside.test";

let schoolId: string;
let classId: string;
let pupil: ActiveContext;
let teacher: ActiveContext;
let parent: ActiveContext;
let parentUserId: string;
let pupilMembershipId: string;

function ctxFor(
  userId: string,
  name: string,
  membershipId: string | null,
  role: "STUDENT" | "TEACHER" | "PARENT",
): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    // ⚠ THE REAL SHAPE. A guardian's session carries NO school —
    // setActiveContext stores null for PARENT on purpose — and building test
    // parents WITH a school was exactly the fixture blind spot that let
    // "parents cannot read circulars" ship. The library must resolve the
    // school from guardianship itself.
    schoolId: role === "PARENT" ? null : schoolId,
    role,
    user: {
      id: userId,
      name,
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

  const pupilUser = await db.user.create({
    data: { email: PUPIL_EMAIL, name: "ZZ Circulars Pupil", prefs: "{}" },
  });
  const teacherUser = await db.user.create({
    data: { email: TEACHER_EMAIL, name: "ZZ Circulars Teacher", prefs: "{}" },
  });
  const parentUser = await db.user.create({
    data: { email: PARENT_EMAIL, name: "ZZ Circulars Parent", prefs: "{}" },
  });
  parentUserId = parentUser.id;

  const pupilMembership = await db.membership.create({
    data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  pupilMembershipId = pupilMembership.id;
  const teacherMembership = await db.membership.create({
    data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" },
  });

  const klass = await db.class.create({
    data: { schoolId, name: "ZZ Circulars Class", gradeLevel: "3", joinCode: "ZZCIRC0001" },
  });
  classId = klass.id;
  await db.classTeacher.create({
    data: { classId, schoolId, teacherMembershipId: teacherMembership.id },
  });
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilMembership.id },
  });
  await db.guardianship.create({
    data: {
      parentUserId: parentUser.id,
      studentMembershipId: pupilMembership.id,
      studentSchoolId: schoolId,
    },
  });

  pupil = ctxFor(pupilUser.id, "ZZ Circulars Pupil", pupilMembership.id, "STUDENT");
  teacher = ctxFor(teacherUser.id, "ZZ Circulars Teacher", teacherMembership.id, "TEACHER");
  parent = ctxFor(parentUser.id, "ZZ Circulars Parent", null, "PARENT");
});

afterAll(async () => {
  // Posts cascade their acks; delete by author so nothing of ours survives.
  for (const email of [PUPIL_EMAIL, TEACHER_EMAIL, PARENT_EMAIL]) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) continue;
    await db.postAck.deleteMany({ where: { userId: user.id } });
    await db.post.deleteMany({ where: { authorUserId: user.id } });
  }
  await db.guardianship.deleteMany({ where: { parentUserId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  for (const email of [PUPIL_EMAIL, TEACHER_EMAIL, PARENT_EMAIL]) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  expect(await db.class.count({ where: { id: classId } })).toBe(0);
  expect(
    await db.user.count({ where: { email: { in: [PUPIL_EMAIL, TEACHER_EMAIL, PARENT_EMAIL] } } }),
  ).toBe(0);
  await db.$disconnect();
});

describe("targeted circulars", () => {
  let circularId: string;

  it("a parents' circular reaches the guardian and not the pupil", async () => {
    const { postId, status } = await createPost(teacher, {
      scope: "SCHOOL",
      title: "ZZ PTM on Friday",
      body: "Meetings run 3–5pm.",
      tags: [],
      media: [],
      audience: "PARENTS",
      audienceGrade: "3",
      requiresAck: true,
    });
    circularId = postId;
    expect(status).toBe("APPROVED"); // staff publish immediately

    const parentFeed = await listFeed(parent);
    const seen = parentFeed.find((p) => p.id === postId);
    expect(seen).toBeDefined();
    expect(seen!.requiresAck).toBe(true);
    expect(seen!.acked).toBe(false);

    const pupilFeed = await listFeed(pupil);
    expect(pupilFeed.find((p) => p.id === postId)).toBeUndefined();
  });

  it("a circular for another grade stays out of this family's feed", async () => {
    const { postId } = await createPost(teacher, {
      scope: "SCHOOL",
      title: "ZZ Grade 9 trip forms",
      body: "",
      tags: [],
      media: [],
      audience: "PARENTS",
      audienceGrade: "9",
    });
    const parentFeed = await listFeed(parent);
    expect(parentFeed.find((p) => p.id === postId)).toBeUndefined();
  });

  it("a student cannot narrow an audience or demand an ack", async () => {
    const { postId } = await createPost(pupil, {
      scope: "SCHOOL",
      title: "ZZ my poster",
      body: "",
      tags: [],
      media: [],
      audience: "TEACHERS",
      requiresAck: true,
    });
    const row = await db.post.findUniqueOrThrow({
      where: { id: postId },
      select: { audience: true, requiresAck: true },
    });
    expect(row.audience).toBe("ALL");
    expect(row.requiresAck).toBe(false);
  });

  it("acknowledging is idempotent, and invisible posts cannot be acked", async () => {
    await acknowledgePost(parent, circularId);
    await acknowledgePost(parent, circularId); // the uncertain second tap
    expect(await db.postAck.count({ where: { postId: circularId } })).toBe(1);

    await expect(acknowledgePost(pupil, circularId)).rejects.toThrow(AccessError);
  });

  it("the delivery report counts the family, class by class", async () => {
    const groups = await ackReport(teacher, circularId);
    const mine = groups.find((g) => g.classId === classId);
    expect(mine).toBeDefined();
    expect(mine!.total).toBe(1);
    // The pupil never tapped anything; their guardian did, so the family is
    // reached — the unit a parents' circular actually cares about.
    expect(mine!.reached).toBe(1);
    expect(mine!.outstanding).toEqual([]);
  });
});
