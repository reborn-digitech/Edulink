import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createAssignment, publishAssignment } from "@/lib/grading";
import { RuleRefusal } from "@/lib/rule-refusal";
import { assignmentSchema } from "@/lib/validation";
import { newAssignmentSchema, teachingNewAssignmentSchema } from "@edulink/contracts";

/**
 * Publishing work tells every pupil in the class once and every guardian of
 * the class ONCE — not once per child. Found live: the school's stand-in
 * guardian read four identical "New work set" notices for one worksheet at a
 * class of four, because the fan-out ran per pupil. A parent with twins in the
 * class is the ordinary version of the same fault.
 */
const db = new PrismaClient();
const STAMP = Date.now();

let schoolId = "";
let classId = "";
let teacherUserId = "";
let teacherMembershipId = "";
let parentUserId = "";
let pupilUserIds: string[] = [];

beforeAll(async () => {
  const school = await db.school.create({
    data: {
      name: `ZZ Fanout School ${STAMP}`,
      slug: `zz-fanout-${STAMP}`,
      code: `ZF${String(STAMP).slice(-6)}`,
      contactEmail: `zz-fanout-school-${STAMP}@test.invalid`,
      timezone: "Asia/Kolkata",
    },
    select: { id: true },
  });
  schoolId = school.id;
  const mkUser = (name: string) =>
    db.user.create({
      data: { name, email: `zz-fanout-${name.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` },
      select: { id: true },
    });
  const [teacher, parent, a, b, c] = await Promise.all([
    mkUser("Teacher"), mkUser("Parent"), mkUser("Twin A"), mkUser("Twin B"), mkUser("Child C"),
  ]);
  teacherUserId = teacher.id;
  parentUserId = parent.id;
  pupilUserIds = [a.id, b.id, c.id];
  const mk = (userId: string, role: string, code?: string) =>
    db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", studentCode: code ?? null }, select: { id: true } });
  const teacherM = await mk(teacher.id, "TEACHER");
  teacherMembershipId = teacherM.id;
  const [ma, mb, mc] = await Promise.all([mk(a.id, "STUDENT", `ZFA${STAMP}`), mk(b.id, "STUDENT", `ZFB${STAMP}`), mk(c.id, "STUDENT", `ZFC${STAMP}`)]);
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Fanout 5", joinCode: `ZF${String(STAMP).slice(-6)}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId, role: "LEAD" } });
  for (const m of [ma, mb, mc]) {
    await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: m.id, status: "ACTIVE" } });
  }
  // One parent, two children in the same class.
  for (const m of [ma, mb]) {
    await db.guardianship.create({
      data: { parentUserId: parent.id, studentMembershipId: m.id, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" },
    });
  }
});

afterAll(async () => {
  await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const teacherCtx = () => ({ schoolId, membershipId: teacherMembershipId, role: "TEACHER" as const, userId: teacherUserId });

async function assignmentNotices() {
  return db.notification.findMany({ where: { schoolId, kind: "ASSIGNMENT" }, select: { userId: true, url: true } });
}

describe("publishing work tells each person once", () => {
  it("createAssignment with publish: every pupil once, the twins' parent once", async () => {
    const created = await createAssignment(teacherCtx(), { classId, title: "ZZ fanout sheet", body: "", publish: true });
    expect(created.notified).toBe(3);
    const notices = await assignmentNotices();
    for (const userId of pupilUserIds) {
      expect(notices.filter((n) => n.userId === userId)).toHaveLength(1);
    }
    const toParent = notices.filter((n) => n.userId === parentUserId);
    expect(toParent).toHaveLength(1);
    // And the door it opens is the parent's assignments page, not the overview.
    expect(toParent[0]!.url).toBe("/parent/assignments");
  });

  it("publishAssignment on a draft behaves the same", async () => {
    await db.notification.deleteMany({ where: { schoolId, kind: "ASSIGNMENT" } });
    const draft = await createAssignment(teacherCtx(), { classId, title: "ZZ fanout draft", body: "", publish: false });
    expect(await assignmentNotices()).toHaveLength(0);
    await publishAssignment(teacherCtx(), draft.assignmentId);
    const notices = await assignmentNotices();
    expect(notices.filter((n) => n.userId === parentUserId)).toHaveLength(1);
    expect(notices).toHaveLength(4); // three pupils + one parent
  });
});

describe("a due date in the past (A3-journeys-25)", () => {
  const past = new Date(Date.now() - 30 * 86_400_000).toISOString();
  it("is refused unless the teacher confirms it, and nothing is written or told", async () => {
    await db.notification.deleteMany({ where: { schoolId, kind: "ASSIGNMENT" } });
    const err = await createAssignment(teacherCtx(), { classId, title: "ZZ past due", body: "", dueAt: past, publish: true }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RuleRefusal);
    expect(err).toMatchObject({ key: "teacher.refusePastDue", status: 422, field: "dueAt" });
    expect(await db.assignment.count({ where: { schoolId, title: "ZZ past due" } })).toBe(0);
    expect(await assignmentNotices()).toHaveLength(0);
    const confirmed = await createAssignment(teacherCtx(), { classId, title: "ZZ past due", body: "", dueAt: past, publish: true, confirmPastDue: true });
    expect((await db.assignment.findUniqueOrThrow({ where: { id: confirmed.assignmentId } })).dueAt?.toISOString()).toBe(past);
  });

  it("takes a future due date, and the doors' contracts carry the confirmation", async () => {
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString();
    expect((await createAssignment(teacherCtx(), { classId, title: "ZZ future due", body: "", dueAt: future, publish: false })).assignmentId).toBeTruthy();
    expect(newAssignmentSchema.parse({ classId, title: "ZZ x", dueAt: past, confirmPastDue: true }).confirmPastDue).toBe(true);
    expect(teachingNewAssignmentSchema.parse({ classId, title: "ZZ x", dueAt: past, confirmPastDue: true }).confirmPastDue).toBe(true);
    expect(assignmentSchema.parse({ classId, title: "ZZ x", dueAt: past, confirmPastDue: true }).confirmPastDue).toBe(true);
  });
});
