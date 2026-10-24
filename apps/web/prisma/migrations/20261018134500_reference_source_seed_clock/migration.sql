-- The vidura_references seed wrote CURRENT_TIMESTAMP into "createdAt" and "updatedAt", which are timestamps
-- without a time zone: on a database whose session runs in Asia/Kolkata (this Mac and Fly) that stored the
-- local clock as if it were UTC, so the five seeded sources showed as added five and a half hours in the
-- future (loose-ends finding F-4, 18 October 2026). The seed's true moment is the migration's own
-- finished_at, which Postgres keeps with its zone: a seeded row dated more than an hour after that moment
-- was written in a local zone and is moved back by that zone's offset; a database that seeded in UTC has
-- no such rows and is untouched. Prisma writes every later row in UTC.
-- Guarded (24 Oct 2026): Prisma's shadow database, which `db:migrate:new` builds from these files, has no
-- _prisma_migrations table of its own, so the correction runs only where that table exists.
DO $$
BEGIN
  IF to_regclass('_prisma_migrations') IS NOT NULL THEN
    UPDATE "ReferenceSource" r
    SET "createdAt" = (r."createdAt" AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC',
        "updatedAt" = (r."updatedAt" AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'UTC'
    FROM _prisma_migrations m
    WHERE m.migration_name = '20261018062120_vidura_references'
      AND r.id IN ('refsrc_ncert_channel', 'refsrc_nptel', 'refsrc_swayam', 'refsrc_khan_india', 'refsrc_india_code')
      AND r."createdAt" > (m.finished_at AT TIME ZONE 'UTC') + interval '1 hour';
  END IF;
END $$;
