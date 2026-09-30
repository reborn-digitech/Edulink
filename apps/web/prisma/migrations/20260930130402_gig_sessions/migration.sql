-- AlterTable
ALTER TABLE "GigSettings" ADD COLUMN     "expertMonthlyOneToOnes" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "expertQuarterlyWorkshops" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "expertStartOneToOnes" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "expertStartWorkshops" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "freeCancelHours" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "pupilFreeOneToOnes" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "pupilFreeWorkshops" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "teacherMonthlyGuidance" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "workshopMaxSeats" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "teacherGuidanceOn" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "GigSlot" (
    "id" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerKind" TEXT NOT NULL,
    "teacherSchoolId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "seatsTaken" INTEGER NOT NULL DEFAULT 0,
    "pricePaise" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigBooking" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "bookedByUserId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "academicYearId" TEXT,
    "consentAt" TIMESTAMP(3),
    "consentUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    "lateCancel" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "feedback" TEXT,
    "ratedAt" TIMESTAMP(3),
    "remindedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GigBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GigSlot_providerUserId_startsAt_idx" ON "GigSlot"("providerUserId", "startsAt");

-- CreateIndex
CREATE INDEX "GigSlot_startsAt_idx" ON "GigSlot"("startsAt");

-- CreateIndex
CREATE INDEX "GigSlot_teacherSchoolId_startsAt_idx" ON "GigSlot"("teacherSchoolId", "startsAt");

-- CreateIndex
CREATE INDEX "GigBooking_schoolId_studentMembershipId_kind_idx" ON "GigBooking"("schoolId", "studentMembershipId", "kind");

-- CreateIndex
CREATE INDEX "GigBooking_providerUserId_status_idx" ON "GigBooking"("providerUserId", "status");

-- CreateIndex
CREATE INDEX "GigBooking_studentMembershipId_idx" ON "GigBooking"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "GigBooking_slotId_studentMembershipId_key" ON "GigBooking"("slotId", "studentMembershipId");

-- AddForeignKey
ALTER TABLE "GigSlot" ADD CONSTRAINT "GigSlot_providerUserId_fkey" FOREIGN KEY ("providerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigBooking" ADD CONSTRAINT "GigBooking_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigBooking" ADD CONSTRAINT "GigBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "GigSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigBooking" ADD CONSTRAINT "GigBooking_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
