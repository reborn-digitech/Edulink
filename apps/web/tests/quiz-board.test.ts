/**
 * The practice bank's board and the quiz bank's integration fixes (quiz-board, 11 October 2026).
 *
 * Proved here: the board codes and their rules (a CBSE school reads NCERT, a Maharashtra State Board
 * school Balbharati, any other both; the switch's order; a topic with no board in every position); the
 * migration's backfill as it stands in the database (every authored chapter NCERT's, the two queue
 * chapters their own board, the review queue's per-item board a code); the practice list by board
 * (listTopics, and the phone's read with each chapter's board and the school's); the queue loader's
 * figure step (a generated item with a geometry spec gets three stored drawings, a re-run keeps them and
 * duplicates nothing, a figure that cannot be drawn loads with its reason, a batch for a chapter of the
 * other board refuses the run); the single import path; and the payee door the closed gig keeps for a
 * teacher still owed money (404 otherwise). Every row is a ZZ row made here and removed after.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import React from "react";
import { PrismaClient } from "@prisma/client";
import { readFileSync, readdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import {
  asQuizBoard,
  familyStudentPracticeSchema,
  quizBoardChoice,
  quizBoardForSchool,
  quizBoardOrder,
  QUESTION_GIG_FOR_TEACHERS,
  topicOnBoard,
} from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { listTopics, schoolQuizBoard } from "@/lib/quiz";
import { quizBoardOptions } from "@/lib/quiz-board";
import { studentPractice } from "@/lib/api-reads/family";
import { getItem, listQueue, readGeneration } from "@/lib/quiz-review";
import { owedForQuestionsPaise, payeeDoorOpen } from "@/lib/question-gig";
import { readStoredFile } from "@/lib/storage";
import { ENDPOINTS } from "@/lib/api-catalog";
import { POST as gigPayeePost } from "@/app/api/v1/gigs/payee/route";
import TeacherPayeePage from "@/app/(app)/teacher/payee/page";
import { loadGeneratedBatches, type QueueBatch } from "../scripts/quiz-queue-load";
import { isServed } from "@/lib/quiz-served"; // quiz-publish-jobs (11 Oct 2026)
import { createVerifier, type TopicFile } from "../scripts/verify-quiz";
import { KIND_SAMPLES } from "../scripts/quiz-gen/figures/samples";

// Drawing and storing three PNGs takes seconds on a busy machine, and the battery runs suites side by side.
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const db = new PrismaClient();
// The payee page is rendered by calling it; the test transform compiles JSX to React.createElement.
(globalThis as { React?: unknown }).React = React;

/** A source file without its comments, so a rule about what the code writes is not tripped by what a comment says. */
const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
const ROOT = resolve(process.cwd(), ".tmp-quiz-board-store");
const REAL_STORAGE_DIR = process.env.STORAGE_DIR;
process.env.STORAGE_DIR = ROOT;

const STAMP = Date.now();
const P = `zz-qb-${STAMP}`;
const SLUG = { ncert: `${P}-ncert`, bal: `${P}-bal`, none: `${P}-none`, queue: `${P}-queue` };
let schoolId = "";
const ids = { pupil: "", teacher: "", owed: "" };
let pupilMembershipId = "";
let contributionTopicId = "";

const post = (path: string, body?: unknown) =>
  new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

function pupil(): ActiveContext {
  return {
    sessionId: "test",
    membershipId: pupilMembershipId,
    schoolId,
    role: "STUDENT",
    user: { id: ids.pupil, email: null, name: "ZZ QB Pupil", preferredName: null, avatarKey: null, isMinor: true, isSuperuser: false, isAppAdmin: false, prefs: { locale: "en" } },
  } as unknown as ActiveContext;
}

async function topicWithOneQuestion(slug: string, board: string | null) {
  const topic = await db.quizTopic.create({ data: { subject: "SCIENCE", classLevel: 8, chapter: `ZZ QB ${slug}`, name: `ZZ QB ${slug}`, slug, board }, select: { id: true } });
  await db.quizQuestion.create({
    data: { topicId: topic.id, difficulty: 1, stem: `ZZ QB ${slug}: what is 1+1?`, choices: JSON.stringify(["2", "3"]), answerIndex: 0, solution: "ZZ: one and one make two.", checkExpr: "1+1", source: "test", licence: "test" },
  });
  return topic.id;
}

/** A generated batch as quiz-gen writes it, with one item carrying a geometry figure in three languages. */
function batch(board: string, extra: Partial<QueueBatch> = {}): QueueBatch {
  return {
    subject: "MATHS",
    classLevel: 8,
    chapter: "ZZ QB Triangles",
    name: "ZZ QB Triangles",
    slug: SLUG.queue,
    source: "generated against ZZ",
    licence: "test",
    board,
    questions: [
      {
        difficulty: 2,
        stem: `ZZ QB ${STAMP}: which side of the right triangle ABC is the hypotenuse?`,
        choices: ["BC", "AB", "AC", "None"],
        answerIndex: 0,
        solution: "ZZ: the side opposite the right angle is the hypotenuse, BC.",
        imageAlt: "ZZ A right triangle ABC with the right angle at A.",
        figure: KIND_SAMPLES.geometry as QueueBatch["questions"][number]["figure"],
        needsFigure: true,
        translations: {
          hi: { stem: `ZZ QB ${STAMP}: कर्ण कौन-सा है?`, choices: ["BC", "AB", "AC", "कोई नहीं"], solution: "ZZ: BC।", imageAlt: "ZZ समकोण त्रिभुज ABC।" },
          mr: { stem: `ZZ QB ${STAMP}: कर्ण कोणता?`, choices: ["BC", "AB", "AC", "कोणतीही नाही"], solution: "ZZ: BC.", imageAlt: "ZZ काटकोन त्रिकोण ABC." },
        },
      },
      {
        difficulty: 1,
        stem: `ZZ QB ${STAMP}: a figure nobody can draw`,
        choices: ["A", "B"],
        answerIndex: 0,
        solution: "ZZ: the first option is the one the rule names, as the worked step shows.",
        imageAlt: "ZZ a figure of an unknown kind.",
        figure: { kind: "geometry", spec: { notAField: true } },
        needsFigure: true,
      },
    ],
    ...extra,
  };
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ QB School ${STAMP}`, slug: P, code: `ZB${String(STAMP).slice(-6)}`, contactEmail: `${P}@demo.relay.test`, timezone: "Asia/Kolkata", board: "MSBSHSE", /* a test fixture: the zz- chapters list for it (quiz-fixtures.ts, 11 Oct 2026) */ isTestFixture: true },
    select: { id: true },
  });
  schoolId = school.id;
  const make = (name: string) => db.user.create({ data: { name: `ZZ QB ${name}`, email: `${P}-${name.toLowerCase()}@demo.relay.test`, isTestFixture: true }, select: { id: true } });
  const [p, t, o] = await Promise.all([make("Pupil"), make("Teacher"), make("Owed")]);
  Object.assign(ids, { pupil: p.id, teacher: t.id, owed: o.id });
  pupilMembershipId = (await db.membership.create({ data: { userId: p.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZQB${STAMP}` }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: t.id, schoolId, role: "TEACHER", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: o.id, schoolId, role: "TEACHER", status: "ACTIVE" } });

  await topicWithOneQuestion(SLUG.ncert, "NCERT");
  await topicWithOneQuestion(SLUG.bal, "BALBHARATI");
  contributionTopicId = await topicWithOneQuestion(SLUG.none, null);

  // The owed teacher: one question the bank took while the gig was open, earned and not yet paid.
  const contribution = await db.questionContribution.create({
    data: {
      authorUserId: o.id, authorSchoolId: schoolId, authorSchoolName: "ZZ QB School", topicId: contributionTopicId, difficulty: 1,
      stem: "ZZ QB owed", choices: "[]", answerIndex: 0, solution: "ZZ", stemHi: "", choicesHi: "[]", solutionHi: "", stemMr: "", choicesMr: "[]", solutionMr: "",
      status: "ACCEPTED", termsAcceptedAt: new Date(),
    },
    select: { id: true },
  });
  await db.gigEarning.create({ data: { userId: o.id, kind: "QUESTION", contributionId: contribution.id, amountPaise: 2500, basis: "PAID", month: "2026-09" } });
});

afterAll(async () => {
  __resetCookies();
  const people = Object.values(ids).filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: people } } });
  await db.gigPayee.deleteMany({ where: { userId: { in: people } } });
  await db.quizTopic.deleteMany({ where: { slug: { startsWith: P } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: people } } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
  await rm(ROOT, { recursive: true, force: true });
  if (REAL_STORAGE_DIR === undefined) delete process.env.STORAGE_DIR;
  else process.env.STORAGE_DIR = REAL_STORAGE_DIR;
});

describe("the board codes, pure", () => {
  it("a CBSE school reads NCERT, a Maharashtra State Board school Balbharati, any other or none both", () => {
    expect(quizBoardForSchool("CBSE")).toBe("NCERT");
    expect(quizBoardForSchool("MSBSHSE")).toBe("BALBHARATI");
    for (const other of ["CISCE", "NIOS", "IB", "OTHER_STATE", "OTHER", null, undefined, "ncert"]) expect(quizBoardForSchool(other)).toBeNull();
  });

  it("the switch opens on the school's board, takes a chosen code, and falls to both", () => {
    expect(quizBoardChoice(undefined, "BALBHARATI")).toBe("BALBHARATI");
    expect(quizBoardChoice("NCERT", "BALBHARATI")).toBe("NCERT");
    expect(quizBoardChoice("ALL", "NCERT")).toBe("ALL");
    expect(quizBoardChoice("Balbharati", null)).toBe("ALL");
    expect(quizBoardOrder("BALBHARATI")).toEqual(["BALBHARATI", "NCERT"]);
    expect(quizBoardOptions("BALBHARATI")).toEqual(["BALBHARATI", "NCERT", "ALL"]);
    expect(quizBoardOptions(null)).toEqual(["ALL", "NCERT", "BALBHARATI"]);
  });

  it("a topic with no board (the placement banks) is in every position; a coded topic in its own and in both", () => {
    expect(topicOnBoard(null, "NCERT")).toBe(true);
    expect(topicOnBoard("NCERT", "BALBHARATI")).toBe(false);
    expect(topicOnBoard("NCERT", "ALL")).toBe(true);
    expect(asQuizBoard("Balbharati")).toBeNull();
  });
});

describe("the board column and its backfill", () => {
  it("every authored chapter is NCERT's, the two queue chapters their own board, and the queue's per-item board a code", async () => {
    const authoredSlugs = readdirSync(resolve(process.cwd(), "content/quiz")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
    const authored = await db.quizTopic.findMany({ where: { slug: { in: authoredSlugs } }, select: { slug: true, board: true } });
    expect(authored.filter((t) => t.board !== "NCERT")).toEqual([]);
    const queue = await db.quizTopic.findMany({ where: { slug: { in: ["balbharati-science-8-force-and-pressure", "science-8-electricity-magnetic-and-heating-effects"] } }, select: { slug: true, board: true } });
    for (const t of queue) expect(t.board).toBe(t.slug.startsWith("balbharati-") ? "BALBHARATI" : "NCERT");
    const loose = await db.quizQuestion.count({ where: { generated: true, NOT: { generatedBoard: { in: ["NCERT", "BALBHARATI"] } } } });
    expect(loose).toBe(0);
    const placement = await db.quizTopic.count({ where: { subject: { in: ["APTITUDE", "REASONING", "CODING"] }, board: { not: null } } });
    expect(placement).toBe(0);
  });

  it("the migration holds the backfill, so a database migrated before the next import has it", () => {
    const dir = readdirSync(resolve(process.cwd(), "prisma/migrations")).find((d) => d.endsWith("_quiz_topic_board"));
    expect(dir).toBeTruthy();
    const sql = readFileSync(resolve(process.cwd(), "prisma/migrations", dir!, "migration.sql"), "utf8");
    expect(sql).toMatch(/ADD COLUMN\s+"board" TEXT/);
    expect(sql).toContain(`SET "board" = 'NCERT'`);
    expect(sql).toContain(`SET "board" = 'BALBHARATI' WHERE "slug" LIKE 'balbharati-%'`);
  });
});

describe("the practice list by board", () => {
  it("listTopics takes a board: its chapters and those with none; both lists all three", async () => {
    const mine = (topics: { slug: string }[]) => topics.map((t) => t.slug).filter((s) => s.startsWith(P)).sort();
    expect(mine(await listTopics(pupil(), { board: "BALBHARATI" }))).toEqual([SLUG.bal, SLUG.none].sort());
    expect(mine(await listTopics(pupil(), { board: "NCERT" }))).toEqual([SLUG.ncert, SLUG.none].sort());
    const all = await listTopics(pupil(), { board: "ALL" });
    expect(mine(all)).toEqual([SLUG.bal, SLUG.ncert, SLUG.none].sort());
    expect(all.find((t) => t.slug === SLUG.bal)?.board).toBe("BALBHARATI");
    expect(all.find((t) => t.slug === SLUG.none)?.board).toBeNull();
    expect(mine(await listTopics(pupil()))).toEqual(mine(all));
  });

  it("the school's board is read from its record: a Maharashtra State Board school opens on Balbharati", async () => {
    expect(await schoolQuizBoard(schoolId)).toBe("BALBHARATI");
    expect(await schoolQuizBoard(null)).toBeNull();
  });

  it("the phone's read carries each chapter's board and the school's board, and parses with the contract", async () => {
    const read = familyStudentPracticeSchema.parse(await studentPractice(pupil() as Parameters<typeof studentPractice>[0]));
    expect(read.schoolBoard).toBe("BALBHARATI");
    expect(read.topics.find((t) => t.slug === SLUG.ncert)?.board).toBe("NCERT");
    expect(read.topics.find((t) => t.slug === SLUG.none)?.board).toBeNull();
    // An older phone reads the same answer without the fields: they are optional.
    const older: Record<string, unknown> = { ...read, topics: read.topics.map((t) => ({ ...t })) };
    delete older.schoolBoard;
    for (const t of older.topics as Record<string, unknown>[]) delete t.board;
    expect(familyStudentPracticeSchema.safeParse(older).success).toBe(true);
  });

  it("both practice pages draw the switch from the school's board and say a chapter's board", () => {
    for (const page of ["src/app/(app)/student/practice/page.tsx", "src/app/(app)/parent/practice/page.tsx"]) {
      const src = readFileSync(resolve(process.cwd(), page), "utf8");
      expect(src, page).toContain("<PracticeBoardSwitch");
      expect(src, page).toMatch(/quizBoardChoice\(boardParam, schoolBoard\)/);
      expect(src, page).toContain("quizBoardKey(");
    }
  });
});

describe("quiz:queue draws a generated item's figure and is the one way in", () => {
  it("a geometry item gets three stored drawings; a figure nobody can draw loads with its reason; the topic takes the batch's board", async () => {
    const r = await loadGeneratedBatches(db, [{ file: "zz.json", batch: batch("BALBHARATI") }]);
    expect(r).toMatchObject({ created: 2, topicsMade: 1, figuresDrawn: 1 });
    expect(r.figuresFailed).toHaveLength(1);
    const topic = await db.quizTopic.findUniqueOrThrow({ where: { slug: SLUG.queue }, select: { id: true, board: true } });
    expect(topic.board).toBe("BALBHARATI");
    const rows = await db.quizQuestion.findMany({ where: { topicId: topic.id }, select: { stem: true, generated: true, generatedBoard: true, reviewedAt: true, imageKey: true, imageAlt: true, imageSpec: true, generation: true, needsFigure: true, takenDownAt: true, translations: { select: { language: true, imageKey: true, imageAlt: true }, orderBy: { language: "asc" } } } });
    const drawn = rows.find((q) => q.stem.includes("hypotenuse"))!;
    expect(drawn).toMatchObject({ generated: true, generatedBoard: "BALBHARATI", reviewedAt: null, imageAlt: "ZZ A right triangle ABC with the right angle at A." });
    const keys = [drawn.imageKey, ...drawn.translations.map((t) => t.imageKey)];
    expect(keys.filter(Boolean)).toHaveLength(3);
    expect(new Set(keys).size).toBe(3);
    expect(drawn.translations.map((t) => t.imageAlt)).toEqual(["ZZ समकोण त्रिभुज ABC।", "ZZ काटकोन त्रिकोण ABC."]);
    for (const key of keys) expect((await readStoredFile(key!))?.bytes.length ?? 0).toBeGreaterThan(1000);
    expect(readGeneration(drawn.generation).figureError ?? null).toBeNull();

    const failed = rows.find((q) => q.stem.includes("nobody can draw"))!;
    expect(failed.imageKey).toBeNull();
    expect(readGeneration(failed.generation).figureError).toBeTruthy();
    // quiz-publish-jobs (11 Oct 2026): published on load — the drawn item is served with no stamp; the failed one is held.
    expect(drawn.needsFigure).toBe(true);
    expect(isServed(drawn)).toBe(true);
    expect(failed.needsFigure).toBe(true);
    expect(isServed(failed)).toBe(false);
  });

  it("the review queue filters by the coded board, and the desk's item carries its board and why its figure failed", async () => {
    const curator = { sessionId: "test", membershipId: null, schoolId: null, role: null, user: { id: ids.teacher, name: "ZZ QB Curator", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: true } } as unknown as ActiveContext;
    const topic = await db.quizTopic.findUniqueOrThrow({ where: { slug: SLUG.queue }, select: { id: true } });
    expect((await listQueue(curator, { board: "BALBHARATI" })).groups.some((g) => g.topicId === topic.id && g.board === "BALBHARATI")).toBe(true);
    expect((await listQueue(curator, { board: "NCERT" })).groups.some((g) => g.topicId === topic.id)).toBe(false);
    expect((await listQueue(curator, {})).boards.every((b) => b === "NCERT" || b === "BALBHARATI")).toBe(true);
    const failed = await db.quizQuestion.findFirstOrThrow({ where: { topicId: topic.id, stem: { contains: "nobody can draw" } }, select: { id: true } });
    const item = await getItem(curator, failed.id);
    expect(item.board).toBe("BALBHARATI");
    expect(item.figureError).toBeTruthy();
    expect(item.imageKey).toBeNull();
  });

  it("a re-run keeps the drawings and duplicates nothing", async () => {
    const before = await db.quizQuestion.findMany({ where: { topic: { slug: SLUG.queue } }, select: { id: true, imageKey: true }, orderBy: { id: "asc" } });
    const r = await loadGeneratedBatches(db, [{ file: "zz.json", batch: batch("BALBHARATI") }]);
    expect(r).toMatchObject({ created: 0, updated: 2, figuresDrawn: 0, figuresKept: 1 });
    const after = await db.quizQuestion.findMany({ where: { topic: { slug: SLUG.queue } }, select: { id: true, imageKey: true }, orderBy: { id: "asc" } });
    expect(after).toEqual(before);
  });

  it("a batch of the other board for the same chapter refuses the run before anything is written", async () => {
    const count = await db.quizQuestion.count({ where: { topic: { slug: SLUG.queue } } });
    const other = batch("NCERT", { questions: [{ ...batch("NCERT").questions[1]!, stem: `ZZ QB ${STAMP}: never written` }] });
    await expect(loadGeneratedBatches(db, [{ file: "zz-other.json", batch: other }])).rejects.toThrow(/BALBHARATI's and this batch is NCERT's/);
    await expect(loadGeneratedBatches(db, [{ file: "zz-none.json", batch: { ...other, board: "Balbharati" } }])).rejects.toThrow(/not one of the practice boards/);
    expect(await db.quizQuestion.count({ where: { topic: { slug: SLUG.queue } } })).toBe(count);
  });

  it("the verifier wants a coded board on a generated batch, and takes an undrawable figure there as a warning the queue records", () => {
    const run = (file: Partial<TopicFile>, generated = true) => {
      const v = createVerifier();
      const questions = [1, 2, 3, 4, 5, 6].map((difficulty) => ({ difficulty, stem: `ZZ QB verifier ${STAMP} rung ${difficulty}?`, choices: ["A", "B"], answerIndex: 0, solution: "ZZ: the first, as the rule says." }));
      v.verifyTopic("zz.json", { subject: "MATHS", classLevel: 8, chapter: "ZZ", name: "ZZ", slug: `zz-qb-verify-${STAMP}`, source: "ZZ", licence: "ZZ", questions, ...file } as TopicFile, { generated });
      return v.report();
    };
    expect(run({ board: "BALBHARATI" }).errors).toEqual([]);
    expect(run({}).errors).toEqual([expect.stringMatching(/board "" must be one of NCERT, BALBHARATI/)]);
    expect(run({ board: "Balbharati" }).errors).toEqual([expect.stringMatching(/board "Balbharati" must be one of/)]);
    expect(run({}, false).errors).toEqual([]);
    expect(run({ board: "CBSE" }, false).errors).toEqual([expect.stringMatching(/board "CBSE" is not one of/)]);
    const bad = batch("NCERT").questions[1]!;
    const withBadFigure = (generated: boolean) =>
      run({ board: "NCERT", questions: [1, 2, 3, 4, 5, 6].map((difficulty) => ({ ...bad, difficulty, stem: `${bad.stem} ${difficulty}` })) as TopicFile["questions"] }, generated);
    const gen = withBadFigure(true);
    expect(gen.errors).toEqual([]);
    expect(gen.warnings.some((w) => /quiz:queue loads it with this reason/.test(w))).toBe(true);
    expect(withBadFigure(false).errors.length).toBeGreaterThan(0);
  });

  it("quiz:import reads the authored files only and writes no generated row; quiz:queue's loader is the only writer of one", () => {
    const importer = code(readFileSync(resolve(process.cwd(), "scripts/import-quiz.ts"), "utf8"));
    expect(importer).toContain("readBankFiles().filter((f) => !f.generated)");
    expect(importer).toContain("where: { topicId: row.id, generated: false }");
    expect(importer).not.toMatch(/generated:\s*true/);
    expect(importer).not.toContain("isStamped(");
    const writers = readdirSync(resolve(process.cwd(), "scripts"))
      .filter((f) => f.endsWith(".ts"))
      .map((f) => [f, code(readFileSync(resolve(process.cwd(), "scripts", f), "utf8"))] as const)
      // A script that writes question rows and sets `generated: true` on one (a file list's flag is not a row).
      .filter(([, src]) => /quizQuestion\.(create|update|upsert|createMany)\b/.test(src) && /\bgenerated:\s*true\b/.test(src))
      .map(([f]) => f);
    expect(writers).toEqual(["quiz-queue-load.ts"]);
  });
});

describe("the payee door the closed gig keeps", () => {
  it("is open to a teacher still owed money and 404 to one who is not; the page likewise", async () => {
    expect(QUESTION_GIG_FOR_TEACHERS).toBe(false);
    expect(await owedForQuestionsPaise(ids.owed)).toBe(2500);
    expect(await payeeDoorOpen(ids.owed)).toBe(true);
    expect(await payeeDoorOpen(ids.teacher)).toBe(false);

    __resetCookies();
    await createSession(ids.teacher, { schoolId, role: "TEACHER" });
    expect((await gigPayeePost(post("/api/v1/gigs/payee", { upiId: "zz.qb@zzbank", payeeName: "ZZ QB Teacher" }))).status).toBe(404);
    await expect(TeacherPayeePage()).rejects.toThrow();

    __resetCookies();
    await createSession(ids.owed, { schoolId, role: "TEACHER" });
    expect((await gigPayeePost(post("/api/v1/gigs/payee", {}))).status).toBe(422);
    const saved = await gigPayeePost(post("/api/v1/gigs/payee", { upiId: "zz.qb.owed@zzbank", payeeName: "ZZ QB Owed" }));
    expect(saved.status).toBe(200);
    expect(await db.gigPayee.findUnique({ where: { userId: ids.owed }, select: { upiId: true } })).toEqual({ upiId: "zz.qb.owed@zzbank" });
    expect(await TeacherPayeePage()).toBeTruthy();

    // Paid in full (the operator records the transfer against the earnings): the door closes again.
    const payment = await db.gigPayment.create({ data: { userId: ids.owed, amountPaise: 2500, upiId: "zz.qb.owed@zzbank", utr: `ZZQB${STAMP}`, paidByUserId: ids.teacher }, select: { id: true } });
    await db.gigEarning.updateMany({ where: { userId: ids.owed }, data: { paymentId: payment.id } });
    expect(await payeeDoorOpen(ids.owed)).toBe(false);
    expect((await gigPayeePost(post("/api/v1/gigs/payee", { upiId: "zz.qb.owed@zzbank", payeeName: "ZZ QB Owed" }))).status).toBe(404);
  });

  it("the catalog still tells the sweep a teacher with nothing owed gets 404", () => {
    const door = ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/gigs/payee")!;
    expect(door.statusByRole?.TEACHER).toBe(404);
    expect(door.summary).toMatch(/owed/);
  });
});
