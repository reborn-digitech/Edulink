-- AlterTable
ALTER TABLE "School" ADD COLUMN     "msgEventsJson" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "msgMonthlyCap" INTEGER NOT NULL DEFAULT 2000,
ADD COLUMN     "msgSmsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "msgWhatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OutboundMessage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT,
    "to" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "varsJson" TEXT NOT NULL DEFAULT '{}',
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "skipReason" TEXT,
    "providerSid" TEXT,
    "providerStatus" TEXT,
    "error" TEXT,
    "segments" INTEGER NOT NULL DEFAULT 1,
    "broadcastId" TEXT,
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "OutboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broadcast" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channelsJson" TEXT NOT NULL DEFAULT '[]',
    "audienceJson" TEXT NOT NULL,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "queued" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "Broadcast_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutboundMessage_providerSid_key" ON "OutboundMessage"("providerSid");

-- CreateIndex
CREATE INDEX "OutboundMessage_schoolId_createdAt_idx" ON "OutboundMessage"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboundMessage_schoolId_status_idx" ON "OutboundMessage"("schoolId", "status");

-- CreateIndex
CREATE INDEX "OutboundMessage_broadcastId_idx" ON "OutboundMessage"("broadcastId");

-- CreateIndex
CREATE INDEX "OutboundMessage_userId_createdAt_idx" ON "OutboundMessage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Broadcast_schoolId_createdAt_idx" ON "Broadcast"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "Broadcast_authorUserId_idx" ON "Broadcast"("authorUserId");

-- AddForeignKey
ALTER TABLE "OutboundMessage" ADD CONSTRAINT "OutboundMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessage" ADD CONSTRAINT "OutboundMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundMessage" ADD CONSTRAINT "OutboundMessage_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "Broadcast"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broadcast" ADD CONSTRAINT "Broadcast_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
