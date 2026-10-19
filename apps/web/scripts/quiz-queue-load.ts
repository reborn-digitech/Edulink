/**
 * The generated bank's loader, as a function (quiz-board, 11 October 2026): scripts/quiz-queue.ts reads
 * the files, verifies them and hands them here; the generation job's runner (scripts/quiz-gen/job.ts)
 * hands it each chapter as it finishes; tests/quiz-board.test.ts calls it on a ZZ batch. No main.
 *
 *   PUBLISHED ON LOAD (the owner, 11 October 2026): an item the generator kept passed its own checks, and
 *   is served the moment it is written here, its Hindi and Marathi with it (src/lib/quiz-served.ts) —
 *   unless its figure failed to draw (`needsFigure` with no imageKey: held until the figure is drawn).
 *   The bank desk takes an item down or edits it afterwards; a re-run leaves an item a person edited or
 *   took down (or that the review queue stamped, before this) exactly as it is.
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
 *   imageKey/imageAlt and each translation's are set and the item is served. A figure that cannot be
 *   drawn does not stop the batch: the item is loaded with the reason in its `generation.figureError`,
 *   HELD from pupils (needsFigure with no imageKey), and the desk shows "Figure failed" with it. An unchanged spec keeps its stored files on a re-run.
 *
 *   ONE WAY IN — this is the only writer of a `generated` row; scripts/import-quiz.ts loads the authored
 *   files only.
 *
 *   THE "CHAPTER N" TOPIC (chapter-titles, 19 October 2026) — a batch whose slug finds no topic first looks for a
 *   SCHOOL topic of its board, class, subject and chapter number named only "Chapter N" (a run that drafted the
 *   chapter before its title was in the corpus made it), or carrying the "<subject>-<class>-chapter-N" slug and the
 *   batch's own name, and loads into it, renaming a "Chapter N" to the batch's title when the batch carries one
 *   (audited as "operator.quizTopic.rename", via this file). A topic with a title of its own is never taken: two
 *   books share a number in class 8 and are separate chapters by design.
 */
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { asCollegeTerm, asQuizBoard, cleanTopicStreams, collegeSyllabusBoardOf, type QuizBoard } from "@edulink/contracts";
import { finishFigure, figureProblems, prepareFigure, type PreparedFigure } from "./quiz-gen/figures/attach";
import { chapterNameOf, chapterNumberOf, newTopicSlug } from "./quiz-gen/checks";

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
  // ---- college-content (12 Oct 2026): a college unit's batch (scripts/quiz-gen/college.ts): no school board ----
  audience?: string;
  streams?: string[];
  programme?: string | null;
  yearOrSemester?: string | null;
  syllabusBoard?: string;
  document?: string;
  // ---- end college-content ----
};

/** college-content (12 Oct 2026): whether a batch is a college unit's (audience COLLEGE), which carries no school board. */
export function isCollegeBatch(batch: Pick<QueueBatch, "audience">): boolean {
  return batch.audience === "COLLEGE";
}

/** The topic fields a college batch sets: its stream, programme and year or semester, the one writer for a generated college topic. */
function collegeTopicData(batch: QueueBatch) {
  return { audience: "COLLEGE", streams: cleanTopicStreams(batch.streams), programme: batch.programme?.trim() || null, yearOrSemester: asCollegeTerm(batch.yearOrSemester) };
}

export type QueueLoadResult = {
  created: number;
  updated: number;
  /** Items a person edited or took down on the desk (or the review queue stamped before 11 Oct 2026), left alone. */
  settled: number;
  duplicates: number;
  topicsMade: number;
  /** chapter-titles (19 Oct 2026): "Chapter N" topics a batch was loaded into instead of a new one (renamed when it carried a title). */
  topicsAdopted?: number;
  /** Topics that had no board and took the batch's. */
  boardsSet: number;
  /** Items whose figure was drawn and stored this run (kept files count under figuresKept). */
  figuresDrawn: number;
  figuresKept: number;
  /** Items loaded without their figure, with the reason the desk shows. */
  figuresFailed: { file: string; stem: string; reason: string }[];
};

/** The reviewer's material kept on the row (src/lib/quiz-review.ts readGeneration reads it back). */
export function generationOf(item: QueueItem, board: QuizBoard | string, figureError: string | null): string {
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

/** A topic's name that is only its label: "Chapter 10". */
export function isBareChapterName(name: string): boolean {
  return /^(?:chapter|unit|lesson)\s*\d{1,2}$/i.test(name.trim());
}

/** The number a topic's chapter line starts with: "Chapter 4 — X", "Chapter 4: X", "Chapter 4"; never 40 for 4. */
export function chapterLineNumber(chapter: string): number | null {
  const m = /^chapter\s+(\d{1,2})(?=\s|:|—|–|$)/i.exec(chapter.trim());
  return m ? Number(m[1]) : null;
}

export type TopicForAdoption = { slug: string; name: string; chapter: string; board: string | null; subject: string; classLevel: number; audience: string; retiredAt: Date | null };

const squashName = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/**
 * Whether a batch whose slug found nothing may load into this existing topic (pure): a SCHOOL topic, not retired, of
 * the batch's board, subject, class and chapter number, named only "Chapter N" — or carrying the chapter-N slug
 * ("maths-9-chapter-1", "balbharati-science-8-chapter-3") and already the batch's own name. A topic with a title of
 * its own is never taken.
 */
export function adoptsTopic(topic: TopicForAdoption, batch: Pick<QueueBatch, "subject" | "classLevel" | "chapter" | "name" | "position">, board: string): boolean {
  if (topic.audience !== "SCHOOL" || topic.retiredAt || topic.board !== board) return false;
  if (topic.subject !== batch.subject || topic.classLevel !== batch.classLevel) return false;
  const n = chapterNumberOf(batch.chapter) ?? (batch.position && batch.position > 0 ? batch.position : null);
  if (n === null || chapterLineNumber(topic.chapter) !== n) return false;
  if (isBareChapterName(topic.name)) return true;
  const chapterSlug = topic.slug === newTopicSlug(board, batch.subject, batch.classLevel, `Chapter ${n}`) || topic.slug === `${batch.subject.toLowerCase()}-${batch.classLevel}-chapter-${n}`;
  return chapterSlug && squashName(topic.name) === squashName(batch.name);
}

/**
 * The topic a batch with no topic of its slug loads into, if any (adoptsTopic), renamed to the batch's title and
 * chapter line when it is a "Chapter N" and the batch carries a real title. Nothing is written when `dry`.
 */
async function adoptTopic(db: PrismaClient, batch: QueueBatch, board: QuizBoard, dry: boolean): Promise<{ id: string; board: string | null } | null> {
  const rows = await db.quizTopic.findMany({
    where: { audience: "SCHOOL", board, subject: batch.subject, classLevel: batch.classLevel, retiredAt: null },
    select: { id: true, slug: true, name: true, chapter: true, board: true, subject: true, classLevel: true, audience: true, retiredAt: true },
    orderBy: { createdAt: "asc" },
  });
  const topic = rows.find((t) => adoptsTopic(t, batch, board));
  if (!topic) return null;
  const titled = !isBareChapterName(batch.name) && chapterNameOf(batch.chapter) !== "";
  if (!dry && titled && isBareChapterName(topic.name)) {
    await db.quizTopic.update({ where: { id: topic.id }, data: { name: batch.name, chapter: batch.chapter } });
    // Raw, as src/lib/audit.ts writes a row with no school: no actor, the file that renamed it in meta.via.
    try {
      const meta = JSON.stringify({ via: "scripts/quiz-queue-load.ts", slug: topic.slug, batchSlug: batch.slug, from: { name: topic.name, chapter: topic.chapter }, to: { name: batch.name, chapter: batch.chapter } });
      await db.$executeRaw`
        INSERT INTO "AuditLog" ("id", "schoolId", "actorUserId", "action", "targetType", "targetId", "meta", "ip", "createdAt")
        VALUES (${randomUUID()}, NULL, NULL, ${"operator.quizTopic.rename"}, ${"QuizTopic"}, ${topic.id}, ${meta}, NULL, ${new Date().toISOString()}::timestamp)`;
    } catch (error) {
      console.error("[quiz-queue-load] the rename's audit row was not written", error);
    }
  }
  return { id: topic.id, board: topic.board };
}

const firstLine = (error: unknown) => String((error as Error)?.message ?? error).split("\n")[0]!.slice(0, 400);

export async function loadGeneratedBatches(db: PrismaClient, batches: { file: string; batch: QueueBatch }[], opts: { dry?: boolean } = {}): Promise<QueueLoadResult> {
  const dry = opts.dry === true;
  const result: QueueLoadResult = { created: 0, updated: 0, settled: 0, duplicates: 0, topicsMade: 0, topicsAdopted: 0, boardsSet: 0, figuresDrawn: 0, figuresKept: 0, figuresFailed: [] };

  // The boards first, for every batch, before anything is written: a missing board or a clash refuses the run.
  const boards = new Map<string, QuizBoard>();
  for (const { file, batch } of batches) {
    // college-content (12 Oct 2026): a college unit names its stream and its syllabus's board instead, and may not extend a school chapter.
    if (isCollegeBatch(batch)) {
      if (!cleanTopicStreams(batch.streams).length) throw new Error(`${file}: a college batch names no stream; nothing was written`);
      if (!collegeSyllabusBoardOf(batch.syllabusBoard)) throw new Error(`${file}: syllabusBoard "${batch.syllabusBoard ?? ""}" is not one of the syllabus boards; nothing was written`);
      const topic = await db.quizTopic.findUnique({ where: { slug: batch.slug }, select: { audience: true } });
      if (topic && topic.audience !== "COLLEGE") throw new Error(`${file}: the chapter "${batch.slug}" is the school bank's and this batch is a college unit; nothing was written`);
      continue;
    }
    const board = asQuizBoard(batch.board);
    if (!board) throw new Error(`${file}: board "${batch.board ?? ""}" is not one of the practice boards; nothing was written`);
    const topic = await db.quizTopic.findUnique({ where: { slug: batch.slug }, select: { board: true } });
    if (topic?.board && topic.board !== board) throw new Error(`${file}: the chapter "${batch.slug}" is ${topic.board}'s and this batch is ${board}'s; nothing was written`);
    boards.set(file, board);
  }

  for (const { file, batch } of batches) {
    const college = isCollegeBatch(batch);
    // A college unit's items carry no school board (generatedBoard null); its syllabus's board is kept in the generation record.
    const board = college ? null : boards.get(file)!;
    const recordBoard = board ?? collegeSyllabusBoardOf(batch.syllabusBoard) ?? "";
    let topic = await db.quizTopic.findUnique({ where: { slug: batch.slug }, select: { id: true, board: true } });
    // chapter-titles (19 Oct 2026): a "Chapter N" topic of this chapter takes the batch before a new one is made.
    if (!topic && !college && board) {
      topic = await adoptTopic(db, batch, board, dry);
      if (topic) result.topicsAdopted = (result.topicsAdopted ?? 0) + 1;
    }
    if (!topic) {
      result.topicsMade++;
      if (dry) {
        result.created += batch.questions.length;
        continue;
      }
      topic = await db.quizTopic.create({
        data: { subject: batch.subject, classLevel: batch.classLevel, chapter: batch.chapter, name: batch.name, slug: batch.slug, summary: batch.summary ?? "", position: batch.position ?? 0, board, ...(college ? collegeTopicData(batch) : {}) },
        select: { id: true, board: true },
      });
      for (const [language, tr] of Object.entries(batch.translations ?? {})) {
        await db.quizTopicTranslation.create({ data: { topicId: topic.id, language, name: tr.name ?? batch.name, summary: tr.summary ?? "" } });
      }
    } else if (college) {
      // college-content: the stream, programme and term follow the batch (the loader is their one writer for a generated college topic).
      if (!dry) await db.quizTopic.update({ where: { id: topic.id }, data: collegeTopicData(batch) });
    } else if (!topic.board) {
      result.boardsSet++;
      if (!dry) await db.quizTopic.update({ where: { id: topic.id }, data: { board } });
    }

    const existing = await db.quizQuestion.findMany({ where: { topicId: topic.id }, select: { id: true, stem: true, generated: true, reviewedAt: true, takenDownAt: true, editedAfterSolvingAt: true, imageKey: true, imageSpec: true } });
    const byStem = new Map(existing.map((q) => [q.stem.trim(), q]));

    for (const item of batch.questions) {
      const stem = item.stem.trim();
      const found = byStem.get(stem);
      if (found && !found.generated) {
        result.duplicates++;
        continue;
      }
      if (found && (found.reviewedAt || found.takenDownAt || found.editedAfterSolvingAt)) {
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
        generation: generationOf(item, recordBoard, figureError),
        // The serving filter's hold: a figure the item needs and nobody drew keeps it from pupils (quiz-served.ts).
        needsFigure: item.needsFigure === true,
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
