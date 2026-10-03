-- The alumni module (the owner's decision of 3 October 2026): a room staff may close, a
-- former pupil's directory entry and the office's flags, and notes to a batch of alumni.
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedByUserId" TEXT;

-- CreateTable
CREATE TABLE "AlumniProfile" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listed" BOOLEAN NOT NULL DEFAULT false,
    "listedAt" TIMESTAMP(3),
    "city" TEXT,
    "occupation" TEXT,
    "contactPref" TEXT NOT NULL DEFAULT 'OFFICE',
    "mentor" BOOLEAN NOT NULL DEFAULT false,
    "mentorAt" TIMESTAMP(3),
    "mentorByUserId" TEXT,
    "mutedAt" TIMESTAMP(3),
    "mutedByUserId" TEXT,
    "muteReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlumniProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlumniNote" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "batchYear" INTEGER,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentByUserId" TEXT NOT NULL,
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlumniNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlumniProfile_membershipId_key" ON "AlumniProfile"("membershipId");

-- CreateIndex
CREATE INDEX "AlumniProfile_schoolId_listed_idx" ON "AlumniProfile"("schoolId", "listed");

-- CreateIndex
CREATE INDEX "AlumniNote_schoolId_createdAt_idx" ON "AlumniNote"("schoolId", "createdAt");

-- AddForeignKey
ALTER TABLE "AlumniProfile" ADD CONSTRAINT "AlumniProfile_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniProfile" ADD CONSTRAINT "AlumniProfile_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlumniNote" ADD CONSTRAINT "AlumniNote_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- THE PUPILS WHO LEFT BEFORE THE ALUMNI MODULE get the ALUMNUS membership a
-- departure now opens (src/lib/alumni-membership.ts), from the day they left:
-- a STUDENT membership with leftAt set at a school that has ALUMNI on and has
-- not been closed, and no ALUMNUS row there yet (the unique key would refuse
-- a second). A pupil back on the roll has leftAt null on the same STUDENT row
-- (one row per person, school and role), so they are not matched.
INSERT INTO "Membership" ("id", "userId", "schoolId", "role", "status", "joinedAt")
SELECT 'alum_' || md5(random()::text || m."id"), m."userId", m."schoolId", 'ALUMNUS', 'ACTIVE', m."leftAt"
FROM "Membership" m
JOIN "School" s ON s."id" = m."schoolId" AND s."removedAt" IS NULL
WHERE m."role" = 'STUDENT'
  AND m."leftAt" IS NOT NULL
  AND EXISTS (SELECT 1 FROM "SchoolModule" sm WHERE sm."schoolId" = m."schoolId" AND sm."module" = 'ALUMNI')
  AND NOT EXISTS (SELECT 1 FROM "Membership" a WHERE a."userId" = m."userId" AND a."schoolId" = m."schoolId" AND a."role" = 'ALUMNUS')
ON CONFLICT ("userId", "schoolId", "role") DO NOTHING;
