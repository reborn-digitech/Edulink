-- AlterTable
ALTER TABLE "ReportCard" ADD COLUMN     "gradePointsMilli" INTEGER,
ADD COLUMN     "layout" TEXT,
ADD COLUMN     "overallLetter" TEXT,
ADD COLUMN     "scale" TEXT,
ADD COLUMN     "subjects" TEXT;

-- AlterTable
ALTER TABLE "ReportCardItem" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'SCHOLASTIC',
ADD COLUMN     "letter" TEXT,
ADD COLUMN     "subject" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "reportCardConfig" TEXT;

-- AlterTable
ALTER TABLE "Term" ADD COLUMN     "weightPercent" INTEGER;
