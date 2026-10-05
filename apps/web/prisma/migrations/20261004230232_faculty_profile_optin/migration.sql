-- AlterTable
ALTER TABLE "FacultyRecord" ADD COLUMN     "publicProfileAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FacultyPublicProfile" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schoolSlug" TEXT NOT NULL,
    "facultyRecordId" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyPublicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacultyPublicProfile_facultyRecordId_key" ON "FacultyPublicProfile"("facultyRecordId");

-- CreateIndex
CREATE INDEX "FacultyPublicProfile_schoolId_idx" ON "FacultyPublicProfile"("schoolId");

-- CreateIndex
CREATE INDEX "FacultyPublicProfile_schoolSlug_idx" ON "FacultyPublicProfile"("schoolSlug");

-- AddForeignKey
ALTER TABLE "FacultyPublicProfile" ADD CONSTRAINT "FacultyPublicProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyPublicProfile" ADD CONSTRAINT "FacultyPublicProfile_facultyRecordId_fkey" FOREIGN KEY ("facultyRecordId") REFERENCES "FacultyRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
