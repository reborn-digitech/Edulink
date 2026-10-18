-- AlterTable
ALTER TABLE "AssistantMessage" ADD COLUMN     "cachedAnswerId" TEXT,
ADD COLUMN     "gateReasons" TEXT,
ADD COLUMN     "scope" TEXT;

-- AlterTable
ALTER TABLE "AssistantUsage" ADD COLUMN     "standardAnswers" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CachedAnswer" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "citationsJson" TEXT NOT NULL DEFAULT '[]',
    "verdict" TEXT NOT NULL,
    "chip" TEXT,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedByUserId" TEXT,
    "checkedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "CachedAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantGapCount" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantGapCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantGapStem" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "questions" INTEGER NOT NULL,
    "people" INTEGER NOT NULL,
    "fromDay" TEXT NOT NULL,
    "toDay" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantGapStem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantEvalJob" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'QUEUED',
    "active" BOOLEAN,
    "request" JSONB NOT NULL,
    "progress" JSONB,
    "scores" JSONB,
    "gate" BOOLEAN,
    "outDir" TEXT,
    "pid" INTEGER,
    "startedServers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedByUserId" TEXT NOT NULL,
    "stopRequestedBy" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "heartbeatAt" TIMESTAMP(3),

    CONSTRAINT "AssistantEvalJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CachedAnswer_questionKey_language_role_idx" ON "CachedAnswer"("questionKey", "language", "role");

-- CreateIndex
CREATE INDEX "CachedAnswer_createdAt_idx" ON "CachedAnswer"("createdAt");

-- CreateIndex
CREATE INDEX "AssistantGapCount_dayKey_idx" ON "AssistantGapCount"("dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantGapCount_schoolId_dayKey_role_scope_verdict_reason_key" ON "AssistantGapCount"("schoolId", "dayKey", "role", "scope", "verdict", "reason");

-- CreateIndex
CREATE INDEX "AssistantGapStem_questions_idx" ON "AssistantGapStem"("questions");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantEvalJob_active_key" ON "AssistantEvalJob"("active");

-- CreateIndex
CREATE INDEX "AssistantEvalJob_createdAt_idx" ON "AssistantEvalJob"("createdAt");

-- AddForeignKey
ALTER TABLE "AssistantGapCount" ADD CONSTRAINT "AssistantGapCount_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
