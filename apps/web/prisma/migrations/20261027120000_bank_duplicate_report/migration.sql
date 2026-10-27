-- The bank duplicates report kept between calls and across restarts (src/lib/bank-tools.ts findDuplicates):
-- one row per rule, so the finder walks the whole bank once and then probes only what changed.
-- CreateTable
CREATE TABLE "BankDuplicateReport" (
    "mode" TEXT NOT NULL,
    "bankCount" INTEGER NOT NULL,
    "bankMaxUpdatedAt" TIMESTAMP(3),
    "seenUpdatedAt" TIMESTAMP(3),
    "computedAt" TIMESTAMP(3) NOT NULL,
    "pairs" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankDuplicateReport_pkey" PRIMARY KEY ("mode")
);


-- The trigram index the finder probes: with fastupdate on, every probe also walks the index's
-- pending list, which the generator keeps filling (28 pages on 27 October 2026); inserts are a
-- few an hour, so write the index directly and empty the list it has.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'QuizQuestion_stem_trgm_idx') THEN
    ALTER INDEX "QuizQuestion_stem_trgm_idx" SET (fastupdate = off);
    PERFORM gin_clean_pending_list('"QuizQuestion_stem_trgm_idx"'::regclass);
  END IF;
END
$$;
