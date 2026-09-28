-- The pupil's welcome is remembered on the membership, not carried in a URL.
-- Null for everybody already here: the welcome is offered only to a
-- membership made in the last fourteen days, so nobody old is greeted.
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "welcomedAt" TIMESTAMP(3);
