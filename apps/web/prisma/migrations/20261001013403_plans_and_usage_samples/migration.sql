-- AlterTable
ALTER TABLE "School" ADD COLUMN     "planId" TEXT,
ADD COLUMN     "planSince" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pupilCap" INTEGER,
    "messageCap" INTEGER,
    "storageCapMb" INTEGER,
    "priceMonthlyPaise" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageSample" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "pupils" INTEGER NOT NULL,
    "messages" INTEGER NOT NULL,
    "storageMb" INTEGER NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageSample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "UsageSample_month_idx" ON "UsageSample"("month");

-- CreateIndex
CREATE UNIQUE INDEX "UsageSample_schoolId_month_key" ON "UsageSample"("schoolId", "month");

-- AddForeignKey
ALTER TABLE "School" ADD CONSTRAINT "School_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageSample" ADD CONSTRAINT "UsageSample_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
