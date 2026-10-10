-- CreateTable
CREATE TABLE "ClinicalSite" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "agreementFromKey" TEXT,
    "agreementToKey" TEXT,
    "contactRole" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalDepartment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "beds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalPosting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "labBatchId" TEXT,
    "supervisorMembershipId" TEXT NOT NULL,
    "fromKey" TEXT NOT NULL,
    "toKey" TEXT NOT NULL,
    "rotationOrder" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogbookEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "postingId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "onKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedByMembershipId" TEXT,
    "remark" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LogbookEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalSite_schoolId_name_key" ON "ClinicalSite"("schoolId", "name");

-- CreateIndex
CREATE INDEX "ClinicalDepartment_schoolId_idx" ON "ClinicalDepartment"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalDepartment_siteId_name_key" ON "ClinicalDepartment"("siteId", "name");

-- CreateIndex
CREATE INDEX "ClinicalPosting_schoolId_fromKey_idx" ON "ClinicalPosting"("schoolId", "fromKey");

-- CreateIndex
CREATE INDEX "ClinicalPosting_divisionId_idx" ON "ClinicalPosting"("divisionId");

-- CreateIndex
CREATE INDEX "ClinicalPosting_supervisorMembershipId_idx" ON "ClinicalPosting"("supervisorMembershipId");

-- CreateIndex
CREATE INDEX "LogbookEntry_schoolId_state_idx" ON "LogbookEntry"("schoolId", "state");

-- CreateIndex
CREATE INDEX "LogbookEntry_postingId_idx" ON "LogbookEntry"("postingId");

-- CreateIndex
CREATE UNIQUE INDEX "LogbookEntry_studentMembershipId_clientId_key" ON "LogbookEntry"("studentMembershipId", "clientId");

-- AddForeignKey
ALTER TABLE "ClinicalSite" ADD CONSTRAINT "ClinicalSite_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDepartment" ADD CONSTRAINT "ClinicalDepartment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalDepartment" ADD CONSTRAINT "ClinicalDepartment_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ClinicalSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalPosting" ADD CONSTRAINT "ClinicalPosting_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalPosting" ADD CONSTRAINT "ClinicalPosting_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ClinicalSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalPosting" ADD CONSTRAINT "ClinicalPosting_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "ClinicalDepartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalPosting" ADD CONSTRAINT "ClinicalPosting_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalPosting" ADD CONSTRAINT "ClinicalPosting_labBatchId_fkey" FOREIGN KEY ("labBatchId") REFERENCES "LabBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalPosting" ADD CONSTRAINT "ClinicalPosting_supervisorMembershipId_fkey" FOREIGN KEY ("supervisorMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_postingId_fkey" FOREIGN KEY ("postingId") REFERENCES "ClinicalPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
