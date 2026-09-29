/**
 * The configurable report card through its handlers: the office's rules
 * (scale, co-scholastic areas, exam-kind weights, term weights, layout), a
 * term card built from the term's own papers with each subject weighted by
 * exam kind and banded on the scale, the class teacher's co-scholastic
 * grades kept through a regeneration and locked by publishing, the family's
 * read with the snapshot, the annual card combining terms by their shares,
 * and the PDF of one card and of the whole set.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as configGet, POST as configPost } from "@/app/api/v1/office/report-card-config/route";
import { POST as weightPost } from "@/app/api/v1/office/terms/[termId]/weight/route";
import { POST as generatePost } from "@/app/api/v1/teaching/classes/[classId]/report-cards/generate/route";
import { POST as coScholasticPost } from "@/app/api/v1/teaching/classes/[classId]/report-cards/co-scholastic/route";
import { POST as publishPost } from "@/app/api/v1/teaching/classes/[classId]/report-cards/publish/route";
import { GET as builderGet } from "@/app/api/v1/teaching/classes/[classId]/report-cards/route";
import { GET as familyCardGet } from "@/app/api/v1/family/report-cards/[cardId]/route";
import { GET as cardPdfGet } from "@/app/api/v1/shared/report-cards/[cardId]/pdf/route";
import { GET as bundlePdfGet } from "@/app/api/v1/teaching/classes/[classId]/report-cards/pdf/route";
import { REPORT_CARD_PRESETS, DEFAULT_REPORT_CARD_CONFIG } from "@/lib/report-card-rules";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let parentUserId = "";
let strangerUserId = "";
let teacherMembershipId = "";
let classId = "";
let pupilA = "";
let pupilB = "";
let yearId = "";
let term1 = "";
let term2 = "";
let adminMembershipId = "";
const paperIds: Record<string, string> = {};

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER" | "PARENT" | "STRANGER" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "OTHER") await createSession(otherTeacherUserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "STRANGER") await createSession(strangerUserId, { schoolId: null, role: "PARENT" });
}

async function paper(seriesId: string, subject: string, max: number, dateKey: string, position: number) {
  const slot = await db.examSlot.create({ data: { schoolId, seriesId, subject, dateKey, pointsMilli: max * 1000, position }, select: { id: true } });
  const a = await db.assignment.create({ data: { schoolId, classId, authorMembershipId: adminMembershipId, title: `${subject} paper`, category: "Exam", pointsMilli: max * 1000, examSlotId: slot.id, publishedAt: new Date(), dueAt: new Date(`${dateKey}T10:00:00Z`) }, select: { id: true } });
  return a.id;
}
async function mark(assignmentId: string, studentMembershipId: string, marks: number | null) {
  if (marks === null) return;
  await db.grade.create({ data: { schoolId, assignmentId, studentMembershipId, scoreMilli: marks * 1000, gradedByMembershipId: teacherMembershipId } });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Cards School ${STAMP}`, slug: `zz-cards-${STAMP}`, code: `ZC${suffix}`, contactEmail: `zz-cards-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", addressLine: "12 Lake Road", city: "Pune", brandPrimary: "#1e4fa3" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Cards ${who}`, email: `zz-cards-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, other, parent, stranger, a, b] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Other Teacher"), mk("Parent"), mk("Stranger"), mk("Asha Pupil"), mk("Bhavesh Pupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  otherTeacherUserId = other.id;
  parentUserId = parent.id;
  strangerUserId = stranger.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  teacherMembershipId = (await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: otherTeacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  pupilA = (await db.membership.create({ data: { userId: a.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZCA${STAMP}` }, select: { id: true } })).id;
  pupilB = (await db.membership.create({ data: { userId: b.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZCB${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilA, studentSchoolId: schoolId, status: "ACTIVE" } });
  classId = (await db.class.create({ data: { schoolId, name: "ZZ 7A", gradeLevel: "7", joinCode: `ZC1${suffix}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { schoolId, classId, teacherMembershipId, role: "LEAD" } });
  await db.enrollment.createMany({ data: [{ schoolId, classId, studentMembershipId: pupilA, status: "ACTIVE" }, { schoolId, classId, studentMembershipId: pupilB, status: "ACTIVE" }] });
  yearId = (await db.academicYear.create({ data: { schoolId, name: `ZZ 2026–27 ${suffix}`, startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  term1 = (await db.term.create({ data: { schoolId, academicYearId: yearId, name: `ZZ Term 1 ${suffix}`, startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2026-10-31T00:00:00Z"), position: 1 }, select: { id: true } })).id;
  term2 = (await db.term.create({ data: { schoolId, academicYearId: yearId, name: `ZZ Term 2 ${suffix}`, startDate: new Date("2026-11-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), position: 2 }, select: { id: true } })).id;
  const ut = await db.examSeries.create({ data: { schoolId, name: "ZZ Unit test 1", gradeLevel: "7", kind: "UNIT_TEST", termId: term1, publishedAt: new Date(), createdByMembershipId: adminMembershipId }, select: { id: true } });
  const mid = await db.examSeries.create({ data: { schoolId, name: "ZZ Mid-term", gradeLevel: "7", kind: "MID_TERM", termId: term1, publishedAt: new Date(), createdByMembershipId: adminMembershipId }, select: { id: true } });
  paperIds.utMaths = await paper(ut.id, "Mathematics", 25, "2026-07-20", 1);
  paperIds.utEnglish = await paper(ut.id, "English", 25, "2026-07-21", 2);
  paperIds.midMaths = await paper(mid.id, "Mathematics", 80, "2026-09-20", 1);
  paperIds.midEnglish = await paper(mid.id, "English", 80, "2026-09-21", 2);
  // Asha: maths 20/25 and 60/80 → 80 % and 75 % → 20:30 → 77 %; English 25/25 and 80/80 → 100 %.
  await mark(paperIds.utMaths, pupilA, 20);
  await mark(paperIds.midMaths, pupilA, 60);
  await mark(paperIds.utEnglish, pupilA, 25);
  await mark(paperIds.midEnglish, pupilA, 80);
  // Bhavesh: only the unit tests marked; the mid-term not sat.
  await mark(paperIds.utMaths, pupilB, 10);
  await mark(paperIds.utEnglish, pupilB, 12);
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, teacherUserId, otherTeacherUserId, parentUserId, strangerUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the rules", () => {
  it("401 signed out; a teacher and a guardian refused; the office reads the defaults with the presets and the year's terms, saves a board's scale and areas, and sets a term's share", async () => {
    await as(null);
    expect((await configGet()).status).toBe(401);
    await as("TEACHER");
    expect((await configGet()).status).toBe(403);
    await as("PARENT");
    expect((await configGet()).status).toBe(403);
    await as("ADMIN");
    let res = await configGet();
    expect(res.status).toBe(200);
    const view = await res.json();
    expect(view.preset).toBe("cbse8");
    expect(view.bands).toHaveLength(8);
    expect(view.presets.map((p: { key: string }) => p.key)).toEqual(["cbse8", "mh5", "percent"]);
    expect(view.terms.map((t: { weightPercent: number | null }) => t.weightPercent)).toEqual([null, null]);

    const mh5 = REPORT_CARD_PRESETS[1]!;
    const body = { ...DEFAULT_REPORT_CARD_CONFIG, preset: "mh5", bands: mh5.bands, coScholastic: { areas: ["Discipline", "Art", " Discipline "], scale: [{ label: "A", descriptor: "Outstanding" }, { label: "B", descriptor: null }] }, layout: { ...DEFAULT_REPORT_CARD_CONFIG.layout, headerNote: "Affiliation 12345", signatureLeft: " ", paper: "LETTER" as const } };
    res = await configPost(json("/api/v1/office/report-card-config", body));
    expect(res.status).toBe(200);
    const saved = await res.json();
    expect(saved.preset).toBe("mh5");
    expect(saved.coScholastic.areas).toEqual(["Discipline", "Art"]);
    expect(saved.layout.signatureLeft).toBe("Class teacher");
    expect(saved.layout.paper).toBe("LETTER");
    expect((await configPost(json("/api/v1/office/report-card-config", { preset: "x" }))).status).toBe(422);

    res = await weightPost(json(`/api/v1/office/terms/${term1}/weight`, { weightPercent: 40 }), params({ termId: term1 }));
    expect(await res.json()).toEqual({ weightPercent: 40 });
    await weightPost(json(`/api/v1/office/terms/${term2}/weight`, { weightPercent: 60 }), params({ termId: term2 }));
    expect((await weightPost(json(`/api/v1/office/terms/${term1}/weight`, { weightPercent: 140 }), params({ termId: term1 }))).status).toBe(422);
    await as("TEACHER");
    expect((await weightPost(json(`/api/v1/office/terms/${term1}/weight`, { weightPercent: 50 }), params({ termId: term1 }))).status).toBe(403);
    // The head reads the rules and the weights; the document that shapes every card is the admin's to write.
    await as("PRINCIPAL");
    expect((await configGet()).status).toBe(200);
    expect((await configPost(json("/api/v1/office/report-card-config", body))).status).toBe(403);
    expect((await weightPost(json(`/api/v1/office/terms/${term1}/weight`, { weightPercent: 50 }), params({ termId: term1 }))).status).toBe(403);
    await as("ADMIN");
    const again = await (await configGet()).json();
    expect(again.terms.map((t: { weightPercent: number | null }) => t.weightPercent)).toEqual([40, 60]);
    const rows = await db.auditLog.findMany({ where: { schoolId, action: { in: ["reportCard.config", "reportCard.termWeight"] } }, select: { action: true } });
    expect(rows.map((r) => r.action).sort()).toEqual(["reportCard.config", "reportCard.termWeight", "reportCard.termWeight"]);
  });
});

describe("⚠ an annual card over terms whose shares are half set", () => {
  it("is refused with the sentence, and makes no card; with every share set it is not", async () => {
    await db.term.update({ where: { id: term2 }, data: { weightPercent: null } });
    try {
      await as("TEACHER");
      const res = await generatePost(json(`/api/v1/teaching/classes/${classId}/report-cards/generate`, { title: "ZZ Half set", assignmentIds: [], academicYearId: yearId }), params({ classId }));
      expect(res.status).toBe(422);
      expect((await res.json()).error).toMatch(/^Give every term its share of the year, or none of them/);
      expect(await db.reportCard.count({ where: { classId, termId: null, academicYearId: yearId } })).toBe(0);
    } finally {
      await db.term.update({ where: { id: term2 }, data: { weightPercent: 60 } });
    }
  });
});

describe("a term card", () => {
  let cardA = "";
  let cardB = "";
  it("is built from the term's own papers: each subject weighted by exam kind and banded, an unsat paper left out, the overall the mean of subjects", async () => {
    await as("TEACHER");
    const res = await generatePost(json(`/api/v1/teaching/classes/${classId}/report-cards/generate`, { title: "ignored", assignmentIds: [], termId: term1 }), params({ classId }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ created: 2, updated: 0, skippedPublished: 0 });
    const builder = await (await builderGet(get(`/api/v1/teaching/classes/${classId}/report-cards`), params({ classId }))).json();
    expect(builder.academicYear.id).toBe(yearId);
    expect(builder.coScholastic.areas).toEqual(["Discipline", "Art"]);
    const a = builder.cards.find((c: { studentName: string }) => c.studentName.includes("Asha"));
    const b = builder.cards.find((c: { studentName: string }) => c.studentName.includes("Bhavesh"));
    cardA = a.id;
    cardB = b.id;
    expect(a.overallLetter).toBe("A");
    const rowA = await db.reportCard.findUniqueOrThrow({ where: { id: cardA }, select: { subjects: true, overallPercentMilli: true, gradingMethod: true, academicYearId: true, termId: true, scale: true, layout: true, items: { select: { subject: true, letter: true, kind: true } } } });
    const subjects = JSON.parse(rowA.subjects!) as { subject: string; percent: number; letter: string; parts: { weight: number | null }[] }[];
    expect(subjects.map((s) => [s.subject, s.percent, s.letter])).toEqual([["Mathematics", 77, "A"], ["English", 100, "A"]]);
    expect(subjects[0]!.parts.map((p) => p.weight)).toEqual([40, 60]);
    expect(rowA.overallPercentMilli).toBe(88_500);
    expect(rowA.gradingMethod).toBe("weighted");
    expect(rowA.academicYearId).toBe(yearId);
    expect(rowA.termId).toBe(term1);
    expect(JSON.parse(rowA.scale!).bands).toHaveLength(5);
    expect(JSON.parse(rowA.layout!).paper).toBe("LETTER");
    expect(rowA.items.map((i) => [i.subject, i.letter, i.kind])).toEqual([["Mathematics", "A", "SCHOLASTIC"], ["English", "A", "SCHOLASTIC"], ["Mathematics", "A", "SCHOLASTIC"], ["English", "A", "SCHOLASTIC"]]);
    // Bhavesh: only the unit tests count; 10/25 = 40 % (D) and 12/25 = 48 % (C); overall 44 %.
    const rowB = await db.reportCard.findUniqueOrThrow({ where: { id: cardB }, select: { subjects: true, overallPercentMilli: true, overallLetter: true } });
    const sB = JSON.parse(rowB.subjects!) as { percent: number; letter: string; parts: { percent: number | null; weight: number | null }[] }[];
    expect(sB.map((s) => [s.percent, s.letter])).toEqual([[40, "D"], [48, "C"]]);
    expect(sB[0]!.parts.map((p) => p.weight)).toEqual([100, null]);
    expect(rowB.overallLetter).toBe("D");
  });

  it("takes the class teacher's co-scholastic grades, refuses an unknown area or grade and another teacher, keeps them through a regeneration, and locks them on publishing", async () => {
    await as("TEACHER");
    const post = (body: unknown) => coScholasticPost(json(`/api/v1/teaching/classes/${classId}/report-cards/co-scholastic`, body));
    expect((await post({ cardId: cardA, grades: [{ area: "Sport", grade: "A" }] })).status).toBe(403);
    expect((await post({ cardId: cardA, grades: [{ area: "Discipline", grade: "Z" }] })).status).toBe(403);
    let res = await post({ cardId: cardA, grades: [{ area: "discipline", grade: "a", note: "Punctual" }, { area: "Art", grade: null }] });
    expect(res.status).toBe(200);
    await as("OTHER");
    expect((await post({ cardId: cardA, grades: [{ area: "Art", grade: "B" }] })).status).toBe(403);
    await as("TEACHER");
    res = await generatePost(json(`/api/v1/teaching/classes/${classId}/report-cards/generate`, { title: "ignored", assignmentIds: [], termId: term1 }), params({ classId }));
    expect(await res.json()).toEqual({ created: 0, updated: 2, skippedPublished: 0 });
    const builder = await (await builderGet(get(`/api/v1/teaching/classes/${classId}/report-cards`), params({ classId }))).json();
    const a = builder.cards.find((c: { id: string }) => c.id === cardA);
    expect(a.coScholastic).toEqual([{ area: "Discipline", grade: "A", note: "Punctual" }, { area: "Art", grade: null, note: null }]);
    const termName = (await db.term.findUniqueOrThrow({ where: { id: term1 }, select: { name: true } })).name;
    res = await publishPost(json(`/api/v1/teaching/classes/${classId}/report-cards/publish`, { title: termName }), params({ classId }));
    expect(await res.json()).toEqual({ published: 2 });
    expect((await post({ cardId: cardA, grades: [{ area: "Art", grade: "B" }] })).status).toBe(403);
    const audit = await db.auditLog.findMany({ where: { schoolId, action: "reportCard.coScholastic" }, select: { meta: true } });
    expect(audit).toHaveLength(1);
    expect(audit[0]!.meta.includes("Punctual")).toBe(false);
  });

  it("the guardian reads the card with its subjects, grades, co-scholastic rows, scale and layout, and downloads the PDF; a stranger gets 404; the teacher downloads the whole set", async () => {
    await as("PARENT");
    let res: Response = await familyCardGet(get(`/api/v1/family/report-cards/${cardA}`), params({ cardId: cardA }));
    expect(res.status).toBe(200);
    const card = await res.json();
    expect(card.subjects.map((s: { subject: string; letter: string }) => [s.subject, s.letter])).toEqual([["Mathematics", "A"], ["English", "A"]]);
    expect(card.overallLetter).toBe("A");
    expect(card.gradePoints).toBeNull();
    expect(card.coScholastic).toEqual([{ area: "Discipline", grade: "A", note: "Punctual" }, { area: "Art", grade: null, note: null }]);
    expect(card.scale.bands[0].label).toBe("A");
    expect(card.layout.headerNote).toBe("Affiliation 12345");
    expect(card.scope).toBe("TERM");
    expect(card.school.city).toBe("Pune");
    expect(card.items[0]).toMatchObject({ subject: "Mathematics", letter: "A" });

    res = await cardPdfGet(get(`/api/v1/shared/report-cards/${cardA}/pdf`), params({ cardId: cardA }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    const bytes = Buffer.from(await res.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(5_000);
    await as("STRANGER");
    expect((await cardPdfGet(get(`/api/v1/shared/report-cards/${cardA}/pdf`), params({ cardId: cardA }))).status).toBe(404);
    await as("TEACHER");
    const termName = (await db.term.findUniqueOrThrow({ where: { id: term1 }, select: { name: true } })).name;
    res = await bundlePdfGet(get(`/api/v1/teaching/classes/${classId}/report-cards/pdf?title=${encodeURIComponent(termName)}`), params({ classId }));
    expect(res.status).toBe(200);
    const bundle = Buffer.from(await res.arrayBuffer());
    expect(bundle.subarray(0, 5).toString()).toBe("%PDF-");
    expect((bundle.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBe(2);
    expect((await bundlePdfGet(get(`/api/v1/teaching/classes/${classId}/report-cards/pdf?title=Nothing`), params({ classId }))).status).toBe(404);
    await as("PARENT");
    expect((await bundlePdfGet(get(`/api/v1/teaching/classes/${classId}/report-cards/pdf?title=${encodeURIComponent(termName)}`), params({ classId }))).status).toBe(403);
  });

  it("the annual card combines each subject's terms by the terms' shares, and a term with no papers refuses", async () => {
    await as("TEACHER");
    expect((await generatePost(json(`/api/v1/teaching/classes/${classId}/report-cards/generate`, { title: "x", assignmentIds: [], termId: term2 }), params({ classId }))).status).toBe(422);
    const fin = await db.examSeries.create({ data: { schoolId, name: "ZZ Final", gradeLevel: "7", kind: "FINAL", termId: term2, publishedAt: new Date(), createdByMembershipId: adminMembershipId }, select: { id: true } });
    const finMaths = await paper(fin.id, "Mathematics", 100, "2027-03-10", 1);
    await mark(finMaths, pupilA, 50);
    const res = await generatePost(json(`/api/v1/teaching/classes/${classId}/report-cards/generate`, { title: "ZZ Annual", assignmentIds: [], academicYearId: yearId }), params({ classId }));
    expect(res.status).toBe(200);
    const row = await db.reportCard.findFirstOrThrow({ where: { classId, studentMembershipId: pupilA, title: "ZZ Annual" }, select: { subjects: true, termId: true, academicYearId: true, fromDateKey: true, toDateKey: true, overallPercentMilli: true } });
    const subjects = JSON.parse(row.subjects!) as { subject: string; percent: number; parts: { kind: string; percent: number | null; weight: number | null }[] }[];
    // Mathematics: term 1 77 %, term 2 50 %; shares 40:60 → 60.8 %. English: term 1 only → 100 %.
    expect(subjects.map((s) => [s.subject, s.percent])).toEqual([["Mathematics", 60.8], ["English", 100]]);
    expect(subjects[0]!.parts.map((p) => [p.kind, p.percent, p.weight])).toEqual([["TERM", 77, 40], ["TERM", 50, 60]]);
    expect(subjects[1]!.parts.map((p) => p.weight)).toEqual([100]);
    expect(row.termId).toBeNull();
    expect(row.academicYearId).toBe(yearId);
    expect([row.fromDateKey, row.toDateKey]).toEqual(["2026-06-01", "2027-04-30"]);
    expect(row.overallPercentMilli).toBe(80_400);
    await as("PARENT");
    const view = await familyCardGet(get(`/api/v1/family/report-cards/${cardA}`), params({ cardId: cardA }));
    expect(view.status).toBe(200);
  });
});
