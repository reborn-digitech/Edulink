-- The library and hostel modules (the owner's decision of 3 October 2026): the
-- library's titles, copies, members, loans, reservations, fines and settings;
-- the hostel's houses, rooms, beds, leave, roll calls, mess menu and attendance,
-- and the visitor book; and the incident log's hostel tag. Every table carries
-- schoolId and takes the one-line RLS policy (prisma/rls.sql, regenerated).
-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "hostelId" TEXT;

-- CreateTable
CREATE TABLE "LibrarySettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "pupilLimit" INTEGER NOT NULL DEFAULT 2,
    "pupilLoanDays" INTEGER NOT NULL DEFAULT 14,
    "staffLimit" INTEGER NOT NULL DEFAULT 5,
    "staffLoanDays" INTEGER NOT NULL DEFAULT 30,
    "maxRenewals" INTEGER NOT NULL DEFAULT 2,
    "finePerDayPaise" INTEGER NOT NULL DEFAULT 100,
    "fineHeadId" TEXT,
    "stockTakeStartedAt" TIMESTAMP(3),
    "updatedByUserId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibrarySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryTitle" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT '',
    "publisher" TEXT NOT NULL DEFAULT '',
    "year" INTEGER,
    "subject" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'OTHER',
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCopy" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "accession" TEXT NOT NULL,
    "rack" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryMember" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LibraryMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryIssue" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueOn" TEXT NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "renewedCount" INTEGER NOT NULL DEFAULT 0,
    "issuedByUserId" TEXT NOT NULL,
    "returnedByUserId" TEXT,
    "remindedOn" TEXT,
    "noticedOn" TEXT,

    CONSTRAINT "LibraryIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryReservation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "placedByUserId" TEXT NOT NULL,
    "readyAt" TIMESTAMP(3),
    "readyCopyId" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "LibraryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryFine" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "paise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "raisedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waivedAt" TIMESTAMP(3),
    "waivedByUserId" TEXT,
    "waivedReason" TEXT,
    "demandId" TEXT,
    "settledAt" TIMESTAMP(3),
    "settledByUserId" TEXT,

    CONSTRAINT "LibraryFine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "wardenMembershipId" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "messAttendance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelRoom" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "floor" TEXT NOT NULL DEFAULT '',
    "beds" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'SHARED',

    CONSTRAINT "HostelRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAllotment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bed" INTEGER NOT NULL,
    "fromDate" TEXT NOT NULL,
    "toDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "activePupilKey" TEXT,
    "activeBedKey" TEXT,
    "feeDemandId" TEXT,
    "allottedByUserId" TEXT NOT NULL,
    "endedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelAllotment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelLeave" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fromAt" TIMESTAMP(3) NOT NULL,
    "toAt" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "consentAt" TIMESTAMP(3),
    "consentUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "decisionNote" TEXT,
    "outAt" TIMESTAMP(3),
    "outByUserId" TEXT,
    "inAt" TIMESTAMP(3),
    "inByUserId" TEXT,
    "late" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelLeave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelRollCall" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "takenByUserId" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT,

    CONSTRAINT "HostelRollCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelRollCallEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "rollCallId" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "HostelRollCallEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessMenu" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "meal" TEXT NOT NULL,
    "items" TEXT NOT NULL,

    CONSTRAINT "MessMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "meal" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL,
    "markedByUserId" TEXT NOT NULL,

    CONSTRAINT "MessAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelVisitor" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "allotmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "inAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outAt" TIMESTAMP(3),
    "allowedByUserId" TEXT NOT NULL,

    CONSTRAINT "HostelVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LibrarySettings_schoolId_key" ON "LibrarySettings"("schoolId");

-- CreateIndex
CREATE INDEX "LibraryTitle_schoolId_title_idx" ON "LibraryTitle"("schoolId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryTitle_schoolId_isbn_key" ON "LibraryTitle"("schoolId", "isbn");

-- CreateIndex
CREATE INDEX "LibraryCopy_titleId_status_idx" ON "LibraryCopy"("titleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryCopy_schoolId_accession_key" ON "LibraryCopy"("schoolId", "accession");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMember_membershipId_key" ON "LibraryMember"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMember_schoolId_cardNumber_key" ON "LibraryMember"("schoolId", "cardNumber");

-- CreateIndex
CREATE INDEX "LibraryIssue_schoolId_returnedAt_dueOn_idx" ON "LibraryIssue"("schoolId", "returnedAt", "dueOn");

-- CreateIndex
CREATE INDEX "LibraryIssue_memberId_returnedAt_idx" ON "LibraryIssue"("memberId", "returnedAt");

-- CreateIndex
CREATE INDEX "LibraryIssue_copyId_returnedAt_idx" ON "LibraryIssue"("copyId", "returnedAt");

-- CreateIndex
CREATE INDEX "LibraryReservation_titleId_placedAt_idx" ON "LibraryReservation"("titleId", "placedAt");

-- CreateIndex
CREATE INDEX "LibraryReservation_memberId_idx" ON "LibraryReservation"("memberId");

-- CreateIndex
CREATE INDEX "LibraryFine_schoolId_createdAt_idx" ON "LibraryFine"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryFine_issueId_reason_key" ON "LibraryFine"("issueId", "reason");

-- CreateIndex
CREATE UNIQUE INDEX "Hostel_schoolId_name_key" ON "Hostel"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HostelRoom_hostelId_number_key" ON "HostelRoom"("hostelId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAllotment_activePupilKey_key" ON "HostelAllotment"("activePupilKey");

-- CreateIndex
CREATE UNIQUE INDEX "HostelAllotment_activeBedKey_key" ON "HostelAllotment"("activeBedKey");

-- CreateIndex
CREATE INDEX "HostelAllotment_schoolId_status_idx" ON "HostelAllotment"("schoolId", "status");

-- CreateIndex
CREATE INDEX "HostelAllotment_membershipId_status_idx" ON "HostelAllotment"("membershipId", "status");

-- CreateIndex
CREATE INDEX "HostelAllotment_roomId_status_idx" ON "HostelAllotment"("roomId", "status");

-- CreateIndex
CREATE INDEX "HostelLeave_schoolId_status_fromAt_idx" ON "HostelLeave"("schoolId", "status", "fromAt");

-- CreateIndex
CREATE INDEX "HostelLeave_allotmentId_idx" ON "HostelLeave"("allotmentId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelRollCall_hostelId_dateKey_slot_key" ON "HostelRollCall"("hostelId", "dateKey", "slot");

-- CreateIndex
CREATE INDEX "HostelRollCallEntry_membershipId_idx" ON "HostelRollCallEntry"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "HostelRollCallEntry_rollCallId_allotmentId_key" ON "HostelRollCallEntry"("rollCallId", "allotmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MessMenu_hostelId_weekday_meal_key" ON "MessMenu"("hostelId", "weekday", "meal");

-- CreateIndex
CREATE INDEX "MessAttendance_schoolId_dateKey_idx" ON "MessAttendance"("schoolId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "MessAttendance_allotmentId_dateKey_meal_key" ON "MessAttendance"("allotmentId", "dateKey", "meal");

-- CreateIndex
CREATE INDEX "HostelVisitor_schoolId_inAt_idx" ON "HostelVisitor"("schoolId", "inAt");

-- CreateIndex
CREATE INDEX "Incident_schoolId_hostelId_occurredAt_idx" ON "Incident"("schoolId", "hostelId", "occurredAt");

-- AddForeignKey
ALTER TABLE "LibrarySettings" ADD CONSTRAINT "LibrarySettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryTitle" ADD CONSTRAINT "LibraryTitle_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCopy" ADD CONSTRAINT "LibraryCopy_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryCopy" ADD CONSTRAINT "LibraryCopy_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "LibraryTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryMember" ADD CONSTRAINT "LibraryMember_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryIssue" ADD CONSTRAINT "LibraryIssue_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryIssue" ADD CONSTRAINT "LibraryIssue_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "LibraryCopy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryIssue" ADD CONSTRAINT "LibraryIssue_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryReservation" ADD CONSTRAINT "LibraryReservation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryReservation" ADD CONSTRAINT "LibraryReservation_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "LibraryTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryReservation" ADD CONSTRAINT "LibraryReservation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFine" ADD CONSTRAINT "LibraryFine_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFine" ADD CONSTRAINT "LibraryFine_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "LibraryIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryFine" ADD CONSTRAINT "LibraryFine_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LibraryMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelLeave" ADD CONSTRAINT "HostelLeave_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelLeave" ADD CONSTRAINT "HostelLeave_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "HostelAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRollCall" ADD CONSTRAINT "HostelRollCall_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRollCall" ADD CONSTRAINT "HostelRollCall_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRollCallEntry" ADD CONSTRAINT "HostelRollCallEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRollCallEntry" ADD CONSTRAINT "HostelRollCallEntry_rollCallId_fkey" FOREIGN KEY ("rollCallId") REFERENCES "HostelRollCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRollCallEntry" ADD CONSTRAINT "HostelRollCallEntry_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "HostelAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessMenu" ADD CONSTRAINT "MessMenu_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessMenu" ADD CONSTRAINT "MessMenu_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessAttendance" ADD CONSTRAINT "MessAttendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessAttendance" ADD CONSTRAINT "MessAttendance_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "HostelAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitor" ADD CONSTRAINT "HostelVisitor_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelVisitor" ADD CONSTRAINT "HostelVisitor_allotmentId_fkey" FOREIGN KEY ("allotmentId") REFERENCES "HostelAllotment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
