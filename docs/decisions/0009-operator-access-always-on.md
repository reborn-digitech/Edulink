# 0009 — The company's team can open any school at any time, and the school sees every visit

Status: accepted by the owner (14 November 2026). Puts on record a decision the code has carried since 9 August 2026 (commit 5c15a317, "the operator's key stops asking") and that no record held. Governs `withSchoolAccess`, `recordVisit` and `accessHistory` in `apps/web/src/lib/superuser.ts`, `apps/web/src/lib/operator-oversight.ts`, `apps/web/src/lib/operator-college.ts`, the `OperatorAccess` model, and every published sentence about what the company's team can see: the privacy page, the school's sign-up note, the home page, the store listings and the Safety Centre ([0002](0002-minors-data-policy.md), amendment of 14 November 2026). No migration.

## Context

Until 9 August 2026 the operator opened one school at a time, for a reason typed before the door opened, on a sixty-minute grant; the school read the reason in its Safety Centre. On 9 August the request flow was removed: the operator holds access to every school on the installation with nothing to ask for first, and what was kept was the school being told (a visit row, one an hour, and an audit row for each read).

The words did not follow. The privacy page (14 September 2026) said the operator sees "nothing inside a school" and that any look is "time-limited, recorded with a reason"; the Safety Centre said the team "cannot open it without saying why"; decision 0002 called a look "a time-boxed, reasoned `OperatorAccess` row"; and the model's own description in `schema.prisma` still calls the row a signed-out key with a time on it. Each visit was written with the fixed English words "Operator access", which every screen then printed as the operator's reason, in a Hindi or Marathi school too. The testing analysis of 13 November 2026 found this as TA-410.

## The decision

**Access is always on, and every word about it says so.**

1. **The company's team can open any school at any time**, without asking the school and without giving a reason. This includes the list of the school's people **by name** and role, pupils among them, and **search** of that list by name or email (`listPeople`, `findPeople`), beside the school's numbers and its bulletin posts. It is not narrowed to counts, and no reason is asked before names or search.
2. **Every visit is recorded and shown to the school.** A look inside writes an `OperatorAccess` row, at most one an hour, which the school reads at the top of its Safety Centre on the web and on the phone; every read inside writes an audit row against the school (`operator.read.overview`, `.posts`, `.people`, `.people.search`, `.college`) with counts and nothing else, never a name and never the letters searched; every action (a post taken down, a person suspended or reinstated) is audited against the school as before.
3. **What the team's pages still do not do** is unchanged and is said on the privacy page too: they do not show private messages between staff and families, and cannot change a mark, an attendance day or a report card (`operator-oversight.ts`, "What is deliberately not here"). The company runs the server and the database, and the privacy page says that as well.
4. **The published words are true**: the privacy page's first section, the school's sign-up note (read before a school signs up), the home page, the three store listings and the Safety Centre's sentence say that the team can open any school at any time and that every visit is recorded and shown. They are part of the one rewrite of the public privacy texts (TA-261).

## How it was decided

The owner took the coordinating session's recommendation on 14 November 2026, on their instruction "lets do all the recommendations for all decisions in one go". Because the recommendation states publicly, for the first time, that the company's team can read every pupil's name at any time, it was held and put to the owner again in those words, together with the middle option (numbers and health always open; a reason from a fixed list, shown to the school, before the people list, a search or anything that shows names). Asked "TA-410: keep always-on operator access and say so on the privacy page?", the owner answered, in their own words, **"Yes, say so"**, on 14 November 2026.

The options not taken, so that the choice can be revisited: the middle option above; a reason from a fixed list before the first look at any school each hour (nearly the promise as first published; it reverses 9 August and puts a step before urgent support); and correcting only the model's description (the published promise would have stayed untrue).

**Counsel reads the new privacy text before it is shown to a school; that stays on the owner's list.** What the Digital Personal Data Protection Act and its Rules require of a processor's access records was not confirmed from an official copy, so this record claims nothing about them.

## What a visit row holds, and how it reads

`OperatorAccess.reason` is kept as a column and no row is rewritten. What it holds is read back as one of three kinds (`OPERATOR_VISIT_KINDS` in `packages/contracts`, `operatorVisitKind` in `superuser.ts`):

- **VISIT** — a look inside the school. The stored words are the ones every row since 9 August 2026 already carries, so those rows read correctly without being touched. Each screen says it in the reader's language (`safety.visitVisited`), never as the stored English.
- **COLLEGES_LIST** — the school's numbers read by opening the operator's list of colleges, which reads every college through the same door. It is recorded and worded as that (`safety.visitCollegesList`), with its `operator.read.college` audit row of counts as before. A list line never stands in for a look inside: a look inside while only a list line is open writes its own VISIT line, and a list opened while any line is open writes none.
- **REASON** — a row from before 9 August 2026. It keeps the reason typed then, shown as typed.

The kind travels with each visit on the two doors that hand the visitor book to a screen (`GET /api/v1/admin/safety`, `GET /api/v1/operator/schools/{schoolId}`); an answer without one reads as REASON. The four read codes of `operator-oversight.ts` have their words in the school's trail in the three languages (`ACTION_KEYS` in `safety-labels.ts`).

The model's description in `schema.prisma` is corrected to say the same (a comment only, so no SQL), applied by the coordinator beside this change.

## What this does not change

Row-level security is as it was: the operator flag by itself opens `School`, `Invite` and `SchoolModule` only (`SUPERUSER_TABLES` in `apps/web/scripts/gen-rls.ts`), and a school's other rows are reached by binding that one school, so one school's rows never show in another's queries (`npm run rls:verify`). Removing, restoring and erasing a school, and the support doors for a locked-out administrator, are as they were. Nothing is added to what the team's pages can see or do.
