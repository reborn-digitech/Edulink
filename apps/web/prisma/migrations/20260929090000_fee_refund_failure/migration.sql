-- A refund the gateway fails is put back: the refund keeps what it took off
-- each allocation, and the gateway's reason.
ALTER TABLE "FeeRefund" ADD COLUMN IF NOT EXISTS "cutsJson" TEXT;
ALTER TABLE "FeeRefund" ADD COLUMN IF NOT EXISTS "failedReason" TEXT;
