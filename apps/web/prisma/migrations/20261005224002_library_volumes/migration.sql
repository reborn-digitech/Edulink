-- G4-21 (risks batch, 5 Oct 2026): a periodical's subscription and the volumes and issues received.
ALTER TABLE "LibraryTitle" ADD COLUMN "frequency" TEXT,
ADD COLUMN "subscriptionFrom" TEXT,
ADD COLUMN "subscriptionUntil" TEXT;

-- CreateTable
CREATE TABLE "LibraryVolume" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "volume" TEXT NOT NULL,
    "issue" TEXT NOT NULL DEFAULT '',
    "receivedOn" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryVolume_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryVolume_schoolId_titleId_idx" ON "LibraryVolume"("schoolId", "titleId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryVolume_titleId_volume_issue_key" ON "LibraryVolume"("titleId", "volume", "issue");

-- AddForeignKey
ALTER TABLE "LibraryVolume" ADD CONSTRAINT "LibraryVolume_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryVolume" ADD CONSTRAINT "LibraryVolume_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "LibraryTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
