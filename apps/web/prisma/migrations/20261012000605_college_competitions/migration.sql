-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "streams" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "CompetitionSource" ADD COLUMN     "streams" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- college-content (12 Oct 2026): no backfill. Every competition already here keeps a null audience, which lists
-- it for schools and colleges alike, as before, until the content team or the operator sets one.
