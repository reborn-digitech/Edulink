-- The index the duplicates check's `%` operator walks (src/lib/bank-tools.ts,
-- findDuplicates): the stem normalised exactly as the query normalises it.
-- Only where pg_trgm is installed; without it the check matches exactly and
-- needs no index.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS "QuizQuestion_stem_trgm_idx"
      ON "QuizQuestion" USING gin ((lower(regexp_replace("stem", '[^[:alnum:]]+', '', 'g'))) gin_trgm_ops);
  END IF;
END
$$;
