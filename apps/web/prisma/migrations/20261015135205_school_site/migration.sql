-- CreateTable
CREATE TABLE "SchoolSite" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "publishedVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "SchoolSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSiteVersion" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "schoolSlug" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL DEFAULT '{}',
    "html" TEXT NOT NULL DEFAULT '{}',
    "imageFileIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "numbersHash" TEXT NOT NULL DEFAULT '',
    "renderedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "numbersAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedByUserId" TEXT,
    "liveAt" TIMESTAMP(3),

    CONSTRAINT "SchoolSiteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSiteEnquiry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "readByUserId" TEXT,

    CONSTRAINT "SchoolSiteEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSite_schoolId_key" ON "SchoolSite"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolSiteVersion_schoolId_renderedAt_idx" ON "SchoolSiteVersion"("schoolId", "renderedAt");

-- CreateIndex
CREATE INDEX "SchoolSiteVersion_schoolSlug_idx" ON "SchoolSiteVersion"("schoolSlug");

-- CreateIndex
CREATE INDEX "SchoolSiteEnquiry_schoolId_createdAt_idx" ON "SchoolSiteEnquiry"("schoolId", "createdAt");

-- AddForeignKey
ALTER TABLE "SchoolSite" ADD CONSTRAINT "SchoolSite_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSiteVersion" ADD CONSTRAINT "SchoolSiteVersion_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSiteVersion" ADD CONSTRAINT "SchoolSiteVersion_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SchoolSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSiteEnquiry" ADD CONSTRAINT "SchoolSiteEnquiry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One live version per school (src/lib/site-publish.ts sets liveAt on the version the site serves and clears it
-- on the one it replaces, in one transaction): a second live row is refused by the database, not only the code.
CREATE UNIQUE INDEX "SchoolSiteVersion_one_live_per_school" ON "SchoolSiteVersion"("schoolId") WHERE "liveAt" IS NOT NULL;
