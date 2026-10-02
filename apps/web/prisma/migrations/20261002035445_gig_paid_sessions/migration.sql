-- AlterTable
ALTER TABLE "GigBooking" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GigSettings" ADD COLUMN     "commissionPercent" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "paymentsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seatPriceMaxPaise" INTEGER NOT NULL DEFAULT 30000,
ADD COLUMN     "seatPriceMinPaise" INTEGER NOT NULL DEFAULT 5000;

-- CreateTable
CREATE TABLE "ExpertPayoutAccount" (
    "expertUserId" TEXT NOT NULL,
    "linkedAccountId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NONE',
    "onboardingUrl" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertPayoutAccount_pkey" PRIMARY KEY ("expertUserId")
);

-- CreateTable
CREATE TABLE "SessionPayment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "payerUserId" TEXT NOT NULL,
    "expertUserId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "commissionPaise" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "paymentId" TEXT,
    "transferId" TEXT,
    "refundId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "holdUntil" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "pendingAction" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "payoutId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpertPayout" (
    "id" TEXT NOT NULL,
    "expertUserId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "transfers" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RELEASED',
    "settlementId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GigGatewayEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "payloadJson" TEXT NOT NULL,

    CONSTRAINT "GigGatewayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionPayment_bookingId_key" ON "SessionPayment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPayment_orderId_key" ON "SessionPayment"("orderId");

-- CreateIndex
CREATE INDEX "SessionPayment_expertUserId_status_idx" ON "SessionPayment"("expertUserId", "status");

-- CreateIndex
CREATE INDEX "SessionPayment_payerUserId_createdAt_idx" ON "SessionPayment"("payerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SessionPayment_status_holdUntil_idx" ON "SessionPayment"("status", "holdUntil");

-- CreateIndex
CREATE INDEX "SessionPayment_pendingAction_idx" ON "SessionPayment"("pendingAction");

-- CreateIndex
CREATE INDEX "ExpertPayout_expertUserId_createdAt_idx" ON "ExpertPayout"("expertUserId", "createdAt");

-- CreateIndex
CREATE INDEX "GigGatewayEvent_receivedAt_idx" ON "GigGatewayEvent"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GigGatewayEvent_provider_eventId_key" ON "GigGatewayEvent"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "ExpertPayoutAccount" ADD CONSTRAINT "ExpertPayoutAccount_expertUserId_fkey" FOREIGN KEY ("expertUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "GigBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "GigSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_expertUserId_fkey" FOREIGN KEY ("expertUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "ExpertPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpertPayout" ADD CONSTRAINT "ExpertPayout_expertUserId_fkey" FOREIGN KEY ("expertUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
