-- The one migration of the testing analysis of 13 November 2026 (applied 14 November 2026), five things:
--
--   TA-016  ClinicalPosting.labBatch ON DELETE NO ACTION (was CASCADE): the database refuses the delete of a lab batch
--           a clinical posting names, so no delete of a batch can take the logbook entries under its postings. NO ACTION
--           and not RESTRICT: it is checked at the end of the statement, so a school's erase and a division's delete,
--           which remove the batch and the posting together through their own cascades, still go through.
--   TA-114  PayrollRun's grossPaise, deductionsPaise, employerPaise and netPaise and PayrollExport.totalPaise become
--           BIGINT: a sum of 32-bit slips does not fit 32 bits (about 2.147 crore rupees was the ceiling).
--   TA-041  PushSubscription.sessionId (nullable), its foreign key to Session ON DELETE CASCADE and its index, the
--           shape DeviceToken has. The column only: no row is deleted and nothing is backfilled (existing rows keep
--           NULL); the code that uses it is a batch of its own.
--   TA-009  ReportCard's unique key gains the academic year: (classId, studentMembershipId, title, academicYearId).
--           academicYearId is nullable (a card built from hand-picked papers has none), and Postgres counts NULLs as
--           different in a unique index unless told otherwise, so the index is NULLS NOT DISTINCT (Postgres 15+).
--           The old key was stricter, so no row can break the new one; no row is deleted.
--   TA-555  StudentConsent is keyed to the guardianship: guardianshipId (nullable, foreign key to Guardianship ON
--           DELETE CASCADE), and the unique key (studentMembershipId, guardianshipId, grant), NULLS NOT DISTINCT,
--           replaces (studentMembershipId, grant).
--           THE ROWS THAT WERE THERE: a grant given before this change stays with the family guardians whose link
--           existed when the student granted it (an ACTIVE Guardianship of that student, not the school's stand-in,
--           created no later than the row's grantedAt): the oldest such link takes the row itself and every other one
--           a copy. A guardian linked after the grant gets no row and starts with nothing. A row no link could take
--           keeps guardianshipId NULL: it is kept as the record and opens nothing to anybody. No row is deleted.
--
-- Derived from `prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel
-- prisma/schema.prisma --script` against the live database (no shadow database), then edited by hand in three places:
-- the two NULLS NOT DISTINCT clauses and the StudentConsent data step. Prisma neither writes nor reads NULLS NOT
-- DISTINCT, so the live-datasource diff prints no change afterwards; keep the clause if the index is ever recreated.

-- ---------------------------------------------------------------------------------------------------------- TA-016

-- DropForeignKey
ALTER TABLE "ClinicalPosting" DROP CONSTRAINT "ClinicalPosting_labBatchId_fkey";

-- AddForeignKey
ALTER TABLE "ClinicalPosting" ADD CONSTRAINT "ClinicalPosting_labBatchId_fkey" FOREIGN KEY ("labBatchId") REFERENCES "LabBatch"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------------------------------------- TA-114

-- AlterTable
ALTER TABLE "PayrollExport" ALTER COLUMN "totalPaise" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "PayrollRun" ALTER COLUMN "grossPaise" SET DATA TYPE BIGINT,
ALTER COLUMN "deductionsPaise" SET DATA TYPE BIGINT,
ALTER COLUMN "employerPaise" SET DATA TYPE BIGINT,
ALTER COLUMN "netPaise" SET DATA TYPE BIGINT;

-- ---------------------------------------------------------------------------------------------------------- TA-041

-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "PushSubscription_sessionId_idx" ON "PushSubscription"("sessionId");

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------------------------------------- TA-009

-- DropIndex
DROP INDEX "ReportCard_classId_studentMembershipId_title_key";

-- CreateIndex (NULLS NOT DISTINCT added by hand: two cards with no year under one title are still one)
CREATE UNIQUE INDEX "ReportCard_classId_studentMembershipId_title_academicYearId_key" ON "ReportCard"("classId", "studentMembershipId", "title", "academicYearId") NULLS NOT DISTINCT;

-- ---------------------------------------------------------------------------------------------------------- TA-555

-- DropIndex
DROP INDEX "StudentConsent_studentMembershipId_grant_key";

-- AlterTable
ALTER TABLE "StudentConsent" ADD COLUMN     "guardianshipId" TEXT;

-- The data step (by hand). StudentConsent is under FORCE ROW LEVEL SECURITY, so a role that is neither a superuser nor
-- BYPASSRLS would see no row here and key nothing while the migration was recorded as applied (TA-243): refused.
DO $$
DECLARE
  before_total integer;
  keyed integer;
  copies integer;
  unkeyed integer;
BEGIN
  IF NOT (SELECT r.rolsuper OR r.rolbypassrls FROM pg_roles r WHERE r.rolname = current_user) THEN
    RAISE EXCEPTION 'TA-555: the migrating role % cannot read StudentConsent past its row-level security; run the migration as the owner (npm run db:migrate)', current_user;
  END IF;

  SELECT count(*) INTO before_total FROM "StudentConsent";

  -- The oldest family link that existed when the grant was given takes the row itself.
  UPDATE "StudentConsent" c
     SET "guardianshipId" = (
           SELECT g."id"
             FROM "Guardianship" g
            WHERE g."studentMembershipId" = c."studentMembershipId"
              AND g."relation" <> 'SCHOOL'
              AND g."status" = 'ACTIVE'
              AND g."createdAt" <= c."grantedAt"
            ORDER BY g."createdAt", g."id"
            LIMIT 1)
   WHERE c."guardianshipId" IS NULL;

  -- Every other family link that existed then gets a copy of the row, with the same times.
  INSERT INTO "StudentConsent" ("id", "schoolId", "studentMembershipId", "guardianshipId", "grant", "grantedAt", "revokedAt")
  SELECT 'c' || substr(md5(c."id" || ':' || g."id"), 1, 24), c."schoolId", c."studentMembershipId", g."id", c."grant", c."grantedAt", c."revokedAt"
    FROM "StudentConsent" c
    JOIN "Guardianship" g
      ON g."studentMembershipId" = c."studentMembershipId"
     AND g."relation" <> 'SCHOOL'
     AND g."status" = 'ACTIVE'
     AND g."createdAt" <= c."grantedAt"
   WHERE c."guardianshipId" IS NOT NULL
     AND g."id" <> c."guardianshipId";
  GET DIAGNOSTICS copies = ROW_COUNT;

  SELECT count(*) FILTER (WHERE "guardianshipId" IS NOT NULL), count(*) FILTER (WHERE "guardianshipId" IS NULL) INTO keyed, unkeyed FROM "StudentConsent";
  IF keyed + unkeyed <> before_total + copies THEN
    RAISE EXCEPTION 'TA-555: StudentConsent held % rows and now holds %, with % copies made; no grant may vanish', before_total, keyed + unkeyed, copies;
  END IF;
  RAISE NOTICE 'TA-555: StudentConsent held % rows; % are now keyed to a guardianship (% of them copies for a second guardian) and % keep none', before_total, keyed, copies, unkeyed;
END $$;

-- CreateIndex
CREATE INDEX "StudentConsent_guardianshipId_idx" ON "StudentConsent"("guardianshipId");

-- CreateIndex (NULLS NOT DISTINCT added by hand: a row with no guardianship is one per student and grant too)
CREATE UNIQUE INDEX "StudentConsent_studentMembershipId_guardianshipId_grant_key" ON "StudentConsent"("studentMembershipId", "guardianshipId", "grant") NULLS NOT DISTINCT;

-- AddForeignKey
ALTER TABLE "StudentConsent" ADD CONSTRAINT "StudentConsent_guardianshipId_fkey" FOREIGN KEY ("guardianshipId") REFERENCES "Guardianship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
