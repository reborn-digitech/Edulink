-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "dutiesJson" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Programme" ADD COLUMN     "stream" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "streamsJson" TEXT NOT NULL DEFAULT '[]';

-- A COLLEGE'S STREAMS (5 Oct 2026): the two ZZ colleges and the demo college,
-- the only colleges this tree's scripts make with a known stream. Every other
-- college keeps [] until its registrar chooses (the profile page asks).
UPDATE "School" SET "streamsJson" = '["ARTS","SCIENCE","COMMERCE"]'
  WHERE "slug" IN ('zz-vidya-college', 'saraswati-college') AND "kind" IN ('COLLEGE', 'AUTONOMOUS_COLLEGE') AND "streamsJson" = '[]';
UPDATE "School" SET "streamsJson" = '["ENGINEERING"]'
  WHERE "slug" = 'zz-shastri-college' AND "kind" IN ('COLLEGE', 'AUTONOMOUS_COLLEGE') AND "streamsJson" = '[]';

-- A programme's stream from its college's single stream, where the
-- programme's regulator is one that stream uses (STREAM_PRESETS[…].regulators):
-- an engineering college's UGC commerce programme is left for the registrar.
UPDATE "Programme" p SET "stream" = s."streamsJson"::jsonb ->> 0
  FROM "School" s
  WHERE p."schoolId" = s."id"
    AND p."stream" IS NULL
    AND jsonb_array_length(s."streamsJson"::jsonb) = 1
    AND (s."streamsJson"::jsonb ->> 0, p."regulator") IN (
      ('ARTS', 'UGC'), ('SCIENCE', 'UGC'), ('COMMERCE', 'UGC'), ('VOCATIONAL', 'UGC'),
      ('MANAGEMENT', 'AICTE'), ('MANAGEMENT', 'UGC'),
      ('ENGINEERING', 'AICTE'),
      ('PHARMACY', 'PCI'), ('PHARMACY', 'AICTE'),
      ('LAW', 'BCI'), ('LAW', 'UGC'),
      ('EDUCATION', 'NCTE'),
      ('HEALTH_SCIENCES', 'NMC'), ('HEALTH_SCIENCES', 'DCI'), ('HEALTH_SCIENCES', 'INC'),
      ('ARCHITECTURE', 'COA'),
      ('AGRICULTURE', 'ICAR')
    );
