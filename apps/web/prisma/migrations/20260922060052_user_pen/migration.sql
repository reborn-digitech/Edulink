-- AlterTable
ALTER TABLE "User" ADD COLUMN "penNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_penNumber_key" ON "User"("penNumber");
