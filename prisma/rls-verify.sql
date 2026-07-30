-- Proves the row-level security policies actually isolate tenants.
--
--   psql -d edulink -v ON_ERROR_STOP=1 -f prisma/rls-verify.sql
--
-- Run it after applying rls.sql, against a database that has the policies on.
-- Every check RAISEs on failure, so a non-zero exit means isolation is broken.
-- It creates its own two schools, checks, and removes them again.
--
-- WHY THIS EXISTS AS A SCRIPT. `npm test` runs with no database server at all —
-- that is a deliberate property of this repo, not an oversight — so the Postgres
-- path cannot be covered there. This is the thing to run before trusting a
-- deployment, and it is written in plain SQL so it needs nothing but psql.
--
-- SET ROLE matters. RLS is bypassed by superusers and by BYPASSRLS roles, so
-- checking as the migration user would prove nothing at all: it would happily
-- read every row and report success. These checks deliberately drop to the
-- unprivileged application role first.

\set ON_ERROR_STOP on

-- The role the application connects as. Override with:
--   psql -v app_role=some_other_role -f prisma/rls-verify.sql
\if :{?app_role}
\else
  \set app_role edulink_app
\endif

-- ---------------------------------------------------------------------------
-- Configuration checks, before any data.
--
-- These exist because the behavioural checks below CANNOT see these mistakes.
-- They run as the unprivileged app role, and the two most dangerous
-- misconfigurations are invisible from there: a table whose owner bypasses its
-- own policies, and an app role that bypasses everything. Both leave every
-- behavioural check passing while the database is wide open.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  offending text;
BEGIN
  -- Any table with a tenant policy must also FORCE it. Without FORCE the table
  -- owner ignores every policy — and in a modest deployment the owner is often
  -- the same user the application connects as.
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO offending
  FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace
    AND c.relkind = 'r'
    AND EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid)
    AND NOT c.relforcerowsecurity;

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: policies present but NOT FORCED on: %. The owner bypasses them.', offending;
  END IF;

  -- And a table with RLS enabled but no policy at all returns nothing to
  -- anyone, which is safe but is almost certainly a mistake worth naming.
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO offending
  FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace
    AND c.relkind = 'r'
    AND c.relrowsecurity
    AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid);

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: RLS enabled but no policy on: %. Those tables return nothing to anyone.', offending;
  END IF;
END $$;

-- psql does not substitute :variables inside a dollar-quoted body, so the role
-- name is handed to the block through a setting instead.
SELECT set_config('rlscheck.app_role', :'app_role', false);

DO $$
DECLARE
  r record;
  who text := current_setting('rlscheck.app_role');
BEGIN
  SELECT rolsuper, rolbypassrls INTO r FROM pg_roles WHERE rolname = who;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'FAIL: role % does not exist', who;
  END IF;
  IF r.rolsuper THEN
    RAISE EXCEPTION 'FAIL: % is a SUPERUSER, which ignores row-level security entirely', who;
  END IF;
  IF r.rolbypassrls THEN
    RAISE EXCEPTION 'FAIL: % has BYPASSRLS, which ignores row-level security entirely', who;
  END IF;
END $$;

BEGIN;

-- Fixtures, inserted as the owner so RLS does not get in the way of setup.
INSERT INTO "School" (id, name, slug, code, "contactEmail", timezone, "updatedAt") VALUES
  ('rlscheck-a', 'RLS Check A', 'rlscheck-a', 'RLSCHK-A', 'a@example.test', 'UTC', now()),
  ('rlscheck-b', 'RLS Check B', 'rlscheck-b', 'RLSCHK-B', 'b@example.test', 'UTC', now());

INSERT INTO "User" (id, name, prefs, "updatedAt") VALUES
  ('rlscheck-user', 'RLS Check User', '{}', now());

INSERT INTO "Post" (id, "schoolId", "authorUserId", scope, title, status, tags, media, "updatedAt") VALUES
  ('rlscheck-post-a', 'rlscheck-a', 'rlscheck-user', 'SCHOOL', 'Belongs to A', 'APPROVED', '[]', '[]', now()),
  ('rlscheck-post-b', 'rlscheck-b', 'rlscheck-user', 'SCHOOL', 'Belongs to B', 'APPROVED', '[]', '[]', now());

SET LOCAL ROLE :app_role;

DO $$
DECLARE
  visible int;
BEGIN
  -- 1. No tenant set at all. current_setting(..., true) is NULL, the comparison
  --    is NULL, and nothing matches. A query that forgets to say who it is for
  --    must return nothing rather than everything.
  PERFORM set_config('app.school_ids', '', true);
  SELECT count(*) INTO visible FROM "Post" WHERE id LIKE 'rlscheck-%';
  IF visible <> 0 THEN
    RAISE EXCEPTION 'FAIL: % post(s) visible with no app.school_ids set — RLS is not failing closed', visible;
  END IF;

  SELECT count(*) INTO visible FROM "School" WHERE id LIKE 'rlscheck-%';
  IF visible <> 0 THEN
    RAISE EXCEPTION 'FAIL: % school(s) visible with no app.school_ids set', visible;
  END IF;

  -- 2. Acting for A: A's row, and only A's.
  PERFORM set_config('app.school_ids', 'rlscheck-a', true);
  SELECT count(*) INTO visible FROM "Post" WHERE id LIKE 'rlscheck-%';
  IF visible <> 1 THEN
    RAISE EXCEPTION 'FAIL: acting for A sees % posts, expected exactly 1', visible;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Post" WHERE id = 'rlscheck-post-a') THEN
    RAISE EXCEPTION 'FAIL: acting for A cannot see its own post';
  END IF;
  IF EXISTS (SELECT 1 FROM "Post" WHERE id = 'rlscheck-post-b') THEN
    RAISE EXCEPTION 'FAIL: acting for A can see B''s post';
  END IF;

  -- 3. Writing into another tenant is refused, not silently accepted.
  BEGIN
    INSERT INTO "Post" (id, "schoolId", "authorUserId", scope, title, status, tags, media, "updatedAt")
    VALUES ('rlscheck-forged', 'rlscheck-b', 'rlscheck-user', 'SCHOOL', 'Forged', 'APPROVED', '[]', '[]', now());
    RAISE EXCEPTION 'FAIL: acting for A inserted a row into B — WITH CHECK is missing';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL; -- expected
  END;

  -- 4. Updating and deleting another tenant's row reaches nothing. No error is
  --    raised here by design: the row is simply not visible to be changed.
  UPDATE "Post" SET title = 'Hijacked' WHERE id = 'rlscheck-post-b';
  IF FOUND THEN
    RAISE EXCEPTION 'FAIL: acting for A updated B''s post';
  END IF;

  DELETE FROM "Post" WHERE id = 'rlscheck-post-b';
  IF FOUND THEN
    RAISE EXCEPTION 'FAIL: acting for A deleted B''s post';
  END IF;

  -- 5. And the other direction, so this is isolation rather than A simply
  --    having no access to anything.
  PERFORM set_config('app.school_ids', 'rlscheck-b', true);
  IF NOT EXISTS (SELECT 1 FROM "Post" WHERE id = 'rlscheck-post-b' AND title = 'Belongs to B') THEN
    RAISE EXCEPTION 'FAIL: acting for B cannot see its own post, or it was modified';
  END IF;

  RAISE NOTICE 'RLS isolation verified: reads, inserts, updates and deletes are all tenant-bound.';
END $$;

RESET ROLE;

-- Fixtures out. Rolling back would also work, but an explicit delete leaves the
-- script honest about what it touched.
DELETE FROM "Post" WHERE id LIKE 'rlscheck-%';
DELETE FROM "School" WHERE id LIKE 'rlscheck-%';
DELETE FROM "User" WHERE id LIKE 'rlscheck-%';

COMMIT;

-- ---------------------------------------------------------------------------
-- The tenant setting must not outlive its transaction.
--
-- This is the property the application design rests on. The app will pool
-- connections, so a request does not get a fresh one — it borrows whatever the
-- last request used. If the tenant were set with plain SET it would still be on
-- that connection when the next request borrows it, and that request would read
-- the PREVIOUS school's rows while believing RLS was protecting it. Demonstrated
-- on this database: with SET, a second query that set nothing still saw the
-- first tenant's posts. With SET LOCAL, it saw none.
--
-- So: every scoped query goes inside a transaction that sets the tenant first,
-- and the check below is here so a Postgres upgrade or a pooler that swallows
-- transaction scope cannot quietly take that away.
-- ---------------------------------------------------------------------------

BEGIN;
SET LOCAL app.school_ids = 'rlscheck-scope-probe';
COMMIT;

DO $$
BEGIN
  IF coalesce(current_setting('app.school_ids', true), '') = 'rlscheck-scope-probe' THEN
    RAISE EXCEPTION
      'FAIL: SET LOCAL survived its transaction. A pooled connection would carry '
      'one request''s tenant into the next.';
  END IF;
  RAISE NOTICE 'Tenant setting is transaction-scoped, as the pooling design requires.';
END $$;
