-- CreateTable
CREATE TABLE "PersonPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pricePaise" INTEGER NOT NULL DEFAULT 0,
    "yearlyPricePaise" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedByUserId" TEXT,

    CONSTRAINT "PersonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "planCode" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,
    "grantedByUserId" TEXT,
    "note" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedByUserId" TEXT,
    "endNotedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonPlan_code_key" ON "PersonPlan"("code");

-- CreateIndex
CREATE INDEX "Entitlement_userId_feature_validTo_idx" ON "Entitlement"("userId", "feature", "validTo");

-- CreateIndex
CREATE INDEX "Entitlement_validTo_idx" ON "Entitlement"("validTo");

-- Checked strings, not Prisma enums (the PlatformFeature precedent): the contracts' lists (v1/person-plans.ts,
-- v1/platform-features.ts) are the truth, and these hold the table to them.
ALTER TABLE "PersonPlan" ADD CONSTRAINT "PersonPlan_code_check" CHECK ("code" IN ('STUDENT', 'TEACHER', 'EXPERT'));
ALTER TABLE "PersonPlan" ADD CONSTRAINT "PersonPlan_prices_check" CHECK ("pricePaise" >= 0 AND "yearlyPricePaise" >= 0);
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_feature_check"
  CHECK ("feature" IN ('ASSISTANT', 'QUESTION_BANK', 'QUESTION_GIG', 'EXPERT_SESSIONS', 'TEACHER_SESSIONS', 'JOB_BOARD', 'TEXT_MESSAGING'));
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_source_check" CHECK ("source" IN ('ORDER', 'GRANT', 'SEAT'));
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_plan_check" CHECK ("planCode" IS NULL OR "planCode" IN ('STUDENT', 'TEACHER', 'EXPERT'));
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_window_check" CHECK ("validTo" > "validFrom");

-- The three plans, inactive and at no price until the operator sets them (/root/features). The library also
-- creates a missing row this way on first read.
INSERT INTO "PersonPlan" ("id", "code", "pricePaise", "yearlyPricePaise", "features", "active") VALUES
  ('person-plan-student', 'STUDENT', 0, 0, '["ASSISTANT","QUESTION_BANK"]', false),
  ('person-plan-teacher', 'TEACHER', 0, 0, '["ASSISTANT","QUESTION_GIG","TEACHER_SESSIONS","JOB_BOARD"]', false),
  ('person-plan-expert', 'EXPERT', 0, 0, '["EXPERT_SESSIONS"]', false)
ON CONFLICT ("code") DO NOTHING;
