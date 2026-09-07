import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { sendWeeklyDigests } from "@/lib/digest";

/**
 * The weekly digest job: a family with a week of rows gets ONE message that
 * names the child and the numbers; running the job again inside the window
 * sends nothing twice. The job walks every guardianship, so the assertions
 * here are pinned to OUR fixture family only — the seeded families may or may
 * not receive digests of their own, and that is their business.
 */

const db = new PrismaClient();
const PUPIL_EMAIL = "zz.pupil.digest@riverside.test";
const PARENT_EMAIL = "zz.parent.digest@riverside.test";
const TEACHER_EMAIL = "zz.teacher.digest@riverside.test";
/** A second family whose week holds nothing — the quiet side of coverage. */
const QUIET_PUPIL_EMAIL = "zz.pupil.digest.quiet@riverside.test";
const QUIET_PARENT_EMAIL = "zz.parent.digest.quiet@riverside.test";

let schoolId: string;
let classId: string;
let parentUserId: string;
let quietParentUserId: string;

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;

  const [pupilUser, parentUser, teacherUser] = await Promise.all([
    db.user.create({ data: { email: PUPIL_EMAIL, name: "ZZ Digest Pupil", prefs: "{}" } }),
    db.user.create({ data: { email: PARENT_EMAIL, name: "ZZ Digest Parent", prefs: "{}" } }),
    db.user.create({ data: { email: TEACHER_EMAIL, name: "ZZ Digest Teacher", prefs: "{}" } }),
  ]);
  parentUserId = parentUser.id;

  const pupilMembership = await db.membership.create({
    data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  const teacherMembership = await db.membership.create({
    data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" },
  });

  const klass = await db.class.create({
    data: { schoolId, name: "ZZ Digest Class", gradeLevel: "7", joinCode: "ZZDIGEST01" },
  });
  classId = klass.id;
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilMembership.id },
  });
  await db.guardianship.create({
    data: { parentUserId: parentUser.id, studentMembershipId: pupilMembership.id, studentSchoolId: schoolId },
  });

  // The quiet family: a pupil with a membership but NO enrolment, so their
  // week computes to nothing — attributed to the school through the
  // membership, which is exactly the path the coverage counting must take.
  const [quietPupil, quietParent] = await Promise.all([
    db.user.create({ data: { email: QUIET_PUPIL_EMAIL, name: "ZZ Digest Quiet Pupil", prefs: "{}" } }),
    db.user.create({ data: { email: QUIET_PARENT_EMAIL, name: "ZZ Digest Quiet Parent", prefs: "{}" } }),
  ]);
  quietParentUserId = quietParent.id;
  const quietMembership = await db.membership.create({
    data: { userId: quietPupil.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  await db.guardianship.create({
    data: { parentUserId: quietParent.id, studentMembershipId: quietMembership.id, studentSchoolId: schoolId },
  });

  // A week with something in it: one register mark and one homework due soon.
  const session = await db.attendanceSession.create({
    data: { schoolId, classId, dateKey: new Date().toISOString().slice(0, 10) },
  });
  await db.attendanceRecord.create({
    data: { sessionId: session.id, schoolId, studentMembershipId: pupilMembership.id, status: "PRESENT" },
  });
  await db.assignment.create({
    data: {
      schoolId,
      classId,
      authorMembershipId: teacherMembership.id,
      title: "ZZ Digest homework",
      dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(),
    },
  });
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId: parentUserId } });
  await db.assignment.deleteMany({ where: { classId } });
  await db.attendanceRecord.deleteMany({ where: { session: { classId } } });
  await db.attendanceSession.deleteMany({ where: { classId } });
  await db.guardianship.deleteMany({ where: { parentUserId: { in: [parentUserId, quietParentUserId] } } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  for (const email of [PUPIL_EMAIL, PARENT_EMAIL, TEACHER_EMAIL, QUIET_PUPIL_EMAIL, QUIET_PARENT_EMAIL]) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  expect(await db.class.count({ where: { id: classId } })).toBe(0);
  expect(
    await db.user.count({ where: { email: { in: [PUPIL_EMAIL, PARENT_EMAIL, TEACHER_EMAIL, QUIET_PUPIL_EMAIL, QUIET_PARENT_EMAIL] } } }),
  ).toBe(0);
  await db.$disconnect();
});

describe("the weekly digest", () => {
  it("⚠ sends one message naming the child's week, refuses to repeat itself, and tells coverage per school", async () => {
    const both = [parentUserId, quietParentUserId];
    const first = await sendWeeklyDigests({ onlyParentUserIds: both });
    expect(first.sent).toBe(1);
    expect(first.quiet).toBe(1);
    // Coverage, not just sends: the served family AND the quiet one, so
    // "1 digest" can be read against how many families there were to reach.
    expect(first.perSchool[schoolId]).toEqual({ digests: 1, children: 1, quiet: 1 });

    const digests = await db.notification.findMany({
      where: { userId: parentUserId, title: "This week at school" },
    });
    expect(digests).toHaveLength(1);
    expect(digests[0]!.body).toContain("ZZ Digest Pupil");
    expect(digests[0]!.body).toContain("attended 1/1 days");
    expect(digests[0]!.body).toContain("1 homework item due this week");
    // The quiet family got no message — an empty digest teaches ignoring full ones.
    expect(await db.notification.count({ where: { userId: quietParentUserId } })).toBe(0);

    // The Monday-morning double run: the served family is skipped BY SCHOOL,
    // the quiet one is quiet again, and nothing sends twice.
    const second = await sendWeeklyDigests({ onlyParentUserIds: both });
    expect(second.sent).toBe(0);
    expect(second.perSchool[schoolId]).toEqual({ skipped: 1, quiet: 1 });
    expect(
      await db.notification.count({ where: { userId: parentUserId, title: "This week at school" } }),
    ).toBe(1);
  });
});
