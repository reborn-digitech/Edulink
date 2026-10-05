-- CreateTable
CREATE TABLE "IqacScenario" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'NAAC',
    "cycleId" TEXT,
    "year" INTEGER,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "inputsJson" TEXT NOT NULL DEFAULT '{}',
    "cgpa" DOUBLE PRECISION,
    "marks" DOUBLE PRECISION,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IqacScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IqacScenario_schoolId_kind_createdAt_idx" ON "IqacScenario"("schoolId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "IqacScenario_cycleId_idx" ON "IqacScenario"("cycleId");

-- AddForeignKey
ALTER TABLE "IqacScenario" ADD CONSTRAINT "IqacScenario_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IqacScenario" ADD CONSTRAINT "IqacScenario_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AccreditationCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
