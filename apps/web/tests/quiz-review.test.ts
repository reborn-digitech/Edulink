/**
 * The generated bank's review queue (src/lib/quiz-review.ts, the doors under /api/v1/appadmin/quiz-review)
 * and the teachers' question gig switched off (src/lib/question-gig.ts), 10 October 2026.
 *
 * Proved here: the doors open to the content team and the operator and to nobody else (a school's ADMIN
 * and TEACHER 403, signed out 401); an unstamped generated item never reaches a pupil through the phone's
 * practice doors, and does once stamped; its Hindi row is served only once that language is stamped;
 * a discard is never served, leaves the queue and is idempotent; an edit is audited, keeps the solver's
 * answers with the edited-after-solving mark and takes the language stamps off; an item whose figure is
 * not drawn cannot be accepted; the operator's stamp records the role OPERATOR; and the gig flag hides the
 * nav entry, 404s the pages and the doors, and is in the catalog for the sweep. Every row is a ZZ row
 * made here and removed after; nothing else is touched.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { QUESTION_GIG_FOR_TEACHERS, practiceBeganSchema, practiceNextSchema, quizReviewListSchema, quizReviewNextSchema, quizReviewStampedSchema } from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { acceptItem, checkEdit, discardItem, editAndAccept, getItem, inFirstBand, listQueue, nextItem, parseSkip, readGeneration, stampTranslation, startOfIndianDay } from "@/lib/quiz-review";
import { isServed, isTranslationServed, servedTranslationWhere } from "@/lib/quiz-served";
import { listTopics } from "@/lib/quiz";
import { reviewTranslation } from "@/lib/translation-review";
import { NAV } from "@/lib/nav";
import { ENDPOINTS } from "@/lib/api-catalog";
import { GET as listGet } from "@/app/api/v1/appadmin/quiz-review/route";
import { GET as nextGet } from "@/app/api/v1/appadmin/quiz-review/next/route";
import { GET as oneGet } from "@/app/api/v1/appadmin/quiz-review/[questionId]/route";
import { POST as stampPost } from "@/app/api/v1/appadmin/quiz-review/[questionId]/stamp/route";
import { POST as editPost } from "@/app/api/v1/appadmin/quiz-review/[questionId]/edit/route";
import { POST as discardPost } from "@/app/api/v1/appadmin/quiz-review/[questionId]/discard/route";
import { POST as languagePost } from "@/app/api/v1/appadmin/quiz-review/[questionId]/stamp-translation/route";
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
      data: { topicId: topic, difficulty, stem, choices: JSON.stringify(["7", "5", "12", "-7"]), answerIndex: 0, solution: "ZZ: three and four make seven.", checkExpr: "3+4", source: "generated against ZZ", licence: "test", generated: true, generatedBoard: "NCERT", generation: GENERATION(extra) },
      select: { id: true },
    })
  ).id;
}

/** A whole sitting through the phone's doors: every question served, in the language asked. */
async function sitting(slug: string, language: "en" | "hi"): Promise<{ id: string; stem: string }[]> {
  await signInAs("PUPIL");
  const began = practiceBeganSchema.parse(await (await beginPost(post("/api/v1/practice/attempts", { slug, language }))).json());
  const served: { id: string; stem: string }[] = [];
  let question = began.question;
  let n = 0;
  while (question && n++ < 20) {
    served.push({ id: question.questionId, stem: question.stem });
    const answered = await answerPost(post("/api/v1/practice/answer", { attemptId: began.attemptId, questionId: question.questionId, chosenIndex: 0, clientId: `zz-rq-${STAMP}-${served.length}-${language}-${Math.random()}` }));
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
  q.g2 = await generated(`ZZ RQ ${STAMP}: generated two, to be discarded`, 2);
  q.g3 = await generated(`ZZ RQ ${STAMP}: generated three, to be edited`, 3);
  await db.quizQuestionTranslation.create({ data: { questionId: q.g3, language: "hi", stem: `ZZ RQ ${STAMP}: तीन`, choices: JSON.stringify(["७", "५", "१२", "-७"]), solution: "ZZ हल।" } });
  q.g4 = await generated(`ZZ RQ ${STAMP}: generated four, needs a figure`, 4, { figure: { kind: "geometry", spec: { points: [] } }, needsFigure: true });
  newTopicId = (await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 7, chapter: "ZZ RQ New", name: `ZZ RQ New ${STAMP}`, slug: NEW_SLUG }, select: { id: true } })).id;
  q.lonely = await generated(`ZZ RQ ${STAMP}: the only item of a new chapter`, 1, {}, newTopicId);
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
  it("an authored row is served; a generated one only once stamped; a generated language row only once that language is stamped", () => {
    expect(isServed({ generated: false, reviewedAt: null })).toBe(true);
    expect(isServed({ generated: true, reviewedAt: null })).toBe(false);
    expect(isServed({ generated: true, reviewedAt: new Date() })).toBe(true);
    expect(isTranslationServed({ generated: false, hiReviewedAt: null, mrReviewedAt: null }, "hi")).toBe(true);
    expect(isTranslationServed({ generated: true, hiReviewedAt: null, mrReviewedAt: new Date() }, "hi")).toBe(false);
    expect(isTranslationServed({ generated: true, hiReviewedAt: null, mrReviewedAt: new Date() }, "mr")).toBe(true);
    expect(isTranslationServed({ generated: true, hiReviewedAt: new Date(), mrReviewedAt: new Date() }, "ur")).toBe(false);
    expect(servedTranslationWhere("ur")).toEqual({ generated: false });
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

  it("an edit keeps the options' count, refuses a repeat, an out-of-range key and a check that does not come to the key", () => {
    const base = { stem: "ZZ what is 3+4?", choices: ["7", "5", "12", "-7"], answerIndex: 0, solution: "ZZ three and four.", difficulty: 1 };
    expect(checkEdit(base, 4)).toBeNull();
    expect(checkEdit({ ...base, choices: ["7", "5", "12"] }, 4)).toBe("quizReview.choicesMustStay");
    expect(checkEdit({ ...base, choices: ["7", "7", "12", "-7"] }, 4)).toBe("quizReview.choicesRepeat");
    expect(checkEdit({ ...base, answerIndex: 4 }, 4)).toBe("quizReview.keyOutOfRange");
    expect(checkEdit({ ...base, checkExpr: "7" }, 4)).toBe("quizReview.checkExprBare");
    expect(checkEdit({ ...base, checkExpr: "3+5" }, 4)).toBe("quizReview.checkExprMismatch");
    expect(checkEdit({ ...base, checkExpr: "3+4" }, 4)).toBeNull();
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
      expect(body.groups.find((g) => g.topicId === topicId)?.levels).toEqual([1, 1, 1, 1, 0, 0]);
      const next = await nextGet(get(`${P}/next?topic=${topicId}`));
      expect(next.status, who).toBe(200);
      expect(quizReviewNextSchema.parse(await next.json()).item?.id).toBe(q.g1);
      const one = await oneGet(get(`${P}/${q.g1}`), params(q.g1));
      expect(one.status, who).toBe(200);
      const item = quizReviewNextSchema.parse(await one.json()).item!;
      expect(item.solverAnswers).toEqual([0, 0, 1, 0, 0]);
      expect(item.distractorReasons[2]).toBe("confuses the sign");
      expect(item.translations.hi?.stampedAt).toBeNull();
      expect(item.translations.mr).toBeNull();
      expect((await oneGet(get(`${P}/${q.authored}`), params(q.authored))).status, "an authored question is not the queue's").toBe(404);
      expect((await stampPost(post(`${P}/zz-no-such/stamp`), params("zz-no-such"))).status).toBe(404);
    }
    for (const who of ["ADMIN", "TEACHER"] as const) {
      await signInAs(who);
      expect((await listGet(get(P))).status, who).toBe(403);
      expect((await nextGet(get(`${P}/next`))).status, who).toBe(403);
      expect((await oneGet(get(`${P}/${q.g1}`), params(q.g1))).status, who).toBe(403);
      expect((await stampPost(post(`${P}/${q.g1}/stamp`), params(q.g1))).status, who).toBe(403);
      expect((await editPost(post(`${P}/${q.g1}/edit`, {}), params(q.g1))).status, who).toBe(403);
      expect((await discardPost(post(`${P}/${q.g1}/discard`, { reason: "WRONG_KEY" }), params(q.g1))).status, who).toBe(403);
      expect((await languagePost(post(`${P}/${q.g1}/stamp-translation`, { language: "hi" }), params(q.g1))).status, who).toBe(403);
    }
    await signInAs("OUT");
    expect((await listGet(get(P))).status).toBe(401);
    // Nothing above changed a row.
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: q.g1 }, select: { reviewedAt: true } })).reviewedAt).toBeNull();
  });
});

describe("the stamp and serving", () => {
  it("an unstamped generated item never reaches the phone's practice doors, and a chapter of nothing but waiting items does not list", async () => {
    const served = await sitting(SLUG, "en");
    expect(served.map((s) => s.id)).toEqual([q.authored]);
    const topics = await listTopics({ ...ctx(ids.pupil, {}), role: "STUDENT", schoolId, membershipId: pupilMembershipId } as ActiveContext, { subject: "MATHS", classLevel: 7 });
    expect(topics.find((t) => t.slug === SLUG)?.questionCount).toBe(1);
    expect(topics.some((t) => t.slug === NEW_SLUG)).toBe(false);
  });

  it("accepted, it is served in English; its Hindi waits for the Hindi stamp, then is served", async () => {
    await signInAs("CURATOR");
    const res = await stampPost(post(`${P}/${q.g1}/stamp`), params(q.g1));
    expect(res.status).toBe(200);
    expect(quizReviewStampedSchema.parse(await res.json()).reviewedAt).not.toBeNull();
    // Again is a no-op: one stamp row.
    expect((await acceptItem(curator(), q.g1)).ok).toBe(true);
    expect(await db.quizReviewStamp.count({ where: { questionId: q.g1, action: "ACCEPT" } })).toBe(1);

    const inHindi = await sitting(SLUG, "hi");
    expect(inHindi.map((s) => s.id).sort()).toEqual([q.authored, q.g1].sort());
    expect(inHindi.find((s) => s.id === q.g1)!.stem).toBe(`ZZ RQ ${STAMP}: generated one, what is 3+4?`);

    await signInAs("CURATOR");
    const hi = await languagePost(post(`${P}/${q.g1}/stamp-translation`, { language: "hi" }), params(q.g1));
    expect(hi.status).toBe(200);
    expect(quizReviewStampedSchema.parse(await hi.json()).hiStampedAt).not.toBeNull();
    const mr = await languagePost(post(`${P}/${q.g1}/stamp-translation`, { language: "mr" }), params(q.g1));
    expect(mr.status, "no Marathi row to stamp").toBe(422);

    const stamped = await sitting(SLUG, "hi");
    expect(stamped.find((s) => s.id === q.g1)!.stem).toBe(`ZZ RQ ${STAMP}: 3+4 कितना है?`);
    const rows = await db.quizReviewStamp.findMany({ where: { questionId: q.g1 }, orderBy: { at: "asc" }, select: { action: true, language: true, role: true, reviewerUserId: true } });
    expect(rows).toEqual([
      { action: "ACCEPT", language: null, role: "APP_ADMIN", reviewerUserId: ids.curator },
      { action: "STAMP_TRANSLATION", language: "hi", role: "APP_ADMIN", reviewerUserId: ids.curator },
    ]);
    // The native-review page writes through the same writer: taking the Hindi off there is a stamp row here.
    expect(await reviewTranslation(curator(), q.g1, { language: "hi", reviewed: false })).toEqual({ ok: true, reviewed: false });
    expect(await db.quizReviewStamp.count({ where: { questionId: q.g1, action: "UNSTAMP_TRANSLATION" } })).toBe(1);
    expect((await sitting(SLUG, "hi")).find((s) => s.id === q.g1)!.stem).toBe(`ZZ RQ ${STAMP}: generated one, what is 3+4?`);
  });

  it("a discard is never served, leaves the queue, is idempotent, and cannot then be accepted", async () => {
    await signInAs("OPERATOR");
    expect((await discardPost(post(`${P}/${q.g2}/discard`, { reason: "NOT_A_REASON" }), params(q.g2))).status).toBe(422);
    const res = await discardPost(post(`${P}/${q.g2}/discard`, { reason: "WEAK_DISTRACTORS" }), params(q.g2));
    expect(res.status).toBe(200);
    expect(quizReviewStampedSchema.parse(await res.json()).discardedAt).not.toBeNull();
    expect((await discardItem(operator(), q.g2, "WEAK_DISTRACTORS")).ok).toBe(true);
    expect(await db.quizReviewStamp.findMany({ where: { questionId: q.g2 }, select: { action: true, reason: true, role: true } })).toEqual([{ action: "DISCARD", reason: "WEAK_DISTRACTORS", role: "OPERATOR" }]);
    expect(await acceptItem(operator(), q.g2)).toEqual({ ok: false, errorKey: "quizReview.alreadyDiscarded" });
    expect((await stampPost(post(`${P}/${q.g2}/stamp`), params(q.g2))).status).toBe(422);
    const list = await listQueue(operator(), { topic: topicId });
    expect(list.filtered).toBe(2);
    // This run's operator by name: the bank's real operator (who has stamped items too) may sort first (integration, 11 Oct 2026).
    expect(list.reviewers.find((r) => r.role === "OPERATOR" && r.name === "ZZ RQ Operator")?.discarded).toBeGreaterThanOrEqual(1);
    expect((await sitting(SLUG, "en")).some((s) => s.id === q.g2)).toBe(false);
    expect(await db.auditLog.count({ where: { action: "appadmin.quizReview.discard", targetId: q.g2 } })).toBe(1);
  });

  it("an edit is audited, keeps the solver's answers with the mark, takes the language stamps off, and serves the new words", async () => {
    expect((await stampTranslation(curator(), q.g3, "hi")).ok).toBe(true);
    expect(await editAndAccept(curator(), q.g3, { stem: "ZZ a stem long enough", choices: ["7", "5", "12"], answerIndex: 0, solution: "ZZ fine solution.", difficulty: 3 })).toEqual({ ok: false, errorKey: "quizReview.choicesMustStay" });
    await signInAs("CURATOR");
    expect((await editPost(post(`${P}/${q.g3}/edit`, { stem: "short" }), params(q.g3))).status).toBe(422);
    const newStem = `ZZ RQ ${STAMP}: generated three, corrected, what is 3+4?`;
    const res = await editPost(post(`${P}/${q.g3}/edit`, { stem: newStem, choices: ["7", "5", "12", "-7"], answerIndex: 0, solution: "ZZ: three and four make seven, corrected.", checkExpr: "3+4", difficulty: 2 }), params(q.g3));
    expect(res.status).toBe(200);
    const row = await db.quizQuestion.findUniqueOrThrow({ where: { id: q.g3 }, select: { stem: true, difficulty: true, reviewedAt: true, reviewedBy: true, hiReviewedAt: true, editedAfterSolvingAt: true, generation: true } });
    expect(row.stem).toBe(newStem);
    expect(row.difficulty).toBe(2);
    expect(row.reviewedBy).toBe(ids.curator);
    expect(row.hiReviewedAt, "the Hindi was read against the old English").toBeNull();
    expect(row.editedAfterSolvingAt).not.toBeNull();
    expect(readGeneration(row.generation).solverAnswers).toEqual([0, 0, 1, 0, 0]);
    const stamp = await db.quizReviewStamp.findFirstOrThrow({ where: { questionId: q.g3, action: "EDIT_ACCEPT" }, select: { before: true } });
    expect(JSON.parse(stamp.before!)).toMatchObject({ stem: `ZZ RQ ${STAMP}: generated three, to be edited`, difficulty: 3 });
    const audit = await db.auditLog.findFirstOrThrow({ where: { action: "appadmin.quizReview.edit", targetId: q.g3 }, select: { meta: true } });
    expect(JSON.stringify(audit.meta)).toContain("stem");
    const item = await getItem(curator(), q.g3);
    expect(item.editedAfterSolvingAt).not.toBeNull();
    expect(item.translations.hi?.stale).toBe(true);
    expect((await sitting(SLUG, "en")).find((s) => s.id === q.g3)?.stem).toBe(newStem);
    // Accepted, it is no longer the queue's to edit.
    expect(await editAndAccept(curator(), q.g3, { stem: newStem, choices: ["7", "5", "12", "-7"], answerIndex: 0, solution: "ZZ again, a second time.", difficulty: 2 })).toEqual({ ok: false, errorKey: "quizReview.alreadyAccepted" });
  });

  it("an item whose figure is not drawn cannot be accepted, and waits; the queue's next skips what was skipped", async () => {
    expect(await acceptItem(curator(), q.g4)).toEqual({ ok: false, errorKey: "quizReview.figureNotDrawn" });
    const next = await nextItem(curator(), { topic: topicId });
    expect(next.item?.id).toBe(q.g4);
    expect(next.item?.needsFigure).toBe(true);
    expect(next.remaining).toBe(1);
    expect((await nextItem(curator(), { topic: topicId, skip: q.g4 })).item).toBeNull();
    expect((await sitting(SLUG, "en")).some((s) => s.id === q.g4)).toBe(false);
  });

  it("the operator's stamp records the role OPERATOR, and the new chapter lists once its item is served", async () => {
    expect((await acceptItem(operator(), q.lonely)).ok).toBe(true);
    expect((await db.quizReviewStamp.findFirstOrThrow({ where: { questionId: q.lonely }, select: { role: true } })).role).toBe("OPERATOR");
    const topics = await listTopics({ ...ctx(ids.pupil, {}), role: "STUDENT", schoolId, membershipId: pupilMembershipId } as ActiveContext, { subject: "MATHS", classLevel: 7 });
    expect(topics.find((t) => t.slug === NEW_SLUG)?.questionCount).toBe(1);
    const mine = await listQueue(operator(), { topic: topicId });
    expect(mine.mine.total).toBeGreaterThanOrEqual(2);
  });
});

describe("the teachers' question gig, switched off", () => {
  it("is off, in one place", () => {
    expect(QUESTION_GIG_FOR_TEACHERS).toBe(false);
  });

  it("the teacher's nav has no entry for it, and its pages answer 404", () => {
    expect(NAV.TEACHER.some((item) => item.href.startsWith("/teacher/contributions"))).toBe(false);
    expect(() => ContributionsLayout({ children: null })).toThrow();
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
    for (const door of doors) expect(door.statusByRole?.TEACHER, `${door.method} ${door.path}`).toBe(404);
    // The content team's queue of teachers' contributions stays readable.
    expect(ENDPOINTS.some((e) => e.path === "/api/v1/appadmin/contributions" && !e.statusByRole)).toBe(true);
  });
});
