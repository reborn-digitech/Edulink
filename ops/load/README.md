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


## The college profile (4 October 2026)

`college.js` (k6) and `college-check.ts` (no k6) drive a college's day at
once: faculty marking lectures through `POST /api/v1/academics/lectures/{id}/attendance`
with clientId batches (every fifth batch resends the previous one, as the
phone's outbox does), students reading `/api/v1/academics/mine` and
`/api/v1/exam-cell/mine`, guardians reading `/api/v1/student/ledger`, one TPO
reading an open drive's eligibility and one IQAC reading the predictor.

```bash
cd apps/web && node scripts/with-admin-db.mjs npx tsx --tsconfig scripts/tsconfig.json \
  ../../ops/load/college-check.ts --faculty 10 --students 100 --parents 40 --seconds 60
```

Only `zz-` colleges (ZZ Vidya College by default). Marks are all PRESENT, so no
defaulter notice fans out; students whose marks the exam cell has frozen are
not sent. Every lecture mark the run touched is put back as it was found, rows
it created and its own audit rows are deleted, and its sessions are removed. A
guardian refused by design (an adult child without the MONEY grant) is named in
the preflight and left out. The fixture college is small (one faculty member
with lectures, four students, one readable guardian), so workers cycle over
them: the server does a large college's work per request, the database holds
a small college's rows.

One production process on the 18-core laptop (Postgres and the load generator
on the same machine), 60 s per profile, faculty + students + guardians:

| Profile | mark p50 / p95 | academics/mine p95 | exam-cell/mine p95 | ledger p95 | TPO / IQAC p95 | errors |
| --- | --- | --- | --- | --- | --- | --- |
| 2 + 10 + 5 | 109 / 161 ms | 134 ms | 94 ms | 52 ms | 102 / 105 ms | 0 |
| 4 + 25 + 10 | 153 / 229 ms | 184 ms | 135 ms | 77 ms | 117 / 148 ms | 0 |
| 6 + 50 + 20 | 1.0 / 1.5 s | 1.1 s | 838 ms | 407 ms | 760 / 917 ms | 0 |
| 10 + 100 + 40 | 3.8 / 4.3 s | 3.6 s | 2.7 s | 1.2 s | 2.4 / 2.6 s | 0 |
| 30 + 500 + 200 | 24.6 / 28.0 s | 23.4 s | 18.0 s | 8.2 s | 15.5 / 16.8 s | 0 |

The process saturates at about 45–50 of these API requests a second; the
database never was the limit (at most four connections active, no `P2028`).
A CPU profile under the 6 + 50 + 20 profile put 39 % of the main thread in one
function of Prisma's client, the reducer that builds a model's field map with
an object spread on every model-method access (`library.js`, `lo()`): with 295
fields on `School` and 141 on `Membership` one `db.school.findFirst` access
costs 0.86 ms of CPU before any query is sent. See the campaign report of
4 October 2026 for the page-render profile and the recommendations.
