# 05 · States, accessibility and UI consistency

Audit of 5 October 2026, layer E: empty, error and loading states, accessibility, UI consistency, tree ff6f928e. This is the layer's report in full, copied from `scratchpad/reports/audit3-states.md` and tidied; it is a PARTIAL walk by the coordinator's instruction and says what was and was not walked. The findings are summarised and prioritised in `02-findings.md` (A3-states-2 is one row there with A3-journeys-6). Paths under "Findings" (shots, jsonl files) are under `scratchpad/audit3/`. The sections are: Summary, Measures per actor (web, then phone), Findings, the Inconsistency list (which has no ids and is evidence for A3-states-1, 5, 9, 10 and 11), By design and environment (excluded), Not walked.

## Audit 3, layer E: empty, error and loading states, accessibility, UI consistency (5 October 2026)

PARTIAL by the coordinator's instruction (wrap up within 30 minutes): what was walked is stated with its counts, and "Not walked" at the end lists the rest. Tree at ff6f928e; dev servers on :3000 and :8081 shared with two other auditors. Nothing in the product was changed. Temporary files (apps/web/scripts/tmp-audit-walk.ts, tmp-audit-hollow.ts, tmp-check.ts, apps/mobile/e2e/tmp-audit-phone.spec.ts) are deleted; the 39 "zz-walk" sessions are purged by their recorded hashes (0 left); the temporary ZZ Hollow College and ZZ Hollow School and their 20 people are torn down (0 schools, 0 users, 0 memberships left, scoped to slugs zz-hollow-*); every ZZ and demo person whose `prefs.locale` I flipped for the Marathi walk is restored (the 18 originals saved, plus zz.cadmin.s, whose original was lost to a race between workers and was reset to the fixture default `{"theme":"system","channels":{"push":true,"email":true}}`; 0 ZZ or demo users left on "mr"). Another auditor logged in as one of those people during the Marathi walk (roughly 20:00 to 20:32 IST) would have seen Marathi.

## Summary

| What ran | Count | Result |
|---|---|---|
| Web walk, English: 40 actors (ZZ Northgate 10 roles, ZZ Vidya 11 actors incl. FACULTY with all six duties and with none, RECRUITER, OPERATOR, APPADMIN, ZZ Shastri 3, demo engineering college "sit" 12 incl. four duty holders and both HODs, anonymous) plus 20 actors at two temporary empty institutions | 1,999 actor-route pairs, 5,037 renders at 1280 and 390 px, light and dark; 5,021 measured, 16 refused (server restart, re-run clean) | 12 sideways renders, 4 axe-serious renders (0 contrast nodes), 4 console errors (1 hydration), 0 raw keys, 0 non-200 |
| Web walk, Marathi (same measures, prefs flipped per actor) | 1,353 measured renders of 2,454 planned, 37 actors | 0 sideways, 0 axe serious, 0 raw keys, `lang="mr"` on all; 4 console errors (the same hydration) |
| Dynamic-id probe (every `[id]` route of 16 roles, real-format and junk ids) | 268 probes | 166 x 404, 44 x 200 (module off), 50 x 500, 8 x 307 |
| Phone (Expo web target at 390 px), light en for every screen of the role, dark en and light mr for the bar | 11 actors, 311 measured screen renders (TEACHER, PARENT, STUDENT partial, DRIVER, ACCOUNTS, TPO, IQAC, ADMIN and PRINCIPAL at Vidya, RECRUITER, ADMIN at Northgate partial), plus wrong-id and wrong-role screens for 6 of them | 0 sideways, 0 axe serious, 0 targets under 44 px, 0 console errors, 0 raw keys; findings A3-states-14 to 17 |
| New accreditation pages (/iqac/simulator, ?kind=nba, /hod/nba, /hod/nba/simulator, /iqac/documents/{nirf,nba}, insights sections on /iqac, /iqac/predictor, /principal/accreditation) | walked as IQAC, HOD (mech, research), ADMIN, PRINCIPAL at Vidya, Shastri and SIT | one overflow (A3-states-4); phone screens iqac-insights and iqac-scenarios walked as IQAC at Vidya (A3-states-16) |

Method: Playwright (chromium) with minted 8-hour sessions; each route fetched once per language at 1280 px light, then theme (data-theme plus emulateMedia) and window width changed in place and every measure repeated (the server was the bottleneck; a first version that reloaded per variant ran at 20 renders a minute). Measures per render: sideways scroll and elements past the right edge, clipped and ellipsised text, targets under 44 px (both sides) and under 40 px high, unlabelled and placeholder-only fields, EmptyState with no link or button (hook `data-empty-state`), heading skips, h1 count, main landmarks, duplicate lines and ids, raw dictionary keys, English dictionary sentences and Latin words on Marathi pages, console and hydration errors, 4xx and 5xx sub-requests, axe (wcag2a, 2aa, 21aa, best-practice) serious and contrast, Tab order and visible focus for the first 14 stops (transitions off), bordered-box radii, bare tables, buttons off the 44/48/56 px heights, text under 12 px, vertical rhythm of page blocks, time to first byte and first paint. Pictures: JPEG, light English at both widths for every nav route and every flagged render, under shots/<ACTOR>/ and shots/phone/<ACTOR>/ (about 7,000 files). Raw data: walk-en.jsonl, walk-mr.jsonl, phone-*.jsonl, probe.json, dynprobe.json, detail-en.md, detail-mr.md, detail-phone-final.md.

## Measures per actor (web)

**English walk (1280 and 390 px, light and dark; counts are variants affected, contrast is axe nodes)**

| actor | routes | renders | err | sideways | clipped | small<44 (390) | short<40 (390) | unlabelled | placeholder-only | empty w/o action | console | raw keys | no h1 | no main | bare table | axe serious | contrast nodes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TEACHER@northgate | 34 | 132 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 12 | 0 | 0 | 0 | 0 | 8 | 0 | 0 |
| PRINCIPAL@northgate | 122 | 408 | 0 | 0 | 0 | 2 | 6 | 0 | 0 | 120 | 0 | 0 | 60 | 6 | 28 | 0 | 0 |
| ADMIN@northgate | 153 | 509 | 0 | 0 | 0 | 4 | 32 | 0 | 0 | 129 | 0 | 0 | 63 | 6 | 31 | 0 | 0 |
| STUDENT@northgate | 37 | 131 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 37 | 0 | 0 | 15 | 6 | 0 | 0 | 0 |
| PARENT@northgate | 36 | 140 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 40 | 0 | 0 | 0 | 6 | 0 | 0 | 0 |
| EXPERT | 7 | 28 | 0 | 0 | 0 | 0 | 4 | 0 | 4 | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| DRIVER@northgate | 5 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| LIBRARIAN@northgate | 12 | 47 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 3 | 0 | 0 | 0 | 0 |
| WARDEN@northgate | 14 | 55 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 3 | 0 | 0 | 0 | 0 |
| ALUMNUS@northgate | 10 | 36 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ADMIN@vidya | 159 | 336 | 16 | 1 | 0 | 2 | 14 | 0 | 0 | 77 | 0 | 0 | 2 | 4 | 10 | 0 | 0 |
| PRINCIPAL@vidya | 128 | 273 | 0 | 1 | 0 | 3 | 4 | 0 | 0 | 73 | 0 | 0 | 0 | 4 | 8 | 0 | 0 |
| STUDENT@vidya | 37 | 74 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 30 | 0 | 0 | 0 | 4 | 2 | 0 | 0 |
| ALUMNUS@vidya | 10 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@vidya(all duties) | 19 | 75 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@vidya(no duty) | 13 | 26 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HOD@vidya | 21 | 79 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXAM_CONTROLLER@vidya | 8 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IQAC@vidya | 19 | 76 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| TPO@vidya | 11 | 43 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ACCOUNTS@vidya | 24 | 85 | 0 | 0 | 0 | 2 | 4 | 0 | 0 | 33 | 0 | 0 | 0 | 0 | 3 | 0 | 0 |
| RECRUITER | 2 | 8 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OPERATOR | 17 | 68 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| APPADMIN | 7 | 28 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ADMIN@shastri | 157 | 324 | 0 | 1 | 0 | 1 | 9 | 0 | 0 | 170 | 0 | 0 | 34 | 4 | 6 | 0 | 0 |
| FACULTY@shastri(lab) | 13 | 28 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| STUDENT@shastri | 37 | 74 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 46 | 0 | 0 | 4 | 4 | 0 | 0 | 0 |
| ADMIN@sit | 159 | 328 | 0 | 6 | 0 | 2 | 15 | 0 | 0 | 74 | 0 | 0 | 2 | 4 | 18 | 2 | 0 |
| PRINCIPAL@sit | 128 | 266 | 0 | 2 | 0 | 1 | 2 | 0 | 0 | 70 | 0 | 0 | 0 | 4 | 16 | 2 | 0 |
| FACULTY@sit(antiragging,nss) | 15 | 34 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@sit(lab) | 14 | 30 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@sit(examsquad) | 14 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HOD@sit(research) | 22 | 50 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HOD@sit(mech) | 21 | 46 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 16 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXAM_CONTROLLER@sit | 8 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IQAC@sit | 19 | 58 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| TPO@sit | 11 | 22 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ACCOUNTS@sit | 24 | 48 | 0 | 1 | 0 | 1 | 2 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 8 | 0 | 0 |
| STUDENT@sit | 37 | 74 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 36 | 0 | 0 | 0 | 4 | 2 | 0 | 0 |
| ANON | 14 | 56 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 24 | 0 | 0 | 0 |
| ADMIN@hollow-college | 57 | 115 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 53 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PRINCIPAL@hollow-college | 46 | 93 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 61 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| FACULTY@hollow-college | 18 | 42 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 22 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HOD@hollow-college | 14 | 28 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 12 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| EXAM_CONTROLLER@hollow-college | 6 | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IQAC@hollow-college | 12 | 27 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| TPO@hollow-college | 10 | 20 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ACCOUNTS@hollow-college | 13 | 26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| STUDENT@hollow-college | 28 | 56 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 32 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| LIBRARIAN@hollow-college | 11 | 22 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WARDEN@hollow-college | 13 | 26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| DRIVER@hollow-college | 5 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ADMIN@hollow-school | 46 | 92 | 0 | 0 | 0 | 0 | 5 | 0 | 0 | 42 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| PRINCIPAL@hollow-school | 38 | 76 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 52 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| TEACHER@hollow-school | 30 | 60 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 42 | 0 | 0 | 12 | 0 | 0 | 0 | 0 |
| STUDENT@hollow-school | 20 | 40 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 26 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| LIBRARIAN@hollow-school | 11 | 22 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WARDEN@hollow-school | 13 | 26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| DRIVER@hollow-school | 5 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PARENT@hollow | 10 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |

**Marathi walk (same measures)**

| actor | routes | renders | err | sideways | clipped | small<44 (390) | short<40 (390) | unlabelled | placeholder-only | empty w/o action | console | raw keys | no h1 | no main | bare table | axe serious | contrast nodes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TEACHER@northgate | 34 | 124 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 12 | 0 | 0 | 0 | 0 | 8 | 0 | 0 |
| PRINCIPAL@northgate | 122 | 248 | 0 | 0 | 0 | 4 | 5 | 0 | 0 | 64 | 0 | 0 | 20 | 2 | 20 | 0 | 0 |
| ADMIN@northgate | 153 | 303 | 0 | 0 | 0 | 9 | 22 | 0 | 0 | 67 | 0 | 0 | 21 | 2 | 21 | 0 | 0 |
| STUDENT@northgate | 37 | 97 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 23 | 0 | 0 | 5 | 2 | 0 | 0 | 0 |
| PARENT@northgate | 36 | 132 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 44 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| EXPERT | 7 | 28 | 0 | 0 | 0 | 0 | 4 | 0 | 4 | 4 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| DRIVER@northgate | 5 | 20 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| LIBRARIAN@northgate | 12 | 45 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| WARDEN@northgate | 14 | 53 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| ALUMNUS@northgate | 10 | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ADMIN@vidya | 159 | 234 | 136 | 0 | 0 | 0 | 6 | 0 | 0 | 34 | 0 | 0 | 0 | 0 | 4 | 0 | 0 |
| PRINCIPAL@vidya | 128 | 190 | 92 | 0 | 0 | 0 | 1 | 0 | 0 | 40 | 0 | 0 | 0 | 0 | 4 | 0 | 0 |
| STUDENT@vidya | 37 | 65 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 26 | 0 | 0 | 0 | 2 | 2 | 0 | 0 |
| ALUMNUS@vidya | 10 | 18 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@vidya(all duties) | 19 | 73 | 73 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@vidya(no duty) | 13 | 25 | 25 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HOD@vidya | 21 | 69 | 69 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXAM_CONTROLLER@vidya | 8 | 26 | 26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IQAC@vidya | 19 | 76 | 76 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| TPO@vidya | 11 | 41 | 41 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ACCOUNTS@vidya | 24 | 63 | 63 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| RECRUITER | 2 | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| OPERATOR | 17 | 68 | 68 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| APPADMIN | 7 | 28 | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ADMIN@shastri | 157 | 219 | 219 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@shastri(lab) | 13 | 26 | 26 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| STUDENT@shastri | 37 | 61 | 61 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ADMIN@sit | 5 | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PRINCIPAL@sit | 5 | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@sit(antiragging,nss) | 2 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@sit(lab) | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| FACULTY@sit(examsquad) | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HOD@sit(research) | 3 | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| HOD@sit(mech) | 2 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| EXAM_CONTROLLER@sit | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IQAC@sit | 10 | 10 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ANON | 14 | 56 | 56 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Marathi variants with an English dictionary sentence on the page: 168; with Latin words of 4+ letters: 1323 (mostly fixture names).

## Measures per actor (phone, 390 px; counts are screen renders affected)

| actor | screens | variants | skipped | err | sideways | clipped | small | short | alerts | empty | emptyNoAct | stuckLoad | noLoadSeen | blank>500 | console | overlay | rawKeys | leakMr | dupLines | unnamed | inputsNoLabel | contrast | serious |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ACCOUNTS@vidya | 9 | 17 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 8 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ADMIN@northgate | 54 | 61 | 1 | 46 | 0 | 11 | 0 | 0 | 0 | 4 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ADMIN@vidya | 54 | 73 | 0 | 0 | 0 | 41 | 0 | 0 | 0 | 36 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 | 0 | 0 |
| DRIVER@northgate | 7 | 23 | 0 | 0 | 0 | 18 | 0 | 0 | 0 | 9 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| IQAC@vidya | 10 | 24 | 0 | 0 | 0 | 13 | 0 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 | 0 | 0 | 0 | 0 |
| PARENT@northgate | 36 | 57 | 4 | 0 | 0 | 25 | 0 | 0 | 0 | 14 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| PRINCIPAL@vidya | 42 | 44 | 0 | 12 | 0 | 12 | 0 | 0 | 0 | 20 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| RECRUITER | 4 | 11 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| STUDENT@northgate | 36 | 54 | 9 | 0 | 0 | 22 | 0 | 0 | 0 | 11 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 |
| TEACHER@northgate | 37 | 56 | 0 | 0 | 0 | 28 | 0 | 0 | 0 | 12 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| TPO@vidya | 8 | 19 | 0 | 0 | 0 | 10 | 0 | 0 | 0 | 8 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |


Reading the phone table: "clipped" counts the screen's own scroll container (see By design), "empty" counts Empty cards on screen, "emptyNoAct" those with no button (all notification and check-in lines, passive). The ADMIN@northgate, PRINCIPAL@vidya and STUDENT rows include "page closed" errors from the moment the runs were stopped.

## Findings

All paths below are under `scratchpad/audit3/` unless absolute. "Reproduced alone" means re-run by itself with a single browser or curl after the walk.

### A3-states-1 · high · every web role (all pages) · web
Every `rounded-[--radius-*]`, `accent-[--*]`, `duration-[--*]`, `ease-[--*]` and `ring-offset-[--*]` utility compiles to invalid CSS under Tailwind 4.3.3, so the design tokens for corner radius, accent colour and motion are not applied anywhere.
- Steps: GET `/_next/static/chunks/apps_web_src_app_globals_*.css` on the dev server and read the rules; or open any page and read `getComputedStyle(card).borderRadius`.
- Expected: `border-radius: var(--radius-lg)` (the tokens in globals.css are 0.5, 0.875, 1.25, 1.75 rem), the kit Card, Button, inputs, chips and badges rounded, checkboxes and sliders in the brand accent, 150 ms transitions.
- Actual: 18 rules in the served CSS are invalid, for example `.rounded-\[--radius-lg\]{border-radius: --radius-lg;}`, `.accent-\[--color-accent\]{accent-color: --color-accent}`, `.duration-\[--dur\]{transition-duration: --dur}`, `.ease-\[--ease-out\]{transition-timing-function: --ease-out}`, `.ring-offset-\[--surface\]`. The browser drops them. The source has 839 `rounded-[--radius-*]`, 4 `rounded-t-[--radius-*]`, 26 `accent-[--*]`, 20 `duration-[--*]`, 5 `ease-[--*]`, 5 `ring-offset-[--*]` uses. Measured over the English walk: of 50,416 bordered boxes of 120×40 px or more, 49,777 had a 0 px radius, 529 were pills (`rounded-full`), 106 were 4 px (UA default on inputs), 4 were 14 px; computed `transition-duration` on an input is `0s`. The 32 uses of `rounded-lg|md|sm` (token-mapped, valid) do round, so a page mixes square cards with rounded boxes (admin/exams, admin/attendance, attendance/history, teacher/meetings, teacher/worksheets, teacher/practice, parent/meetings). The 4 October walk's pictures (scratchpad/campaign2/shots/walk/ADMIN/admin-390-light-en.png) are square too, so this is not new today; it was not seen because no measure compared pixels with the tokens. Tailwind has been 4.3.3 since 2026-09-07 (pnpm-lock).
- Fix direction: `rounded-(--radius-lg)` / `[var(--radius-lg)]` (same for accent, duration, ease, ring-offset), or an `@utility` per token.
- Evidence: shots/sheet-radius.jpg (4 Oct left, today right: both square), walk-en.jsonl field `radii`, the CSS rules quoted above. Reproduced alone (curl of the CSS, computed style on /login: Button 0 px, language chips 0 px, input 4 px). Untested: the production CSS from `next build`.

### A3-states-2 · high (one row with A3-journeys-6 in 02-findings.md) · ADMIN, EXAM_CONTROLLER, FACULTY, HOD, IQAC, ACCOUNTS at a college · web
A link to something that no longer exists (or a mistyped id) answers HTTP 500 and the framework's bare "Application error: a server-side exception has occurred" page; there is no `error.tsx`, `global-error.tsx` or per-segment boundary in `src/app`.
- Steps: sign in as EXAM_CONTROLLER at ZZ Vidya, open `/exam-cell/sessions/00000000-0000-4000-8000-000000000000`. Likewise `/exam-cell/sessions/<id>/{conduct,export,logistics,marks,results}`, `/exam-cell/sessions/<id>/seating/<id>`, `/faculty/lectures/<id>`, `/faculty/offerings/<id>`, `/iqac/surveys/<id>`, `/admin/college-admissions/<id>`, `/admin/payroll/runs/zz-nope`.
- Expected: the app's 404 page (not-found.tsx exists and the same walk got 404 for 83 other id routes), or an error page with the shell, a translated sentence and a way back.
- Actual: 50 of 268 id probes (25 role-and-route pairs, 12 route templates; the real-format and the junk id alike) answered 500. The dev log shows `AccessError access.thatContentNoLongerExists (NOT_FOUND)` thrown from `sessionOf` (src/lib/exam-cell.ts:84) through `sessionView` and `SessionFormsPage`, and `RuleRefusal payroll.refuseMonth 422` from the payroll run page: library errors that carry a 404 or 422 are not turned into `notFound()` by those pages. The body a person gets is Next's generic page with only a digest (no title, no shell, English only, no link). Also a 500 per stale link will raise any error-rate alert.
- Evidence: dynprobe.json (status per probe), shots/a3s-500-examcell.png (dev overlay; production shows the bare sentence, text captured: "Application error: a server-side exception has occurred … Digest: 3051370011"). Reproduced alone with curl and a single browser.

### A3-states-3 · medium · every web role · web
No route has a loading state: `find src/app -name loading.tsx` is empty (396 pages), `PageSkeleton` in components/ui/states.tsx has no caller, and the comment above it still says "Route-level `loading.tsx` files render this".
- Expected: a navigation shows the frame and a skeleton at once.
- Actual: the page paints only when the server has finished. Warm first-load time to first byte over the walk (dev server shared with two other auditors, so indicative only): median 1,254 ms, p90 5,054 ms, 1,709 of 1,999 routes over 500 ms. Never walked with a client-side click (see "Not walked").
- Evidence: walk-en.jsonl fields `ttfb`, `fcp`; `git log --all -- '*loading.tsx'` shows none ever existed. Static finding, so no repro needed.

### A3-states-4 · medium · ADMIN (registrar) at an engineering college, also any role who may act on a step · web (390 px)
The new insights call to action is a `Button` (whitespace-nowrap) and overflows a phone-width screen: `/iqac` and `/iqac/predictor` scroll sideways by 35 px as ADMIN at the demo engineering college.
- Steps: ADMIN `sit.registrar@demo.relay.test`, open `/iqac` at 390 px.
- Expected: the label wraps, no sideways scroll.
- Actual: `a` "Programmes, courses and mentoring — College office", 388 px wide, `white-space: nowrap`, right edge at 425 px; document scrollWidth 425. components/iqac/insights.tsx:35-41 (`CtaLink`) wraps the label in `<Button asChild size="sm">`. Other roles see the "Ask: …" span and do not overflow.
- Evidence: shots/a3s-iqac-cta-overflow.png, walk-en.jsonl (ADMIN@sit /iqac 390 light and dark, /iqac/predictor). Reproduced alone (dom3.mjs, desktop context at 390).
- Related, same page set: `/iqac/predictor` is 22,300 to 23,800 px tall at 390 (it was 14,000 on 4 October), `/iqac/simulator` 16,600 to 19,600 px; the rest of the new pages (simulators, NIRF, NBA, `?kind=nba`, HOD NBA) rendered with no sideways scroll, no axe serious, no console error, no unlabelled control at 1280 and 390, light and dark.

### A3-states-5 · medium · ADMIN, PRINCIPAL, ACCOUNTS, ALUMNUS desk · web (390 px)
Tables outside `TableScroll` overflow: `/admin/payroll` (+108 px, the cost-by-department table at src/app/(app)/admin/payroll/page.tsx:125) and `/admin/alumni/college` (+11 px) at the demo colleges; 23 files render `<table` with no `TableScroll` (listed in the inconsistency list).
- Expected: a table that may be wider than the screen sits in `TableScroll`.
- Actual: tests/ui-source-rules.test.ts only checks wrappers that already say `overflow-x-auto`, so a bare table is never seen; 136 bare-table variants in the walk, 12 variants with sideways scroll (ADMIN, PRINCIPAL, ACCOUNTS at SIT; ADMIN, PRINCIPAL at Vidya and Shastri for alumni/college).
- Evidence: shots/a3s-payroll-overflow.png, walk-en.jsonl `sideways`, `tablesBare`. Reproduced alone (payroll table 640 px in a 390 px page).

### A3-states-6 · medium · ADMIN, PRINCIPAL (and any role with a closed year) · web
`/archive` with a closed year fails axe (serious): `definition-list` and `dlitem` ×12.
- Steps: ADMIN or PRINCIPAL at the demo engineering college, open `/archive`, 1280 or 390, light.
- Actual: `Figure` (src/app/(app)/archive/page.tsx:260-271) puts `<dt>`/`<dd>` inside a `Card` div and a `span` that sit directly in a `<dl>`, which is invalid. Not seen at ZZ Northgate because it has no closed year (empty state).
- Evidence: detail-en.md section ADMIN@sit "serious". 4 variants each for ADMIN@sit and PRINCIPAL@sit.

### A3-states-7 · medium · EXPERT · web
`/expert/profile` throws a hydration error: the "Last checked" time in the get-paid card is rendered `10/5/2026, 3:07:17 PM` on the client and `5/10/2026, 3:07:17 pm` on the server (date formatting in the browser's locale).
- Evidence: hyd1.mjs output captured in this session, walk-en.jsonl EXPERT /expert/profile (`errors`). Reproduced alone. Source: app/(app)/expert/profile/get-paid-card.tsx (the 4 October B-15 class of bug).

### A3-states-8 · low · EXPERT · web
`/expert/availability`: the "what this time is for" input has only a placeholder (no label, aria-label or title). app/(app)/expert/availability/slots.tsx. Evidence: walk-en.jsonl `phOnly`.

### A3-states-9 · medium · every role · web
47 routes have no `<h1>`: wherever a page returns an `EmptyState` (module off, nothing yet) instead of `PageHeader`, the only heading is the EmptyState's `h2`. Most are module-off pages reached by URL (accounts/*, admin/academics/*, admin/college-*, admin/inventory/*, admin/payroll/*, library/college, hostel/squad, student/academics|registration|scholarships|money, library/e-resources); the rest are first-run pages at an institution with no rows (`/teacher`, `/teacher/classes`, `/teacher/attendance`, `/teacher/assignments`, `/teacher/assignments/new`, `/remarks/new`, `/hod`, `/bulletin/new`, `/bulletin` for a guardian with no child…).
- Fix direction: EmptyState takes a heading level, or the page keeps `PageHeader` above it.
- Evidence: detail-en.md `h1` sections (listed per role).

### A3-states-10 · low · ADMIN, PRINCIPAL and all roles reaching a module-off page · web
Module-off pages (79 route and role pairs, 11 texts, for example "Exams is not switched on") are an EmptyState with no link; for the office the sentence says "under Settings, Modules" but does not link there. Evidence: shots/a3s-web-moduleoff.png, ADMIN@northgate /exam-cell. These are reachable only by URL (the menu hides them), so low.

### A3-states-11 · low · many roles · web (390 px)
Touch targets under the 44 px floor.
- Both sides under 44 px: `/admin/inventory/assets` filter links "All" 17×20 and "In use" 39×20; `/admin/admissions/new` "Remove" 40×40; anonymous `/delete-account`, `/join`, `/privacy` "Log in" link 40×20.
- Height under 40 px (width fine): chips on `/remarks/new` 30 px; `/admin/people` filter chips 40 px; `/principal` window picker buttons 40 px; `/admin/calendar` "It lasts more than a day" 20 px; `/admin/promotion` 16 px buttons; `/appadmin/moderation` and `/appadmin/translations` 16 to 24 px buttons; `/expert/profile` 24 px buttons; 100 distinct inputs and selects at 37 to 38 px on `/admin/academics`, `/admin/attendance`, `/attendance/history`, `/admin/exams`, `/admin/filings`, `/admin/inventory/{items,movements,purchases,requests,setup}`, `/admin/payroll/{settings,structures}`, `/admin/vacancies/new`, `/faculty/practicals`, `/expert/availability`.
- Cause: a second family of field styles (see the inconsistency list). Evidence: detail-en.md `small390`, `short390`.

### A3-states-12 · low · anonymous · web
No `<main>` landmark on `/login`, `/forgot`, `/first-signin`, `/verify`, `/certificates/check`, `/certificates/exam` (13 signed-in variants of the last two as well). Evidence: walk-en.jsonl `mains`.

### A3-states-13 · low · TPO · web (390 px)
The TPO's home tab in the bottom bar is labelled with the role title "Training and placement officer", which wraps onto three lines in a one-fifth-width slot and is clipped. Evidence: shots/sheet-hollow1.jpg (second column, bottom bar). Seen in a picture only; not measured.

### A3-states-14 · medium · RECRUITER · phone
`/recruiter-drive?driveId=<unknown>`: the API answers 404 and the screen stays on its loading skeleton with no message and no retry (every other detail screen tried shows an alert: "Assignment not found", "Class not found in your school", "That drive is not one you can see…").
- Evidence: shots/sheet-phone-err.jpg (left), phone-RECRUITER.jsonl (`bad` 404 on /api/v1/recruiter/drives/…, `alerts` empty). Reproduced in a loaded run only; not re-run alone (see "Not walked").

### A3-states-15 · low · DRIVER (any role) · phone
`/person?membershipId=<unknown>` opens as an editable person screen: "Legal name for", "Date of birth for", "Pause ’s access?" with empty fields and a Save button, and no 403 or 404 alert (the screen does not fetch before it draws). The not-found alerts also offer "Try again", which cannot help on a 404. The correction chips are wider than their card ("It did not match the admission register or birth certifi…" is cut at the right edge). Evidence: shots/sheet-phone-err.jpg (middle and right).

### A3-states-16 · low · IQAC · phone (Marathi)
The new `/iqac-insights` screen shows English in a Marathi session: the "what you did last" audit labels ("Approved an internship", "Scored a qualitative NAAC metric", "The principal signed off your document" on the bell) and the role names ("College office", "Exam controller", "IQAC coordinator", "Training and placement officer"); the IQAC home shows "AISHE data capture", "NIRF data capture", "University affiliation return" in English, and the heading "Actionable insights" twice in a row. These may be server strings: the app set the language in storage only, not on the account (the 4 October B-24 limit), so a real phone may differ. Evidence: phone-IQAC_vidya.jsonl (`leak`, `dupLines`).

### A3-states-17 · low · TEACHER · phone
`/contribution` clips its option rows: "The correct option" is 386 px of content in a 324 px box and "Level" 521 in 324 (overflow hidden, no ellipsis, no wrap). Evidence: phone-TEACHER_northgate.jsonl `clipped`.

### A3-states-18 · info · every role · web (Marathi)
The Marathi walk (see its table) found no raw keys, no sideways scroll, no axe serious, no console error and `lang="mr"` on every page rendered. Remaining English was data (class, subject and fixture names) and coded defaults: "Physical education", "Work education", "Needs improvement" (report-card coded bands) on `/admin/report-cards`, "Olympiad maths", "Admissions 2026–27", "Bonafide Certificate", "Junior college", "PGT Mathematics", and the words "guardian email" on `/admin/intake`; "Excel" and "WhatsApp" are product names. The coded bands and the certificate and intake terms are worth one look by a speaker (not done).

## Inconsistency list (file → the kit component it should use)

Statically counted over `apps/web/src` (463 files use `<Button`, 68 use a raw `<button`).
1. **Field styles, five families.** The kit `TextField`/`SelectField`/`TextAreaField` (components/ui/field.tsx, `min-h-12`, token ring, 162 + 115 + 58 files) against: `inputClass` in components/hostel/parts.tsx (min-h-12, no ring), `inputClass` in components/exam-cell/parts.tsx (min-h-11, `outline-none focus:border-accent`), `INPUT` in components/module-flash.tsx (`px-3 py-2 text-sm`, about 38 px; used by about 20 college pages: admin/academics/*, faculty/*, hod/*, duties/*, student/academics, student/registration, admin/inventory/*, principal/college), local `inputClass` constants in app/(app)/admin/directory/form.tsx, admin/people/parent-link-panel.tsx (`rounded-[--radius-sm]`), admin/vacancies/new/form.tsx, and ad-hoc inputs in admin/exams/page.tsx (8), hostel/rooms/page.tsx (4), teacher/meetings/page.tsx (4), root/audit/page.tsx (4), admin/admissions/applications/page.tsx, library/page.tsx, teacher/worksheets/page.tsx, teacher/practice/page.tsx, attendance/history/page.tsx, hostel/incidents/page.tsx, admin/attendance/page.tsx, faculty/exams/page.tsx, admin/filings/page.tsx, parent/meetings/page.tsx, exam-cell marks and export pages, teacher/exams/page.tsx. Should use `TextField`/`SelectField`/`DateField` from components/ui/field.tsx (44 px floor).
2. **Page titles.** `PageHeader` (components/ui/page-header.tsx, `text-2xl sm:text-3xl`) is used by 263 files; about 30 pages hand-roll `<h1>` in ten class variants: principal/leave, remarks/[threadId] (`text-lg`), remarks/new, remarks/c/[conversationId] (`text-lg`), archive, student, student/practice/{journey,revision}, admin/promotion, admin/classes/[classId], admin/classes/new, admin/intake, admin/invites/new, competitions/{page,new,[id],[id]/entries} (no `text-fg`), explore/[schoolId], parent, people/[membershipId], enquiries/[enquiryId] (`text-xl sm:text-2xl`), teacher/attendance/register.tsx (`text-lg`), teacher/assignments/new, teacher/classes/[classId], teacher/exams, teacher/practice, reports/[studentMembershipId], bulletin/new, bulletin/[postId], vacancies/[postingId]. Should use `PageHeader` (also fixes the missing back link style).
3. **Tables outside `TableScroll`** (components/ui/table-scroll.tsx): report-cards/[cardId], iqac/surveys/[surveyId], student/academics, admin/report-cards/rules-preview.tsx, admin/fees/pupils/[id], admin/inventory/{purchases,setup,reports}, admin/alumni/college (+11 px at 390), admin/payroll/page.tsx and runs/[month] (+108 px), certificates/[certificateId], teacher/practice, reports/[studentMembershipId], account/items, components/certificates/template-preview.tsx, components/exam-cell/parts.tsx; others sit in a hand-rolled scroller. Print pages (admin/substitutions/print, fees/receipts/[id]) are fine bare.
4. **Raw buttons for kit buttons.** Filter and quick-pick chips written as `<button>` (remarks/new 30 px; admin/people controls and directory-menu; principal window picker; admin/calendar toggle; admin/promotion planner; admin/classes/row-actions; admin/classes/new teacher list; bulletin/media, bulletin/post-card) should be `Button size="sm"` (44 px) or one shared Chip. Largest raw-button files: admin/report-cards/rules-form.tsx (6), components/ui/data-toolbar.tsx (5), bulletin/media.tsx (5), components/certificates/detail-picker.tsx (4).
5. **Radius spellings.** `rounded-[--radius-X]` (839, see A3-states-1) beside `rounded-lg|md` (32, token-mapped and valid) in the same families of page; one spelling.
6. **EmptyState without a way on.** 740 EmptyState renders with no link or button; most are passive ("No incidents"). Ones whose next step exists elsewhere and should link to it: module-off pages (A3-states-10), `/principal` and `/principal/classes` "No classes yet", `/library/catalogue` "No books here yet" (LIBRARIAN: add a title), `/admin/academics` "No departments yet", `/duties/lab` "No lab yet", `/hod` "You head no department yet" (names the page, no link), `/teacher` and `/teacher/classes` for a teacher with no class, `/iqac` for ADMIN "No NAAC cycle yet" (the form is below for the IQAC; ADMIN sees the card without it).
7. **Module-off pages** build their own EmptyState in `CellOff` and equivalents (components/exam-cell/parts.tsx and per-module copies); one `ModuleOff` component with a heading and a link to Settings, Modules.

## By design and environment (excluded; not findings)
- `ERR_CONNECTION_REFUSED` on 16 variants of ADMIN@vidya (`/admin/intake`, `/admin/invites/new`, `/admin/stream-records`, `/iqac`, `/principal/college`): the dev server restarted under the walk (health uptime 2,130 s then 385 s); re-run alone, 20 of 20 variants clean (walk-en-rerun1.jsonl).
- "Header controls have no focus ring at 390 px" was first flagged on every page: a measuring artefact (the ring is a transition from 0 px); re-measured with transitions off, `outline: 3px solid`. Not a finding. The remaining 17 `focusInvis` hits are time and date segments inside DateField, as on 4 October (B-27).
- `focusBack` (54): the desktop rail comes before the content in tab order, so the focus goes down the rail and back up to the page. Skip link first, no trap. Not a finding.
- `emptyNoAct` (740): mostly passive empty states and module-off pages; only the ones listed in the inconsistency list are claimed.
- 5 `nav` 307s: `/principal` to `/principal/college` for a college head, anonymous `/login/code`, `/suspended`, `/switch` to `/login`; `/parent/*` for a guardian with no child goes to `/parent/link`; duty desks a person does not hold go to `/switch`; `/report-cards`, `/student/grades`, `/student/work` redirect. All by design.
- Wrong-role pages open `/switch` (a role chooser, shots/a3s-web-wrongrole.png) instead of a 403 sentence; recorded by design from the 4 October gate.
- Duplicate `id` reports of `[object HTMLInputElement]` are `<input name="id">` shadowing `form.id` in the walk script, not duplicate ids.
- `tinyText` (text under 12 px on every page) and the Next dev badge, the "Offline" bar in full-page pictures and the Expo dev button are development artefacts as in earlier runs.
- Phone `stuckLoading`, `blank` and the "page closed" errors in the first partial runs (phone-partial/) came from overlapping runs and a killed process; those files were discarded and the roles re-run. Remaining phone numbers are from runs with two other layers on the server; anything flagged there says so.
- Every `clipped` hit on the phone of the form `div 390×N > 390×788` is the screen's scroll container, not clipped text; filtered out of the claims above.


## Not walked (untested)
- Web, Marathi: 1,101 of the 2,454 planned renders (the walk was stopped at 20:32; those rows in walk-mr.jsonl are `error` rows from the clean-up, not results). Not reached in Marathi: the rest of PRINCIPAL@vidya, HOD and EXAM_CONTROLLER at Vidya beyond what is in the table, the ZZ Hollow actors (never planned in Marathi), most college extras. Hindi was not walked on the web or the phone at all.
- Web, forms: nothing was submitted and no flow was clicked; the slider, reset, save, load, compare and remove controls of /iqac/simulator and /hod/nba/simulator were measured at rest only (labels, targets, overflow, axe), not operated. Keyboard order was measured for the first 14 stops of nav routes at light only.
- Web loading: only time to first byte and the absence of any `loading.tsx` (A3-states-3); no client-side navigation was clicked to see a skeleton, so "renders nothing for over 500 ms" is a static and server-time statement, not a paint trace.
- Web error states at the 403 and 500 end: one 500 template family found by the id probe and a wrong-role redirect (a role chooser); no other 5xx was forced. The clinical and studio duty desks were not seen with a holder (no fixture holds them; `/duties/clinical` and `/duties/studio` redirect to /switch for everyone walked).
- Web at the empty institutions: nav routes only, English, three variants; no extras. The empty-state findings come from them.
- Phone: roles not reached: EXPERT, LIBRARIAN, WARDEN, ALUMNUS, FACULTY (all duties), HOD, EXAM_CONTROLLER, ADMIN@shastri, FACULTY@shastri, PRINCIPAL@sit, IQAC@sit, HOD@sit, OPERATOR, APPADMIN, and all ZZ Hollow actors (the phone's empty states at a fresh college were therefore not seen; the "Empty" cards seen are from the populated fixtures). Dark and Marathi only for the bar and the new insight screens, and only for roles that finished. The phone error states are: wrong id (TEACHER 5, RECRUITER 1, TPO 1) and wrong role (DRIVER 2, IQAC 2, TEACHER 2, TPO 2); no forced 500, no offline state, no loading-state trace beyond the 60 ms sampling in the first 2.5 s. Phone screens were run while two other layers used the server, so "stuck loading" and "blank" counts (3 and 0) were not re-run alone; only the ones named in findings are evidence.
- Phone in Marathi through the account's language (storage only, as on 4 October); a real phone and a speaker reading Marathi or Hindi.
- Production: `next build`, the production CSS (A3-states-1 is proven on the dev CSS only), Linux baselines.
- Contrast: axe reported 0 colour-contrast nodes in all 5,021 English and 1,353 Marathi renders; I did not cross-check it by eye on tinted role-wash backgrounds.

