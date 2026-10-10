-- CreateTable
CREATE TABLE "LeavingSettlement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "decidedByUserId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linesJson" TEXT NOT NULL DEFAULT '[]',
    "itemsJson" TEXT NOT NULL DEFAULT '[]',
    "cancelledJson" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "LeavingSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeavingSettlement_studentMembershipId_key" ON "LeavingSettlement"("studentMembershipId");

-- CreateIndex
CREATE INDEX "LeavingSettlement_schoolId_idx" ON "LeavingSettlement"("schoolId");

-- AddForeignKey
ALTER TABLE "LeavingSettlement" ADD CONSTRAINT "LeavingSettlement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavingSettlement" ADD CONSTRAINT "LeavingSettlement_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
