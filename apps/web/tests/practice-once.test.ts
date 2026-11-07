import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLATFORM_FEATURES, practiceOnceAnsweredSchema, practiceOnceListSchema, practiceOnceSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { answerOnce, onceSets, openOnce, ONCE_QUESTIONS } from "@/lib/practice-once";
import { assignmentsForClass } from "@/lib/practice-insights";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { ENDPOINTS } from "@/lib/api-catalog";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as onceGet, POST as oncePost } from "@/app/api/v1/practice/once/route";
import { POST as onceAnswerPost } from "@/app/api/v1/practice/once/answer/route";
import type { ActiveContext } from "@/lib/session";

/**
 * ONE-TIME PRACTICE (decision 0008, 7 November 2026): a pupil without the Student plan opens a set a teacher
 * assigned once — a fixed draw of the chapter's questions nearest the target rung, each answered once, scored — and
 * a second open shows the result; it counts toward nothing else. Everything is ZZ and made here: a fixture school,
 * two pupils in a class, a teacher, a chapter of twelve questions over four rungs and a set targeting the second.
 * Deleted afterwards.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const SLUG = `zz-once-${STAMP}`;
let schoolId = "";
let classId = "";
let topicId = "";
let assignmentId = "";
let archivedId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
/** The question ids by rung, in id order. */
const byLevel: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };

const ctx = (key: string, role: ActiveContext["role"]): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: true, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } } }) as ActiveContext;
const p1 = () => ctx("p1", "STUDENT");
const p2 = () => ctx("p2", "STUDENT");
const teacher = () => ctx("teacher", "TEACHER");
const refusal = async (work: Promise<unknown>) => {
  try {
    await work;
    return "let through";
  } catch (error) {
    return error instanceof AccessError ? `${error.code}:${error.key}` : String(error);
  }
};

beforeAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests(["STUDENT"]);
  schoolId = (await db.school.create({ data: { name: `ZZ Once School ${STAMP}`, slug: `zz-once-${STAMP}`, code: `ZO${String(STAMP).slice(-6)}`, contactEmail: `zz-once-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const person = async (key: string, role: string, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ Once ${key} ${STAMP}`, email: `zz-once-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } })).id;
    member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZO${key}${STAMP}` } : {}) }, select: { id: true } })).id;
  };
  await person("p1", "STUDENT", { isMinor: true });
  await person("p2", "STUDENT", { isMinor: true });
  await person("teacher", "TEACHER");
  classId = (await db.class.create({ data: { schoolId, name: `ZZ Once Class ${STAMP}`, gradeLevel: "5", joinCode: `ZO${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: member.teacher!, role: "LEAD" } });
  for (const key of ["p1", "p2"]) await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: member[key]!, status: "ACTIVE" } });
  topicId = (await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 5, chapter: "ZZ Once", name: `ZZ Once Fractions ${STAMP}`, slug: SLUG, summary: "ZZ halves." }, select: { id: true } })).id;
  // Twelve questions, three on each of four rungs, the right answer always first.
  for (const difficulty of [1, 2, 3, 4]) {
    for (let n = 0; n < 3; n++) {
      const row = await db.quizQuestion.create({ data: { topicId, difficulty, stem: `ZZ L${difficulty} question ${n}?`, choices: JSON.stringify(["right", "wrong", "also wrong"]), answerIndex: 0, solution: `ZZ working L${difficulty}/${n}.`, source: "test", licence: "test" }, select: { id: true } });
      byLevel[difficulty]!.push(row.id);
    }
    byLevel[difficulty]!.sort();
  }
  await db.quizQuestionTranslation.create({ data: { questionId: byLevel[2]![0]!, language: "hi", stem: "ZZ स्तर दो का प्रश्न?", choices: JSON.stringify(["सही", "गलत", "यह भी गलत"]), solution: "ZZ हल।" } });
  assignmentId = (await db.practiceAssignment.create({ data: { schoolId, classId, topicId, targetLevel: 2, note: "ZZ climb to L2", createdById: member.teacher! }, select: { id: true } })).id;
  archivedId = (await db.practiceAssignment.create({ data: { schoolId, classId, topicId, targetLevel: 3, createdById: member.teacher!, archivedAt: new Date() }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  setActivePlansForTests([]);
  setFeaturesForTests([...PLATFORM_FEATURES]);
  await db.quizTopic.deleteMany({ where: { slug: SLUG } });
  await db.session.deleteMany({ where: { userId: { in: Object.values(id) } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: Object.values(id) } } });
  await db.$disconnect();
}, 120_000);

describe("the sets and the draw", () => {
  it("lists the pupil's live sets as not opened, with the ten an open would draw; an archived set is not listed", async () => {
    const sets = await onceSets(p1());
    expect(sets.map((s) => s.assignmentId)).toEqual([assignmentId]);
    expect(sets[0]).toMatchObject({ topicSlug: SLUG, targetLevel: 2, targetTierName: "Learner", note: "ZZ climb to L2", state: "NOT_OPENED", total: ONCE_QUESTIONS, answered: 0, correct: 0 });
    expect(practiceOnceListSchema.parse({ sets })).toBeTruthy();
  });

  it("the first open draws the ten nearest the target rung (L2, then L1, then L3; never L4) in a fixed order and serves the first without its answer; a second open resumes the same row", async () => {
    const first = await openOnce(p1(), assignmentId);
    expect(first.set).toMatchObject({ state: "OPEN", total: 10, answered: 0 });
    const row = await db.practiceOnce.findUniqueOrThrow({ where: { id: first.onceId } });
    const drawn = row.questionIds as string[];
    expect(drawn).toEqual([...byLevel[2]!, ...byLevel[1]!, ...byLevel[3]!, byLevel[4]![0]!]);
    expect(first.question).toMatchObject({ questionId: byLevel[2]![0], difficulty: 2, askedCount: 0, totalCount: 10 });
    expect(Object.keys(first.question!)).not.toContain("answerIndex");
    const again = await openOnce(p1(), assignmentId, "hi");
    expect(again.onceId).toBe(first.onceId);
    expect(again.question).toMatchObject({ questionId: byLevel[2]![0], stem: "ZZ स्तर दो का प्रश्न?", choices: ["सही", "गलत", "यह भी गलत"] });
    expect(await db.practiceOnce.count({ where: { studentMembershipId: member.p1 } })).toBe(1);
  });

  it("an archived set, another pupil's set id and a chapter with nothing to draw are not found", async () => {
    expect(await refusal(openOnce(p1(), archivedId))).toBe("NOT_FOUND:access.noSuchTopic");
    expect(await refusal(openOnce(p1(), "czzoncenosuchassignment000"))).toBe("NOT_FOUND:access.noSuchTopic");
    expect(await refusal(openOnce(teacher(), assignmentId))).toBe("FORBIDDEN:access.wrongRoleForThisAction");
    const emptyTopic = await db.quizTopic.create({ data: { subject: "MATHS", classLevel: 5, chapter: "ZZ Empty", name: `ZZ Once Empty ${STAMP}`, slug: `${SLUG}-empty` }, select: { id: true } });
    const emptySet = await db.practiceAssignment.create({ data: { schoolId, classId, topicId: emptyTopic.id, targetLevel: 1, createdById: member.teacher! }, select: { id: true } });
    expect(await refusal(openOnce(p2(), emptySet.id))).toBe("NOT_FOUND:practiceOnce.refuseEmpty");
    await db.practiceAssignment.delete({ where: { id: emptySet.id } });
    await db.quizTopic.delete({ where: { id: emptyTopic.id } });
  });
});

describe("answering once", () => {
  it("marks an answer with the working and serves the next; the same question again is the stored verdict; a question outside the draw is not found; an out-of-range choice is recorded wrong", async () => {
    const { onceId } = await openOnce(p1(), assignmentId);
    const first = await answerOnce(p1(), onceId, byLevel[2]![0]!, 0, "hi");
    expect(first).toMatchObject({ replayed: false, correct: true, answerIndex: 0, solution: "ZZ हल।", set: { answered: 1, correct: 1, state: "OPEN" } });
    expect(first.question).toMatchObject({ questionId: byLevel[2]![1], askedCount: 1 });
    const replay = await answerOnce(p1(), onceId, byLevel[2]![0]!, 2);
    expect(replay).toMatchObject({ replayed: true, correct: true, set: { answered: 1, correct: 1 } });
    expect(await refusal(answerOnce(p1(), onceId, byLevel[4]![2]!, 0))).toBe("NOT_FOUND:access.questionNotFound");
    expect(await refusal(answerOnce(p2(), onceId, byLevel[2]![1]!, 0))).toBe("NOT_FOUND:access.attemptNotFound");
    const wide = await answerOnce(p1(), onceId, byLevel[2]![1]!, 9);
    expect(wide).toMatchObject({ replayed: false, correct: false, answerIndex: 0, set: { answered: 2, correct: 1 } });
    expect(practiceOnceAnsweredSchema.parse({ ...wide, question: wide.question ? { questionId: wide.question.questionId, stem: wide.question.stem, choices: wide.question.choices, difficulty: wide.question.difficulty, askedCount: wide.question.askedCount, totalCount: wide.question.totalCount, image: null } : null })).toBeTruthy();
  });

  it("the last answer finishes the set and fixes the score; a further open shows the result and no question; nothing moved a rung, opened a sitting or earned a badge", async () => {
    const { onceId } = await openOnce(p1(), assignmentId);
    let view = await openOnce(p1(), assignmentId);
    let guard = 0;
    while (view.question && guard++ < 20) {
      const r = await answerOnce(p1(), onceId, view.question.questionId, 0);
      view = { onceId, set: r.set, question: r.question };
    }
    expect(view.set).toMatchObject({ state: "DONE", total: 10, answered: 10, correct: 9 });
    const done = await openOnce(p1(), assignmentId);
    expect(done.question).toBeNull();
    expect(done.set).toMatchObject({ state: "DONE", correct: 9, total: 10 });
    expect((await onceSets(p1()))[0]).toMatchObject({ state: "DONE", correct: 9, total: 10 });
    expect(practiceOnceSchema.parse({ onceId: done.onceId, set: done.set, question: null })).toBeTruthy();
    expect(await db.quizAttempt.count({ where: { studentMembershipId: member.p1 } })).toBe(0);
    expect(await db.quizMastery.count({ where: { studentMembershipId: member.p1 } })).toBe(0);
    expect(await db.earnedBadge.count({ where: { studentMembershipId: member.p1 } })).toBe(0);
  });

  it("the teacher's class view carries each pupil's one-time score beside the rung", async () => {
    const view = await assignmentsForClass(teacher(), classId);
    const set = view.find((a) => a.id === assignmentId)!;
    const one = set.pupils.find((p) => p.name === `ZZ Once p1 ${STAMP}`)!;
    expect(one).toMatchObject({ level: 0, reached: false, once: { correct: 9, total: 10, answered: 10, finished: true } });
    expect(set.pupils.find((p) => p.name === `ZZ Once p2 ${STAMP}`)!.once).toBeNull();
  });
});

describe("the doors", () => {
  const get = (path: string) => new Request(`http://localhost${path}`);
  const post = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

  it("are in the catalog as the pupil's, plan-free under the bank's switch, reaching the caller alone", () => {
    for (const [method, path] of [["GET", "/api/v1/practice/once"], ["POST", "/api/v1/practice/once"], ["POST", "/api/v1/practice/once/answer"]] as const) {
      const door = ENDPOINTS.find((e) => e.method === method && e.path === path)!;
      expect(door, `${method} ${path}`).toBeTruthy();
      expect(door.access).toEqual(["STUDENT"]);
      expect(door.feature).toBe("QUESTION_BANK");
      expect(door.planFree).toBeTruthy();
      expect(door.reach).toBe("self");
    }
  });

  it("answer 401 signed out, 403 to a teacher, and for the pupil the list, the open (422 without a body, 404 for an invented set) and the answer", async () => {
    __resetCookies();
    for (const call of [onceGet(get("/api/v1/practice/once")), oncePost(post("/api/v1/practice/once", { assignmentId })), onceAnswerPost(post("/api/v1/practice/once/answer", {}))]) expect((await call).status).toBe(401);
    __resetCookies();
    await createSession(id.teacher!, { schoolId, role: "TEACHER" });
    expect((await onceGet(get("/api/v1/practice/once"))).status).toBe(403);
    __resetCookies();
    await createSession(id.p2!, { schoolId, role: "STUDENT" });
    const list = practiceOnceListSchema.parse(await (await onceGet(get("/api/v1/practice/once?language=en"))).json());
    expect(list.sets.map((s) => s.state)).toEqual(["NOT_OPENED"]);
    expect((await oncePost(post("/api/v1/practice/once", {}))).status).toBe(422);
    expect((await oncePost(post("/api/v1/practice/once", { assignmentId: "czzoncenosuchassignment000" }))).status).toBe(404);
    const opened = practiceOnceSchema.parse(await (await oncePost(post("/api/v1/practice/once", { assignmentId }))).json());
    expect(opened.set).toMatchObject({ state: "OPEN", answered: 0 });
    expect(opened.question?.questionId).toBe(byLevel[2]![0]);
    const answered = practiceOnceAnsweredSchema.parse(await (await onceAnswerPost(post("/api/v1/practice/once/answer", { onceId: opened.onceId, questionId: opened.question!.questionId, chosenIndex: 1, clientId: `zz-once-${STAMP}` }))).json());
    expect(answered).toMatchObject({ replayed: false, correct: false, answerIndex: 0, set: { answered: 1, correct: 0 } });
    expect((await onceAnswerPost(post("/api/v1/practice/once/answer", { onceId: opened.onceId, questionId: opened.question!.questionId, chosenIndex: 1 }))).status).toBe(422);
  });
});
