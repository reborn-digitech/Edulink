-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "hiReviewedAt" TIMESTAMP(3),
ADD COLUMN     "hiReviewedBy" TEXT,
ADD COLUMN     "mrReviewedAt" TIMESTAMP(3),
ADD COLUMN     "mrReviewedBy" TEXT;

-- AlterTable
ALTER TABLE "QuizResponse" ADD COLUMN     "gradeLevel" INTEGER,
ADD COLUMN     "seconds" INTEGER;

-- CreateTable
CREATE TABLE "QuestionStat" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL DEFAULT 0,
    "asked" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "timed" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformTakedown" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "postSchoolId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "takenDownByUserId" TEXT NOT NULL,
    "takenDownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),
    "restoredByUserId" TEXT,

    CONSTRAINT "PlatformTakedown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionStat_questionId_grade_key" ON "QuestionStat"("questionId", "grade");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformTakedown_postId_key" ON "PlatformTakedown"("postId");

-- CreateIndex
CREATE INDEX "PlatformTakedown_takenDownAt_idx" ON "PlatformTakedown"("takenDownAt");

-- AddForeignKey
ALTER TABLE "QuestionStat" ADD CONSTRAINT "QuestionStat_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformTakedown" ADD CONSTRAINT "PlatformTakedown_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
