/**
 * The question bank's own tools, findings of the testing analysis of 13 November 2026 held by cases that FAIL while
 * the defect stands and pass once it is fixed.
 *
 *   TA-196  Loading the generated files again brought back a question the desk had corrected (matched by its stem
 *           only) and overwrote a Hindi or Marathi correction (settled only by marks a language edit does not set).
 *   TA-197  A question that came in through the sheet carried the sheet's source cell, not the in-the-app tag, so the
 *           next quiz:import deleted it with the answers pupils gave it; an update could take an app tag off.
 *   TA-370  The CSV export's formula guard came back through the import as part of the words.
 *   TA-371  The sheet import rewrote generated questions in place, round the desk that is their one writer.
 *   TA-375  On the one-at-a-time desk, Take down showed the same item again, and Skip stopped moving after two hundred.
 *   TA-466  Early returns let the practice suites pass with no assertion when the bank's chapter was absent.
 *   TA-474  The college syllabus reader named SPPU's compact B.Com titles ("FYBCOM-BM", "SYBCom-CA") "Commerce".
 *   TA-567  The sheet import did not run the arithmetic check the desk and the verifier run.
 *
 * Everything is ZZ and made here: chapters of their own (zz- slugs, which only a fixture reviewer sees) and a
 * content-team reviewer who is a fixture; deleted afterwards. The generated loader writes no figure here.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { ActiveContext } from "@/lib/session";
import { bankToCsv, parseBankCsv, type BankExportRow } from "@/lib/bank-csv";
import { commitBankImport } from "@/lib/bank-tools";
import { AUTHORED_IN_THE_APP, CONTENT_TEAM_SOURCE } from "@/lib/bank-source";
import { editItem, nextItem, takeDownItem } from "@/lib/quiz-review";
import { programmeOf } from "@/lib/college-syllabi";
import { loadGeneratedBatches, type QueueBatch } from "../scripts/quiz-queue-load";

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const STORE = resolve(process.cwd(), ".tmp-ta-practice-bank-store");
const REAL_STORAGE_DIR = process.env.STORAGE_DIR;
process.env.STORAGE_DIR = STORE;

const db = new PrismaClient();
const STAMP = Date.now();
const P = `zz-tapbb-${STAMP}`;
let curatorId = "";
const topic: Record<string, { id: string; slug: string }> = {};

const curator = (): ActiveContext =>
  ({ sessionId: "test", membershipId: null, schoolId: null, role: null, user: { id: curatorId, name: "ZZ curator", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: true } }) as ActiveContext;

async function chapter(key: string, extra: { board?: string; classLevel?: number } = {}): Promise<{ id: string; slug: string }> {
  const slug = `${P}-${key}`;
  const t = await db.quizTopic.create({ data: { subject: "MATHS", classLevel: extra.classLevel ?? 7, chapter: `ZZ ${key}`, name: `ZZ TAPBB ${key} ${STAMP}`, slug, summary: "ZZ.", ...(extra.board ? { board: extra.board } : {}) }, select: { id: true } });
  return (topic[key] = { id: t.id, slug });
}

const exportRow = (slug: string, over: Partial<BankExportRow> = {}): BankExportRow => ({
  id: "x",
  subject: "MATHS",
  classLevel: 7,
  chapter: "ZZ",
  topicSlug: slug,
  difficulty: 2,
  stem: `ZZ TAPBB a sheet question ${STAMP}?`,
  choices: ["12", "14", "16"],
  answerIndex: 1,
  solution: "Seven and seven make fourteen, so the answer is 14.",
  checkExpr: null,
  source: "NCERT-aligned, Shalaghar",
  licence: "proprietary",
  translations: { hi: null, mr: null },
  ...over,
});

beforeAll(async () => {
  curatorId = (await db.user.create({ data: { name: `ZZ TAPBB curator ${STAMP}`, email: `zz-tapbb-curator-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.quizTopic.deleteMany({ where: { slug: { startsWith: P } } });
  await db.auditLog.deleteMany({ where: { actorUserId: curatorId } });
  await db.user.deleteMany({ where: { id: curatorId } });
  await db.$disconnect();
  await rm(STORE, { recursive: true, force: true });
  if (REAL_STORAGE_DIR === undefined) delete process.env.STORAGE_DIR;
  else process.env.STORAGE_DIR = REAL_STORAGE_DIR;
}, 120_000);

describe("the sheet's rules", () => {
  it("TA-567: a check expression that does not come to the marked option, or a bare number, is a problem line; one that does is a valid row", () => {
    const csv = (answer: number, check: string) => bankToCsv([exportRow("zz-any", { answerIndex: answer, checkExpr: check })]);
    const wrongKey = parseBankCsv(csv(0, "2*7"));
    expect(wrongKey.valid).toHaveLength(0);
    expect(wrongKey.problems.map((p) => p.reasonKey)).toEqual(["quizReview.checkExprMismatch"]);
    expect(parseBankCsv(csv(1, "2*7")).problems).toEqual([]);
    expect(parseBankCsv(csv(1, "2*7")).valid[0]!.checkExpr).toBe("2*7");
    const bare = parseBankCsv(csv(1, "14"));
    expect(bare.valid).toHaveLength(0);
    expect(bare.problems.map((p) => p.reasonKey)).toEqual(["quizReview.checkExprBare"]);
  });

  it("TA-370: options, a check and translated options that begin with a minus come back from the export as they went out", () => {
    const row = exportRow("zz-any", {
      stem: "ZZ Where does the line cross the x-axis?",
      choices: ["-3", "7", "-7", "3"],
      answerIndex: 0,
      checkExpr: "-13.6/4.5333333333333",
      translations: { hi: { stem: "ZZ रेखा x-अक्ष को कहाँ काटती है?", choices: ["-3", "7", "-7", "3"], solution: "ZZ हल: -3 पर, क्योंकि y शून्य है।", reviewed: false }, mr: null },
    });
    const csv = bankToCsv([row]);
    expect(csv).toContain("'-3 | 7 | -7 | 3");
    const back = parseBankCsv(csv);
    expect(back.problems).toEqual([]);
    expect(back.valid[0]).toMatchObject({ choices: ["-3", "7", "-7", "3"], checkExpr: "-13.6/4.5333333333333", translations: { hi: { choices: ["-3", "7", "-7", "3"] } } });
  });
});

describe("the sheet's import", () => {
  it("TA-197: a question the sheet makes carries the in-the-app tag whatever its source cell says, and an update never takes the tag off one", async () => {
    const t = await chapter("source");
    const made = await commitBankImport(curator(), bankToCsv([exportRow(t.slug)]));
    expect(made).toMatchObject({ create: 1, written: 1 });
    const row = await db.quizQuestion.findFirstOrThrow({ where: { topicId: t.id }, select: { id: true, source: true } });
    expect(AUTHORED_IN_THE_APP.has(row.source)).toBe(true);

    // A question typed in the app, then sent through the sheet with another source in its cell.
    const typed = await db.quizQuestion.create({ data: { topicId: t.id, difficulty: 1, stem: `ZZ TAPBB typed in the app ${STAMP}?`, choices: JSON.stringify(["1", "2"]), answerIndex: 0, solution: "A worked solution that is long enough.", source: CONTENT_TEAM_SOURCE, licence: "proprietary" }, select: { id: true } });
    await commitBankImport(curator(), bankToCsv([exportRow(t.slug, { stem: `ZZ TAPBB typed in the app ${STAMP}?`, choices: ["1", "2"], answerIndex: 0, source: "Some other book" })]));
    expect((await db.quizQuestion.findUniqueOrThrow({ where: { id: typed.id } })).source).toBe(CONTENT_TEAM_SOURCE);
  });

  it("TA-371: a sheet row matching a generated question is a problem line and the question is left as it is", async () => {
    const t = await chapter("generated");
    const stem = `ZZ TAPBB a generated question ${STAMP}?`;
    const g = await db.quizQuestion.create({ data: { topicId: t.id, difficulty: 2, stem, choices: JSON.stringify(["12", "14", "16"]), answerIndex: 1, solution: "The generator's own worked solution, long enough.", source: "generated against ZZ", licence: "test", generated: true, generatedBoard: "NCERT" }, select: { id: true } });
    const result = await commitBankImport(curator(), bankToCsv([exportRow(t.slug, { stem, answerIndex: 0, choices: ["12", "14", "16"], solution: "A sheet's rewrite of the working, long enough to pass." })]));
    expect(result.problems.map((p) => p.reasonKey)).toEqual(["quizReview.editOnDesk"]);
    expect(result).toMatchObject({ update: 0, written: 0 });
    const after = await db.quizQuestion.findUniqueOrThrow({ where: { id: g.id } });
    expect({ answerIndex: after.answerIndex, solution: after.solution, reviewedAt: after.reviewedAt }).toEqual({ answerIndex: 1, solution: "The generator's own worked solution, long enough.", reviewedAt: null });
  });
});

describe("the generated loader after the desk", () => {
  const item = (n: number) => ({
    difficulty: 1,
    stem: `ZZ TAPBB loaded question ${n} ${STAMP}?`,
    choices: ["12", "14", "16", "18"],
    answerIndex: 1,
    solution: `ZZ: seven and seven make fourteen (${n}).`,
    translations: {
      hi: { stem: `ZZ हिंदी प्रश्न ${n}?`, choices: ["१२", "१४", "१६", "१८"], solution: `ZZ सात और सात चौदह (${n})।` },
      mr: { stem: `ZZ मराठी प्रश्न ${n}?`, choices: ["१२", "१४", "१६", "१८"], solution: `ZZ सात आणि सात चौदा (${n}).` },
    },
  });
  const batchOf = (slug: string): QueueBatch => ({ subject: "MATHS", classLevel: 7, chapter: "ZZ TAPBB load", name: "ZZ TAPBB Loaded Chapter", slug, source: "generated against ZZ", licence: "test", board: "NCERT", questions: [item(1), item(2)] });

  it("TA-196: an item whose stem the desk corrected is settled, not created again; an item whose Marathi alone was corrected keeps the correction", async () => {
    const t = await chapter("load", { board: "NCERT" });
    const first = await loadGeneratedBatches(db, [{ file: "zz-tapbb.json", batch: batchOf(t.slug) }]);
    expect(first).toMatchObject({ created: 2 });
    const one = await db.quizQuestion.findFirstOrThrow({ where: { topicId: t.id, stem: item(1).stem }, select: { id: true } });
    const two = await db.quizQuestion.findFirstOrThrow({ where: { topicId: t.id, stem: item(2).stem }, select: { id: true } });

    const corrected = await editItem(curator(), one.id, { difficulty: 1, stem: `ZZ TAPBB loaded question 1 ${STAMP}, as corrected?`, choices: ["12", "14", "16", "18"], answerIndex: 1, solution: "ZZ: seven and seven make fourteen (1)." });
    expect(corrected.ok).toBe(true);
    const mr = { stem: "ZZ मराठी प्रश्न 2, दुरुस्त?", choices: ["बारा", "चौदा", "सोळा", "अठरा"], solution: "ZZ सात आणि सात मिळून चौदा होतात." };
    const marathi = await editItem(curator(), two.id, { difficulty: 1, stem: item(2).stem, choices: item(2).choices, answerIndex: 1, solution: item(2).solution, translations: { mr } });
    expect(marathi.ok).toBe(true);

    const again = await loadGeneratedBatches(db, [{ file: "zz-tapbb.json", batch: batchOf(t.slug) }]);
    expect(again).toMatchObject({ created: 0, updated: 0, settled: 2 });
    expect(await db.quizQuestion.count({ where: { topicId: t.id } })).toBe(2);
    const row = await db.quizQuestionTranslation.findUniqueOrThrow({ where: { questionId_language: { questionId: two.id, language: "mr" } } });
    expect({ stem: row.stem, choices: JSON.parse(row.choices) as string[], solution: row.solution }).toEqual(mr);
  });
});

describe("the one-at-a-time desk", () => {
  async function items(key: string, count: number): Promise<{ topicId: string; ids: string[] }> {
    const t = await chapter(key);
    await db.quizQuestion.createMany({
      data: Array.from({ length: count }, (_, n) => ({ topicId: t.id, difficulty: 1, stem: `ZZ TAPBB desk ${key} ${n} ${STAMP}?`, choices: JSON.stringify(["12", "14"]), answerIndex: 0, solution: "ZZ working, long enough.", source: "generated against ZZ", licence: "test", generated: true, generatedBoard: "NCERT" })),
    });
    // The desk's order within one chapter at one level is the id's, as the database sorts it.
    const ids = (await db.quizQuestion.findMany({ where: { topicId: t.id }, orderBy: { id: "asc" }, select: { id: true } })).map((q) => q.id);
    return { topicId: t.id, ids };
  }

  it("TA-375: Take down moves on to another item, with no standing chosen", async () => {
    const { topicId, ids } = await items("down", 3);
    const first = await nextItem(curator(), { topic: topicId });
    expect(first.item?.id).toBe(ids[0]);
    expect((await takeDownItem(curator(), ids[0]!, "WRONG_KEY")).ok).toBe(true);
    const next = await nextItem(curator(), { topic: topicId });
    expect(next.item?.id).toBe(ids[1]);
    // Asked for, the taken-down standing is still walked.
    expect((await nextItem(curator(), { topic: topicId, state: "DOWN" })).item?.id).toBe(ids[0]);
  });

  it("TA-375: the two hundred and second Skip moves on as the first did", async () => {
    const { topicId, ids } = await items("skip", 205);
    expect((await nextItem(curator(), { topic: topicId, skip: ids.slice(0, 201).join(",") })).item?.id).toBe(ids[201]);
    expect((await nextItem(curator(), { topic: topicId, skip: ids.slice(0, 202).join(",") })).item?.id).toBe(ids[202]);
  });
});

describe("the college syllabus reader", () => {
  it("TA-474: SPPU's compact B.Com and M.Com titles name the programme, not the section's Commerce", () => {
    const doc = (title: string) => ({ board: "SPPU (Savitribai Phule Pune University)", gradeOrProgramme: "Faculty of Commerce & Management", subject: "I) Commerce", title });
    for (const title of ["FYBCOM-BM_04072024", "SYBCom-CA-Semester-IV-Syllabus-17-12-2025_23122025", "TYBCom-IB Sem V Syllabus-FINAL_22062026", "SPPU_NEP_SYB.COM. (CA) Semester III_24062025", "LabBook-TYBCom-CA-Sem-V_20072026", "SYBCOM Sem IV Restructuring Course Final_28032026"]) {
      expect(programmeOf(doc(title)), title).toBe("B.Com");
    }
    // What already read right still does.
    expect(programmeOf(doc("F.Y.B.Com. Sem-I Syllabus_ NEP_2025_24072026"))).toBe("B.Com");
    expect(programmeOf(doc("M.COM NEP SEM-IV FINAL SYLLABUS_11022025"))).toBe("M.Com");
    expect(programmeOf(doc("FYBBA-CA_04072024"))).not.toBe("B.Com");
  });
});

describe("the practice suites' fixture guards", () => {
  it("TA-466: no case of the practice suites returns early with nothing asserted when the bank's chapter is absent", () => {
    for (const file of ["tests/answer-idempotent.test.ts", "tests/practice-insights.test.ts", "tests/quiz-tier-badges.test.ts"]) {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      const silent = src.split("\n").filter((line) => /^\s{4,}if \(!hasBank\) return;\s*$/.test(line));
      expect(silent, file).toEqual([]);
    }
  });
});
