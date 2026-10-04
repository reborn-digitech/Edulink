-- AlterTable
ALTER TABLE "SchoolRecord" ADD COLUMN     "formerMembershipId" TEXT,
ADD COLUMN     "supersededAt" TIMESTAMP(3),
ADD COLUMN     "supersededReason" TEXT,
ALTER COLUMN "studentMembershipId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "SchoolRecord_formerMembershipId_idx" ON "SchoolRecord"("formerMembershipId");

-- LIFECYCLE-6: ONE TC REGISTER. The leaving record (SchoolRecord) and an issued
-- certificate whose serial starts "TC/" draw their numbers from one series per
-- school and year from now on (school-record.ts, certificates.ts). A record
-- whose serial an issued certificate of ANOTHER pupil already carries takes
-- the next free number of its year in that register — the highest across both
-- tables, plus one — so no serial sits on two papers for two pupils. The same
-- serial on a record and a certificate of the same pupil is one departure on
-- two papers, which is what the register now does on purpose, and is kept.
DO $$
DECLARE
  r RECORD;
  head TEXT;
  n INT;
BEGIN
  FOR r IN
    SELECT sr.id, sr."schoolId", sr.serial
      FROM "SchoolRecord" sr
      JOIN "IssuedCertificate" c ON c."schoolId" = sr."schoolId" AND c.serial = sr.serial
     WHERE c."studentMembershipId" IS DISTINCT FROM sr."studentMembershipId"
     ORDER BY sr."leftAt", sr.id
  LOOP
    head := substring(r.serial from '^(.*/)[0-9]+$');
    CONTINUE WHEN head IS NULL;
    SELECT GREATEST(
      COALESCE((SELECT max(substring(serial from '[0-9]+$')::int) FROM "SchoolRecord" WHERE "schoolId" = r."schoolId" AND left(serial, length(head)) = head), 0),
      COALESCE((SELECT max(substring(serial from '[0-9]+$')::int) FROM "IssuedCertificate" WHERE "schoolId" = r."schoolId" AND left(serial, length(head)) = head), 0)
    ) + 1 INTO n;
    UPDATE "SchoolRecord" SET serial = head || lpad(n::text, 4, '0') WHERE id = r.id;
  END LOOP;
END $$;
