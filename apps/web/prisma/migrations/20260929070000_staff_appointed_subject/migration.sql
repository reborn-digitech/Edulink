-- The subject a teacher was appointed for, as a code the teacher filing can
-- print, where it used to be read out of the designation's words.
ALTER TABLE "StaffRecord" ADD COLUMN IF NOT EXISTS "appointedSubject" TEXT;
