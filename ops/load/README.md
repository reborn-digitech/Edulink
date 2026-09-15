# Load tests

Two ways to run the same three scenarios from the plan, against a production
build (`next start` or the container), never against `next dev`.

| Scenario | What it models | Target |
| --- | --- | --- |
| `attendance.js` | 30 class teachers marking a register for 800 pupils inside the same ten minutes | p95 of the POST under 300 ms |
| `parents.js` | 200 guardians opening their overview after the absence notices go out | p95 page load under 800 ms |
| `report-cards.js` | one grade's report cards published while the above is happening | no RLS statement over 50 ms (`pg_stat_statements`) |

**k6** (the plan's tool, for a staging run from a second machine):

```bash
k6 run -e BASE=https://staging.example -e COOKIES=ops/load/cookies.json ops/load/attendance.js
```

**Without k6** (a laptop, the numbers in the Phase 1 report): the runner in
`apps/web/scripts/load-check.ts` mints sessions straight from the database the
way the sweep does and drives both scenarios with plain `fetch`:

```bash
cd apps/web && npm run load:check -- --base http://localhost:3100 --teachers 30 --parents 200 --seconds 60
```

Both need a database with the seed and the ZZ fixture. Sessions minted for a
run are deleted at its end.

## The fleet run (15 September 2026)

The plan's one-school profile answers "can a school of 800 use this"; the
fleet answers the question a buyer with fifty schools asks. `npm run zz:fleet`
builds 50 ZZ schools of 5,000 pupils, 10,000 parents, 100 teachers and 50
admins each — 758,809 accounts, 501,088 guardianships, 2.74 million register
lines over ten school days, 1.9 GB of database — in 5.9 minutes, and
`npm run zz:fleet -- --teardown` removes it in 1.5. `npm run load:check` takes
`--school zz-load-01` for one large school or `--fleet zz-load-` for registers
and guardians sampled across all fifty.

Everything below is one production process on an 8-core laptop that was also
running the load generator and Postgres, with Prisma's default pool of 17
connections. Workers fire continuously; a real person pauses 20–60 s between
taps, so one worker stands for roughly that many people.

**Per-request cost does not grow with the school.** Unloaded, a guardian
overview at a 5,000-pupil school renders in 83 ms against 87 ms at the
48-pupil fixture; every hot query is indexed on `schoolId` and every long list
paginates. Throughput is flat at about 33 overviews/s per process whatever the
fleet size; the latency under load below is queueing for connections and CPU.

**The register write was fifty transactions.** `saveAttendanceBatch` upserted
each mark through the tenant-scoped client, and each call is its own
transaction with four `set_config` round-trips, so a 50-pupil register cost
388 ms alone and queued fifty times behind the guardians' reads under load.
It is one `$tenantTransaction` now (the same file, commit below); the
notifications still go out after the commit.

| Register POST, one 5,000-pupil school | before | after |
| --- | --- | --- |
| 1 teacher, no parents (p50) | 388 ms | **141 ms** |
| 10 teachers, no parents (p50 / p95) | 460 / 709 ms | **154 / 206 ms** |
| 30 teachers, no parents (p50 / p95) | 1,273 / 1,350 ms | **286 / 381 ms** |
| 30 teachers + 200 parents (p50 / p95) | 12.5 s / 49.5 s | **6.7 s / 7.0 s** |

| Fleet, 50 schools, mixed | register p50 → | overview p50 / p95 | errors |
| --- | --- | --- | --- |
| 10 teachers + 50 parents | 401 → 420 ms | 1.4 s / 1.5 s | 0 |
| 20 + 100 | 13.0 s → 2.6 s | 2.1 s / 2.7 s | 0 |
| 50 + 300 | 64 s → 11.2 s | 8.2 s / 8.8 s | 0 |
| 100 + 500 | 67 s → 20.1 s | 14.8 s / 16.0 s | 30 + 201 → **0** |

The targets (register p95 < 300 ms, overview p95 < 800 ms) hold for one
process up to about 10 continuous teachers and 25–30 continuous guardians —
on the order of a thousand people active at once. Past that, latency is the
pool: the errors at 100 + 500 before the rewrite were Prisma `P2028`
("unable to start a transaction in the given time"). The levers, in order:
`connection_limit` on `DATABASE_URL` sized to the machine, a pooler in front,
and more processes — the bucket adapter made the process stateless, so the
last is a scale command.

**Two things the run found that were not about load.** Ids handed to the API
must be cuid-shaped or the contract answers 422 (the seed's first version used
UUIDs and every register failed). And deleting a large school by cascade is
unusable at this size: a `DELETE FROM "School"` for the fleet ran for half an
hour and a `DELETE FROM "User"` for its people for an hour, because
`User.mergedIntoUserId` and fourteen other foreign keys to `User` had no
index — every deleted person scanned the 758,000-row `User` table — and, one
table over, `AttendanceRecord.studentMembershipId` (2.2 million rows) and
thirty-two other foreign keys to `Membership`, `School`, `Class` and
`AttendanceSession` had none either, so deleting five schools' memberships
took ten minutes a batch. Migrations `20260915120000_user_fk_indexes` and
`20260915130000_membership_fk_indexes` add all forty-eight; with them the
fleet teardown deletes children first in bulk and takes 2.7 minutes.

