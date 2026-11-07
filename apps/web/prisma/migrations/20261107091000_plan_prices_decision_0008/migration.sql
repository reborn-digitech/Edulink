-- Decision 0008 (the owner's decisions of 7 November 2026), the data half, written by hand as the plans and
-- platform_features migrations' rows were: the schema cannot express a row's values.
--
-- 1. THE PRICE LIST: every plan ₹99 a month and ₹999 a year (packages/contracts v1/person-plans.ts
--    PLAN_PRICE_PAISE). The owner's decision fixes the three rows whatever stood (the dev rows carried 199/1,999
--    for a teacher and 499/4,999 for an expert from the operator's page); the operator may change them again on
--    /root/features. `active` is untouched: a plan is asked for only when the operator makes it active.
UPDATE "PersonPlan" SET "pricePaise" = 9900, "yearlyPricePaise" = 99900 WHERE "code" IN ('STUDENT', 'TEACHER', 'EXPERT');

-- 2. THE TEACHER PLAN INCLUDES THE QUESTION BANK (setting work from it for any pupil, worksheets), beside the
--    assistant, the question gig, teaching sessions and the job board. Grants and passes write one entitlement
--    per entry of this list, and the plan card reads it. A row that already names it is left alone.
UPDATE "PersonPlan"
   SET "features" = "features" || '["QUESTION_BANK"]'::jsonb
 WHERE "code" = 'TEACHER'
   AND NOT ("features" @> '["QUESTION_BANK"]'::jsonb);

-- 3. THE COMPANY'S SHARE OF A PAID SEAT IS 20 PERCENT, a teacher's seat and an expert's alike (15 before). The
--    settings row is moved only from the old default: a figure the operator had set by hand would be theirs. The
--    figures already frozen on SessionPayment rows stand as they were made.
UPDATE "GigSettings" SET "commissionPercent" = 20 WHERE "id" = 'gigs' AND "commissionPercent" = 15;
