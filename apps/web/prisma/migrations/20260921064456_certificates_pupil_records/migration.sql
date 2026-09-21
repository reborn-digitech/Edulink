-- CreateTable
CREATE TABLE "PupilRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "fatherName" TEXT,
    "motherName" TEXT,
    "placeOfBirth" TEXT,
    "nationality" TEXT,
    "religion" TEXT,
    "caste" TEXT,
    "category" TEXT,
    "motherTongue" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "admissionNumber" TEXT,
    "admissionDate" TIMESTAMP(3),
    "admittedToGrade" TEXT,
    "previousSchool" TEXT,
    "penNumber" TEXT,
    "requestedAt" TIMESTAMP(3),
    "familyFilledAt" TIMESTAMP(3),
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PupilRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT NOT NULL,
    "intro" TEXT NOT NULL DEFAULT '',
    "rowsJson" TEXT NOT NULL DEFAULT '[]',
    "outro" TEXT NOT NULL DEFAULT '',
    "layoutJson" TEXT NOT NULL DEFAULT '{}',
    "serialPrefix" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssuedCertificate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "templateId" TEXT,
    "studentMembershipId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "kind" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "intro" TEXT NOT NULL DEFAULT '',
    "rowsJson" TEXT NOT NULL DEFAULT '[]',
    "outro" TEXT NOT NULL DEFAULT '',
    "layoutJson" TEXT NOT NULL DEFAULT '{}',
    "dataJson" TEXT NOT NULL DEFAULT '{}',
    "purpose" TEXT,
    "remark" TEXT,
    "code" TEXT NOT NULL,
    "issuedByUserId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,

    CONSTRAINT "IssuedCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PupilRecord_studentMembershipId_key" ON "PupilRecord"("studentMembershipId");

-- CreateIndex
CREATE INDEX "PupilRecord_schoolId_idx" ON "PupilRecord"("schoolId");

-- CreateIndex
CREATE INDEX "CertificateTemplate_schoolId_kind_idx" ON "CertificateTemplate"("schoolId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateTemplate_schoolId_name_key" ON "CertificateTemplate"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "IssuedCertificate_code_key" ON "IssuedCertificate"("code");

-- CreateIndex
CREATE INDEX "IssuedCertificate_studentMembershipId_idx" ON "IssuedCertificate"("studentMembershipId");

-- CreateIndex
CREATE INDEX "IssuedCertificate_schoolId_issuedAt_idx" ON "IssuedCertificate"("schoolId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IssuedCertificate_schoolId_serial_key" ON "IssuedCertificate"("schoolId", "serial");

-- AddForeignKey
ALTER TABLE "PupilRecord" ADD CONSTRAINT "PupilRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PupilRecord" ADD CONSTRAINT "PupilRecord_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateTemplate" ADD CONSTRAINT "CertificateTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedCertificate" ADD CONSTRAINT "IssuedCertificate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedCertificate" ADD CONSTRAINT "IssuedCertificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedCertificate" ADD CONSTRAINT "IssuedCertificate_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedCertificate" ADD CONSTRAINT "IssuedCertificate_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
