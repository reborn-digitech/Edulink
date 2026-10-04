-- The college foundation (the owner's decision of 4 October 2026): what kind of
-- institution a tenant is, a college's profile, the global feed's kind filter,
-- an adult student's grants to their guardians, and a recruiter's own account.
-- Every existing tenant is a SCHOOL (the column's default) and reads global
-- posts from every kind; the college modules and roles are offered to none of
-- them, so nothing a school sees changes.
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "globalSchoolKind" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "affiliatingUniversity" TEXT,
ADD COLUMN     "aicteApprovalRef" TEXT,
ADD COLUMN     "aisheCode" TEXT,
ADD COLUMN     "globalFeedKinds" TEXT NOT NULL DEFAULT '["SCHOOL","JUNIOR_COLLEGE","COLLEGE","AUTONOMOUS_COLLEGE"]',
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'SCHOOL',
ADD COLUMN     "naacGrade" TEXT,
ADD COLUMN     "naacValidUntil" TIMESTAMP(3),
ADD COLUMN     "nirfCategory" TEXT,
ADD COLUMN     "ugcApprovalRef" TEXT;

-- CreateTable
CREATE TABLE "StudentConsent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentMembershipId" TEXT NOT NULL,
    "grant" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "StudentConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruiterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMP(3),

    CONSTRAINT "RecruiterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentConsent_schoolId_idx" ON "StudentConsent"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentConsent_studentMembershipId_grant_key" ON "StudentConsent"("studentMembershipId", "grant");

-- CreateIndex
CREATE UNIQUE INDEX "RecruiterProfile_userId_key" ON "RecruiterProfile"("userId");

-- AddForeignKey
ALTER TABLE "StudentConsent" ADD CONSTRAINT "StudentConsent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentConsent" ADD CONSTRAINT "StudentConsent_studentMembershipId_fkey" FOREIGN KEY ("studentMembershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecruiterProfile" ADD CONSTRAINT "RecruiterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every post already on the global feed was published by a school.
UPDATE "Post" SET "globalSchoolKind" = 'SCHOOL' WHERE "scope" = 'GLOBAL' AND "globalSchoolKind" IS NULL;
