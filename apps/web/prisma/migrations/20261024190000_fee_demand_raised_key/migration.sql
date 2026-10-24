-- QA-07 (QA campaign of 24 October 2026): a college's mess bill and route fee are raised once per student, and
-- "once" was decided on the demand's label, a sentence translated into the presser's language, so a month billed
-- in English and again in Hindi was billed twice. The charge now carries a language-free key ("MESS:2026-10",
-- "ROUTE:<year>:<route>:<term>"), unique per student so two presses at once raise one. Null for every other
-- demand (Postgres lets nulls repeat under a unique index); rows raised before this keep their label check.

-- AlterTable
ALTER TABLE "FeeDemand" ADD COLUMN     "raisedKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FeeDemand_studentMembershipId_raisedKey_key" ON "FeeDemand"("studentMembershipId", "raisedKey");
