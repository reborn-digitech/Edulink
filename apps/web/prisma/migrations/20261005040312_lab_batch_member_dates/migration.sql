-- S4B-0 (5 Oct 2026): a lab batch's membership is dated, so a re-split or a move leaves a past LAB lecture's roster as
-- it was. Existing rows hold since the batch began ("") and are still open (null).

-- DropIndex
DROP INDEX "LabBatchMember_divisionId_studentMembershipId_key";

-- AlterTable
ALTER TABLE "LabBatchMember" ADD COLUMN     "fromKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "untilKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LabBatchMember_divisionId_studentMembershipId_fromKey_key" ON "LabBatchMember"("divisionId", "studentMembershipId", "fromKey");
