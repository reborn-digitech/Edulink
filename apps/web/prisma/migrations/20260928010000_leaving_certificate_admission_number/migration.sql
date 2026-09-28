-- The leaving certificate printed the platform's student code as its
-- "admission number", beside the date of birth. The two together are what a
-- guardian's claim asks for, and what a receiving school's intake accepted to
-- attach a pupil's existing account; a certificate is a paper that changes
-- hands. The line now carries the school's own admission register number,
-- which opens nothing, and the code leaves the record altogether.
ALTER TABLE "SchoolRecord" ADD COLUMN IF NOT EXISTS "admissionNumber" TEXT;

-- Certificates already issued take the register number the school holds for
-- the pupil today; where the school has none the line prints a dash.
UPDATE "SchoolRecord" sr
   SET "admissionNumber" = pr."admissionNumber"
  FROM "PupilRecord" pr
 WHERE pr."studentMembershipId" = sr."studentMembershipId"
   AND sr."admissionNumber" IS NULL;

ALTER TABLE "SchoolRecord" DROP COLUMN IF EXISTS "studentCode";
