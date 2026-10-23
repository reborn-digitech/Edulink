# QA campaign of 24–25 October 2026

The owner's brief of 23 October: test the web app and the phone app as a QA engineer, SDET and security tester, with demo accounts for every role, across six layers, and report in a structured form. This repository's rules shape how (see the preamble in the coordinator's scratchpad and CLAUDE.md): accounts come from fixtures, sign-in is by minted session or the Playwright harness, only ZZ and demo data is touched, security testing is non-destructive on the dev database.

## Before the first layer (the coordinator)
1. Stop the generation run through the operator's door and leave the model servers up; the run resumes after the campaign with the same request.
2. Restart :3000 and check /api/health; confirm :8081.
3. `npm run zz:fixtures` and `npm run demo:schools` so the fixtures are fresh; add the three demo accounts accounts.md lists as missing (through the fixture scripts).
4. Read the usage: each layer is one Opus builder (two for E2E); expect 3–5 points of the all-models week each.

## The layers, in order (each its own builder and report)
| # | Layer | Builder's brief | Needs the server | Output |
|---|---|---|---|---|
| 1 | Accounts and reach | accounts.md + a walk of every role's home on web and phone | yes | accounts.md completed with "verified" per account |
| 2 | Unit | unit.md | no | unit.md: coverage gaps, flaky or wrong suites, new tests |
| 3 | BDD | bdd.md | no (features), yes (runner) | apps/web/features/*.feature + a runner; bdd.md |
| 4 | UI and UX | ui.md | yes | ui.md with screenshots under docs/qa/campaign-2026-10-24/shots/ |
| 5 | End to end | e2e.md (two builders: school side, college and platform side) | yes | e2e.md |
| 6 | Functional and workflow map | functional.md | yes | functional.md: the feature × role matrix with tested / untested |
| 7 | Security | security.md | yes | security.md |
| 8 | The report | report.md (the coordinator, or a builder) | no | docs/qa/campaign-2026-10-24/REPORT.md and a published page |

Layers 2 and 3 can run while 1 runs (no server contention); 4, 5a, 5b, 6 and 7 one or two at a time, since the walks share :3000.

## Finding format (every layer)
- Type (Unit / BDD / UI-UX / E2E / Functional / Security) · Severity (Critical / High / Medium / Low) · Platform (Web / Mobile / Both) · Feature or workflow
- Steps to reproduce, numbered, naming the account used
- Expected vs actual
- Suggested fix · Relevant files

## The report (layer 8)
Accounts used (email, role, how signed in, notes) · every finding · coverage summary (tested vs gaps) · release blockers in priority · missing test cases · high-risk areas · a short remediation plan.
