/**
 * The /api/v1/staff handlers — the teacher's and the principal's pages as
 * JSON — invoked directly with a primed session the way api-v1-routes.test.ts
 * does: the happy path, 401 signed out, 403 for the wrong role, 404 for
 * another school's id, 422 for a body or query that does not parse.
 *
 * Everything created here is ZZ-prefixed and deleted in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { AVATAR_PRESETS } from "@/components/ui/avatar";
import { GET as todayGet } from "@/app/api/v1/staff/today/route";
import { GET as attendanceClassesGet } from "@/app/api/v1/staff/attendance/classes/route";
import { GET as registerGet } from "@/app/api/v1/staff/attendance/register/route";
import { GET as classesGet } from "@/app/api/v1/staff/classes/route";
import { GET as classGet } from "@/app/api/v1/staff/classes/[classId]/route";
import { POST as weightsPost } from "@/app/api/v1/staff/classes/[classId]/weights/route";
import { GET as assignmentsGet, POST as assignmentsPost } from "@/app/api/v1/staff/assignments/route";
import { POST as publishPost } from "@/app/api/v1/staff/assignments/publish/route";
import { GET as examsGet } from "@/app/api/v1/staff/exams/route";
import { GET as gridGet } from "@/app/api/v1/staff/exams/grid/route";
import { GET as sheetsGet } from "@/app/api/v1/staff/exams/sheets/route";
import { GET as timetableGet } from "@/app/api/v1/staff/timetable/route";
import { GET as practiceGet, POST as practicePost } from "@/app/api/v1/staff/practice/route";
import { POST as practiceArchivePost } from "@/app/api/v1/staff/practice/archive/route";
import { GET as meetingsGet, POST as meetingsPost } from "@/app/api/v1/staff/meetings/route";
import { POST as cancelSlotPost } from "@/app/api/v1/staff/meetings/cancel/route";
import { GET as leaveGet, POST as leavePost } from "@/app/api/v1/staff/leave/route";
import { GET as profileGet, POST as profilePost } from "@/app/api/v1/staff/profile/route";
import { GET as expertsGet } from "@/app/api/v1/staff/experts/route";
import { POST as bookPost } from "@/app/api/v1/staff/experts/book/route";
import { GET as overviewGet } from "@/app/api/v1/staff/principal/overview/route";
import { GET as principalClassesGet } from "@/app/api/v1/staff/principal/classes/route";
import { GET as principalTimetableGet } from "@/app/api/v1/staff/principal/timetable/route";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);

let schoolId = "";
let otherSchoolId = "";
let classId = "";
let otherClassId = "";
let slotId = "";
let otherSlotId = "";
let otherAssignmentId = "";
let otherMeetingSlotId = "";
let teacherUserId = "";
let adminUserId = "";
let principalUserId = "";
let pupilUserId = "";
let pupilMembershipId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

async function as(userId: string, role: "TEACHER" | "ADMIN" | "PRINCIPAL" | "STUDENT") {
  __resetCookies();
  await createSession(userId, { schoolId, role });
}
const asTeacher = () => as(teacherUserId, "TEACHER");
const asAdmin = () => as(adminUserId, "ADMIN");
const asPrincipal = () => as(principalUserId, "PRINCIPAL");
const asPupil = () => as(pupilUserId, "STUDENT");

/** A date key a few weeks out, so leave and meetings land in the future whatever today is. */
function futureKey(daysAhead: number): string {
  const d = new Date(Date.now() + daysAhead * 86_400_000);
  // A Wednesday, so the leave span never straddles a weekend the balance would skip.
  d.setUTCDate(d.getUTCDate() + ((3 - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Staff School ${STAMP}`, slug: `zz-staff-${STAMP}`, code: `ZS${tail}`, contactEmail: `zz-staff-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const other = await db.school.create({
    data: { name: `ZZ Staff Other ${STAMP}`, slug: `zz-staffo-${STAMP}`, code: `ZT${tail}`, contactEmail: `zz-staffo-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  otherSchoolId = other.id;

  const [teacher, admin, principal, pupil, otherTeacher] = await Promise.all([
    db.user.create({ data: { name: "ZZ Staff Teacher", email: `zz-staff-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Staff Admin", email: `zz-staff-admin-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Staff Principal", email: `zz-staff-principal-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Staff Pupil", email: `zz-staff-pupil-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Staff Elsewhere", email: `zz-staff-other-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  teacherUserId = teacher.id;
  adminUserId = admin.id;
  principalUserId = principal.id;
  pupilUserId = pupil.id;

  const tm = await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  await db.membership.create({ data: { userId: admin.id, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principal.id, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSP${STAMP}` }, select: { id: true } });
  pupilMembershipId = pm.id;
  const otm = await db.membership.create({ data: { userId: otherTeacher.id, schoolId: otherSchoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });

  const klass = await db.class.create({ data: { schoolId, name: "ZZ Staff Class 4", gradeLevel: "4", joinCode: `ZS${tail}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } });
  const series = await db.examSeries.create({ data: { schoolId, name: "ZZ Staff Unit Test", gradeLevel: "4" }, select: { id: true } });
  const slot = await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } });
  slotId = slot.id;

  const otherClass = await db.class.create({ data: { schoolId: otherSchoolId, name: "ZZ Staff Other 4", gradeLevel: "4", joinCode: `ZT${tail}` }, select: { id: true } });
  otherClassId = otherClass.id;
  await db.classTeacher.create({ data: { classId: otherClassId, schoolId: otherSchoolId, teacherMembershipId: otm.id, role: "LEAD" } });
  const otherSeries = await db.examSeries.create({ data: { schoolId: otherSchoolId, name: "ZZ Staff Elsewhere", gradeLevel: "4" }, select: { id: true } });
  const otherSlot = await db.examSlot.create({ data: { schoolId: otherSchoolId, seriesId: otherSeries.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } });
  otherSlotId = otherSlot.id;
  const otherAssignment = await db.assignment.create({
    data: { schoolId: otherSchoolId, classId: otherClassId, authorMembershipId: otm.id, title: "ZZ Elsewhere draft" },
    select: { id: true },
  });
  otherAssignmentId = otherAssignment.id;
  const startsAt = new Date(Date.now() + 14 * 86_400_000);
  const otherMeeting = await db.meetingSlot.create({
    data: { schoolId: otherSchoolId, teacherMembershipId: otm.id, startsAt, endsAt: new Date(startsAt.getTime() + 15 * 60_000) },
    select: { id: true },
  });
  otherMeetingSlotId = otherMeeting.id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [teacherUserId, adminUserId, principalUserId, pupilUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("every handler answers 401 in the contract's envelope", async () => {
    __resetCookies();
    const plain: (() => Promise<Response>)[] = [
      () => todayGet(),
      () => attendanceClassesGet(get("/api/v1/staff/attendance/classes")),
      () => registerGet(get(`/api/v1/staff/attendance/register?classId=${classId}`)),
      () => classesGet(),
      () => classGet(get("/x"), params({ classId })),
      () => weightsPost(json("/x", {}), params({ classId })),
      () => assignmentsGet(get("/api/v1/staff/assignments")),
      () => assignmentsPost(json("/x", {})),
      () => publishPost(json("/x", {})),
      () => examsGet(),
      () => gridGet(get(`/api/v1/staff/exams/grid?classId=${classId}`)),
      () => sheetsGet(),
      () => timetableGet(get("/api/v1/staff/timetable")),
      () => practiceGet(get("/api/v1/staff/practice")),
      () => practicePost(json("/x", {})),
      () => practiceArchivePost(json("/x", {})),
      () => meetingsGet(),
      () => meetingsPost(json("/x", {})),
      () => cancelSlotPost(json("/x", {})),
      () => leaveGet(),
      () => leavePost(json("/x", {})),
      () => profileGet(),
      () => profilePost(json("/x", {})),
      () => expertsGet(get("/api/v1/staff/experts")),
      () => bookPost(json("/x", {})),
      () => overviewGet(get("/api/v1/staff/principal/overview")),
      () => principalClassesGet(get("/api/v1/staff/principal/classes")),
      () => principalTimetableGet(get("/api/v1/staff/principal/timetable")),
    ];
    for (const call of plain) {
      const res = await call();
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });
});

describe("today", () => {
  it("a form teacher sees their class in the register list; a pupil is refused", async () => {
    await asTeacher();
    const res = await todayGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schoolName).toBe(`ZZ Staff School ${STAMP}`);
    expect(body.formClasses.classes).toEqual([expect.objectContaining({ id: classId, students: 1, registerTaken: false })]);
    expect(body.formClasses.registersLeft).toBe(1);
    expect(body.lessons.items).toEqual([]);

    await asPupil();
    expect((await todayGet()).status).toBe(403);
  });
});

describe("attendance", () => {
  it("lists the classes I am down to mark, and refuses a bad date", async () => {
    await asTeacher();
    const res = await attendanceClassesGet(get("/api/v1/staff/attendance/classes"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classes).toEqual([expect.objectContaining({ id: classId, taken: false })]);
    expect(body.unmarkedCount).toBe(1);
    expect((await attendanceClassesGet(get("/api/v1/staff/attendance/classes?date=yesterday"))).status).toBe(422);
    await asPrincipal();
    expect((await attendanceClassesGet(get("/api/v1/staff/attendance/classes"))).status).toBe(403);
  });

  it("opens the register the way /api/attendance does, and another school's class is a 404", async () => {
    await asTeacher();
    const res = await registerGet(get(`/api/v1/staff/attendance/register?classId=${classId}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.class.id).toBe(classId);
    expect(body.roster).toEqual([expect.objectContaining({ membershipId: pupilMembershipId, status: null })]);
    expect(body.duty).toEqual({ reason: "CLASS_TEACHER", coverUntil: null });
    expect(body.readOnly).toBe(false);

    expect((await registerGet(get(`/api/v1/staff/attendance/register?classId=${otherClassId}`))).status).toBe(404);
    expect((await registerGet(get("/api/v1/staff/attendance/register"))).status).toBe(422);
    await asPupil();
    expect((await registerGet(get(`/api/v1/staff/attendance/register?classId=${classId}`))).status).toBe(403);
  });
});

describe("classes", () => {
  it("lists mine, opens one, and hides another school's", async () => {
    await asTeacher();
    const list = await classesGet();
    expect(list.status).toBe(200);
    expect((await list.json()).classes).toEqual([expect.objectContaining({ id: classId, students: 1, registerTaken: false })]);

    const detail = await classGet(get("/x"), params({ classId }));
    expect(detail.status).toBe(200);
    const body = await detail.json();
    expect(body.class.id).toBe(classId);
    expect(body.roster).toEqual([expect.objectContaining({ membershipId: pupilMembershipId, hasGuardian: false })]);
    expect(body.withoutGuardian).toBe(1);

    expect((await classGet(get("/x"), params({ classId: otherClassId }))).status).toBe(404);
    await asAdmin();
    expect((await classGet(get("/x"), params({ classId }))).status).toBe(200);
    await asPupil();
    expect((await classGet(get("/x"), params({ classId }))).status).toBe(403);
  });

  it("saves grade weights as percentages, twice to the same state; refuses a bad total and a bad body", async () => {
    await asTeacher();
    const body = { rows: [{ name: "Homework", percent: 40 }, { name: "Exam", percent: 60 }] };
    expect((await weightsPost(json("/x", body), params({ classId }))).status).toBe(200);
    expect((await weightsPost(json("/x", body), params({ classId }))).status).toBe(200);
    const rows = await db.gradeCategory.findMany({ where: { classId }, orderBy: { position: "asc" } });
    expect(rows.map((r) => [r.name, r.weightBps])).toEqual([["Homework", 4000], ["Exam", 6000]]);

    const short = await weightsPost(json("/x", { rows: [{ name: "Homework", percent: 90 }] }), params({ classId }));
    expect(short.status).toBe(403);
    expect((await short.json()).error).toContain("90");
    const bad = await weightsPost(json("/x", { rows: "no" }), params({ classId }));
    expect(bad.status).toBe(422);
    expect(await bad.json()).toMatchObject({ code: "BAD_REQUEST", issues: { rows: expect.any(String) } });
    expect((await weightsPost(json("/x", body), params({ classId: otherClassId }))).status).toBe(404);
  });
});

describe("assignments", () => {
  let draftId = "";

  it("creates a draft, lists it under the draft filter, and refuses another school's class", async () => {
    await asTeacher();
    const created = await assignmentsPost(json("/x", { classId, title: "ZZ Fractions sheet", body: "Q1–10", publish: false }));
    expect(created.status).toBe(200);
    draftId = (await created.json()).assignmentId;
    expect(draftId).toMatch(/^c/);

    const list = await assignmentsGet(get("/api/v1/staff/assignments?state=draft"));
    expect(list.status).toBe(200);
    const body = await list.json();
    expect(body.filters).toEqual({ classId: null, state: "draft" });
    expect(body.assignments).toEqual([expect.objectContaining({ id: draftId, publishedAt: null, class: expect.objectContaining({ id: classId }) })]);

    expect((await assignmentsPost(json("/x", { classId: otherClassId, title: "Elsewhere" }))).status).toBe(404);
    const bad = await assignmentsPost(json("/x", { classId, title: "x" }));
    expect(bad.status).toBe(422);
    expect(await bad.json()).toMatchObject({ issues: { title: expect.any(String) } });
    expect((await assignmentsGet(get("/api/v1/staff/assignments?state=nope"))).status).toBe(422);
    await asPupil();
    expect((await assignmentsPost(json("/x", { classId, title: "Pupil sets work" }))).status).toBe(403);
  });

  it("publishes the draft once; again is refused, and another school's draft is a 404", async () => {
    await asTeacher();
    expect((await publishPost(json("/x", { assignmentId: draftId }))).status).toBe(200);
    expect((await db.assignment.findUniqueOrThrow({ where: { id: draftId }, select: { publishedAt: true } })).publishedAt).not.toBeNull();
    expect((await publishPost(json("/x", { assignmentId: draftId }))).status).toBe(403);
    expect((await publishPost(json("/x", { assignmentId: otherAssignmentId }))).status).toBe(404);
    expect((await publishPost(json("/x", {}))).status).toBe(422);
  });
});

describe("exams", () => {
  it("lists the papers I may mark and opens the grid, first paper self-selected", async () => {
    await asTeacher();
    const exams = await examsGet();
    expect(exams.status).toBe(200);
    const body = await exams.json();
    expect(body.classes).toEqual([
      expect.objectContaining({ id: classId, series: [expect.objectContaining({ slots: [expect.objectContaining({ id: slotId, maxMarks: 50 })] })] }),
    ]);

    const grid = await gridGet(get(`/api/v1/staff/exams/grid?classId=${classId}`));
    expect(grid.status).toBe(200);
    const g = await grid.json();
    expect(g.slotId).toBe(slotId);
    expect(g.grid.pupils).toEqual([{ membershipId: pupilMembershipId, name: "ZZ Staff Pupil", marks: null }]);
    // The 40/60 weights from the classes suite include an "Exam" weight, so the marks count.
    expect(g.examUnweighted).toBe(false);
    await db.gradeCategory.updateMany({ where: { classId, name: "Exam" }, data: { name: "Project" } });
    expect((await (await gridGet(get(`/api/v1/staff/exams/grid?classId=${classId}`))).json()).examUnweighted).toBe(true);

    expect((await gridGet(get(`/api/v1/staff/exams/grid?classId=${classId}&slotId=${slotId}`))).status).toBe(200);
    expect((await gridGet(get(`/api/v1/staff/exams/grid?classId=${classId}&slotId=${otherSlotId}`))).status).toBe(404);
    expect((await gridGet(get(`/api/v1/staff/exams/grid?classId=${otherClassId}`))).status).toBe(404);
    expect((await gridGet(get("/api/v1/staff/exams/grid"))).status).toBe(422);
    await asPrincipal();
    expect((await gridGet(get(`/api/v1/staff/exams/grid?classId=${classId}`))).status).toBe(403);
  });

  it("the shared sheets view is for all staff, not pupils", async () => {
    await asTeacher();
    const res = await sheetsGet();
    expect(res.status).toBe(200);
    expect((await res.json()).classes).toEqual([{ id: classId, name: "ZZ Staff Class 4", publishedCards: 0 }]);
    await asPrincipal();
    expect((await sheetsGet()).status).toBe(200);
    await asPupil();
    expect((await sheetsGet()).status).toBe(403);
  });
});

describe("timetable", () => {
  it("the teacher's own week, anchored on a Monday; the office is refused here", async () => {
    await asTeacher();
    const res = await timetableGet(get("/api/v1/staff/timetable?week=2026-09-09"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.weekOf).toBe("2026-09-07");
    expect(body.isThisWeek).toBe(typeof body.today === "string" && body.today >= "2026-09-07" && body.today <= "2026-09-13");
    expect(body.grid.slots).toEqual([]);
    expect((await timetableGet(get("/api/v1/staff/timetable?week=soon"))).status).toBe(422);
    await asAdmin();
    expect((await timetableGet(get("/api/v1/staff/timetable"))).status).toBe(403);
  });
});

describe("practice", () => {
  it("shows the class's picture, sets and archives a chapter when the bank has one, and refuses strangers", async () => {
    await asTeacher();
    const res = await practiceGet(get("/api/v1/staff/practice"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.selectedClassId).toBe(classId);
    expect(body.heatmap.pupilCount).toBe(1);
    expect((await practiceGet(get(`/api/v1/staff/practice?classId=${otherClassId}`))).status).toBe(404);
    expect((await practicePost(json("/x", { classId, topicSlug: "", targetLevel: 1 }))).status).toBe(422);
    expect((await practiceArchivePost(json("/x", { id: "c" + "z".repeat(24) }))).status).toBe(404);

    const topic = await db.quizTopic.findFirst({ select: { slug: true } });
    if (topic) {
      const set = await practicePost(json("/x", { classId, topicSlug: topic.slug, targetLevel: 2, note: "ZZ revise", dueDate: futureKey(20) }));
      expect(set.status).toBe(200);
      const { id } = (await set.json()) as { id: string };
      expect((await practicePost(json("/x", { classId: otherClassId, topicSlug: topic.slug, targetLevel: 2 }))).status).toBe(404);
      expect((await practiceArchivePost(json("/x", { id }))).status).toBe(200);
      expect((await db.practiceAssignment.findUniqueOrThrow({ where: { id }, select: { archivedAt: true } })).archivedAt).not.toBeNull();
    }
    await asAdmin();
    expect((await practiceGet(get("/api/v1/staff/practice"))).status).toBe(403);
  });
});

describe("meetings", () => {
  it("offers a run, skips the exact duplicate, cancels one, and never touches another school's", async () => {
    await asTeacher();
    const body = { date: futureKey(14), time: "15:00", durationMinutes: 15, count: 2, location: "Room 4" };
    const first = await meetingsPost(json("/x", body));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ created: 2 });
    const again = await meetingsPost(json("/x", body));
    expect(await again.json()).toEqual({ created: 0 });

    const list = await meetingsGet();
    expect(list.status).toBe(200);
    const slots = (await list.json()).slots as { id: string; location: string | null; booking: unknown }[];
    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({ location: "Room 4", booking: null });

    expect((await cancelSlotPost(json("/x", { slotId: slots[0]!.id }))).status).toBe(200);
    expect(((await (await meetingsGet()).json()).slots as unknown[]).length).toBe(1);
    expect((await cancelSlotPost(json("/x", { slotId: otherMeetingSlotId }))).status).toBe(404);
    expect((await cancelSlotPost(json("/x", {}))).status).toBe(422);
    expect((await meetingsPost(json("/x", { date: "2026-13-40", time: "15:00" }))).status).toBe(422);
    await asAdmin();
    expect((await meetingsGet()).status).toBe(403);
  });
});

describe("leave", () => {
  it("shows the balance and requests, takes an application, and turns the lib's refusals into 422s", async () => {
    await asTeacher();
    const before = await leaveGet();
    expect(before.status).toBe(200);
    const b = await before.json();
    expect(b.requests).toEqual([]);
    expect(b.balance).toMatchObject({ used: 0, pending: 0 });
    // The principal is a colleague who could cover; the teacher is not their own nominee.
    expect(b.staff.map((s: { name: string }) => s.name)).toEqual(["ZZ Staff Principal"]);

    const from = futureKey(21);
    const applied = await leavePost(json("/x", { fromDateKey: from, toDateKey: from, kind: "CASUAL", reason: "ZZ family matter" }));
    expect(applied.status).toBe(200);
    const { id } = (await applied.json()) as { id: string };
    expect((await db.leaveRequest.findUniqueOrThrow({ where: { id }, select: { status: true } })).status).toBe("PENDING");

    const clash = await leavePost(json("/x", { fromDateKey: from, toDateKey: from, kind: "SICK", reason: "ZZ again" }));
    expect(clash.status).toBe(422);
    expect(await clash.json()).toMatchObject({ code: "BAD_REQUEST", error: expect.any(String) });
    expect((await leavePost(json("/x", { fromDateKey: from, toDateKey: from, kind: "HOLIDAY", reason: "ZZ" }))).status).toBe(422);

    const after = await leaveGet();
    expect((await after.json()).requests).toEqual([expect.objectContaining({ id, status: "PENDING", kind: "CASUAL" })]);

    await asPrincipal();
    expect((await leaveGet()).status).toBe(200);
    await asAdmin();
    expect((await leaveGet()).status).toBe(403);
    expect((await leavePost(json("/x", { fromDateKey: from, toDateKey: from, kind: "CASUAL", reason: "ZZ" }))).status).toBe(403);
  });
});

describe("profile", () => {
  it("reads the teacher's own page and saves the fields they may edit", async () => {
    await asTeacher();
    const res = await profileGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classes).toEqual([{ id: classId, name: "ZZ Staff Class 4" }]);
    expect(body.pupilsTaught).toBe(1);
    expect(body.user).toMatchObject({ name: "ZZ Staff Teacher", birthdateEditable: true });

    const avatarKey = AVATAR_PRESETS[0]!;
    const saved = await profilePost(json("/x", { preferredName: "Ms Z", bio: "ZZ bio", avatarKey, birthdate: "1990-04-12" }));
    expect(saved.status).toBe(200);
    expect((await (await profileGet()).json()).user).toMatchObject({ preferredName: "Ms Z", bio: "ZZ bio", avatarKey, birthdate: "1990-04-12" });

    const bad = await profilePost(json("/x", { preferredName: "", bio: "", avatarKey: "upload:not-a-preset" }));
    expect(bad.status).toBe(422);
    expect(await bad.json()).toMatchObject({ code: "BAD_REQUEST", issues: { avatarKey: expect.any(String) } });
    expect((await profilePost(json("/x", { bio: "" }))).status).toBe(422);
    await asPrincipal();
    expect((await profileGet()).status).toBe(403);
  });
});

describe("experts", () => {
  it("the marketplace is for teachers and the office; a slot that is not there is not booked", async () => {
    await asTeacher();
    const res = await expertsGet(get("/api/v1/staff/experts?offering=SESSIONS"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.experts)).toBe(true);
    expect(body.bookings).toEqual([]);
    expect((await expertsGet(get("/api/v1/staff/experts?offering=EVERYTHING"))).status).toBe(422);
    expect([403, 404]).toContain((await bookPost(json("/x", { slotId: "c" + "z".repeat(24), topic: "ZZ robotics" }))).status);
    expect((await bookPost(json("/x", { slotId: "c" + "z".repeat(24), topic: "no" }))).status).toBe(422);
    await asAdmin();
    expect((await expertsGet(get("/api/v1/staff/experts"))).status).toBe(200);
    await asPrincipal();
    expect((await expertsGet(get("/api/v1/staff/experts"))).status).toBe(403);
  });
});

describe("principal", () => {
  it("the dashboard, class insights and a class's week — for the head and the office, not a teacher", async () => {
    await asPrincipal();
    const overview = await overviewGet(get("/api/v1/staff/principal/overview?days=7"));
    expect(overview.status).toBe(200);
    const o = await overview.json();
    expect(o.span).toBe(7);
    expect(o.summary).toMatchObject({ pupils: 1, classes: 1, registersMissingToday: 1, pendingLeave: 1 });
    expect(o.classes).toEqual([expect.objectContaining({ classId, pupils: 1 })]);
    expect((await overviewGet(get("/api/v1/staff/principal/overview?days=12"))).status).toBe(422);

    const classes = await principalClassesGet(get("/api/v1/staff/principal/classes?sort=attendance&grade=4"));
    expect(classes.status).toBe(200);
    const c = await classes.json();
    expect(c).toMatchObject({ sort: "attendance", grades: ["4"], gradeFilter: "4" });
    expect(c.classes).toEqual([expect.objectContaining({ classId })]);

    const week = await principalTimetableGet(get(`/api/v1/staff/principal/timetable?classId=${classId}&week=2026-09-10`));
    expect(week.status).toBe(200);
    const w = await week.json();
    expect(w).toMatchObject({ weekOf: "2026-09-07", selectedClassId: classId, gaps: 0, unstaffed: 0 });
    expect(w.classes).toEqual([expect.objectContaining({ id: classId })]);
    expect((await principalTimetableGet(get(`/api/v1/staff/principal/timetable?classId=${otherClassId}`))).status).toBe(404);

    await asAdmin();
    expect((await overviewGet(get("/api/v1/staff/principal/overview"))).status).toBe(200);
    expect((await principalTimetableGet(get("/api/v1/staff/principal/timetable"))).status).toBe(200);
    await asTeacher();
    expect((await overviewGet(get("/api/v1/staff/principal/overview"))).status).toBe(403);
    expect((await principalClassesGet(get("/api/v1/staff/principal/classes"))).status).toBe(403);
    expect((await principalTimetableGet(get("/api/v1/staff/principal/timetable"))).status).toBe(403);
  });
});
