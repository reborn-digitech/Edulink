-- Decision 0004, third amendment (2 October 2026): paid seats through Razorpay Route, the expert's
-- share a transfer ON HOLD to their linked account. Rows made under the second amendment keep
-- path COMPANY; every new row is ROUTE.

-- The expert's linked account and the details it is made from.
ALTER TABLE "ExpertPayoutAccount"
  ADD COLUMN "panEnc" TEXT,
  ADD COLUMN "panLast4" TEXT,
  ADD COLUMN "addressLine" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "linkedAccountId" TEXT,
  ADD COLUMN "stakeholderId" TEXT,
  ADD COLUMN "routeProductId" TEXT,
  ADD COLUMN "routeStatus" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "routeRequirements" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN "routeSubmittedKey" TEXT,
  ADD COLUMN "routeCheckedAt" TIMESTAMP(3),
  ADD COLUMN "routeError" TEXT;
CREATE UNIQUE INDEX "ExpertPayoutAccount_linkedAccountId_key" ON "ExpertPayoutAccount"("linkedAccountId");

-- The payment's path and its held transfer.
ALTER TABLE "SessionPayment"
  ADD COLUMN "path" TEXT NOT NULL DEFAULT 'COMPANY',
  ADD COLUMN "transferId" TEXT,
  ADD COLUMN "releasedAt" TIMESTAMP(3);
ALTER TABLE "SessionPayment" ALTER COLUMN "path" SET DEFAULT 'ROUTE';
CREATE UNIQUE INDEX "SessionPayment_transferId_key" ON "SessionPayment"("transferId");
