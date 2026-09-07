-- AlterTable
ALTER TABLE "ConversationMessage" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMessage_conversationId_clientId_key" ON "ConversationMessage"("conversationId", "clientId");

