-- The collection gaps the data-flow audit named: the previous school's TC, the household,
-- the roll number the school assigned, and the teacher's own two dates.
ALTER TABLE "PupilRecord" ADD COLUMN "previousSchoolTcNumber" TEXT,
                          ADD COLUMN "previousSchoolTcDate" TIMESTAMP(3),
                          ADD COLUMN "fatherOccupation" TEXT,
                          ADD COLUMN "motherOccupation" TEXT,
                          ADD COLUMN "annualIncome" INTEGER;
ALTER TABLE "Enrollment" ADD COLUMN "rollNumber" INTEGER;
ALTER TABLE "StaffRecord" ADD COLUMN "birthdate" TIMESTAMP(3),
                          ADD COLUMN "serviceJoinedOn" TIMESTAMP(3);

-- Membership.gradeLevel was read by the fee reports, certificates and the GRADE audience and
-- written by nothing in the app. Backfill it from the pupil's live class; the app keeps it in
-- step from here on (src/lib/grade-level.ts).
UPDATE "Membership" m
SET "gradeLevel" = c."gradeLevel"
FROM "Enrollment" e
JOIN "Class" c ON c."id" = e."classId"
WHERE e."studentMembershipId" = m."id"
  AND e."status" = 'ACTIVE'
  AND m."role" = 'STUDENT'
  AND c."gradeLevel" IS NOT NULL
  AND (m."gradeLevel" IS NULL OR m."gradeLevel" <> c."gradeLevel");
