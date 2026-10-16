-- website-two (16 Oct 2026): the website editor's second pass. Columns on the enquiries (the inbox's state, the
-- reply, the form's optional fields), the pages besides the home page on each rendered version, and three tables:
-- review links to the draft (SchoolSiteShare), page-view counts (SchoolSiteVisit) and files uploaded for the site
-- (SchoolSiteFile). Nothing is dropped or renamed; existing rows take the defaults.

-- AlterTable
ALTER TABLE "SchoolSiteEnquiry" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "repliedByUserId" TEXT,
ADD COLUMN     "replyText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN     "wantsVisit" BOOLEAN NOT NULL DEFAULT false;

-- An enquiry taken before the inbox was last touched when it came in, or when the office marked it read.
UPDATE "SchoolSiteEnquiry" SET "lastActivityAt" = GREATEST("createdAt", COALESCE("readAt", "createdAt"));

-- AlterTable
ALTER TABLE "SchoolSiteVersion" ADD COLUMN     "pagesHtml" TEXT NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "SchoolSiteShare" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "SchoolSiteShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSiteVisit" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SchoolSiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSiteFile" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolSiteFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSiteShare_tokenHash_key" ON "SchoolSiteShare"("tokenHash");

-- CreateIndex
CREATE INDEX "SchoolSiteShare_schoolId_createdAt_idx" ON "SchoolSiteShare"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSiteVisit_schoolId_dateKey_page_key" ON "SchoolSiteVisit"("schoolId", "dateKey", "page");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSiteFile_fileId_key" ON "SchoolSiteFile"("fileId");

-- CreateIndex
CREATE INDEX "SchoolSiteFile_schoolId_createdAt_idx" ON "SchoolSiteFile"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "SchoolSiteEnquiry_schoolId_status_idx" ON "SchoolSiteEnquiry"("schoolId", "status");

-- CreateIndex
CREATE INDEX "SchoolSiteEnquiry_lastActivityAt_idx" ON "SchoolSiteEnquiry"("lastActivityAt");

-- AddForeignKey
ALTER TABLE "SchoolSiteShare" ADD CONSTRAINT "SchoolSiteShare_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSiteVisit" ADD CONSTRAINT "SchoolSiteVisit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSiteFile" ADD CONSTRAINT "SchoolSiteFile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
