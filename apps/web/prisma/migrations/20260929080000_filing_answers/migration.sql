-- Three answers the UDISE+ sheet used to guess: whether the pupil repeats
-- the class, whether they were admitted under the RTE quota, and whether
-- anybody has asked about an impairment (cwsnType 'NONE' is "asked, none";
-- a blank is "not asked", and is filed blank). No existing row is given an
-- answer nobody gave.
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "repeating" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "rte" BOOLEAN;
