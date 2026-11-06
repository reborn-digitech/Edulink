-- Competitions on the calendar, second column (decision 0007, 6 November 2026): the office's "enrolment on/off"
-- on a competition event. True for every row that exists, so nothing changes for them; off, no entry can be made
-- whatever the dates say. Written by hand from `prisma migrate diff --from-schema-datasource` against the live
-- database (6 Nov 2026).

-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "enrolmentOpen" BOOLEAN NOT NULL DEFAULT true;
