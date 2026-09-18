-- CreateTable
CREATE TABLE "HealthCard" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "allergies" TEXT NOT NULL DEFAULT '',
    "conditions" TEXT NOT NULL DEFAULT '',
    "medications" TEXT NOT NULL DEFAULT '',
    "dietary" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "doctorName" TEXT,
    "doctorPhone" TEXT,
    "contactsJson" TEXT NOT NULL DEFAULT '[]',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthCheck" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "heightCm" INTEGER,
    "weightGrams" INTEGER,
    "visionLeft" TEXT,
    "visionRight" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthCard_studentMembershipId_key" ON "HealthCard"("studentMembershipId");

-- CreateIndex
CREATE INDEX "HealthCard_schoolId_idx" ON "HealthCard"("schoolId");

-- CreateIndex
CREATE INDEX "HealthCheck_schoolId_studentMembershipId_dateKey_idx" ON "HealthCheck"("schoolId", "studentMembershipId", "dateKey");

-- AddForeignKey
ALTER TABLE "HealthCard" ADD CONSTRAINT "HealthCard_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCard" ADD CONSTRAINT "HealthCard_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCheck" ADD CONSTRAINT "HealthCheck_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCheck" ADD CONSTRAINT "HealthCheck_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "HealthCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthCheck" ADD CONSTRAINT "HealthCheck_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
