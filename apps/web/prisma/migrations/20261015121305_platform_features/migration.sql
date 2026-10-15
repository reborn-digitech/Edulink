-- CreateTable
CREATE TABLE "PlatformFeature" (
    "code" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "changedAt" TIMESTAMP(3),
    "changedByUserId" TEXT,

    CONSTRAINT "PlatformFeature_pkey" PRIMARY KEY ("code")
);

-- The code is one of the contracts' list (packages/contracts v1/platform-features.ts); a code added there
-- adds itself here in the migration that names it.
ALTER TABLE "PlatformFeature" ADD CONSTRAINT "PlatformFeature_code_check"
  CHECK ("code" IN ('ASSISTANT', 'QUESTION_BANK', 'QUESTION_GIG', 'EXPERT_SESSIONS', 'TEACHER_SESSIONS', 'JOB_BOARD', 'TEXT_MESSAGING'));

-- Every feature starts OFF (the owner's ask of 15 October 2026); the library also creates a missing row on first read.
INSERT INTO "PlatformFeature" ("code", "enabled") VALUES
  ('ASSISTANT', false), ('QUESTION_BANK', false), ('QUESTION_GIG', false), ('EXPERT_SESSIONS', false),
  ('TEACHER_SESSIONS', false), ('JOB_BOARD', false), ('TEXT_MESSAGING', false)
ON CONFLICT ("code") DO NOTHING;
