/**
 * The IQAC's surveys: three findings of the testing analysis of 13 November 2026 in lib/iqac.ts.
 *
 *   TA-072  A survey's totals were served while it was still open, so two readings one answer apart
 *           gave that respondent's own answers; the course file's indirect attainment (the mean
 *           OUTCOMES answer of the offering's course feedback) moved the same way.
 *   TA-306  A survey that closed by its date kept its salt, so its answers stayed linkable to people,
 *           while the button's close wipes it.
 *   TA-308  Saving an action-taken report again dropped its attached file and moved its publication
 *           date.
 *
 * One scratch ZZ college of this suite's own (made through the owner connection, removed after) with
 * the IQAC on, an IQAC coordinator and surveys and responses written straight to the rows.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { SURVEY_QUESTIONS } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
import { closeLapsedSurveys, indirectAttainment, listSurveys, saveActionTaken, surveyResults } from "@/lib/iqac";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-taiqs-${who}-${STAMP}@test.invalid`;
const ids = { school: "", iqac: "", iqacM: "" };
const DAY = 86_400_000;
const key = (d: Date) => d.toISOString().slice(0, 10);

function ctx(): ActiveContext {
  return {
    sessionId: "test",
    membershipId: ids.iqacM,
    schoolId: ids.school,
    role: "IQAC" as ActiveContext["role"],
    user: { id: ids.iqac, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  };
}

async function survey(title: string, opensOn: string, closesOn: string): Promise<string> {
  return (await db.survey.create({ data: { schoolId: ids.school, kind: "SSS", title, opensOn, closesOn, questionsJson: JSON.stringify(SURVEY_QUESTIONS.SSS), salt: "0123456789abcdef0123456789abcdef", createdByUserId: ids.iqac }, select: { id: true } })).id;
}
async function answer(surveyId: string, value: number) {
  const answers = Object.fromEntries((SURVEY_QUESTIONS.SSS as readonly string[]).map((q) => [q, value]));
  await db.surveyResponse.create({ data: { schoolId: ids.school, surveyId, respondentHash: `zz_${randomUUID()}`, answersJson: JSON.stringify(answers) } });
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA IQAC Surveys ${STAMP}`, slug: `zz-taiqs-${STAMP}`, code: `ZTQS${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "ACADEMICS" }, { schoolId: ids.school, module: "IQAC" }] });
  ids.iqac = (await db.user.create({ data: { name: "ZZ TA Iqac Surveys", email: MAIL("iqac"), prefs: "{}" }, select: { id: true } })).id;
  ids.iqacM = (await db.membership.create({ data: { userId: ids.iqac, schoolId: ids.school, role: "IQAC", status: "ACTIVE" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-072: no totals while a survey is open", () => {
  it("TA-072: six answers to an open survey are suppressed, a seventh changes nothing a reader sees, and the totals open once it is closed", async () => {
    const now = Date.now();
    const id = await survey("ZZ open SSS", key(new Date(now - 10 * DAY)), key(new Date(now + 10 * DAY)));
    for (let i = 0; i < 6; i += 1) await answer(id, 3);
    const first = await surveyResults(ctx(), id);
    expect(first.suppressed).toBe(true);
    expect(first.overall).toBeNull();
    expect(first.questions.every((q) => q.mean === null && q.counts.every((c) => c === 0))).toBe(true);
    await answer(id, 0);
    const second = await surveyResults(ctx(), id);
    expect({ ...second, survey: { ...second.survey, responses: 0 } }).toEqual({ ...first, survey: { ...first.survey, responses: 0 } });
    await db.survey.update({ where: { id }, data: { closedAt: new Date(), salt: "" } });
    const closed = await surveyResults(ctx(), id);
    expect(closed.suppressed).toBe(false);
    expect(closed.overall).not.toBeNull();
  }, 60_000);

  it("TA-072: the course file's indirect attainment reads no open course feedback, so a sixth answer does not move it, and counts the survey once it is closed", async () => {
    const now = Date.now();
    const dept = (await db.department.create({ data: { schoolId: ids.school, code: "ZQS", name: "ZZ Survey Dept" }, select: { id: true } })).id;
    const prog = (await db.programme.create({ data: { schoolId: ids.school, departmentId: dept, code: "ZQSP", name: "ZZ B.Sc", level: "UG", durationYears: 3, intake: 30, regulator: "UGC", stream: "SCIENCE" }, select: { id: true } })).id;
    const scheme = (await db.scheme.create({ data: { schoolId: ids.school, programmeId: prog, name: "ZZ BSc 2026", effectiveYear: 2026 }, select: { id: true } })).id;
    const course = (await db.course.create({ data: { schoolId: ids.school, schemeId: scheme, code: "ZQS101", name: "ZZ Physics", semester: 1 }, select: { id: true } })).id;
    const term = (await db.academicTerm.create({ data: { schoolId: ids.school, name: "ZZ Odd", academicYear: "2026-27", startsOn: "2026-07-01", endsOn: "2026-11-30", registrationOpensOn: "2026-07-01", registrationClosesOn: "2026-07-15" }, select: { id: true } })).id;
    const offeringId = (await db.courseOffering.create({ data: { schoolId: ids.school, termId: term, courseId: course }, select: { id: true } })).id;
    const sid = (await db.survey.create({ data: { schoolId: ids.school, kind: "COURSE_FEEDBACK", offeringId, title: "ZZ open course feedback", opensOn: key(new Date(now - 10 * DAY)), closesOn: key(new Date(now + 10 * DAY)), questionsJson: JSON.stringify(SURVEY_QUESTIONS.COURSE_FEEDBACK), salt: "0123456789abcdef0123456789abcdef", createdByUserId: ids.iqac }, select: { id: true } })).id;
    const feedback = async (value: number) => {
      const answers = Object.fromEntries((SURVEY_QUESTIONS.COURSE_FEEDBACK as readonly string[]).map((q) => [q, value]));
      await db.surveyResponse.create({ data: { schoolId: ids.school, surveyId: sid, respondentHash: `zz_${randomUUID()}`, answersJson: JSON.stringify(answers) } });
    };
    for (let i = 0; i < 6; i += 1) await feedback(4);
    const first = await indirectAttainment(offeringId);
    expect(first).toEqual({ level: null, mean: null, responses: 0 });
    await feedback(0);
    expect(await indirectAttainment(offeringId)).toEqual(first);
    await db.survey.update({ where: { id: sid }, data: { closedAt: new Date(), salt: "" } });
    const closed = await indirectAttainment(offeringId);
    expect(closed.responses).toBe(7);
    expect(closed.mean).toBe(Math.round((24 / 7) * 100) / 100);
  }, 60_000);
});

describe("TA-306: a survey that closes by its date loses its salt", () => {
  it("TA-306: once its closing date has passed the salt is wiped and closedAt set, by the nightly tidy and on the desk's first read", async () => {
    const now = Date.now();
    const byJob = await survey("ZZ lapsed SSS one", key(new Date(now - 30 * DAY)), key(new Date(now - 2 * DAY)));
    const byRead = await survey("ZZ lapsed SSS two", key(new Date(now - 30 * DAY)), key(new Date(now - 2 * DAY)));
    const open = await survey("ZZ running SSS", key(new Date(now - 2 * DAY)), key(new Date(now + 5 * DAY)));
    await answer(byJob, 2);
    await closeLapsedSurveys(new Date(), { schoolIds: [ids.school], surveyIds: [byJob] });
    const a = await db.survey.findUniqueOrThrow({ where: { id: byJob }, select: { salt: true, closedAt: true } });
    expect(a.salt).toBe("");
    expect(a.closedAt).not.toBeNull();
    await listSurveys(ctx());
    const b = await db.survey.findUniqueOrThrow({ where: { id: byRead }, select: { salt: true, closedAt: true } });
    expect(b.salt).toBe("");
    expect(b.closedAt).not.toBeNull();
    const c = await db.survey.findUniqueOrThrow({ where: { id: open }, select: { salt: true, closedAt: true } });
    expect(c.salt).not.toBe("");
    expect(c.closedAt).toBeNull();
  }, 60_000);
});

describe("TA-308: saving an action-taken report again", () => {
  it("TA-308: a second save with new text and no file keeps the file and the first publication time", async () => {
    const now = Date.now();
    const id = await survey("ZZ SSS with a report", key(new Date(now - 30 * DAY)), key(new Date(now + 30 * DAY)));
    const fileId = `${randomUUID()}.pdf`;
    await db.iqacFile.create({ data: { schoolId: ids.school, fileId, title: "ZZ ATR", purpose: "ATR", uploadedByUserId: ids.iqac, uploadedByMembershipId: ids.iqacM } });
    await saveActionTaken(ctx(), id, { text: "ZZ the first report, with its signed file.", fileId, publish: true });
    const first = await db.actionTakenReport.findUniqueOrThrow({ where: { surveyId: id }, select: { fileId: true, publishedAt: true } });
    expect(first.fileId).toBe(fileId);
    await new Promise((r) => setTimeout(r, 20));
    await saveActionTaken(ctx(), id, { text: "ZZ the report with one sentence corrected.", fileId: null, publish: true });
    const second = await db.actionTakenReport.findUniqueOrThrow({ where: { surveyId: id }, select: { fileId: true, publishedAt: true, text: true } });
    expect(second.text).toContain("corrected");
    expect(second.fileId).toBe(fileId);
    expect(second.publishedAt?.toISOString()).toBe(first.publishedAt?.toISOString());
  }, 60_000);
});
