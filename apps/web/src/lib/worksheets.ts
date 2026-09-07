import "server-only";
import { createHash } from "node:crypto";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { clampLevel, normaliseLanguage, TIER_NAMES, type QuizSubject } from "./quiz";
import type { ActiveContext } from "./session";

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

const MAX_QUESTIONS = 30;

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

  const topic = await db.quizTopic.findUnique({
    where: { slug: input.slug },
    select: { id: true, name: true, subject: true, classLevel: true },
  });
  if (!topic) throw new AccessError("access.chapterNotFound", "NOT_FOUND");

  // Ids only for the whole pool, then rows for the chosen few — the same
  // shape the serving path uses to stay flat as the bank grows.
  const pool = await db.quizQuestion.findMany({
    where: { topicId: topic.id, difficulty: level },
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
      select: { id: true, stem: true, choices: true, answerIndex: true, solution: true },
    }),
    language === "en"
      ? Promise.resolve([])
      : db.quizQuestionTranslation.findMany({
          where: { questionId: { in: chosenIds }, language },
          select: { questionId: true, stem: true, choices: true, solution: true },
        }),
  ]);
  const translated = new Map(translations.map((t) => [t.questionId, t]));
  const byId = new Map(rows.map((r) => [r.id, r]));

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
    orderBy: [{ classLevel: "asc" }, { subject: "asc" }, { position: "asc" }],
    select: { slug: true, name: true, subject: true, classLevel: true },
  });
}
