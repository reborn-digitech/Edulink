/**
 * Lesson plan templates (syllabus.ts, through the /teaching/plan-templates
 * doors): a teacher keeps a plan of their class as a template, every
 * teacher of the school lists it (their own first), a colleague copies it
 * into their own class under one of its grade's chapters — a new PLANNED
 * lesson with the template's words, no link back — and only the author or
 * the office removes it. A lesson of a class the caller does not teach
 * cannot be kept, and a template cannot be applied to a class they do not
 * teach.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as listGet, POST as keepPost } from "@/app/api/v1/teaching/plan-templates/route";
import { POST as applyPost } from "@/app/api/v1/teaching/plan-templates/[id]/apply/route";
import { DELETE as removeDelete } from "@/app/api/v1/teaching/plan-templates/[id]/route";
import { todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let adminUserId = "";
let userA = "";
let userB = "";
let teacherA = "";
let teacherB = "";
let classA = "";
let classB = "";
let unitB = "";
let lessonA = "";
let templateId = "";
const today = todayKey(TZ);

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown, method = "POST") => new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const apply = (id: string, body: unknown) => applyPost(json(`/api/v1/teaching/plan-templates/${id}/apply`, body), { params: Promise.resolve({ id }) });
const remove = (id: string) => removeDelete(new Request(`http://localhost/api/v1/teaching/plan-templates/${id}`, { method: "DELETE" }), { params: Promise.resolve({ id }) });
async function as(who: "ADMIN" | "A" | "B" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "A") await createSession(userA, { schoolId, role: "TEACHER" });
  if (who === "B") await createSession(userB, { schoolId, role: "TEACHER" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Template School ${STAMP}`, slug: `zz-tpl-${STAMP}`, code: `ZT${suffix}`, contactEmail: `zz-tpl-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Template ${who}`, email: `zz-tpl-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, a, b] = await Promise.all([mk("Admin"), mk("Asha"), mk("Bhavna")]);
  adminUserId = admin.id;
  userA = a.id;
  userB = b.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  teacherA = (await db.membership.create({ data: { userId: userA, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  teacherB = (await db.membership.create({ data: { userId: userB, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  classA = (await db.class.create({ data: { schoolId, name: "ZZ 6A", gradeLevel: "6", joinCode: `ZT1${suffix}` }, select: { id: true } })).id;
  classB = (await db.class.create({ data: { schoolId, name: "ZZ 6B", gradeLevel: "6", joinCode: `ZT2${suffix}` }, select: { id: true } })).id;
  await db.classTeacher.createMany({ data: [{ schoolId, classId: classA, teacherMembershipId: teacherA, role: "LEAD" }, { schoolId, classId: classB, teacherMembershipId: teacherB, role: "LEAD" }] });
  unitB = (await db.syllabusUnit.create({ data: { schoolId, gradeLevel: "6", subject: "Science", position: 1, title: "ZZ Plants" }, select: { id: true } })).id;
  lessonA = (await db.lessonPlan.create({ data: { schoolId, classId: classA, teacherMembershipId: teacherA, subject: "Science", dateKey: today, topic: "ZZ Parts of a plant", notes: "Bring a leaf each.", homework: "Draw a flower.", status: "TAUGHT" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, userA, userB] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("keeping a plan as a template", () => {
  it("401 signed out; a teacher who does not teach the lesson's class cannot keep it; its teacher can, under its topic", async () => {
    await as(null);
    expect((await keepPost(json("/api/v1/teaching/plan-templates", { lessonId: lessonA }))).status).toBe(401);
    await as("B");
    expect((await keepPost(json("/api/v1/teaching/plan-templates", { lessonId: lessonA }))).status).toBe(404);
    await as("A");
    expect((await keepPost(json("/api/v1/teaching/plan-templates", {}))).status).toBe(422);
    const res = await keepPost(json("/api/v1/teaching/plan-templates", { lessonId: lessonA }));
    expect(res.status).toBe(201);
    templateId = (await res.json()).id;
    const row = await db.lessonPlanTemplate.findUniqueOrThrow({ where: { id: templateId } });
    expect(row).toMatchObject({ schoolId, authorUserId: userA, subject: "Science", grade: "6", title: "ZZ Parts of a plant" });
    expect(JSON.parse(row.body)).toEqual({ topic: "ZZ Parts of a plant", notes: "Bring a leaf each.", homework: "Draw a flower." });
    expect(await db.auditLog.count({ where: { schoolId, action: "syllabus.template.save", targetId: templateId } })).toBe(1);
  });

  it("every teacher of the school lists it, the caller's own first, narrowed by subject", async () => {
    await as("B");
    const all = await (await listGet(get("/api/v1/teaching/plan-templates"))).json();
    expect(all.items).toHaveLength(1);
    expect(all.items[0]).toMatchObject({ id: templateId, title: "ZZ Parts of a plant", topic: "ZZ Parts of a plant", notes: "Bring a leaf each.", homework: "Draw a flower.", authorName: "ZZ Template Asha", own: false, grade: "6" });
    expect((await (await listGet(get("/api/v1/teaching/plan-templates?subject=Mathematics"))).json()).items).toEqual([]);
    await as("A");
    expect((await (await listGet(get("/api/v1/teaching/plan-templates?subject=Science"))).json()).items[0].own).toBe(true);
  });
});

describe("applying a template", () => {
  it("copies the words into a new planned lesson of a class the caller teaches, under a chapter of its grade; a class they do not teach and a chapter of another grade are refused", async () => {
    await as("B");
    expect((await apply(templateId, { classId: classA, unitId: unitB })).status).toBe(404);
    expect((await apply(templateId, {})).status).toBe(422);
    const res = await apply(templateId, { classId: classB, unitId: unitB, dateKey: today });
    expect(res.status).toBe(201);
    const { lessonId } = await res.json();
    const lesson = await db.lessonPlan.findUniqueOrThrow({ where: { id: lessonId } });
    expect(lesson).toMatchObject({ schoolId, classId: classB, teacherMembershipId: teacherB, subject: "Science", unitId: unitB, dateKey: today, topic: "ZZ Parts of a plant", notes: "Bring a leaf each.", homework: "Draw a flower.", status: "PLANNED" });
    // The copy stands on its own: nothing on the lesson names the template.
    expect(Object.keys(lesson)).not.toContain("templateId");
    expect(await db.auditLog.count({ where: { schoolId, action: "syllabus.template.apply", targetId: classB } })).toBe(1);
    // A chapter of another grade is not this class's.
    const unit9 = await db.syllabusUnit.create({ data: { schoolId, gradeLevel: "9", subject: "Science", position: 1, title: "ZZ Cells" }, select: { id: true } });
    expect((await apply(templateId, { classId: classB, unitId: unit9.id })).status).toBe(404);
    // A template that is not the school's is not found.
    expect((await apply("c" + "x".repeat(24), { classId: classB })).status).toBe(404);
  });

  it("rewriting the template later changes no copied lesson", async () => {
    await db.lessonPlanTemplate.update({ where: { id: templateId }, data: { body: JSON.stringify({ topic: "Changed", notes: "", homework: "" }) } });
    const copied = await db.lessonPlan.findFirst({ where: { schoolId, classId: classB }, select: { topic: true } });
    expect(copied?.topic).toBe("ZZ Parts of a plant");
  });
});

describe("removing a template", () => {
  it("a colleague is refused; the author removes it; nothing there is a no-op; the office may remove anyone's", async () => {
    await as("B");
    expect((await remove(templateId)).status).toBe(403);
    await as("A");
    expect(await (await remove(templateId)).json()).toEqual({ changed: true });
    expect(await (await remove(templateId)).json()).toEqual({ changed: false });
    expect(await db.lessonPlan.count({ where: { schoolId, classId: classB } })).toBe(1);
    const again = await (await keepPost(json("/api/v1/teaching/plan-templates", { lessonId: lessonA, title: "ZZ Plants, kept twice" }))).json();
    await as("ADMIN");
    expect(await (await remove(again.id)).json()).toEqual({ changed: true });
    expect(await db.auditLog.count({ where: { schoolId, action: "syllabus.template.delete" } })).toBe(2);
  });
});
