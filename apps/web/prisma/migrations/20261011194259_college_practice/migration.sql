-- AlterTable
ALTER TABLE "QuizTopic" ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'SCHOOL',
ADD COLUMN     "programme" TEXT,
ADD COLUMN     "streams" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "yearOrSemester" TEXT;

-- CreateIndex
CREATE INDEX "QuizTopic_audience_idx" ON "QuizTopic"("audience");

-- college-content (12 Oct 2026): the backfill. Every chapter already in the bank is the school bank's
-- (the column's default, SCHOOL), except the placement banks (aptitude, reasoning and coding, at the
-- college level, class 13): they are a college's, for every stream (no stream named).
UPDATE "QuizTopic" SET "audience" = 'COLLEGE', "streams" = ARRAY[]::TEXT[]
 WHERE "subject" IN ('APTITUDE', 'REASONING', 'CODING') AND "classLevel" >= 13;
