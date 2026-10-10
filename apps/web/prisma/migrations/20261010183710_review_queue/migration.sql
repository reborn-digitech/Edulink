-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "discardReason" TEXT,
ADD COLUMN     "discardedAt" TIMESTAMP(3),
ADD COLUMN     "editedAfterSolvingAt" TIMESTAMP(3),
ADD COLUMN     "generated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "generatedBoard" TEXT,
ADD COLUMN     "generation" TEXT;

-- CreateTable
CREATE TABLE "QuizReviewStamp" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "language" TEXT,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "before" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizReviewStamp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizReviewStamp_questionId_at_idx" ON "QuizReviewStamp"("questionId", "at");

-- CreateIndex
CREATE INDEX "QuizReviewStamp_reviewerUserId_at_idx" ON "QuizReviewStamp"("reviewerUserId", "at");

-- CreateIndex
CREATE INDEX "QuizQuestion_generated_reviewedAt_discardedAt_idx" ON "QuizQuestion"("generated", "reviewedAt", "discardedAt");

-- AddForeignKey
ALTER TABLE "QuizReviewStamp" ADD CONSTRAINT "QuizReviewStamp_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
