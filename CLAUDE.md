# Working rules for this repository

Read HANDOFF.md first for what this is. These are the rules every change here follows; they were
learned the hard way and are not negotiable without saying so in the commit.

## Tooling
- pnpm only through `corepack pnpm` (pinned 9.15.x); Node 24 (`.nvmrc`). The web app is `apps/web`, the phone
  `apps/mobile`; run each app's `npm run …` from its own directory.
- Web `tsc` needs 8 GB heap since the college tables (277 models): `NODE_OPTIONS=--max-old-space-size=8192`, for `tsconfig.json` and `scripts/tsconfig.json`. `next build` no longer type-checks; its compile needs 8 GB since 18 October 2026 (it ran out at 4 GB), set in the build script.
- Migrations, seeds and fixtures run through the owner connection: `npm run db:migrate` (not a bare
  `prisma migrate deploy`, which fails with "must be owner" and leaves a failed migration row to
  `migrate resolve --rolled-back`). After `npm run rls:generate` run `npm run db:grants`.
- The container's release step is `npm run db:release` (deploy, then grants, no dump): the image carries no pg_dump and
  the hosted database's backups are the provider's. `db:migrate` with its dump is the dev machine's.
- Restart the dev server after a migration or `prisma generate`; a stale client 500s.

## Database and fixtures
- Never run `db:seed` or `db:reset` against a database with data in it; never bypass the reset consent guard.
- NEVER a shadow database. `prisma migrate diff --shadow-database-url …` drops and recreates whatever database
  the URL names, and on 6 November 2026 a URL a failed sed had left pointing at the dev database wiped it with no
  backup anywhere. Migration SQL comes from the live datasource, which writes nothing:
  `node scripts/with-admin-db.mjs npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`.
  Never build a connection URL with sed or by hand; print the database name before any command that takes one.
  scripts/with-admin-db.mjs enforces this (scripts/db-fence.mjs): shadow URLs, diffs against migration folders and
  resets outside `db:reset` are refused, and every command prints the database it touches.
- A dump before anything touches the schema: `db:migrate`, `db:push` and `db:reset` run `npm run db:backup` first
  and stop if it fails. Dumps go to apps/web/storage/backups and a copy to ~/Desktop/OffMachineCopy (iCloud-synced),
  fourteen days kept; the morning task takes one daily and a weekly base backup (`db:basebackup`) for point-in-time
  recovery; `npm run db:drill` restores the newest copy into a scratch database and must pass monthly. Runbook:
  docs/runbooks/backup-restore.md.
- Only ZZ-prefixed schools/people and `@demo.relay.test` accounts may be created or destroyed by tests and
  scripts. Never touch other seed data. Test cleanups must be scoped to their own school (an unscoped
  delete once took every school's 2025 registers).
- Sign in as a test person with a minted session (`npm run zz:token -- ROLE`; `--purge` removes them) or a
  temporary `scripts/tmp-*.ts` with userAgent "zz-walk", deleted afterwards. Never type a password into a
  form; never create accounts through the UI; test people have unknowable password hashes.
- Rebuild fixtures with `npm run zz:fixtures` and `npm run demo:schools` after a battery that touched them.

## Verification before a commit
1. web tsc, scripts tsc, eslint; 2. `npx vitest run`; 3. `npm run rls:verify` on schema/policy change,
`npm run api:docs` on catalog/contract change; 4. `npm run i18n -- --max <floor>` (floor in
`.github/workflows/battery.yml`; a new job name raises it by one); 5. phone `npm run battery`;
6. `npm run sweep` and `npm run api:sweep` twice (warm-up, then count) against a running dev server —
"got 0" means the server is down; 7. `npm run build` with the dev server stopped, then `rm -rf .next`;
8. `npm run data:audit` when derived data or fixtures change.
- Paste real output. Label anything not executed "Untested:". Never write "production-ready".
- Suites that time out under the concurrent battery are rerun alone before being called failures.

## Text and languages
- Every user-facing sentence is an i18n key in en, hi and mr. Hindi sentences end with the danda (।),
  Marathi with a full stop; "शाळा", never "स्कूल". Bare initials a form prints in Latin (PEN, SC/ST/OBC) are
  allow-listed in `src/lib/i18n/i18n.test.ts` with a reason.

## Secrets and accounts
- Never print, log or commit secrets. The macOS keychain GitHub token may be used transiently, never
  echoed (`ps -f` on a running script can leak env; avoid it). Never add the `admin:org` gh scope.
- `.env`, `storage/`, `pitch/`, `apps/web/.Rhistory`, `.claude/launch.json` stay out of git:
  `git add -A -- . ':!pitch' ':!apps/web/.Rhistory' ':!.claude/launch.json'`.

## Commits and remotes
- One long narrative paragraph: what was wrong, what it is now, "Verified:" with the numbers, "Untested:".
  End with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Push to both remotes: `git push -q reborn master && git push -q origin master`. CI is watched on
  reborn-digitech only (the token 404s on origin); it has been refused on billing since 84cc987.
- Keep the dev servers up between tasks (the owner tests by hand on :3000 and :8081); on a login report
  check `/api/health` first.

## Design rules that code must respect
- One tenant fence: every school table has `schoolId` and RLS; use `$tenantTransaction`, never a bare
  `$transaction`. Handlers bind the person, not only the school.
- The API catalog (`src/lib/api-catalog/*.ts`) is the truth for docs, sweep and the phone's access gate.
- Stored copies of derived values have one writer and an audit check; prefer recomputing on read.
- Coded lists live in `packages/contracts`; free text where a filing wants a code is refused.
- Money never touches the platform (decision 0003); no Aadhaar, ever (decision 0002).
