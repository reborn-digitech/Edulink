-- CreateTable
CREATE TABLE "SchoolSiteDomain" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_DNS',
    "dnsCheckedAt" TIMESTAMP(3),
    "dnsError" TEXT,
    "certStatus" TEXT NOT NULL DEFAULT 'NONE',
    "certCheckedAt" TIMESTAMP(3),
    "certError" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "SchoolSiteDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSiteDomain_domain_key" ON "SchoolSiteDomain"("domain");

-- CreateIndex
CREATE INDEX "SchoolSiteDomain_schoolId_idx" ON "SchoolSiteDomain"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolSiteDomain_status_idx" ON "SchoolSiteDomain"("status");

-- AddForeignKey
ALTER TABLE "SchoolSiteDomain" ADD CONSTRAINT "SchoolSiteDomain_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
