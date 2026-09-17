-- A head is never deleted on its own (it is retired), so the line-to-head
-- constraint only ever fires when a whole school is removed and every row
-- goes together. RESTRICT is checked per row and can refuse that cascade
-- depending on the order Postgres reaches the rows; NO ACTION is checked at
-- the end of the statement, when the lines are already gone.
ALTER TABLE "FeeLine" DROP CONSTRAINT "FeeLine_headId_fkey";
ALTER TABLE "FeeLine" ADD CONSTRAINT "FeeLine_headId_fkey" FOREIGN KEY ("headId") REFERENCES "FeeHead"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "FeeConcession" DROP CONSTRAINT "FeeConcession_headId_fkey";
ALTER TABLE "FeeConcession" ADD CONSTRAINT "FeeConcession_headId_fkey" FOREIGN KEY ("headId") REFERENCES "FeeHead"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
