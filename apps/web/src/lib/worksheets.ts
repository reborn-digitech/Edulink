import "server-only";
import { fixtureTopicsWhere, schoolSeesFixtureTopics } from "./quiz-fixtures";
import { practiceTopicsWhereFor } from "./practice-audience"; // college-content (12 Oct 2026)
import { createHash } from "node:crypto";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { clampLevel, normaliseLanguage, TIER_NAMES, type QuizSubject } from "./quiz";
import type { ActiveContext } from "./session";
import { SERVED_QUESTION, servedTranslation } from "./quiz-served";

/**
 * Worksheets off the question bank: a teacher picks a chapter, a rung and a
 * count, and gets a printable paper plus a separate answer-and-solution key.
 *
 * DETERMINISTIC BY SEED. The seed is in the URL, so the same link prints the
 * same worksheet on Monday and on Friday — a teacher can hand the office a
 * link instead of a photocopy — and a new seed is one tap for a fresh paper
 * from the same pool. sha1(seed + id) ordering, the generator's own trick.
 *
 * STAFF ONLY, and the reason is the key: the answers ride along. The pupil
 * surface serves one question at a time and never the answer (see quiz.ts);
 * this module hands the whole paper to an adult, which is what a worksheet is.
 */

export type WorksheetQuestion = {
  number: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
};

export type Worksheet = {
  topicName: string;
  subject: QuizSubject;
  classLevel: number;
  level: number;
  tierName: string;
  seed: string;
  questions: WorksheetQuestion[];
};

export const MAX_QUESTIONS = 30;

function rank(seed: string, id: string): string {
  return createHash("sha1").update(`${seed}|${id}`).digest("hex");
}

export async function buildWorksheet(
  ctx: ActiveContext,
  input: { slug: string; level: number; count: number; seed: string },
): Promise<Worksheet> {
  const { role } = ctx;
  if (role !== "TEACHER" && role !== "ADMIN") {
    throw new AccessError("access.onlyStaffPrintWorksheets");
  }

  const level = clampLevel(input.level);
  const count = Math.max(1, Math.min(MAX_QUESTIONS, Math.floor(input.count) || 10));
  const seed = input.seed.slice(0, 40) || "1";

  // college-content (12 Oct 2026): a chapter the school or college does not list prints no sheet.
  const topic = await db.quizTopic.findFirst({
    where: { slug: input.slug, ...(await practiceTopicsWhereFor(ctx.schoolId)) },
    select: { id: true, name: true, subject: true, classLevel: true },
  });
  if (!topic) throw new AccessError("access.chapterNotFound", "NOT_FOUND");

  // Ids only for the whole pool, then rows for the chosen few — the same
  // shape the serving path uses to stay flat as the bank grows.
  const pool = await db.quizQuestion.findMany({
    // Served questions only: a generated item taken down on the bank desk, or held for its figure, never reaches a sheet (quiz-served.ts).
    where: { topicId: topic.id, difficulty: level, ...SERVED_QUESTION },
    select: { id: true },
  });
  if (pool.length === 0) throw new AccessError("access.noQuestionsAtThatLevel", "NOT_FOUND");

  const chosenIds = pool
    .map((q) => ({ id: q.id, key: rank(seed, q.id) }))
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .slice(0, count)
    .map((q) => q.id);

  const language = normaliseLanguage(ctx.user.prefs.locale);
  const [rows, translations] = await Promise.all([
    db.quizQuestion.findMany({
      where: { id: { in: chosenIds } },
      select: { id: true, stem: true, choices: true, answerIndex: true, solution: true, editedAfterSolvingAt: true },
    }),
    language === "en"
      ? Promise.resolve([])
      : db.quizQuestionTranslation.findMany({
          where: { questionId: { in: chosenIds }, language },
          select: { questionId: true, stem: true, choices: true, solution: true, updatedAt: true },
        }),
  ]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  // A language row older than the desk's last English edit is not printed: the English is, with the key it matches (TA-199, quiz-served.ts).
  const translated = new Map<string, (typeof translations)[number]>();
  for (const t of translations) {
    const row = byId.get(t.questionId);
    const fresh = row ? servedTranslation(t, row) : null;
    if (fresh) translated.set(t.questionId, fresh);
  }

  return {
    topicName: topic.name,
    subject: topic.subject as QuizSubject,
    classLevel: topic.classLevel,
    level,
    tierName: TIER_NAMES[level - 1]!,
    seed,
    questions: chosenIds.map((id, index) => {
      const row = byId.get(id)!;
      const t = translated.get(id);
      return {
        number: index + 1,
        stem: t?.stem ?? row.stem,
        // The translation cannot carry its own answerIndex (schema), so the
        // choices arrays are index-aligned by construction.
        choices: JSON.parse(t?.choices ?? row.choices) as string[],
        answerIndex: row.answerIndex,
        solution: t?.solution ?? row.solution ?? "",
      };
    }),
  };
}

/** Chapters offered on the worksheet form, grouped by grade. */
export async function worksheetTopics(ctx: ActiveContext) {
  if (ctx.role !== "TEACHER" && ctx.role !== "ADMIN") {
    throw new AccessError("access.onlyStaffPrintWorksheets");
  }
  return db.quizTopic.findMany({
    // college-content (12 Oct 2026): only the chapters the school or college lists.
    where: { AND: [fixtureTopicsWhere(await schoolSeesFixtureTopics(ctx.schoolId)), await practiceTopicsWhereFor(ctx.schoolId)] },
    orderBy: [{ classLevel: "asc" }, { subject: "asc" }, { position: "asc" }],
    select: { slug: true, name: true, subject: true, classLevel: true },
  });
}
