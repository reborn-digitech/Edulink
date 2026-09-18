-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "deliveryQueuedAt" TIMESTAMP(3),
ADD COLUMN     "remindCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "remindedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PostRead" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostRead_schoolId_idx" ON "PostRead"("schoolId");

-- CreateIndex
CREATE INDEX "PostRead_userId_idx" ON "PostRead"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostRead_postId_userId_key" ON "PostRead"("postId", "userId");

-- AddForeignKey
ALTER TABLE "PostRead" ADD CONSTRAINT "PostRead_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostRead" ADD CONSTRAINT "PostRead_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostRead" ADD CONSTRAINT "PostRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
