-- AlterTable
ALTER TABLE "School" ADD COLUMN     "staffCheckInMinute" INTEGER NOT NULL DEFAULT 540,
ADD COLUMN     "staffLateGraceMinutes" INTEGER NOT NULL DEFAULT 15;

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'OFFICE',
    "checkedInAt" TIMESTAMP(3),
    "note" TEXT,
    "markedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffAttendance_schoolId_dateKey_idx" ON "StaffAttendance"("schoolId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendance_membershipId_dateKey_key" ON "StaffAttendance"("membershipId", "dateKey");

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
