-- AlterTable
ALTER TABLE "School" ADD COLUMN     "teachingDays" TEXT NOT NULL DEFAULT '1,2,3,4,5,6';

-- CreateTable
CREATE TABLE "Substitution" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "absentMembershipId" TEXT NOT NULL,
    "substituteMembershipId" TEXT NOT NULL,
    "note" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Substitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Substitution_schoolId_dateKey_idx" ON "Substitution"("schoolId", "dateKey");

-- CreateIndex
CREATE INDEX "Substitution_substituteMembershipId_dateKey_idx" ON "Substitution"("substituteMembershipId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "Substitution_slotId_dateKey_key" ON "Substitution"("slotId", "dateKey");

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "TimetableSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_absentMembershipId_fkey" FOREIGN KEY ("absentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_substituteMembershipId_fkey" FOREIGN KEY ("substituteMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
