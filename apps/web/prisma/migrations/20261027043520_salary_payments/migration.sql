-- owner-batch-item2b (27 October 2026): UPI joins the payment modes (the member of staff's sealed UPI id on StaffSalary),
-- a run becomes PAID once every slip with money due has a recorded payment, and SalaryPayment is the school's record
-- of how it paid each slip (one live payment per slip by the unique liveSlipId, one transfer per UTR by liveUtr).
-- AlterTable
ALTER TABLE "PayrollRun" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StaffSalary" ADD COLUMN     "upiMasked" TEXT,
ADD COLUMN     "upiSealed" TEXT;

-- CreateTable
CREATE TABLE "SalaryPayment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "payslipId" TEXT NOT NULL,
    "liveSlipId" TEXT,
    "mode" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "paidOnKey" TEXT NOT NULL,
    "reference" TEXT,
    "liveUtr" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "recordedByMembershipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voidedAt" TIMESTAMP(3),
    "voidedByMembershipId" TEXT,
    "voidReason" TEXT,

    CONSTRAINT "SalaryPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryPayment_liveSlipId_key" ON "SalaryPayment"("liveSlipId");

-- CreateIndex
CREATE INDEX "SalaryPayment_schoolId_idx" ON "SalaryPayment"("schoolId");

-- CreateIndex
CREATE INDEX "SalaryPayment_runId_idx" ON "SalaryPayment"("runId");

-- CreateIndex
CREATE INDEX "SalaryPayment_payslipId_idx" ON "SalaryPayment"("payslipId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryPayment_schoolId_liveUtr_key" ON "SalaryPayment"("schoolId", "liveUtr");

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
