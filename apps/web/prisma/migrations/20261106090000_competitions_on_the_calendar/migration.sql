-- Competitions on the calendar (decision 0007, 6 November 2026): a school's competition is a calendar event.
-- Competition.internalBoard is the office's choice of internal board (OFF | STAFF | SCHOOL; OFF for every row
-- that exists, so nothing is shown that was not shown before). Holiday.competitionId links the calendar row of
-- kind COMPETITION to the Competition that holds its entries, results and boards, one row per competition;
-- SET NULL so a competition row that goes first never takes a calendar day with it.
-- Written by hand from `prisma migrate diff --from-schema-datasource` against the live database (6 Nov 2026).

-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "internalBoard" TEXT NOT NULL DEFAULT 'OFF';

-- AlterTable
ALTER TABLE "Holiday" ADD COLUMN     "competitionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_competitionId_key" ON "Holiday"("competitionId");

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
