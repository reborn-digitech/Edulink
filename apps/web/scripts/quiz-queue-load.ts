/**
 * The review queue's loader, as a function (quiz-board, 11 October 2026): scripts/quiz-queue.ts reads
 * the files, verifies them and hands them here; tests/quiz-board.test.ts calls it on a ZZ batch. No main.
 *
 * What it writes, per batch (see quiz-queue.ts's header for the rules it keeps):
 *
 *   THE TOPIC'S BOARD — the batch's `board` (a QUIZ_BOARDS code, required by the verifier) is the truth:
 *   a new topic is made with it, a topic with none takes it, and a topic already marked with the OTHER
 *   board refuses the whole run before anything is written (a Balbharati batch must not extend an NCERT
 *   chapter that happens to share its slug).
 *
 *   THE FIGURE — an item with a `figure` spec is drawn and stored here, in English and each language it is
 *   translated into, with the figure builder's own pair (scripts/quiz-gen/figures/attach.ts:
 *   `prepareFigure` before the row write, `finishFigure` after the translation rows), so the question's
 *   imageKey/imageAlt and each translation's are set and the review desk's accept rule ("an item that
 *   needs a figure is accepted only once it is drawn") can be met. A figure that cannot be drawn does not
 *   stop the batch: the item is loaded with the reason in its `generation.figureError`, and the desk shows
 *   "Figure failed" with it. An unchanged spec keeps its stored files on a re-run.
 *
 *   ONE WAY IN — this is the only writer of a `generated` row; scripts/import-quiz.ts loads the authored
 *   files only.
 */
import type { PrismaClient } from "@prisma/client";
import { asQuizBoard, type QuizBoard } from "@edulink/contracts";
import { finishFigure, figureProblems, prepareFigure, type PreparedFigure } from "./quiz-gen/figures/attach";

export type QueueTr = { stem?: string; choices?: string[]; solution?: string; imageAlt?: string | null; critique?: string | null; flag?: string | null };
export type QueueItem = {
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr?: string | null;
  imageKey?: string | null;
  imageAlt?: string | null;
  figure?: { kind: string; spec: Record<string, unknown>; labels?: Record<string, unknown> } | null;
  needsFigure?: boolean;
  distractorReason?: (string | null)[];
  solverAnswers?: number[];
  levelFlag?: string | null;
  critique?: string | null;
  edition?: string | null;
  generatedAt?: string;
  model?: string;
  translations?: Partial<Record<"hi" | "mr", QueueTr>>;
};
export type QueueBatch = {
  subject: string;
  classLevel: number;
  chapter: string;
  name: string;
  slug: string;
  summary?: string;
  position?: number;
  source: string;
  licence: string;
  board?: string;
  translations?: Record<string, { name?: string; summary?: string }>;
  questions: QueueItem[];
};

export type QueueLoadResult = {
  created: number;
  updated: number;
  settled: number;
  duplicates: number;
  topicsMade: number;
  /** Topics that had no board and took the batch's. */
  boardsSet: number;
  /** Items whose figure was drawn and stored this run (kept files count under figuresKept). */
  figuresDrawn: number;
  figuresKept: number;
  /** Items loaded without their figure, with the reason the desk shows. */
  figuresFailed: { file: string; stem: string; reason: string }[];
};

/** The reviewer's material kept on the row (src/lib/quiz-review.ts readGeneration reads it back). */
export function generationOf(item: QueueItem, board: QuizBoard, figureError: string | null): string {
  const translations: Record<string, { imageAlt: string | null; critique: string | null; flag: string | null }> = {};
  for (const language of ["hi", "mr"] as const) {
    const t = item.translations?.[language];
    if (t) translations[language] = { imageAlt: t.imageAlt ?? null, critique: t.critique ?? null, flag: t.flag ?? null };
  }
  return JSON.stringify({
    distractorReason: item.distractorReason ?? [],
    solverAnswers: item.solverAnswers ?? [],
    levelFlag: item.levelFlag ?? null,
    critique: item.critique ?? null,
    figure: item.figure ?? null,
    needsFigure: item.needsFigure === true,
    figureError,
    edition: item.edition ?? null,
    generatedAt: item.generatedAt ?? null,
    model: item.model ?? null,
    board,
    translations,
  });
}

const firstLine = (error: unknown) => String((error as Error)?.message ?? error).split("\n")[0]!.slice(0, 400);

export async function loadGeneratedBatches(db: PrismaClient, batches: { file: string; batch: QueueBatch }[], opts: { dry?: boolean } = {}): Promise<QueueLoadResult> {
  const dry = opts.dry === true;
  const result: QueueLoadResult = { created: 0, updated: 0, settled: 0, duplicates: 0, topicsMade: 0, boardsSet: 0, figuresDrawn: 0, figuresKept: 0, figuresFailed: [] };

  // The boards first, for every batch, before anything is written: a missing board or a clash refuses the run.
  const boards = new Map<string, QuizBoard>();
  for (const { file, batch } of batches) {
    const board = asQuizBoard(batch.board);
    if (!board) throw new Error(`${file}: board "${batch.board ?? ""}" is not one of the practice boards; nothing was written`);
    const topic = await db.quizTopic.findUnique({ where: { slug: batch.slug }, select: { board: true } });
    if (topic?.board && topic.board !== board) throw new Error(`${file}: the chapter "${batch.slug}" is ${topic.board}'s and this batch is ${board}'s; nothing was written`);
    boards.set(file, board);
  }

  for (const { file, batch } of batches) {
    const board = boards.get(file)!;
    let topic = await db.quizTopic.findUnique({ where: { slug: batch.slug }, select: { id: true, board: true } });
    if (!topic) {
      result.topicsMade++;
      if (dry) {
        result.created += batch.questions.length;
        continue;
      }
      topic = await db.quizTopic.create({
        data: { subject: batch.subject, classLevel: batch.classLevel, chapter: batch.chapter, name: batch.name, slug: batch.slug, summary: batch.summary ?? "", position: batch.position ?? 0, board },
        select: { id: true, board: true },
      });
      for (const [language, tr] of Object.entries(batch.translations ?? {})) {
        await db.quizTopicTranslation.create({ data: { topicId: topic.id, language, name: tr.name ?? batch.name, summary: tr.summary ?? "" } });
      }
    } else if (!topic.board) {
      result.boardsSet++;
      if (!dry) await db.quizTopic.update({ where: { id: topic.id }, data: { board } });
    }

    const existing = await db.quizQuestion.findMany({ where: { topicId: topic.id }, select: { id: true, stem: true, generated: true, reviewedAt: true, discardedAt: true, imageKey: true, imageSpec: true } });
    const byStem = new Map(existing.map((q) => [q.stem.trim(), q]));

    for (const item of batch.questions) {
      const stem = item.stem.trim();
      const found = byStem.get(stem);
      if (found && !found.generated) {
        result.duplicates++;
        continue;
      }
      if (found && (found.reviewedAt || found.discardedAt)) {
        result.settled++;
        continue;
      }

      // The figure, drawn before the row is written (every language first, so a refusal stores nothing).
      let prepared: PreparedFigure | null = null;
      let figureError: string | null = null;
      if (item.figure) {
        if (dry) {
          const problems = figureProblems(item).filter((p) => !p.startsWith("has a figure but no imageAlt"));
          if (problems.length) figureError = problems.join("; ");
        } else {
          try {
            prepared = await prepareFigure(db, found?.id ?? null, item);
          } catch (error) {
            figureError = firstLine(error);
          }
        }
        if (figureError) result.figuresFailed.push({ file, stem, reason: figureError });
        else if (prepared?.drawn || dry) result.figuresDrawn++;
        else if (prepared) result.figuresKept++;
      }

      const data = {
        difficulty: item.difficulty,
        stem,
        choices: JSON.stringify(item.choices),
        answerIndex: item.answerIndex,
        solution: item.solution,
        checkExpr: item.checkExpr ?? null,
        source: batch.source,
        licence: batch.licence,
        imageKey: prepared?.imageKey ?? null,
        imageAlt: prepared ? (item.imageAlt ?? null) : null,
        generated: true,
        generatedBoard: board,
        generation: generationOf(item, board, figureError),
        reviewedAt: null,
        reviewedBy: null,
      };
      if (dry) {
        if (found) result.updated++;
        else result.created++;
        continue;
      }
      const questionId = found
        ? (await db.quizQuestion.update({ where: { id: found.id }, data, select: { id: true } })).id
        : (await db.quizQuestion.create({ data: { ...data, topicId: topic.id }, select: { id: true } })).id;
      if (found) result.updated++;
      else result.created++;
      for (const language of ["hi", "mr"] as const) {
        const tr = item.translations?.[language];
        if (!tr?.stem) continue;
        const payload = { stem: tr.stem, choices: tr.choices ? JSON.stringify(tr.choices) : "", solution: tr.solution ?? "" };
        await db.quizQuestionTranslation.upsert({
          where: { questionId_language: { questionId, language } },
          create: { questionId, language, ...payload },
          update: payload,
        });
      }
      // The translation rows point at their drawings and words; a figure gone takes its files with it.
      // A drawing an earlier run stored whose item now has no figure (or one that failed) goes whole, its
      // English file named by the row as read before the write (finishFigure, the one place both importers use).
      await finishFigure(db, questionId, item, prepared, found ? { imageKey: found.imageKey, imageSpec: found.imageSpec } : null);
    }
  }
  return result;
}
