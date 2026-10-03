-- Inventory and assets, and HR and payroll: the INVENTORY and PAYROLL modules (the owner's
-- decision of 3 October 2026). Seventeen school tables, each with schoolId; their row-level
-- policies come from prisma/rls.sql (npm run rls:generate, applied by npm run db:grants).
-- CreateTable
CREATE TABLE "InventoryCategory" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "depreciationRateBp" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "gstin" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "categoryId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "kind" TEXT NOT NULL DEFAULT 'CONSUMABLE',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryStock" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "toMembershipId" TEXT,
    "toRoom" TEXT,
    "toDepartment" TEXT,
    "reference" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "purchaseRecordId" TEXT,
    "requestId" TEXT,
    "byUserId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "itemId" TEXT,
    "categoryId" TEXT,
    "vendorId" TEXT,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "costPaise" INTEGER NOT NULL DEFAULT 0,
    "warrantyUntil" TIMESTAMP(3),
    "location" TEXT NOT NULL,
    "custodianMembershipId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_STORE',
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "depreciationMethod" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
    "depreciationRateBp" INTEGER,
    "lastAuditedAt" TIMESTAMP(3),
    "disposedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "byUserId" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "invoiceRef" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "linesJson" TEXT NOT NULL DEFAULT '[]',
    "totalPaise" INTEGER NOT NULL,
    "billFileId" TEXT,
    "note" TEXT NOT NULL DEFAULT '',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "requesterMembershipId" TEXT NOT NULL,
    "itemId" TEXT,
    "itemText" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollSettings" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "pfEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pfOnFullBasic" BOOLEAN NOT NULL DEFAULT false,
    "esiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ptState" TEXT NOT NULL DEFAULT 'MH',
    "employerName" TEXT NOT NULL DEFAULT '',
    "pfEstablishmentCode" TEXT NOT NULL DEFAULT '',
    "esiEmployerCode" TEXT NOT NULL DEFAULT '',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryComponent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL,
    "formula" TEXT NOT NULL DEFAULT 'FIXED',
    "value" INTEGER NOT NULL DEFAULT 0,
    "statutory" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SalaryComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSalary" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "effectiveFromKey" TEXT NOT NULL,
    "basicPaise" INTEGER NOT NULL,
    "overridesJson" TEXT NOT NULL DEFAULT '{}',
    "pfUan" TEXT,
    "esiNumber" TEXT,
    "panSealed" TEXT,
    "panLast4" TEXT,
    "bankAccountSealed" TEXT,
    "bankLast4" TEXT,
    "bankIfsc" TEXT,
    "bankName" TEXT,
    "paymentMode" TEXT NOT NULL DEFAULT 'BANK',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffSalary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "headcount" INTEGER NOT NULL DEFAULT 0,
    "grossPaise" INTEGER NOT NULL DEFAULT 0,
    "deductionsPaise" INTEGER NOT NULL DEFAULT 0,
    "employerPaise" INTEGER NOT NULL DEFAULT 0,
    "netPaise" INTEGER NOT NULL DEFAULT 0,
    "lockDigest" TEXT,
    "sharedWithPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" TEXT,
    "lockedByUserId" TEXT,
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "designation" TEXT,
    "daysInMonth" INTEGER NOT NULL,
    "lopHalfDays" INTEGER NOT NULL DEFAULT 0,
    "lopOverrideHalfDays" INTEGER,
    "linesJson" TEXT NOT NULL DEFAULT '[]',
    "grossPaise" INTEGER NOT NULL DEFAULT 0,
    "deductionsPaise" INTEGER NOT NULL DEFAULT 0,
    "employerPaise" INTEGER NOT NULL DEFAULT 0,
    "netPaise" INTEGER NOT NULL DEFAULT 0,
    "arrearsPaise" INTEGER NOT NULL DEFAULT 0,
    "tdsOverridePaise" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "paymentMode" TEXT NOT NULL DEFAULT 'BANK',
    "bankLast4" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollExport" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAdvance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "monthlyRecoveryPaise" INTEGER,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffAdvance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCategory_schoolId_name_key" ON "InventoryCategory"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_schoolId_name_key" ON "Vendor"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_schoolId_code_key" ON "InventoryItem"("schoolId", "code");

-- CreateIndex
CREATE INDEX "InventoryStock_schoolId_idx" ON "InventoryStock"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryStock_itemId_location_key" ON "InventoryStock"("itemId", "location");

-- CreateIndex
CREATE INDEX "StockMovement_schoolId_at_idx" ON "StockMovement"("schoolId", "at");

-- CreateIndex
CREATE INDEX "StockMovement_itemId_location_idx" ON "StockMovement"("itemId", "location");

-- CreateIndex
CREATE INDEX "StockMovement_toMembershipId_idx" ON "StockMovement"("toMembershipId");

-- CreateIndex
CREATE INDEX "Asset_custodianMembershipId_idx" ON "Asset"("custodianMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_schoolId_tagNumber_key" ON "Asset"("schoolId", "tagNumber");

-- CreateIndex
CREATE INDEX "AssetEvent_assetId_at_idx" ON "AssetEvent"("assetId", "at");

-- CreateIndex
CREATE INDEX "AssetEvent_schoolId_idx" ON "AssetEvent"("schoolId");

-- CreateIndex
CREATE INDEX "PurchaseRecord_schoolId_dateKey_idx" ON "PurchaseRecord"("schoolId", "dateKey");

-- CreateIndex
CREATE INDEX "InventoryRequest_schoolId_status_idx" ON "InventoryRequest"("schoolId", "status");

-- CreateIndex
CREATE INDEX "InventoryRequest_requesterMembershipId_idx" ON "InventoryRequest"("requesterMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollSettings_schoolId_key" ON "PayrollSettings"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_schoolId_name_key" ON "SalaryStructure"("schoolId", "name");

-- CreateIndex
CREATE INDEX "SalaryComponent_schoolId_idx" ON "SalaryComponent"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryComponent_structureId_code_key" ON "SalaryComponent"("structureId", "code");

-- CreateIndex
CREATE INDEX "StaffSalary_schoolId_idx" ON "StaffSalary"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSalary_membershipId_effectiveFromKey_key" ON "StaffSalary"("membershipId", "effectiveFromKey");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_schoolId_month_key" ON "PayrollRun"("schoolId", "month");

-- CreateIndex
CREATE INDEX "Payslip_schoolId_idx" ON "Payslip"("schoolId");

-- CreateIndex
CREATE INDEX "Payslip_membershipId_idx" ON "Payslip"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_runId_membershipId_key" ON "Payslip"("runId", "membershipId");

-- CreateIndex
CREATE INDEX "PayrollExport_runId_idx" ON "PayrollExport"("runId");

-- CreateIndex
CREATE INDEX "PayrollExport_schoolId_idx" ON "PayrollExport"("schoolId");

-- CreateIndex
CREATE INDEX "StaffAdvance_schoolId_status_idx" ON "StaffAdvance"("schoolId", "status");

-- CreateIndex
CREATE INDEX "StaffAdvance_membershipId_idx" ON "StaffAdvance"("membershipId");

-- AddForeignKey
ALTER TABLE "InventoryCategory" ADD CONSTRAINT "InventoryCategory_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryStock" ADD CONSTRAINT "InventoryStock_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_toMembershipId_fkey" FOREIGN KEY ("toMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_purchaseRecordId_fkey" FOREIGN KEY ("purchaseRecordId") REFERENCES "PurchaseRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "InventoryCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_custodianMembershipId_fkey" FOREIGN KEY ("custodianMembershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRecord" ADD CONSTRAINT "PurchaseRecord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRecord" ADD CONSTRAINT "PurchaseRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryRequest" ADD CONSTRAINT "InventoryRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryRequest" ADD CONSTRAINT "InventoryRequest_requesterMembershipId_fkey" FOREIGN KEY ("requesterMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryRequest" ADD CONSTRAINT "InventoryRequest_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollSettings" ADD CONSTRAINT "PayrollSettings_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryComponent" ADD CONSTRAINT "SalaryComponent_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "SalaryStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSalary" ADD CONSTRAINT "StaffSalary_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSalary" ADD CONSTRAINT "StaffSalary_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSalary" ADD CONSTRAINT "StaffSalary_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollExport" ADD CONSTRAINT "PayrollExport_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollExport" ADD CONSTRAINT "PayrollExport_runId_fkey" FOREIGN KEY ("runId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAdvance" ADD CONSTRAINT "StaffAdvance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAdvance" ADD CONSTRAINT "StaffAdvance_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
