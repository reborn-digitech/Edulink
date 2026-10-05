-- CreateTable
CREATE TABLE "PlacementTalk" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "driveId" TEXT,
    "companyName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "venue" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "heldAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementTalk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementTalkRsvp" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "talkId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "attendance" TEXT,
    "markedByUserId" TEXT,
    "markedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlacementTalkRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftSkillsTraining" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "trainer" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "capacity" INTEGER,
    "minAttendancePercent" INTEGER NOT NULL DEFAULT 75,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftSkillsTraining_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftSkillsSession" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 60,
    "topic" TEXT NOT NULL DEFAULT '',
    "venue" TEXT NOT NULL DEFAULT '',
    "cancelledAt" TIMESTAMP(3),
    "heldAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftSkillsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftSkillsEnrolment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "byUserId" TEXT NOT NULL,

    CONSTRAINT "SoftSkillsEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoftSkillsAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL,
    "markedByUserId" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoftSkillsAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceDevice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'BIOMETRIC',
    "location" TEXT NOT NULL DEFAULT '',
    "scope" TEXT NOT NULL DEFAULT 'BOTH',
    "keySealed" TEXT NOT NULL,
    "keyLast4" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "keyRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMP(3),
    "lastPunchAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceBadge" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendancePunch" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "membershipId" TEXT,
    "punchedAt" TIMESTAMP(3) NOT NULL,
    "dateKey" TEXT NOT NULL,
    "direction" TEXT,
    "outcome" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendancePunch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerTeamVisit" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "cycleId" TEXT,
    "departmentId" TEXT,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "fromDate" TEXT NOT NULL,
    "toDate" TEXT NOT NULL,
    "teamJson" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerTeamVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerVisitItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "dayKey" TEXT,
    "startMinute" INTEGER,
    "endMinute" INTEGER,
    "activity" TEXT NOT NULL DEFAULT '',
    "venue" TEXT NOT NULL DEFAULT '',
    "ownerName" TEXT NOT NULL DEFAULT '',
    "criterion" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "linkKind" TEXT,
    "linkId" TEXT,
    "url" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeerVisitItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlacementTalk_driveId_key" ON "PlacementTalk"("driveId");

-- CreateIndex
CREATE INDEX "PlacementTalk_schoolId_startsAt_idx" ON "PlacementTalk"("schoolId", "startsAt");

-- CreateIndex
CREATE INDEX "PlacementTalkRsvp_schoolId_studentMembershipId_idx" ON "PlacementTalkRsvp"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementTalkRsvp_talkId_studentMembershipId_key" ON "PlacementTalkRsvp"("talkId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "SoftSkillsTraining_schoolId_status_idx" ON "SoftSkillsTraining"("schoolId", "status");

-- CreateIndex
CREATE INDEX "SoftSkillsSession_trainingId_startsAt_idx" ON "SoftSkillsSession"("trainingId", "startsAt");

-- CreateIndex
CREATE INDEX "SoftSkillsSession_schoolId_idx" ON "SoftSkillsSession"("schoolId");

-- CreateIndex
CREATE INDEX "SoftSkillsEnrolment_schoolId_studentMembershipId_idx" ON "SoftSkillsEnrolment"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftSkillsEnrolment_trainingId_studentMembershipId_key" ON "SoftSkillsEnrolment"("trainingId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "SoftSkillsAttendance_schoolId_studentMembershipId_idx" ON "SoftSkillsAttendance"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "SoftSkillsAttendance_sessionId_studentMembershipId_key" ON "SoftSkillsAttendance"("sessionId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "AttendanceDevice_schoolId_idx" ON "AttendanceDevice"("schoolId");

-- CreateIndex
CREATE INDEX "AttendanceBadge_membershipId_idx" ON "AttendanceBadge"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceBadge_schoolId_code_key" ON "AttendanceBadge"("schoolId", "code");

-- CreateIndex
CREATE INDEX "AttendancePunch_schoolId_dateKey_idx" ON "AttendancePunch"("schoolId", "dateKey");

-- CreateIndex
CREATE INDEX "AttendancePunch_membershipId_idx" ON "AttendancePunch"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendancePunch_deviceId_externalId_key" ON "AttendancePunch"("deviceId", "externalId");

-- CreateIndex
CREATE INDEX "PeerTeamVisit_schoolId_framework_idx" ON "PeerTeamVisit"("schoolId", "framework");

-- CreateIndex
CREATE INDEX "PeerVisitItem_visitId_kind_position_idx" ON "PeerVisitItem"("visitId", "kind", "position");

-- CreateIndex
CREATE INDEX "PeerVisitItem_schoolId_idx" ON "PeerVisitItem"("schoolId");

-- AddForeignKey
ALTER TABLE "PlacementTalk" ADD CONSTRAINT "PlacementTalk_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementTalk" ADD CONSTRAINT "PlacementTalk_driveId_fkey" FOREIGN KEY ("driveId") REFERENCES "Drive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementTalkRsvp" ADD CONSTRAINT "PlacementTalkRsvp_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementTalkRsvp" ADD CONSTRAINT "PlacementTalkRsvp_talkId_fkey" FOREIGN KEY ("talkId") REFERENCES "PlacementTalk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillsTraining" ADD CONSTRAINT "SoftSkillsTraining_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillsSession" ADD CONSTRAINT "SoftSkillsSession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillsSession" ADD CONSTRAINT "SoftSkillsSession_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "SoftSkillsTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillsEnrolment" ADD CONSTRAINT "SoftSkillsEnrolment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillsEnrolment" ADD CONSTRAINT "SoftSkillsEnrolment_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "SoftSkillsTraining"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillsAttendance" ADD CONSTRAINT "SoftSkillsAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoftSkillsAttendance" ADD CONSTRAINT "SoftSkillsAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SoftSkillsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceDevice" ADD CONSTRAINT "AttendanceDevice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceBadge" ADD CONSTRAINT "AttendanceBadge_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendancePunch" ADD CONSTRAINT "AttendancePunch_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendancePunch" ADD CONSTRAINT "AttendancePunch_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "AttendanceDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerTeamVisit" ADD CONSTRAINT "PeerTeamVisit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerVisitItem" ADD CONSTRAINT "PeerVisitItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerVisitItem" ADD CONSTRAINT "PeerVisitItem_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "PeerTeamVisit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

