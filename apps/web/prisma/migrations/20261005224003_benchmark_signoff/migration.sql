-- G4-15 (risks batch, 5 Oct 2026): the IQAC coordinator's signature on the platform's benchmark list.
ALTER TABLE "School" ADD COLUMN "benchmarksSignedVersion" TEXT,
ADD COLUMN "benchmarksSignedAt" TIMESTAMP(3),
ADD COLUMN "benchmarksSignedByUserId" TEXT;
