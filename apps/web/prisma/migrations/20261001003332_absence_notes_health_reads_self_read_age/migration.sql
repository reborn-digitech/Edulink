-- AlterTable
ALTER TABLE "School" ADD COLUMN     "selfReadAge" INTEGER;

-- CreateTable
CREATE TABLE "AbsenceNote" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "text" TEXT,
    "authorUserId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsenceNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCardRead" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "healthCardId" TEXT,
    "readerUserId" TEXT NOT NULL,
    "readerRole" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCardRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbsenceNote_schoolId_dateKey_idx" ON "AbsenceNote"("schoolId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "AbsenceNote_studentMembershipId_dateKey_key" ON "AbsenceNote"("studentMembershipId", "dateKey");

-- CreateIndex
CREATE INDEX "HealthCardRead_schoolId_studentMembershipId_readAt_idx" ON "HealthCardRead"("schoolId", "studentMembershipId", "readAt");

-- AddForeignKey
ALTER TABLE "AbsenceNote" ADD CONSTRAINT "AbsenceNote_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsenceNote" ADD CONSTRAINT "AbsenceNote_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCardRead" ADD CONSTRAINT "HealthCardRead_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCardRead" ADD CONSTRAINT "HealthCardRead_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
