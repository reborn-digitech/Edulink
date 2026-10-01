-- AlterTable: an expert's KYC standing and documents, and their calendar feed token.
ALTER TABLE "ExpertProfile" ADD COLUMN     "kycStatus" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "kycNote" TEXT,
ADD COLUMN     "kycSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "kycDecidedAt" TIMESTAMP(3),
ADD COLUMN     "kycDocumentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "calendarToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ExpertProfile_calendarToken_key" ON "ExpertProfile"("calendarToken");
