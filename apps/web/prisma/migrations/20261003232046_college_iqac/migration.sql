-- CreateTable
CREATE TABLE "AccreditationCycle" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "institutionType" TEXT NOT NULL,
    "windowFrom" TEXT NOT NULL,
    "windowTo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "cgpa" DOUBLE PRECISION,
    "cgpaComputedAt" TIMESTAMP(3),
    "enteredJson" TEXT NOT NULL DEFAULT '{}',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricScore" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "provisional" BOOLEAN NOT NULL DEFAULT true,
    "evidenceJson" TEXT NOT NULL DEFAULT '{}',
    "note" TEXT NOT NULL DEFAULT '',
    "scoredByUserId" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "indexing" TEXT NOT NULL DEFAULT 'NONE',
    "year" INTEGER NOT NULL,
    "amountLakhs" DOUBLE PRECISION,
    "facultyMembershipId" TEXT,
    "departmentId" TEXT,
    "fileId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "at" TEXT NOT NULL,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "participantIdsJson" TEXT NOT NULL DEFAULT '[]',
    "theme" TEXT,
    "departmentId" TEXT,
    "fileId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "membersJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Committee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommitteeMeeting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "at" TEXT NOT NULL,
    "minutesFileId" TEXT,
    "actionTaken" TEXT NOT NULL DEFAULT '',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommitteeMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "termId" TEXT,
    "offeringId" TEXT,
    "opensOn" TEXT NOT NULL,
    "closesOn" TEXT NOT NULL,
    "questionsJson" TEXT NOT NULL DEFAULT '[]',
    "salt" TEXT NOT NULL DEFAULT '',
    "closedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "respondentHash" TEXT NOT NULL,
    "respondentMembershipId" TEXT,
    "answersJson" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionTakenReport" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "fileId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "postId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionTakenReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grievance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "byMembershipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "committeeKind" TEXT NOT NULL DEFAULT 'GRIEVANCE',
    "text" TEXT NOT NULL,
    "fileId" TEXT,
    "anonymousToStaff" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueOn" TEXT NOT NULL,
    "response" TEXT NOT NULL DEFAULT '',
    "ombudspersonNote" TEXT NOT NULL DEFAULT '',
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Grievance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "appointment" TEXT NOT NULL,
    "highestQualification" TEXT NOT NULL,
    "netSetQualified" BOOLEAN NOT NULL DEFAULT false,
    "experienceBeforeYears" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "joinedOn" TEXT,
    "departmentId" TEXT,
    "apaarFacultyId" TEXT,
    "panSealed" TEXT,
    "panLast4" TEXT,
    "apiScoreJson" TEXT NOT NULL DEFAULT '{}',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacultyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeFiling" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "cycleId" TEXT,
    "year" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "figuresJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "fileId" TEXT,
    "principalNote" TEXT NOT NULL DEFAULT '',
    "submittedAt" TIMESTAMP(3),
    "signedOffAt" TIMESTAMP(3),
    "signedOffByUserId" TEXT,
    "generatedByUserId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollegeFiling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IqacFile" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedByMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IqacFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisclosurePage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schoolSlug" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "snapshotJson" TEXT NOT NULL DEFAULT '{}',
    "hash" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisclosurePage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccreditationCycle_schoolId_status_idx" ON "AccreditationCycle"("schoolId", "status");

-- CreateIndex
CREATE INDEX "MetricScore_cycleId_metricCode_computedAt_idx" ON "MetricScore"("cycleId", "metricCode", "computedAt");

-- CreateIndex
CREATE INDEX "MetricScore_schoolId_idx" ON "MetricScore"("schoolId");

-- CreateIndex
CREATE INDEX "ResearchItem_schoolId_kind_year_idx" ON "ResearchItem"("schoolId", "kind", "year");

-- CreateIndex
CREATE INDEX "ResearchItem_facultyMembershipId_idx" ON "ResearchItem"("facultyMembershipId");

-- CreateIndex
CREATE INDEX "Activity_schoolId_kind_at_idx" ON "Activity"("schoolId", "kind", "at");

-- CreateIndex
CREATE INDEX "Committee_schoolId_kind_idx" ON "Committee"("schoolId", "kind");

-- CreateIndex
CREATE INDEX "CommitteeMeeting_committeeId_at_idx" ON "CommitteeMeeting"("committeeId", "at");

-- CreateIndex
CREATE INDEX "CommitteeMeeting_schoolId_idx" ON "CommitteeMeeting"("schoolId");

-- CreateIndex
CREATE INDEX "Survey_schoolId_kind_closesOn_idx" ON "Survey"("schoolId", "kind", "closesOn");

-- CreateIndex
CREATE INDEX "SurveyResponse_schoolId_idx" ON "SurveyResponse"("schoolId");

-- CreateIndex
CREATE INDEX "SurveyResponse_respondentMembershipId_idx" ON "SurveyResponse"("respondentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_surveyId_respondentHash_key" ON "SurveyResponse"("surveyId", "respondentHash");

-- CreateIndex
CREATE UNIQUE INDEX "ActionTakenReport_surveyId_key" ON "ActionTakenReport"("surveyId");

-- CreateIndex
CREATE INDEX "ActionTakenReport_schoolId_idx" ON "ActionTakenReport"("schoolId");

-- CreateIndex
CREATE INDEX "Grievance_schoolId_status_idx" ON "Grievance"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Grievance_byMembershipId_idx" ON "Grievance"("byMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyRecord_membershipId_key" ON "FacultyRecord"("membershipId");

-- CreateIndex
CREATE INDEX "FacultyRecord_schoolId_idx" ON "FacultyRecord"("schoolId");

-- CreateIndex
CREATE INDEX "CollegeFiling_schoolId_kind_year_idx" ON "CollegeFiling"("schoolId", "kind", "year");

-- CreateIndex
CREATE UNIQUE INDEX "IqacFile_fileId_key" ON "IqacFile"("fileId");

-- CreateIndex
CREATE INDEX "IqacFile_schoolId_purpose_idx" ON "IqacFile"("schoolId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "DisclosurePage_schoolId_key" ON "DisclosurePage"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "DisclosurePage_schoolSlug_key" ON "DisclosurePage"("schoolSlug");

-- AddForeignKey
ALTER TABLE "AccreditationCycle" ADD CONSTRAINT "AccreditationCycle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricScore" ADD CONSTRAINT "MetricScore_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricScore" ADD CONSTRAINT "MetricScore_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AccreditationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchItem" ADD CONSTRAINT "ResearchItem_facultyMembershipId_fkey" FOREIGN KEY ("facultyMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Committee" ADD CONSTRAINT "Committee_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommitteeMeeting" ADD CONSTRAINT "CommitteeMeeting_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "Committee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_respondentMembershipId_fkey" FOREIGN KEY ("respondentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTakenReport" ADD CONSTRAINT "ActionTakenReport_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionTakenReport" ADD CONSTRAINT "ActionTakenReport_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grievance" ADD CONSTRAINT "Grievance_byMembershipId_fkey" FOREIGN KEY ("byMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyRecord" ADD CONSTRAINT "FacultyRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyRecord" ADD CONSTRAINT "FacultyRecord_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeFiling" ADD CONSTRAINT "CollegeFiling_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeFiling" ADD CONSTRAINT "CollegeFiling_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AccreditationCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IqacFile" ADD CONSTRAINT "IqacFile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisclosurePage" ADD CONSTRAINT "DisclosurePage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
