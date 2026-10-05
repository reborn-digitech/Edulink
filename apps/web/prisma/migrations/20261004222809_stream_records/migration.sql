-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "camp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hours" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Lecture" ADD COLUMN     "labBatchId" TEXT;

-- AlterTable
ALTER TABLE "OfferingSlot" ADD COLUMN     "labBatchId" TEXT;

-- CreateTable
CREATE TABLE "LabBatch" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 20,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabBatchMember" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,

    CONSTRAINT "LabBatchMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticalRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "experimentNo" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "performedOn" TEXT NOT NULL,
    "marks" INTEGER,
    "signedByMembershipId" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MootCourt" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "at" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "teamsJson" TEXT NOT NULL DEFAULT '[]',
    "result" TEXT NOT NULL DEFAULT '',
    "judgeNotes" TEXT NOT NULL DEFAULT '',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MootCourt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSchool" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "udise" TEXT,
    "contact" TEXT NOT NULL DEFAULT '',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSchool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingPracticePosting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "practiceSchoolId" TEXT NOT NULL,
    "fromKey" TEXT NOT NULL,
    "toKey" TEXT NOT NULL,
    "lessonsPlanned" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingPracticePosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonObservation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "at" TEXT NOT NULL,
    "observerMembershipId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorpsEnrolment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "enrolledOn" TEXT NOT NULL,
    "leftOn" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorpsEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSquadVisit" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "examRoomId" TEXT,
    "at" TIMESTAMP(3) NOT NULL,
    "byMembershipId" TEXT NOT NULL,
    "members" TEXT NOT NULL DEFAULT '',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamSquadVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabBatch_schoolId_idx" ON "LabBatch"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "LabBatch_divisionId_name_key" ON "LabBatch"("divisionId", "name");

-- CreateIndex
CREATE INDEX "LabBatchMember_batchId_idx" ON "LabBatchMember"("batchId");

-- CreateIndex
CREATE INDEX "LabBatchMember_schoolId_idx" ON "LabBatchMember"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "LabBatchMember_divisionId_studentMembershipId_key" ON "LabBatchMember"("divisionId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "PracticalRecord_schoolId_performedOn_idx" ON "PracticalRecord"("schoolId", "performedOn");

-- CreateIndex
CREATE INDEX "PracticalRecord_studentMembershipId_idx" ON "PracticalRecord"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticalRecord_offeringId_studentMembershipId_experimentNo_key" ON "PracticalRecord"("offeringId", "studentMembershipId", "experimentNo");

-- CreateIndex
CREATE INDEX "MootCourt_schoolId_at_idx" ON "MootCourt"("schoolId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSchool_schoolId_name_key" ON "PracticeSchool"("schoolId", "name");

-- CreateIndex
CREATE INDEX "TeachingPracticePosting_schoolId_fromKey_idx" ON "TeachingPracticePosting"("schoolId", "fromKey");

-- CreateIndex
CREATE INDEX "TeachingPracticePosting_studentMembershipId_idx" ON "TeachingPracticePosting"("studentMembershipId");

-- CreateIndex
CREATE INDEX "LessonObservation_postingId_idx" ON "LessonObservation"("postingId");

-- CreateIndex
CREATE INDEX "LessonObservation_schoolId_idx" ON "LessonObservation"("schoolId");

-- CreateIndex
CREATE INDEX "CorpsEnrolment_schoolId_corps_idx" ON "CorpsEnrolment"("schoolId", "corps");

-- CreateIndex
CREATE UNIQUE INDEX "CorpsEnrolment_corps_studentMembershipId_key" ON "CorpsEnrolment"("corps", "studentMembershipId");

-- CreateIndex
CREATE INDEX "ExamSquadVisit_schoolId_at_idx" ON "ExamSquadVisit"("schoolId", "at");

-- CreateIndex
CREATE INDEX "ExamSquadVisit_scheduleId_idx" ON "ExamSquadVisit"("scheduleId");

-- AddForeignKey
ALTER TABLE "OfferingSlot" ADD CONSTRAINT "OfferingSlot_labBatchId_fkey" FOREIGN KEY ("labBatchId") REFERENCES "LabBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecture" ADD CONSTRAINT "Lecture_labBatchId_fkey" FOREIGN KEY ("labBatchId") REFERENCES "LabBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabBatch" ADD CONSTRAINT "LabBatch_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabBatch" ADD CONSTRAINT "LabBatch_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabBatchMember" ADD CONSTRAINT "LabBatchMember_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabBatchMember" ADD CONSTRAINT "LabBatchMember_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "LabBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabBatchMember" ADD CONSTRAINT "LabBatchMember_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticalRecord" ADD CONSTRAINT "PracticalRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticalRecord" ADD CONSTRAINT "PracticalRecord_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticalRecord" ADD CONSTRAINT "PracticalRecord_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MootCourt" ADD CONSTRAINT "MootCourt_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSchool" ADD CONSTRAINT "PracticeSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingPracticePosting" ADD CONSTRAINT "TeachingPracticePosting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingPracticePosting" ADD CONSTRAINT "TeachingPracticePosting_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingPracticePosting" ADD CONSTRAINT "TeachingPracticePosting_practiceSchoolId_fkey" FOREIGN KEY ("practiceSchoolId") REFERENCES "PracticeSchool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonObservation" ADD CONSTRAINT "LessonObservation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonObservation" ADD CONSTRAINT "LessonObservation_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "TeachingPracticePosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorpsEnrolment" ADD CONSTRAINT "CorpsEnrolment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorpsEnrolment" ADD CONSTRAINT "CorpsEnrolment_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSquadVisit" ADD CONSTRAINT "ExamSquadVisit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSquadVisit" ADD CONSTRAINT "ExamSquadVisit_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
