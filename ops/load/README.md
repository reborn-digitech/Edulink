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
