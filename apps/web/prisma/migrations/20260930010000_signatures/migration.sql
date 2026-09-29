-- Signatures and the school's seal as pictures, and the copy each issued
-- paper keeps of the ones drawn on it.
CREATE TABLE IF NOT EXISTS "SignatureImage" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'PERSON',
    "membershipId" TEXT,
    "png" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SignatureImage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SignatureImage_membershipId_key" ON "SignatureImage"("membershipId");
CREATE INDEX IF NOT EXISTS "SignatureImage_schoolId_kind_idx" ON "SignatureImage"("schoolId", "kind");
-- One seal per school.
CREATE UNIQUE INDEX IF NOT EXISTS "SignatureImage_one_seal" ON "SignatureImage"("schoolId") WHERE "kind" = 'SEAL';
ALTER TABLE "SignatureImage" ADD CONSTRAINT "SignatureImage_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "PaperSignature" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "paperKind" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "signerUserId" TEXT,
    "signerName" TEXT,
    "png" BYTEA,
    "requestedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaperSignature_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PaperSignature_paperKind_paperId_slot_key" ON "PaperSignature"("paperKind", "paperId", "slot");
CREATE INDEX IF NOT EXISTS "PaperSignature_schoolId_status_role_idx" ON "PaperSignature"("schoolId", "status", "role");
ALTER TABLE "PaperSignature" ADD CONSTRAINT "PaperSignature_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
