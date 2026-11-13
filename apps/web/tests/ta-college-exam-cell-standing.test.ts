/**
 * What the exam cell keeps and answers after results: findings of the
 * college-exam-cell batch of the testing analysis of 13 November 2026, each
 * held by a case that failed on the code of that day.
 *
 *   TA-065  the CGPA ordered sessions by their current run's publication, so republishing an earlier session
 *           brought back a failure a later session had cleared
 *   TA-066  the Academic Bank's row (one per student and term) was overwritten by each session of the term
 *   TA-068  the degree and the convocation list did not ask whether the programme was finished; no paper could be withdrawn
 *   TA-569  the public check called a leaver's hall ticket valid
 *   TA-302  the after-results page reached only the first 500 students and the 300 newest revaluations
 *   TA-498  two openings of a sealed paper at once kept one line in its access log
 *
 * Scratch ZZ colleges of this suite's own, removed afterwards.
 */
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { correctMark, publishRun, runResults } from "@/lib/exam-cell-marks";
import { afterView, buildConvocation, checkExamDocument, issueDocument, myExams, openPaper } from "@/lib/exam-cell-after";
import { checkCode } from "@/lib/exam-cell-rules";
import { seal, sealingAvailable } from "@/lib/secret-box";
import { POST as revokePost } from "@/app/api/v1/exam-cell/documents/[documentId]/revoke/route";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { db, makeCollege, refusalOf, type College } from "./ta-college-exam-cell-fixture";

let c: College;
let auto: College;
let many: College;

beforeAll(async () => {
  c = await makeCollege("Standing");
  auto = await makeCollege("Degree", { autonomous: true });
  many = await makeCollege("Many", { students: 0 });
});

afterAll(async () => {
  await c?.drop();
  await auto?.drop();
  await many?.drop();
  await db.$disconnect();
  // The 501 students of "Many" take longer than the default ten seconds to remove on a loaded machine; a hook cut
  // short left their accounts behind.
}, 120_000);

const creditRow = async (student: string, termId: string) => (await db.creditPush.findUniqueOrThrow({ where: { studentMembershipId_termId: { studentMembershipId: student, termId } }, select: { creditsTenths: true } })).creditsTenths;

describe("TA-066 and TA-065: a term's credits and a student's CGPA across sessions", () => {
  let regular = "";
  let supplementary = "";

  it("TA-066: a supplementary session of the same term adds the re-sat course to the term's credits instead of replacing them", async () => {
    const [s1, s2] = c.students;
    regular = await c.session("ZZ Regular");
    // s1 fails the 3-credit course on 25/70 and passes the 4-credit one; everyone else passes both.
    for (const s of c.students) {
      await c.mark(regular, c.c1, s, s === s1 ? 25_000 : 50_000);
      await c.mark(regular, c.c2, s, 50_000);
    }
    const a = await runResults(c.ctx("ctrl"), regular);
    await publishRun(c.ctx("ctrl"), regular, a.id!);
    expect(await creditRow(s1!, c.term)).toBe(40);
    supplementary = await c.session("ZZ Supplementary", { kind: "SUPPLEMENTARY", students: [s1!], courses: [{ courseId: c.c1, kind: "BACKLOG" }] });
    await c.mark(supplementary, c.c1, s1!, 50_000);
    const b = await runResults(c.ctx("ctrl"), supplementary);
    await publishRun(c.ctx("ctrl"), supplementary, b.id!);
    expect(await db.backlog.findUniqueOrThrow({ where: { studentMembershipId_courseId: { studentMembershipId: s1!, courseId: c.c1 } }, select: { status: true } })).toEqual({ status: "CLEARED" });
    // 3 + 4 credits passed in the term's two sessions, not the supplementary's 3 alone.
    expect(await creditRow(s1!, c.term)).toBe(70);
    expect(await creditRow(s2!, c.term)).toBe(70);
  });

  it("TA-065: republishing the earlier session does not bring back the failure the later one cleared", async () => {
    const s1 = c.students[0]!;
    const before = await myExams(c.ctx("s1"));
    expect(before.creditsEarned).toBe(7);
    // Another student's mark in the regular session is corrected and the corrected run published, after the supplementary.
    await new Promise((r) => setTimeout(r, 20));
    await correctMark(c.ctx("ctrl"), regular, { courseId: c.c2, studentMembershipId: c.students[1]!, marks: 60, absent: false, reason: "ZZ re-totalled" });
    const rerun = await runResults(c.ctx("ctrl"), regular, "ZZ another student's correction");
    await publishRun(c.ctx("principal"), regular, rerun.id!);
    const after = await myExams(c.ctx("s1"));
    expect(after.creditsEarned).toBe(before.creditsEarned);
    expect(after.cgpa).toBe(before.cgpa);
    // The grade card's latest term is still the supplementary session's.
    expect(after.results[0]?.sessionId).toBe(supplementary);
    expect(await creditRow(s1, c.term)).toBe(70);
  });
});

describe("TA-068: a degree and the convocation list wait for the programme's credits; a paper can be withdrawn", () => {
  it("TA-068: one clean term is not a finished programme", async () => {
    const s1 = auto.students[0]!;
    const session = await auto.session("ZZ First term", { students: [s1] });
    await auto.mark(session, auto.c1, s1, 50_000);
    await auto.mark(session, auto.c2, s1, 50_000);
    const run = await runResults(auto.ctx("ctrl"), session);
    await publishRun(auto.ctx("ctrl"), session, run.id!);
    const refused = await refusalOf(issueDocument(auto.ctx("ctrl"), { kind: "DEGREE", studentMembershipId: s1 }));
    expect(refused).toMatchObject({ key: "examCell.refuseDegreeCredits", status: 409, vars: { earned: 7, needed: 120 } });
    const year = new Date().getUTCFullYear();
    await buildConvocation(auto.ctx("ctrl"), { year, finalize: false });
    const list = (await db.convocation.findUniqueOrThrow({ where: { schoolId_year: { schoolId: auto.id, year } }, select: { listJson: true } })).listJson;
    expect(list).not.toContain(s1);
  });

  it("TA-068: a finished programme is listed and gets its degree, and the degree can be withdrawn with a reason", async () => {
    const s1 = auto.students[0]!;
    const rules = JSON.parse((await db.scheme.findUniqueOrThrow({ where: { id: auto.schemeId }, select: { passingRules: true } })).passingRules) as Record<string, unknown>;
    await db.scheme.update({ where: { id: auto.schemeId }, data: { passingRules: JSON.stringify({ ...rules, totalCredits: 7 }) } });
    const year = new Date().getUTCFullYear();
    await buildConvocation(auto.ctx("ctrl"), { year, finalize: false });
    expect((await db.convocation.findUniqueOrThrow({ where: { schoolId_year: { schoolId: auto.id, year } }, select: { listJson: true } })).listJson).toContain(s1);
    const issued = await issueDocument(auto.ctx("ctrl"), { kind: "DEGREE", studentMembershipId: s1 });
    const doc = await db.examDocument.findUniqueOrThrow({ where: { id: issued.id! }, select: { code: true } });
    expect((await checkExamDocument(null, doc.code)).valid).toBe(true);
    // Through the door, as the controller.
    __resetCookies();
    __setHeaders({});
    await createSession(auto.user.ctrl!, { schoolId: auto.id, role: "EXAM_CONTROLLER" as never });
    const json = (body: unknown) => new Request(`http://localhost/api/v1/exam-cell/documents/${issued.id}/revoke`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const params = { params: Promise.resolve({ documentId: issued.id! }) };
    expect((await revokePost(json({}), params)).status).toBe(422);
    expect((await revokePost(json({ reason: "ZZ issued to the wrong student" }), params)).status).toBe(200);
    const check = await checkExamDocument(null, doc.code);
    expect(check.valid).toBe(false);
    expect(check.revokedAt).not.toBeNull();
    const row = await db.examDocument.findUniqueOrThrow({ where: { id: issued.id! }, select: { revokedReason: true } });
    expect(row.revokedReason).toBe("ZZ issued to the wrong student");
    const audits = await db.auditLog.findMany({ where: { schoolId: auto.id, action: "exam.document.revoke" }, select: { meta: true } });
    expect(audits).toHaveLength(1);
    expect(JSON.stringify(audits[0]!.meta)).not.toContain("wrong student");
    // Again: answered as it stands, nothing more written.
    expect((await revokePost(json({ reason: "ZZ issued to the wrong student" }), params)).status).toBe(200);
    expect(await db.auditLog.count({ where: { schoolId: auto.id, action: "exam.document.revoke" } })).toBe(1);
    __resetCookies();
  });

  it("TA-068: credited internship credits count toward the programme's total, as the credit push carries them", async () => {
    const s2 = auto.students[1]!;
    const rules = JSON.parse((await db.scheme.findUniqueOrThrow({ where: { id: auto.schemeId }, select: { passingRules: true } })).passingRules) as Record<string, unknown>;
    // 7 course credits and a 3-credit internship make the 10 the scheme sets (an AICTE B.Tech counts internships in its total).
    await db.scheme.update({ where: { id: auto.schemeId }, data: { passingRules: JSON.stringify({ ...rules, totalCredits: 10 }) } });
    const session = await auto.session("ZZ Intern term", { students: [s2] });
    await auto.mark(session, auto.c1, s2, 50_000);
    await auto.mark(session, auto.c2, s2, 50_000);
    const run = await runResults(auto.ctx("ctrl"), session);
    await publishRun(auto.ctx("ctrl"), session, run.id!);
    expect(await refusalOf(issueDocument(auto.ctx("ctrl"), { kind: "DEGREE", studentMembershipId: s2 }))).toMatchObject({ key: "examCell.refuseDegreeCredits", vars: { earned: 7, needed: 10 } });
    await db.internship.create({ data: { schoolId: auto.id, studentMembershipId: s2, companyName: "ZZ TACEC Works", kind: "INDUSTRY", fromKey: "2026-05-01", toKey: "2026-06-30", hours: 240, windowSemester: 2, supervisorName: "ZZ Supervisor", status: "CREDITED", credits: 3, creditedAt: new Date() } });
    const year = new Date().getUTCFullYear();
    await buildConvocation(auto.ctx("ctrl"), { year, finalize: false });
    expect((await db.convocation.findUniqueOrThrow({ where: { schoolId_year: { schoolId: auto.id, year } }, select: { listJson: true } })).listJson).toContain(s2);
    expect((await issueDocument(auto.ctx("ctrl"), { kind: "DEGREE", studentMembershipId: s2 })).ok).toBe(true);
  });
});

describe("TA-569: the public check of a leaver's hall ticket", () => {
  it("TA-569: a hall ticket of a student who has left reads not valid", async () => {
    const s3 = c.students[2]!;
    const session = await c.session("ZZ Tickets", { students: [s3] });
    const form = await db.examForm.findFirstOrThrow({ where: { sessionId: session, studentMembershipId: s3 }, select: { id: true } });
    const code = checkCode(randomBytes(10));
    await db.hallTicket.create({ data: { schoolId: c.id, sessionId: session, formId: form.id, studentMembershipId: s3, number: "HT0001", code, issuedByUserId: c.user.ctrl! } });
    expect((await checkExamDocument(c.id, code)).valid).toBe(true);
    await db.membership.update({ where: { id: s3 }, data: { leftAt: new Date() } });
    const after = await checkExamDocument(c.id, code);
    expect(after.kind).toBe("HALL_TICKET");
    expect(after.valid).toBe(false);
  });
});

describe("TA-302: the after-results desk reaches every student and every open request", () => {
  it("TA-302: the 501st student by name is found by search, and an ASKED revaluation older than the 300 newest is listed", async () => {
    const N = 501;
    const mail = (i: number) => `zz-tacec-many-x${String(i).padStart(3, "0")}-${many.stamp}@test.invalid`;
    await db.user.createMany({ data: Array.from({ length: N }, (_, i) => ({ name: i === N - 1 ? "ZZ TACEC Zz-last" : `ZZ TACEC A${String(i).padStart(3, "0")}`, email: mail(i) })) });
    const users = await db.user.findMany({ where: { email: { contains: `-${many.stamp}@test.invalid`, startsWith: "zz-tacec-many-x" } }, select: { id: true, name: true } });
    await db.membership.createMany({ data: users.map((u) => ({ userId: u.id, schoolId: many.id, role: "STUDENT", status: "ACTIVE" })) });
    const members = await db.membership.findMany({ where: { schoolId: many.id, role: "STUDENT" }, select: { id: true, user: { select: { name: true } } } });
    const target = members.find((m) => m.user.name === "ZZ TACEC Zz-last")!.id;
    const session = (await db.examSession.create({ data: { schoolId: many.id, name: `ZZ Many ${many.stamp}`, termId: many.term, status: "PUBLISHED" }, select: { id: true } })).id;
    const run = (await db.resultRun.create({ data: { schoolId: many.id, sessionId: session, number: 1, status: "PUBLISHED", computedByUserId: many.user.ctrl!, publishedAt: new Date() }, select: { id: true } })).id;
    await db.termResult.createMany({ data: members.map((m) => ({ schoolId: many.id, runId: run, termId: many.term, studentMembershipId: m.id, creditsAttemptedTenths: 70, creditsEarnedTenths: 70, status: "PASS" })) });
    // 450 revaluations: the 301 oldest still ASKED, the 149 newer decided; the oldest ASKED is behind 449 newer rows.
    const asked = members[0]!.id;
    await db.revaluation.createMany({ data: members.slice(0, 450).map((m, i) => ({ schoolId: many.id, sessionId: session, courseId: many.c1, studentMembershipId: m.id, kind: "PHOTOCOPY", status: i < 301 ? "ASKED" : "DECIDED", outcome: i < 301 ? null : "PROVIDED", createdAt: new Date(Date.UTC(2026, 9, 1) + i * 60_000) })) });
    const plain = await afterView(many.ctx("ctrl"));
    expect(plain.students).toHaveLength(500);
    expect(plain.students.some((s) => s.membershipId === target)).toBe(false);
    expect(plain.revaluations.filter((r) => r.status === "ASKED")).toHaveLength(301);
    expect(plain.revaluations.some((r) => r.studentMembershipId === asked && r.status === "ASKED")).toBe(true);
    const found = await afterView(many.ctx("ctrl"), { q: "zz-last" });
    expect(found.students.map((s) => s.membershipId)).toEqual([target]);
  });
});

describe("TA-498: every opening of a sealed paper is logged", () => {
  it.skipIf(!sealingAvailable())("TA-498: four openings at the same moment leave four lines and four audit rows", async () => {
    const session = await auto.session("ZZ Paper", { students: [] });
    const schedule = await db.examSchedule.create({ data: { schoolId: auto.id, sessionId: session, courseId: auto.c1, courseCode: "ZCA", courseName: "ZZ Mechanics", at: new Date("2026-11-04T04:30:00Z") }, select: { id: true } });
    const paper = await db.questionPaper.create({ data: { schoolId: auto.id, sessionId: session, scheduleId: schedule.id, setterMembershipId: auto.member["ctrl2:EXAM_CONTROLLER"]!, assignedByUserId: auto.user.ctrl!, status: "SUBMITTED", fileName: "zz.pdf" }, select: { id: true } });
    await db.questionPaper.update({ where: { id: paper.id }, data: { sealedBody: seal(Buffer.from("%PDF-1.4 ZZ").toString("base64"), `${auto.id}|QuestionPaper|${paper.id}`) } });
    await Promise.all([0, 1, 2, 3].map(() => openPaper(auto.ctx("ctrl"), paper.id)));
    const log = JSON.parse((await db.questionPaper.findUniqueOrThrow({ where: { id: paper.id }, select: { accessLogJson: true } })).accessLogJson) as unknown[];
    expect(log).toHaveLength(4);
    expect(await db.auditLog.count({ where: { schoolId: auto.id, action: "exam.paper.open", targetId: paper.id } })).toBe(4);
  });
});
