-- AlterTable
ALTER TABLE "Substitution" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "declineReason" TEXT,
ADD COLUMN     "declinedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StaffAppraisal" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffMembershipId" TEXT NOT NULL,
    "appraiserUserId" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "strengths" TEXT,
    "targets" TEXT,
    "rating" INTEGER,
    "visibleToStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAppraisal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlanTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonPlanTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffAppraisal_schoolId_staffMembershipId_date_idx" ON "StaffAppraisal"("schoolId", "staffMembershipId", "date");

-- CreateIndex
CREATE INDEX "LessonPlanTemplate_schoolId_subject_idx" ON "LessonPlanTemplate"("schoolId", "subject");

-- CreateIndex
CREATE INDEX "LessonPlanTemplate_schoolId_authorUserId_idx" ON "LessonPlanTemplate"("schoolId", "authorUserId");

-- AddForeignKey
ALTER TABLE "StaffAppraisal" ADD CONSTRAINT "StaffAppraisal_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAppraisal" ADD CONSTRAINT "StaffAppraisal_staffMembershipId_fkey" FOREIGN KEY ("staffMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlanTemplate" ADD CONSTRAINT "LessonPlanTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
