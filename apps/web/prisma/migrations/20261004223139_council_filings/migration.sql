-- AlterTable
ALTER TABLE "CollegeFiling" ADD COLUMN     "departmentId" TEXT;

-- CreateTable
CREATE TABLE "FilingWorksheet" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "departmentId" TEXT NOT NULL DEFAULT '',
    "itemsJson" TEXT NOT NULL DEFAULT '{}',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilingWorksheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FilingWorksheet_schoolId_kind_year_departmentId_key" ON "FilingWorksheet"("schoolId", "kind", "year", "departmentId");

-- AddForeignKey
ALTER TABLE "FilingWorksheet" ADD CONSTRAINT "FilingWorksheet_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
