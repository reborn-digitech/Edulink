-- CreateTable
CREATE TABLE "Studio" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL DEFAULT '',
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "coordinatorMembershipId" TEXT NOT NULL,
    "briefIssuedOn" TEXT NOT NULL,
    "interimOn" TEXT,
    "finalOn" TEXT,
    "juryOn" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Studio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioSubmission" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT NOT NULL DEFAULT '',
    "fileId" TEXT,
    "fileName" TEXT,
    "fileMime" TEXT,
    "fileSize" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioJury" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studioId" TEXT NOT NULL,
    "on" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "panelJson" TEXT NOT NULL DEFAULT '[]',
    "chairMembershipId" TEXT NOT NULL,
    "externalJson" TEXT NOT NULL DEFAULT '[]',
    "signedByMembershipId" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudioJury_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudioJuryMark" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "juryId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "marksTenths" INTEGER,
    "remark" TEXT NOT NULL DEFAULT '',
    "markedByMembershipId" TEXT NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudioJuryMark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Studio_schoolId_termId_idx" ON "Studio"("schoolId", "termId");

-- CreateIndex
CREATE INDEX "Studio_offeringId_idx" ON "Studio"("offeringId");

-- CreateIndex
CREATE INDEX "Studio_coordinatorMembershipId_idx" ON "Studio"("coordinatorMembershipId");

-- CreateIndex
CREATE INDEX "StudioSubmission_schoolId_idx" ON "StudioSubmission"("schoolId");

-- CreateIndex
CREATE INDEX "StudioSubmission_studentMembershipId_idx" ON "StudioSubmission"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioSubmission_studioId_studentMembershipId_stage_key" ON "StudioSubmission"("studioId", "studentMembershipId", "stage");

-- CreateIndex
CREATE INDEX "StudioJury_schoolId_on_idx" ON "StudioJury"("schoolId", "on");

-- CreateIndex
CREATE INDEX "StudioJury_studioId_idx" ON "StudioJury"("studioId");

-- CreateIndex
CREATE INDEX "StudioJuryMark_schoolId_idx" ON "StudioJuryMark"("schoolId");

-- CreateIndex
CREATE INDEX "StudioJuryMark_studentMembershipId_idx" ON "StudioJuryMark"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "StudioJuryMark_juryId_studentMembershipId_key" ON "StudioJuryMark"("juryId", "studentMembershipId");

-- AddForeignKey
ALTER TABLE "Studio" ADD CONSTRAINT "Studio_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Studio" ADD CONSTRAINT "Studio_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Studio" ADD CONSTRAINT "Studio_termId_fkey" FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Studio" ADD CONSTRAINT "Studio_coordinatorMembershipId_fkey" FOREIGN KEY ("coordinatorMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioSubmission" ADD CONSTRAINT "StudioSubmission_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioSubmission" ADD CONSTRAINT "StudioSubmission_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioSubmission" ADD CONSTRAINT "StudioSubmission_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioJury" ADD CONSTRAINT "StudioJury_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioJury" ADD CONSTRAINT "StudioJury_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioJuryMark" ADD CONSTRAINT "StudioJuryMark_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioJuryMark" ADD CONSTRAINT "StudioJuryMark_juryId_fkey" FOREIGN KEY ("juryId") REFERENCES "StudioJury"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudioJuryMark" ADD CONSTRAINT "StudioJuryMark_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
