/**
 * The content team's bank tooling (src/lib/bank-tools.ts, bank-csv.ts): the
 * sheet parsed with the verifier's rules; an import previewed, committed,
 * and committed again without doubling the bank; the export carrying the
 * rows in the columns the import reads; duplicates found by trigram and by
 * exact normalised stem, and a different question left alone; and the stats
 * — a pupil's answers recorded with their grade and their seconds by
 * submitAnswer, added up per question and per grade by the job's rebuild,
 * read whole and by grade. Every row is a ZZ row made here and removed.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { bankDuplicatesSchema, bankImportResultSchema, bankStatsSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { bankToCsv, normaliseStem, parseBankCsv } from "@/lib/bank-csv";
import { commitBankImport, exportBank, findDuplicates, previewBankImport, questionStats, rebuildQuestionStats, statsFor, trigramAvailable } from "@/lib/bank-tools";
import { startAttempt, submitAnswer, ANSWER_SECONDS_CAP } from "@/lib/quiz";
import { POST as importPost } from "@/app/api/v1/appadmin/bank/import/route";
import { GET as exportGet } from "@/app/api/v1/appadmin/bank/export/route";
import { GET as duplicatesGet } from "@/app/api/v1/appadmin/bank/duplicates/route";
import { GET as statsGet } from "@/app/api/v1/appadmin/bank/stats/route";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SLUG = `zz-bank-tools-${STAMP}`;
let curatorId = "";
let topicId = "";
let schoolId = "";
let pupil: ActiveContext;
const madeUserIds: string[] = [];

function ctx(over: { userId: string; isAppAdmin?: boolean; schoolId?: string; role?: ActiveContext["role"]; membershipId?: string }): ActiveContext {
  return {
    sessionId: "test",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: over.isAppAdmin ?? false },
  } as ActiveContext;
}
const curator = () => ctx({ userId: curatorId, isAppAdmin: true });

const STEM_A = `ZZ bank tools ${STAMP}: what is the capital of France?`;
const STEM_B = `ZZ bank tools ${STAMP}: What is the capital of France`;
const STEM_C = `ZZ bank tools ${STAMP}: which gas do plants breathe in?`;
const row = (stem: string, extra = "") => `${SLUG},2,"${stem}",Paris | Rome | Berlin | Madrid,1,"Paris has been the capital of France for centuries.",,ZZ test,test${extra}`;
const HEADER = "topic,level,stem,choices,answer,solution,check,source,licence,hi_stem,hi_choices,hi_solution,hi_reviewed";

beforeAll(async () => {
  curatorId = (await db.user.create({ data: { name: "ZZ Bank Tools Curator", email: `zz-bank-tools-${STAMP}@test.invalid`, isAppAdmin: true }, select: { id: true } })).id;
  madeUserIds.push(curatorId);
  topicId = (await db.quizTopic.create({ data: { subject: "GEOGRAPHY", classLevel: 6, chapter: "ZZ Chapter", name: `ZZ Bank Tools ${STAMP}`, slug: SLUG, position: 999 }, select: { id: true } })).id;
  schoolId = (await db.school.create({ data: { name: `ZZ Bank Tools ${STAMP}`, slug: `zz-bt-${STAMP}`, code: `ZBT${String(STAMP).slice(-6)}`, contactEmail: `zz-bt-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const user = await db.user.create({ data: { name: "ZZ Bank Pupil", email: `zz-bank-pupil-${STAMP}@test.invalid`, isMinor: true }, select: { id: true } });
  madeUserIds.push(user.id);
  const membership = await db.membership.create({ data: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZBT${STAMP}` }, select: { id: true } });
  const klass = await db.class.create({ data: { schoolId, name: "ZZ 6A", gradeLevel: "6", joinCode: `ZZB${String(STAMP).slice(-7)}` }, select: { id: true } });
  await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: membership.id, status: "ACTIVE" } });
  pupil = ctx({ userId: user.id, schoolId, role: "STUDENT", membershipId: membership.id });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.quizTopic.deleteMany({ where: { id: topicId } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: madeUserIds } } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`bank-export:${curatorId}`, `bank-duplicates:${curatorId}`] } } });
  await db.user.deleteMany({ where: { id: { in: madeUserIds } } });
  await db.$disconnect();
});

describe("the sheet", () => {
  it("is parsed with the verifier's rules, each bad row named by line and reason", () => {
    const parsed = parseBankCsv(
      [
        HEADER,
        row(STEM_A, ',"ZZ फ़्रांस की राजधानी क्या है?",पेरिस | रोम | बर्लिन | मैड्रिड,"पेरिस सदियों से फ़्रांस की राजधानी है।",yes'),
        `${SLUG},9,"too high",a | b,1,"A solution that is long enough to count.",,,`,
        `${SLUG},1,"one option",only,1,"A solution that is long enough to count.",,,`,
        `${SLUG},1,"same twice",a | a,1,"A solution that is long enough to count.",,,`,
        `${SLUG},1,"answer off",a | b,3,"A solution that is long enough to count.",,,`,
        `${SLUG},1,"short solution",a | b,1,"short",,,`,
        `${SLUG},1,"shape",a | b,1,"A solution that is long enough to count.",,,,"x",only one,"y",`,
        `,1,"no topic",a | b,1,"A solution that is long enough to count.",,,`,
        row(STEM_A),
      ].join("\n"),
    );
    expect(parsed.valid).toHaveLength(1);
    expect(parsed.valid[0]).toMatchObject({ line: 2, topicSlug: SLUG, difficulty: 2, answerIndex: 0, choices: ["Paris", "Rome", "Berlin", "Madrid"], source: "ZZ test" });
    expect(parsed.valid[0]!.translations.hi).toEqual({ stem: "ZZ फ़्रांस की राजधानी क्या है?", choices: ["पेरिस", "रोम", "बर्लिन", "मैड्रिड"], solution: "पेरिस सदियों से फ़्रांस की राजधानी है।", reviewed: true });
    expect(parsed.problems.map((p) => [p.line, p.reasonKey])).toEqual([
      [3, "bankImport.badLevel"],
      [4, "bankImport.needTwoChoices"],
      [5, "bankImport.sameChoices"],
      [6, "bankImport.badAnswer"],
      [7, "bankImport.solutionShort"],
      [8, "bankImport.translationShape"],
      [9, "bankImport.noTopic"],
      [10, "invites.duplicateOfLine"],
    ]);
    expect(parseBankCsv("stem,level\nx,1").problems[0]!.reasonKey).toBe("bankImport.missingColumns");
    expect(normaliseStem("What is the Capital of France?")).toBe("whatisthecapitaloffrance");
  });

  it("round-trips through bankToCsv", () => {
    const csv = bankToCsv([
      { id: "q", subject: "MATHS", classLevel: 6, chapter: "c", topicSlug: SLUG, difficulty: 3, stem: "A, with a comma?", choices: ["1", "2"], answerIndex: 1, solution: "A worked solution long enough to count.", checkExpr: null, source: "s", licence: "l", translations: { hi: null, mr: { stem: "म", choices: ["१", "२"], solution: "उ", reviewed: false } } },
    ]);
    const back = parseBankCsv(csv);
    expect(back.problems).toEqual([]);
    expect(back.valid[0]).toMatchObject({ stem: "A, with a comma?", difficulty: 3, answerIndex: 1, choices: ["1", "2"], translations: { hi: null, mr: { stem: "म", choices: ["१", "२"], solution: "उ", reviewed: false } } });
  });
});

describe("import, export, duplicates", () => {
  it("previews without writing, commits, and a second commit updates in place", async () => {
    const csv = [HEADER, row(STEM_A, ',"ZZ फ़्रांस की राजधानी क्या है?",पेरिस | रोम | बर्लिन | मैड्रिड,"पेरिस सदियों से फ़्रांस की राजधानी है।",yes'), row(STEM_B), row(STEM_C).replace("Paris | Rome | Berlin | Madrid,1", "Oxygen | Carbon dioxide,2"), `nope-${STAMP},1,"unknown chapter",a | b,1,"A solution that is long enough to count.",,,`].join("\n");
    const preview = await previewBankImport(curator(), csv);
    expect(preview).toMatchObject({ create: 3, update: 0, translations: 1, unknownTopics: [`nope-${STAMP}`] });
    expect(preview.problems.map((p) => p.reasonKey)).toEqual(["bankImport.unknownTopic"]);
    expect(await db.quizQuestion.count({ where: { topicId } })).toBe(0);

    const first = await commitBankImport(curator(), csv);
    expect(first).toMatchObject({ create: 3, update: 0, written: 3 });
    expect(await db.quizQuestion.count({ where: { topicId } })).toBe(3);
    const a = await db.quizQuestion.findFirstOrThrow({ where: { topicId, stem: STEM_A }, include: { translations: true } });
    expect(a.hiReviewedBy).toBe(curatorId);
    expect(a.translations[0]!.language).toBe("hi");
    expect(a.source).toBe("ZZ test");

    const again = await commitBankImport(curator(), csv.replace("Paris has been the capital of France for centuries.", "Paris, on the Seine, has been the capital for centuries."));
    expect(again).toMatchObject({ create: 0, update: 3, written: 3 });
    expect(await db.quizQuestion.count({ where: { topicId } })).toBe(3);
    expect((await db.quizQuestion.findFirstOrThrow({ where: { topicId, stem: STEM_A } })).solution).toContain("Seine");
    expect(await db.auditLog.count({ where: { action: "appadmin.bank.import", actorUserId: curatorId } })).toBe(2);
    await expect(commitBankImport(ctx({ userId: pupil.user.id }), csv)).rejects.toBeInstanceOf(AccessError);
  });

  it("the export has the rows in the import's columns, narrowed by subject and class", async () => {
    const all = await exportBank(curator(), { subject: "GEOGRAPHY", grade: 6 });
    expect(all.filename).toBe("edulink-bank-geography-class-6.csv");
    const back = parseBankCsv(all.csv);
    const mine = back.valid.filter((r) => r.topicSlug === SLUG);
    expect(mine.map((r) => r.stem).sort()).toEqual([STEM_A, STEM_B, STEM_C].sort());
    expect(mine.find((r) => r.stem === STEM_A)!.translations.hi?.reviewed).toBe(true);
    expect(all.csv.split("\r\n")[0]).toBe("id,subject,class,chapter,topic,level,stem,choices,answer,solution,check,source,licence,hi_stem,hi_choices,hi_solution,hi_reviewed,mr_stem,mr_choices,mr_solution,mr_reviewed");
    const other = await exportBank(curator(), { subject: "MATHS", grade: 6 });
    expect(parseBankCsv(other.csv).valid.some((r) => r.topicSlug === SLUG)).toBe(false);
  });

  it("duplicates: the near pair is found, the different question is not; the exact rule finds only an exact pair; the report is kept until the bank changes", async () => {
    const trigram = await trigramAvailable();
    const report = await findDuplicates(curator());
    expect(report.trigram).toBe(trigram);
    const mine = report.pairs.filter((p) => p.a.topicId === topicId && p.b.topicId === topicId);
    const stems = mine.map((p) => [p.a.stem, p.b.stem].sort());
    expect(stems).toEqual([[STEM_A, STEM_B].sort()]);
    expect(mine[0]!.similarity).toBe(1); // "capital of France?" and "capital of France" normalise to the same string
    expect(mine.some((p) => p.a.stem === STEM_C || p.b.stem === STEM_C)).toBe(false);
    // The exact rule, as a server without pg_trgm runs it.
    const exact = await findDuplicates(curator(), { trigram: false });
    expect(exact.trigram).toBe(false);
    expect(exact.pairs.filter((p) => p.a.topicId === topicId).map((p) => [p.a.stem, p.b.stem].sort())).toEqual([[STEM_A, STEM_B].sort()]);
    if (trigram) {
      // A near miss the exact rule cannot see: one word added.
      await db.quizQuestion.create({ data: { topicId, difficulty: 2, stem: `ZZ bank tools ${STAMP}: what is the capital city of France?`, choices: JSON.stringify(["Paris", "Madrid"]), answerIndex: 0, solution: "Paris has been the capital city of France for centuries.", source: "ZZ test", licence: "test" } });
      const near = await findDuplicates(curator());
      const pair = near.pairs.find((p) => p.a.topicId === topicId && [p.a.stem, p.b.stem].some((s) => s.endsWith("city of France?")));
      expect(pair).toBeDefined();
      expect(pair!.similarity).toBeGreaterThanOrEqual(0.8);
      expect(pair!.similarity).toBeLessThan(1);
      expect((await findDuplicates(curator(), { trigram: false })).pairs.some((p) => [p.a.stem, p.b.stem].some((s) => s.endsWith("city of France?")))).toBe(false);
      // Unchanged bank: the same report, not a second pass.
      expect((await findDuplicates(curator())).computedAt).toBe(near.computedAt);
    }
  }, 60_000);
});

describe("statistics", () => {
  it("a pupil's answer records the grade and the seconds; the rebuild adds them up; the read is whole and by grade", async () => {
    const q = await db.quizQuestion.findFirstOrThrow({ where: { topicId, stem: STEM_C }, select: { id: true } });
    const { attemptId } = await startAttempt(pupil, SLUG);
    // Backdate the sitting so the first answer has measurable seconds.
    await db.quizAttempt.update({ where: { id: attemptId }, data: { startedAt: new Date(Date.now() - 12_000) } });
    const first = await submitAnswer(pupil, attemptId, q.id, 1);
    expect(first.correct).toBe(true);
    const recorded = await db.quizResponse.findUniqueOrThrow({ where: { attemptId_questionId: { attemptId, questionId: q.id } } });
    expect(recorded.gradeLevel).toBe(6);
    expect(recorded.seconds).toBeGreaterThanOrEqual(11);
    expect(recorded.seconds).toBeLessThanOrEqual(ANSWER_SECONDS_CAP);
    // A re-answer keeps the moment of the first.
    await submitAnswer(pupil, attemptId, q.id, 0);
    expect((await db.quizResponse.findUniqueOrThrow({ where: { attemptId_questionId: { attemptId, questionId: q.id } } })).seconds).toBe(recorded.seconds);

    // Two more sittings' worth of answers from rows: one wrong by a child with no grade, one right.
    const a = await db.quizQuestion.findFirstOrThrow({ where: { topicId, stem: STEM_A }, select: { id: true } });
    const att2 = await db.quizAttempt.create({ data: { schoolId, studentMembershipId: pupil.membershipId!, topicId }, select: { id: true } });
    const att3 = await db.quizAttempt.create({ data: { schoolId, studentMembershipId: pupil.membershipId!, topicId }, select: { id: true } });
    await db.quizResponse.createMany({
      data: [
        { schoolId, attemptId: att2.id, questionId: a.id, chosenIndex: 2, correct: false, servedDifficulty: 2, gradeLevel: null, seconds: 30 },
        { schoolId, attemptId: att2.id, questionId: q.id, chosenIndex: 1, correct: true, servedDifficulty: 2, gradeLevel: 6, seconds: 8 },
        // A reveal without an answer is not an answer.
        { schoolId, attemptId: att3.id, questionId: q.id, chosenIndex: null, correct: false, revealedSolution: true, servedDifficulty: 2 },
      ],
    });

    expect(await statsFor([q.id])).toEqual(new Map());
    const rebuilt = await rebuildQuestionStats();
    expect(rebuilt.buckets).toBeGreaterThanOrEqual(2);

    const stats = await questionStats(curator(), q.id);
    expect(stats).toMatchObject({ questionId: q.id, asked: 2, correct: 1, correctRate: 50 });
    expect(stats!.avgSeconds).toBe(Math.round((recorded.seconds! + 8) / 2));
    expect(stats!.byGrade).toEqual([{ grade: 6, asked: 2, correct: 1, correctRate: 50, avgSeconds: stats!.avgSeconds }]);
    expect(stats!.updatedAt).not.toBeNull();
    const statsA = await questionStats(curator(), a.id);
    expect(statsA).toMatchObject({ asked: 1, correct: 0, correctRate: 0, avgSeconds: 30, byGrade: [{ grade: 0, asked: 1, correct: 0, correctRate: 0, avgSeconds: 30 }] });
    const summary = await statsFor([q.id, a.id]);
    expect(summary.get(q.id)).toEqual({ asked: 2, correct: 1, correctRate: 50, avgSeconds: stats!.avgSeconds });
    expect(await questionStats(curator(), "no-such-question")).toBeNull();
    await expect(questionStats(ctx({ userId: pupil.user.id }), q.id)).rejects.toBeInstanceOf(AccessError);
  });

  it("the routes answer in the contracts' shapes, and a pupil is refused at the door", async () => {
    const q = await db.quizQuestion.findFirstOrThrow({ where: { topicId, stem: STEM_C }, select: { id: true } });
    __resetCookies();
    await createSession(curatorId);
    const stats = await statsGet(new Request(`http://localhost/api/v1/appadmin/bank/stats?questionId=${q.id}`));
    expect(stats.status).toBe(200);
    expect(bankStatsSchema.parse(await stats.json()).asked).toBe(2);
    const dup = await duplicatesGet();
    expect(dup.status).toBe(200);
    expect(bankDuplicatesSchema.parse(await dup.json()).pairs.length).toBeGreaterThanOrEqual(1);
    const exp = await exportGet(new Request("http://localhost/api/v1/appadmin/bank/export?subject=GEOGRAPHY&grade=6"));
    expect(exp.status).toBe(200);
    expect(exp.headers.get("content-disposition")).toContain("edulink-bank-geography-class-6.csv");
    expect(await exp.text()).toContain(STEM_C);
    const xlsx = await exportGet(new Request("http://localhost/api/v1/appadmin/bank/export?subject=GEOGRAPHY&grade=6&format=xlsx"));
    expect(xlsx.headers.get("content-type")).toContain("spreadsheetml");
    const imp = await importPost(new Request("http://localhost/api/v1/appadmin/bank/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csv: [HEADER, row(STEM_A)].join("\n") }) }));
    expect(imp.status).toBe(200);
    expect(bankImportResultSchema.parse(await imp.json())).toMatchObject({ committed: false, create: 0, update: 1, written: 0 });
    __resetCookies();
    await createSession(pupil.user.id, { schoolId, role: "STUDENT" });
    expect((await statsGet(new Request(`http://localhost/api/v1/appadmin/bank/stats?questionId=${q.id}`))).status).toBe(403);
    expect((await duplicatesGet()).status).toBe(403);
  }, 60_000);
});
