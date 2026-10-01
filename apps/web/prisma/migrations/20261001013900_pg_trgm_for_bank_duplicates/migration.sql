-- Near-duplicate questions in the bank (GET /api/v1/appadmin/bank/duplicates)
-- compare normalised stems by trigram similarity, which pg_trgm provides.
-- The extension is trusted since Postgres 13, so the schema owner may install
-- it; on a server where it still cannot be, the migration goes through and the
-- duplicates check falls back to exact-normalised matches and says so.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm not installed (%): bank duplicates use exact matches only', SQLERRM;
END
$$;
