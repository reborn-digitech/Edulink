-- quiz-publish-jobs (11 October 2026): the generated bank is published without review and taken down
-- afterwards; generation is started and stopped from the bank desk (QuizGenJob).
--
-- The review queue's discard becomes the desk's take-down: the two columns are RENAMED, so a discarded
-- item (none on the day this was written) stays off the bank as a taken-down one.
DROP INDEX "QuizQuestion_generated_reviewedAt_discardedAt_idx";

ALTER TABLE "QuizQuestion" RENAME COLUMN "discardedAt" TO "takenDownAt";
ALTER TABLE "QuizQuestion" RENAME COLUMN "discardReason" TO "takenDownReason";
ALTER TABLE "QuizQuestion" ADD COLUMN "takenDownBy" TEXT,
ADD COLUMN "needsFigure" BOOLEAN NOT NULL DEFAULT false;

-- A generated item whose figure must be drawn before a pupil sees it: the loader's stored copy of the
-- generation JSON's needsFigure (an item already loaded keeps its hold until its figure is stored).
UPDATE "QuizQuestion" SET "needsFigure" = true
WHERE "generated" = true AND "generation" IS NOT NULL AND ("generation"::jsonb ->> 'needsFigure') = 'true';

-- CreateTable
CREATE TABLE "QuizGenJob" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'QUEUED',
    "active" BOOLEAN,
    "request" JSONB NOT NULL,
    "progress" JSONB,
    "pid" INTEGER,
    "startedServers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedByUserId" TEXT NOT NULL,
    "startedByRole" TEXT NOT NULL,
    "stopRequestedBy" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),

    CONSTRAINT "QuizGenJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizGenJob_active_key" ON "QuizGenJob"("active");

-- CreateIndex
CREATE INDEX "QuizGenJob_createdAt_idx" ON "QuizGenJob"("createdAt");

-- CreateIndex
CREATE INDEX "QuizQuestion_generated_takenDownAt_idx" ON "QuizQuestion"("generated", "takenDownAt");
