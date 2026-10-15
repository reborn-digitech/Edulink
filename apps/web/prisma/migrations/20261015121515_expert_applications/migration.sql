-- CreateTable
CREATE TABLE "ExpertApplication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "organisation" TEXT,
    "headline" TEXT NOT NULL,
    "specialisms" TEXT NOT NULL DEFAULT '[]',
    "languages" TEXT NOT NULL DEFAULT '[]',
    "yearsExperience" INTEGER NOT NULL,
    "bio" TEXT NOT NULL,
    "links" TEXT NOT NULL DEFAULT '[]',
    "offering" TEXT NOT NULL,
    "documentFileId" TEXT,
    "declarationAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refusalCode" TEXT,
    "refusalNote" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByUserId" TEXT,
    "createdUserId" TEXT,
    "inviteId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpertApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpertApplication_status_createdAt_idx" ON "ExpertApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ExpertApplication_email_idx" ON "ExpertApplication"("email");

-- CreateIndex
CREATE INDEX "ExpertApplication_inviteId_idx" ON "ExpertApplication"("inviteId");

-- One open application per address (src/lib/expert-applications.ts refuses a second with a sentence; this is
-- the race's answer): unique while PENDING, so a refused or approved applicant may apply again.
CREATE UNIQUE INDEX IF NOT EXISTS "ExpertApplication_one_pending" ON "ExpertApplication"("email") WHERE "status" = 'PENDING';

-- The coded lists, held by the database as well as by the library.
ALTER TABLE "ExpertApplication" ADD CONSTRAINT "ExpertApplication_status_check"
  CHECK ("status" IN ('PENDING', 'APPROVED', 'REFUSED', 'WITHDRAWN'));
ALTER TABLE "ExpertApplication" ADD CONSTRAINT "ExpertApplication_refusalCode_check"
  CHECK ("refusalCode" IS NULL OR "refusalCode" IN ('NOT_QUALIFIED', 'DOCUMENT_UNCLEAR', 'DUPLICATE', 'OTHER'));
ALTER TABLE "ExpertApplication" ADD CONSTRAINT "ExpertApplication_offering_check"
  CHECK ("offering" IN ('SESSIONS', 'MENTORING', 'BOTH'));
