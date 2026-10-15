-- CreateTable
CREATE TABLE "SocialConnection" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'META',
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "igUserId" TEXT,
    "igUsername" TEXT,
    "pageTokenSealed" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "connectedByUserId" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "fileId" TEXT,
    "pictureToken" TEXT,
    "remoteId" TEXT,
    "remoteUrl" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queuedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialConnection_schoolId_key" ON "SocialConnection"("schoolId");

-- CreateIndex
CREATE INDEX "SocialPost_schoolId_postId_idx" ON "SocialPost"("schoolId", "postId");

-- CreateIndex
CREATE INDEX "SocialPost_status_nextAttemptAt_idx" ON "SocialPost"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "SocialPost_fileId_idx" ON "SocialPost"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_postId_network_key" ON "SocialPost"("postId", "network");

-- AddForeignKey
ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
