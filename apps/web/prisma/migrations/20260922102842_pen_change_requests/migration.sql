-- CreateTable
CREATE TABLE "PenChangeRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "fromPen" TEXT,
    "toPen" TEXT,
    "reason" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "principalDecidedAt" TIMESTAMP(3),
    "principalUserId" TEXT,
    "principalApproved" BOOLEAN,
    "guardianDecidedAt" TIMESTAMP(3),
    "guardianUserId" TEXT,
    "guardianApproved" BOOLEAN,
    "guardianWaived" BOOLEAN NOT NULL DEFAULT false,
    "decisionReason" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PenChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PenChangeRequest_schoolId_status_createdAt_idx" ON "PenChangeRequest"("schoolId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "PenChangeRequest_studentMembershipId_status_idx" ON "PenChangeRequest"("studentMembershipId", "status");

-- AddForeignKey
ALTER TABLE "PenChangeRequest" ADD CONSTRAINT "PenChangeRequest_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenChangeRequest" ADD CONSTRAINT "PenChangeRequest_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
