-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "consentBy" TEXT,
ADD COLUMN     "consentQuestion" TEXT;

-- CreateTable
CREATE TABLE "PostConsent" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "answeredByUserId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostConsent_schoolId_idx" ON "PostConsent"("schoolId");

-- CreateIndex
CREATE INDEX "PostConsent_studentMembershipId_idx" ON "PostConsent"("studentMembershipId");

-- CreateIndex
CREATE UNIQUE INDEX "PostConsent_postId_studentMembershipId_key" ON "PostConsent"("postId", "studentMembershipId");

-- AddForeignKey
ALTER TABLE "PostConsent" ADD CONSTRAINT "PostConsent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostConsent" ADD CONSTRAINT "PostConsent_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
