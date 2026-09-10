/**
 * The /api/v1/teaching handlers — the gradebook and its marks, handouts on a
 * new assignment, the report-card builder and writing to a family — invoked
 * directly with a primed session the way api-v1-staff.test.ts does: the happy
 * path with its body parsed by the contract, 401 signed out, 403 for the wrong
 * role, 404 for another school's id, 422 for a body that does not parse, and a
 * refusal per write.
 *
 * Everything created here is ZZ-prefixed and deleted in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  okSchema,
  teachingAssignmentCreatedSchema,
  teachingCardsGeneratedSchema,
  teachingCardsPublishedSchema,
  teachingCardsWithdrawnSchema,
  teachingGradebookSchema,
  teachingGradesSavedSchema,
  teachingRemarkPeopleSchema,
  teachingRemarkStartedSchema,
  teachingReportCardsSchema,
} from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as newAssignmentPost } from "@/app/api/v1/teaching/assignments/route";
import { GET as gradebookGet } from "@/app/api/v1/teaching/assignments/[assignmentId]/route";
import { POST as gradesPost } from "@/app/api/v1/teaching/assignments/[assignmentId]/grades/route";
import { GET as cardsGet } from "@/app/api/v1/teaching/classes/[classId]/report-cards/route";
import { POST as generatePost } from "@/app/api/v1/teaching/classes/[classId]/report-cards/generate/route";
import { POST as remarkPost } from "@/app/api/v1/teaching/classes/[classId]/report-cards/remark/route";
import { POST as publishPost } from "@/app/api/v1/teaching/classes/[classId]/report-cards/publish/route";
import { POST as withdrawPost } from "@/app/api/v1/teaching/classes/[classId]/report-cards/withdraw/route";
import { GET as remarksGet, POST as remarksPost } from "@/app/api/v1/teaching/remarks/route";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);

let schoolId = "";
let otherSchoolId = "";
let classId = "";
let assignmentId = "";
let otherAssignmentId = "";
let teacherUserId = "";
let teacherMembershipId = "";
let adminUserId = "";
let principalUserId = "";
let pupilUserId = "";
let pupilMembershipId = "";
let parentUserId = "";
let strangerMembershipId = "";
const fileId = `zz-teach-${STAMP}.pdf`;

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (body: unknown) =>
  new Request("http://localhost/x", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

async function as(userId: string, role: "TEACHER" | "ADMIN" | "PRINCIPAL" | "STUDENT" | "PARENT") {
  __resetCookies();
  await createSession(userId, { schoolId: role === "PARENT" ? null : schoolId, role });
}
const asTeacher = () => as(teacherUserId, "TEACHER");
const asAdmin = () => as(adminUserId, "ADMIN");
const asPrincipal = () => as(principalUserId, "PRINCIPAL");
const asPupil = () => as(pupilUserId, "STUDENT");
const asParent = () => as(parentUserId, "PARENT");

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Teaching School ${STAMP}`, slug: `zz-teaching-${STAMP}`, code: `ZG${tail}`, contactEmail: `zz-teaching-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const other = await db.school.create({
    data: { name: `ZZ Teaching Other ${STAMP}`, slug: `zz-teachingo-${STAMP}`, code: `ZH${tail}`, contactEmail: `zz-teachingo-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  otherSchoolId = other.id;

  const [teacher, admin, principal, pupil, parent, otherTeacher, stranger] = await Promise.all([
    db.user.create({ data: { name: "ZZ Teaching Teacher", email: `zz-teaching-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Teaching Admin", email: `zz-teaching-admin-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Teaching Principal", email: `zz-teaching-principal-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Teaching Pupil", email: `zz-teaching-pupil-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Teaching Parent", email: `zz-teaching-parent-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Teaching Elsewhere", email: `zz-teaching-other-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Teaching Stranger", email: `zz-teaching-stranger-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  teacherUserId = teacher.id;
  adminUserId = admin.id;
  principalUserId = principal.id;
  pupilUserId = pupil.id;
  parentUserId = parent.id;

  const tm = await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  teacherMembershipId = tm.id;
  await db.membership.create({ data: { userId: admin.id, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principal.id, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZGP${STAMP}` }, select: { id: true } });
  pupilMembershipId = pm.id;
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });
  const otm = await db.membership.create({ data: { userId: otherTeacher.id, schoolId: otherSchoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const sm = await db.membership.create({ data: { userId: stranger.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZGS${STAMP}` }, select: { id: true } });
  strangerMembershipId = sm.id;

  const klass = await db.class.create({ data: { schoolId, name: "ZZ Teaching Class 4", gradeLevel: "4", joinCode: `ZG${tail}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } });
  // A scheduled paper for the class's grade: the report-card builder's menu.
  const series = await db.examSeries.create({ data: { schoolId, name: "ZZ Teaching Unit Test", gradeLevel: "4" }, select: { id: true } });
  await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 } });

  const assignment = await db.assignment.create({
    data: { schoolId, classId, authorMembershipId: tm.id, title: "ZZ Teaching fractions", pointsMilli: 20_000, publishedAt: new Date() },
    select: { id: true },
  });
  assignmentId = assignment.id;
  await db.submission.create({ data: { schoolId, assignmentId, studentMembershipId: pm.id, body: "ZZ my working", status: "SUBMITTED", submittedAt: new Date() } });

  const otherClass = await db.class.create({ data: { schoolId: otherSchoolId, name: "ZZ Teaching Other 4", gradeLevel: "4", joinCode: `ZH${tail}` }, select: { id: true } });
  await db.classTeacher.create({ data: { classId: otherClass.id, schoolId: otherSchoolId, teacherMembershipId: otm.id, role: "LEAD" } });
  const otherAssignment = await db.assignment.create({ data: { schoolId: otherSchoolId, classId: otherClass.id, authorMembershipId: otm.id, title: "ZZ Elsewhere work" }, select: { id: true } });
  otherAssignmentId = otherAssignment.id;

  // A file the teacher uploaded from the phone and has not attached yet; no bytes are needed to attach it.
  await db.uploadTicket.create({ data: { userId: teacher.id, fileId, mime: "application/pdf", size: 1234 } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [teacherUserId, adminUserId, principalUserId, pupilUserId, parentUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("every handler answers 401 in the contract's envelope", async () => {
    __resetCookies();
    const calls: (() => Promise<Response>)[] = [
      () => newAssignmentPost(json({})),
      () => gradebookGet(get("/x"), params({ assignmentId })),
      () => gradesPost(json({}), params({ assignmentId })),
      () => cardsGet(get("/x"), params({ classId })),
      () => generatePost(json({}), params({ classId })),
      () => remarkPost(json({}), params({ classId })),
      () => publishPost(json({}), params({ classId })),
      () => withdrawPost(json({}), params({ classId })),
      () => remarksGet(),
      () => remarksPost(json({})),
    ];
    for (const call of calls) {
      const res = await call();
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });
});

describe("the gradebook", () => {
  it("shows the roll with the work handed in; a pupil is refused, another school's assignment is not found", async () => {
    await asTeacher();
    const res = await gradebookGet(get("/x"), params({ assignmentId }));
    expect(res.status).toBe(200);
    const body = teachingGradebookSchema.parse(await res.json());
    expect(body.assignment).toMatchObject({ id: assignmentId, title: "ZZ Teaching fractions", classId, pointsMilli: 20_000 });
    expect(body.rows).toEqual([expect.objectContaining({ membershipId: pupilMembershipId, work: { body: "ZZ my working", attachments: [] }, scoreMilli: null })]);
    expect(body.stats).toMatchObject({ total: 1, submitted: 1, graded: 0 });

    await asAdmin();
    expect((await gradebookGet(get("/x"), params({ assignmentId }))).status).toBe(200);
    await asTeacher();
    expect((await gradebookGet(get("/x"), params({ assignmentId: otherAssignmentId }))).status).toBe(404);
    await asPupil();
    expect((await gradebookGet(get("/x"), params({ assignmentId }))).status).toBe(403);
  });

  it("saves a mark and a comment, and a replay of the same batch leaves one grade", async () => {
    await asTeacher();
    const batch = { grades: [{ studentMembershipId: pupilMembershipId, score: 17.5, comment: "ZZ good steps" }] };
    const res = await gradesPost(json(batch), params({ assignmentId }));
    expect(res.status).toBe(200);
    expect(teachingGradesSavedSchema.parse(await res.json())).toEqual({ saved: 1, cleared: 0, rejected: 0 });
    const replay = await gradesPost(json(batch), params({ assignmentId }));
    expect(teachingGradesSavedSchema.parse(await replay.json())).toEqual({ saved: 1, cleared: 0, rejected: 0 });
    const grades = await db.grade.findMany({ where: { assignmentId } });
    expect(grades).toHaveLength(1);
    expect(grades[0]).toMatchObject({ scoreMilli: 17_500, comment: "ZZ good steps" });
    const book = teachingGradebookSchema.parse(await (await gradebookGet(get("/x"), params({ assignmentId }))).json());
    expect(book.rows[0]).toMatchObject({ scoreMilli: 17_500, comment: "ZZ good steps" });
  });

  it("refuses a pupil not on the roll, a body that does not parse, the wrong role and another school's assignment", async () => {
    await asTeacher();
    const stranger = await gradesPost(json({ grades: [{ studentMembershipId: strangerMembershipId, score: 3 }] }), params({ assignmentId }));
    expect(teachingGradesSavedSchema.parse(await stranger.json())).toEqual({ saved: 0, cleared: 0, rejected: 1 });
    expect((await gradesPost(json({ grades: [] }), params({ assignmentId }))).status).toBe(422);
    expect((await gradesPost(json("not json"), params({ assignmentId }))).status).toBe(422);
    expect((await gradesPost(json({ grades: [{ studentMembershipId: pupilMembershipId, score: 3 }] }), params({ assignmentId: otherAssignmentId }))).status).toBe(404);
    await asPupil();
    expect((await gradesPost(json({ grades: [{ studentMembershipId: pupilMembershipId, score: 20 }] }), params({ assignmentId }))).status).toBe(403);
  });

  it("clears a mark when the score is null", async () => {
    await asTeacher();
    const res = await gradesPost(json({ grades: [{ studentMembershipId: pupilMembershipId, score: null }] }), params({ assignmentId }));
    expect(teachingGradesSavedSchema.parse(await res.json())).toEqual({ saved: 0, cleared: 1, rejected: 0 });
    expect(await db.grade.count({ where: { assignmentId } })).toBe(0);
  });
});

describe("a new assignment with handouts", () => {
  it("attaches a file this teacher uploaded, with the ticket's type and size, and spends the ticket", async () => {
    await asTeacher();
    const res = await newAssignmentPost(json({ classId, title: "ZZ Teaching handout work", body: "", publish: false, handouts: [{ fileId, name: "ZZ sheet.pdf" }] }));
    expect(res.status).toBe(201);
    const body = teachingAssignmentCreatedSchema.parse(await res.json());
    expect(body).toMatchObject({ notified: 0, handouts: 1 });
    const created = await db.assignment.findUniqueOrThrow({ where: { id: body.assignmentId }, select: { attachments: true, publishedAt: true, classId: true } });
    expect(created.classId).toBe(classId);
    expect(created.publishedAt).toBeNull();
    expect(JSON.parse(created.attachments)).toEqual([{ fileId, name: "ZZ sheet.pdf", size: 1234, mime: "application/pdf" }]);
    expect((await db.uploadTicket.findUniqueOrThrow({ where: { fileId } })).consumedAt).not.toBeNull();
  });

  it("refuses a spent ticket, a file nobody gave this person, a bad body and the wrong role", async () => {
    await asTeacher();
    const again = await newAssignmentPost(json({ classId, title: "ZZ Teaching twice", publish: false, handouts: [{ fileId, name: "ZZ sheet.pdf" }] }));
    expect(again.status).toBe(404);
    const unknown = await newAssignmentPost(json({ classId, title: "ZZ Teaching unknown", publish: false, handouts: [{ fileId: `zz-nobody-${STAMP}`, name: "x.pdf" }] }));
    expect(unknown.status).toBe(404);
    expect(await db.assignment.count({ where: { classId, title: { in: ["ZZ Teaching twice", "ZZ Teaching unknown"] } } })).toBe(0);
    expect((await newAssignmentPost(json({ classId, title: "Z" }))).status).toBe(422);
    await asPupil();
    expect((await newAssignmentPost(json({ classId, title: "ZZ Teaching pupil", publish: false }))).status).toBe(403);
  });
});

describe("the report-card builder", () => {
  let sittingId = "";
  let cardId = "";

  it("shows the class teacher the class's papers; a principal who is not its LEAD gets the page's 404", async () => {
    await asTeacher();
    const res = await cardsGet(get(`/api/v1/teaching/classes/${classId}/report-cards`), params({ classId }));
    expect(res.status).toBe(200);
    const body = teachingReportCardsSchema.parse(await res.json());
    expect(body.class).toMatchObject({ id: classId, name: "ZZ Teaching Class 4" });
    expect(body.assessments).toEqual([expect.objectContaining({ subject: "Mathematics", seriesName: "ZZ Teaching Unit Test", seriesKind: "UNIT_TEST", gradedCount: 0, classSize: 1 })]);
    expect(body.titles).toEqual([]);
    expect(body.cards).toEqual([]);
    sittingId = body.assessments[0]!.assignmentId;

    await asPrincipal();
    expect((await cardsGet(get("/x"), params({ classId }))).status).toBe(404);
    await asPupil();
    expect((await cardsGet(get("/x"), params({ classId }))).status).toBe(403);
  });

  it("generates the drafts, takes a remark, publishes and withdraws the set", async () => {
    await asTeacher();
    const gen = await generatePost(json({ title: "ZZ Term 1", assignmentIds: [sittingId] }), params({ classId }));
    expect(gen.status).toBe(200);
    expect(teachingCardsGeneratedSchema.parse(await gen.json())).toEqual({ created: 1, updated: 0, skippedPublished: 0 });

    const after = teachingReportCardsSchema.parse(await (await cardsGet(get("/x?title=ZZ%20Term%201"), params({ classId }))).json());
    expect(after.selectedTitle).toBe("ZZ Term 1");
    expect(after.cards).toEqual([expect.objectContaining({ title: "ZZ Term 1", status: "DRAFT", studentName: "ZZ Teaching Pupil", remark: null })]);
    cardId = after.cards[0]!.id;

    const remark = await remarkPost(json({ cardId, remark: "ZZ A steady term." }), params({ classId }));
    expect(remark.status).toBe(200);
    expect(okSchema.parse(await remark.json())).toEqual({ ok: true });
    expect((await db.reportCard.findUniqueOrThrow({ where: { id: cardId } })).remark).toBe("ZZ A steady term.");

    const pub = await publishPost(json({ title: "ZZ Term 1" }), params({ classId }));
    expect(pub.status).toBe(200);
    expect(teachingCardsPublishedSchema.parse(await pub.json())).toEqual({ published: 1 });

    const wd = await withdrawPost(json({ title: "ZZ Term 1" }), params({ classId }));
    expect(wd.status).toBe(200);
    expect(teachingCardsWithdrawnSchema.parse(await wd.json())).toEqual({ withdrawn: 1 });
    expect((await db.reportCard.findUniqueOrThrow({ where: { id: cardId } })).status).toBe("DRAFT");
  });

  it("refuses each write in the lib's own words, a bad body, and anybody but the class teacher", async () => {
    await asTeacher();
    // Nothing published under the title now: withdrawing again is refused, not a silent zero.
    const wd = await withdrawPost(json({ title: "ZZ Term 1" }), params({ classId }));
    expect(wd.status).toBe(422);
    expect((await wd.json()).error).toEqual(expect.any(String));
    // A published card's remark is locked.
    await publishPost(json({ title: "ZZ Term 1" }), params({ classId }));
    expect((await remarkPost(json({ cardId, remark: "ZZ too late" }), params({ classId }))).status).toBe(422);
    // Every draft already out: publishing again has nothing to send.
    expect((await publishPost(json({ title: "ZZ Term 1" }), params({ classId }))).status).toBe(422);
    // A paper from nowhere puts nothing on a card.
    expect((await generatePost(json({ title: "ZZ Term 2", assignmentIds: [otherAssignmentId] }), params({ classId }))).status).toBe(422);
    expect((await generatePost(json({ title: "Z", assignmentIds: [] }), params({ classId }))).status).toBe(422);
    expect((await remarkPost(json({ cardId: otherAssignmentId, remark: "x" }), params({ classId }))).status).toBe(404);
    await asPrincipal();
    expect((await generatePost(json({ title: "ZZ Term 1", assignmentIds: [sittingId] }), params({ classId }))).status).toBe(403);
    await asPupil();
    expect((await publishPost(json({ title: "ZZ Term 1" }), params({ classId }))).status).toBe(403);
  });
});

describe("writing to a family about a pupil", () => {
  it("lists a teacher's pupils, a guardian's child with their teachers, and a pupil's own teachers; the office is refused", async () => {
    await asTeacher();
    const teacher = teachingRemarkPeopleSchema.parse(await (await remarksGet()).json());
    expect(teacher).toMatchObject({ role: "TEACHER", pupils: [] });
    expect(teacher.students).toEqual([expect.objectContaining({ membershipId: pupilMembershipId, className: "ZZ Teaching Class 4", guardianCount: 1 })]);

    await asParent();
    const parent = teachingRemarkPeopleSchema.parse(await (await remarksGet()).json());
    expect(parent).toMatchObject({ role: "PARENT", selfOnly: false, students: [] });
    expect(parent.pupils).toEqual([expect.objectContaining({ membershipId: pupilMembershipId, name: "ZZ Teaching Pupil", teachers: [expect.objectContaining({ membershipId: teacherMembershipId, lead: true })] })]);

    await asPupil();
    const pupil = teachingRemarkPeopleSchema.parse(await (await remarksGet()).json());
    expect(pupil).toMatchObject({ role: "STUDENT", selfOnly: true });
    expect(pupil.pupils[0]!.teachers.map((x) => x.membershipId)).toEqual([teacherMembershipId]);

    await asAdmin();
    expect((await remarksGet()).status).toBe(403);
  });

  it("a teacher starts a thread about their pupil; another school's pupil, a bad body and the office are refused", async () => {
    await asTeacher();
    const res = await remarksPost(json({ studentMembershipId: pupilMembershipId, subject: "ZZ A quick update", body: "ZZ Lovely work today." }));
    expect(res.status).toBe(201);
    const { threadId } = teachingRemarkStartedSchema.parse(await res.json());
    const thread = await db.remarkThread.findUniqueOrThrow({ where: { id: threadId }, select: { schoolId: true, studentMembershipId: true, teacherMembershipId: true, subject: true } });
    expect(thread).toEqual({ schoolId, studentMembershipId: pupilMembershipId, teacherMembershipId, subject: "ZZ A quick update" });

    const elsewhere = await remarksPost(json({ studentMembershipId: strangerMembershipId, subject: "ZZ Hello", body: "ZZ x" }));
    expect([403, 404]).toContain(elsewhere.status);
    expect((await remarksPost(json({ studentMembershipId: pupilMembershipId, subject: "Z", body: "" }))).status).toBe(422);
    await asAdmin();
    expect((await remarksPost(json({ studentMembershipId: pupilMembershipId, subject: "ZZ Hello", body: "ZZ x" }))).status).toBe(403);
  });

  it("a guardian writes to their child's teacher", async () => {
    await asParent();
    const res = await remarksPost(json({ studentMembershipId: pupilMembershipId, teacherMembershipId, subject: "ZZ A question", body: "ZZ About the homework." }));
    expect(res.status).toBe(201);
    teachingRemarkStartedSchema.parse(await res.json());
  });
});
