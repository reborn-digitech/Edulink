-- The college exam cell (module EXAMS, role EXAM_CONTROLLER; 4 October 2026): 23 tenant-scoped tables. Generated with prisma migrate diff against the schema as it stood without this module, so no other builder's tables are in it. Courses, terms and registrations are the academics module's, referenced by plain ids.
-- CreateTable
CREATE TABLE "ExamSession" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'REGULAR',
    "termId" TEXT NOT NULL,
    "formOpensAt" TIMESTAMP(3),
    "formClosesAt" TIMESTAMP(3),
    "feePerCoursePaise" INTEGER NOT NULL DEFAULT 0,
    "feePerBacklogPaise" INTEGER NOT NULL DEFAULT 0,
    "photocopyFeePaise" INTEGER NOT NULL DEFAULT 0,
    "revalFeePaise" INTEGER NOT NULL DEFAULT 0,
    "lateFeeSlabsJson" TEXT NOT NULL DEFAULT '[]',
    "feeHeadId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamForm" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "coursesJson" TEXT NOT NULL DEFAULT '[]',
    "eligibilityJson" TEXT NOT NULL DEFAULT '{}',
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "noDues" BOOLEAN NOT NULL DEFAULT false,
    "feePaise" INTEGER NOT NULL DEFAULT 0,
    "lateFeePaise" INTEGER NOT NULL DEFAULT 0,
    "feeDemandId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "waiverReason" TEXT,
    "refusalReason" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallTicket" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HallTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSchedule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 180,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRoom" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "roomId" TEXT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seating" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "examRoomId" TEXT NOT NULL,
    "seatNo" INTEGER NOT NULL,
    "formId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,

    CONSTRAINT "Seating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invigilation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "examRoomId" TEXT NOT NULL,
    "staffMembershipId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "swappedFromMembershipId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invigilation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Malpractice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "reportedByUserId" TEXT NOT NULL,
    "decision" TEXT,
    "decisionNote" TEXT,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Malpractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Remuneration" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "staffMembershipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "ratePaise" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Remuneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamMark" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "internalMilli" INTEGER,
    "externalMilli" INTEGER,
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "entry1Milli" INTEGER,
    "entry1Absent" BOOLEAN NOT NULL DEFAULT false,
    "entry1ByUserId" TEXT,
    "entry1At" TIMESTAMP(3),
    "entry2Milli" INTEGER,
    "entry2Absent" BOOLEAN NOT NULL DEFAULT false,
    "entry2ByUserId" TEXT,
    "entry2At" TIMESTAMP(3),
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "graceMilli" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT,
    "enteredByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamGrace" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "graceMilli" INTEGER NOT NULL,
    "rule" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "proposedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamGrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamModerationNote" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT,
    "note" TEXT NOT NULL,
    "writtenByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamModerationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultRun" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computedByUserId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "summaryJson" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "ResultRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseResult" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "creditsTenths" INTEGER NOT NULL,
    "internalMilli" INTEGER,
    "externalMilli" INTEGER,
    "graceMilli" INTEGER NOT NULL DEFAULT 0,
    "totalMilli" INTEGER NOT NULL,
    "maxMilli" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "pointsTenths" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "CourseResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermResult" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "sgpaHundredths" INTEGER,
    "creditsAttemptedTenths" INTEGER NOT NULL,
    "creditsEarnedTenths" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "cls" TEXT,

    CONSTRAINT "TermResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Revaluation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "feePaise" INTEGER NOT NULL DEFAULT 0,
    "feeDemandId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASKED',
    "outcome" TEXT,
    "oldExternalMilli" INTEGER,
    "newExternalMilli" INTEGER,
    "note" TEXT,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backlog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "firstFailedSessionId" TEXT NOT NULL,
    "firstFailedAt" TIMESTAMP(3) NOT NULL,
    "clearedSessionId" TEXT,
    "clearedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Backlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditPush" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "creditsTenths" INTEGER NOT NULL,
    "apaarId" TEXT,
    "abcRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "pushedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditPush_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionPaper" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "setterMembershipId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "coMapJson" TEXT NOT NULL DEFAULT '[]',
    "sealedBody" TEXT,
    "fileName" TEXT,
    "mime" TEXT,
    "sizeBytes" INTEGER,
    "sha256" TEXT,
    "submittedAt" TIMESTAMP(3),
    "moderatedByUserId" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderationNote" TEXT,
    "accessLogJson" TEXT NOT NULL DEFAULT '[]',
    "assignedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintingList" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "examRoomId" TEXT NOT NULL,
    "seated" INTEGER NOT NULL,
    "spare" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "PrintingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAllocation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "assessorMembershipId" TEXT NOT NULL,
    "bundle" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ALLOTTED',
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convocation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "listJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "finalizedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamDocument" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sessionId" TEXT,
    "runId" TEXT,
    "yearLabel" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "serial" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "signaturePng" BYTEA,
    "sealPng" BYTEA,
    "issuedByUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "ExamDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamSession_schoolId_termId_idx" ON "ExamSession"("schoolId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSession_schoolId_name_key" ON "ExamSession"("schoolId", "name");

-- CreateIndex
CREATE INDEX "ExamForm_schoolId_studentMembershipId_idx" ON "ExamForm"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamForm_sessionId_studentMembershipId_key" ON "ExamForm"("sessionId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "HallTicket_formId_key" ON "HallTicket"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "HallTicket_code_key" ON "HallTicket"("code");

-- CreateIndex
CREATE INDEX "HallTicket_schoolId_studentMembershipId_idx" ON "HallTicket"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "HallTicket_sessionId_number_key" ON "HallTicket"("sessionId", "number");

-- CreateIndex
CREATE INDEX "ExamSchedule_schoolId_at_idx" ON "ExamSchedule"("schoolId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSchedule_sessionId_courseId_key" ON "ExamSchedule"("sessionId", "courseId");

-- CreateIndex
CREATE INDEX "ExamRoom_schoolId_sessionId_idx" ON "ExamRoom"("schoolId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_scheduleId_name_key" ON "ExamRoom"("scheduleId", "name");

-- CreateIndex
CREATE INDEX "Seating_schoolId_studentMembershipId_idx" ON "Seating"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Seating_scheduleId_formId_key" ON "Seating"("scheduleId", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "Seating_examRoomId_seatNo_key" ON "Seating"("examRoomId", "seatNo");

-- CreateIndex
CREATE INDEX "Invigilation_schoolId_staffMembershipId_idx" ON "Invigilation"("schoolId", "staffMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Invigilation_examRoomId_staffMembershipId_key" ON "Invigilation"("examRoomId", "staffMembershipId");

-- CreateIndex
CREATE INDEX "Malpractice_schoolId_sessionId_idx" ON "Malpractice"("schoolId", "sessionId");

-- CreateIndex
CREATE INDEX "Remuneration_schoolId_staffMembershipId_idx" ON "Remuneration"("schoolId", "staffMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Remuneration_sessionId_staffMembershipId_kind_key" ON "Remuneration"("sessionId", "staffMembershipId", "kind");

-- CreateIndex
CREATE INDEX "ExamMark_schoolId_sessionId_courseId_idx" ON "ExamMark"("schoolId", "sessionId", "courseId");

-- CreateIndex
CREATE INDEX "ExamMark_studentMembershipId_idx" ON "ExamMark"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamMark_sessionId_courseId_studentMembershipId_version_key" ON "ExamMark"("sessionId", "courseId", "studentMembershipId", "version");

-- CreateIndex
CREATE INDEX "ExamGrace_schoolId_status_idx" ON "ExamGrace"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ExamGrace_sessionId_courseId_studentMembershipId_key" ON "ExamGrace"("sessionId", "courseId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "ExamModerationNote_schoolId_sessionId_idx" ON "ExamModerationNote"("schoolId", "sessionId");

-- CreateIndex
CREATE INDEX "ResultRun_schoolId_status_idx" ON "ResultRun"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ResultRun_sessionId_number_key" ON "ResultRun"("sessionId", "number");

-- CreateIndex
CREATE INDEX "CourseResult_schoolId_courseId_idx" ON "CourseResult"("schoolId", "courseId");

-- CreateIndex
CREATE INDEX "CourseResult_studentMembershipId_idx" ON "CourseResult"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseResult_runId_studentMembershipId_courseId_key" ON "CourseResult"("runId", "studentMembershipId", "courseId");

-- CreateIndex
CREATE INDEX "TermResult_schoolId_termId_idx" ON "TermResult"("schoolId", "termId");

-- CreateIndex
CREATE INDEX "TermResult_studentMembershipId_idx" ON "TermResult"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "TermResult_runId_studentMembershipId_key" ON "TermResult"("runId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "Revaluation_schoolId_status_idx" ON "Revaluation"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Revaluation_sessionId_courseId_studentMembershipId_kind_key" ON "Revaluation"("sessionId", "courseId", "studentMembershipId", "kind");

-- CreateIndex
CREATE INDEX "Backlog_schoolId_status_idx" ON "Backlog"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Backlog_studentMembershipId_courseId_key" ON "Backlog"("studentMembershipId", "courseId");

-- CreateIndex
CREATE INDEX "CreditPush_schoolId_status_idx" ON "CreditPush"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CreditPush_studentMembershipId_termId_key" ON "CreditPush"("studentMembershipId", "termId");

-- CreateIndex
CREATE INDEX "QuestionPaper_schoolId_setterMembershipId_idx" ON "QuestionPaper"("schoolId", "setterMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPaper_scheduleId_setterMembershipId_key" ON "QuestionPaper"("scheduleId", "setterMembershipId");

-- CreateIndex
CREATE INDEX "PrintingList_schoolId_sessionId_idx" ON "PrintingList"("schoolId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintingList_scheduleId_examRoomId_key" ON "PrintingList"("scheduleId", "examRoomId");

-- CreateIndex
CREATE INDEX "AssessmentAllocation_schoolId_assessorMembershipId_idx" ON "AssessmentAllocation"("schoolId", "assessorMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAllocation_scheduleId_bundle_key" ON "AssessmentAllocation"("scheduleId", "bundle");

-- CreateIndex
CREATE UNIQUE INDEX "Convocation_schoolId_year_key" ON "Convocation"("schoolId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ExamDocument_code_key" ON "ExamDocument"("code");

-- CreateIndex
CREATE INDEX "ExamDocument_schoolId_studentMembershipId_idx" ON "ExamDocument"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamDocument_schoolId_kind_yearLabel_number_key" ON "ExamDocument"("schoolId", "kind", "yearLabel", "number");

-- AddForeignKey
ALTER TABLE "ExamSession" ADD CONSTRAINT "ExamSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_formId_fkey" FOREIGN KEY ("formId") REFERENCES "ExamForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRoom" ADD CONSTRAINT "ExamRoom_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRoom" ADD CONSTRAINT "ExamRoom_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seating" ADD CONSTRAINT "Seating_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seating" ADD CONSTRAINT "Seating_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "ExamRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seating" ADD CONSTRAINT "Seating_formId_fkey" FOREIGN KEY ("formId") REFERENCES "ExamForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seating" ADD CONSTRAINT "Seating_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invigilation" ADD CONSTRAINT "Invigilation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invigilation" ADD CONSTRAINT "Invigilation_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "ExamRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invigilation" ADD CONSTRAINT "Invigilation_staffMembershipId_fkey" FOREIGN KEY ("staffMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Malpractice" ADD CONSTRAINT "Malpractice_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Malpractice" ADD CONSTRAINT "Malpractice_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Malpractice" ADD CONSTRAINT "Malpractice_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remuneration" ADD CONSTRAINT "Remuneration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Remuneration" ADD CONSTRAINT "Remuneration_staffMembershipId_fkey" FOREIGN KEY ("staffMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamGrace" ADD CONSTRAINT "ExamGrace_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamGrace" ADD CONSTRAINT "ExamGrace_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamModerationNote" ADD CONSTRAINT "ExamModerationNote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultRun" ADD CONSTRAINT "ResultRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseResult" ADD CONSTRAINT "CourseResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ResultRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseResult" ADD CONSTRAINT "CourseResult_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermResult" ADD CONSTRAINT "TermResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ResultRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermResult" ADD CONSTRAINT "TermResult_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revaluation" ADD CONSTRAINT "Revaluation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Revaluation" ADD CONSTRAINT "Revaluation_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backlog" ADD CONSTRAINT "Backlog_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backlog" ADD CONSTRAINT "Backlog_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPush" ADD CONSTRAINT "CreditPush_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPush" ADD CONSTRAINT "CreditPush_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionPaper" ADD CONSTRAINT "QuestionPaper_setterMembershipId_fkey" FOREIGN KEY ("setterMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingList" ADD CONSTRAINT "PrintingList_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingList" ADD CONSTRAINT "PrintingList_examRoomId_fkey" FOREIGN KEY ("examRoomId") REFERENCES "ExamRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAllocation" ADD CONSTRAINT "AssessmentAllocation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ExamSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAllocation" ADD CONSTRAINT "AssessmentAllocation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAllocation" ADD CONSTRAINT "AssessmentAllocation_assessorMembershipId_fkey" FOREIGN KEY ("assessorMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convocation" ADD CONSTRAINT "Convocation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamDocument" ADD CONSTRAINT "ExamDocument_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamDocument" ADD CONSTRAINT "ExamDocument_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

