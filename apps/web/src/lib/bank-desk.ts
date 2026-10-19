import "server-only";
import type { Prisma } from "@prisma/client";
import {
  QUIZ_BANK_DEFAULT_TARGET,
  QUIZ_BANK_PAGE_SIZE,
  QUIZ_GEN_SUBJECTS,
  QUIZ_TAKEDOWN_REASONS,
  STREAMS,
  type QuizBankCell,
  type QuizBankChapter,
  type QuizBankChapterItem,
  type QuizBankChapterQuery,
  type QuizBankChapterRow,
  type QuizBankChapters,
  type QuizBankChaptersQuery,
  type QuizBankLanguage,
  type QuizBankLanguageNote,
  type QuizBankMaker,
  type QuizBankMatrix,
  type QuizBankMatrixQuery,
  type QuizBankState,
  type QuizTakeDownReason,
} from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { SERVED_QUESTION } from "./quiz-served";
import { readGeneration, reviewerRole, stateOfRow, stateWhere } from "./quiz-review";
import { fixtureTopicsWhere, reviewerSeesFixtureTopics } from "./quiz-fixtures";
import { clampLevel, parseChoices } from "./quiz";
import { fixTitleCase } from "./chapter-title-case";
import type { ActiveContext } from "./session";

/**
 * THE BANK DESK BY CLASS AND SUBJECT (the owner's ask of 20 October 2026). The desk at /root/quiz-review and
 * /appadmin/quiz-review walked the generated items one at a time with a "By chapter" table in the plan's order; the
 * owner wants the whole bank, authored and generated, readable by class and subject:
 *
 *   bankMatrix    classes 3 to 12 by the subjects the generator knows (QUIZ_GEN_SUBJECTS' order), each cell the served
 *                 questions, the chapters and how many reached the target (the active generation run's, else 100); a
 *                 college row per stream when the bank has college chapters, with the college's own subjects
 *   bankChapters  the chapters grouped by class, subject and board in their book's order (chapter number, then
 *                 position), each with its served questions by level, what is taken down or held, and who made them
 *   bankChapter   one chapter's questions, fifty a page, in English, Hindi or Marathi, with a note where the language's
 *                 words are missing, stale or the item was taken down for its translation
 *
 * Reads only. The desk's acts on an item stay in src/lib/quiz-review.ts (the one writer); an authored item is the bank
 * editor's (/appadmin/bank). A chapter's name is shown under the case rule (chapter-title-case.ts). The fixtures' zz-
 * chapters are seen by a reviewer who is a fixture only, as on the rest of the desk.
 *
 * "Served" is the one serving rule (quiz-served.ts). A chapter in the matrix is a book's chapter as the generation run
 * counts one (scripts/quiz-gen/job.ts servedCount): every topic of a board, class and subject whose chapter line starts
 * "Chapter N", summed, so the authored bank's chapter and a generated one of the same number count once and reach the
 * target together; a topic whose line has no number is a chapter of its own.
 */

/** The school bank's classes, the matrix's rows. */
export const MATRIX_GRADES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const BOARD_ORDER = ["NCERT", "BALBHARATI"];

/** "Chapter 4 — Linear Equations" → 4; null when the line carries no number. Pure. */
export function chapterNumberOfLine(chapter: string): number | null {
  const m = /^\s*(?:chapter|unit|lesson)\s*(\d{1,3})\b/i.exec(chapter);
  return m ? Number(m[1]) : null;
}

const subjectRank = (s: string) => {
  const i = (QUIZ_GEN_SUBJECTS as readonly string[]).indexOf(s);
  return i === -1 ? QUIZ_GEN_SUBJECTS.length : i;
};
const boardRank = (b: string | null) => {
  const i = b === null ? -1 : BOARD_ORDER.indexOf(b);
  return i !== -1 ? i : BOARD_ORDER.length + (b === null ? 1 : 0);
};
const streamRank = (s: string | null) => (s === null ? STREAMS.length + 1 : (STREAMS as readonly string[]).indexOf(s) === -1 ? STREAMS.length : (STREAMS as readonly string[]).indexOf(s));

/* -------------------------------------------------------------------------- */
/* Pure: the matrix and the grouping                                           */
/* -------------------------------------------------------------------------- */

export type MatrixTopic = { id: string; board: string | null; grade: number; subject: string; chapter: string; audience: string; streams: string[] };

type Tally = { served: number; chapters: Map<string, number> };

function cellOf(subject: string, tally: Tally | undefined, target: number): QuizBankCell {
  if (!tally) return { subject, served: 0, chapters: 0, atTarget: 0 };
  return { subject, served: tally.served, chapters: tally.chapters.size, atTarget: [...tally.chapters.values()].filter((n) => n >= target).length };
}

function rowTotals(cells: QuizBankCell[]) {
  return { served: cells.reduce((n, c) => n + c.served, 0), chapters: cells.reduce((n, c) => n + c.chapters, 0), atTarget: cells.reduce((n, c) => n + c.atTarget, 0) };
}

/**
 * The matrix from the chapters (topics) and each one's served count. A SCHOOL topic of a class from 3 to 12 and a
 * subject in QUIZ_GEN_SUBJECTS lands in its cell, keyed by board and chapter number so two topics of one book's chapter
 * count once; a COLLEGE topic lands in each of its streams' rows (null: the college-wide banks) under its subject.
 * Anything else (a school subject the generator has no code for) is not in the matrix. Pure.
 */
export function buildMatrix(topics: readonly MatrixTopic[], served: ReadonlyMap<string, number>, target: number, board: QuizBankMatrix["board"] = null, targetFromRun = false): QuizBankMatrix {
  const school = new Map<string, Tally>();
  const college = new Map<string, Tally>();
  const collegeSubjects = new Set<string>();
  const collegeStreams = new Set<string | null>();
  const add = (into: Map<string, Tally>, cell: string, chapterKey: string, n: number) => {
    const tally = into.get(cell) ?? { served: 0, chapters: new Map<string, number>() };
    tally.served += n;
    tally.chapters.set(chapterKey, (tally.chapters.get(chapterKey) ?? 0) + n);
    into.set(cell, tally);
  };
  for (const t of topics) {
    const n = served.get(t.id) ?? 0;
    if (t.audience === "COLLEGE") {
      collegeSubjects.add(t.subject);
      for (const stream of t.streams.length ? t.streams : [null]) {
        collegeStreams.add(stream);
        add(college, `${stream ?? ""}|${t.subject}`, t.id, n);
      }
      continue;
    }
    if (!(MATRIX_GRADES as readonly number[]).includes(t.grade) || !(QUIZ_GEN_SUBJECTS as readonly string[]).includes(t.subject)) continue;
    const number = chapterNumberOfLine(t.chapter);
    add(school, `${t.grade}|${t.subject}`, `${t.board ?? ""}|${number ?? `topic:${t.id}`}`, n);
  }
  const subjects = [...QUIZ_GEN_SUBJECTS] as string[];
  const rows = MATRIX_GRADES.map((grade) => {
    const cells = subjects.map((s) => cellOf(s, school.get(`${grade}|${s}`), target));
    return { grade, cells, ...rowTotals(cells) };
  });
  const cSubjects = [...collegeSubjects].sort();
  const cRows = [...collegeStreams]
    .sort((a, b) => streamRank(a) - streamRank(b) || (a ?? "").localeCompare(b ?? ""))
    .map((stream) => {
      const cells = cSubjects.map((s) => cellOf(s, college.get(`${stream ?? ""}|${s}`), target));
      return { stream, cells, ...rowTotals(cells) };
    });
  return { board, target, targetFromRun, subjects, rows, college: { subjects: cSubjects, rows: cRows } };
}

export type ChapterTopic = { id: string; slug: string; board: string | null; grade: number; subject: string; chapter: string; name: string; position: number };
export type ChapterCounts = { levels: number[]; served: number; down: number; held: number; generated: number; authored: number };

/** Who made a chapter's questions: the served ones when it has any, else every question it holds. Pure. */
export function makerOf(served: { generated: number; authored: number }, all: { generated: number; authored: number }): QuizBankMaker | null {
  const pick = served.generated + served.authored > 0 ? served : all;
  if (pick.generated > 0 && pick.authored > 0) return "MIXED";
  if (pick.generated > 0) return "GENERATED";
  if (pick.authored > 0) return "AUTHORED";
  return null;
}

/**
 * The chapters grouped by class, subject and board: classes up, subjects in QUIZ_GEN_SUBJECTS' order (others after,
 * alphabetically), NCERT before Balbharati before none; inside a group the book's order, the chapter number (a line
 * with none after), then the position, then the name. Names and lines under the case rule. Pure.
 */
export function groupChapters(topics: readonly ChapterTopic[], counts: ReadonlyMap<string, ChapterCounts>, all: ReadonlyMap<string, { generated: number; authored: number }>, target: number): QuizBankChapters {
  const groups = new Map<string, QuizBankChapters["groups"][number]>();
  const ordered = [...topics].sort((a, b) => {
    const na = chapterNumberOfLine(a.chapter);
    const nb = chapterNumberOfLine(b.chapter);
    return (
      a.grade - b.grade ||
      subjectRank(a.subject) - subjectRank(b.subject) ||
      a.subject.localeCompare(b.subject) ||
      boardRank(a.board) - boardRank(b.board) ||
      (na ?? Number.MAX_SAFE_INTEGER) - (nb ?? Number.MAX_SAFE_INTEGER) ||
      a.position - b.position ||
      a.name.localeCompare(b.name)
    );
  });
  for (const t of ordered) {
    const key = `${t.grade}|${t.subject}|${t.board ?? ""}`;
    const group = groups.get(key) ?? { grade: t.grade, subject: t.subject, board: t.board, served: 0, chapters: [] };
    const c = counts.get(t.id) ?? { levels: [0, 0, 0, 0, 0, 0], served: 0, down: 0, held: 0, generated: 0, authored: 0 };
    const row: QuizBankChapterRow = {
      topicId: t.id,
      slug: t.slug,
      board: t.board,
      grade: t.grade,
      subject: t.subject,
      chapter: fixTitleCase(t.chapter),
      name: fixTitleCase(t.name),
      number: chapterNumberOfLine(t.chapter),
      levels: c.levels,
      total: c.served,
      down: c.down,
      held: c.held,
      maker: makerOf(c, all.get(t.id) ?? { generated: 0, authored: 0 }),
    };
    group.chapters.push(row);
    group.served += c.served;
    groups.set(key, group);
  }
  return { target, groups: [...groups.values()] };
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                     */
/* -------------------------------------------------------------------------- */

async function topicScope(session: ActiveContext): Promise<Prisma.QuizTopicWhereInput> {
  return fixtureTopicsWhere(await reviewerSeesFixtureTopics(session.user.id));
}

/** The active generation run's target when it has one, else the default. */
export async function bankTarget(): Promise<{ target: number; fromRun: boolean }> {
  const job = await db.quizGenJob.findFirst({ where: { active: true }, select: { request: true } });
  const target = job?.request && typeof job.request === "object" && !Array.isArray(job.request) ? (job.request as { target?: unknown }).target : undefined;
  return typeof target === "number" && Number.isInteger(target) && target > 0 ? { target, fromRun: true } : { target: QUIZ_BANK_DEFAULT_TARGET, fromRun: false };
}

/** A SCHOOL chapter of the board asked (a chapter with no board lists under either), or any COLLEGE chapter. */
function boardWhere(board: string | undefined): Prisma.QuizTopicWhereInput {
  if (!board) return {};
  return { OR: [{ audience: "COLLEGE" }, { board }, { board: null }] };
}

/** The matrix of classes by subjects, for both boards or one. */
export async function bankMatrix(session: ActiveContext, query: QuizBankMatrixQuery = {}): Promise<QuizBankMatrix> {
  reviewerRole(session);
  const [scope, { target, fromRun }] = await Promise.all([topicScope(session), bankTarget()]);
  const where: Prisma.QuizTopicWhereInput = { AND: [{ retiredAt: null }, scope, boardWhere(query.board)] };
  const [topics, served] = await Promise.all([
    db.quizTopic.findMany({ where, select: { id: true, board: true, classLevel: true, subject: true, chapter: true, audience: true, streams: true } }),
    db.quizQuestion.groupBy({ by: ["topicId"], where: { AND: [SERVED_QUESTION, { topic: where }] }, _count: { _all: true } }),
  ]);
  return buildMatrix(
    topics.map((t) => ({ id: t.id, board: t.board, grade: t.classLevel, subject: t.subject, chapter: t.chapter, audience: t.audience, streams: t.streams })),
    new Map(served.map((s) => [s.topicId, s._count._all])),
    target,
    query.board ?? null,
    fromRun,
  );
}

/** The chapters grouped by class and subject under the board, class and subject asked. */
export async function bankChapters(session: ActiveContext, query: QuizBankChaptersQuery = {}): Promise<QuizBankChapters> {
  reviewerRole(session);
  const [scope, { target }] = await Promise.all([topicScope(session), bankTarget()]);
  const where: Prisma.QuizTopicWhereInput = {
    AND: [{ retiredAt: null }, scope, boardWhere(query.board), ...(query.grade ? [{ classLevel: query.grade }] : []), ...(query.subject ? [{ subject: query.subject }] : [])],
  };
  const inTopics: Prisma.QuizQuestionWhereInput = { topic: where };
  const [topics, servedRows, downRows, heldRows, allRows] = await Promise.all([
    db.quizTopic.findMany({ where, select: { id: true, slug: true, board: true, classLevel: true, subject: true, chapter: true, name: true, position: true } }),
    db.quizQuestion.groupBy({ by: ["topicId", "difficulty", "generated"], where: { AND: [SERVED_QUESTION, inTopics] }, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["topicId"], where: { AND: [stateWhere("DOWN"), inTopics] }, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["topicId"], where: { AND: [{ generated: true }, stateWhere("HELD"), inTopics] }, _count: { _all: true } }),
    db.quizQuestion.groupBy({ by: ["topicId", "generated"], where: inTopics, _count: { _all: true } }),
  ]);
  const counts = new Map<string, ChapterCounts>();
  const countsOf = (topicId: string) => {
    const c = counts.get(topicId) ?? { levels: [0, 0, 0, 0, 0, 0], served: 0, down: 0, held: 0, generated: 0, authored: 0 };
    counts.set(topicId, c);
    return c;
  };
  for (const r of servedRows) {
    const c = countsOf(r.topicId);
    c.levels[clampLevel(r.difficulty) - 1]! += r._count._all;
    c.served += r._count._all;
    if (r.generated) c.generated += r._count._all;
    else c.authored += r._count._all;
  }
  for (const r of downRows) countsOf(r.topicId).down = r._count._all;
  for (const r of heldRows) countsOf(r.topicId).held = r._count._all;
  const all = new Map<string, { generated: number; authored: number }>();
  for (const r of allRows) {
    const a = all.get(r.topicId) ?? { generated: 0, authored: 0 };
    if (r.generated) a.generated += r._count._all;
    else a.authored += r._count._all;
    all.set(r.topicId, a);
  }
  return groupChapters(
    topics.map((t) => ({ id: t.id, slug: t.slug, board: t.board, grade: t.classLevel, subject: t.subject, chapter: t.chapter, name: t.name, position: t.position })),
    counts,
    all,
    target,
  );
}

const asReason = (r: string | null): QuizTakeDownReason | null => ((QUIZ_TAKEDOWN_REASONS as readonly string[]).includes(r ?? "") ? (r as QuizTakeDownReason) : null);

/** Where the words in a language come from, and the notes the page prints beside them. Pure. */
export function wordsIn(
  language: QuizBankLanguage,
  english: { stem: string; choices: string[]; solution: string; imageKey: string | null; imageAlt: string | null; takenDownReason: string | null; editedAfterSolvingAt: Date | null },
  translation: { stem: string; choices: string; solution: string; imageKey: string | null; imageAlt: string | null; updatedAt: Date } | null,
  generatedAlt: string | null = null,
): { language: QuizBankLanguage; stem: string; choices: string[]; solution: string; imageKey: string | null; imageAlt: string | null; notes: QuizBankLanguageNote[] } {
  const base = { language: "en" as QuizBankLanguage, stem: english.stem, choices: english.choices, solution: english.solution, imageKey: english.imageKey, imageAlt: english.imageAlt };
  if (language === "en") return { ...base, notes: [] };
  const notes: QuizBankLanguageNote[] = [];
  if (english.takenDownReason === "BAD_TRANSLATION") notes.push("BAD_TRANSLATION");
  if (!translation) return { ...base, notes: ["MISSING", ...notes] };
  const choices = parseChoices(translation.choices);
  if (english.editedAfterSolvingAt && translation.updatedAt < english.editedAfterSolvingAt) notes.push("STALE");
  return {
    language,
    stem: translation.stem,
    choices: choices.length === english.choices.length ? choices : english.choices,
    solution: translation.solution,
    imageKey: translation.imageKey ?? english.imageKey,
    imageAlt: translation.imageAlt ?? generatedAlt ?? english.imageAlt,
    notes,
  };
}

/** One chapter's questions in a standing (served unless asked), fifty a page, in the language asked. */
export async function bankChapter(session: ActiveContext, slug: string, query: QuizBankChapterQuery = {}): Promise<QuizBankChapter> {
  reviewerRole(session);
  const scope = await topicScope(session);
  const topic = await db.quizTopic.findFirst({
    where: { AND: [{ slug }, scope] },
    select: { id: true, slug: true, name: true, chapter: true, subject: true, classLevel: true, board: true, translations: { select: { language: true, name: true } } },
  });
  if (!topic) throw new AccessError("bankDesk.noSuchChapter", "NOT_FOUND");
  const language = query.lang ?? "en";
  const state: QuizBankState = query.state ?? "SERVED";
  const stateRule: Prisma.QuizQuestionWhereInput = state === "SERVED" ? SERVED_QUESTION : state === "HELD" ? { AND: [{ generated: true }, stateWhere("HELD")] } : stateWhere("DOWN");
  const where: Prisma.QuizQuestionWhereInput = { AND: [{ topicId: topic.id }, stateRule] };
  const [served, down, held, total] = await Promise.all([
    db.quizQuestion.count({ where: { AND: [{ topicId: topic.id }, SERVED_QUESTION] } }),
    db.quizQuestion.count({ where: { AND: [{ topicId: topic.id }, stateWhere("DOWN")] } }),
    db.quizQuestion.count({ where: { AND: [{ topicId: topic.id }, { generated: true }, stateWhere("HELD")] } }),
    db.quizQuestion.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / QUIZ_BANK_PAGE_SIZE));
  const page = Math.min(query.page ?? 1, pages);
  const rows = await db.quizQuestion.findMany({
    where,
    orderBy: [{ difficulty: "asc" }, { generated: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    skip: (page - 1) * QUIZ_BANK_PAGE_SIZE,
    take: QUIZ_BANK_PAGE_SIZE,
    select: {
      id: true,
      generated: true,
      difficulty: true,
      stem: true,
      choices: true,
      answerIndex: true,
      solution: true,
      source: true,
      generation: true,
      imageKey: true,
      imageAlt: true,
      needsFigure: true,
      takenDownAt: true,
      takenDownReason: true,
      editedAfterSolvingAt: true,
      createdAt: true,
      translations: language === "en" ? false : { where: { language }, select: { stem: true, choices: true, solution: true, imageKey: true, imageAlt: true, updatedAt: true } },
    },
  });
  const items: QuizBankChapterItem[] = rows.map((r) => {
    const g = r.generated ? readGeneration(r.generation) : {};
    const translation = language === "en" ? null : ((r.translations as { stem: string; choices: string; solution: string; imageKey: string | null; imageAlt: string | null; updatedAt: Date }[] | undefined)?.[0] ?? null);
    const words = wordsIn(
      language,
      { stem: r.stem, choices: parseChoices(r.choices), solution: r.solution, imageKey: r.imageKey, imageAlt: r.imageAlt, takenDownReason: r.takenDownReason, editedAfterSolvingAt: r.editedAfterSolvingAt },
      translation,
      language === "en" ? null : (g.translations?.[language]?.imageAlt ?? null),
    );
    const drafted = g.generatedAt ? new Date(g.generatedAt) : null;
    return {
      id: r.id,
      generated: r.generated,
      difficulty: clampLevel(r.difficulty),
      ...words,
      answerIndex: r.answerIndex,
      needsFigure: r.needsFigure,
      madeAt: (drafted && !Number.isNaN(drafted.getTime()) ? drafted : r.createdAt).toISOString(),
      source: r.source,
      state: stateOfRow(r),
      takenDownReason: asReason(r.takenDownReason),
    };
  });
  const translatedName = language === "en" ? null : topic.translations.find((t) => t.language === language)?.name;
  return {
    topic: { id: topic.id, slug: topic.slug, name: translatedName || fixTitleCase(topic.name), chapter: fixTitleCase(topic.chapter), subject: topic.subject, grade: topic.classLevel, board: topic.board },
    language,
    state,
    counts: { served, down, held },
    page,
    pages,
    total,
    items,
  };
}
