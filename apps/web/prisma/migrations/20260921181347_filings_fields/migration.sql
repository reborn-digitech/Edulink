-- AlterTable
ALTER TABLE "PupilRecord" ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "bpl" BOOLEAN,
ADD COLUMN     "cwsnType" TEXT,
ADD COLUMN     "ews" BOOLEAN,
ADD COLUMN     "fatherNameLocal" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "motherNameLocal" TEXT,
ADD COLUMN     "nameLocal" TEXT;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "affiliationNumber" TEXT,
ADD COLUMN     "block" TEXT,
ADD COLUMN     "board" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "managementType" TEXT,
ADD COLUMN     "medium" TEXT,
ADD COLUMN     "udiseCode" TEXT;

-- AlterTable
ALTER TABLE "StaffRecord" ADD COLUMN     "academicQualification" TEXT,
ADD COLUMN     "appointmentType" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "professionalQualification" TEXT,
ADD COLUMN     "socialCategory" TEXT;
