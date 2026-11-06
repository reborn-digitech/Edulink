-- The eighth platform feature, COMPETITIONS (decision 0007, 6 November 2026): the competition marketplace — the
-- platform competitions the content team posts and the crawler suggests, their desk and doors, and the crawler
-- itself. A school's own competitions (calendar events) are never behind it. The code is the contracts' list
-- (packages/contracts v1/platform-features.ts); as the first platform_features migration said, a code added
-- there adds itself to the check here, in the migration that names it. Written by hand: the constraint and the
-- row are not in the Prisma schema, so `prisma migrate diff` has nothing to say about them.

ALTER TABLE "PlatformFeature" DROP CONSTRAINT IF EXISTS "PlatformFeature_code_check";
ALTER TABLE "PlatformFeature" ADD CONSTRAINT "PlatformFeature_code_check"
  CHECK ("code" IN ('ASSISTANT', 'QUESTION_BANK', 'QUESTION_GIG', 'EXPERT_SESSIONS', 'TEACHER_SESSIONS', 'JOB_BOARD', 'TEXT_MESSAGING', 'COMPETITIONS'));

-- Off until the operator switches it on (/root/features), like the seven before it.
INSERT INTO "PlatformFeature" ("code", "enabled") VALUES ('COMPETITIONS', false)
ON CONFLICT ("code") DO NOTHING;
