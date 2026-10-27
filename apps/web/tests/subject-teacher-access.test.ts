/**
 * The owner's item 1 of 27 October 2026: a subject teacher sets work for
 * every class the timetable sends them to.
 *
 * Before, a TEACHER reached a class only through a ClassTeacher row (LEAD,
 * CO or SUBJECT). A teacher who took 6A for English on the timetable, and
 * held no row, was told "class not found" (404) setting homework there, the
 * class never appeared in their picker, and the gradebook, the syllabus, the
 * lesson plans and remarks about those pupils were closed to them. Now one
 * lesson on the timetable is enough for those; work they set there is theirs
 * to grade, tagged with the subject they take; and the register stays the
 * form teacher's.
 *
 * At a ZZ school of this suite's own (people at @test.invalid), deleted by id.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { createSession } from "@/lib/session";
import { __resetCookies } from "./stubs/next-headers";
import { assertClassAccess, assertStudentAccess, assertAssignmentAccess, formClassIds, teacherClassIds, taughtClasses } from "@/lib/tenancy";
import { createAssignment, getGradebook, publishAssignment, saveGrades } from "@/lib/grading";
import { saveLessonPlan, saveSyllabusProgress, staffSyllabus } from "@/lib/syllabus";
import { createThread, studentsForTeacher } from "@/lib/remarks";
import { healthCardFor } from "@/lib/health";
import { pupilRecordFor } from "@/lib/pupil-records";
import { assertClassAccessForRegister, assertMayTakeRegister, registerDuty } from "@/lib/register-duty";
import { studentAssignments } from "@/lib/api-reads/family";
import { GET as assignmentsGet, POST as assignmentsPost } from "@/app/api/v1/staff/assignments/route";
import { POST as teachingAssignmentsPost } from "@/app/api/v1/teaching/assignments/route";
import { GET as registerGet } from "@/app/api/v1/staff/attendance/register/route";
import { GET as classesGet } from "@/app/api/v1/staff/classes/route";
import { GET as classGet } from "@/app/api/v1/staff/classes/[classId]/route";
import { todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const EMAIL = (who: string) => `zz-subject-${who}-${STAMP}@test.invalid`;

const ids = { school: "", klassA: "", klassB: "", klassC: "", period: "", period2: "", englishUnit: "", mathsUnit: "", formWork: "" };
type Person = { userId: string; membershipId: string };
let admin: Person;
let form: Person; // LEAD of 6A and of nothing else
let subject: Person; // English in 6A and 6B on the timetable, no ClassTeacher row anywhere
let pupil: Person; // in 6A
let pupilC: Person; // in 7A, a class the subject teacher does not take

const prefs = { theme: "system", contrast: "normal", locale: "en", channels: { push: false, email: false }, quietHours: null } as never;
function ctxOf(p: Person, role: "ADMIN" | "TEACHER" | "STUDENT"): ActiveContext {
  return { sessionId: "test-session", membershipId: p.membershipId, schoolId: ids.school, role, user: { id: p.userId, name: "ZZ Subject", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs } };
}
const scoped = (p: Person, role: "ADMIN" | "TEACHER") => ({ schoolId: ids.school, membershipId: p.membershipId, role, userId: p.userId });

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function as(p: Person, role: "TEACHER" | "ADMIN") {
  __resetCookies();
  await createSession(p.userId, { schoolId: ids.school, role });
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Subject School ${STAMP}`, slug: `zz-subject-${STAMP}`, code: `ZSJ${SUFFIX}`, contactEmail: EMAIL("school"), timezone: TZ, locale: "en", verifiedAt: new Date(), teachingDays: "0,1,2,3,4,5,6" }, select: { id: true } })).id;
  const person = async (who: string, role: "ADMIN" | "TEACHER" | "STUDENT"): Promise<Person> => {
    const userId = (await db.user.create({ data: { name: `ZZ Subject ${who}`, email: EMAIL(who.toLowerCase()) }, select: { id: true } })).id;
    const membershipId = (await db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZSJ${who}${SUFFIX}` } : {}) }, select: { id: true } })).id;
    return { userId, membershipId };
  };
  admin = await person("Admin", "ADMIN");
  form = await person("Form", "TEACHER");
  subject = await person("Rekha", "TEACHER");
  pupil = await person("Pupil", "STUDENT");
  pupilC = await person("PupilC", "STUDENT");

  ids.klassA = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ Grade 6 · A", gradeLevel: "6", joinCode: `ZJA${SUFFIX}` }, select: { id: true } })).id;
  ids.klassB = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ Grade 6 · B", gradeLevel: "6", joinCode: `ZJB${SUFFIX}` }, select: { id: true } })).id;
  ids.klassC = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ Grade 7 · A", gradeLevel: "7", joinCode: `ZJC${SUFFIX}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.klassA, schoolId: ids.school, teacherMembershipId: form.membershipId, role: "LEAD" } });
  await db.enrollment.create({ data: { classId: ids.klassA, schoolId: ids.school, studentMembershipId: pupil.membershipId, status: "ACTIVE" } });
  await db.enrollment.create({ data: { classId: ids.klassC, schoolId: ids.school, studentMembershipId: pupilC.membershipId, status: "ACTIVE" } });

  ids.period = (await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "Period 1", startMinute: 480, endMinute: 525, position: 1 }, select: { id: true } })).id;
  ids.period2 = (await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "Period 2", startMinute: 525, endMinute: 570, position: 2 }, select: { id: true } })).id;
  // English in 6A on Monday and in 6B on Tuesday; Mathematics in 6A is the form teacher's.
  await db.timetableSlot.create({ data: { schoolId: ids.school, classId: ids.klassA, periodId: ids.period, weekday: 1, subject: "English", teacherMembershipId: subject.membershipId } });
  await db.timetableSlot.create({ data: { schoolId: ids.school, classId: ids.klassB, periodId: ids.period, weekday: 2, subject: "English", teacherMembershipId: subject.membershipId } });
  await db.timetableSlot.create({ data: { schoolId: ids.school, classId: ids.klassA, periodId: ids.period2, weekday: 1, subject: "Mathematics", teacherMembershipId: form.membershipId } });

  ids.englishUnit = (await db.syllabusUnit.create({ data: { schoolId: ids.school, gradeLevel: "6", subject: "English", position: 1, title: "ZZ Poems" }, select: { id: true } })).id;
  ids.mathsUnit = (await db.syllabusUnit.create({ data: { schoolId: ids.school, gradeLevel: "6", subject: "Mathematics", position: 1, title: "ZZ Fractions" }, select: { id: true } })).id;
  ids.formWork = (await db.assignment.create({ data: { schoolId: ids.school, classId: ids.klassA, authorMembershipId: form.membershipId, title: "ZZ Fractions sheet", publishedAt: new Date() }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const users = [admin, form, subject, pupil, pupilC].filter(Boolean).map((p) => p.userId);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { userId: { in: users } }] } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  expect(await db.school.count({ where: { id: ids.school } })).toBe(0);
  expect(await db.user.count({ where: { email: { contains: `-${STAMP}@test.invalid` } } })).toBe(0);
  await db.$disconnect();
});

describe("which classes a subject teacher teaches", () => {
  it("one lesson on the timetable makes the class theirs; a class with none stays not found", async () => {
    const sctx = { schoolId: ids.school, membershipId: subject.membershipId, role: "TEACHER" as const };
    await expect(assertClassAccess(sctx, ids.klassA, { write: true })).resolves.toMatchObject({ id: ids.klassA });
    await expect(assertClassAccess(sctx, ids.klassC)).rejects.toMatchObject({ key: "access.classNotFoundInYourSchool", code: "NOT_FOUND" });
    expect((await teacherClassIds(ids.school, subject.membershipId)).sort()).toEqual([ids.klassA, ids.klassB].sort());
    // The form-class list (registers, the home page's form classes) is unchanged: none.
    expect(await formClassIds(ids.school, subject.membershipId)).toEqual([]);
    const taught = await taughtClasses(ids.school, subject.membershipId);
    expect(taught.get(ids.klassA)).toEqual({ formTeacher: false, subjects: ["English"] });
    const formTaught = await taughtClasses(ids.school, form.membershipId);
    expect(formTaught.get(ids.klassA)).toEqual({ formTeacher: true, subjects: ["Mathematics"] });
  });

  it("their pupils are theirs for a remark; a pupil of a class they do not take is not", async () => {
    const sctx = { schoolId: ids.school, membershipId: subject.membershipId, role: "TEACHER" as const };
    await expect(assertStudentAccess(sctx, pupil.membershipId)).resolves.toMatchObject({ id: pupil.membershipId });
    await expect(assertStudentAccess(sctx, pupilC.membershipId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await studentsForTeacher(ids.school, subject.membershipId)).map((s) => s.membershipId)).toEqual([pupil.membershipId]);
    const { threadId } = await createThread(ctxOf(subject, "TEACHER"), { studentMembershipId: pupil.membershipId, subject: "ZZ Reading log", body: "Reading well this week." });
    expect(await db.remarkThread.count({ where: { id: threadId, teacherMembershipId: subject.membershipId } })).toBe(1);
  });
});

describe("what stays with the class's own teachers and the office", () => {
  it("the subject teacher is refused the health card of a pupil in a timetable-only class; the form teacher reads it", async () => {
    await expect(healthCardFor(ctxOf(subject, "TEACHER"), pupil.membershipId)).rejects.toMatchObject({ key: "access.studentNotFoundInYourClasses", code: "NOT_FOUND" });
    await expect(healthCardFor(ctxOf(form, "TEACHER"), pupil.membershipId)).resolves.toBeTruthy();
  });

  it("the subject teacher is refused that pupil's record; the form teacher and the office read it", async () => {
    await expect(pupilRecordFor(ctxOf(subject, "TEACHER"), pupil.membershipId)).rejects.toMatchObject({ key: "access.studentNotFoundInYourClasses", code: "NOT_FOUND" });
    await expect(pupilRecordFor(ctxOf(form, "TEACHER"), pupil.membershipId)).resolves.toBeTruthy();
    await expect(pupilRecordFor(ctxOf(admin, "ADMIN"), pupil.membershipId)).resolves.toBeTruthy();
  });
});

describe("assignments, the gradebook and publishing", () => {
  let draftId = "";

  it("creates a draft in a timetable-only class, tagged with the timetable's subject as the timetable spells it", async () => {
    const created = await createAssignment(scoped(subject, "TEACHER"), { classId: ids.klassA, title: "ZZ Poem recital", body: "", publish: false, subject: "english" });
    draftId = created.assignmentId;
    const row = await db.assignment.findUniqueOrThrow({ where: { id: draftId }, select: { subject: true, authorMembershipId: true } });
    expect(row).toEqual({ subject: "English", authorMembershipId: subject.membershipId });
  });

  it("a subject they do not take in that class is refused 422 on the field", async () => {
    await expect(createAssignment(scoped(subject, "TEACHER"), { classId: ids.klassA, title: "ZZ Maths for fun", body: "", publish: false, subject: "Mathematics" })).rejects.toMatchObject({ key: "subjectWork.refuseNotYours", status: 422, field: "subject" });
    await expect(createAssignment(scoped(subject, "TEACHER"), { classId: ids.klassC, title: "ZZ Elsewhere", body: "", publish: false })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("with one subject in the class and none named, the work takes that subject", async () => {
    const { assignmentId } = await createAssignment(scoped(subject, "TEACHER"), { classId: ids.klassB, title: "ZZ Spelling list", body: "", publish: false });
    expect((await db.assignment.findUniqueOrThrow({ where: { id: assignmentId }, select: { subject: true } })).subject).toBe("English");
  });

  it("publishes, the pupil is told with the subject in the title, and grades", async () => {
    await publishAssignment(scoped(subject, "TEACHER"), draftId);
    const told = await db.notification.findFirstOrThrow({ where: { userId: pupil.userId, kind: "ASSIGNMENT" }, select: { title: true, titleKey: true, body: true } });
    expect(told).toMatchObject({ titleKey: "subjectWork.newWorkSetIn", title: "New English work set", body: "ZZ Poem recital" });
    const book = await getGradebook(scoped(subject, "TEACHER"), draftId);
    expect(book.rows.map((r) => r.membershipId)).toEqual([pupil.membershipId]);
    const saved = await saveGrades(scoped(subject, "TEACHER"), draftId, [{ studentMembershipId: pupil.membershipId, score: 8 }]);
    expect(saved).toMatchObject({ saved: 1, rejected: [] });
  });

  it("the pupil's card carries the subject", async () => {
    const work = await studentAssignments(ctxOf(pupil, "STUDENT") as never);
    const card = [...work.todo, ...work.handedIn, ...work.marked].find((w) => w.id === draftId);
    expect(card).toMatchObject({ subject: "English", className: "ZZ Grade 6 · A" });
  });

  it("the form teacher's work in that class is not the subject teacher's to open or grade; the form teacher reads theirs", async () => {
    const sctx = { schoolId: ids.school, membershipId: subject.membershipId, role: "TEACHER" as const };
    await expect(assertAssignmentAccess(sctx, ids.formWork)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const fctx = { schoolId: ids.school, membershipId: form.membershipId, role: "TEACHER" as const };
    await expect(assertAssignmentAccess(fctx, draftId)).resolves.toMatchObject({ id: draftId });
  });
});

describe("syllabus progress and lesson plans", () => {
  it("records progress and a lesson in their own subject; another subject of the class is refused", async () => {
    const tctx = ctxOf(subject, "TEACHER");
    await saveSyllabusProgress(tctx, { classId: ids.klassA, unitId: ids.englishUnit, status: "DONE", doneOn: todayKey(TZ) });
    expect(await db.syllabusProgress.count({ where: { classId: ids.klassA, unitId: ids.englishUnit, status: "DONE", byMembershipId: subject.membershipId } })).toBe(1);
    await expect(saveSyllabusProgress(tctx, { classId: ids.klassA, unitId: ids.mathsUnit, status: "DONE" })).rejects.toMatchObject({ key: "subjectWork.refuseSyllabus" });
    const lesson = await saveLessonPlan(tctx, { classId: ids.klassA, subject: "English", unitId: ids.englishUnit, dateKey: todayKey(TZ), topic: "ZZ The brook", notes: "", homework: "", status: "TAUGHT" });
    expect(lesson.id).toBeTruthy();
    await expect(saveLessonPlan(tctx, { classId: ids.klassA, subject: "Mathematics", dateKey: todayKey(TZ), topic: "ZZ Not mine", notes: "", homework: "", status: "PLANNED" })).rejects.toMatchObject({ key: "subjectWork.refuseSyllabus" });
    const view = await staffSyllabus(tctx, { classId: ids.klassA, subject: "English" });
    expect(view.canEdit).toBe(true);
    expect((await staffSyllabus(tctx, { classId: ids.klassA, subject: "Mathematics" })).canEdit).toBe(false);
  });
});

describe("the register stays the form teacher's", () => {
  it("no duty, and the register's own boundary still answers not found", async () => {
    const sctx = { schoolId: ids.school, membershipId: subject.membershipId, role: "TEACHER" as const };
    const dateKey = todayKey(TZ);
    const duty = await registerDuty(sctx, ids.klassA, dateKey);
    expect(duty).toEqual({ may: false, reason: "NONE" });
    await expect(assertMayTakeRegister(sctx, ids.klassA, dateKey)).rejects.toMatchObject({ key: "access.notYourRegister" });
    await expect(assertClassAccessForRegister(sctx, ids.klassA, duty)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(assertClassAccessForRegister(sctx, ids.klassA, duty, { write: true })).rejects.toMatchObject({ code: "NOT_FOUND" });
    // The form teacher, as before.
    const fctx = { schoolId: ids.school, membershipId: form.membershipId, role: "TEACHER" as const };
    expect((await registerDuty(fctx, ids.klassA, dateKey)).may).toBe(true);
  });
});

describe("the doors", () => {
  it("POST /api/v1/staff/assignments sets work in a timetable-only class (was 404) and the teaching door with handouts answers 201", async () => {
    await as(subject, "TEACHER");
    const res = await assignmentsPost(json("/api/v1/staff/assignments", { classId: ids.klassB, title: "ZZ Door draft", publish: false, subject: "English" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ notified: 0 });
    const teaching = await teachingAssignmentsPost(json("/api/v1/teaching/assignments", { classId: ids.klassB, title: "ZZ Door draft two", publish: false }));
    expect(teaching.status).toBe(201);
    const refused = await assignmentsPost(json("/api/v1/staff/assignments", { classId: ids.klassC, title: "ZZ Not mine", publish: false }));
    expect(refused.status).toBe(404);
    const wrongSubject = await assignmentsPost(json("/api/v1/staff/assignments", { classId: ids.klassB, title: "ZZ Wrong subject", publish: false, subject: "Art" }));
    expect(wrongSubject.status).toBe(422);
  });

  it("the picker lists the union, each class saying form teacher or the subjects taken; the list shows only their own work there", async () => {
    await as(subject, "TEACHER");
    const res = await assignmentsGet(get("/api/v1/staff/assignments?years=all"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classOptions).toEqual([
      { id: ids.klassA, name: "ZZ Grade 6 · A", formTeacher: false, subjects: ["English"] },
      { id: ids.klassB, name: "ZZ Grade 6 · B", formTeacher: false, subjects: ["English"] },
    ]);
    const titles = body.assignments.map((a: { title: string }) => a.title);
    expect(titles).toContain("ZZ Poem recital");
    expect(titles).not.toContain("ZZ Fractions sheet");
    expect(body.assignments.find((a: { title: string }) => a.title === "ZZ Poem recital").subject).toBe("English");

    await as(form, "TEACHER");
    const formBody = await (await assignmentsGet(get("/api/v1/staff/assignments?years=all"))).json();
    expect(formBody.classOptions).toEqual([{ id: ids.klassA, name: "ZZ Grade 6 · A", formTeacher: true, subjects: ["Mathematics", "English"] }]);
    expect(formBody.assignments.map((a: { title: string }) => a.title)).toEqual(expect.arrayContaining(["ZZ Poem recital", "ZZ Fractions sheet"]));
  });

  it("the classes list and a class's page open, saying the class is not their form class", async () => {
    await as(subject, "TEACHER");
    const list = await (await classesGet()).json();
    expect(list.classes.map((k: { id: string; formTeacher: boolean }) => [k.id, k.formTeacher]).sort()).toEqual([[ids.klassA, false], [ids.klassB, false]].sort());
    const res = await classGet(get("/x"), { params: Promise.resolve({ classId: ids.klassA }) });
    expect(res.status).toBe(200);
    const detail = await res.json();
    expect(detail).toMatchObject({ formTeacher: false, subjects: ["English"] });
    // Their own work in the class, never the form teacher's.
    expect(detail.recentAssignments.map((a: { title: string }) => a.title)).not.toContain("ZZ Fractions sheet");
  });

  it("the register door still answers 404 to the subject teacher", async () => {
    await as(subject, "TEACHER");
    const res = await registerGet(get(`/api/v1/staff/attendance/register?classId=${ids.klassA}`));
    expect(res.status).toBe(404);
  });
});
