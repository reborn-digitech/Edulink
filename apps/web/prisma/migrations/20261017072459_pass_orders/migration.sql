-- plans-pay (17 Oct 2026): passes bought through the company's gateway (decision 0006; src/lib/pass-orders.ts).
-- Written by hand rather than by `migrate dev --create-only`: two other builders had schema changes in the tree
-- without their migrations yet, and a generated diff would have carried theirs into this one.

-- CreateTable
CREATE TABLE "PassOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payerUserId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "gstPaise" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "gstPercent" INTEGER NOT NULL,
    "gatewayOrderId" TEXT NOT NULL,
    "gatewayPaymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "paidAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundedByUserId" TEXT,
    "gatewayRefundId" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PassOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PassInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "serial" INTEGER NOT NULL,
    "passOrderId" TEXT NOT NULL,
    "payerUserId" TEXT NOT NULL,
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

    CONSTRAINT "PassInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PassOrder_gatewayOrderId_key" ON "PassOrder"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "PassOrder_gatewayPaymentId_key" ON "PassOrder"("gatewayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PassOrder_invoiceId_key" ON "PassOrder"("invoiceId");

-- CreateIndex
CREATE INDEX "PassOrder_userId_createdAt_idx" ON "PassOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PassOrder_payerUserId_createdAt_idx" ON "PassOrder"("payerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PassOrder_status_paidAt_idx" ON "PassOrder"("status", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "PassInvoice_number_key" ON "PassInvoice"("number");

-- CreateIndex
CREATE UNIQUE INDEX "PassInvoice_passOrderId_key" ON "PassInvoice"("passOrderId");

-- CreateIndex
CREATE INDEX "PassInvoice_payerUserId_issuedAt_idx" ON "PassInvoice"("payerUserId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PassInvoice_series_serial_key" ON "PassInvoice"("series", "serial");

-- Checked strings, not Prisma enums (the PersonPlan precedent): the contracts' lists (v1/passes.ts, v1/person-plans.ts)
-- are the truth, and these hold the table to them.
ALTER TABLE "PassOrder" ADD CONSTRAINT "PassOrder_plan_check" CHECK ("planCode" IN ('STUDENT', 'TEACHER', 'EXPERT'));
ALTER TABLE "PassOrder" ADD CONSTRAINT "PassOrder_period_check" CHECK ("period" IN ('MONTH', 'YEAR'));
ALTER TABLE "PassOrder" ADD CONSTRAINT "PassOrder_status_check" CHECK ("status" IN ('CREATED', 'PAID', 'FAILED', 'REFUNDED'));
ALTER TABLE "PassOrder" ADD CONSTRAINT "PassOrder_money_check" CHECK ("amountPaise" >= 100 AND "gstPaise" >= 0 AND "totalPaise" = "amountPaise" + "gstPaise");
ALTER TABLE "PassOrder" ADD CONSTRAINT "PassOrder_paid_check" CHECK ("status" NOT IN ('PAID', 'REFUNDED') OR ("paidAt" IS NOT NULL AND "gatewayPaymentId" IS NOT NULL));
