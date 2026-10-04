-- The college office (4 October 2026): admissions from the CET Cell rounds, a
-- student's seat in a programme (ProgrammeEnrolment, read by academics),
-- scholarship claims against the fee ledger, no-dues clearances, the office's
-- concession limit, and the college settings of the library, hostel and
-- transport as columns with defaults. Nothing a school sees changes.
-- AlterTable
ALTER TABLE "FeeConcession" ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByUserId" TEXT,
ADD COLUMN     "authority" TEXT;

-- AlterTable
ALTER TABLE "FeeStructure" ADD COLUMN     "approvalRef" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "lateFeeSlabsJson" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "programmeId" TEXT,
ADD COLUMN     "yearOfStudy" INTEGER;

-- AlterTable
ALTER TABLE "Hostel" ADD COLUMN     "curfewMinute" INTEGER NOT NULL DEFAULT 1290,
ADD COLUMN     "messMonthlyPaise" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nightOutAllowed" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "LibrarySettings" ADD COLUMN     "bookBankExtra" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "collegeStudentLimit" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "collegeStudentLoanDays" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "facultyLimit" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "facultyLoanDays" INTEGER NOT NULL DEFAULT 90;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "audienceTarget" TEXT;

-- AlterTable
ALTER TABLE "PupilRecord" ADD COLUMN     "abcId" TEXT,
ADD COLUMN     "admissionCategory" TEXT,
ADD COLUMN     "admissionQuota" TEXT,
ADD COLUMN     "admissionRoundId" TEXT,
ADD COLUMN     "apaarId" TEXT,
ADD COLUMN     "prn" TEXT,
ADD COLUMN     "yearOfEntry" INTEGER;

-- AlterTable
ALTER TABLE "TransportRoute" ADD COLUMN     "feePerTermPaise" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'FIXED';

-- CreateTable
CREATE TABLE "ProgrammeEnrolment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "yearOfEntry" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "roundId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammeEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionRound" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "programmeId" TEXT,
    "intakeYear" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "seatsJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapAllotment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "cetApplicationId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "programmeCode" TEXT NOT NULL,
    "programmeId" TEXT,
    "category" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "meritNumber" INTEGER,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedByUserId" TEXT,

    CONSTRAINT "CapAllotment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeApplication" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "applicantName" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3),
    "category" TEXT NOT NULL,
    "quota" TEXT NOT NULL,
    "gender" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "capAllotmentId" TEXT,
    "meritRank" INTEGER,
    "documentsJson" TEXT NOT NULL DEFAULT '{}',
    "antiRaggingStudentAt" TIMESTAMP(3),
    "antiRaggingParentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "feeDemandId" TEXT,
    "feeStructureId" TEXT,
    "admittedMembershipId" TEXT,
    "admittedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "refundPaise" INTEGER,
    "refundSlab" TEXT,
    "refundRecordedAt" TIMESTAMP(3),
    "refundReference" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipClaim" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "scheme" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "portalApplicationId" TEXT,
    "appliedAt" TIMESTAMP(3),
    "expectedPaise" INTEGER NOT NULL DEFAULT 0,
    "sanctionedPaise" INTEGER,
    "sanctionedAt" TIMESTAMP(3),
    "disbursedPaise" INTEGER,
    "disbursedAt" TIMESTAMP(3),
    "disbursementRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "documentsJson" TEXT NOT NULL DEFAULT '[]',
    "alumniGiftId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "lapsedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScholarshipClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoDuesClearance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "cycleKey" TEXT NOT NULL DEFAULT '',
    "clearsJson" TEXT NOT NULL DEFAULT '{}',
    "completedAt" TIMESTAMP(3),
    "cautionReturnPaise" INTEGER,
    "cautionReturnRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoDuesClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeOfficeSettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "concessionLimitPaise" INTEGER NOT NULL DEFAULT 500000,
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeOfficeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryEResource" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OTHER',
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryEResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelSquadRound" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "members" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "loggedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelSquadRound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgrammeEnrolment_schoolId_programmeId_yearOfEntry_idx" ON "ProgrammeEnrolment"("schoolId", "programmeId", "yearOfEntry");

-- CreateIndex
CREATE INDEX "ProgrammeEnrolment_roundId_idx" ON "ProgrammeEnrolment"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeEnrolment_studentMembershipId_programmeId_key" ON "ProgrammeEnrolment"("studentMembershipId", "programmeId");

-- CreateIndex
CREATE INDEX "AdmissionRound_schoolId_status_idx" ON "AdmissionRound"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionRound_schoolId_intakeYear_kind_name_key" ON "AdmissionRound"("schoolId", "intakeYear", "kind", "name");

-- CreateIndex
CREATE INDEX "CapAllotment_schoolId_idx" ON "CapAllotment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "CapAllotment_roundId_cetApplicationId_key" ON "CapAllotment"("roundId", "cetApplicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeApplication_admittedMembershipId_key" ON "CollegeApplication"("admittedMembershipId");

-- CreateIndex
CREATE INDEX "CollegeApplication_schoolId_status_idx" ON "CollegeApplication"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeApplication_roundId_number_key" ON "CollegeApplication"("roundId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeApplication_roundId_capAllotmentId_key" ON "CollegeApplication"("roundId", "capAllotmentId");

-- CreateIndex
CREATE INDEX "ScholarshipClaim_schoolId_academicYear_status_idx" ON "ScholarshipClaim"("schoolId", "academicYear", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipClaim_studentMembershipId_scheme_academicYear_key" ON "ScholarshipClaim"("studentMembershipId", "scheme", "academicYear");

-- CreateIndex
CREATE INDEX "NoDuesClearance_schoolId_event_idx" ON "NoDuesClearance"("schoolId", "event");

-- CreateIndex
CREATE UNIQUE INDEX "NoDuesClearance_studentMembershipId_event_cycleKey_key" ON "NoDuesClearance"("studentMembershipId", "event", "cycleKey");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeOfficeSettings_schoolId_key" ON "CollegeOfficeSettings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryEResource_schoolId_name_key" ON "LibraryEResource"("schoolId", "name");

-- CreateIndex
CREATE INDEX "HostelSquadRound_schoolId_at_idx" ON "HostelSquadRound"("schoolId", "at");

-- CreateIndex
CREATE INDEX "HostelSquadRound_hostelId_idx" ON "HostelSquadRound"("hostelId");

-- AddForeignKey
ALTER TABLE "ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeEnrolment" ADD CONSTRAINT "ProgrammeEnrolment_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "AdmissionRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionRound" ADD CONSTRAINT "AdmissionRound_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapAllotment" ADD CONSTRAINT "CapAllotment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapAllotment" ADD CONSTRAINT "CapAllotment_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "AdmissionRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeApplication" ADD CONSTRAINT "CollegeApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeApplication" ADD CONSTRAINT "CollegeApplication_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "AdmissionRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeApplication" ADD CONSTRAINT "CollegeApplication_capAllotmentId_fkey" FOREIGN KEY ("capAllotmentId") REFERENCES "CapAllotment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeApplication" ADD CONSTRAINT "CollegeApplication_admittedMembershipId_fkey" FOREIGN KEY ("admittedMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipClaim" ADD CONSTRAINT "ScholarshipClaim_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipClaim" ADD CONSTRAINT "ScholarshipClaim_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoDuesClearance" ADD CONSTRAINT "NoDuesClearance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoDuesClearance" ADD CONSTRAINT "NoDuesClearance_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeOfficeSettings" ADD CONSTRAINT "CollegeOfficeSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryEResource" ADD CONSTRAINT "LibraryEResource_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelSquadRound" ADD CONSTRAINT "HostelSquadRound_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelSquadRound" ADD CONSTRAINT "HostelSquadRound_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
