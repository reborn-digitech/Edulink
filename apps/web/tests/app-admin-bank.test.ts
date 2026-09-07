import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { createBankQuestion, deleteBankQuestion, getBankQuestion, listBankQuestions, listBankTopics, updateBankQuestion } from "@/lib/app-admin";
import type { ActiveContext } from "@/lib/session";

/**
 * The question bank's write side — 9% covered before this. A superuser
 * curates; an ordinary account is refused; the input rules refuse by key;
 * without a translation key the English row is written and the result says
 * so; an edit rewrites; a delete removes.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const savedKey = process.env.ANTHROPIC_API_KEY;
let operatorId = "";
let topicId = "";
let questionId = "";

function ctx(userId: string, isSuperuser: boolean): ActiveContext {
  return {
    sessionId: "test",
    membershipId: null,
    schoolId: null,
    role: null,
    user: { id: userId, name: "Op", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser, isAppAdmin: false },
  } as ActiveContext;
}

beforeAll(async () => {
  // No model call in a test: the English row is written and `translated` is false.
  delete process.env.ANTHROPIC_API_KEY;
  const op = await db.user.create({ data: { name: "ZZ Bank Operator", email: `zz-bank-op-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } });
  operatorId = op.id;
  const topics = await listBankTopics(ctx(operatorId, true));
  expect(topics.length).toBeGreaterThan(0);
  topicId = topics[0]!.id;
});

afterAll(async () => {
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  if (questionId) await db.quizQuestion.deleteMany({ where: { id: questionId } }).catch(() => {});
  await db.user.deleteMany({ where: { id: operatorId } });
  await db.$disconnect();
});

const good = { difficulty: 1, stem: `ZZ bank test ${STAMP}: which number is even?`, choices: ["3", "4", "5", "7"], answerIndex: 1, solution: "Four divides by two with nothing left over." };

describe("the question bank", () => {
  it("refuses an ordinary account", async () => {
    const someone = await db.user.create({ data: { name: "ZZ Nobody", email: `zz-bank-nobody-${STAMP}@test.invalid` }, select: { id: true } });
    await expect(createBankQuestion(ctx(someone.id, false), topicId, good)).rejects.toBeInstanceOf(AccessError);
    await db.user.delete({ where: { id: someone.id } });
  });

  it("refuses bad input by key, and an unknown topic", async () => {
    expect(await createBankQuestion(ctx(operatorId, true), topicId, { ...good, stem: "hi" })).toEqual({ ok: false, errorKey: "appadmin.stemTooShort" });
    expect(await createBankQuestion(ctx(operatorId, true), topicId, { ...good, choices: ["only"] })).toEqual({ ok: false, errorKey: "appadmin.needTwoChoices" });
    expect(await createBankQuestion(ctx(operatorId, true), topicId, { ...good, answerIndex: 9 })).toEqual({ ok: false, errorKey: "appadmin.pickTheAnswer" });
    expect(await createBankQuestion(ctx(operatorId, true), topicId, { ...good, solution: "no" })).toEqual({ ok: false, errorKey: "appadmin.solutionTooShort" });
    expect(await createBankQuestion(ctx(operatorId, true), "no-such-topic", good)).toEqual({ ok: false, errorKey: "appadmin.noSuchTopic" });
  });

  it("writes the English row, says it was not translated, lists and reads it back", async () => {
    const created = await createBankQuestion(ctx(operatorId, true), topicId, good);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    questionId = created.questionId;
    expect(created.translated).toBe(false);
    const listed = await listBankQuestions(ctx(operatorId, true), topicId);
    const mine = listed.find((q) => q.id === questionId)!;
    expect(mine.difficulty).toBe(1);
    expect(mine.languages).toEqual([]);
    const one = await getBankQuestion(ctx(operatorId, true), questionId);
    expect(one?.stem).toBe(good.stem);
  });

  it("edits in place and deletes", async () => {
    const edited = await updateBankQuestion(ctx(operatorId, true), questionId, { ...good, difficulty: 2, solution: "Four is two twos, so it is even." });
    expect(edited).toEqual({ ok: true, translated: false });
    expect((await getBankQuestion(ctx(operatorId, true), questionId))?.difficulty).toBe(2);
    expect(await deleteBankQuestion(ctx(operatorId, true), questionId)).toEqual({ ok: true });
    expect(await getBankQuestion(ctx(operatorId, true), questionId)).toBeNull();
    expect(await deleteBankQuestion(ctx(operatorId, true), questionId)).toEqual({ ok: false, errorKey: "appadmin.noSuchQuestion" });
    questionId = "";
  });
});
