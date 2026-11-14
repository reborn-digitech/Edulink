/**
 * The owner's follow-up to TA-199 of the testing analysis of 13 November 2026 (option 1, 14 November 2026), held by
 * cases that FAIL on the code before it and pass once it is built.
 *
 *   TA-199  927623e6 withholds a Hindi or Marathi row older than the desk's English edit, and the desk had no way to
 *           say such a row is still right: the reviewer had to retype it. Now the edit form carries a "still right"
 *           tick per language, saved with the English; a row already marked out of date has a Still right button
 *           (POST …/{questionId}/confirm-translation); both are refused when the English since that language was
 *           written reordered the options or moved the answer; the desk records who confirmed. And a one-time repair
 *           (scripts/quiz-stale-repair.ts) sets each item's out-of-date mark to its last real word change from the
 *           edit history, so the translations hidden by level-only or check-only edits come back, without clearing a
 *           mark a word edit set.
 *
 * Everything is ZZ and made here: a fixture school, a pupil, a teacher, a content-team reviewer, one small chapter per
 * case; deleted afterwards. The repair runs only on this suite's own questions (its questionIds), never on the bank.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLATFORM_FEATURES, quizBankStandingSchema, type QuizReviewEditBody } from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { nextQuestion, startAttempt } from "@/lib/quiz";
import * as quizReview from "@/lib/quiz-review";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { repairStaleMarks } from "../scripts/quiz-stale-repair";

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const db = new PrismaClient();
const STAMP = Date.now();
const P = `zz-taf199-${STAMP}`;
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const item: Record<string, { slug: string; q: string }> = {};

const EN = { stem: "ZZ TAF199 what are seven and five?", choices: ["12", "15", "16"], answerIndex: 0, solution: "ZZ working: seven and five make twelve." };
const MR = { stem: "ZZ सात आणि पाच किती?", choices: ["१२", "१५", "१६"], solution: "ZZ सात आणि पाच मिळून बारा होतात." };
const HI = { stem: "ZZ सात और पाँच कितने?", choices: ["१२", "१५", "१६"], solution: "ZZ सात और पाँच मिलकर बारह होते हैं।" };

const pupil = (): ActiveContext =>
  ({ sessionId: "test", membershipId: member.pupil ?? null, schoolId, role: "STUDENT", user: { id: id.pupil!, name: "ZZ pupil", preferredName: null, email: null, avatarKey: null, isMinor: true, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } } }) as ActiveContext;
const curator = (): ActiveContext =>
  ({ sessionId: "test", membershipId: null, schoolId: null, role: null, user: { id: id.curator!, name: "ZZ curator", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: true } }) as ActiveContext;

const post = (path: string, body?: unknown) =>
  new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const params = (questionId: string) => ({ params: Promise.resolve({ questionId }) });

/**
 * A chapter with one generated item, its Marathi and Hindi rows written a minute ago (before any desk edit: a row
 * written in the same millisecond as the edit is not older than it, which the suite must not stumble on).
 */
async function make(key: string): Promise<string> {
  const slug = `${P}-${key}`;
  const t = await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 6, chapter: `ZZ ${key}`, name: `ZZ TAF199 ${key} ${STAMP}`, slug, summary: "ZZ." }, select: { id: true } });
  const q = await db.quizQuestion.create({
    data: { topicId: t.id, difficulty: 1, stem: EN.stem, choices: JSON.stringify(EN.choices), answerIndex: 0, solution: EN.solution, checkExpr: "7+5", source: "test", licence: "test", generated: true, generatedBoard: "NCERT" },
    select: { id: true },
  });
  const written = new Date(Date.now() - 60_000);
  await db.quizQuestionTranslation.create({ data: { questionId: q.id, language: "mr", stem: MR.stem, choices: JSON.stringify(MR.choices), solution: MR.solution, updatedAt: written } });
  await db.quizQuestionTranslation.create({ data: { questionId: q.id, language: "hi", stem: HI.stem, choices: JSON.stringify(HI.choices), solution: HI.solution, updatedAt: written } });
  item[key] = { slug, q: q.id };
  return q.id;
}

/** What a pupil reading in `language` is served of the item now. */
async function servedIn(key: string, language: "mr" | "hi") {
  await db.quizAttempt.deleteMany({ where: { studentMembershipId: member.pupil } });
  const { attemptId } = await startAttempt(pupil(), item[key]!.slug);
  return (await nextQuestion(pupil(), attemptId, language))!;
}

const edit = (changes: Partial<QuizReviewEditBody>): QuizReviewEditBody => ({ ...EN, choices: [...EN.choices], checkExpr: "7+5", difficulty: 1, ...changes });
const confirmations = (q: string, language: "hi" | "mr") => db.quizReviewStamp.count({ where: { questionId: q, action: "STAMP_TRANSLATION", language, reviewerUserId: id.curator } });

beforeAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests(["STUDENT"]);
  schoolId = (await db.school.create({ data: { name: `ZZ TAF199 School ${STAMP}`, slug: `zz-taf199-${STAMP}`, code: `ZF${String(STAMP).slice(-6)}`, contactEmail: `zz-taf199-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  for (const [key, role] of [["pupil", "STUDENT"], ["teacher", "TEACHER"]] as const) {
    id[key] = (await db.user.create({ data: { name: `ZZ TAF199 ${key} ${STAMP}`, email: `zz-taf199-${key}-${STAMP}@test.invalid`, isMinor: role === "STUDENT", isTestFixture: true }, select: { id: true } })).id;
    member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  id.curator = (await db.user.create({ data: { name: `ZZ TAF199 curator ${STAMP}`, email: `zz-taf199-curator-${STAMP}@test.invalid`, isTestFixture: true, isAppAdmin: true }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  setActivePlansForTests([]);
  setFeaturesForTests([...PLATFORM_FEATURES]);
  const questions = Object.values(item).map((i) => i.q);
  const users = Object.values(id);
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { targetType: "QuizQuestion", targetId: { in: questions } }] } });
  await db.quizTopic.deleteMany({ where: { slug: { startsWith: P } } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
}, 120_000);

describe("TA-199: the edit form's still-right tick", () => {
  it("TA-199: the Marathi ticked still right with an English correction that keeps the options and the answer in place is served again, and the desk records who confirmed; the Hindi not ticked gives way to the English", async () => {
    const q = await make("tick");
    const saved = await quizReview.editItem(curator(), q, edit({ stem: "ZZ TAF199 what do seven and five make?", solution: "ZZ working, corrected: seven and five make twelve.", confirmTranslations: ["mr"] }));
    expect(saved.ok).toBe(true);
    const row = await db.quizQuestion.findUniqueOrThrow({ where: { id: q } });
    expect(row.editedAfterSolvingAt).not.toBeNull();
    expect(row.stem).toBe("ZZ TAF199 what do seven and five make?");
    expect(row.mrReviewedBy).toBe(id.curator);
    expect((await servedIn("tick", "mr")).choices).toEqual(MR.choices);
    expect((await servedIn("tick", "hi")).choices).toEqual(EN.choices);
    expect(await confirmations(q, "mr")).toBe(1);
    expect(await confirmations(q, "hi")).toBe(0);
    expect(await db.auditLog.count({ where: { action: "appadmin.quizBank.confirmTranslation", targetId: q, actorUserId: id.curator } })).toBe(1);
    const desk = await quizReview.getItem(curator(), q);
    expect(desk.translations.mr!.stale).toBe(false);
    expect(desk.translations.hi!.stale).toBe(true);
    expect(desk.stamps.some((s) => s.action === "STAMP_TRANSLATION" && s.language === "mr")).toBe(true);
  });

  it("TA-199: the tick is refused when the English edit reordered the options, and nothing of the press is written", async () => {
    const q = await make("order");
    const refused = await quizReview.editItem(curator(), q, edit({ choices: ["12", "16", "15"], solution: "ZZ working, reordered: seven and five make twelve.", confirmTranslations: ["mr"] }));
    expect(refused).toEqual({ ok: false, errorKey: "quizReview.confirmRefusedOrder" });
    const row = await db.quizQuestion.findUniqueOrThrow({ where: { id: q } });
    expect(row.choices).toBe(JSON.stringify(EN.choices));
    expect(row.editedAfterSolvingAt).toBeNull();
    expect(await db.quizReviewStamp.count({ where: { questionId: q } })).toBe(0);
    // The same edit without the tick is saved, and the Marathi gives way to the English until it is corrected.
    expect((await quizReview.editItem(curator(), q, edit({ choices: ["12", "16", "15"], solution: "ZZ working, reordered: seven and five make twelve." }))).ok).toBe(true);
    expect((await servedIn("order", "mr")).choices).toEqual(["12", "16", "15"]);
  });

  it("TA-199: the tick is refused when the English edit moved the answer to another option", async () => {
    const q = await make("moved");
    const refused = await quizReview.editItem(curator(), q, edit({ answerIndex: 1, checkExpr: null, solution: "ZZ working, now fifteen: seven and eight make fifteen.", confirmTranslations: ["mr", "hi"] }));
    expect(refused).toEqual({ ok: false, errorKey: "quizReview.confirmRefusedOrder" });
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: q } })).answerIndex).toBe(0);
    expect(await db.quizReviewStamp.count({ where: { questionId: q } })).toBe(0);
  });
});

describe("TA-199: Still right on a row already out of date", () => {
  it("TA-199: Still right on a Marathi row marked out of date serves it again and records who confirmed; pressing it again changes nothing", async () => {
    const q = await make("button");
    expect((await quizReview.editItem(curator(), q, edit({ solution: "ZZ working, reworded: seven added to five is twelve." }))).ok).toBe(true);
    expect((await servedIn("button", "mr")).choices).toEqual(EN.choices);
    const confirmed = await quizReview.confirmTranslation(curator(), q, "mr");
    expect(confirmed.ok).toBe(true);
    expect((await servedIn("button", "mr")).choices).toEqual(MR.choices);
    expect((await servedIn("button", "hi")).choices).toEqual(EN.choices);
    expect(await confirmations(q, "mr")).toBe(1);
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: q } })).mrReviewedBy).toBe(id.curator);
    expect((await quizReview.confirmTranslation(curator(), q, "mr")).ok).toBe(true);
    expect(await confirmations(q, "mr")).toBe(1);
    expect(await db.auditLog.count({ where: { action: "appadmin.quizBank.confirmTranslation", targetId: q } })).toBe(1);
  });

  it("TA-199: Still right is refused when an edit since the Marathi was written moved the answer, though a later edit changed only the working", async () => {
    const q = await make("button-moved");
    expect((await quizReview.editItem(curator(), q, edit({ answerIndex: 1, checkExpr: null, solution: "ZZ working, now fifteen: seven and eight make fifteen." }))).ok).toBe(true);
    expect((await quizReview.editItem(curator(), q, edit({ answerIndex: 1, checkExpr: null, solution: "ZZ working, reworded: eight added to seven is fifteen." }))).ok).toBe(true);
    expect(await quizReview.confirmTranslation(curator(), q, "mr")).toEqual({ ok: false, errorKey: "quizReview.confirmRefusedOrder" });
    expect(await confirmations(q, "mr")).toBe(0);
    expect((await servedIn("button-moved", "mr")).choices).toEqual(EN.choices);
  });

  it("TA-199: the confirmation door answers the standing to the content team, 422 for an empty body or a reordered item, and 403 to a school's teacher", async () => {
    const route = await import("@/app/api/v1/appadmin/quiz-review/[questionId]/confirm-translation/route");
    const q = await make("door");
    const r = await make("door-reordered");
    expect((await quizReview.editItem(curator(), q, edit({ stem: "ZZ TAF199 seven and five together?" }))).ok).toBe(true);
    expect((await quizReview.editItem(curator(), r, edit({ choices: ["16", "15", "12"], answerIndex: 2, checkExpr: null }))).ok).toBe(true);
    const path = (questionId: string) => `/api/v1/appadmin/quiz-review/${questionId}/confirm-translation`;

    __resetCookies();
    await createSession(id.teacher!, { schoolId, role: "TEACHER" });
    expect((await route.POST(post(path(q), { language: "mr" }), params(q))).status).toBe(403);

    __resetCookies();
    await createSession(id.curator!);
    expect((await route.POST(post(path(q), {}), params(q))).status).toBe(422);
    expect((await route.POST(post(path(r), { language: "mr" }), params(r))).status).toBe(422);
    const res = await route.POST(post(path(q), { language: "hi" }), params(q));
    expect(res.status).toBe(200);
    expect(quizBankStandingSchema.parse(await res.json()).ok).toBe(true);
    expect((await servedIn("door", "hi")).choices).toEqual(HI.choices);
    __resetCookies();
  });
});

describe("TA-199: the one-time repair of the out-of-date marks", () => {
  it("TA-199: the repair sets each mark to the item's last real word change from the edit history, never simply clears one a word edit set, leaves a mark it cannot explain, and writes nothing on a dry run", async () => {
    const hour = 3_600_000;
    const base = Date.now() - 10 * hour;
    const t1 = new Date(base + hour);
    const t2 = new Date(base + 2 * hour);
    const before = (words: typeof EN, difficulty = 1) => JSON.stringify({ difficulty, ...words, checkExpr: "7+5", translations: { hi: null, mr: null } });
    const E1 = { ...EN, stem: "ZZ TAF199 seven plus five?" };
    const setWritten = (q: string, language: "hi" | "mr", at: Date) => db.quizQuestionTranslation.updateMany({ where: { questionId: q, language }, data: { updatedAt: at } });

    // A: a word edit at t1, then a level-only edit at t2 that (under the old rule) moved the mark to t2. The Marathi
    // was corrected between the two; the Hindi is older than the word edit and really out of date.
    const a = await make("repair-a");
    await db.quizQuestion.update({ where: { id: a }, data: { stem: E1.stem, difficulty: 2, editedAfterSolvingAt: t2 } });
    await db.quizReviewStamp.createMany({ data: [
      { questionId: a, reviewerUserId: id.curator!, role: "APP_ADMIN", action: "EDIT", before: before(EN), at: t1 },
      { questionId: a, reviewerUserId: id.curator!, role: "APP_ADMIN", action: "EDIT", before: before(E1), at: t2 },
    ] });
    await setWritten(a, "mr", new Date(t1.getTime() + 60_000));
    await setWritten(a, "hi", new Date(t1.getTime() - 60_000));
    // B: a level-only edit and nothing else: no word ever changed.
    const b = await make("repair-b");
    await db.quizQuestion.update({ where: { id: b }, data: { difficulty: 2, editedAfterSolvingAt: t2 } });
    await db.quizReviewStamp.create({ data: { questionId: b, reviewerUserId: id.curator!, role: "APP_ADMIN", action: "EDIT", before: before(EN), at: t2 } });
    await setWritten(b, "mr", t1);
    // C: a mark that is no edit's time: left as it is.
    const c = await make("repair-c");
    await db.quizQuestion.update({ where: { id: c }, data: { editedAfterSolvingAt: t2 } });
    await setWritten(c, "mr", t1);
    // D: the last edit is a word change: already right.
    const d = await make("repair-d");
    await db.quizQuestion.update({ where: { id: d }, data: { stem: E1.stem, editedAfterSolvingAt: t1 } });
    await db.quizReviewStamp.create({ data: { questionId: d, reviewerUserId: id.curator!, role: "APP_ADMIN", action: "EDIT", before: before(EN), at: t1 } });
    expect((await db.quizQuestionTranslation.findFirstOrThrow({ where: { questionId: a, language: "mr" } })).updatedAt.getTime()).toBe(t1.getTime() + 60_000);

    const questionIds = [a, b, c, d];
    expect((await servedIn("repair-a", "mr")).choices).toEqual(EN.choices);
    expect((await servedIn("repair-b", "mr")).choices).toEqual(EN.choices);

    const dry = await repairStaleMarks(db, { apply: false, questionIds });
    expect(dry).toEqual({ marked: 4, kept: 1, moved: 1, cleared: 1, unknown: 1, written: 0 });
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: a } })).editedAfterSolvingAt?.getTime()).toBe(t2.getTime());

    const applied = await repairStaleMarks(db, { apply: true, questionIds });
    expect(applied).toEqual({ marked: 4, kept: 1, moved: 1, cleared: 1, unknown: 1, written: 2 });
    const mark = async (q: string) => (await db.quizQuestion.findUniqueOrThrow({ where: { id: q } })).editedAfterSolvingAt?.getTime() ?? null;
    expect(await mark(a)).toBe(t1.getTime());
    expect(await mark(b)).toBeNull();
    expect(await mark(c)).toBe(t2.getTime());
    expect(await mark(d)).toBe(t1.getTime());
    expect(await db.auditLog.count({ where: { action: "operator.quizBank.markRepair", targetId: { in: questionIds } } })).toBe(2);

    // The Marathi corrected after the word edit comes back; the Hindi written before it stays withheld.
    expect((await servedIn("repair-a", "mr")).choices).toEqual(MR.choices);
    expect((await servedIn("repair-a", "hi")).choices).toEqual(E1.choices);
    expect((await servedIn("repair-b", "mr")).choices).toEqual(MR.choices);
    expect((await servedIn("repair-c", "mr")).choices).toEqual(EN.choices);

    // Idempotent.
    expect(await repairStaleMarks(db, { apply: true, questionIds })).toEqual({ marked: 3, kept: 2, moved: 0, cleared: 0, unknown: 1, written: 0 });
  });
});
