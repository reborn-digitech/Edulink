-- The entrance and olympiad papers as a style corpus (10 October 2026): a document the tutor never cites, and a chunk's kind (question, questions, answer-key, instructions).
-- AlterTable
ALTER TABLE "ContentChunk" ADD COLUMN     "kind" TEXT;

-- AlterTable
ALTER TABLE "ContentDocument" ADD COLUMN     "styleOnly" BOOLEAN NOT NULL DEFAULT false;
