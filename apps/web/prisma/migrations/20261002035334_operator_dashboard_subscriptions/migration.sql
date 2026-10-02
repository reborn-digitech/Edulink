-- AlterTable
ALTER TABLE "School" ADD COLUMN     "commissionPartnerId" TEXT,
ADD COLUMN     "pocEmail" TEXT,
ADD COLUMN     "pocName" TEXT,
ADD COLUMN     "pocPhone" TEXT,
ADD COLUMN     "pocRole" TEXT,
ADD COLUMN     "subscriptionDueAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionInvoiceRef" TEXT,
ADD COLUMN     "subscriptionInvoicedAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionPaidAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionPaidRef" TEXT,
ADD COLUMN     "subscriptionStartsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT;

-- CreateTable
CREATE TABLE "CommissionPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "percentTenths" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "School_subscriptionDueAt_idx" ON "School"("subscriptionDueAt");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_commissionPartnerId_fkey" FOREIGN KEY ("commissionPartnerId") REFERENCES "CommissionPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
