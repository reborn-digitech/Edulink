-- The college admission fee as the offer asked it and as the college received it (4 Oct 2026): recorded, never collected here.
-- AlterTable
ALTER TABLE "CollegeApplication" ADD COLUMN     "admissionFeeMethod" TEXT,
ADD COLUMN     "admissionFeePaidAt" TIMESTAMP(3),
ADD COLUMN     "admissionFeePaise" INTEGER,
ADD COLUMN     "admissionFeeRef" TEXT;
