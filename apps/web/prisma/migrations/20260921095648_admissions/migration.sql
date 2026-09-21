-- CreateTable
CREATE TABLE "AdmissionCycle" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradesJson" TEXT NOT NULL DEFAULT '[]',
    "documentsJson" TEXT NOT NULL DEFAULT '[]',
    "testRequired" BOOLEAN NOT NULL DEFAULT false,
    "notice" TEXT NOT NULL DEFAULT '',
    "feeStructureId" TEXT,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "serial" TEXT NOT NULL,
    "applicantUserId" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "applicantEmail" TEXT,
    "relation" TEXT NOT NULL DEFAULT 'PARENT',
    "childName" TEXT NOT NULL,
    "childBirthdate" TIMESTAMP(3),
    "gradeApplied" TEXT NOT NULL,
    "previousSchool" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "documentsJson" TEXT NOT NULL DEFAULT '[]',
    "documentsVerifiedAt" TIMESTAMP(3),
    "testSlotId" TEXT,
    "testScore" TEXT,
    "testNote" TEXT,
    "testedAt" TIMESTAMP(3),
    "offeredAt" TIMESTAMP(3),
    "offerExpiresAt" TIMESTAMP(3),
    "offerNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "admittedMembershipId" TEXT,
    "admittedAt" TIMESTAMP(3),
    "feeStructureId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntranceSlot" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntranceSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdmissionCycle_schoolId_status_idx" ON "AdmissionCycle"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionCycle_schoolId_academicYearId_name_key" ON "AdmissionCycle"("schoolId", "academicYearId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Application_admittedMembershipId_key" ON "Application"("admittedMembershipId");

-- CreateIndex
CREATE INDEX "Application_schoolId_cycleId_status_idx" ON "Application"("schoolId", "cycleId", "status");

-- CreateIndex
CREATE INDEX "Application_applicantUserId_idx" ON "Application"("applicantUserId");

-- CreateIndex
CREATE INDEX "Application_testSlotId_idx" ON "Application"("testSlotId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_cycleId_number_key" ON "Application"("cycleId", "number");

-- CreateIndex
CREATE INDEX "EntranceSlot_schoolId_cycleId_startsAt_idx" ON "EntranceSlot"("schoolId", "cycleId", "startsAt");

-- AddForeignKey
ALTER TABLE "AdmissionCycle" ADD CONSTRAINT "AdmissionCycle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionCycle" ADD CONSTRAINT "AdmissionCycle_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionCycle" ADD CONSTRAINT "AdmissionCycle_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AdmissionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_testSlotId_fkey" FOREIGN KEY ("testSlotId") REFERENCES "EntranceSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_admittedMembershipId_fkey" FOREIGN KEY ("admittedMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntranceSlot" ADD CONSTRAINT "EntranceSlot_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntranceSlot" ADD CONSTRAINT "EntranceSlot_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AdmissionCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
