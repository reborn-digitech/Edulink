-- AlterTable
ALTER TABLE "AcademicYear" ADD COLUMN     "feeReceiptNext" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "feeBankNote" TEXT,
ADD COLUMN     "feeReceiptPrefix" TEXT NOT NULL DEFAULT 'RCPT',
ADD COLUMN     "feeUpiId" TEXT,
ADD COLUMN     "feeUpiPayee" TEXT;

-- CreateTable
CREATE TABLE "FeeHead" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OTHER',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" TEXT,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeInstalment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeInstalment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeLine" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "instalmentId" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,

    CONSTRAINT "FeeLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeePlan" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentFeePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeConcession" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "headId" TEXT,
    "kind" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeConcession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeDemand" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "instalmentId" TEXT,
    "label" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "grossPaise" INTEGER NOT NULL,
    "concessionPaise" INTEGER NOT NULL DEFAULT 0,
    "netPaise" INTEGER NOT NULL,
    "paidPaise" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "linesJson" TEXT NOT NULL DEFAULT '[]',
    "lastReminderKey" TEXT,
    "carriedToDemandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INITIATED',
    "clientId" TEXT,
    "reference" TEXT,
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewayMethod" TEXT,
    "note" TEXT,
    "intentJson" TEXT NOT NULL DEFAULT '[]',
    "payerUserId" TEXT,
    "collectedByUserId" TEXT,
    "confirmedByUserId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversedByUserId" TEXT,
    "reversalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAllocation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,

    CONSTRAINT "FeeAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeReceipt" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "serial" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotJson" TEXT NOT NULL,

    CONSTRAINT "FeeReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRefund" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "gatewayRefundId" TEXT,
    "requestedByUserId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeGatewayAccount" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "keyId" TEXT NOT NULL,
    "secretEnc" TEXT NOT NULL,
    "webhookSecretEnc" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'TEST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeGatewayAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "payloadJson" TEXT NOT NULL,

    CONSTRAINT "GatewayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeeHead_schoolId_retiredAt_idx" ON "FeeHead"("schoolId", "retiredAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeeHead_schoolId_code_key" ON "FeeHead"("schoolId", "code");

-- CreateIndex
CREATE INDEX "FeeStructure_schoolId_academicYearId_idx" ON "FeeStructure"("schoolId", "academicYearId");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYearId_idx" ON "FeeStructure"("academicYearId");

-- CreateIndex
CREATE INDEX "FeeInstalment_structureId_sortOrder_idx" ON "FeeInstalment"("structureId", "sortOrder");

-- CreateIndex
CREATE INDEX "FeeInstalment_schoolId_idx" ON "FeeInstalment"("schoolId");

-- CreateIndex
CREATE INDEX "FeeLine_headId_idx" ON "FeeLine"("headId");

-- CreateIndex
CREATE INDEX "FeeLine_schoolId_idx" ON "FeeLine"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeLine_instalmentId_headId_key" ON "FeeLine"("instalmentId", "headId");

-- CreateIndex
CREATE INDEX "StudentFeePlan_structureId_idx" ON "StudentFeePlan"("structureId");

-- CreateIndex
CREATE INDEX "StudentFeePlan_schoolId_academicYearId_idx" ON "StudentFeePlan"("schoolId", "academicYearId");

-- CreateIndex
CREATE INDEX "StudentFeePlan_academicYearId_idx" ON "StudentFeePlan"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeePlan_studentMembershipId_academicYearId_key" ON "StudentFeePlan"("studentMembershipId", "academicYearId");

-- CreateIndex
CREATE INDEX "FeeConcession_schoolId_studentMembershipId_idx" ON "FeeConcession"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "FeeConcession_studentMembershipId_idx" ON "FeeConcession"("studentMembershipId");

-- CreateIndex
CREATE INDEX "FeeConcession_academicYearId_idx" ON "FeeConcession"("academicYearId");

-- CreateIndex
CREATE INDEX "FeeConcession_headId_idx" ON "FeeConcession"("headId");

-- CreateIndex
CREATE INDEX "FeeConcession_grantedByUserId_idx" ON "FeeConcession"("grantedByUserId");

-- CreateIndex
CREATE INDEX "FeeDemand_schoolId_status_dueDate_idx" ON "FeeDemand"("schoolId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "FeeDemand_schoolId_studentMembershipId_idx" ON "FeeDemand"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "FeeDemand_instalmentId_idx" ON "FeeDemand"("instalmentId");

-- CreateIndex
CREATE INDEX "FeeDemand_academicYearId_idx" ON "FeeDemand"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeDemand_studentMembershipId_instalmentId_key" ON "FeeDemand"("studentMembershipId", "instalmentId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_gatewayOrderId_key" ON "FeePayment"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_gatewayPaymentId_key" ON "FeePayment"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "FeePayment_schoolId_status_createdAt_idx" ON "FeePayment"("schoolId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "FeePayment_schoolId_studentMembershipId_idx" ON "FeePayment"("schoolId", "studentMembershipId");

-- CreateIndex
CREATE INDEX "FeePayment_studentMembershipId_idx" ON "FeePayment"("studentMembershipId");

-- CreateIndex
CREATE INDEX "FeePayment_payerUserId_idx" ON "FeePayment"("payerUserId");

-- CreateIndex
CREATE INDEX "FeePayment_collectedByUserId_idx" ON "FeePayment"("collectedByUserId");

-- CreateIndex
CREATE INDEX "FeePayment_confirmedByUserId_idx" ON "FeePayment"("confirmedByUserId");

-- CreateIndex
CREATE INDEX "FeePayment_reversedByUserId_idx" ON "FeePayment"("reversedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_schoolId_clientId_key" ON "FeePayment"("schoolId", "clientId");

-- CreateIndex
CREATE INDEX "FeeAllocation_paymentId_idx" ON "FeeAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "FeeAllocation_demandId_idx" ON "FeeAllocation"("demandId");

-- CreateIndex
CREATE INDEX "FeeAllocation_schoolId_idx" ON "FeeAllocation"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeReceipt_paymentId_key" ON "FeeReceipt"("paymentId");

-- CreateIndex
CREATE INDEX "FeeReceipt_schoolId_issuedAt_idx" ON "FeeReceipt"("schoolId", "issuedAt");

-- CreateIndex
CREATE INDEX "FeeReceipt_academicYearId_idx" ON "FeeReceipt"("academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeReceipt_schoolId_academicYearId_number_key" ON "FeeReceipt"("schoolId", "academicYearId", "number");

-- CreateIndex
CREATE INDEX "FeeRefund_paymentId_idx" ON "FeeRefund"("paymentId");

-- CreateIndex
CREATE INDEX "FeeRefund_schoolId_idx" ON "FeeRefund"("schoolId");

-- CreateIndex
CREATE INDEX "FeeRefund_requestedByUserId_idx" ON "FeeRefund"("requestedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeGatewayAccount_schoolId_key" ON "FeeGatewayAccount"("schoolId");

-- CreateIndex
CREATE INDEX "GatewayEvent_schoolId_receivedAt_idx" ON "GatewayEvent"("schoolId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayEvent_schoolId_provider_eventId_key" ON "GatewayEvent"("schoolId", "provider", "eventId");

-- AddForeignKey
ALTER TABLE "FeeHead" ADD CONSTRAINT "FeeHead_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInstalment" ADD CONSTRAINT "FeeInstalment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInstalment" ADD CONSTRAINT "FeeInstalment_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_instalmentId_fkey" FOREIGN KEY ("instalmentId") REFERENCES "FeeInstalment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_headId_fkey" FOREIGN KEY ("headId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeePlan" ADD CONSTRAINT "StudentFeePlan_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeePlan" ADD CONSTRAINT "StudentFeePlan_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeePlan" ADD CONSTRAINT "StudentFeePlan_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeePlan" ADD CONSTRAINT "StudentFeePlan_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConcession" ADD CONSTRAINT "FeeConcession_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConcession" ADD CONSTRAINT "FeeConcession_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConcession" ADD CONSTRAINT "FeeConcession_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConcession" ADD CONSTRAINT "FeeConcession_headId_fkey" FOREIGN KEY ("headId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeConcession" ADD CONSTRAINT "FeeConcession_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDemand" ADD CONSTRAINT "FeeDemand_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDemand" ADD CONSTRAINT "FeeDemand_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDemand" ADD CONSTRAINT "FeeDemand_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeDemand" ADD CONSTRAINT "FeeDemand_instalmentId_fkey" FOREIGN KEY ("instalmentId") REFERENCES "FeeInstalment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_payerUserId_fkey" FOREIGN KEY ("payerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_collectedByUserId_fkey" FOREIGN KEY ("collectedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_reversedByUserId_fkey" FOREIGN KEY ("reversedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAllocation" ADD CONSTRAINT "FeeAllocation_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAllocation" ADD CONSTRAINT "FeeAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FeePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAllocation" ADD CONSTRAINT "FeeAllocation_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "FeeDemand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReceipt" ADD CONSTRAINT "FeeReceipt_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReceipt" ADD CONSTRAINT "FeeReceipt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FeePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeReceipt" ADD CONSTRAINT "FeeReceipt_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRefund" ADD CONSTRAINT "FeeRefund_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRefund" ADD CONSTRAINT "FeeRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "FeePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRefund" ADD CONSTRAINT "FeeRefund_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeGatewayAccount" ADD CONSTRAINT "FeeGatewayAccount_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayEvent" ADD CONSTRAINT "GatewayEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
