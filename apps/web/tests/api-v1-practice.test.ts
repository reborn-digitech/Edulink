/**
 * The /api/v1/practice handlers — the phone's practice player and the
 * teacher's worksheets — invoked directly with a primed session the way
 * api-v1-operator.test.ts does: 401 signed out, 403 for the wrong role (a
 * teacher cannot play, a pupil cannot print), 200 with a body the contract
 * parses, and a refusal for every write. Everything is ZZ and made here: a
 * school, a pupil and a teacher, a class with a chapter set for it, and two
 * chapters of three and two questions. Deleted afterwards; nothing else is
 * touched.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  practiceAnsweredSchema,
  practiceBeganSchema,
  practiceNextSchema,
  practiceRevealedSchema,
  practiceRevisionAnsweredSchema,
  practiceRevisionQuestionSchema,
  practiceRevisionSchema,
  practiceWorksheetSchema,
  practiceWorksheetTopicsSchema,
} from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as beginPost } from "@/app/api/v1/practice/attempts/route";
import { GET as nextGet } from "@/app/api/v1/practice/next/route";
import { POST as answerPost } from "@/app/api/v1/practice/answer/route";
import { POST as revealPost } from "@/app/api/v1/practice/reveal/route";
import { GET as revisionGet } from "@/app/api/v1/practice/revision/route";
import { GET as revisionQuestionGet } from "@/app/api/v1/practice/revision/question/route";
import { POST as revisionAnswerPost } from "@/app/api/v1/practice/revision/answer/route";
import { GET as worksheetsGet } from "@/app/api/v1/practice/worksheets/route";
import { GET as sheetGet } from "@/app/api/v1/practice/worksheets/sheet/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SLUG = `zz-v1p-${STAMP}`;
const REV_SLUG = `zz-v1p-rev-${STAMP}`;
const TOPIC_NAME = `ZZ V1P Fractions ${STAMP}`;
const NOWHERE = "czz" + "0".repeat(22);
const P = "/api/v1/practice";

let schoolId = "";
let pupilUserId = "";
let teacherUserId = "";
let pupilMembershipId = "";
let topicId = "";
let revTopicId = "";
let assignmentId = "";
const q: string[] = [];
let revAnswered = "";
let revNever = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function signInAs(who: "PUPIL" | "TEACHER") {
  __resetCookies();
  await createSession(who === "PUPIL" ? pupilUserId : teacherUserId, { schoolId, role: who === "PUPIL" ? "STUDENT" : "TEACHER" });
}

function pupilHandlers() {
  return [
    { name: "attempts", call: () => beginPost(post(`${P}/attempts`, { slug: SLUG })) },
    { name: "next", call: () => nextGet(get(`${P}/next?attemptId=${NOWHERE}`)) },
    { name: "answer", call: () => answerPost(post(`${P}/answer`, { attemptId: NOWHERE, questionId: q[0], chosenIndex: 0, clientId: `zz-gate-${STAMP}` })) },
    { name: "reveal", call: () => revealPost(post(`${P}/reveal`, { attemptId: NOWHERE, questionId: q[0] })) },
    { name: "revision", call: () => revisionGet(get(`${P}/revision`)) },
    { name: "revision/question", call: () => revisionQuestionGet(get(`${P}/revision/question?questionId=${revAnswered}`)) },
    { name: "revision/answer", call: () => revisionAnswerPost(post(`${P}/revision/answer`, { questionId: revAnswered, chosenIndex: 0, clientId: `zz-gate-${STAMP}` })) },
  ];
}
function teacherHandlers() {
  return [
    { name: "worksheets", call: () => worksheetsGet() },
    { name: "worksheets/sheet", call: () => sheetGet(get(`${P}/worksheets/sheet?slug=${SLUG}&level=1`)) },
  ];
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ V1P School ${STAMP}`, slug: `zz-v1p-${STAMP}`, code: `ZP${String(STAMP).slice(-6)}`, contactEmail: `zz-v1p-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const [pupil, teacher] = await Promise.all([
    db.user.create({ data: { name: "ZZ V1P Pupil", email: `zz-v1p-pupil-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1P Teacher", email: `zz-v1p-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  pupilUserId = pupil.id;
  teacherUserId = teacher.id;
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZVP${STAMP}` }, select: { id: true } });
  pupilMembershipId = pm.id;
  const tm = await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const klass = await db.class.create({ data: { schoolId, name: "ZZ V1P Class 5", gradeLevel: "5", joinCode: `ZP${String(STAMP).slice(-6)}` }, select: { id: true } });
  await db.classTeacher.create({ data: { classId: klass.id, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId: klass.id, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } });

  // The chapter played: one question on each of the first three rungs, the
  // right answer always first; the first also read in Hindi.
  const topic = await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 5, chapter: "ZZ Chapter 1", name: TOPIC_NAME, slug: SLUG, summary: "ZZ halves and quarters." }, select: { id: true } });
  topicId = topic.id;
  for (const difficulty of [1, 2, 3]) {
    const row = await db.quizQuestion.create({
      data: { topicId, difficulty, stem: `ZZ question at level ${difficulty}?`, choices: JSON.stringify(["right", "wrong", "also wrong"]), answerIndex: 0, solution: `ZZ working for level ${difficulty}.`, source: "test", licence: "test" },
      select: { id: true },
    });
    q.push(row.id);
  }
  await db.quizQuestionTranslation.create({ data: { questionId: q[0]!, language: "hi", stem: "ZZ स्तर एक का प्रश्न?", choices: JSON.stringify(["सही", "गलत", "यह भी गलत"]), solution: "ZZ हल।" } });

  // The chapter revised: one question missed three days ago in a sitting
  // since finished, and one never served at all.
  const revTopic = await db.quizTopic.create({ data: { subject: "SCIENCE", classLevel: 5, chapter: "ZZ Chapter 2", name: `ZZ V1P Plants ${STAMP}`, slug: REV_SLUG }, select: { id: true } });
  revTopicId = revTopic.id;
  const [answered, never] = await Promise.all(
    [1, 2].map((n) =>
      db.quizQuestion.create({
        data: { topicId: revTopicId, difficulty: 1, stem: `ZZ plants question ${n}?`, choices: JSON.stringify(["roots", "leaves"]), answerIndex: 0, solution: "ZZ roots take up water.", source: "test", licence: "test" },
        select: { id: true },
      }),
    ),
  );
  revAnswered = answered!.id;
  revNever = never!.id;
  const old = await db.quizAttempt.create({ data: { schoolId, studentMembershipId: pm.id, topicId: revTopicId, finishedAt: new Date() }, select: { id: true } });
  await db.quizResponse.create({ data: { schoolId, attemptId: old.id, questionId: revAnswered, chosenIndex: 1, correct: false, servedDifficulty: 1, answeredAt: new Date(Date.now() - 3 * 86_400_000) } });

  const set = await db.practiceAssignment.create({ data: { schoolId, classId: klass.id, topicId, targetLevel: 2, note: "ZZ climb to L2", createdById: tm.id }, select: { id: true } });
  assignmentId = set.id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [pupilUserId, teacherUserId].filter(Boolean) } } });
  // The school's rows (sittings, answers, rungs, badges, the chapter set, the audit) go with it.
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.quizTopic.deleteMany({ where: { id: { in: [topicId, revTopicId].filter(Boolean) } } });
  await db.user.deleteMany({ where: { id: { in: [pupilUserId, teacherUserId].filter(Boolean) } } });
  await db.$disconnect();
});

describe("the gates", () => {
  it("every handler answers 401 signed out, in the contract's envelope", async () => {
    __resetCookies();
    for (const h of [...pupilHandlers(), ...teacherHandlers()]) {
      const res = await h.call();
      expect(res.status, h.name).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });

  it("a teacher cannot play and a pupil cannot print: 403, not a redirect", async () => {
    await signInAs("TEACHER");
    for (const h of pupilHandlers()) {
      const res = await h.call();
      expect(res.status, `teacher ${h.name}`).toBe(403);
      expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
    }
    await signInAs("PUPIL");
    for (const h of teacherHandlers()) {
      const res = await h.call();
      expect(res.status, `pupil ${h.name}`).toBe(403);
    }
  });
});

describe("as the pupil", () => {
  let attemptId = "";
  beforeAll(() => signInAs("PUPIL"));

  it("a sitting opens on the chapter's first rung, never with the answer, in the language asked for; a body naming neither or both is 422", async () => {
    for (const bad of [{}, { slug: SLUG, assignmentId }]) {
      const res = await beginPost(post(`${P}/attempts`, bad));
      expect(res.status).toBe(422);
      expect(await res.json()).toMatchObject({ code: "BAD_REQUEST" });
    }
    expect((await beginPost(post(`${P}/attempts`, { slug: `zz-nowhere-${STAMP}` }))).status).toBe(404);

    const res = await beginPost(post(`${P}/attempts`, { slug: SLUG, language: "en" }));
    expect(res.status).toBe(200);
    const raw = (await res.json()) as { question: Record<string, unknown> };
    expect(Object.keys(raw.question)).not.toContain("answerIndex");
    expect(Object.keys(raw.question)).not.toContain("solution");
    const body = practiceBeganSchema.parse(raw);
    attemptId = body.attemptId;
    expect(body.resumed).toBe(false);
    expect(body.assignment).toBeNull();
    expect(body.topic).toMatchObject({ slug: SLUG, name: TOPIC_NAME, chapter: "ZZ Chapter 1", subject: "MATHS", classLevel: 5, questionCount: 3, level: 1, badgeEarned: false });
    expect(body.question).toMatchObject({ questionId: q[0], difficulty: 1, askedCount: 0, totalCount: 3, choices: ["right", "wrong", "also wrong"] });

    // The same sitting, read in Hindi: the stem and the options translate, the order does not move.
    const hindi = practiceBeganSchema.parse(await (await beginPost(post(`${P}/attempts`, { slug: SLUG, language: "hi" }))).json());
    expect(hindi.attemptId).toBe(attemptId);
    expect(hindi.question).toMatchObject({ questionId: q[0], stem: "ZZ स्तर एक का प्रश्न?", choices: ["सही", "गलत", "यह भी गलत"] });
  });

  it("an answer comes back marked with the working; the outbox's second delivery gets the stored verdict and climbs nothing", async () => {
    const answer = { attemptId, questionId: q[0], chosenIndex: 0, clientId: `zz-tap-${STAMP}` };
    const first = await answerPost(post(`${P}/answer`, answer));
    expect(first.status).toBe(200);
    const marked = practiceAnsweredSchema.parse(await first.json());
    expect(marked).toMatchObject({ replayed: false, result: { correct: true, answerIndex: 0, solution: "ZZ working for level 1.", newLevel: 1, finished: false } });

    const again = practiceAnsweredSchema.parse(await (await answerPost(post(`${P}/answer`, answer))).json());
    expect(again).toMatchObject({ replayed: true, result: { correct: true, answerIndex: 0 } });
    expect(await db.quizResponse.count({ where: { attemptId } })).toBe(1);
    const rung = await db.quizMastery.findUniqueOrThrow({ where: { studentMembershipId_topicId: { studentMembershipId: pupilMembershipId, topicId } } });
    expect(rung).toMatchObject({ seenCount: 1, correctCount: 1, streakRight: 1 });

    // Refusals: no client id is 422; somebody else's (or nobody's) sitting is a 404.
    const noId = await answerPost(post(`${P}/answer`, { attemptId, questionId: q[1], chosenIndex: 0 }));
    expect(noId.status).toBe(422);
    const nowhere = await answerPost(post(`${P}/answer`, { ...answer, attemptId: NOWHERE }));
    expect(nowhere.status).toBe(404);
    expect(await nowhere.json()).toMatchObject({ code: "NOT_FOUND" });
  });

  it("next serves the nearest unseen rung, and opening the chapter again picks the sitting up half-way", async () => {
    expect((await nextGet(get(`${P}/next?attemptId=not-an-id`))).status).toBe(422);
    const next = practiceNextSchema.parse(await (await nextGet(get(`${P}/next?attemptId=${attemptId}`))).json());
    expect(next.question).toMatchObject({ questionId: q[1], difficulty: 2, askedCount: 1, totalCount: 3 });

    const resumed = practiceBeganSchema.parse(await (await beginPost(post(`${P}/attempts`, { slug: SLUG }))).json());
    expect(resumed).toMatchObject({ attemptId, resumed: true, question: { questionId: q[1], askedCount: 1 } });
  });

  it("revealing shows the working and forfeits the badge once; the last answer finishes the chapter without it", async () => {
    const first = await revealPost(post(`${P}/reveal`, { attemptId, questionId: q[1] }));
    expect(first.status).toBe(200);
    expect(practiceRevealedSchema.parse(await first.json())).toEqual({ solution: "ZZ working for level 2.", answerIndex: 0, badgeForfeited: true });
    const second = practiceRevealedSchema.parse(await (await revealPost(post(`${P}/reveal`, { attemptId, questionId: q[1] }))).json());
    expect(second.badgeForfeited).toBe(false);
    // A question from another chapter is not in this sitting.
    expect((await revealPost(post(`${P}/reveal`, { attemptId, questionId: revNever }))).status).toBe(404);
    expect((await revealPost(post(`${P}/reveal`, {}))).status).toBe(422);

    const last = practiceNextSchema.parse(await (await nextGet(get(`${P}/next?attemptId=${attemptId}`))).json());
    expect(last.question?.questionId).toBe(q[2]);
    const done = practiceAnsweredSchema.parse(await (await answerPost(post(`${P}/answer`, { attemptId, questionId: q[2], chosenIndex: 0, clientId: `zz-last-${STAMP}` }))).json());
    // Two right in a row: the pupil climbs to L2, and the chapter is finished — with no badge, because a solution was opened.
    expect(done.result).toMatchObject({ correct: true, newLevel: 2, finished: true, badgeAwarded: false });
    expect(practiceNextSchema.parse(await (await nextGet(get(`${P}/next?attemptId=${attemptId}`))).json()).question).toBeNull();
  });

  it("a chapter the teacher set opens with the pupil's standing against its target; one that is not theirs is a 404", async () => {
    const res = await beginPost(post(`${P}/attempts`, { assignmentId }));
    expect(res.status).toBe(200);
    const body = practiceBeganSchema.parse(await res.json());
    expect(body.assignment).toMatchObject({ id: assignmentId, targetLevel: 2, targetTierName: "Learner", myLevel: 2, reached: true, note: "ZZ climb to L2", dueAt: null });
    expect(body.topic).toMatchObject({ slug: SLUG, level: 2, tierCount: 1 });
    // The finished sitting stays finished: this is a fresh one.
    expect(body.attemptId).not.toBe(attemptId);
    expect(body.resumed).toBe(false);
    expect(body.question).not.toBeNull();

    const nowhere = await beginPost(post(`${P}/attempts`, { assignmentId: NOWHERE }));
    expect(nowhere.status).toBe(404);
  });

  it("revision: the missed question comes back without its answer, is marked through the chapter's own sitting, and a replay changes nothing", async () => {
    const queue = practiceRevisionSchema.parse(await (await revisionGet(get(`${P}/revision`))).json());
    expect(queue.items.map((i) => i.questionId)).toEqual([revAnswered]);
    expect(queue.items[0]).toMatchObject({ topicSlug: REV_SLUG, subject: "SCIENCE" });

    expect((await revisionQuestionGet(get(`${P}/revision/question`))).status).toBe(422);
    expect((await revisionQuestionGet(get(`${P}/revision/question?questionId=${revNever}`))).status).toBe(404);
    const served = await revisionQuestionGet(get(`${P}/revision/question?questionId=${revAnswered}`));
    const raw = (await served.json()) as Record<string, unknown>;
    expect(Object.keys(raw)).not.toContain("answerIndex");
    expect(practiceRevisionQuestionSchema.parse(raw)).toMatchObject({ questionId: revAnswered, topicSlug: REV_SLUG, choices: ["roots", "leaves"], difficulty: 1 });

    const body = { questionId: revAnswered, chosenIndex: 0, clientId: `zz-rev-${STAMP}` };
    const first = practiceRevisionAnsweredSchema.parse(await (await revisionAnswerPost(post(`${P}/revision/answer`, body))).json());
    expect(first.result).toMatchObject({ correct: true, answerIndex: 0, solution: "ZZ roots take up water." });
    const again = practiceRevisionAnsweredSchema.parse(await (await revisionAnswerPost(post(`${P}/revision/answer`, body))).json());
    expect(again.result.correct).toBe(true);
    const rung = await db.quizMastery.findUniqueOrThrow({ where: { studentMembershipId_topicId: { studentMembershipId: pupilMembershipId, topicId: revTopicId } } });
    expect(rung.seenCount).toBe(1);

    // Answered right, it leaves the queue; a question never served cannot be answered as revision.
    expect(practiceRevisionSchema.parse(await (await revisionGet(get(`${P}/revision`))).json()).items).toEqual([]);
    expect((await revisionAnswerPost(post(`${P}/revision/answer`, { ...body, questionId: revNever }))).status).toBe(404);
    expect((await revisionAnswerPost(post(`${P}/revision/answer`, { questionId: revAnswered }))).status).toBe(422);
  });
});

describe("as the teacher", () => {
  beforeAll(() => signInAs("TEACHER"));

  it("worksheets: the chapters on offer, the six rungs, and the most a paper holds", async () => {
    const res = await worksheetsGet();
    expect(res.status).toBe(200);
    const body = practiceWorksheetTopicsSchema.parse(await res.json());
    expect(body.topics).toContainEqual({ slug: SLUG, name: TOPIC_NAME, subject: "MATHS", classLevel: 5 });
    expect(body.levels.map((l) => l.tierName)).toEqual(["Beginner", "Learner", "Amateur", "Expert", "Pro", "Master"]);
    expect(body.maxQuestions).toBe(30);
  });

  it("a paper with its key, the same for the same seed; no chapter is 422, a rung with nothing on it a 404", async () => {
    const path = `${P}/worksheets/sheet?slug=${SLUG}&level=1&count=5&seed=zz`;
    const res = await sheetGet(get(path));
    expect(res.status).toBe(200);
    const sheet = practiceWorksheetSchema.parse(await res.json());
    expect(sheet).toMatchObject({ topicName: TOPIC_NAME, subject: "MATHS", classLevel: 5, level: 1, tierName: "Beginner", seed: "zz" });
    expect(sheet.questions).toEqual([{ number: 1, stem: "ZZ question at level 1?", choices: ["right", "wrong", "also wrong"], answerIndex: 0, solution: "ZZ working for level 1." }]);
    expect(practiceWorksheetSchema.parse(await (await sheetGet(get(path))).json())).toEqual(sheet);

    expect((await sheetGet(get(`${P}/worksheets/sheet`))).status).toBe(422);
    const empty = await sheetGet(get(`${P}/worksheets/sheet?slug=${SLUG}&level=5`));
    expect(empty.status).toBe(404);
    expect(await empty.json()).toMatchObject({ code: "NOT_FOUND" });
  });
});
