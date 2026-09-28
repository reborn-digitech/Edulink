-- Joins by code and guardian claims wait for somebody's yes. Each waits in a
-- table of its own, so that nothing which reads Membership, Enrollment or
-- Guardianship can mistake a request for the thing requested.
CREATE TABLE IF NOT EXISTS "JoinRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "classId" TEXT,
    "via" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedByMembershipId" TEXT,
    CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "JoinRequest_schoolId_status_idx" ON "JoinRequest"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "JoinRequest_userId_idx" ON "JoinRequest"("userId");
CREATE INDEX IF NOT EXISTS "JoinRequest_classId_idx" ON "JoinRequest"("classId");
-- One request waiting per person, school and class: asking twice is asking once.
CREATE UNIQUE INDEX IF NOT EXISTS "JoinRequest_one_pending" ON "JoinRequest"("userId", "schoolId", COALESCE("classId", ''))
  WHERE "status" = 'PENDING';
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "GuardianClaim" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "claimantUserId" TEXT NOT NULL,
    "relation" TEXT NOT NULL DEFAULT 'PARENT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    CONSTRAINT "GuardianClaim_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GuardianClaim_schoolId_status_idx" ON "GuardianClaim"("schoolId", "status");
CREATE INDEX IF NOT EXISTS "GuardianClaim_studentMembershipId_status_idx" ON "GuardianClaim"("studentMembershipId", "status");
CREATE INDEX IF NOT EXISTS "GuardianClaim_claimantUserId_idx" ON "GuardianClaim"("claimantUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "GuardianClaim_one_pending" ON "GuardianClaim"("claimantUserId", "studentMembershipId")
  WHERE "status" = 'PENDING';
ALTER TABLE "GuardianClaim" ADD CONSTRAINT "GuardianClaim_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardianClaim" ADD CONSTRAINT "GuardianClaim_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GuardianClaim" ADD CONSTRAINT "GuardianClaim_claimantUserId_fkey" FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
