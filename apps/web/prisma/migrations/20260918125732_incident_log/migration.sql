-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "reportedByMembershipId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MINOR',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "place" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionTaken" TEXT NOT NULL DEFAULT '',
    "guardiansNotifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentNote" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Incident_schoolId_status_occurredAt_idx" ON "Incident"("schoolId", "status", "occurredAt");

-- CreateIndex
CREATE INDEX "Incident_schoolId_studentMembershipId_occurredAt_idx" ON "Incident"("schoolId", "studentMembershipId", "occurredAt");

-- CreateIndex
CREATE INDEX "Incident_reportedByMembershipId_idx" ON "Incident"("reportedByMembershipId");

-- CreateIndex
CREATE INDEX "IncidentNote_incidentId_createdAt_idx" ON "IncidentNote"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "IncidentNote_schoolId_idx" ON "IncidentNote"("schoolId");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_reportedByMembershipId_fkey" FOREIGN KEY ("reportedByMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentNote" ADD CONSTRAINT "IncidentNote_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentNote" ADD CONSTRAINT "IncidentNote_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
