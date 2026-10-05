-- AlterTable
ALTER TABLE "CollegeApplication" ADD COLUMN     "refundAskPaise" INTEGER,
ADD COLUMN     "refundAskReason" TEXT,
ADD COLUMN     "refundAskStatus" TEXT,
ADD COLUMN     "refundAskedAt" TIMESTAMP(3),
ADD COLUMN     "refundAskedByUserId" TEXT,
ADD COLUMN     "refundDecidedAt" TIMESTAMP(3),
ADD COLUMN     "refundDecidedByUserId" TEXT,
ADD COLUMN     "refundDecisionNote" TEXT,
ADD COLUMN     "refundSlabPaise" INTEGER;

-- CreateTable
CREATE TABLE "HostelExpulsion" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "incidentId" TEXT,
    "effectiveOn" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASKED',
    "proposedByUserId" TEXT NOT NULL,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "openKey" TEXT,

    CONSTRAINT "HostelExpulsion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HostelExpulsion_openKey_key" ON "HostelExpulsion"("openKey");

-- CreateIndex
CREATE INDEX "HostelExpulsion_schoolId_status_idx" ON "HostelExpulsion"("schoolId", "status");

-- CreateIndex
CREATE INDEX "HostelExpulsion_allotmentId_idx" ON "HostelExpulsion"("allotmentId");

-- AddForeignKey
ALTER TABLE "HostelExpulsion" ADD CONSTRAINT "HostelExpulsion_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelExpulsion" ADD CONSTRAINT "HostelExpulsion_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "HostelAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
