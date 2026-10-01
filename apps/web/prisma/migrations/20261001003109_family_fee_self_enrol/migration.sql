-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "selfEnrol" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "pupilFeeViewAge" INTEGER;
