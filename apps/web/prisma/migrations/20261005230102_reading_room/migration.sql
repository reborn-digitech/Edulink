-- CreateTable
CREATE TABLE "ReadingRoomVisit" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "inAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outAt" TIMESTAMP(3),
    "inByUserId" TEXT,
    "outByUserId" TEXT,

    CONSTRAINT "ReadingRoomVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingRoomVisit_schoolId_dayKey_idx" ON "ReadingRoomVisit"("schoolId", "dayKey");

-- CreateIndex
CREATE INDEX "ReadingRoomVisit_membershipId_outAt_idx" ON "ReadingRoomVisit"("membershipId", "outAt");

-- AddForeignKey
ALTER TABLE "ReadingRoomVisit" ADD CONSTRAINT "ReadingRoomVisit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingRoomVisit" ADD CONSTRAINT "ReadingRoomVisit_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
