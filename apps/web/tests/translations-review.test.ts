/**
 * Native review of the bank's Hindi and Marathi (src/lib/translation-review.ts):
 * a translation row is a draft until a person stamps the language read; the
 * list says what is unread, read and missing; a corrected text is saved with
 * the stamp; the choices must keep the English's shape; re-translating the
 * English clears the stamp; the bank list carries the flags; and nobody
 * outside the content team may do any of it. The route answers in the
 * contract's shape. Every row is a ZZ row made here and removed after.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { translationsSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { listTranslationReview, reviewTranslation } from "@/lib/translation-review";
import { getBankQuestion, listBankQuestions, updateBankQuestion } from "@/lib/app-admin";
import { GET as translationsGet } from "@/app/api/v1/appadmin/translations/route";
import { POST as reviewPost } from "@/app/api/v1/appadmin/translations/[questionId]/review/route";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const savedKey = process.env.ANTHROPIC_API_KEY;
let curatorId = "";
let nobodyId = "";
let topicId = "";
let questionId = "";
let bareId = "";

function ctx(userId: string, isAppAdmin: boolean): ActiveContext {
  return {
    sessionId: "test",
    membershipId: null,
    schoolId: null,
    role: null,
    user: { id: userId, name: "ZZ Curator", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin },
  } as ActiveContext;
}
const curator = () => ctx(curatorId, true);

beforeAll(async () => {
  delete process.env.ANTHROPIC_API_KEY;
  curatorId = (await db.user.create({ data: { name: "ZZ Review Curator", email: `zz-review-cur-${STAMP}@test.invalid`, isAppAdmin: true }, select: { id: true } })).id;
  nobodyId = (await db.user.create({ data: { name: "ZZ Review Nobody", email: `zz-review-nobody-${STAMP}@test.invalid` }, select: { id: true } })).id;
  topicId = (await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 6, chapter: "ZZ Review", name: `ZZ Review ${STAMP}`, slug: `zz-review-${STAMP}`, position: 999 }, select: { id: true } })).id;
  questionId = (
    await db.quizQuestion.create({
      data: {
        topicId,
        difficulty: 1,
        stem: `ZZ review ${STAMP}: which number is even?`,
        choices: JSON.stringify(["3", "4", "5"]),
        answerIndex: 1,
        solution: "Four divides by two with nothing left over.",
        source: "ZZ test",
        licence: "test",
        translations: { create: { language: "hi", stem: "ZZ कौन सी संख्या सम है?", choices: JSON.stringify(["३", "४", "५"]), solution: "चार दो से पूरा बँटता है।" } },
      },
      select: { id: true },
    })
  ).id;
  bareId = (
    await db.quizQuestion.create({
      data: { topicId, difficulty: 2, stem: `ZZ review ${STAMP}: which is odd?`, choices: JSON.stringify(["2", "7"]), answerIndex: 1, solution: "Seven leaves one over when halved.", source: "ZZ test", licence: "test" },
      select: { id: true },
    })
  ).id;
});

afterAll(async () => {
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  await db.quizTopic.deleteMany({ where: { id: topicId } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: [curatorId, nobodyId] } } });
  await db.user.deleteMany({ where: { id: { in: [curatorId, nobodyId] } } });
  await db.$disconnect();
});

describe("the review list", () => {
  it("a draft is unread; a question without the language is missing; the counts say so", async () => {
    const unread = await listTranslationReview(curator(), { language: "hi", status: "unreviewed", topicId });
    expect(unread.items.map((i) => i.id)).toEqual([questionId]);
    expect(unread.items[0]!.translation?.stem).toBe("ZZ कौन सी संख्या सम है?");
    expect(unread.items[0]!.english.choices).toEqual(["3", "4", "5"]);
    expect(unread.counts).toEqual({ unreviewed: 1, reviewed: 0, missing: 1 });
    const missing = await listTranslationReview(curator(), { language: "hi", status: "missing", topicId });
    expect(missing.items.map((i) => i.id)).toEqual([bareId]);
    expect(missing.items[0]!.translation).toBeNull();
    // Marathi: nothing has a row, so both are missing.
    expect((await listTranslationReview(curator(), { language: "mr", topicId })).counts).toEqual({ unreviewed: 0, reviewed: 0, missing: 2 });
  });

  it("refuses an ordinary account, in the list and the stamp", async () => {
    await expect(listTranslationReview(ctx(nobodyId, false), { language: "hi" })).rejects.toBeInstanceOf(AccessError);
    await expect(reviewTranslation(ctx(nobodyId, false), questionId, { language: "hi", reviewed: true })).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the stamp", () => {
  it("a corrected text is saved with the stamp, named in the list, and the bank list shows the flag", async () => {
    const result = await reviewTranslation(curator(), questionId, {
      language: "hi",
      text: { stem: "ZZ इनमें से कौन सी संख्या सम है?", choices: ["३", "४", "५"], solution: "चार दो से पूरा बँट जाता है।" },
      reviewed: true,
    });
    expect(result).toEqual({ ok: true, reviewed: true });
    const row = await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId }, select: { hiReviewedAt: true, hiReviewedBy: true, mrReviewedAt: true, translations: { where: { language: "hi" } } } });
    expect(row.hiReviewedBy).toBe(curatorId);
    expect(row.hiReviewedAt).not.toBeNull();
    expect(row.mrReviewedAt).toBeNull();
    expect(row.translations[0]!.stem).toBe("ZZ इनमें से कौन सी संख्या सम है?");
    const reviewed = await listTranslationReview(curator(), { language: "hi", status: "reviewed", topicId });
    expect(reviewed.items.map((i) => i.id)).toEqual([questionId]);
    expect(reviewed.items[0]!.reviewedBy).toBe("ZZ Review Curator");
    expect((await listTranslationReview(curator(), { language: "hi", topicId })).counts.unreviewed).toBe(0);
    const bank = await listBankQuestions(curator(), topicId);
    expect(bank.find((q) => q.id === questionId)!.reviewed).toEqual({ hi: true, mr: false });
    expect((await getBankQuestion(curator(), questionId))!.reviewed).toEqual({ hi: true, mr: false });
    expect(await db.auditLog.count({ where: { action: "appadmin.translation.review", targetId: questionId, actorUserId: curatorId } })).toBe(1);
  });

  it("the choices must be as many as the English; a stamp on nothing is refused; a stamp can be taken off", async () => {
    expect(await reviewTranslation(curator(), questionId, { language: "hi", text: { stem: "x", choices: ["३", "४"], solution: "y" }, reviewed: true })).toEqual({ ok: false, errorKey: "translationReview.choicesMustMatch" });
    expect(await reviewTranslation(curator(), bareId, { language: "mr", reviewed: true })).toEqual({ ok: false, errorKey: "translationReview.nothingToReview" });
    expect(await reviewTranslation(curator(), "no-such-question", { language: "hi", reviewed: true })).toEqual({ ok: false, errorKey: "appadmin.noSuchQuestion" });
    expect(await reviewTranslation(curator(), questionId, { language: "hi", reviewed: false })).toEqual({ ok: true, reviewed: false });
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId }, select: { hiReviewedAt: true } })).hiReviewedAt).toBeNull();
    // A Marathi text typed in from blank, stamped in the same press.
    expect(await reviewTranslation(curator(), bareId, { language: "mr", text: { stem: "ZZ कोणती विषम आहे?", choices: ["२", "७"], solution: "सात अर्धे केल्यावर एक उरतो." }, reviewed: true })).toEqual({ ok: true, reviewed: true });
    expect((await listTranslationReview(curator(), { language: "mr", topicId })).counts).toEqual({ unreviewed: 0, reviewed: 1, missing: 1 });
  });

  it("re-translating the English keeps the stamp when the translation did not run, and the route answers in shape", async () => {
    await reviewTranslation(curator(), questionId, { language: "hi", reviewed: true });
    // No key: the English saves, the rows stand, and so does the stamp.
    const edited = await updateBankQuestion(curator(), questionId, { difficulty: 1, stem: `ZZ review ${STAMP}: which number is even?`, choices: ["3", "4", "5"], answerIndex: 1, solution: "Four divides by two with nothing left over, so it is even." });
    expect(edited).toEqual({ ok: true, translated: false });
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId }, select: { hiReviewedAt: true } })).hiReviewedAt).not.toBeNull();

    __resetCookies();
    await createSession(curatorId);
    const res = await translationsGet(new Request(`http://localhost/api/v1/appadmin/translations?language=hi&status=reviewed&topic=${topicId}`));
    expect(res.status).toBe(200);
    const body = translationsSchema.parse(await res.json());
    expect(body.items.map((i) => i.id)).toEqual([questionId]);
    const off = await reviewPost(new Request(`http://localhost/api/v1/appadmin/translations/${questionId}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: "hi", reviewed: false }) }), { params: Promise.resolve({ questionId }) });
    expect(off.status).toBe(200);
    expect(await off.json()).toEqual({ ok: true, reviewed: false });
    const bad = await reviewPost(new Request(`http://localhost/api/v1/appadmin/translations/${questionId}/review`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ language: "hi", text: { stem: "x", choices: ["one"], solution: "y" }, reviewed: true }) }), { params: Promise.resolve({ questionId }) });
    expect(bad.status).toBe(422);
    // An ordinary account at the door.
    __resetCookies();
    await createSession(nobodyId);
    expect((await translationsGet(new Request("http://localhost/api/v1/appadmin/translations?language=hi"))).status).toBe(403);
  });
});
