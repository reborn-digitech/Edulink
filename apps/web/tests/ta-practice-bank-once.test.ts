/**
 * Assigned sets and one-time practice, findings of the testing analysis of 13 November 2026 held by cases that FAIL
 * while the defect stands and pass once it is fixed.
 *
 *   TA-198  Only the ten newest live sets existed for a pupil: an older set could not be opened once, one half
 *           answered could not be finished, and the plan's begin door answered 404 for it.
 *   TA-369  A one-time set kept serving a question the desk took down, and a deleted question blocked the set for good.
 *   TA-419  Two answers to two different questions of one set at once: the one that lost the conditional write was
 *           reported as a replay, with the key, and not recorded.
 *
 * Everything is ZZ and made here: a fixture school, two classes, a teacher, three pupils, chapters of their own and
 * the sets; deleted afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLATFORM_FEATURES, practiceBeganSchema } from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { answerOnce, openOnce } from "@/lib/practice-once";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { POST as beginPost } from "@/app/api/v1/practice/attempts/route";

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const db = new PrismaClient();
const STAMP = Date.now();
const P = `zz-tapbo-${STAMP}`;
let schoolId = "";
const classId: Record<string, string> = {};
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const topic: Record<string, { id: string; slug: string }> = {};

const pupil = (key: string): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId, role: "STUDENT", user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: true, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } } }) as ActiveContext;

async function chapter(key: string, count: number): Promise<void> {
  const slug = `${P}-${key}`;
  const t = await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 5, chapter: `ZZ ${key}`, name: `ZZ TAPBO ${key} ${STAMP}`, slug, summary: "ZZ." }, select: { id: true } });
  for (let n = 0; n < count; n++) {
    await db.quizQuestion.create({ data: { topicId: t.id, difficulty: 1, stem: `ZZ TAPBO ${key} question ${n}?`, choices: JSON.stringify(["right", "wrong", "also wrong"]), answerIndex: 0, solution: `ZZ working ${key}/${n}.`, source: "test", licence: "test" } });
  }
  topic[key] = { id: t.id, slug };
}

async function person(key: string, role: string, klass: string | null): Promise<void> {
  id[key] = (await db.user.create({ data: { name: `ZZ TAPBO ${key} ${STAMP}`, email: `zz-tapbo-${key}-${STAMP}@test.invalid`, isMinor: role === "STUDENT" }, select: { id: true } })).id;
  member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  if (klass) await db.enrollment.create({ data: { classId: classId[klass]!, schoolId, studentMembershipId: member[key]!, status: "ACTIVE" } });
}

const assign = async (klass: string, key: string, targetLevel: number, createdAt = new Date()) =>
  (await db.practiceAssignment.create({ data: { schoolId, classId: classId[klass]!, topicId: topic[key]!.id, targetLevel, createdById: member.teacher!, createdAt }, select: { id: true } })).id;

beforeAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests(["STUDENT"]);
  schoolId = (await db.school.create({ data: { name: `ZZ TAPBO School ${STAMP}`, slug: `zz-tapbo-${STAMP}`, code: `ZB${String(STAMP).slice(-6)}`, contactEmail: `zz-tapbo-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  for (const k of ["many", "few"]) classId[k] = (await db.class.create({ data: { schoolId, name: `ZZ TAPBO ${k} ${STAMP}`, gradeLevel: "5", joinCode: `Z${k.slice(0, 1).toUpperCase()}${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await person("teacher", "TEACHER", null);
  await person("eleven", "STUDENT", "many");
  await person("down", "STUDENT", "few");
  await person("twin", "STUDENT", "few");
  await chapter("eleven", 12);
  await chapter("down", 12);
  await chapter("twin", 12);
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

describe("TA-198: more than ten live sets", () => {
  it("TA-198: the oldest of eleven live sets opens once and is answered, and the plan's begin door opens its chapter", async () => {
    const base = Date.now() - 60 * 60 * 1000;
    const sets: string[] = [];
    for (let n = 0; n < 11; n++) sets.push(await assign("many", "eleven", 1, new Date(base + n * 60_000)));
    const oldest = sets[0]!;
    const opened = await openOnce(pupil("eleven"), oldest);
    expect(opened.set).toMatchObject({ assignmentId: oldest, state: "OPEN", answered: 0 });
    const answered = await answerOnce(pupil("eleven"), opened.onceId, opened.question!.questionId, 0);
    expect(answered).toMatchObject({ replayed: false, correct: true, set: { answered: 1 } });

    // Five more sets later, the half-answered one is twelve back and is still finished.
    for (let n = 0; n < 5; n++) await assign("many", "eleven", 1, new Date(base + (20 + n) * 60_000));
    const next = await answerOnce(pupil("eleven"), opened.onceId, answered.question!.questionId, 0);
    expect(next).toMatchObject({ replayed: false, set: { answered: 2 } });

    __resetCookies();
    await createSession(id.eleven!, { schoolId, role: "STUDENT" });
    const began = await beginPost(new Request("http://localhost/api/v1/practice/attempts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assignmentId: oldest, language: "en" }) }));
    expect(began.status).toBe(200);
    expect(practiceBeganSchema.parse(await began.json()).assignment?.id).toBe(oldest);
    __resetCookies();
  });
});

describe("TA-369: a drawn question taken down or deleted", () => {
  it("TA-369: a taken-down question leaves the draw, a deleted one does not block it, and the set finishes on what is left", async () => {
    const setId = await assign("few", "down", 1);
    const ctx = pupil("down");
    const opened = await openOnce(ctx, setId);
    const drawn = ((await db.practiceOnce.findUniqueOrThrow({ where: { id: opened.onceId } })).questionIds as string[]).slice();
    expect(drawn).toHaveLength(10);
    expect(opened.question!.questionId).toBe(drawn[0]);

    // The desk takes the second drawn question down; the first answer then serves the third.
    await db.quizQuestion.update({ where: { id: drawn[1]! }, data: { takenDownAt: new Date(), takenDownReason: "WRONG_KEY" } });
    const first = await answerOnce(ctx, opened.onceId, drawn[0]!, 0);
    expect(first.question?.questionId).toBe(drawn[2]);
    expect(first.set.total).toBe(9);
    // An answer to the taken-down question is refused, not marked against the withdrawn key.
    await expect(answerOnce(ctx, opened.onceId, drawn[1]!, 0)).rejects.toThrow("access.questionNotFound");

    // A later drawn question is deleted (as quiz:import deletes a curated question no file holds): the set still finishes.
    await db.quizQuestion.delete({ where: { id: drawn[4]! } });
    let view = { set: first.set, question: first.question };
    let guard = 0;
    while (view.question && guard++ < 20) {
      const r = await answerOnce(ctx, opened.onceId, view.question.questionId, 0);
      view = { set: r.set, question: r.question };
    }
    expect(view.set).toMatchObject({ state: "DONE", total: 8, answered: 8, correct: 8 });
    expect((await openOnce(ctx, setId)).set).toMatchObject({ state: "DONE", total: 8, answered: 8 });
  });
});

describe("TA-419: two answers of one set at once", () => {
  it("TA-419: two answers to two different drawn questions at the same moment are both recorded, neither reported as a replay", async () => {
    const setId = await assign("few", "twin", 1);
    const ctx = pupil("twin");
    for (let round = 0; round < 10; round++) {
      await db.practiceOnce.deleteMany({ where: { studentMembershipId: member.twin, assignmentId: setId } });
      const opened = await openOnce(ctx, setId);
      const drawn = (await db.practiceOnce.findUniqueOrThrow({ where: { id: opened.onceId } })).questionIds as string[];
      const both = await Promise.all([answerOnce(ctx, opened.onceId, drawn[0]!, 0), answerOnce(ctx, opened.onceId, drawn[1]!, 1)]);
      expect(both.map((r) => r.replayed), `round ${round}`).toEqual([false, false]);
      const row = await db.practiceOnce.findUniqueOrThrow({ where: { id: opened.onceId } });
      const answers = (row.answers as { questionId: string; correct: boolean }[]).map((a) => `${a.questionId}:${a.correct}`).sort();
      expect(answers, `round ${round}`).toEqual([`${drawn[0]}:true`, `${drawn[1]}:false`].sort());
      expect(row.correct, `round ${round}`).toBe(1);
    }
  });
});
