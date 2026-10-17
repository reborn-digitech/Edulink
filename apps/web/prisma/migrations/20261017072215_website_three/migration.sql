-- AlterTable
ALTER TABLE "FacultyPublicProfile" ADD COLUMN     "publicPhotoFileId" TEXT;

-- AlterTable
ALTER TABLE "FacultyRecord" ADD COLUMN     "publicPhotoConsentAt" TIMESTAMP(3),
ADD COLUMN     "publicPhotoFileId" TEXT;

-- AlterTable
ALTER TABLE "OutboundEmail" ADD COLUMN     "headersJson" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "replyTo" TEXT;

-- AlterTable
ALTER TABLE "SchoolSite" ADD COLUMN     "draftVersion" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SchoolSiteEnquiry" ADD COLUMN     "repliesJson" TEXT NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX "FacultyPublicProfile_publicPhotoFileId_idx" ON "FacultyPublicProfile"("publicPhotoFileId");

-- CreateIndex
CREATE INDEX "FacultyRecord_publicPhotoFileId_idx" ON "FacultyRecord"("publicPhotoFileId");

-- website-three (17 Oct 2026): an enquiry answered before the thread was kept carries its one reply as the thread's first.
-- "repliedAt" is a timestamp without zone holding UTC (Prisma's DateTime), so it is formatted as it stands.
UPDATE "SchoolSiteEnquiry"
SET "repliesJson" = json_build_array(json_build_object('text', "replyText", 'at', to_char("repliedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'byUserId', "repliedByUserId", 'messageId', NULL))::text
WHERE "replyText" <> '' AND "repliedAt" IS NOT NULL AND "repliesJson" = '[]';
