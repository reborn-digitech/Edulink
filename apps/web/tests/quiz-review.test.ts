/**
 * The generated bank's desk (src/lib/quiz-review.ts, the doors under /api/v1/appadmin/quiz-review), as the
 * owner decided on 11 October 2026 (quiz-publish-jobs): the generated bank is PUBLISHED WITHOUT REVIEW and
 * the operator or the content team edit or take an item down afterwards; and the teachers' question gig
 * switched off (src/lib/question-gig.ts, 10 October 2026).
 *
 * Proved here: the doors open to the content team and the operator and to nobody else (a school's ADMIN
 * and TEACHER 403, signed out 401); a generated item is served with no stamp, its Hindi row with it,
 * through the phone's practice doors; an item taken down vanishes at once from the practice sitting, the
 * chapter's count, the revision player and a worksheet, keeps the answers pupils gave, and comes back
 * everywhere with Put back; an edit (English and Hindi in one press) is audited with the words before,
 * keeps the solver's answers with the edited-after-solving mark and is served at once, and the bank
 * editor and the translations page refuse a generated item (one writer); an item whose figure failed is
 * held until a figure is stored; the operator's take-down records the role OPERATOR; the review queue's
 * accepted items stay served; and the gig flag hides the nav entry, 404s the pages and the doors, and is
 * in the catalog for the sweep. Every row is a ZZ row made here and removed after; nothing else is touched.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { QUESTION_GIG_FOR_TEACHERS, practiceBeganSchema, practiceNextSchema, quizBankStandingSchema, quizReviewListSchema, quizReviewNextSchema } from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { checkEdit, checkTranslationEdit, editItem, getItem, inFirstBand, listQueue, nextItem, parseSkip, putBackItem, readGeneration, startOfIndianDay, stateOfRow, takeDownItem } from "@/lib/quiz-review";
import { isHeldForFigure, isServed, SERVED_QUESTION } from "@/lib/quiz-served";
import { listTopics } from "@/lib/quiz";
import { reviseQuestion, revisionQueue } from "@/lib/practice-insights";
import { buildWorksheet } from "@/lib/worksheets";
import { updateBankQuestion } from "@/lib/app-admin";
import { reviewTranslation } from "@/lib/translation-review";
import { NAV, hiddenByFeature } from "@/lib/nav";
import { PLATFORM_FEATURES } from "@edulink/contracts";
import { setFeaturesForTests } from "@/lib/platform-features";
import { ENDPOINTS } from "@/lib/api-catalog";
import { GET as listGet } from "@/app/api/v1/appadmin/quiz-review/route";
import { GET as nextGet } from "@/app/api/v1/appadmin/quiz-review/next/route";
import { GET as oneGet } from "@/app/api/v1/appadmin/quiz-review/[questionId]/route";
import { POST as editPost } from "@/app/api/v1/appadmin/quiz-review/[questionId]/edit/route";
import { POST as takeDownPost } from "@/app/api/v1/appadmin/quiz-review/[questionId]/take-down/route";
import { POST as putBackPost } from "@/app/api/v1/appadmin/quiz-review/[questionId]/put-back/route";
import { POST as beginPost } from "@/app/api/v1/practice/attempts/route";
import { GET as practiceNextGet } from "@/app/api/v1/practice/next/route";
import { POST as answerPost } from "@/app/api/v1/practice/answer/route";
import { GET as gigQuestionsGet } from "@/app/api/v1/gigs/questions/route";
import { POST as gigPayeePost } from "@/app/api/v1/gigs/payee/route";
import ContributionsLayout from "@/app/(app)/teacher/contributions/layout";

// Whole practice sittings through the doors: slower than a unit test, and the battery runs suites side by side.
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const db = new PrismaClient();
const STAMP = Date.now();
const SLUG = `zz-rq-${STAMP}`;
const NEW_SLUG = `zz-rq-new-${STAMP}`;
const P = "/api/v1/appadmin/quiz-review";

let schoolId = "";
let topicId = "";
let newTopicId = "";
const ids = { curator: "", operator: "", admin: "", teacher: "", pupil: "" };
let pupilMembershipId = "";
const q = { authored: "", g1: "", g2: "", g3: "", g4: "", lonely: "" };
let pupilCtx: ActiveContext;

const get = (path: string) => new Request(`http://localhost${path}`);
const post = (path: string, body?: unknown) =>
  new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const params = (questionId: string) => ({ params: Promise.resolve({ questionId }) });

function ctx(userId: string, flags: { isAppAdmin?: boolean; isSuperuser?: boolean }): ActiveContext {
  return {
    sessionId: "test",
    membershipId: null,
    schoolId: null,
    role: null,
    user: { id: userId, name: "ZZ RQ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: flags.isSuperuser ?? false, isAppAdmin: flags.isAppAdmin ?? false },
  } as ActiveContext;
}
const curator = () => ctx(ids.curator, { isAppAdmin: true });
const operator = () => ctx(ids.operator, { isSuperuser: true });

async function signInAs(who: "CURATOR" | "OPERATOR" | "ADMIN" | "TEACHER" | "PUPIL" | "OUT") {
  __resetCookies();
  if (who === "CURATOR") await createSession(ids.curator);
  else if (who === "OPERATOR") await createSession(ids.operator);
  else if (who === "ADMIN") await createSession(ids.admin, { schoolId, role: "ADMIN" });
  else if (who === "TEACHER") await createSession(ids.teacher, { schoolId, role: "TEACHER" });
  else if (who === "PUPIL") await createSession(ids.pupil, { schoolId, role: "STUDENT" });
}

const GENERATION = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({ distractorReason: [null, "adds the denominators", "confuses the sign", "reads the wrong axis"], solverAnswers: [0, 0, 1, 0, 0], levelFlag: null, critique: "one defensible answer", figure: null, needsFigure: false, edition: "2024", generatedAt: "2026-10-10T10:00:00.000Z", model: "qwen3-30b-a3b", translations: { hi: { critique: "same meaning", flag: null, imageAlt: null } }, ...extra });

async function generated(stem: string, difficulty = 1, extra: Record<string, unknown> = {}, topic = topicId) {
  return (
    await db.quizQuestion.create({
      // As scripts/quiz-queue-load.ts writes one: generated, no stamp, needsFigure copied from the material.
      data: { topicId: topic, difficulty, stem, choices: JSON.stringify(["7", "5", "12", "-7"]), answerIndex: 0, solution: "ZZ: three and four make seven.", checkExpr: "3+4", source: "generated against ZZ", licence: "test", generated: true, generatedBoard: "NCERT", generation: GENERATION(extra), needsFigure: extra.needsFigure === true },
      select: { id: true },
    })
  ).id;
}

/** A whole sitting through the phone's doors: every question served, in the language asked; `wrong` ids are answered wrongly. */
async function sitting(slug: string, language: "en" | "hi", wrong: string[] = []): Promise<{ id: string; stem: string }[]> {
  await signInAs("PUPIL");
  const began = practiceBeganSchema.parse(await (await beginPost(post("/api/v1/practice/attempts", { slug, language }))).json());
  const served: { id: string; stem: string }[] = [];
  let question = began.question;
  let n = 0;
  while (question && n++ < 20) {
    served.push({ id: question.questionId, stem: question.stem });
    const answered = await answerPost(post("/api/v1/practice/answer", { attemptId: began.attemptId, questionId: question.questionId, chosenIndex: wrong.includes(question.questionId) ? 1 : 0, clientId: `zz-rq-${STAMP}-${served.length}-${language}-${Math.random()}` }));
    expect(answered.status).toBe(200);
    const next = practiceNextSchema.parse(await (await practiceNextGet(get(`/api/v1/practice/next?attemptId=${began.attemptId}&language=${language}`))).json());
    question = next.question;
  }
  return served;
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ RQ School ${STAMP}`, slug: `zz-rq-${STAMP}`, code: `ZQ${String(STAMP).slice(-6)}`, contactEmail: `zz-rq-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", /* a test fixture: the zz- chapters list for it (quiz-fixtures.ts, 11 Oct 2026) */ isTestFixture: true },
    select: { id: true },
  });
  schoolId = school.id;
  const make = (name: string, flags: { isAppAdmin?: boolean; isSuperuser?: boolean } = {}) =>
    db.user.create({ data: { name: `ZZ RQ ${name}`, email: `zz-rq-${name.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true, ...flags }, select: { id: true } });
  const [c, o, a, t, p] = await Promise.all([make("Curator", { isAppAdmin: true }), make("Operator", { isSuperuser: true }), make("Admin"), make("Teacher"), make("Pupil")]);
  Object.assign(ids, { curator: c.id, operator: o.id, admin: a.id, teacher: t.id, pupil: p.id });
  await db.membership.create({ data: { userId: a.id, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: t.id, schoolId, role: "TEACHER", status: "ACTIVE" } });
  pupilMembershipId = (await db.membership.create({ data: { userId: p.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRQ${STAMP}` }, select: { id: true } })).id;

  topicId = (await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 7, chapter: "ZZ RQ Chapter", name: `ZZ RQ Integers ${STAMP}`, slug: SLUG }, select: { id: true } })).id;
  q.authored = (
    await db.quizQuestion.create({
      data: { topicId, difficulty: 1, stem: `ZZ RQ ${STAMP}: authored, what is 2+2?`, choices: JSON.stringify(["4", "5"]), answerIndex: 0, solution: "ZZ: two and two.", source: "test", licence: "test" },
      select: { id: true },
    })
  ).id;
  q.g1 = await generated(`ZZ RQ ${STAMP}: generated one, what is 3+4?`);
  await db.quizQuestionTranslation.create({ data: { questionId: q.g1, language: "hi", stem: `ZZ RQ ${STAMP}: 3+4 कितना है?`, choices: JSON.stringify(["७", "५", "१२", "-७"]), solution: "ZZ: तीन और चार सात।" } });
  q.g2 = await generated(`ZZ RQ ${STAMP}: generated two, to be taken down`);
  q.g3 = await generated(`ZZ RQ ${STAMP}: generated three, to be edited`);
  await db.quizQuestionTranslation.create({ data: { questionId: q.g3, language: "hi", stem: `ZZ RQ ${STAMP}: तीन`, choices: JSON.stringify(["७", "५", "१२", "-७"]), solution: "ZZ हल।" } });
  q.g4 = await generated(`ZZ RQ ${STAMP}: generated four, its figure failed`, 1, { figure: { kind: "geometry", spec: { points: [] } }, needsFigure: true, figureError: "ZZ: the figure could not be drawn" });
  newTopicId = (await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 7, chapter: "ZZ RQ New", name: `ZZ RQ New ${STAMP}`, slug: NEW_SLUG }, select: { id: true } })).id;
  q.lonely = await generated(`ZZ RQ ${STAMP}: the only item of a new chapter`, 1, {}, newTopicId);
  pupilCtx = { ...ctx(ids.pupil, {}), role: "STUDENT", schoolId, membershipId: pupilMembershipId } as ActiveContext;
});

afterAll(async () => {
  __resetCookies();
  const people = Object.values(ids).filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: people } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  // The stamps and translations cascade with the questions, the questions with the topics.
  await db.quizTopic.deleteMany({ where: { id: { in: [topicId, newTopicId].filter(Boolean) } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: people } } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

describe("the serving rules, pure", () => {
  it("an authored row is served; a generated one with no stamp too; taken down or held for its figure, not", () => {
    const up = { generated: true, takenDownAt: null, needsFigure: false, imageKey: null };
    expect(isServed({ ...up, generated: false })).toBe(true);
    expect(isServed(up)).toBe(true);
    expect(isServed({ ...up, takenDownAt: new Date() })).toBe(false);
    expect(isServed({ ...up, needsFigure: true })).toBe(false);
    expect(isServed({ ...up, needsFigure: true, imageKey: "a-file" })).toBe(true);
    expect(isHeldForFigure({ ...up, needsFigure: true })).toBe(true);
    expect(stateOfRow({ takenDownAt: null, needsFigure: false, imageKey: null })).toBe("SERVED");
    expect(stateOfRow({ takenDownAt: new Date(), needsFigure: true, imageKey: null })).toBe("DOWN");
    expect(stateOfRow({ takenDownAt: null, needsFigure: true, imageKey: null })).toBe("HELD");
    // The one filter: no stamp column in it any more.
    expect(JSON.stringify(SERVED_QUESTION)).not.toContain("reviewedAt");
  });

  it("reads the generator's material defensively, parses the skip list, the first band and the Indian day", () => {
    expect(readGeneration(null)).toEqual({});
    expect(readGeneration("not json")).toEqual({});
    const g = readGeneration(GENERATION({ figure: { kind: "graph", spec: { a: 1 } }, needsFigure: true }));
    expect(g.solverAnswers).toEqual([0, 0, 1, 0, 0]);
    expect(g.distractorReason?.[1]).toBe("adds the denominators");
    expect(g.figure).toEqual({ kind: "graph", spec: { a: 1 } });
    expect(g.needsFigure).toBe(true);
    expect(parseSkip("a1, b2,,a1,bad id,c3")).toEqual(["a1", "b2", "c3"]);
    expect(inFirstBand({ classLevel: 8, subject: "SCIENCE" })).toBe(true);
    expect(inFirstBand({ classLevel: 11, subject: "MATHS" })).toBe(false);
    expect(inFirstBand({ classLevel: 8, subject: "HISTORY" })).toBe(false);
    // 20:00 UTC on the 10th is 01:30 on the 11th in India: the day began at 18:30 UTC on the 10th.
    expect(startOfIndianDay(new Date("2026-10-10T20:00:00.000Z")).toISOString()).toBe("2026-10-10T18:30:00.000Z");
  });

  it("an edit keeps the options' count, refuses a repeat, an out-of-range key, a check that does not come to the key, and a short translation", () => {
    const base = { choices: ["7", "5", "12", "-7"], answerIndex: 0 };
    expect(checkEdit(base, 4)).toBeNull();
    expect(checkEdit({ ...base, choices: ["7", "5", "12"] }, 4)).toBe("quizReview.choicesMustStay");
    expect(checkEdit({ ...base, choices: ["7", "7", "12", "-7"] }, 4)).toBe("quizReview.choicesRepeat");
    expect(checkEdit({ ...base, answerIndex: 4 }, 4)).toBe("quizReview.keyOutOfRange");
    expect(checkEdit({ ...base, checkExpr: "7" }, 4)).toBe("quizReview.checkExprBare");
    expect(checkEdit({ ...base, checkExpr: "3+5" }, 4)).toBe("quizReview.checkExprMismatch");
    expect(checkEdit({ ...base, checkExpr: "3+4" }, 4)).toBeNull();
    expect(checkTranslationEdit({ choices: ["७", "५", "१२"] }, 4)).toBe("quizReview.choicesMustStay");
    expect(checkTranslationEdit({ choices: ["७", "७", "१२", "-७"] }, 4)).toBe("quizReview.choicesRepeat");
    expect(checkTranslationEdit({ choices: ["७", "५", "१२", "-७"] }, 4)).toBeNull();
  });
});

describe("the doors by role", () => {
  it("the content team and the operator pass; a school's ADMIN and TEACHER are refused 403; signed out is 401", async () => {
    for (const who of ["CURATOR", "OPERATOR"] as const) {
      await signInAs(who);
      const list = await listGet(get(`${P}?topic=${topicId}`));
      expect(list.status, who).toBe(200);
      const body = quizReviewListSchema.parse(await list.json());
      expect(body.filtered).toBe(4);
      expect(body.groups.find((g) => g.topicId === topicId)).toMatchObject({ levels: [4, 0, 0, 0, 0, 0], held: 1, down: 0 });
      const held = quizReviewListSchema.parse(await (await listGet(get(`${P}?topic=${topicId}&state=HELD`))).json());
      expect(held.filtered).toBe(1);
      const next = await nextGet(get(`${P}/next?topic=${topicId}`));
      expect(next.status, who).toBe(200);
      expect(quizReviewNextSchema.parse(await next.json()).item?.id).toBe(q.g1);
      const one = await oneGet(get(`${P}/${q.g1}`), params(q.g1));
      expect(one.status, who).toBe(200);
      const item = quizReviewNextSchema.parse(await one.json()).item!;
      expect(item.state).toBe("SERVED");
      expect(item.solverAnswers).toEqual([0, 0, 1, 0, 0]);
      expect(item.distractorReasons[2]).toBe("confuses the sign");
      expect(item.translations.hi?.stem).toContain("कितना");
      expect(item.translations.mr).toBeNull();
      expect((await oneGet(get(`${P}/${q.authored}`), params(q.authored))).status, "an authored question is not the desk's").toBe(404);
      expect((await takeDownPost(post(`${P}/zz-no-such/take-down`, { reason: "WRONG_KEY" }), params("zz-no-such"))).status).toBe(404);
      expect((await putBackPost(post(`${P}/zz-no-such/put-back`), params("zz-no-such"))).status).toBe(404);
    }
    for (const who of ["ADMIN", "TEACHER"] as const) {
      await signInAs(who);
      expect((await listGet(get(P))).status, who).toBe(403);
      expect((await nextGet(get(`${P}/next`))).status, who).toBe(403);
      expect((await oneGet(get(`${P}/${q.g1}`), params(q.g1))).status, who).toBe(403);
      expect((await editPost(post(`${P}/${q.g1}/edit`, {}), params(q.g1))).status, who).toBe(403);
      expect((await takeDownPost(post(`${P}/${q.g1}/take-down`, { reason: "WRONG_KEY" }), params(q.g1))).status, who).toBe(403);
      expect((await putBackPost(post(`${P}/${q.g1}/put-back`), params(q.g1))).status, who).toBe(403);
    }
    await signInAs("OUT");
    expect((await listGet(get(P))).status).toBe(401);
    expect((await takeDownPost(post(`${P}/${q.g1}/take-down`, { reason: "WRONG_KEY" }), params(q.g1))).status).toBe(401);
    // Nothing above changed a row.
    expect(await db.quizQuestion.count({ where: { topicId, takenDownAt: { not: null } } })).toBe(0);
    // The catalog: six doors, all app-admin, the three writes sampled on an id no question holds.
    const doors = ENDPOINTS.filter((e) => e.path.startsWith(P));
    expect(doors.map((d) => `${d.method} ${d.path}`).sort()).toEqual([
      `GET ${P}`,
      `GET ${P}/next`,
      `GET ${P}/{questionId}`,
      `POST ${P}/{questionId}/edit`,
      `POST ${P}/{questionId}/put-back`,
      `POST ${P}/{questionId}/take-down`,
    ]);
    for (const d of doors) expect(d.access, d.path).toBe("app-admin");
  });
});

describe("published without review, taken down and put back", () => {
  it("a generated item is served at once with no stamp, its Hindi with it; the held one is not; a new chapter lists", async () => {
    const served = await sitting(SLUG, "en", [q.g2]);
    expect(served.map((s) => s.id).sort()).toEqual([q.authored, q.g1, q.g2, q.g3].sort());
    const inHindi = await sitting(SLUG, "hi", [q.g2]);
    expect(inHindi.find((s) => s.id === q.g1)!.stem).toBe(`ZZ RQ ${STAMP}: 3+4 कितना है?`);
    const topics = await listTopics(pupilCtx, { subject: "MATHS", classLevel: 7 });
    expect(topics.find((t) => t.slug === SLUG)?.questionCount).toBe(4);
    expect(topics.find((t) => t.slug === NEW_SLUG)?.questionCount, "a chapter of generated items lists the moment it is loaded").toBe(1);
    expect(await db.quizReviewStamp.count({ where: { questionId: { in: Object.values(q) } } }), "no stamp was needed").toBe(0);
  });

  it("taken down, it vanishes at once from the sitting, the chapter's count, revision and worksheets, keeping the answers; put back, it returns", async () => {
    // The pupil answered g2 wrongly above: it is in their revision queue. The nightly bank:stats job adds
    // the answers up per question (QuestionStat); its row for g2 is written here as that job would.
    expect((await revisionQueue(pupilCtx, { minAgeDays: 0 })).some((r) => r.questionId === q.g2)).toBe(true);
    await db.questionStat.create({ data: { questionId: q.g2, grade: 7, asked: 2, correct: 0 } });
    const responsesBefore = await db.quizResponse.count({ where: { questionId: q.g2 } });
    expect(responsesBefore).toBeGreaterThanOrEqual(2);
    expect((await reviseQuestion(pupilCtx, q.g2)).questionId).toBe(q.g2);
    const teacherCtx = { ...ctx(ids.teacher, {}), role: "TEACHER", schoolId, user: { ...ctx(ids.teacher, {}).user, prefs: { locale: "en" } } } as unknown as ActiveContext;
    const sheet = async () => (await buildWorksheet(teacherCtx, { slug: SLUG, level: 1, count: 30, seed: "zz" })).questions.map((x) => x.stem);
    expect(await sheet()).toContain(`ZZ RQ ${STAMP}: generated two, to be taken down`);

    await signInAs("OPERATOR");
    expect((await takeDownPost(post(`${P}/${q.g2}/take-down`, { reason: "NOT_A_REASON" }), params(q.g2))).status).toBe(422);
    const res = await takeDownPost(post(`${P}/${q.g2}/take-down`, { reason: "WEAK_DISTRACTORS" }), params(q.g2));
    expect(res.status).toBe(200);
    expect(quizBankStandingSchema.parse(await res.json())).toMatchObject({ state: "DOWN", takenDownReason: "WEAK_DISTRACTORS" });
    // Again changes nothing: one stamp, the role OPERATOR, audited once.
    expect((await takeDownItem(operator(), q.g2, "WRONG_KEY")).ok).toBe(true);
    expect(await db.quizReviewStamp.findMany({ where: { questionId: q.g2 }, select: { action: true, reason: true, role: true } })).toEqual([{ action: "TAKE_DOWN", reason: "WEAK_DISTRACTORS", role: "OPERATOR" }]);
    expect(await db.auditLog.count({ where: { action: "appadmin.quizBank.takeDown", targetId: q.g2 } })).toBe(1);

    expect((await sitting(SLUG, "en", [q.g2])).some((s) => s.id === q.g2), "the phone's practice doors").toBe(false);
    expect((await listTopics(pupilCtx, { subject: "MATHS", classLevel: 7 })).find((t) => t.slug === SLUG)?.questionCount).toBe(3);
    expect((await revisionQueue(pupilCtx, { minAgeDays: 0 })).some((r) => r.questionId === q.g2), "the revision queue").toBe(false);
    await expect(reviseQuestion(pupilCtx, q.g2), "the revision player").rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await sheet(), "a worksheet").not.toContain(`ZZ RQ ${STAMP}: generated two, to be taken down`);
    // The answers stay attached.
    const item = await getItem(curator(), q.g2);
    expect(item.state).toBe("DOWN");
    expect(item.takenDownBy).toBe("ZZ RQ Operator");
    expect(item.answers).toEqual({ asked: 2, correct: 0 });
    expect(await db.quizResponse.count({ where: { questionId: q.g2 } }), "the answers given stay attached").toBe(responsesBefore);
    expect((await listQueue(curator(), { topic: topicId, state: "DOWN" })).filtered).toBe(1);

    await signInAs("CURATOR");
    const back = await putBackPost(post(`${P}/${q.g2}/put-back`), params(q.g2));
    expect(back.status).toBe(200);
    expect(quizBankStandingSchema.parse(await back.json())).toMatchObject({ state: "SERVED", takenDownAt: null });
    expect((await putBackItem(curator(), q.g2)).ok, "again is a no-op").toBe(true);
    expect((await db.quizReviewStamp.findMany({ where: { questionId: q.g2 }, orderBy: { at: "asc" }, select: { action: true, role: true } })).map((r) => `${r.action}/${r.role}`)).toEqual(["TAKE_DOWN/OPERATOR", "PUT_BACK/APP_ADMIN"]);
    expect((await revisionQueue(pupilCtx, { minAgeDays: 0 })).some((r) => r.questionId === q.g2)).toBe(true);
    expect((await sitting(SLUG, "en", [q.g2])).some((s) => s.id === q.g2)).toBe(true);
    expect(await sheet()).toContain(`ZZ RQ ${STAMP}: generated two, to be taken down`);
  });

  it("an edit in English and Hindi is audited with the words before, keeps the solver's answers, is served at once; no-change writes nothing", async () => {
    await signInAs("CURATOR");
    expect((await editPost(post(`${P}/${q.g3}/edit`, { stem: "short" }), params(q.g3))).status).toBe(422);
    expect(await editItem(curator(), q.g3, { stem: "ZZ a stem long enough", choices: ["7", "5", "12"], answerIndex: 0, solution: "ZZ fine solution.", difficulty: 1 })).toEqual({ ok: false, errorKey: "quizReview.choicesMustStay" });
    const newStem = `ZZ RQ ${STAMP}: generated three, corrected, what is 3+4?`;
    const newHindi = `ZZ RQ ${STAMP}: तीन, सुधारा गया`;
    const body = { stem: newStem, choices: ["7", "5", "12", "-7"], answerIndex: 0, solution: "ZZ: three and four make seven, corrected.", checkExpr: "3+4", difficulty: 1, translations: { hi: { stem: newHindi, choices: ["७", "५", "१२", "-७"], solution: "ZZ हल, सुधारा गया।" } } };
    const res = await editPost(post(`${P}/${q.g3}/edit`, body), params(q.g3));
    expect(res.status).toBe(200);
    expect(quizBankStandingSchema.parse(await res.json()).editedAfterSolvingAt).not.toBeNull();
    const row = await db.quizQuestion.findUniqueOrThrow({ where: { id: q.g3 }, select: { stem: true, editedAfterSolvingAt: true, generation: true, takenDownAt: true } });
    expect(row.stem).toBe(newStem);
    expect(row.takenDownAt).toBeNull();
    expect(readGeneration(row.generation).solverAnswers).toEqual([0, 0, 1, 0, 0]);
    const stamp = await db.quizReviewStamp.findFirstOrThrow({ where: { questionId: q.g3, action: "EDIT" }, select: { before: true, role: true } });
    expect(stamp.role).toBe("APP_ADMIN");
    expect(JSON.parse(stamp.before!)).toMatchObject({ stem: `ZZ RQ ${STAMP}: generated three, to be edited`, translations: { hi: { stem: `ZZ RQ ${STAMP}: तीन` }, mr: null } });
    const audit = await db.auditLog.findFirstOrThrow({ where: { action: "appadmin.quizBank.edit", targetId: q.g3 }, select: { meta: true } });
    const meta = (typeof audit.meta === "string" ? JSON.parse(audit.meta) : audit.meta) as { changed: string[] };
    expect(meta.changed).toEqual(expect.arrayContaining(["stem", "solution", "hi.stem", "hi.solution"]));
    const item = await getItem(curator(), q.g3);
    expect(item.translations.hi?.stale, "the Hindi was corrected in the same press").toBe(false);
    expect((await sitting(SLUG, "en")).find((s) => s.id === q.g3)?.stem).toBe(newStem);
    expect((await sitting(SLUG, "hi")).find((s) => s.id === q.g3)?.stem).toBe(newHindi);
    // The same words again: nothing written.
    expect((await editItem(curator(), q.g3, body)).ok).toBe(true);
    expect(await db.quizReviewStamp.count({ where: { questionId: q.g3, action: "EDIT" } })).toBe(1);
    // One writer: the bank editor and the translations page refuse a generated item.
    expect(await updateBankQuestion(curator(), q.g3, { difficulty: 1, stem: "ZZ another stem here", choices: ["7", "5", "12", "-7"], answerIndex: 0, solution: "ZZ another solution." } as Parameters<typeof updateBankQuestion>[2])).toEqual({ ok: false, errorKey: "quizReview.editOnDesk" });
    expect(await reviewTranslation(curator(), q.g3, { language: "hi", reviewed: true })).toEqual({ ok: false, errorKey: "quizReview.editOnDesk" });
  });

  it("an item whose figure failed is held, shown as such, and served once a figure is stored", async () => {
    const item = await getItem(curator(), q.g4);
    expect(item).toMatchObject({ state: "HELD", needsFigure: true, figureError: "ZZ: the figure could not be drawn" });
    expect((await sitting(SLUG, "en")).some((s) => s.id === q.g4)).toBe(false);
    expect((await listQueue(curator(), { topic: topicId })).groups.find((g) => g.topicId === topicId)?.held).toBe(1);
    // The loader stores a drawing (simulated: the row names a file), and the hold is gone.
    await db.quizQuestion.update({ where: { id: q.g4 }, data: { imageKey: `zz-rq-figure-${STAMP}`, imageAlt: "ZZ a figure" } });
    expect((await getItem(curator(), q.g4)).state).toBe("SERVED");
    expect((await listTopics(pupilCtx, { subject: "MATHS", classLevel: 7 })).find((t) => t.slug === SLUG)?.questionCount).toBe(5);
    await db.quizQuestion.update({ where: { id: q.g4 }, data: { imageKey: null, imageAlt: null } });
  });

  it("the walk skips what was skipped, and the counts are the desk's", async () => {
    const first = await nextItem(curator(), { topic: topicId });
    expect(first.item?.id).toBe(q.g1);
    const second = await nextItem(curator(), { topic: topicId, skip: q.g1 });
    expect(second.item?.id).not.toBe(q.g1);
    const list = await listQueue(operator(), { topic: topicId });
    expect(list.reviewers.find((r) => r.name === "ZZ RQ Operator")?.takenDown).toBe(1);
    expect(list.reviewers.find((r) => r.name === "ZZ RQ Curator")).toMatchObject({ edits: 1, putBack: 1 });
    expect((await listQueue(curator(), {})).mine.total).toBeGreaterThanOrEqual(2);
  });

  it("the review queue's accepted items (10–11 Oct) stay served, with nothing taken down", async () => {
    const accepted = await db.quizQuestion.findMany({ where: { generated: true, reviewedAt: { not: null }, topic: { slug: { not: { startsWith: "zz-" } } } }, select: { takenDownAt: true, needsFigure: true, imageKey: true, generated: true, topic: { select: { slug: true } } } });
    for (const row of accepted) expect(isServed(row), row.topic.slug).toBe(true);
    const force = accepted.filter((r) => r.topic.slug === "balbharati-science-8-force-and-pressure");
    if (force.length) expect(force.every((r) => isServed(r))).toBe(true);
  });
});

describe("the teachers' question gig, switched off", () => {
  // Since 15 Oct 2026 the gig is the QUESTION_GIG platform feature (src/lib/platform-features.ts): off here, the rest on.
  // TEACHER_SESSIONS off too (17 Oct 2026): the payee door stays open while teacher sessions are on, since a teacher's
  // sold guidance seats are paid to the same UPI id (payeeDoorOpen in question-gig.ts).
  beforeAll(() => setFeaturesForTests(PLATFORM_FEATURES.filter((code) => code !== "QUESTION_GIG" && code !== "TEACHER_SESSIONS")));
  afterAll(() => setFeaturesForTests([...PLATFORM_FEATURES]));

  it("is off, in one place: the platform feature (the old constant stays false for the help index alone)", () => {
    expect(QUESTION_GIG_FOR_TEACHERS).toBe(false);
  });

  it("the teacher's nav drops its entry while the feature is off, and its pages answer 404", async () => {
    expect(NAV.TEACHER.find((item) => item.href === "/teacher/contributions")?.feature).toBe("QUESTION_GIG");
    expect(hiddenByFeature(NAV.TEACHER, PLATFORM_FEATURES.filter((code) => code !== "QUESTION_GIG"))).toContain("/teacher/contributions");
    await signInAs("TEACHER");
    await expect(ContributionsLayout({ children: null })).rejects.toThrow();
  });

  it("its doors answer 404 to a teacher after the role check, 403 to another role, 401 signed out; the catalog says so for the sweep", async () => {
    await signInAs("TEACHER");
    expect((await gigQuestionsGet()).status).toBe(404);
    expect((await gigPayeePost(post("/api/v1/gigs/payee", {}))).status).toBe(404);
    await signInAs("ADMIN");
    expect((await gigQuestionsGet()).status).toBe(403);
    await signInAs("OUT");
    expect((await gigQuestionsGet()).status).toBe(401);
    const doors = ENDPOINTS.filter((e) => e.path.startsWith("/api/v1/gigs/questions") || e.path === "/api/v1/gigs/payee");
    expect(doors).toHaveLength(8);
    // The catalog names the feature on all eight (the session's gate answers 404 FEATURE_OFF while it is off); the payee door decides in its handler.
    for (const door of doors) expect(door.feature, `${door.method} ${door.path}`).toBe("QUESTION_GIG");
    // The content team's queue of teachers' contributions stays readable.
    expect(ENDPOINTS.some((e) => e.path === "/api/v1/appadmin/contributions" && !e.statusByRole)).toBe(true);
  });
});
