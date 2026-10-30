-- qb-C (31 Oct 2026, QB-12): an e-resource's name is compared in any capitals or spacing.
-- nameKey is the name trimmed, every run of white space one space, lower case (eResourceNameKey in
-- packages/contracts v1/library.ts writes it from now on); unique per school in place of the exact name.
-- Written by hand from `prisma migrate diff` (db:migrate:new refused on the database's pgstattuple drift),
-- with the backfill between the column and its NOT NULL. On 31 Oct 2026 the 9 rows had 9 distinct keys.

-- DropIndex
DROP INDEX "LibraryEResource_schoolId_name_key";

-- AlterTable
ALTER TABLE "LibraryEResource" ADD COLUMN "nameKey" TEXT;
UPDATE "LibraryEResource" SET "nameKey" = lower(regexp_replace(btrim("name"), '\s+', ' ', 'g'));
ALTER TABLE "LibraryEResource" ALTER COLUMN "nameKey" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LibraryEResource_schoolId_nameKey_key" ON "LibraryEResource"("schoolId", "nameKey");
