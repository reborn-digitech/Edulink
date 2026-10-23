# Accounts for the campaign

Rules: no account is created through the sign-up flow; nothing is typed into a password box by a tester. Demo accounts share the password docs/demo-schools.md records (set by the owner); ZZ accounts have unknowable password hashes and are used through minted sessions only (`npm run zz:token -- ROLE [email] --tag=qa-<layer>`). The operator and app-admin accounts' password is the one the owner set on 11 October (in the coordinator's memory, not here).

## Existing, to confirm (layer 1 marks each "verified web / verified phone")
| Account | Role | School or scope | Sign-in | Verified |
|---|---|---|---|---|
| zz.operator@zz.test | OPERATOR | platform | password or minted | |
| zz.appadmin@zz.test | APPADMIN | platform | password or minted | |
| sunrise.admin@demo.relay.test | ADMIN | Sunrise Public School | password | |
| sunrise.principal@demo.relay.test | PRINCIPAL | Sunrise | password | |
| sunrise.teacher1@demo.relay.test | TEACHER (form, grade 5) | Sunrise | password | |
| sunrise.subject1@demo.relay.test | TEACHER (subject only) | Sunrise | password | |
| sunrise.spare1@demo.relay.test | TEACHER (unattached) | Sunrise | password | |
| sunrise.pupil01@demo.relay.test … pupil48 | STUDENT (grades 5–10) | Sunrise | password | |
| sunrise.parent01@demo.relay.test … (the guardians the roster lists) | PARENT | Sunrise | password | |
| sunrise.pupil49@demo.relay.test | ALUMNUS | Sunrise | password | |
| sunrise.driver01 / librarian / warden @demo.relay.test | DRIVER / LIBRARIAN / WARDEN | Sunrise | password | |
| svm.* (the same set) | all of the above | Saraswati Vidya Mandir | password | |
| <prefix>.registrar / principal / hod.<dept> / faculty1–4 / exams / iqac / tpo / accounts / librarian / warden / driver / parent / alumni01 / recruiter / studentNN @demo.relay.test, prefixes sac sit sim slc sce scp ssa sca svc sih | the college roles | the ten demo colleges | password | |
| zz.* at ZZ Northgate, ZZ Southbank, ZZ Vidya, ZZ Shastri, ZZ Dhanvantari | every school and college role, zz.expert1, zz.recruiter | the ZZ fixtures | minted | |

## Missing, to add through the fixture scripts in layer 1 (never the UI)
| Account | Role | Why |
|---|---|---|
| demo.expert01@demo.relay.test | EXPERT with an approved application and a published profile | expert journeys: application → approval → availability → a booked seat |
| demo.recruiter01@demo.relay.test | RECRUITER at a demo college | placement journeys |
| demo.parent.two@demo.relay.test | PARENT with one child at Sunrise and one at Saraswati | the cross-school family cases |

## Notes
- Features are OFF on the dev database (assistant, question bank, question gig, expert sessions, teacher sessions, job board, texts) and the three plans inactive: a layer that needs one switches it on as zz.operator through the operator's door at the start and off at the end, and says so; `npm run sweep -- --features=on --plans=on` shows the pattern.
- The payment gateway in development is the devbox transport; no real money, no real card.
