-- AlterTable
ALTER TABLE "HelpEntry" ADD COLUMN     "renderingId" TEXT;

-- CreateTable
CREATE TABLE "HelpRendering" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "modelText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNREVIEWED',
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpRendering_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HelpRendering_language_status_idx" ON "HelpRendering"("language", "status");

-- CreateIndex
CREATE UNIQUE INDEX "HelpRendering_sourceKey_language_key" ON "HelpRendering"("sourceKey", "language");

-- CreateIndex
CREATE INDEX "HelpEntry_renderingId_idx" ON "HelpEntry"("renderingId");
