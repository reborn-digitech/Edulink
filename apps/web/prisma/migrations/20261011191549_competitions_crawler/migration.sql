-- CreateTable
CREATE TABLE "CompetitionSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rootUrl" TEXT NOT NULL,
    "organiser" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "official" BOOLEAN NOT NULL DEFAULT true,
    "addedByUserId" TEXT,
    "addedByRole" TEXT NOT NULL,
    "removedAt" TIMESTAMP(3),
    "removedByUserId" TEXT,
    "lastCrawledAt" TIMESTAMP(3),
    "lastResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitionSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionCrawlPage" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "etag" TEXT,
    "lastModified" TEXT,
    "sha256" TEXT,
    "status" INTEGER NOT NULL DEFAULT 0,
    "contentType" TEXT,
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "refused" TEXT,
    "fetchedAt" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionCrawlPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionCrawl" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "pageHash" TEXT NOT NULL,
    "crawledAt" TIMESTAMP(3) NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extracted" JSONB NOT NULL,
    "year" INTEGER,
    "matchedExisting" BOOLEAN NOT NULL DEFAULT false,
    "changedSinceReview" BOOLEAN NOT NULL DEFAULT false,
    "diff" JSONB,
    "changedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "dismissedReason" TEXT,
    "dismissedByUserId" TEXT,
    "dismissedPageHash" TEXT,

    CONSTRAINT "CompetitionCrawl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionCrawlJob" (
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

    CONSTRAINT "CompetitionCrawlJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionSource_rootUrl_key" ON "CompetitionSource"("rootUrl");

-- CreateIndex
CREATE INDEX "CompetitionSource_enabled_removedAt_idx" ON "CompetitionSource"("enabled", "removedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionCrawlPage_url_key" ON "CompetitionCrawlPage"("url");

-- CreateIndex
CREATE INDEX "CompetitionCrawlPage_sourceId_idx" ON "CompetitionCrawlPage"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionCrawl_competitionId_key" ON "CompetitionCrawl"("competitionId");

-- CreateIndex
CREATE INDEX "CompetitionCrawl_sourceId_idx" ON "CompetitionCrawl"("sourceId");

-- CreateIndex
CREATE INDEX "CompetitionCrawl_changedSinceReview_idx" ON "CompetitionCrawl"("changedSinceReview");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionCrawlJob_active_key" ON "CompetitionCrawlJob"("active");

-- CreateIndex
CREATE INDEX "CompetitionCrawlJob_createdAt_idx" ON "CompetitionCrawlJob"("createdAt");

-- AddForeignKey
ALTER TABLE "CompetitionCrawlPage" ADD CONSTRAINT "CompetitionCrawlPage_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CompetitionSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionCrawl" ADD CONSTRAINT "CompetitionCrawl_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionCrawl" ADD CONSTRAINT "CompetitionCrawl_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CompetitionSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
