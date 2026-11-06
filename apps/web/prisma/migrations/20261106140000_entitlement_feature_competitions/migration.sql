-- COMPETITIONS in the STUDENT plan (decision 0007, 6 November 2026; packages/contracts v1/person-plans.ts
-- PLAN_FEATURES): an entitlement may name the eighth feature, and the STUDENT plan row, from which grants and
-- passes write their entitlements and the plan card reads what the plan includes, lists it beside the assistant
-- and the question bank. A row that already names it is left alone. Written by hand, as the plans migration's
-- checks were: the constraint and the row's list are not in the Prisma schema.

ALTER TABLE "Entitlement" DROP CONSTRAINT IF EXISTS "Entitlement_feature_check";
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_feature_check"
  CHECK ("feature" IN ('ASSISTANT', 'QUESTION_BANK', 'QUESTION_GIG', 'EXPERT_SESSIONS', 'TEACHER_SESSIONS', 'JOB_BOARD', 'TEXT_MESSAGING', 'COMPETITIONS'));

UPDATE "PersonPlan"
   SET "features" = "features" || '["COMPETITIONS"]'::jsonb
 WHERE "code" = 'STUDENT'
   AND NOT ("features" @> '["COMPETITIONS"]'::jsonb);
