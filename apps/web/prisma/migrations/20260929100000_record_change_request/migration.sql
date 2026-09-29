-- A family's ask to change the pupil record. The record is the office's to
-- write; the family reads it and proposes, and the office applies or declines.
CREATE TABLE IF NOT EXISTS "RecordChangeRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "byPupil" BOOLEAN NOT NULL DEFAULT false,
    "changesJson" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RecordChangeRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RecordChangeRequest_schoolId_status_createdAt_idx" ON "RecordChangeRequest"("schoolId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "RecordChangeRequest_studentMembershipId_status_idx" ON "RecordChangeRequest"("studentMembershipId", "status");
-- One request waiting per pupil: asking again replaces it.
CREATE UNIQUE INDEX IF NOT EXISTS "RecordChangeRequest_one_pending" ON "RecordChangeRequest"("studentMembershipId") WHERE "status" = 'PENDING';
ALTER TABLE "RecordChangeRequest" ADD CONSTRAINT "RecordChangeRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecordChangeRequest" ADD CONSTRAINT "RecordChangeRequest_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
