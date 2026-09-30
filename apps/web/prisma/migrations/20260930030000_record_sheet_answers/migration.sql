-- The UDISE+ sheet's plain answers the record did not hold: a second number, free uniform and
-- textbooks, extracurricular activity, and the higher secondary's stream and vocational course.
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "alternatePhone" TEXT;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "freeUniform" BOOLEAN;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "freeTextbook" BOOLEAN;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "extracurricular" BOOLEAN;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "stream" TEXT;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "vocationalCourse" BOOLEAN;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "vocationalTradeId" TEXT;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "vocationalJobRoleId" TEXT;
ALTER TABLE "PupilRecord" ADD COLUMN IF NOT EXISTS "vocationalExamAppeared" BOOLEAN;
