/**
 * Syllabus coverage through its handlers: the office writes a grade's list
 * and rewrites it keeping ids, a class's teacher moves units and logs
 * lessons, a lesson taught moves its unit along, the head's coverage
 * counts done over all against the year, and a teacher of another class
 * is refused.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as officeGet, POST as officePost } from "@/app/api/v1/office/syllabus/route";
import { GET as coverageGet } from "@/app/api/v1/office/syllabus/coverage/route";
import { GET as staffGet } from "@/app/api/v1/staff/syllabus/route";
import { POST as progressPost } from "@/app/api/v1/staff/syllabus/progress/route";
import { POST as lessonPost } from "@/app/api/v1/staff/lessons/route";
import { POST as lessonStatusPost } from "@/app/api/v1/staff/lessons/[lessonId]/status/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let parentUserId = "";
let classId = "";
let otherClassId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER_TEACHER" | "PARENT" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "OTHER_TEACHER") await createSession(otherTeacherUserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Syllabus School ${STAMP}`, slug: `zz-syl-${STAMP}`, code: `ZS${suffix}`, contactEmail: `zz-syl-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  // A year half gone, so "expected" is half the list.
  await db.academicYear.create({ data: { schoolId, name: "ZZ 2026-27", startDate: new Date(Date.now() - 100 * 86_400_000), endDate: new Date(Date.now() + 100 * 86_400_000), isCurrent: true } });
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Syl ${who}`, email: `zz-syl-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, other, parent, pupil] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Other"), mk("Parent"), mk("Pupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  otherTeacherUserId = other.id;
  parentUserId = parent.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const om = await db.membership.create({ data: { userId: otherTeacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ Syl 4A", gradeLevel: "4", joinCode: `ZS${suffix}` }, select: { id: true } })).id;
  otherClassId = (await db.class.create({ data: { schoolId, name: "ZZ Syl 5A", gradeLevel: "5", joinCode: `ZT${suffix}` }, select: { id: true } })).id;
  await db.classTeacher.createMany({ data: [{ schoolId, classId, teacherMembershipId: tm.id, role: "LEAD" }, { schoolId, classId: otherClassId, teacherMembershipId: om.id, role: "LEAD" }] });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSP${STAMP}` }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, otherTeacherUserId, parentUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

let unitIds: string[] = [];
let lessonId = "";

describe("the office's list", () => {
  it("401 signed out; a teacher and a guardian are refused; the office writes a list in order and reads it back", async () => {
    await as(null);
    expect((await officeGet(get("/api/v1/office/syllabus"))).status).toBe(401);
    await as("TEACHER");
    expect((await officeGet(get("/api/v1/office/syllabus"))).status).toBe(403);
    await as("PARENT");
    expect((await officeGet(get("/api/v1/office/syllabus"))).status).toBe(403);
    // The head reads the lists; writing one is setting the school up, the admin's.
    await as("PRINCIPAL");
    expect((await officeGet(get("/api/v1/office/syllabus"))).status).toBe(200);
    expect((await officePost(json("/x", { gradeLevel: "4", subject: "ZZ Head's subject", units: [{ title: "ZZ Chapter" }] }))).status).toBe(403);
    await as("ADMIN");
    expect((await officePost(json("/x", {}))).status).toBe(422);
    const saved = await officePost(json("/x", { gradeLevel: "4", subject: " Mathematics ", units: [{ title: "Numbers" }, { title: "Fractions", periodsPlanned: 8 }, { title: "Shapes" }, { title: "Data" }] }));
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ units: 4, removed: 0 });
    const list = await (await officeGet(get("/api/v1/office/syllabus?gradeLevel=4&subject=Mathematics"))).json();
    expect(list.lists).toEqual([{ gradeLevel: "4", subject: "Mathematics", units: 4 }]);
    expect(list.grades).toEqual(["4", "5"]);
    expect(list.units.map((u: { position: number; title: string; periodsPlanned: number | null }) => [u.position, u.title, u.periodsPlanned])).toEqual([[1, "Numbers", null], [2, "Fractions", 8], [3, "Shapes", null], [4, "Data", null]]);
    unitIds = list.units.map((u: { id: string }) => u.id);
  });
});

describe("a class's progress", () => {
  it("the class's teacher reads the list with nothing started, moves a unit to done, plans a lesson and logs one taught which nudges its unit; another class's teacher is 404", async () => {
    await as("OTHER_TEACHER");
    expect((await staffGet(get(`/api/v1/staff/syllabus?classId=${classId}`))).status).toBe(404);
    expect((await progressPost(json("/x", { classId, unitId: unitIds[0], status: "DONE" }))).status).toBe(404);
    await as("TEACHER");
    const before = await (await staffGet(get(`/api/v1/staff/syllabus?classId=${classId}`))).json();
    expect(before).toMatchObject({ className: "ZZ Syl 4A", gradeLevel: "4", subjects: ["Mathematics"], subject: "Mathematics", percent: 0, canEdit: true });
    expect(before.units).toHaveLength(4);
    expect(before.units[0]).toMatchObject({ title: "Numbers", status: "NOT_STARTED", lessons: 0 });
    expect((await progressPost(json("/x", { classId, unitId: unitIds[0], status: "DONE" }))).status).toBe(200);
    // A unit from another grade's list is refused.
    await as("ADMIN");
    await officePost(json("/x", { gradeLevel: "5", subject: "Mathematics", units: [{ title: "Decimals" }] }));
    const five = await (await officeGet(get("/api/v1/office/syllabus?gradeLevel=5&subject=Mathematics"))).json();
    await as("TEACHER");
    expect((await progressPost(json("/x", { classId, unitId: five.units[0].id, status: "DONE" }))).status).toBe(404);
    const planned = await lessonPost(json("/x", { classId, subject: "Mathematics", unitId: unitIds[1], dateKey: "2026-09-21", topic: "Halves and quarters", homework: "Page 12" }));
    expect(planned.status).toBe(201);
    lessonId = (await planned.json()).id;
    const taught = await lessonPost(json("/x", { classId, subject: "Mathematics", unitId: unitIds[2], dateKey: "2026-09-18", topic: "Triangles", status: "TAUGHT" }));
    expect(taught.status).toBe(201);
    const after = await (await staffGet(get(`/api/v1/staff/syllabus?classId=${classId}`))).json();
    expect(after.units.map((u: { title: string; status: string; lessons: number }) => [u.title, u.status, u.lessons])).toEqual([["Numbers", "DONE", 0], ["Fractions", "NOT_STARTED", 1], ["Shapes", "IN_PROGRESS", 1], ["Data", "NOT_STARTED", 0]]);
    expect(after.units[0].doneOn).toEqual(expect.any(String));
    expect(after.units[0].byName).toBe("ZZ Syl Teacher");
    expect(after.percent).toBe(25);
    expect(after.lessons.map((l: { topic: string; status: string; unitTitle: string | null }) => [l.topic, l.status, l.unitTitle])).toEqual([["Halves and quarters", "PLANNED", "Fractions"], ["Triangles", "TAUGHT", "Shapes"]]);
    // Marking the planned lesson taught nudges Fractions along; a done unit is not pulled back.
    expect((await lessonStatusPost(json("/x", { status: "TAUGHT" }), { params: Promise.resolve({ lessonId }) })).status).toBe(200);
    const nudged = await (await staffGet(get(`/api/v1/staff/syllabus?classId=${classId}`))).json();
    expect(nudged.units[1].status).toBe("IN_PROGRESS");
    await as("OTHER_TEACHER");
    expect((await lessonStatusPost(json("/x", { status: "SKIPPED" }), { params: Promise.resolve({ lessonId }) })).status).toBe(404);
  });
});

describe("the head's coverage", () => {
  it("counts done over all against how far the year has gone, flags a class two units short, and keeps ids and progress when the office rewrites the list", async () => {
    await as("ADMIN");
    const cov = await (await coverageGet()).json();
    expect(cov.yearName).toBe("ZZ 2026-27");
    expect(cov.yearElapsedPercent).toBe(50);
    const row = cov.rows.find((r: { classId: string; subject: string }) => r.classId === classId && r.subject === "Mathematics");
    expect(row).toMatchObject({ className: "ZZ Syl 4A", units: 4, done: 1, inProgress: 2, percent: 25, expected: 2, behind: false, lastTaughtOn: "2026-09-21" });
    const five = cov.rows.find((r: { classId: string }) => r.classId === otherClassId);
    expect(five).toMatchObject({ units: 1, done: 0, expected: 1, behind: false });
    expect(cov.overallPercent).toBe(20);
    // The office reorders and drops one: the kept units keep their ids and the class's progress; the dropped one takes its progress with it.
    const rewrite = await officePost(json("/x", { gradeLevel: "4", subject: "Mathematics", units: [{ id: unitIds[2], title: "Shapes and angles" }, { id: unitIds[0], title: "Numbers" }, { title: "Time" }] }));
    expect(await rewrite.json()).toEqual({ units: 3, removed: 2 });
    await as("TEACHER");
    const after = await (await staffGet(get(`/api/v1/staff/syllabus?classId=${classId}`))).json();
    expect(after.units.map((u: { id: string; position: number; title: string; status: string }) => [u.position, u.title, u.status])).toEqual([[1, "Shapes and angles", "IN_PROGRESS"], [2, "Numbers", "DONE"], [3, "Time", "NOT_STARTED"]]);
    expect(after.units[0].id).toBe(unitIds[2]);
    // The lesson that pointed at the dropped unit keeps its words and loses only the link.
    expect(after.lessons.find((l: { topic: string }) => l.topic === "Halves and quarters")).toMatchObject({ unitId: null, unitTitle: null });
    await as("ADMIN");
    expect((await officePost(json("/x", { gradeLevel: "4", subject: "Mathematics", units: [{ id: five_id_placeholder(), title: "x" }] }))).status).toBe(404);
    const audits = await db.auditLog.findMany({ where: { schoolId, action: { in: ["syllabus.save", "syllabus.progress", "syllabus.lesson"] } }, select: { action: true, meta: true } });
    expect(audits.filter((a) => a.action === "syllabus.save")).toHaveLength(3);
    expect(JSON.stringify(audits.map((a) => a.meta))).not.toContain("Triangles");
  });
});

function five_id_placeholder(): string {
  return "c" + "z".repeat(24);
}
