-- AlterTable
ALTER TABLE "CompanyRecruiter" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "addedByUserId" TEXT;

-- Every binding made before acceptance existed stands as accepted: the
-- registering recruiter's, and colleagues already working on drives.
UPDATE "CompanyRecruiter" SET "acceptedAt" = "addedAt" WHERE "acceptedAt" IS NULL;
