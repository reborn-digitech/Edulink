/**
 * G-5 (campaign of 4 October 2026): parent and employer surveys can be
 * answered. PARENT and EMPLOYER were survey kinds that only the desk could
 * type in from paper: the voice doors took students, alumni and faculty, and
 * a recruiter or an employer had no door at all.
 *
 * What holds: a guardian reads and answers the open PARENT survey of their
 * child's college through the voice doors, once; the desk makes a signed link
 * for one respondent of an EMPLOYER survey, and a signed-out caller answers
 * through it once; a forged link, a link for another kind of survey and a
 * link after the survey closes all fail; no answer names its respondent.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { SURVEY_QUESTIONS } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as voiceGet } from "@/app/api/v1/voice/route";
import { POST as answerPost } from "@/app/api/v1/voice/surveys/[surveyId]/route";
import { POST as linkPost } from "@/app/api/v1/iqac/surveys/[surveyId]/links/route";
import { POST as closePost } from "@/app/api/v1/iqac/surveys/[surveyId]/close/route";
import { GET as publicGet, POST as publicPost } from "@/app/api/v1/public/surveys/[token]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { college: "", parent: "", iqac: "", parentSurvey: "", employerSurvey: "", sss: "" };
const json = (body: unknown) => new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const survey = (surveyId: string) => ({ params: Promise.resolve({ surveyId }) });
const tok = (token: string) => ({ params: Promise.resolve({ token }) });
const answersFor = (kind: "PARENT" | "EMPLOYER") => Object.fromEntries(SURVEY_QUESTIONS[kind].map((q) => [q, 3]));
async function as(userId: string, role: string, schoolId: string | null) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
}
async function signedOut() {
  __resetCookies();
  __setHeaders({ "x-forwarded-for": `10.9.${STAMP % 250}.7` });
}

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ Voice College ${STAMP}`, slug: `zz-voice-${STAMP}`, code: `ZVC${String(STAMP).slice(-6)}`, contactEmail: `zz-voice-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.college, module: "ACADEMICS" }, { schoolId: ids.college, module: "IQAC" }] });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Voice ${who}`, email: `zz-voice-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [parent, student, iqac] = await Promise.all([user("Parent"), user("Student"), user("Iqac")]);
  ids.parent = parent.id;
  ids.iqac = iqac.id;
  const pupil = await db.membership.create({ data: { userId: student.id, schoolId: ids.college, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  await db.membership.create({ data: { userId: iqac.id, schoolId: ids.college, role: "IQAC", status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: pupil.id, studentSchoolId: ids.college, relation: "PARENT", status: "ACTIVE" } });
  const mk = (kind: "PARENT" | "EMPLOYER" | "SSS") => db.survey.create({ data: { schoolId: ids.college, kind, title: `ZZ ${kind} survey`, opensOn: "2020-01-01", closesOn: "2099-12-31", questionsJson: JSON.stringify(SURVEY_QUESTIONS[kind]), salt: randomBytes(16).toString("hex") }, select: { id: true } });
  ids.parentSurvey = (await mk("PARENT")).id;
  ids.employerSurvey = (await mk("EMPLOYER")).id;
  ids.sss = (await mk("SSS")).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a guardian's voice", () => {
  it("reads the parent survey of the child's college and answers it once, keeping no name", async () => {
    await as(ids.parent, "PARENT", null);
    const v = await (await voiceGet()).json();
    expect(v.surveys.map((s: { id: string }) => s.id)).toEqual([ids.parentSurvey]);
    expect((await answerPost(json({ answers: answersFor("PARENT") }), survey(ids.parentSurvey))).status).toBe(200);
    expect((await answerPost(json({ answers: answersFor("PARENT") }), survey(ids.parentSurvey))).status).toBe(409);
    // The employer survey is not the guardian's to answer.
    expect((await answerPost(json({ answers: answersFor("EMPLOYER") }), survey(ids.employerSurvey))).status).toBe(404);
    const rows = await db.surveyResponse.findMany({ where: { surveyId: ids.parentSurvey }, select: { respondentMembershipId: true, respondentHash: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.respondentMembershipId).toBeNull();
    expect(rows[0]!.respondentHash).not.toContain(ids.parent);
  });
});

describe("an employer's link", () => {
  let token = "";
  it("is made by the desk for one respondent, for an employer's or a parent's survey only", async () => {
    await as(ids.iqac, "IQAC", ids.college);
    expect((await linkPost(json({}), survey(ids.sss))).status).toBe(422);
    const res = await linkPost(json({}), survey(ids.employerSurvey));
    expect(res.status).toBe(200);
    token = (await res.json()).token;
    expect(await db.auditLog.count({ where: { schoolId: ids.college, action: "iqac.survey.link" } })).toBe(1);
  });

  it("is answered once, signed out; a forged link reads as nothing", async () => {
    await signedOut();
    const view = await publicGet(new Request("http://localhost/x"), tok(token));
    expect(view.status).toBe(200);
    expect(await view.json()).toMatchObject({ kind: "EMPLOYER", answered: false });
    expect((await publicPost(json({ answers: answersFor("EMPLOYER") }), tok(token))).status).toBe(200);
    expect((await publicPost(json({ answers: answersFor("EMPLOYER") }), tok(token))).status).toBe(409);
    expect((await (await publicGet(new Request("http://localhost/x"), tok(token))).json()).answered).toBe(true);
    const forged = `${token.slice(0, -4)}AAAA`;
    expect((await publicGet(new Request("http://localhost/x"), tok(forged))).status).toBe(404);
    expect((await publicPost(json({ answers: answersFor("EMPLOYER") }), tok(forged))).status).toBe(404);
    expect(await db.surveyResponse.count({ where: { surveyId: ids.employerSurvey } })).toBe(1);
  });

  it("stops working once the survey closes", async () => {
    await as(ids.iqac, "IQAC", ids.college);
    const fresh = (await (await linkPost(json({}), survey(ids.employerSurvey))).json()).token;
    expect((await closePost(json({}), survey(ids.employerSurvey))).status).toBe(200);
    await signedOut();
    expect((await publicGet(new Request("http://localhost/x"), tok(fresh))).status).toBe(404);
  });
});
