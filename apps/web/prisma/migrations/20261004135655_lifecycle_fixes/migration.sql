-- AlterTable
ALTER TABLE "CertificateRequest" ADD COLUMN     "feeDemandId" TEXT,
ADD COLUMN     "feePaise" INTEGER;

-- AlterTable
ALTER TABLE "CollegeApplication" ADD COLUMN     "supernumeraryAt" TIMESTAMP(3),
ADD COLUMN     "supernumeraryByUserId" TEXT,
ADD COLUMN     "supernumeraryReason" TEXT;
