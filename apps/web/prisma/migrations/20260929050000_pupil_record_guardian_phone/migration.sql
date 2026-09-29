-- The family's contact number on the pupil's record, entered by the office or
-- the family. Not the account's phone, which is a sign-in factor.
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "guardianPhone" TEXT;
