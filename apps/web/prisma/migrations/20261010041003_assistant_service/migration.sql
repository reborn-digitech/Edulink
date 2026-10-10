-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "assistantAnswers" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "helplineText" TEXT;

-- CreateTable
CREATE TABLE "AssistantConversation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokens" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AssistantConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textForModel" TEXT,
    "citationsJson" TEXT NOT NULL DEFAULT '[]',
    "verdict" TEXT,
    "mode" TEXT,
    "hint" BOOLEAN NOT NULL DEFAULT false,
    "matchedAssignmentId" TEXT,
    "helpful" BOOLEAN,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantUsage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "questions" INTEGER NOT NULL DEFAULT 0,
    "answered" INTEGER NOT NULL DEFAULT 0,
    "hints" INTEGER NOT NULL DEFAULT 0,
    "refused" INTEGER NOT NULL DEFAULT 0,
    "counsellorRoutes" INTEGER NOT NULL DEFAULT 0,
    "modelCalls" INTEGER NOT NULL DEFAULT 0,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "helpful" INTEGER NOT NULL DEFAULT 0,
    "notHelpful" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssistantChildSetting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "changedByUserId" TEXT,
    "changedAt" TIMESTAMP(3),
    "noticeSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssistantChildSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssistantConversation_schoolId_userId_lastAt_idx" ON "AssistantConversation"("schoolId", "userId", "lastAt");

-- CreateIndex
CREATE INDEX "AssistantConversation_lastAt_idx" ON "AssistantConversation"("lastAt");

-- CreateIndex
CREATE INDEX "AssistantMessage_conversationId_createdAt_idx" ON "AssistantMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "AssistantMessage_schoolId_idx" ON "AssistantMessage"("schoolId");

-- CreateIndex
CREATE INDEX "AssistantUsage_schoolId_dayKey_idx" ON "AssistantUsage"("schoolId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantUsage_schoolId_userId_dayKey_key" ON "AssistantUsage"("schoolId", "userId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "AssistantChildSetting_studentMembershipId_key" ON "AssistantChildSetting"("studentMembershipId");

-- CreateIndex
CREATE INDEX "AssistantChildSetting_schoolId_idx" ON "AssistantChildSetting"("schoolId");

-- AddForeignKey
ALTER TABLE "AssistantConversation" ADD CONSTRAINT "AssistantConversation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AssistantConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantMessage" ADD CONSTRAINT "AssistantMessage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantUsage" ADD CONSTRAINT "AssistantUsage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssistantChildSetting" ADD CONSTRAINT "AssistantChildSetting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- THE ASSISTANT IS ON FOR EVERY TENANT (the owner's decision; decision 0005): every school and
-- college that exists today gets the ASSISTANT module row, as writeDefaultModules gives a new one.
-- enabledByUserId stays null: the platform switched it on, not anybody at the school.
INSERT INTO "SchoolModule" ("id", "schoolId", "module", "enabledAt")
SELECT 'asst' || substr(md5(s."id" || 'ASSISTANT'), 1, 21), s."id", 'ASSISTANT', CURRENT_TIMESTAMP
  FROM "School" s
 WHERE NOT EXISTS (SELECT 1 FROM "SchoolModule" m WHERE m."schoolId" = s."id" AND m."module" = 'ASSISTANT');
