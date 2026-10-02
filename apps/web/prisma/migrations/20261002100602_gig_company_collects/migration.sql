-- The company collects the seat fee, takes its commission with a GST tax invoice and pays the
-- expert from its own bank (decision 0004, second amendment of 2 October 2026). The Route columns
-- of this morning's design go; the columns that only change meaning are RENAMED so nothing is
-- lost: a payout's amount is its net, its transfer count its payment count, a payment's
-- released-at its due-at. A row RELEASED under the old design had already been paid to the expert
-- by the gateway, so it is recorded PAID_OUT and its payout PAID, with a note saying how.

-- AlterTable
ALTER TABLE "ExpertPayout" DROP COLUMN "settlementId",
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paidByUserId" TEXT,
ADD COLUMN     "reference" TEXT,
ALTER COLUMN "status" SET DEFAULT 'OPEN';
ALTER TABLE "ExpertPayout" RENAME COLUMN "amountPaise" TO "netPaise";
ALTER TABLE "ExpertPayout" RENAME COLUMN "transfers" TO "paymentsCount";
UPDATE "ExpertPayout" SET "status" = 'PAID', "paidAt" = "createdAt", "note" = COALESCE("note", 'settled by the gateway under the split design of 2 October 2026') WHERE "status" IN ('RELEASED', 'SETTLED');
UPDATE "ExpertPayout" SET "status" = 'OPEN' WHERE "status" NOT IN ('OPEN', 'PAID');

-- AlterTable
ALTER TABLE "ExpertPayoutAccount" DROP COLUMN "linkedAccountId",
DROP COLUMN "onboardingUrl",
ADD COLUMN     "bankAccountEnc" TEXT,
ADD COLUMN     "bankLast4" TEXT,
ADD COLUMN     "gstStateCode" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "ifsc" TEXT,
ADD COLUMN     "payeeName" TEXT,
ADD COLUMN     "upiId" TEXT;
-- A linked account is no longer a way to be paid: every expert types their payee details afresh.
UPDATE "ExpertPayoutAccount" SET "status" = 'NONE', "note" = NULL;

-- AlterTable
ALTER TABLE "GigSettings" ADD COLUMN     "companyAddress" TEXT,
ADD COLUMN     "companyGstin" TEXT,
ADD COLUMN     "companyLegalName" TEXT,
ADD COLUMN     "companyStateCode" TEXT,
ADD COLUMN     "gstPercent" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "invoicePrefix" TEXT NOT NULL DEFAULT 'SG',
ADD COLUMN     "invoiceSacCode" TEXT NOT NULL DEFAULT '998599';

-- AlterTable
ALTER TABLE "SessionPayment" DROP COLUMN "transferId",
ADD COLUMN     "gstPaise" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "netPaise" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paidOutAt" TIMESTAMP(3),
ADD COLUMN     "receiptNumber" TEXT,
ADD COLUMN     "receiptSerial" INTEGER;
ALTER TABLE "SessionPayment" RENAME COLUMN "releasedAt" TO "dueAt";
-- The net of every existing row is what the old design paid: the gross less the commission, no GST then.
UPDATE "SessionPayment" SET "netPaise" = "amountPaise" - "commissionPaise";
UPDATE "SessionPayment" SET "status" = 'PAID_OUT', "paidOutAt" = "dueAt" WHERE "status" = 'RELEASED';
UPDATE "SessionPayment" SET "pendingAction" = NULL WHERE "pendingAction" = 'RELEASE';

-- CreateTable
CREATE TABLE "GigInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "serial" INTEGER NOT NULL,
    "payoutId" TEXT NOT NULL,
    "expertUserId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "taxableValuePaise" INTEGER NOT NULL,
    "cgstPaise" INTEGER NOT NULL,
    "sgstPaise" INTEGER NOT NULL,
    "igstPaise" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "sacCode" TEXT NOT NULL,
    "sellerJson" TEXT NOT NULL,
    "buyerJson" TEXT NOT NULL,
    "linesJson" TEXT NOT NULL,

    CONSTRAINT "GigInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GigInvoice_number_key" ON "GigInvoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "GigInvoice_payoutId_key" ON "GigInvoice"("payoutId");

-- CreateIndex
CREATE INDEX "GigInvoice_expertUserId_issuedAt_idx" ON "GigInvoice"("expertUserId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GigInvoice_series_serial_key" ON "GigInvoice"("series", "serial");

-- CreateIndex
CREATE UNIQUE INDEX "ExpertPayout_reference_key" ON "ExpertPayout"("reference");

-- CreateIndex
CREATE INDEX "ExpertPayout_status_idx" ON "ExpertPayout"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPayment_receiptNumber_key" ON "SessionPayment"("receiptNumber");

-- AddForeignKey
ALTER TABLE "GigInvoice" ADD CONSTRAINT "GigInvoice_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "ExpertPayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GigInvoice" ADD CONSTRAINT "GigInvoice_expertUserId_fkey" FOREIGN KEY ("expertUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
