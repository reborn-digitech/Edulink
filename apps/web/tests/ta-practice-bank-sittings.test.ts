/**
 * The practice sitting, findings of the testing analysis of 13 November 2026 held by cases that FAIL while the
 * defect stands and pass once it is fixed.
 *
 *   TA-195  One answer delivered twice at the same moment (the outbox's flush and the player's recovery on the same
 *           `online` event) moved the ladder twice: both deliveries read "no row" before either wrote one.
 *   TA-199  After an English correction on the bank desk, a pupil reading in Marathi was served the old Marathi
 *           options against the new key; and a level or check expression alone must not withhold the languages.
 *   TA-372  A sitting closed with served questions never shown when an answered question was taken down: the
 *           taken-down question's row still counted against the served total.
 *   TA-373  A reveal was charged to whichever sitting the caller named — a finished one, or a second open one — so
 *           the sitting the answers went to kept its clean-run badge.
 *   TA-374  A revision answer delivered again after it closed the sitting opened a new sitting and counted again.
 *   TA-598  A target rung of 7 to 10 passed the contract and was refused 403 rather than 422.
 *   TA-599  The journey's monthly tier bars counted by the UTC month.
 *   TA-600  The week's count and the journey's total counted a revealed solution as an answer (and the guardian's
 *           week and the weekly digest the same).
 *
 * Everything is ZZ and made here: a fixture school, a pupil per finding, small chapters of their own and a content-team
 * reviewer; deleted afterwards. Nothing of any fixture or seed is read or written.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLATFORM_FEATURES, practiceRevisionAnsweredSchema, setPracticeSchema } from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { nextQuestion, revealSolution, startAttempt, submitAnswer, submitAnswerIdempotent } from "@/lib/quiz";
import { childPracticeProgress, createPracticeAssignment, journey, weeklyPracticeCount } from "@/lib/practice-insights";
import { sendWeeklyDigests } from "@/lib/digest";
import { editItem } from "@/lib/quiz-review";
import { AccessError } from "@/lib/tenancy";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { POST as revisionAnswerPost } from "@/app/api/v1/practice/revision/answer/route";

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const db = new PrismaClient();
const STAMP = Date.now();
const P = `zz-tapb-${STAMP}`;
let schoolId = "";
let classId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const topic: Record<string, { id: string; slug: string; q: string[] }> = {};

const pupil = (key: string): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId, role: "STUDENT", user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: true, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } } }) as ActiveContext;
const teacher = (): ActiveContext =>
  ({ sessionId: "test", membershipId: member.teacher ?? null, schoolId, role: "TEACHER", user: { id: id.teacher!, name: "ZZ teacher", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } } }) as ActiveContext;
const curator = (): ActiveContext =>
  ({ sessionId: "test", membershipId: null, schoolId: null, role: null, user: { id: id.curator!, name: "ZZ curator", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: true } }) as ActiveContext;

/** A chapter of `count` questions, one per rung from 1, the right answer always first. */
async function chapter(key: string, count: number, generated = false): Promise<void> {
  const slug = `${P}-${key}`;
  const t = await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 6, chapter: `ZZ ${key}`, name: `ZZ TAPB ${key} ${STAMP}`, slug, summary: "ZZ." }, select: { id: true } });
  const q: string[] = [];
  for (let n = 0; n < count; n++) {
    const row = await db.quizQuestion.create({
      data: { topicId: t.id, difficulty: 1, stem: `ZZ TAPB ${key} question ${n}?`, choices: JSON.stringify(["12", "15", "16"]), answerIndex: 0, solution: `ZZ working ${key}/${n}: seven and five make twelve.`, checkExpr: generated ? "7+5" : null, source: "test", licence: "test", generated, ...(generated ? { generatedBoard: "NCERT" } : {}) },
      select: { id: true },
    });
    q.push(row.id);
  }
  topic[key] = { id: t.id, slug, q: q.sort() };
}

async function person(key: string, role: string): Promise<void> {
  id[key] = (await db.user.create({ data: { name: `ZZ TAPB ${key} ${STAMP}`, email: `zz-tapb-${key}-${STAMP}@test.invalid`, isMinor: role === "STUDENT" }, select: { id: true } })).id;
  member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
}

beforeAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests(["STUDENT"]);
  schoolId = (await db.school.create({ data: { name: `ZZ TAPB School ${STAMP}`, slug: `zz-tapb-${STAMP}`, code: `ZT${String(STAMP).slice(-6)}`, contactEmail: `zz-tapb-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  for (const key of ["race", "down", "reveal", "revise", "lang", "count", "month", "lvl", "guard"]) await person(key, "STUDENT");
  id.parent = (await db.user.create({ data: { name: `ZZ TAPB parent ${STAMP}`, email: `zz-tapb-parent-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } })).id;
  await person("teacher", "TEACHER");
  id.curator = (await db.user.create({ data: { name: `ZZ TAPB curator ${STAMP}`, email: `zz-tapb-curator-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  classId = (await db.class.create({ data: { schoolId, name: `ZZ TAPB Class ${STAMP}`, gradeLevel: "6", joinCode: `ZT${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: member.teacher!, role: "LEAD" } });
  await chapter("race", 3);
  await chapter("down", 4);
  await chapter("reveal", 2);
  await chapter("revise", 2);
  await chapter("lang", 1, true);
  await chapter("count", 2);
  await chapter("lvl", 1, true);
  await chapter("guard", 2);
  // The Marathi row of the generated item, written before the desk's edit.
  await db.quizQuestionTranslation.create({ data: { questionId: topic.lang!.q[0]!, language: "mr", stem: "ZZ सात आणि पाच किती?", choices: JSON.stringify(["१२", "१५", "१६"]), solution: "ZZ सात आणि पाच मिळून बारा होतात." } });
  await db.quizQuestionTranslation.create({ data: { questionId: topic.lvl!.q[0]!, language: "mr", stem: "ZZ सात आणि पाच किती?", choices: JSON.stringify(["१२", "१५", "१६"]), solution: "ZZ सात आणि पाच मिळून बारा होतात." } });
});

afterAll(async () => {
  __resetCookies();
  setActivePlansForTests([]);
  setFeaturesForTests([...PLATFORM_FEATURES]);
  await db.quizTopic.deleteMany({ where: { slug: { startsWith: P } } });
  const users = Object.values(id);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: { in: users } }] } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
}, 120_000);

describe("TA-195: one answer delivered twice at once", () => {
  it("TA-195: two deliveries of the same answer at the same moment count once — one is the replay, the ladder moves one step, no 500", async () => {
    const t = topic.race!;
    for (let round = 0; round < 8; round++) {
      // A fresh chapter for the pupil each round: no sitting; on even rounds no ladder row either (so the first answer
      // also races the ladder's create), on odd rounds a ladder row at the bottom (so only the double move is in play).
      await db.quizAttempt.deleteMany({ where: { studentMembershipId: member.race, topicId: t.id } });
      if (round % 2 === 0) await db.quizMastery.deleteMany({ where: { studentMembershipId: member.race, topicId: t.id } });
      else await db.quizMastery.updateMany({ where: { studentMembershipId: member.race, topicId: t.id }, data: { level: 1, streakRight: 0, streakWrong: 0, seenCount: 0, correctCount: 0 } });
      await db.earnedBadge.deleteMany({ where: { studentMembershipId: member.race } });
      const { attemptId } = await startAttempt(pupil("race"), t.slug);
      const served = await nextQuestion(pupil("race"), attemptId);
      const both = await Promise.allSettled([
        submitAnswerIdempotent(pupil("race"), attemptId, served!.questionId, 0),
        submitAnswerIdempotent(pupil("race"), attemptId, served!.questionId, 0),
      ]);
      expect(both.map((b) => b.status), `round ${round}`).toEqual(["fulfilled", "fulfilled"]);
      const results = both.map((b) => (b as PromiseFulfilledResult<Awaited<ReturnType<typeof submitAnswerIdempotent>>>).value);
      expect(results.filter((r) => !r.replayed).length, `round ${round}: deliveries that counted`).toBe(1);
      expect(results.every((r) => r.result.correct)).toBe(true);
      const mastery = await db.quizMastery.findUniqueOrThrow({ where: { studentMembershipId_topicId: { studentMembershipId: member.race!, topicId: t.id } } });
      expect({ seen: mastery.seenCount, right: mastery.correctCount, streak: mastery.streakRight, level: mastery.level }, `round ${round}`).toEqual({ seen: 1, right: 1, streak: 1, level: 1 });
      expect(await db.earnedBadge.count({ where: { studentMembershipId: member.race } }), `round ${round}: no tier badge for one right answer`).toBe(0);
      expect(await db.quizResponse.count({ where: { attemptId } })).toBe(1);
    }
  });

  it("TA-195: through submitAnswer too (the web's answer action), a twin delivery moves the ladder once", async () => {
    const t = topic.race!;
    for (let round = 0; round < 6; round++) {
      await db.quizAttempt.deleteMany({ where: { studentMembershipId: member.race, topicId: t.id } });
      await db.quizMastery.deleteMany({ where: { studentMembershipId: member.race, topicId: t.id } });
      const { attemptId } = await startAttempt(pupil("race"), t.slug);
      const served = await nextQuestion(pupil("race"), attemptId);
      const both = await Promise.allSettled([submitAnswer(pupil("race"), attemptId, served!.questionId, 0), submitAnswer(pupil("race"), attemptId, served!.questionId, 0)]);
      expect(both.map((b) => b.status), `round ${round}`).toEqual(["fulfilled", "fulfilled"]);
      const mastery = await db.quizMastery.findUniqueOrThrow({ where: { studentMembershipId_topicId: { studentMembershipId: member.race!, topicId: t.id } } });
      expect({ seen: mastery.seenCount, streak: mastery.streakRight }, `round ${round}`).toEqual({ seen: 1, streak: 1 });
    }
  });
});

describe("TA-372: a take-down in the middle of a sitting", () => {
  it("TA-372: an answered question taken down does not close the sitting before every served question is shown, nor award the clean-run badge early", async () => {
    const t = topic.down!;
    const ctx = pupil("down");
    const { attemptId } = await startAttempt(ctx, t.slug);
    const first = await nextQuestion(ctx, attemptId);
    await submitAnswer(ctx, attemptId, first!.questionId, 0);
    const second = await nextQuestion(ctx, attemptId);
    await submitAnswer(ctx, attemptId, second!.questionId, 0);
    // The desk takes the first answered question down (the flag quiz-served.ts reads).
    await db.quizQuestion.update({ where: { id: first!.questionId }, data: { takenDownAt: new Date(), takenDownReason: "WRONG_KEY" } });
    const third = await nextQuestion(ctx, attemptId);
    const afterThird = await submitAnswer(ctx, attemptId, third!.questionId, 0);
    // Three served questions remain and only two of them are answered: the fourth has not been shown.
    expect(afterThird.finished).toBe(false);
    expect(afterThird.badgeAwarded).toBe(false);
    const fourth = await nextQuestion(ctx, attemptId);
    expect(fourth).not.toBeNull();
    const last = await submitAnswer(ctx, attemptId, fourth!.questionId, 0);
    expect(last).toMatchObject({ finished: true, badgeAwarded: true });
    expect(await nextQuestion(ctx, attemptId)).toBeNull();
  });
});

describe("TA-373: where a reveal is charged", () => {
  it("TA-373: a reveal on a finished sitting is refused; with two sittings open, a reveal in one costs the other's clean-run badge", async () => {
    const t = topic.reveal!;
    const ctx = pupil("reveal");
    const { attemptId: first } = await startAttempt(ctx, t.slug);
    for (let n = 0; n < 2; n++) {
      const q = await nextQuestion(ctx, first);
      await submitAnswer(ctx, first, q!.questionId, 0);
    }
    expect((await db.quizAttempt.findUniqueOrThrow({ where: { id: first } })).finishedAt).not.toBeNull();
    const refused = await revealSolution(ctx, first, t.q[0]!).then(
      () => "let through",
      (error: unknown) => (error instanceof AccessError ? `${error.code}:${error.key}` : String(error)),
    );
    expect(refused).toBe("NOT_FOUND:access.attemptNotFound");

    // Two open sittings of the chapter, as two begins at once leave them (startAttempt reads, then creates).
    await db.earnedBadge.deleteMany({ where: { studentMembershipId: member.reveal } });
    const a = (await db.quizAttempt.create({ data: { schoolId, studentMembershipId: member.reveal!, topicId: t.id }, select: { id: true } })).id;
    const b = (await db.quizAttempt.create({ data: { schoolId, studentMembershipId: member.reveal!, topicId: t.id }, select: { id: true } })).id;
    for (const q of t.q) {
      await revealSolution(ctx, a, q);
      await submitAnswer(ctx, b, q, 0);
    }
    const bRow = await db.quizAttempt.findUniqueOrThrow({ where: { id: b } });
    expect(bRow.finishedAt).not.toBeNull();
    expect(bRow.revealedAny).toBe(true);
    expect(await db.earnedBadge.count({ where: { studentMembershipId: member.reveal, badgeId: `abhyaas:${t.slug}` } })).toBe(0);
  });
});

describe("TA-374: a revision answer delivered again after it closed the sitting", () => {
  const post = (body: unknown) => new Request("http://localhost/api/v1/practice/revision/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  it("TA-374: the replay is the stored verdict: no new sitting, the ladder moved once", async () => {
    const t = topic.revise!;
    const ctx = pupil("revise");
    // A first sitting through the chapter (both questions answered, so both are in the pupil's history), then a second
    // sitting holding one answer: the revision answer to the other closes it.
    const { attemptId: one } = await startAttempt(ctx, t.slug);
    for (const q of t.q) await submitAnswer(ctx, one, q, 1);
    const { attemptId: two } = await startAttempt(ctx, t.slug);
    expect(two).not.toBe(one);
    await submitAnswer(ctx, two, t.q[0]!, 1);
    const before = await db.quizMastery.findUniqueOrThrow({ where: { studentMembershipId_topicId: { studentMembershipId: member.revise!, topicId: t.id } } });

    __resetCookies();
    await createSession(id.revise!, { schoolId, role: "STUDENT" });
    const body = { questionId: t.q[1]!, chosenIndex: 0, clientId: `zz-tapb-${STAMP}-revise`, language: "en" };
    const first = await revisionAnswerPost(post(body));
    expect(first.status).toBe(200);
    expect(practiceRevisionAnsweredSchema.parse(await first.json()).result).toMatchObject({ correct: true, finished: true });
    const again = await revisionAnswerPost(post(body));
    expect(again.status).toBe(200);
    expect(practiceRevisionAnsweredSchema.parse(await again.json()).result).toMatchObject({ correct: true, finished: true, newLevel: 0 });
    __resetCookies();

    const after = await db.quizMastery.findUniqueOrThrow({ where: { studentMembershipId_topicId: { studentMembershipId: member.revise!, topicId: t.id } } });
    expect(after.seenCount - before.seenCount).toBe(1);
    expect(after.correctCount - before.correctCount).toBe(1);
    expect(await db.quizAttempt.count({ where: { studentMembershipId: member.revise, topicId: t.id } })).toBe(2);
    expect(await db.quizAttempt.count({ where: { studentMembershipId: member.revise, topicId: t.id, finishedAt: null } })).toBe(0);
  });
});

describe("TA-199: a language row older than the desk's English edit", () => {
  it("TA-199: after the English options are corrected on the desk with the Marathi left alone, a pupil reading in Marathi is served the English options the key points into, and the English working", async () => {
    const t = topic.lang!;
    const q = t.q[0]!;
    const edited = await editItem(curator(), q, { difficulty: 1, stem: "ZZ TAPB lang question 0?", choices: ["12", "14", "16"], answerIndex: 1, solution: "ZZ corrected working: seven and seven make fourteen.", checkExpr: "7+7" });
    expect(edited.ok).toBe(true);
    const ctx = pupil("lang");
    const { attemptId } = await startAttempt(ctx, t.slug);
    const served = await nextQuestion(ctx, attemptId, "mr");
    expect(served!.questionId).toBe(q);
    // Not the stale Marathi (१२ | १५ | १६, which has no fourteen) against the new key.
    expect(served!.choices).toEqual(["12", "14", "16"]);
    expect(served!.stem).toBe("ZZ TAPB lang question 0?");
    const marked = await submitAnswer(ctx, attemptId, q, 1, "mr");
    expect(marked).toMatchObject({ correct: true, answerIndex: 1 });
    expect(marked.solution).toBe("ZZ corrected working: seven and seven make fourteen.");

    // A Marathi correction made after the English is served again.
    const fixed = await editItem(curator(), q, { difficulty: 1, stem: "ZZ TAPB lang question 0?", choices: ["12", "14", "16"], answerIndex: 1, solution: "ZZ corrected working: seven and seven make fourteen.", checkExpr: "7+7", translations: { mr: { stem: "ZZ सात आणि सात किती?", choices: ["१२", "१४", "१६"], solution: "ZZ सात आणि सात मिळून चौदा होतात." } } });
    expect(fixed.ok).toBe(true);
    await db.quizAttempt.deleteMany({ where: { studentMembershipId: member.lang } });
    const { attemptId: again } = await startAttempt(ctx, t.slug);
    expect((await nextQuestion(ctx, again, "mr"))!.choices).toEqual(["१२", "१४", "१६"]);
  });
});

describe("TA-199: a level or a check alone does not date the languages", () => {
  it("TA-199: a desk edit of the level alone, or of the check expression alone, leaves the Marathi served and the item not edited after solving", async () => {
    const t = topic.lvl!;
    const q = t.q[0]!;
    const english = { stem: "ZZ TAPB lvl question 0?", choices: ["12", "15", "16"], answerIndex: 0, solution: "ZZ working lvl/0: seven and five make twelve." };
    const ctx = pupil("lvl");
    const servedInMarathi = async () => {
      await db.quizAttempt.deleteMany({ where: { studentMembershipId: member.lvl } });
      const { attemptId } = await startAttempt(ctx, t.slug);
      return (await nextQuestion(ctx, attemptId, "mr"))!;
    };
    // The check expression alone: the same answer, worked the other way round.
    expect((await editItem(curator(), q, { ...english, difficulty: 1, checkExpr: "5+7" })).ok).toBe(true);
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: q } })).checkExpr).toBe("5+7");
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: q } })).editedAfterSolvingAt).toBeNull();
    expect((await servedInMarathi()).choices).toEqual(["१२", "१५", "१६"]);
    // The level alone.
    expect((await editItem(curator(), q, { ...english, difficulty: 2, checkExpr: "5+7" })).ok).toBe(true);
    const row = await db.quizQuestion.findUniqueOrThrow({ where: { id: q } });
    expect(row.difficulty).toBe(2);
    expect(row.editedAfterSolvingAt).toBeNull();
    const served = await servedInMarathi();
    expect(served.choices).toEqual(["१२", "१५", "१६"]);
    expect(served.stem).toBe("ZZ सात आणि पाच किती?");
  });
});

describe("TA-600: a revealed solution is not an answer", () => {
  it("TA-600: one reveal and one answer make one question answered this week and one in the journey's total", async () => {
    const t = topic.count!;
    const ctx = pupil("count");
    const { attemptId } = await startAttempt(ctx, t.slug);
    await revealSolution(ctx, attemptId, t.q[0]!);
    await submitAnswer(ctx, attemptId, t.q[1]!, 0);
    expect(await weeklyPracticeCount(ctx)).toBe(1);
    expect((await journey(ctx)).totalAnswers).toBe(1);
  });

  it("TA-600: the guardian's week and the weekly digest count one reveal and one answer as one question answered, as the child's own week does", async () => {
    const t = topic.guard!;
    const ctx = pupil("guard");
    await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: member.guard! } });
    await db.guardianship.create({ data: { parentUserId: id.parent!, studentMembershipId: member.guard!, studentSchoolId: schoolId } });
    const { attemptId } = await startAttempt(ctx, t.slug);
    await revealSolution(ctx, attemptId, t.q[0]!);
    await submitAnswer(ctx, attemptId, t.q[1]!, 0);
    expect(await weeklyPracticeCount(ctx)).toBe(1);
    expect((await childPracticeProgress(id.parent!, member.guard!)).weeklyCount).toBe(1);
    const run = await sendWeeklyDigests({ onlyParentUserIds: [id.parent!] });
    expect(run.sent).toBe(1);
    const digest = await db.notification.findFirstOrThrow({ where: { userId: id.parent! }, orderBy: { createdAt: "desc" } });
    expect(digest.body).toContain("answered 1 practice questions");
    expect(digest.body).not.toContain("answered 2 practice questions");
  });
});

describe("TA-599: the journey's months are India's", () => {
  it("TA-599: a tier badge earned at 00:30 IST on 1 December 2026 is December's bar, not November's", async () => {
    await db.earnedBadge.create({ data: { schoolId, studentMembershipId: member.month!, badgeId: `abhyaas:${P}-month:tier-1`, label: "ZZ Beginner", permanent: true, earnedAt: new Date("2026-11-30T19:00:00.000Z") } });
    vi.useFakeTimers({ now: new Date("2026-12-05T06:00:00.000Z"), toFake: ["Date"] });
    try {
      const { monthly } = await journey(pupil("month"));
      expect(monthly.map((m) => m.month)).toEqual(["2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
      expect(monthly.find((m) => m.month === "2026-12")!.tiers).toBe(1);
      expect(monthly.find((m) => m.month === "2026-11")!.tiers).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("TA-598: the target rung's bound", () => {
  it("TA-598: the contract refuses a rung above the ladder's six (a 422 naming targetLevel), and still takes six; the library keeps its own check", async () => {
    const body = (targetLevel: number) => ({ classId: "czzta598class00000000000000", topicSlug: "zz-any", targetLevel });
    const seven = setPracticeSchema.safeParse(body(7));
    expect(seven.success).toBe(false);
    expect(seven.success ? [] : seven.error.issues.map((i) => String(i.path[0]))).toEqual(["targetLevel"]);
    expect(setPracticeSchema.safeParse(body(10)).success).toBe(false);
    expect(setPracticeSchema.safeParse(body(6)).success).toBe(true);
    await expect(createPracticeAssignment(teacher(), { classId, topicSlug: topic.count!.slug, targetLevel: 7 })).rejects.toThrow("access.practiceTargetOutOfRange");
  });
});
