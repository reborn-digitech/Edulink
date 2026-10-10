-- AlterTable
ALTER TABLE "QuizTopic" ADD COLUMN     "board" TEXT;

-- quiz-board (11 October 2026): the one-off backfill of the rows already there. The authored bank's
-- chapters were written against the NCERT syllabus (the owner); the generator's Balbharati chapter
-- carries the board-prefixed slug quiz-gen gave it; the placement banks (APTITUDE, REASONING, CODING)
-- follow no school book and stay null, as do the ZZ test chapters. scripts/import-quiz.ts writes NCERT on
-- every authored topic it loads and scripts/quiz-queue.ts writes a batch's own board from now on.
UPDATE "QuizTopic" SET "board" = 'BALBHARATI' WHERE "slug" LIKE 'balbharati-%';
UPDATE "QuizTopic" SET "board" = 'NCERT'
  WHERE "board" IS NULL
    AND "slug" NOT LIKE 'zz-%'
    AND "subject" NOT IN ('APTITUDE', 'REASONING', 'CODING');
-- The review queue's per-item board, written from the files before the board was a code ("Balbharati").
UPDATE "QuizQuestion" SET "generatedBoard" = 'BALBHARATI' WHERE lower("generatedBoard") = 'balbharati';
UPDATE "QuizQuestion" SET "generatedBoard" = 'NCERT' WHERE lower("generatedBoard") = 'ncert';
