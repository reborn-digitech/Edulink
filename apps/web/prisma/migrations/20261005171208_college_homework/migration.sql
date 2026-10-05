-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "offeringId" TEXT,
ALTER COLUMN "classId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Assignment_offeringId_publishedAt_idx" ON "Assignment"("offeringId", "publishedAt");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "CourseOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- R-48: a piece of work is set to a class (a school) or to a course offering (a college), never both and never neither.
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_class_or_offering" CHECK (("classId" IS NULL) <> ("offeringId" IS NULL));
