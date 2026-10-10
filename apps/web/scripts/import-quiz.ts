/**
 * Loads content/quiz/*.json into the database.
 *
 * VERIFIES FIRST, ALWAYS. The importer runs the same checks the verifier does
 * and refuses the whole run if any fail, rather than importing the good files
 * and reporting the bad ones. A half-imported bank is the worst outcome: the
 * topics that landed look fine, so nobody re-runs it, and the missing ones are
 * discovered by a child hitting an empty topic.
 *
 * IDEMPOTENT, by slug for topics and by stem for questions. Re-running after
 * editing a file updates in place rather than doubling the bank — which matters
 * because editing a solution and re-importing is the normal way this content
 * gets fixed.
 *
 * ONE WAY IN FOR A GENERATED ITEM (the owner, 11 October 2026): this importer loads the authored files
 * only and never writes a `generated` row or a review stamp; a generated batch enters the bank through
 * `npm run quiz:queue` alone. Every authored topic it writes is marked NCERT's (QuizTopic.board).
 *
 * GENERATED BATCHES are NOT this importer's. content/quiz/generated/*.json (the quiz bank generator,
 * scripts/quiz-gen, 10 October 2026) are loaded by scripts/quiz-queue.ts as `generated` rows with
 * reviewedAt null, which src/lib/quiz-served.ts keeps away from pupils until an app admin or the
 * operator stamps them (src/lib/quiz-review.ts, the one writer of a stamp; the JSON's `stamps: []`
 * is the generator's placeholder, never read here). This importer reads the authored files only and
 * never matches, updates or sweeps a generated row. An authored item naming an `imageKey` has that
 * file (under content/quiz/figures/) copied into the uploads store the way a document's bytes are
 * kept (src/lib/storage.ts: sniffed, stripped, a random name), once: a re-import keeps the stored
 * copy when the bytes have not changed.
 *
 * Runs as the schema OWNER. QuizTopic and QuizQuestion carry no schoolId and
 * sit in NO_SCHOOL_POLICY, so there is no tenant to bind; the app role can read
 * them freely, which is the point of a shared catalogue.
 *
 * Run: npm run quiz:import
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { config } from "dotenv";
import { AUTHORED_IN_THE_APP } from "../src/lib/bank-source";
import { deleteStoredFile, etagFor, readStoredFile, storeFile } from "../src/lib/storage";
import { FIGURES_DIR, readBankFiles, type TopicFile } from "./verify-quiz";
import { finishFigure, prepareFigure } from "./quiz-gen/figures/attach";
import { asQuizBoard, type QuizBoard } from "@edulink/contracts";

config();

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL });
/** quiz-board (11 Oct 2026): every authored chapter was written against the NCERT syllabus; QuizTopic.board says so. */
const AUTHORED_BOARD: QuizBoard = "NCERT";
// The `source` tags of a question made in the app rather than imported (src/lib/app-admin.ts,
// src/lib/bank-tools.ts, src/lib/gig-questions.ts) come from src/lib/bank-source.ts with the writers,
// so a rename cannot leave this set behind and orphan every question written in the app.

function verifyOrExit() {
  try {
    execFileSync(
      "npx",
      ["tsx", "--tsconfig", "scripts/tsconfig.json", "scripts/verify-quiz.ts"],
      { stdio: "inherit" },
    );
  } catch {
    console.error("\nImport refused: the bank did not verify. Nothing was written.\n");
    process.exit(1);
  }
}

/**
 * The figure's bytes into the uploads store, once. Returns the fileId to keep on the row: the
 * existing one when the stored bytes match the file's, a fresh one (and the old deleted) otherwise.
 */
async function storeFigure(imageKey: string, existingFileId: string | null): Promise<string> {
  const bytes = readFileSync(join(FIGURES_DIR, imageKey));
  if (existingFileId) {
    const stored = await readStoredFile(existingFileId);
    if (stored && etagFor(stored.bytes) === etagFor(bytes)) return existingFileId;
  }
  const ext = imageKey.split(".").pop()!.toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const stored = await storeFile(new File([bytes], imageKey, { type: mime }));
  if (existingFileId) await deleteStoredFile(existingFileId);
  return stored.fileId;
}

async function main() {
  verifyOrExit();

  // The authored files only: generated/ is scripts/quiz-queue.ts's (see the header).
  const files = readBankFiles().filter((f) => !f.generated);
  let topicsWritten = 0;
  let questionsWritten = 0;
  let questionsUpdated = 0;
  let questionsRemoved = 0;
  let translationsWritten = 0;
  let figuresStored = 0;
  let figuresDrawn = 0;

  for (const { path } of files) {
    const topic: TopicFile = JSON.parse(readFileSync(path, "utf8"));
    const slug = topic.slug;
    // quiz-board (11 Oct 2026): the authored bank is written against the NCERT syllabus (the owner); a file may name its board.
    const board = asQuizBoard(topic.board) ?? AUTHORED_BOARD;

    const row = await db.quizTopic.upsert({
      where: { slug },
      create: {
        subject: topic.subject,
        classLevel: topic.classLevel,
        chapter: topic.chapter,
        name: topic.name,
        slug,
        summary: topic.summary ?? "",
        position: topic.position ?? 0,
        board,
      },
      update: {
        subject: topic.subject,
        classLevel: topic.classLevel,
        chapter: topic.chapter,
        name: topic.name,
        summary: topic.summary ?? "",
        position: topic.position ?? 0,
        board,
      },
    });
    topicsWritten++;

    for (const [language, tr] of Object.entries(topic.translations ?? {})) {
      await db.quizTopicTranslation.upsert({
        where: { topicId_language: { topicId: row.id, language } },
        create: { topicId: row.id, language, name: tr.name ?? "", summary: tr.summary ?? "" },
        update: { name: tr.name ?? "", summary: tr.summary ?? "" },
      });
    }

    const existing = await db.quizQuestion.findMany({
      // review-queue (10 Oct 2026): a row scripts/quiz-queue.ts loaded (generated: true) is the review queue's,
      // never this file's — not matched by stem, not updated, not swept as an orphan below.
      where: { topicId: row.id, generated: false },
      select: { id: true, stem: true, source: true, imageKey: true, imageSpec: true },
    });
    const byStem = new Map(existing.map((q) => [q.stem.trim(), q]));
    const keep = new Set<string>();

    for (const question of topic.questions) {
      const stem = question.stem.trim();
      const current = byStem.get(stem);
      const review = { reviewedAt: question.reviewedAt ? new Date(`${question.reviewedAt}T00:00:00.000Z`) : null, reviewedBy: question.reviewedBy ?? null };
      let imageKey: string | null = null;
      // ---- figures (the figure builder, 10 Oct 2026): an item with a `figure` spec is drawn in English and in
      // each translated language and stored as PNG (scripts/quiz-gen/figures/attach.ts); a figure that cannot be
      // drawn throws and the import stops. The stored files are kept when the spec and renderer are unchanged.
      const drawnFigure = question.figure && !question.imageKey ? await prepareFigure(db, current?.id ?? null, question) : null;
      if (drawnFigure) {
        imageKey = drawnFigure.imageKey;
        if (drawnFigure.drawn) figuresDrawn++;
      }
      // ---- end figures ----
      if (question.imageKey) {
        const before = current?.imageKey ?? null;
        imageKey = await storeFigure(question.imageKey, before);
        if (imageKey !== before) figuresStored++;
      } else if (current?.imageKey && !drawnFigure && !current.imageSpec) {
        // figures: a drawn figure's files are the image step's to replace (finishFigure), not deleted here.
        await deleteStoredFile(current.imageKey);
      }
      const data = {
        difficulty: question.difficulty,
        stem,
        choices: JSON.stringify(question.choices),
        answerIndex: question.answerIndex,
        solution: question.solution,
        checkExpr: question.checkExpr ?? null,
        source: topic.source,
        licence: topic.licence,
        reviewedAt: review.reviewedAt,
        reviewedBy: review.reviewedBy,
        imageKey,
        imageAlt: imageKey ? (question.imageAlt ?? null) : null,
      };

      let questionId: string;
      if (current) {
        await db.quizQuestion.update({ where: { id: current.id }, data });
        keep.add(current.id);
        questionsUpdated++;
        questionId = current.id;
      } else {
        const created = await db.quizQuestion.create({
          data: { ...data, topicId: row.id },
          select: { id: true },
        });
        keep.add(created.id);
        questionsWritten++;
        questionId = created.id;
      }

      // Keyed by (question, language), so re-importing an edited Hindi solution
      // updates in place exactly the way the English one does.
      for (const [language, tr] of Object.entries(question.translations ?? {})) {
        const payload = {
          stem: tr.stem ?? "",
          choices: tr.choices ? JSON.stringify(tr.choices) : "",
          solution: tr.solution ?? "",
        };
        await db.quizQuestionTranslation.upsert({
          where: { questionId_language: { questionId, language } },
          create: { questionId, language, ...payload },
          update: payload,
        });
        translationsWritten++;
      }
      // figures: the translation rows point at their drawings, and a figure taken off an item takes its files with it.
      // integration (11 Oct 2026): the row as read before the write names the English drawing to retire.
      await finishFigure(db, questionId, question, drawnFigure, current ? { imageKey: current.imageKey, imageSpec: current.imageSpec } : null);
    }

    // A question deleted from the file is deleted from the bank. Its responses
    // cascade away with it — which is the honest outcome, because a child's
    // answer to a question that no longer exists cannot be scored or shown.
    // Only a question the FILES wrote can be orphaned by them. One typed in by the content team or
    // written by a teacher and added to the bank (gigs) was never in a file, and an import that
    // deleted it would take a teacher's paid work out of the bank without a word.
    const orphans = existing.filter((q) => !keep.has(q.id) && !AUTHORED_IN_THE_APP.has(q.source));
    if (orphans.length) {
      for (const q of orphans) if (q.imageKey) await deleteStoredFile(q.imageKey);
      await db.quizQuestion.deleteMany({ where: { id: { in: orphans.map((q) => q.id) } } });
      questionsRemoved += orphans.length;
    }
  }

  console.log(
    `\nImported ${topicsWritten} topics — ${questionsWritten} new, ${questionsUpdated} updated, ${questionsRemoved} removed, ${translationsWritten} translations${figuresStored ? `, ${figuresStored} figures stored` : ""}${figuresDrawn ? `, ${figuresDrawn} figures drawn` : ""}.\n`,
  );
  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
