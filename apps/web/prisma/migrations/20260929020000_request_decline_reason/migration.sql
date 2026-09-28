-- A decline may carry a sentence for the asker. EXPIRED joins the statuses
-- (a request nobody decided in thirty days); the status column is text, so
-- it needs no change here.
ALTER TABLE "JoinRequest" ADD COLUMN IF NOT EXISTS "declineReason" TEXT;
ALTER TABLE "GuardianClaim" ADD COLUMN IF NOT EXISTS "declineReason" TEXT;
