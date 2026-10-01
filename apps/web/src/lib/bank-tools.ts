import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { audit } from "./audit";
import { assertAppAdmin } from "./app-admin";
import { bankToCsv, normaliseStem, parseBankCsv, type BankCsvResult, type BankExportRow, type BankRow, type BankTranslationRow } from "./bank-csv";
import { parseChoices, clampLevel } from "./quiz";
import type { ActiveContext } from "./session";

/**
 * The content team's bank tooling: a sheet in and out, near-duplicates, and
 * how each question is doing. Everything here is assertAppAdmin'd and touches
 * only the catalogue tables (no school, no policy — see NO_SCHOOL_POLICY in
 * scripts/gen-rls.ts), except the stats, which read the QuestionStat rows the
 * nightly bank:stats job writes from every school's answers (jobs.ts).
 */

/** The `source` of a question that arrived through the sheet, kept distinct so scripts/import-quiz.ts never orphans it. */
export const IMPORTED_SOURCE = "Relay content team";
const DEFAULT_LICENCE = "proprietary";

/* -------------------------------------------------------------------------- */
/* Import                                                                      */
/* -------------------------------------------------------------------------- */

export type ImportPreview = {
  /** Rows the sheet parsed, before the chapters were looked up. */
  parsed: number;
  /** Rows that will be written: new questions and ones matched by chapter and stem. */
  create: number;
  update: number;
  translations: number;
  problems: BankCsvResult["problems"];
  recognised: BankCsvResult["recognised"];
  /** Chapter slugs the sheet names that the bank does not have; their rows are among the problems. */
  unknownTopics: string[];
};

type Plan = {
  preview: ImportPreview;
  rows: { row: BankRow; topicId: string; questionId: string | null }[];
};

/**
 * Matches the sheet against the bank. IDEMPOTENT BY CHAPTER AND STEM, exactly
 * as scripts/import-quiz.ts is: a row whose stem already exists in its chapter
 * updates that question in place, so exporting, editing and re-importing
 * never doubles the bank.
 */
async function plan(csv: string): Promise<Plan> {
  const parsed = parseBankCsv(csv);
  const slugs = [...new Set(parsed.valid.map((r) => r.topicSlug))];
  const topics = slugs.length
    ? await db.quizTopic.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } })
    : [];
  const topicBySlug = new Map(topics.map((t) => [t.slug, t.id]));
  const unknownTopics = slugs.filter((s) => !topicBySlug.has(s)).sort();

  const existing = topics.length
    ? await db.quizQuestion.findMany({ where: { topicId: { in: topics.map((t) => t.id) } }, select: { id: true, topicId: true, stem: true } })
    : [];
  const byStem = new Map(existing.map((q) => [`${q.topicId}|${q.stem.trim().toLowerCase()}`, q.id]));

  const problems = [...parsed.problems];
  const rows: Plan["rows"] = [];
  let translations = 0;
  for (const row of parsed.valid) {
    const topicId = topicBySlug.get(row.topicSlug);
    if (!topicId) {
      problems.push({ line: row.line, value: row.topicSlug, reasonKey: "bankImport.unknownTopic" });
      continue;
    }
    const questionId = byStem.get(`${topicId}|${row.stem.toLowerCase()}`) ?? null;
    rows.push({ row, topicId, questionId });
    translations += (row.translations.hi ? 1 : 0) + (row.translations.mr ? 1 : 0);
  }
  problems.sort((a, b) => a.line - b.line);
  return {
    preview: {
      parsed: parsed.valid.length + parsed.problems.length,
      create: rows.filter((r) => r.questionId === null).length,
      update: rows.filter((r) => r.questionId !== null).length,
      translations,
      problems,
      recognised: parsed.recognised,
      unknownTopics,
    },
    rows,
  };
}

export async function previewBankImport(session: ActiveContext, csv: string): Promise<ImportPreview> {
  assertAppAdmin(session);
  return (await plan(csv)).preview;
}

/**
 * Writes the sheet. A translation in the sheet is written as it stands and
 * marked reviewed only when its column says so — a sheet is a person's work,
 * but the person may have pasted a machine's draft, and the flag is theirs
 * to set. A row without a translation leaves the existing one alone.
 */
export async function commitBankImport(session: ActiveContext, csv: string): Promise<ImportPreview & { written: number }> {
  assertAppAdmin(session);
  const { preview, rows } = await plan(csv);
  const now = new Date();
  let written = 0;

  for (const { row, topicId, questionId } of rows) {
    const data = {
      difficulty: clampLevel(row.difficulty),
      stem: row.stem,
      choices: JSON.stringify(row.choices),
      answerIndex: row.answerIndex,
      solution: row.solution,
      checkExpr: row.checkExpr,
      // Read by the person who typed the sheet, as the web form's are.
      reviewedAt: now,
      reviewedBy: session.user.id,
    };
    let id = questionId;
    if (id) {
      await db.quizQuestion.update({
        where: { id },
        data: { ...data, ...(row.source ? { source: row.source } : {}), ...(row.licence ? { licence: row.licence } : {}) },
      });
    } else {
      id = (await db.quizQuestion.create({ data: { ...data, topicId, source: row.source ?? IMPORTED_SOURCE, licence: row.licence ?? DEFAULT_LICENCE }, select: { id: true } })).id;
    }
    written += 1;

    for (const language of ["hi", "mr"] as const) {
      const tr = row.translations[language];
      if (!tr) continue;
      const payload = { stem: tr.stem, choices: tr.choices ? JSON.stringify(tr.choices) : "", solution: tr.solution };
      await db.quizQuestionTranslation.upsert({
        where: { questionId_language: { questionId: id, language } },
        create: { questionId: id, language, ...payload },
        update: payload,
      });
      await db.quizQuestion.update({
        where: { id },
        data: language === "hi"
          ? { hiReviewedAt: tr.reviewed ? now : null, hiReviewedBy: tr.reviewed ? session.user.id : null }
          : { mrReviewedAt: tr.reviewed ? now : null, mrReviewedBy: tr.reviewed ? session.user.id : null },
      });
    }
  }

  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "appadmin.bank.import",
    targetType: "QuizQuestion",
    meta: { created: preview.create, updated: preview.update, translations: preview.translations, problems: preview.problems.length },
  });

  return { ...preview, written };
}

/* -------------------------------------------------------------------------- */
/* Export                                                                      */
/* -------------------------------------------------------------------------- */

export type BankExportFilter = { subject?: string; grade?: number };

/** Every question of the chapters that match, in the sheet's columns, retired chapters left out. */
export async function exportBank(session: ActiveContext, filter: BankExportFilter = {}): Promise<{ filename: string; csv: string; rows: number }> {
  assertAppAdmin(session);
  const questions = await db.quizQuestion.findMany({
    where: {
      topic: {
        retiredAt: null,
        ...(filter.subject ? { subject: filter.subject } : {}),
        ...(filter.grade ? { classLevel: filter.grade } : {}),
      },
    },
    orderBy: [{ topic: { subject: "asc" } }, { topic: { classLevel: "asc" } }, { topic: { position: "asc" } }, { difficulty: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      difficulty: true,
      stem: true,
      choices: true,
      answerIndex: true,
      solution: true,
      checkExpr: true,
      source: true,
      licence: true,
      hiReviewedAt: true,
      mrReviewedAt: true,
      topic: { select: { slug: true, subject: true, classLevel: true, chapter: true } },
      translations: { select: { language: true, stem: true, choices: true, solution: true } },
    },
    take: 20000,
  });
  const rows: BankExportRow[] = questions.map((q) => {
    const tr = (language: "hi" | "mr"): BankTranslationRow | null => {
      const t = q.translations.find((x) => x.language === language);
      if (!t) return null;
      return { stem: t.stem, choices: t.choices ? parseChoices(t.choices) : null, solution: t.solution, reviewed: language === "hi" ? q.hiReviewedAt !== null : q.mrReviewedAt !== null };
    };
    return {
      id: q.id,
      subject: q.topic.subject,
      classLevel: q.topic.classLevel,
      chapter: q.topic.chapter,
      topicSlug: q.topic.slug,
      difficulty: q.difficulty,
      stem: q.stem,
      choices: parseChoices(q.choices),
      answerIndex: q.answerIndex,
      solution: q.solution,
      checkExpr: q.checkExpr,
      source: q.source,
      licence: q.licence,
      translations: { hi: tr("hi"), mr: tr("mr") },
    };
  });
  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "appadmin.bank.export",
    targetType: "QuizQuestion",
    meta: { subject: filter.subject ?? null, grade: filter.grade ?? null, rows: rows.length },
  });
  const name = ["edulink-bank", filter.subject?.toLowerCase(), filter.grade ? `class-${filter.grade}` : null].filter(Boolean).join("-");
  return { filename: `${name}.csv`, csv: bankToCsv(rows), rows: rows.length };
}

/* -------------------------------------------------------------------------- */
/* Duplicates                                                                  */
/* -------------------------------------------------------------------------- */

export type DuplicatePair = {
  similarity: number;
  a: { id: string; topicId: string; topicName: string; classLevel: number; stem: string };
  b: { id: string; topicId: string; topicName: string; classLevel: number; stem: string };
};

export type DuplicatesReport = {
  /** True when pg_trgm is installed and near-duplicates were looked for; false means exact-normalised matches only. */
  trigram: boolean;
  threshold: number;
  pairs: DuplicatePair[];
  /** When the pairs were worked out: the report is kept in memory until the bank changes. */
  computedAt: Date;
};

export const DUPLICATE_THRESHOLD = 0.8;
const DUPLICATE_LIMIT = 200;
/** The trigram pass over 7,000 questions is five seconds of database time (one index probe per row); the transaction gets room for a bank several times that size. */
const DUPLICATE_TIMEOUT_MS = 120_000;

/** The normalising expression, spelt once: bank-csv.ts normaliseStem in SQL, and the expression the trigram index is built on. */
const NORM = (col: string) => `lower(regexp_replace(${col}, '[^[:alnum:]]+', '', 'g'))`;

let trigramKnown: boolean | null = null;

/** Whether pg_trgm is installed, asked of the database once per process. */
export async function trigramAvailable(): Promise<boolean> {
  if (trigramKnown !== null) return trigramKnown;
  const rows = await db.$queryRaw<{ extname: string }[]>`
    SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'`;
  trigramKnown = rows.length > 0;
  return trigramKnown;
}

/** The last report of each rule, kept while the bank is as it was: the count of questions and the newest edit name a bank. */
const lastReport = new Map<"t" | "e", { key: string; report: DuplicatesReport }>();

/** For tests: forget what was learnt about the extension and the last report. */
export function __resetDuplicates(): void {
  trigramKnown = null;
  lastReport.clear();
}

/**
 * Pairs of questions that are, or nearly are, the same question. Stems are
 * normalised (lower-case, letters and digits only) and compared by trigram
 * similarity at 0.8 or above when pg_trgm is installed — the `%` operator
 * walks the trigram index at that threshold, set for the transaction — and
 * otherwise by exact match of the normalised stem, which the report says.
 * Across chapters as well as within one: the same question in Class 6 and
 * Class 7 is the usual finding.
 *
 * SECONDS, NOT MILLISECONDS: the index is probed once per question (0.7 ms
 * each on the dev box, 4.8 s over 6,954 questions; a GiST index was twice
 * as slow), so the report is computed once and kept in memory until a
 * question is added, edited or removed, and the route budgets the call.
 * The transaction is $tenantTransaction with its timeout raised for the
 * pass; the tables have no policy, so the tenant it binds is beside the point.
 */
export async function findDuplicates(session: ActiveContext, opts: { trigram?: boolean } = {}): Promise<DuplicatesReport> {
  assertAppAdmin(session);
  const trigram = opts.trigram ?? (await trigramAvailable());
  const shape = await db.quizQuestion.aggregate({ _count: { _all: true }, _max: { updatedAt: true } });
  const mode = trigram ? "t" : "e";
  const key = `${shape._count._all}|${shape._max.updatedAt?.getTime() ?? 0}`;
  const kept = lastReport.get(mode);
  if (kept?.key === key) return kept.report;

  const select = `a."id" AS "aId", b."id" AS "bId"`;
  const from = `FROM "QuizQuestion" a JOIN "QuizQuestion" b ON a."id" < b."id"`;
  type Pair = { aId: string; bId: string; similarity: number };
  const raw = trigram
    ? await db.$tenantTransaction(
        async (client) => {
          const tx = client as Prisma.TransactionClient;
          await tx.$executeRaw`
            SELECT set_config('pg_trgm.similarity_threshold', ${String(DUPLICATE_THRESHOLD)}, true)`;
          return tx.$queryRaw<Pair[]>(
            Prisma.raw(
              `SELECT ${select}, similarity(${NORM('a."stem"')}, ${NORM('b."stem"')})::float8 AS "similarity" ${from} AND ${NORM('a."stem"')} % ${NORM('b."stem"')} ORDER BY 3 DESC, 1, 2 LIMIT ${DUPLICATE_LIMIT}`,
            ),
          );
        },
        { timeout: DUPLICATE_TIMEOUT_MS, maxWait: 10_000 },
      )
    : await db.$queryRaw<Pair[]>(Prisma.raw(`SELECT ${select}, 1::float8 AS "similarity" ${from} AND ${NORM('a."stem"')} = ${NORM('b."stem"')} ORDER BY 1, 2 LIMIT ${DUPLICATE_LIMIT}`));
  const ids = [...new Set(raw.flatMap((r) => [r.aId, r.bId]))];
  const questions = ids.length
    ? await db.quizQuestion.findMany({ where: { id: { in: ids } }, select: { id: true, stem: true, topic: { select: { id: true, name: true, classLevel: true } } } })
    : [];
  const byId = new Map(questions.map((q) => [q.id, { id: q.id, topicId: q.topic.id, topicName: q.topic.name, classLevel: q.topic.classLevel, stem: q.stem }]));
  const pairs: DuplicatePair[] = [];
  for (const r of raw) {
    const a = byId.get(r.aId);
    const b = byId.get(r.bId);
    if (!a || !b) continue;
    // The JS rule and the SQL rule must agree on an exact match, whichever path ran.
    const exact = normaliseStem(a.stem) === normaliseStem(b.stem);
    pairs.push({ similarity: exact ? 1 : Math.round(r.similarity * 1000) / 1000, a, b });
  }
  const report = { trigram, threshold: trigram ? DUPLICATE_THRESHOLD : 1, pairs, computedAt: new Date() };
  lastReport.set(mode, { key, report });
  return report;
}

/* -------------------------------------------------------------------------- */
/* Statistics                                                                  */
/* -------------------------------------------------------------------------- */

export type QuestionStatSummary = {
  asked: number;
  correct: number;
  /** 0–100, null until asked once. */
  correctRate: number | null;
  /** Mean seconds over the answers that were timed, null until one was. */
  avgSeconds: number | null;
};

export type QuestionStats = QuestionStatSummary & {
  questionId: string;
  /** Per grade of the answering pupil, 0 meaning the grade was not recorded. */
  byGrade: ({ grade: number } & QuestionStatSummary)[];
  /** When the job last wrote these rows; null when it never has. */
  updatedAt: Date | null;
};

type StatRow = { grade: number; asked: number; correct: number; seconds: number; timed: number };

function summarise(rows: StatRow[]): QuestionStatSummary {
  const asked = rows.reduce((n, r) => n + r.asked, 0);
  const correct = rows.reduce((n, r) => n + r.correct, 0);
  const seconds = rows.reduce((n, r) => n + r.seconds, 0);
  const timed = rows.reduce((n, r) => n + r.timed, 0);
  return {
    asked,
    correct,
    correctRate: asked > 0 ? Math.round((correct / asked) * 100) : null,
    avgSeconds: timed > 0 ? Math.round(seconds / timed) : null,
  };
}

/** One question's numbers, whole and by grade. */
export async function questionStats(session: ActiveContext, questionId: string): Promise<QuestionStats | null> {
  assertAppAdmin(session);
  const question = await db.quizQuestion.findUnique({ where: { id: questionId }, select: { id: true } });
  if (!question) return null;
  const rows = await db.questionStat.findMany({ where: { questionId }, orderBy: { grade: "asc" } });
  return {
    questionId,
    ...summarise(rows),
    byGrade: rows.filter((r) => r.asked > 0).map((r) => ({ grade: r.grade, ...summarise([r]) })),
    updatedAt: rows.reduce<Date | null>((latest, r) => (latest === null || r.updatedAt > latest ? r.updatedAt : latest), null),
  };
}

/** The summary for each of a set of questions — the bank list's stats column. */
export async function statsFor(questionIds: string[]): Promise<Map<string, QuestionStatSummary>> {
  if (questionIds.length === 0) return new Map();
  const rows = await db.questionStat.findMany({ where: { questionId: { in: questionIds } }, select: { questionId: true, grade: true, asked: true, correct: true, seconds: true, timed: true } });
  const grouped = new Map<string, StatRow[]>();
  for (const r of rows) grouped.set(r.questionId, [...(grouped.get(r.questionId) ?? []), r]);
  return new Map([...grouped].map(([id, list]) => [id, summarise(list)]));
}

/**
 * THE ONE WRITER of QuestionStat: the nightly bank:stats job (jobs.ts), as
 * the owner, which is the only connection that reads every school's answers.
 * Recomputed whole — every (question, grade) bucket from the responses, rows
 * for buckets that no longer exist removed — so a deleted school or a deleted
 * question leaves no count behind. `npm run data:audit` recomputes the same
 * sums and reports drift since the last run.
 */
export async function rebuildQuestionStats(): Promise<{ questions: number; buckets: number; removed: number }> {
  const sums = await db.$queryRaw<{ questionId: string; grade: number; asked: number; correct: number; seconds: number; timed: number }[]>`
    SELECT r."questionId",
           COALESCE(r."gradeLevel", 0)::int AS "grade",
           count(*)::int AS "asked",
           count(*) FILTER (WHERE r."correct")::int AS "correct",
           COALESCE(sum(r."seconds"), 0)::int AS "seconds",
           count(r."seconds")::int AS "timed"
      FROM "QuizResponse" r
     WHERE r."chosenIndex" IS NOT NULL
     GROUP BY r."questionId", COALESCE(r."gradeLevel", 0)`;
  const keep = new Set(sums.map((s) => `${s.questionId}|${s.grade}`));
  const existing = await db.questionStat.findMany({ select: { id: true, questionId: true, grade: true } });
  const stale = existing.filter((e) => !keep.has(`${e.questionId}|${e.grade}`)).map((e) => e.id);
  if (stale.length) await db.questionStat.deleteMany({ where: { id: { in: stale } } });
  for (const s of sums) {
    const data = { asked: s.asked, correct: s.correct, seconds: s.seconds, timed: s.timed };
    await db.questionStat.upsert({
      where: { questionId_grade: { questionId: s.questionId, grade: s.grade } },
      create: { questionId: s.questionId, grade: s.grade, ...data },
      update: data,
    });
  }
  return { questions: new Set(sums.map((s) => s.questionId)).size, buckets: sums.length, removed: stale.length };
}
