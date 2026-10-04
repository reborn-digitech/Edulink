-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "sectors" TEXT NOT NULL DEFAULT '[]',
    "pointOfContact" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdBySchoolId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyRecruiter" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "CompanyRecruiter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "byUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "packageRupees" INTEGER NOT NULL,
    "bond" TEXT NOT NULL DEFAULT '',
    "locations" TEXT NOT NULL DEFAULT '',
    "eligibilityAsked" TEXT NOT NULL DEFAULT '{}',
    "rounds" TEXT NOT NULL DEFAULT '[]',
    "datesProposed" TEXT NOT NULL DEFAULT '',
    "targetSchoolIds" TEXT NOT NULL DEFAULT '[]',
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTenantLink" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstVisitYear" INTEGER,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyTenantLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementProfile" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "certifications" TEXT NOT NULL DEFAULT '[]',
    "projects" TEXT NOT NULL DEFAULT '[]',
    "consentAt" TIMESTAMP(3),
    "optedOut" BOOLEAN NOT NULL DEFAULT false,
    "dreamFlag" BOOLEAN NOT NULL DEFAULT false,
    "dreamByUserId" TEXT,
    "higherStudies" BOOLEAN NOT NULL DEFAULT false,
    "entrepreneur" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Drive" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "requirementId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jd" TEXT NOT NULL DEFAULT '',
    "packageMinRupees" INTEGER NOT NULL,
    "packageMaxRupees" INTEGER NOT NULL,
    "bond" TEXT NOT NULL DEFAULT '',
    "rounds" TEXT NOT NULL DEFAULT '[]',
    "schedule" TEXT NOT NULL DEFAULT '[]',
    "venues" TEXT NOT NULL DEFAULT '',
    "eligibilityRule" TEXT NOT NULL DEFAULT '{}',
    "poolSchoolIds" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "invitedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "recruiterRating" INTEGER,
    "recruiterFeedback" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Drive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriveApplication" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "studentUserId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "recordJson" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "DriveApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoundResult" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "feedback" TEXT,
    "feedbackShared" BOOLEAN NOT NULL DEFAULT false,
    "byUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoundResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "driveId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "packageRupees" INTEGER NOT NULL,
    "letterFileId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "dreamException" BOOLEAN NOT NULL DEFAULT false,
    "byUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Internship" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "companyId" TEXT,
    "companyName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fromKey" TEXT NOT NULL,
    "toKey" TEXT NOT NULL,
    "hours" INTEGER NOT NULL,
    "credits" INTEGER,
    "windowSemester" INTEGER NOT NULL,
    "supervisorName" TEXT NOT NULL,
    "facultyMembershipId" TEXT,
    "diary" TEXT NOT NULL DEFAULT '[]',
    "reportFileId" TEXT,
    "industryGrade" TEXT,
    "facultyVisitAt" TIMESTAMP(3),
    "vivaMarks" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "parentDeclarationFileId" TEXT,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "refusedReason" TEXT,
    "creditedAt" TIMESTAMP(3),
    "creditedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipIds" TEXT NOT NULL DEFAULT '[]',
    "guideMembershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reviews" TEXT NOT NULL DEFAULT '[]',
    "marks" DOUBLE PRECISION,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementSeason" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "batchYear" INTEGER NOT NULL,
    "finalYear" INTEGER NOT NULL,
    "placed" INTEGER NOT NULL,
    "higherStudies" INTEGER NOT NULL,
    "entrepreneurs" INTEGER NOT NULL,
    "offers" INTEGER NOT NULL,
    "medianSalaryRupees" INTEGER,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computedByUserId" TEXT NOT NULL,

    CONSTRAINT "PlacementSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniGift" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "alumnusMembershipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountRupees" INTEGER,
    "receiptRef" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "onKey" TEXT NOT NULL,
    "recordedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlumniGift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniReferral" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "alumnusMembershipId" TEXT NOT NULL,
    "driveId" TEXT,
    "companyName" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlumniReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniCompanyLink" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "alumnusMembershipId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlumniCompanyLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniMeet" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "onKey" TEXT NOT NULL,
    "venue" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "batchYear" INTEGER,
    "holidayId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlumniMeet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniMeetRegistration" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "meetId" TEXT NOT NULL,
    "alumnusMembershipId" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "AlumniMeetRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_identifier_key" ON "Company"("identifier");

-- CreateIndex
CREATE INDEX "CompanyRecruiter_userId_idx" ON "CompanyRecruiter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRecruiter_companyId_userId_key" ON "CompanyRecruiter"("companyId", "userId");

-- CreateIndex
CREATE INDEX "Requirement_companyId_idx" ON "Requirement"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyTenantLink_schoolId_companyId_key" ON "CompanyTenantLink"("schoolId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementProfile_studentMembershipId_key" ON "PlacementProfile"("studentMembershipId");

-- CreateIndex
CREATE INDEX "Drive_schoolId_status_idx" ON "Drive"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Drive_companyId_status_idx" ON "Drive"("companyId", "status");

-- CreateIndex
CREATE INDEX "DriveApplication_schoolId_studentMembershipId_idx" ON "DriveApplication"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "DriveApplication_driveId_studentMembershipId_key" ON "DriveApplication"("driveId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "RoundResult_schoolId_studentMembershipId_idx" ON "RoundResult"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundResult_driveId_round_studentMembershipId_key" ON "RoundResult"("driveId", "round", "studentMembershipId");

-- CreateIndex
CREATE INDEX "Offer_schoolId_studentMembershipId_idx" ON "Offer"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_driveId_studentMembershipId_key" ON "Offer"("driveId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "Internship_schoolId_status_idx" ON "Internship"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Internship_studentMembershipId_idx" ON "Internship"("studentMembershipId");

-- CreateIndex
CREATE INDEX "Internship_facultyMembershipId_idx" ON "Internship"("facultyMembershipId");

-- CreateIndex
CREATE INDEX "Project_schoolId_idx" ON "Project"("schoolId");

-- CreateIndex
CREATE INDEX "Project_guideMembershipId_idx" ON "Project"("guideMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementSeason_schoolId_batchYear_key" ON "PlacementSeason"("schoolId", "batchYear");

-- CreateIndex
CREATE INDEX "AlumniGift_schoolId_onKey_idx" ON "AlumniGift"("schoolId", "onKey");

-- CreateIndex
CREATE INDEX "AlumniReferral_schoolId_createdAt_idx" ON "AlumniReferral"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AlumniCompanyLink_alumnusMembershipId_key" ON "AlumniCompanyLink"("alumnusMembershipId");

-- CreateIndex
CREATE INDEX "AlumniCompanyLink_schoolId_companyId_idx" ON "AlumniCompanyLink"("schoolId", "companyId");

-- CreateIndex
CREATE INDEX "AlumniMeet_schoolId_onKey_idx" ON "AlumniMeet"("schoolId", "onKey");

-- CreateIndex
CREATE UNIQUE INDEX "AlumniMeetRegistration_meetId_alumnusMembershipId_key" ON "AlumniMeetRegistration"("meetId", "alumnusMembershipId");

-- AddForeignKey
ALTER TABLE "CompanyRecruiter" ADD CONSTRAINT "CompanyRecruiter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyRecruiter" ADD CONSTRAINT "CompanyRecruiter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTenantLink" ADD CONSTRAINT "CompanyTenantLink_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTenantLink" ADD CONSTRAINT "CompanyTenantLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementProfile" ADD CONSTRAINT "PlacementProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementProfile" ADD CONSTRAINT "PlacementProfile_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Drive" ADD CONSTRAINT "Drive_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveApplication" ADD CONSTRAINT "DriveApplication_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveApplication" ADD CONSTRAINT "DriveApplication_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriveApplication" ADD CONSTRAINT "DriveApplication_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundResult" ADD CONSTRAINT "RoundResult_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundResult" ADD CONSTRAINT "RoundResult_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundResult" ADD CONSTRAINT "RoundResult_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_guideMembershipId_fkey" FOREIGN KEY ("guideMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementSeason" ADD CONSTRAINT "PlacementSeason_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniGift" ADD CONSTRAINT "AlumniGift_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniGift" ADD CONSTRAINT "AlumniGift_alumnusMembershipId_fkey" FOREIGN KEY ("alumnusMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniReferral" ADD CONSTRAINT "AlumniReferral_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniReferral" ADD CONSTRAINT "AlumniReferral_alumnusMembershipId_fkey" FOREIGN KEY ("alumnusMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniReferral" ADD CONSTRAINT "AlumniReferral_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniCompanyLink" ADD CONSTRAINT "AlumniCompanyLink_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniCompanyLink" ADD CONSTRAINT "AlumniCompanyLink_alumnusMembershipId_fkey" FOREIGN KEY ("alumnusMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniCompanyLink" ADD CONSTRAINT "AlumniCompanyLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniMeet" ADD CONSTRAINT "AlumniMeet_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniMeetRegistration" ADD CONSTRAINT "AlumniMeetRegistration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniMeetRegistration" ADD CONSTRAINT "AlumniMeetRegistration_meetId_fkey" FOREIGN KEY ("meetId") REFERENCES "AlumniMeet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniMeetRegistration" ADD CONSTRAINT "AlumniMeetRegistration_alumnusMembershipId_fkey" FOREIGN KEY ("alumnusMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
