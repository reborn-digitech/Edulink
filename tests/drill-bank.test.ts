import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { startAttempt, nextQuestion, submitAnswer } from "@/lib/quiz";
import type { ActiveContext } from "@/lib/session";
import { evaluate, numberIn } from "../scripts/quiz-arith";

/**
 * The generated drill bank, served — and re-proven where it LANDED.
 *
 * The generator verifies every question before writing it, but that proof
 * lives in the generator's process. This suite checks two different things:
 *
 *   1. The serving path holds at drill scale. `nextQuestion` used to load a
 *      topic's whole pool per question; against a 10,050-question topic that
 *      refactor is the difference between a query and five thousand rows per
 *      click. A disposable pupil starts a real attempt, answers real
 *      questions, and reads one in Hindi off the same rows.
 *
 *   2. The rows in the DATABASE still prove themselves: a deterministic
 *      sample of imported questions is re-evaluated through the same shared
 *      evaluator (scripts/quiz-arith) against the marked option. This catches
 *      what generator-side verification cannot — a bug in the import itself.
 *
 * Skips cleanly when the drill bank has not been imported, so `npm test`
 * stays green on a fresh clone.
 */

const db = new PrismaClient();
const EMAIL = "zz.pupil.drill@riverside.test";
const SLUG = "drill-g3-addsub";

let hasBank = false;
let riversideId: string;
let pupil: ActiveContext;
let membershipId: string;

beforeAll(async () => {
  hasBank = (await db.quizTopic.count({ where: { slug: SLUG } })) > 0;
  if (!hasBank) return;

  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  riversideId = riverside.id;
  const user = await db.user.create({ data: { email: EMAIL, name: "ZZ Drill Pupil", prefs: "{}" } });
  const membership = await db.membership.create({
    data: { userId: user.id, schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
  });
  membershipId = membership.id;
  pupil = {
    sessionId: "test-session",
    membershipId,
    schoolId: riversideId,
    role: "STUDENT",
    user: {
      id: user.id,
      name: "ZZ Drill Pupil",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
});

afterAll(async () => {
  if (hasBank) {
    const user = await db.user.findUnique({ where: { email: EMAIL }, select: { id: true } });
    if (user) {
      await db.quizResponse.deleteMany({ where: { attempt: { studentMembershipId: membershipId } } });
      await db.quizAttempt.deleteMany({ where: { studentMembershipId: membershipId } });
      await db.quizMastery.deleteMany({ where: { studentMembershipId: membershipId } });
      await db.earnedBadge.deleteMany({ where: { studentMembershipId: membershipId } });
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  await db.$disconnect();
});

describe("the drill bank, served end to end", () => {
  it("serves, accepts an answer, and serves a different question next", async () => {
    if (!hasBank) return;
    const { attemptId } = await startAttempt(pupil, SLUG);
    const first = await nextQuestion(pupil, attemptId);
    expect(first).not.toBeNull();
    expect(first!.choices.length).toBe(4);
    expect(first!.totalCount).toBeGreaterThanOrEqual(10_000);

    const result = await submitAnswer(pupil, attemptId, first!.questionId, 0);
    expect(typeof result.correct).toBe("boolean");
    expect(result.solution.length).toBeGreaterThanOrEqual(20);

    const second = await nextQuestion(pupil, attemptId);
    expect(second).not.toBeNull();
    expect(second!.questionId).not.toBe(first!.questionId);
  });

  it("reads in Hindi off the same rows", async () => {
    if (!hasBank) return;
    const { attemptId } = await startAttempt(pupil, SLUG);
    const q = await nextQuestion(pupil, attemptId, "hi");
    expect(q).not.toBeNull();
    // Devanagari in the stem — the translation row, not the English fallback.
    expect(q!.stem).toMatch(/[ऀ-ॿ]/);
  });

  // 130+ topics sampled sequentially plus two full-bank counts — a real
  // minute of database time, not a hung test.
  it("⚠ a deterministic sample of IMPORTED rows still proves itself", { timeout: 60_000 }, async () => {
    if (!hasBank) return;
    const topics = await db.quizTopic.findMany({
      where: { slug: { startsWith: "drill-" } },
      select: { id: true, slug: true },
      orderBy: { slug: "asc" },
    });
    expect(topics.length).toBeGreaterThanOrEqual(70);

    let checked = 0;
    for (const topic of topics) {
      const rows = await db.quizQuestion.findMany({
        where: { topicId: topic.id },
        select: { stem: true, choices: true, answerIndex: true, checkExpr: true },
        orderBy: { id: "asc" },
        take: 7,
      });
      for (const row of rows) {
        // Fact-recall rows (capitals, symbols, event years) carry no expression
        // BY DESIGN — they are proven by their curated table, not arithmetic.
        // The coverage assertion below keeps them the rare exception.
        if (row.checkExpr === null) continue;
        const expected = evaluate(row.checkExpr);
        const choices = JSON.parse(row.choices) as string[];
        const stated = numberIn(choices[row.answerIndex]!);
        expect(expected, `${topic.slug}: ${row.stem}`).not.toBeNull();
        expect(stated, `${topic.slug}: ${row.stem}`).not.toBeNull();
        expect(Math.abs(stated! - expected!), `${topic.slug}: ${row.stem}`).toBeLessThan(1e-6);
        checked++;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(490);

    // The honest ratio, pinned: at least 99.9% of the generated bank must be
    // machine-checkable. If recall generation ever creeps past the fact
    // tables' natural size, this fails before the bank can start lying.
    const [total, unchecked] = await Promise.all([
      db.quizQuestion.count({ where: { topic: { slug: { startsWith: "drill-" } } } }),
      db.quizQuestion.count({
        where: { topic: { slug: { startsWith: "drill-" } }, checkExpr: null },
      }),
    ]);
    expect(unchecked / total).toBeLessThan(0.001);
  });
});
