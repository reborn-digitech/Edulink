/**
 * Generates prisma/rls.sql from the schema.
 *
 *   npm run rls:generate          write it
 *   npm run rls:generate -- --check   fail if the checked-in file is stale
 *
 * Generated rather than hand-written because the failure mode of a hand-written
 * policy list is a table that quietly has none. A table with RLS enabled and no
 * policy returns nothing, which is loud; a table with RLS never enabled returns
 * EVERYTHING to every tenant, which is silent. The list therefore comes from the
 * same schema the tables come from.
 *
 * `tests/rls-sql.test.ts` runs the --check form, so a model added without
 * regenerating fails the suite rather than shipping an unprotected table.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SCHEMA_PATH = resolve(process.cwd(), "prisma/schema.prisma");
const OUT_PATH = resolve(process.cwd(), "prisma/rls.sql");

/**
 * Tables deliberately left without a school policy. Mirrors NOT_TENANT_SCOPED in
 * tests/tenancy-shape.test.ts — they hold no school-owned rows, and a policy
 * keyed on a school would make a parent invisible to themselves.
 */
const NO_SCHOOL_POLICY = new Set([
  "User",
  "Session",
  "AuthToken",
  // An external login bound to a user — read and written while signing in,
  // before any school is known. Same standing as AuthToken.
  "SsoIdentity",
  // The second step of a sign-in, minted before any school is chosen — the
  // same standing as AuthToken and Session.
  "TwoFactorChallenge",
  "PushSubscription",
  "Guardianship",
  "Competition",
  "OutboundEmail",
  // A scheduled job runs for the whole server, not for a school.
  "JobRun",
  // Counts attempts, and every one of them happens before there is a session
  // or a tenant — which is precisely the moment a limit is needed. It holds no
  // school data: a bucket name and an integer.
  "RateLimit",
  // The practice bank is a shared catalogue, exactly like Competition: a
  // question about the quadratic formula belongs to no school, and scoping it to
  // one would mean every school has an empty bank until it authors its own.
  // What a CHILD did with the bank is school-scoped — QuizAttempt,
  // QuizResponse and QuizMastery are all below and all carry a schoolId.
  "QuizTopic",
  "QuizQuestion",
  // Translations of the catalogue are the catalogue. A Hindi stem is no more
  // school-owned than the English one it translates.
  "QuizTopicTranslation",
  "QuizQuestionTranslation",
  // An expert belongs to no school, and the marketplace has to be the same for
  // everyone or the first school to look would be the only one able to book.
  // What a school DID with the marketplace — ExpertBooking, ExpertMessage — is
  // school-owned and is scoped normally.
  "ExpertProfile",
  "ExpertSlot",
  // Gigs are work done for the platform itself (decision 0004): the bank is
  // every school's, the reviewer is the content team and the payer is the
  // company, so there is no school to key a policy on. The person is the
  // fence, held in src/lib/gig-questions.ts and tested there.
  "GigSettings",
  "QuestionContribution",
  "GigEarning",
  "GigPayment",
  "GigPayee",
  // A time a provider offers. An expert's is open to every school's pupils,
  // so it can be no one school's, exactly as ExpertSlot is not; a teacher's
  // names its school in a column of its own and is held to it in
  // src/lib/gig-sessions.ts. What a PUPIL did with a slot, GigBooking, is the
  // pupil's school's row and is scoped normally.
  "GigSlot",
  // A plan the operator offers: a name, four caps and a recorded price. The
  // office reads its own school's through the School row and the operator
  // reads and writes every one; nothing in it belongs to a school.
  "Plan",
]);

/**
 * Tables whose rows the SUPERUSER may READ across every school, and nothing
 * more. One table: UsageSample, a school's monthly counts (pupils, texts,
 * storage, active people — numbers, never a name) written by the nightly
 * usage:sample job as the owner and read by the operator against the
 * school's plan. The clause goes into USING of the SELECT policy only, never
 * into WITH CHECK: the operator cannot write a count, and the school's own
 * reads stay the ordinary tenant clause.
 */
const SUPERUSER_READABLE = new Set(["UsageSample"]);

/**
 * Tables where a user may additionally READ their own rows, by the named column,
 * on the strength of `app.user_id`.
 *
 * There is exactly one, and it exists to break a genuine circle: logging in has
 * to ask which schools somebody belongs to, and the answer is in a table scoped
 * by school. No school is known yet — that is the question. Every other route to
 * an answer is worse: a second privileged connection reintroduces the bypass RLS
 * exists to remove, and denormalising the list onto User duplicates the source of
 * truth for authorisation.
 *
 * READ ONLY, and the asymmetry is the safeguard. `app.user_id` appears in USING
 * and never in WITH CHECK, so this cannot insert a membership — which would be
 * self-service enrolment into whichever school you named.
 */
const SELF_READABLE: Record<string, string> = {
  Membership: "userId",
  // The same bootstrap, for the same reason: an expert's schools ARE their
  // confirmed bookings, so this table has to be readable before any school is
  // known. Read-only and keyed on their own user id, so it opens their own
  // bookings and nobody else's.
  ExpertBooking: "expertUserId",
  // Same bootstrap again: an expert mentoring a child at a school reaches that
  // school through this table, so it has to be readable before any school is
  // known. Read-only, keyed on their own user id.
  MentorThread: "expertUserId",
  // The same bootstrap a third time: an expert's sessions with pupils are
  // bookings in those pupils' schools, and the expert has no school. Their
  // own bookings, by their own user id, read-only. What they write to one
  // (how it went, a cancellation) the server writes under the school's
  // binding after the library has found the booking to be theirs.
  GigBooking: "providerUserId",
  // A LEAVING CERTIFICATE OUTLIVES THE MEMBERSHIP IT DESCRIBES, which is the
  // whole difficulty. The moment a pupil leaves Riverside, Riverside drops out
  // of their tenant set — correctly — and a policy keyed only on `schoolId`
  // would hide their own certificate from them at exactly the moment they need
  // to show it to somebody. Keyed on their user id it opens theirs and nobody
  // else's, read-only like every other clause here.
  SchoolRecord: "studentUserId",
  // The opener of a cross-school enquiry. The row lives in the TARGET
  // school's tenant so the school can answer it; this is how the parent or
  // teacher who opened it keeps reading it — and how their enquiries page
  // can list them before any school of theirs is known.
  Enquiry: "fromUserId",
  // A family's own admission application, read from the applicant's side
  // where no school binding exists yet; every write the family makes to it
  // goes through the server under the school's own binding (forSchool),
  // after the library has checked the applicant is this user.
  Application: "applicantUserId",
  /**
   * A NOTIFICATION BELONGS TO ITS PERSON. It was tenant-only for as long as
   * every notification's school was one of its reader's — and the enquiry
   * desk broke that comfortable accident: "the school replied to your
   * enquiry" carries the TARGET school's id, and a parent exploring a school
   * their child does not attend has no binding there, so the one row telling
   * them they were answered was unreadable to exactly them. Read-only, keyed
   * on their own user id, like every clause in this map — writes stay
   * tenant-scoped, so nobody can mint a notification into another school.
   */
  Notification: "userId",
  // Somebody who asked to join reads their own request — which is all they
  // can read of the school until it is approved: that it is waiting, or that
  // it was declined. Read-only; the request is written by the server under
  // the school's binding, and decided by the school.
  JoinRequest: "userId",
  // The same for somebody who asked to be a child's guardian.
  GuardianClaim: "claimantUserId",
};

/**
 * A CHILD'S OWN RECORD, WHICH OUTLIVES EVERY MEMBERSHIP IT WAS MADE UNDER.
 *
 * The problem `SchoolRecord`'s SELF_READABLE clause solved for one table, now
 * for the rest of what a school writes about a child. The moment a pupil leaves,
 * that school drops out of their tenant set — correctly — and every policy keyed
 * on `schoolId` alone stops handing over their report cards, their attendance
 * and the badges they earned. A leaver could see the certificate saying they had
 * been somewhere and nothing describing what they did there.
 *
 * That is the wrong default for a record ABOUT A PERSON. A school's operational
 * rows — its registers, its bulletin, its assignments — belong to the school and
 * end with the membership. A child's report card does not: it is a document
 * addressed to them and their family, and a family that moves to a school not on
 * this platform, or to no school at all, must still be able to open it.
 *
 * TWO WAYS IN, and the difference between them matters:
 *
 *   THE CHILD, through Membership. That subquery is narrowed by Membership's own
 *   policy, which grants `userId = app.user_id` with no school bound — so it
 *   resolves to exactly the row needed and nothing else. Depending on another
 *   table's policy is a thing this file is wary of, so: it fails CLOSED. If
 *   Membership's self clause ever went away this would return nothing rather
 *   than everything.
 *
 *   THE GUARDIAN, through Guardianship, which carries `studentMembershipId`
 *   directly and has NO policy at all (see the foot of rls.sql). So the parent
 *   branch depends on nothing and works before any school is known — the same
 *   property the parent session bootstrap already relies on. It is deliberately
 *   keyed on the MEMBERSHIP rather than the child: a parent linked at Riverside
 *   reads Riverside's record, and reads Oakfield's when Oakfield links them too.
 *   A school's records stay the school's to hand over.
 *
 * READ ONLY, like every widening here — FOR SELECT, never WITH CHECK, and never
 * in a USING that governs DELETE. A family may read their record forever; only
 * the school that wrote it may change it, and only while they are its pupil.
 *
 * WHAT IS DELIBERATELY ABSENT. Grade is not here: a report card is the frozen
 * document and a live gradebook is the school's working surface, so a leaver
 * reads the card rather than the marks behind it. AttendanceSession is not here
 * either, which is why the record shows FIGURES and never the day-by-day
 * register — the register is the school's operational record of a room, not a
 * document about one child.
 */
const OWN_RECORD_READABLE: Record<string, string> = {
  ReportCard: ownRecordClause(`"ReportCard"."studentMembershipId"`),
  AttendanceRecord: ownRecordClause(`"AttendanceRecord"."studentMembershipId"`),
  EarnedBadge: ownRecordClause(`"EarnedBadge"."studentMembershipId"`),
  // The items ARE the card. Reached through their parent, so one rule governs
  // both and a card that is readable can never render empty.
  ReportCardItem: `EXISTS (
            SELECT 1 FROM "ReportCard" rc
             WHERE rc."id" = "ReportCardItem"."reportCardId"
               AND (${ownRecordClause(`rc."studentMembershipId"`)})
          )`,
};

/**
 * Tables where an active GUARDIAN may read their child's row.
 *
 * Separate from the map above because these two are already self-readable by the
 * child through a column of their own, and only the parent half is missing.
 *
 * Membership is what lets a guardian list the schools their child has attended —
 * the "journey" — including the ones they have left. SchoolRecord is the
 * certificate, and a guardian reading it is the ORIGINAL design rather than an
 * extension: the file that writes one says in as many words that the certificate
 * is the family's, because they are the ones who hand it to the next school.
 */
const GUARDIAN_READABLE: Record<string, string> = {
  Membership: guardianOf(`"Membership"."id"`),
  SchoolRecord: guardianOf(`"SchoolRecord"."studentMembershipId"`),
  // A claim on a child is shown to the guardians the child already has: they
  // are the people who would know it was wrong, and one of them may decide
  // it. Read-only — their decision is written by the server under the
  // school's binding, after the library has found them to be a guardian.
  GuardianClaim: guardianOf(`"GuardianClaim"."studentMembershipId"`),
};

/**
 * ⚠ THE SCHOOL BEHIND A STUDENT CODE, which the parent claim was crashing on.
 *
 * The CODE_READABLE comment below promises "a parent typing their child's
 * student code" a way in — and Membership honours it — but School was only
 * ever readable by its OWN code, so `claimChild`'s required `school` include
 * came back null and Prisma threw a 500 at the first parent whose tenant set
 * was still empty. A parent with a child already visible never hit it, which
 * is why every seeded walk passed.
 *
 * Same shape as the code clause itself: read-only, an equality against a code
 * the caller already typed, one school's id and name — exactly what the claim
 * form is about to show them on success anyway.
 */
const CODE_SCHOOL_READABLE = `EXISTS (
            SELECT 1 FROM "Membership" cm
             WHERE cm."schoolId" = "School"."id"
               AND cm."studentCode" = current_setting('app.join_code', true)
          )`;

/** "…is an active guardian of the pupil this membership belongs to." */
function guardianOf(membershipRef: string): string {
  return `EXISTS (
            SELECT 1 FROM "Guardianship" g
             WHERE g."studentMembershipId" = ${membershipRef}
               AND g."parentUserId" = current_setting('app.user_id', true)
               AND g."status" = 'ACTIVE'
          )`;
}

/** "…is the child this row is about, or one of their active guardians." */
function ownRecordClause(membershipRef: string): string {
  return `${guardianOf(membershipRef)}
          OR EXISTS (
            SELECT 1 FROM "Membership" m
             WHERE m."id" = ${membershipRef}
               AND m."userId" = current_setting('app.user_id', true)
          )`;
}

/**
 * Tables where a row belonging to NO school may be written.
 *
 * There is exactly one, and it is the audit log. Some of the things most worth
 * recording happen before any school is known — a login, a failed login, someone
 * registering a school that does not exist yet — and a policy keyed on `schoolId`
 * refuses those outright, because `NULL = ANY(...)` is NULL and never true. The
 * result was an audit trail missing every sign-in, silently, since `audit()`
 * swallows its own failures by design.
 *
 * WRITE ONLY. The USING clause is untouched, so an unattributed row is visible
 * to no school's Safety Centre — it belongs to whoever runs the server, the same
 * way the orphan file sweep does. It can leak nothing to a tenant precisely
 * because it belongs to none.
 */
const NULL_SCHOOL_WRITABLE = new Set(["AuditLog"]);

/**
 * Tables where a SUPERUSER may READ the rows that belong to no school.
 *
 * The other half of NULL_SCHOOL_WRITABLE, and it was missing. Every operator
 * action — a school created, an admin invited, an invitation revoked — is
 * audited with `schoolId` NULL precisely so that it lands in no tenant's Safety
 * Centre. Which meant nothing could read it: the rows were written, no school
 * could see them, and neither could the person who wrote them. An audit trail
 * with no reader is a file nobody opens, and it is worse than none, because it
 * is trusted.
 *
 * NARROW ON PURPOSE. This is `schoolId IS NULL` AND superuser — not "superuser
 * may read AuditLog", which would hand the operator every school's history and
 * break the one promise the /root pages make. A tenant's audit rows carry a
 * schoolId and stay exactly as unreachable as they were.
 *
 * READ ONLY, like every other clause in `alsoReadable`: it goes into the FOR
 * SELECT policy, never into WITH CHECK, and — the lesson that cost a join-code
 * hole — never into a USING that governs DELETE.
 */
const SUPERUSER_NULL_READABLE = new Set(["AuditLog"]);

/**
 * Tables a SUPERUSER may read and write outside any school.
 *
 * THE FIRST ACTOR THIS SCHEMA HAS EVER HAD ABOVE A SCHOOL, so the list is two
 * tables long and each one is here for a stated reason:
 *
 *   - School, because somebody has to create one. Registration can mint a school
 *     with no tenant already (that is how a school signs itself up), but nobody
 *     could LIST schools or correct a name afterwards without being a member of
 *     each — which is not a thing the person running the server should have to
 *     become.
 *
 *   - Invite, because the way a school gets its first admin is an invitation,
 *     and the invitation has to be written before that admin exists.
 *
 * WHAT IS DELIBERATELY ABSENT IS THE POINT. Membership, Grade, AttendanceRecord,
 * RemarkMessage, Post — none of them are here, so a superuser querying a child's
 * marks gets nothing back from Postgres, not merely a hidden button. The
 * operator of this server can set up a school and can invite its administrator;
 * they cannot read a single register.
 *
 * NOT read-only, unlike every other widening in this file — creating a school
 * is a write. So this clause goes into the FOR ALL policy, in USING and in WITH
 * CHECK, rather than into the FOR SELECT one. That does mean a superuser can
 * DELETE a school, cascading everything it owns. That is a real power and it is
 * the honest one: this flag means "whoever runs the server", and whoever runs
 * the server has `psql`. The UI offers no delete.
 *
 * Superuser AUDIT rows are written with schoolId NULL through NULL_SCHOOL_WRITABLE
 * above, with the school named in `meta`. They therefore appear in no school's
 * Safety Centre — an operator's actions belong to the operator, not to a tenant.
 */
const SUPERUSER_TABLES = new Set(["School", "Invite"]);

/**
 * The operator's own visitor book, and the only APPEND-ONLY table in this
 * schema.
 *
 * `OperatorAccess` records that whoever runs the server opened one school, when,
 * for how long, and why. That record is the entire justification for the feature
 * — the operator gains sight of a school and gives up doing it unobserved — so
 * it has to survive both of the people it concerns:
 *
 *   THE SCHOOL MUST NOT BE ABLE TO DELETE IT. Under the ordinary tenant policy
 *   an admin can DELETE their own school's rows, so a school could quietly erase
 *   the history of who looked at it. That is not the threat that worries me
 *   most, but a visitor book somebody can tear pages out of is not a record.
 *
 *   THE OPERATOR MUST NOT BE ABLE TO DELETE IT EITHER, and this is the one that
 *   matters. While a grant is live they are bound to that school exactly as an
 *   admin is — which would otherwise let them look, act, and then remove the
 *   evidence they had been there.
 *
 * So there is NO DELETE POLICY AT ALL on this table, for anybody. Postgres
 * denies what no policy permits, so the rows are append-only in the database
 * rather than by convention. INSERT and UPDATE are the operator's alone (they
 * have to be able to close a grant early); READING is the school's, which is
 * what puts the visit in their Safety Centre.
 *
 * Whoever runs the server still has `psql` and can truncate anything. This is
 * not a defence against them; it is a defence against the UI, the ORM, and a
 * bad afternoon — the same honest limit `SUPERUSER_TABLES` states about school
 * deletion.
 */
const OPERATOR_LOG_TABLES = new Set(["OperatorAccess"]);

/**
 * Tables where SOME rows are readable by every school, by the predicate given.
 *
 * The global feed, and the only place in this schema where one school's row is
 * deliberately visible to another. It is narrow on purpose:
 *
 *   - READ ONLY. The predicate is added to USING and never to WITH CHECK, so a
 *     school can see another school's global post and can never write, edit or
 *     moderate one. Publishing stays a write inside the owning school, which is
 *     the whole reason `schoolId` is kept on a global post rather than nulled:
 *     provenance and accountability do not leave the school that published.
 *
 *   - STATUS IS IN THE PREDICATE. `scope = 'GLOBAL'` alone would expose a post
 *     the moment its scope was set, including one still PENDING or already
 *     REJECTED by its own school's moderation. A post reaches other schools only
 *     after its own school has approved it.
 *
 * Competition solves the same problem by having no policy at all, which works
 * because a competition holds nothing private. Post holds a great deal, so it
 * keeps its policy and widens it by exactly one clause.
 */
const GLOBALLY_READABLE: Record<string, string> = {
  Post: `"scope" = 'GLOBAL' AND "status" = 'APPROVED'`,
  /**
   * THE CONVERSATION ON A GLOBAL POST CROSSES WITH THE POST. A global feed
   * where every school can read but only the publisher can clap is a notice
   * board wearing a feed's clothes, so reactions and comments on an approved
   * GLOBAL post are readable across schools — anchored on the post's own
   * global predicate, so the moment a school unpublishes, the conversation
   * snaps back to school-private with it.
   *
   * COMMENTS CARRY ONE MORE CONDITION: a held student comment must not leave
   * its review queue. Cross-school readers see APPROVED comments and their
   * OWN in any state (a child must see their own words waiting), and nobody
   * else's pending. Staff of the publishing school still see the queue
   * through the ordinary tenant clause — reviewing stays the publisher's job.
   */
  Reaction: `EXISTS (
           SELECT 1 FROM "Post" p
            WHERE p."id" = "Reaction"."postId"
              AND p."scope" = 'GLOBAL'
              AND p."status" = 'APPROVED')`,
  Comment: `("Comment"."status" = 'APPROVED'
              OR "Comment"."authorUserId" = current_setting('app.user_id', true))
          AND EXISTS (
           SELECT 1 FROM "Post" p
            WHERE p."id" = "Comment"."postId"
              AND p."scope" = 'GLOBAL'
              AND p."status" = 'APPROVED')`,
  /**
   * A SCHOOL'S standing in a competition whose organiser has switched the
   * leaderboard on. The second row in this map, and the reasoning is the same
   * shape as the first with one addition worth spelling out.
   *
   * WHAT CROSSES IS A SCHOOL, NOT A CHILD. `CompetitionStanding` holds a school
   * name, a count, a best place and a best score, and no column that could name
   * or identify a pupil — see the model. The alternative was to widen
   * `CompetitionEntry`, which is where the names and the individual scores are,
   * and that would have made a leaderboard the first feature in this app to
   * show one school another school's children. That is a decision, it was made
   * deliberately, and it was made the other way.
   *
   * THE FLAG IS IN THE PREDICATE, exactly as `status = 'APPROVED'` is for Post.
   * `leaderboardEnabled` alone governs whether a standing leaves its school, so
   * turning a leaderboard off closes the board in the DATABASE rather than in a
   * page's `if`. Rows keep being maintained either way, which is what lets an
   * organiser switch it on mid-competition and see the truth.
   *
   * THE SUBQUERY IS SAFE AND DEPENDS ON NOTHING. `Competition` carries no policy
   * at all (it belongs to no school — see NO_SCHOOL_POLICY), so this cannot fail
   * closed for the wrong reason and cannot recurse.
   *
   * PLATFORM COMPETITIONS ONLY. A cross-school leaderboard is only meaningful
   * for a competition every school can enter, and since a school-posted
   * competition became its own school's alone, its standing row crossing would
   * be pure leak: no page could show it (the competition itself answers NOT
   * FOUND to other schools), so the only reader would be a crafted query. The
   * `organizerSchoolId IS NULL` arm closes that in the database, matching the
   * visibility rule in competitions.ts clause for clause.
   *
   * READ ONLY, like every clause here: USING only, never WITH CHECK, so a school
   * maintains its own standing row and can never write, edit or delete another
   * school's.
   */
  CompetitionStanding: `EXISTS (
           SELECT 1 FROM "Competition" c
            WHERE c."id" = "CompetitionStanding"."competitionId"
              AND c."organizerSchoolId" IS NULL
              AND c."leaderboardEnabled" = true
         )`,

  /**
   * THE DIRECTORY, AND THE JOB BOARD BEHIND IT. A school becomes readable
   * across the platform by its own act and by nothing else: publishing its
   * profile (an explicit admin decision — see school-profile.ts) or holding
   * an open vacancy. Both arms sit under `removedAt IS NULL`, so a school
   * taken off the installation vanishes from the directory with it.
   *
   * WHAT CROSSES IS THE PROSPECTUS, NOT THE SCHOOL. The School row holds a
   * name, an address, a website, a grade range and the profile text — the
   * things a school prints on paper and hands to strangers. Its people, its
   * classes and everything else remain ordinary school-scoped rows this
   * clause cannot reach.
   *
   * THE SUBQUERY IS ONE-WAY ON PURPOSE. JobPosting's own global clause below
   * is `status = 'OPEN'` and deliberately does not join School back — a
   * policy pair that each reference the other is infinite recursion in
   * Postgres. The removal machinery closes a removed school's postings
   * instead (superuser.ts), which keeps both clauses honest without the
   * cycle.
   */
  School: `"removedAt" IS NULL
          AND ("profilePublishedAt" IS NOT NULL
           OR EXISTS (
           SELECT 1 FROM "JobPosting" j
            WHERE j."schoolId" = "School"."id"
              AND j."status" = 'OPEN'))`,
  /**
   * An open vacancy is the marketplace, like an expert's slot: the board only
   * works if every school's teachers see the same one. See the School clause
   * above for why this does not join School — removal CLOSES postings rather
   * than a policy filtering them.
   */
  JobPosting: `"status" = 'OPEN'`,
  /**
   * NOT GLOBAL AT ALL — the opener of an enquiry reading the school's
   * replies. The Enquiry row itself crosses through SELF_READABLE on
   * `fromUserId`; its messages have no user column of the opener's to key
   * on, so the predicate walks up to the parent enquiry. Read only, like
   * everything in this map: the opener REPLYING is a separate INSERT policy
   * below, pinned to their own authorship on their own enquiry.
   */
  EnquiryMessage: `current_setting('app.user_id', true) <> ''
          AND EXISTS (
           SELECT 1 FROM "Enquiry" e
            WHERE e."id" = "EnquiryMessage"."enquiryId"
              AND e."fromUserId" = current_setting('app.user_id', true))`,
};

/**
 * Tables a school may read ABOUT A PERSON WHO IS CURRENTLY ONE OF THEIRS.
 *
 * There is exactly one, and it is the leaving certificate. This is the only
 * clause in this file that lets one school read a row another school wrote, so
 * it is worth being precise about what it does and does not open.
 *
 * WHAT IT IS FOR. A child transfers from Riverside to Oakfield. Oakfield needs
 * to know where the child came from, what grade they reached and roughly how
 * their attendance went — which is what a transfer certificate has carried on
 * paper for a century. Riverside wrote that document deliberately, knowing it
 * would be handed over.
 *
 * WHAT IT IS NOT. It is not a window into Riverside. `SchoolRecord` holds a
 * summary and counts; Riverside's marks, registers, messages and report cards
 * are ordinary school-scoped rows and remain exactly as unreachable as they were
 * — this clause is on ONE table and cannot reach any other. Nor does it let
 * Oakfield browse: the EXISTS is anchored on a live ACTIVE membership in
 * Oakfield, so it opens certificates for the children Oakfield actually teaches
 * and for nobody else. A child who leaves Oakfield too drops straight back out
 * of it, because `leftAt` is in the predicate.
 *
 * WHY THE SUBQUERY IS SAFE. It reads Membership, which has its own policy, and
 * that policy composes rather than conflicts: it already restricts to this
 * caller's schools, and the predicate below asks for the same thing again
 * explicitly. There is no recursion — Membership's policy references no table.
 *
 * THE `m."schoolId" = ANY(...)` LINE IS REDUNDANT TODAY, AND STAYS. Deleting it
 * was tried against `npm run rls:verify` and every check still passed, because
 * Membership's own policy had already narrowed the subquery to this caller's
 * schools. That is defence in depth doing its job, not a spare line: the moment
 * this clause depends on ANOTHER table's policy for its safety, a change over
 * there silently becomes a change to who can read a child's history. Replacing
 * the whole predicate with `true` IS caught, which is the check that matters.
 *
 * READ ONLY, like everything else here: it goes into the FOR SELECT policy and
 * never into WITH CHECK, so Oakfield can read the certificate and can never
 * write, edit or withdraw one. Issuing stays with the school that signed it.
 *
 * A PUPIL'S ROLL, NOT ANY MEMBERSHIP. The audit's third finding: the clause
 * was anchored on a live membership of any kind, so a school that employed
 * somebody as a TEACHER could read every leaving certificate that person had
 * ever been issued as a child. The transfer flow only ever reads through
 * `recordsForStudentMembership` (src/lib/school-record.ts), which resolves the
 * membership with `role: "STUDENT"` first — so the policy now says the same
 * thing: the child must be on THIS school's roll as a pupil, now. A school's
 * staff room opens nobody's history. The pupil, their guardians and the
 * issuing school keep their own ways in (SELF_READABLE, GUARDIAN_READABLE and
 * the tenant clause), which do not pass through here.
 *
 * WHAT IS KEPT, AND WHY IT IS SAID OUT LOUD: the receiving school still reads
 * the certificate under nothing more than its ordinary tenant binding, because
 * that is the transfer flow — `npm run rls:verify` asserts it by name ("…and
 * so can the school the child attends NOW") and the office's records page
 * depends on it. Narrowing it to an explicit per-read setting would be a
 * stronger door; it was not done here because the verify script, which is the
 * proof this file is measured against, binds the school and nothing else.
 */
const MEMBER_READABLE: Record<string, string> = {
  SchoolRecord: `EXISTS (
           SELECT 1 FROM "Membership" m
            WHERE m."userId" = "SchoolRecord"."studentUserId"
              AND m."schoolId" = ANY (string_to_array(current_setting('app.school_ids', true), ','))
              AND m."role" = 'STUDENT'
              AND m."status" = 'ACTIVE'
              AND m."leftAt" IS NULL
         )`,
};

/**
 * WHAT AN EXPERT MAY REACH, KEYED ON THE ENGAGEMENT AND NOT ON THE SCHOOL.
 *
 * An expert belongs to no school. They used to be given one anyway: every
 * school with a confirmed booking or an active mentorship went into their
 * tenant set, and the tenant clause then opened that school's EVERY table to
 * them — its registers, its marks, its pupils' records — with only the
 * application's own checks standing between an outside adult and all of it.
 * The security assessment of 2026-09-24 called that what it was (finding 16):
 * one booking opened the whole school at database level.
 *
 * Their tenant set is now EMPTY (src/lib/tenant-request.ts), and what they
 * need is named here, each clause an equality on their own user id through
 * the booking or the mentorship itself:
 *
 *   ExpertMessage  the conversation of a booking that is theirs and CONFIRMED
 *   MentorMessage  the conversation of a mentorship that is theirs and ACTIVE
 *   School         the school of such a booking or mentorship — its name on
 *                  their list, its clock for a notification's quiet hours
 *   Membership     the one member of staff who booked them, and the one pupil
 *                  they mentor; nobody else at the school
 *
 * ExpertBooking and MentorThread themselves are already theirs to read
 * through SELF_READABLE. A booking that is cancelled and a mentorship that
 * has ended drop out of every clause at once, as they dropped out of the
 * tenant set before: access ends when the engagement does, and nothing has
 * to revoke it.
 *
 * READ ONLY, like every clause in a FOR SELECT policy. What an expert WRITES
 * is four narrow policies further down, each pinned to their own authorship.
 *
 * THE SUBQUERIES ARE SAFE. ExpertBooking and MentorThread are narrowed by
 * their own policies to the caller's own rows, which is what each clause asks
 * for again explicitly; neither of those policies reads School or Membership,
 * so nothing here can recurse.
 */
const mine = `current_setting('app.user_id', true) <> ''`;
const expertBooking = (on: string, live = true) => `EXISTS (
           SELECT 1 FROM "ExpertBooking" eb
            WHERE ${on}
              AND eb."expertUserId" = current_setting('app.user_id', true)${live ? `
              AND eb."status" = 'CONFIRMED'` : ""})`;
const mentorThread = (on: string, live = true) => `EXISTS (
           SELECT 1 FROM "MentorThread" mt
            WHERE ${on}
              AND mt."expertUserId" = current_setting('app.user_id', true)${live ? `
              AND mt."status" = 'ACTIVE'` : ""})`;

const EXPERT_READABLE: Record<string, string> = {
  ExpertMessage: `${mine}
          AND ${expertBooking(`eb."id" = "ExpertMessage"."bookingId"`)}`,
  MentorMessage: `${mine}
          AND ${mentorThread(`mt."id" = "MentorMessage"."threadId"`)}`,
  School: `${mine}
          AND (${expertBooking(`eb."schoolId" = "School"."id"`)}
           OR ${mentorThread(`mt."schoolId" = "School"."id"`)})`,
  Membership: `${mine}
          AND (${expertBooking(`eb."bookedByMembershipId" = "Membership"."id"`)}
           OR ${mentorThread(`mt."studentMembershipId" = "Membership"."id"`)})`,
};

/**
 * WHAT AN EXPERT MAY WRITE INTO A SCHOOL'S TENANT BY POLICY, which is two
 * things.
 *
 *   A message in their own booking or mentorship, signed by them, filed under
 *   the school the engagement belongs to — the school on the row must be the
 *   engagement's, or a crafted insert could ride one school's booking into
 *   another school's tenant.
 *
 *   Their own booking, to cancel it. UPDATE only, pinned to their user id on
 *   both sides, so they can change their booking and cannot give it away.
 *
 * WHAT IS NOT HERE, AND WHY. Telling the school ("the expert cancelled") and
 * the line in the school's log are writes too, and a policy for them was
 * tried: it cannot work. Prisma writes with RETURNING, and Postgres returns
 * a row only to somebody who may also READ it — a notification is its
 * recipient's and an audit line is the school's, and opening either to an
 * outside adult to read is the wrong trade. So those two are written by the
 * server under the school's own binding (`forSchool`), after the library
 * has established that the booking or the mentorship is this expert's — the
 * same construction a family's admission application uses. See
 * `asTheSchool` in src/lib/experts.ts.
 */
const EXPERT_WRITES: Record<string, { name: string; command: "INSERT" | "UPDATE"; using?: string; check: string; note: string }[]> = {
  ExpertMessage: [{
    name: "expert_insert", command: "INSERT", note: "An expert's own message in their own confirmed booking.",
    check: `${mine}
          AND "authorUserId" = current_setting('app.user_id', true)
          AND ${expertBooking(`eb."id" = "ExpertMessage"."bookingId"
              AND eb."schoolId" = "ExpertMessage"."schoolId"`)}`,
  }],
  MentorMessage: [{
    name: "expert_insert", command: "INSERT", note: "An expert's own message in their own active mentorship.",
    check: `${mine}
          AND "authorUserId" = current_setting('app.user_id', true)
          AND ${mentorThread(`mt."id" = "MentorMessage"."threadId"
              AND mt."schoolId" = "MentorMessage"."schoolId"`)}`,
  }],
  ExpertBooking: [{
    name: "expert_update", command: "UPDATE", note: "An expert cancelling their own booking.",
    using: `${mine}
          AND "expertUserId" = current_setting('app.user_id', true)`,
    check: `${mine}
          AND "expertUserId" = current_setting('app.user_id', true)`,
  }],
};

/**
 * Tenant tables that are APPEND-ONLY for the application: INSERT and SELECT,
 * never UPDATE or DELETE.
 *
 * There is one, and it is the audit log. `audit.ts` has called itself
 * "append-only" since the first commit, and for as long as the policy was FOR
 * ALL that was a promise made by the ORM's call sites rather than by the
 * database: any code path bound to a school — a compromised admin session, a
 * bug, a bad afternoon — could UPDATE the line saying what it had done, or
 * DELETE it. A log that can be edited by the people it describes is a diary.
 *
 * So the write policy on these tables is FOR INSERT ONLY. Postgres denies what
 * no policy permits, so with no UPDATE or DELETE policy the app role cannot
 * change or remove a row however it is bound — the same construction that
 * makes OperatorAccess append-only, applied to the table whose whole purpose
 * is to be believed. `scripts/db-grants.mjs` revokes UPDATE and DELETE from the
 * app role as well, so the refusal is a privilege error rather than a silent
 * zero even if a policy is ever added back.
 *
 * WHO STILL DELETES: the retention sweep, which runs on the OWNER connection
 * (JOBS_RUNNER=1 in src/lib/db.ts) and prunes by age for every school at
 * once. The owner is a role that bypasses row security, which is why the sweep
 * worked before this change and why it still does; a school deleted entirely
 * takes its audit rows with it through the foreign key's cascade, which
 * Postgres runs as the table owner and outside row security by definition.
 */
const APPEND_ONLY = new Set(["AuditLog"]);

/**
 * Tables where the row matching an unguessable CODE may be read, by the named
 * column, on the strength of `app.join_code`.
 *
 * The other bootstrap, and the one that had the whole front door shut. A child
 * typing a class join code, or a parent typing their child's student code, has
 * no session, no membership and no school — and the row the code names is the
 * thing that would say WHICH school to scope to. A policy keyed on `schoolId`
 * therefore refuses the one query that could ever answer it, and every join code
 * on the installation reads as "we could not find that code".
 *
 * READ ONLY, and exactly one row. `app.join_code` never appears in a WITH CHECK,
 * and the clause is an equality against a code the caller has already typed —
 * so it cannot enumerate, cannot widen to a school, and cannot write. Knowing
 * the code is the authorisation, which is precisely what a join code was for
 * before any of this was school-scoped.
 */
/**
 * Rows ADDRESSED to the signed-in person, by their own verified email.
 *
 * The one case: a signed-in user with no school lands on /join, and a
 * pending invitation to their own address sits in a school's tenant where
 * they cannot see it — so the page used to say "go back to your email".
 * This opens exactly the PENDING invitations whose address equals the
 * caller's OWN, and only when that address is VERIFIED: an unverified
 * address is a claim, not a fact, and a claim must not read another
 * school's rows. Read-only; accepting still goes through the token.
 */
const ADDRESSEE_READABLE: Record<string, string> = {
  Invite: `"Invite"."status" = 'PENDING'
            AND current_setting('app.user_id', true) <> ''
            AND lower("Invite"."email") = (
              SELECT lower(u."email") FROM "User" u
              WHERE u."id" = current_setting('app.user_id', true)
                AND u."emailVerifiedAt" IS NOT NULL
            )`,
};

const CODE_READABLE: Record<string, string> = {
  Class: "joinCode",
  School: "code",
  Membership: "studentCode",
  // An invitation link is the same kind of thing: an unguessable credential
  // presented before there is any session. The stored value is the token's
  // SHA-256, so what gets bound is the hash, never the token itself.
  Invite: "tokenHash",
  // An expert accepting an invitation has no school and no membership; the
  // token is the only thing they hold. Same read-only bootstrap as Invite.
  ExpertInvite: "tokenHash",
};

function models(): string[] {
  const schema = readFileSync(SCHEMA_PATH, "utf8");
  const found: string[] = [];
  const re = /^model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(schema)) !== null) {
    const [, name, body] = m;
    if (name === "School" || /^\s*schoolId\s/m.test(body!)) found.push(name!);
  }
  return found;
}

/**
 * The scalar columns of one model, in schema order — what a row-level trigger
 * has to compare when it asks "did anything but X change?". Read from the
 * schema rather than listed by hand so a column added to the model tomorrow is
 * frozen by the same trigger without anybody remembering this file.
 *
 * A relation field's type is another model's name; everything else is a
 * scalar or an enum and is a column. `@@` lines and `///` comments are not
 * fields.
 */
function scalarColumns(model: string): string[] {
  const schema = readFileSync(SCHEMA_PATH, "utf8");
  const names = new Set(
    [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]!),
  );
  const body = new RegExp(`^model\\s+${model}\\s*\\{([\\s\\S]*?)^\\}`, "m").exec(schema)?.[1];
  if (!body) throw new Error(`no model ${model} in the schema`);
  const columns: string[] = [];
  for (const line of body.split("\n")) {
    const field = /^\s*(\w+)\s+(\w+)(?:\[\])?\??(?:\s|$)/.exec(line);
    if (!field || line.trim().startsWith("//") || line.trim().startsWith("@@")) continue;
    const [, name, type] = field;
    if (names.has(type!)) continue;
    columns.push(name!);
  }
  if (columns.length === 0) throw new Error(`no scalar columns read for ${model}`);
  return columns;
}

function generate(): string {
  const tenantTables = models().filter(
    (m) => !NO_SCHOOL_POLICY.has(m) && !OPERATOR_LOG_TABLES.has(m),
  );

  const lines: string[] = [
    "-- GENERATED by scripts/gen-rls.ts — do not edit by hand.",
    "-- Regenerate with: npm run rls:generate",
    "--",
    "-- Row-level security for the multi-tenant tables.",
    "--",
    "-- The predicate reads a per-transaction setting rather than a role: one",
    "-- database user serves every school, and `app.school_ids` lists the schools",
    "-- the current transaction may see.",
    "--",
    "-- A LIST, not one id, because some people genuinely belong to more than one",
    "-- school. A parent with children at two schools is the ordinary case, not",
    "-- an edge case, and their session has no single school at all. A teacher may",
    "-- also hold posts at two. One id could not express either, and the parent",
    "-- pages simply returned nothing until this became a set.",
    "--",
    "-- The `true` second argument to current_setting makes an UNSET variable",
    "-- return NULL instead of raising. string_to_array(NULL) is NULL, and",
    "-- `= ANY (NULL)` is NULL, which is not true — so a query that forgot to say",
    "-- who it is for returns nothing at all. Fail closed, loudly, rather than open.",
    "--",
    "-- FORCE is not optional. Without it the table OWNER bypasses every policy,",
    "-- and the owner is whoever ran the migration — which in a small deployment",
    "-- is usually the same user the app connects as. Nothing a query does can",
    "-- detect that mistake, so prisma/rls-verify.sql checks the catalogue for it.",
    "--",
    "-- WITH CHECK is spelled out but is not doing extra work: Postgres reuses the",
    "-- USING expression for writes when WITH CHECK is omitted. It is written for",
    "-- the reader, so nobody has to remember that rule to know writes are covered.",
    "--",
    "-- `app.user_id` appears on one table, Membership, and only in USING. It is",
    "-- how a login asks which schools somebody belongs to when no school is known",
    "-- yet — the one question a school-scoped policy cannot answer. Reading your",
    "-- own membership rows tells you nothing about anybody else's; being able to",
    "-- WRITE one would be self-service enrolment, which is why it is not there.",
    "",
    "BEGIN;",
    "",
  ];

  for (const table of tenantTables) {
    const column = table === "School" ? "id" : "schoolId";
    const tenantClause = `"${column}" = ANY (string_to_array(current_setting('app.school_ids', true), ','))`;
    // Same `true` argument and the same fail-closed reasoning as the tenant
    // clause: an unset variable is NULL, and NULL = '1' is not true.
    const scoped = SUPERUSER_TABLES.has(table)
      ? `(${tenantClause} OR current_setting('app.is_superuser', true) = '1')`
      : tenantClause;
    const selfColumn = SELF_READABLE[table];
    const codeColumn = CODE_READABLE[table];
    const globalClause = GLOBALLY_READABLE[table];

    // Extra ways IN to a row, each read-only and each keyed on something the
    // caller already holds. Order matters only for readability.
    const alsoReadable: string[] = [];
    if (selfColumn) alsoReadable.push(`"${selfColumn}" = current_setting('app.user_id', true)`);
    if (codeColumn) alsoReadable.push(`"${codeColumn}" = current_setting('app.join_code', true)`);
    // …and a pupil's membership by the PEN on their account, bound the same
    // way a student code is: an eleven-digit number the office already holds,
    // read-only, one person's rows. This is how intake and admissions
    // recognise a pupil who moved schools (src/lib/pen.ts).
    if (table === "Membership") alsoReadable.push(`"userId" IN (SELECT u."id" FROM "User" u WHERE u."penNumber" = current_setting('app.join_code', true))`);
    // …and, for School only, the school BEHIND a student code — see the note
    // on CODE_SCHOOL_READABLE for the 500 this closes.
    if (table === "School") alsoReadable.push(`(${CODE_SCHOOL_READABLE})`);
    if (globalClause) alsoReadable.push(`(${globalClause})`);
    const memberClause = MEMBER_READABLE[table];
    if (memberClause) alsoReadable.push(`(${memberClause})`);
    const recordClause = OWN_RECORD_READABLE[table];
    if (recordClause) alsoReadable.push(`(${recordClause})`);
    const guardianClause = GUARDIAN_READABLE[table];
    if (guardianClause) alsoReadable.push(`(${guardianClause})`);
    const addresseeClause = ADDRESSEE_READABLE[table];
    if (addresseeClause) alsoReadable.push(`(${addresseeClause})`);
    const expertClause = EXPERT_READABLE[table];
    if (expertClause) alsoReadable.push(`(${expertClause})`);
    if (SUPERUSER_NULL_READABLE.has(table)) {
      alsoReadable.push(
        `("${column}" IS NULL AND current_setting('app.is_superuser', true) = '1')`,
      );
    }
    if (SUPERUSER_READABLE.has(table)) {
      alsoReadable.push(`current_setting('app.is_superuser', true) = '1'`);
    }

    const usingNote: string[] = [];
    if (selfColumn) {
      usingNote.push(
        `  -- Reads also allow your OWN rows, which is what lets a login ask`,
        `  -- which schools you belong to before any school is known.`,
      );
    }
    if (codeColumn) {
      usingNote.push(
        `  -- …and the single row whose code somebody has just typed in, which is`,
        `  -- how a join code names the school it belongs to.`,
      );
    }
    if (globalClause) {
      usingNote.push(
        ...(table === "Post"
          ? [
              `  -- …and any post its own school has APPROVED for the global feed. The`,
              `  -- status is in the predicate so nothing reaches other schools before`,
              `  -- the school that wrote it has approved it.`,
            ]
          : [
              `  -- …and one row of this table belonging to ANOTHER school, by the`,
              `  -- predicate below. See GLOBALLY_READABLE in scripts/gen-rls.ts for`,
              `  -- what that predicate opens and why it is safe to open it.`,
            ]),
      );
    }
    if (ADDRESSEE_READABLE[table]) {
      usingNote.push(
        `  -- …and a PENDING invitation addressed to the caller's own VERIFIED`,
        `  -- email — what lets /join offer the invitation instead of "go back`,
        `  -- to your inbox". See ADDRESSEE_READABLE in scripts/gen-rls.ts.`,
      );
    }
    if (expertClause) {
      usingNote.push(
        `  -- …and, to an EXPERT, the rows of their own engagement and no others:`,
        `  -- keyed on a booking or a mentorship that is theirs and live, never on`,
        `  -- the school. See EXPERT_READABLE in scripts/gen-rls.ts.`,
      );
    }
    if (memberClause) {
      usingNote.push(
        `  -- …and the leaving certificate of a child who is one of YOUR pupils`,
        `  -- now, whichever school issued it. The one clause in this file that`,
        `  -- crosses schools, on one table that holds a summary rather than a`,
        `  -- record — see MEMBER_READABLE. Anchored on a live ACTIVE membership`,
        `  -- in the STUDENT role, so it cannot be used to browse and a member of`,
        `  -- staff's own school days stay out of their employer's reach.`,
      );
    }
    if (recordClause) {
      usingNote.push(
        `  -- …and the row to the CHILD IT IS ABOUT, and to their guardians, with`,
        `  -- no school bound at all. A school's operational rows end with the`,
        `  -- membership; a document describing a child does not. See`,
        `  -- OWN_RECORD_READABLE — this is what lets a leaver, an alumnus, or a`,
        `  -- family who moved to a school not on this platform still open their`,
        `  -- own report cards, attendance figures and badges.`,
      );
    }
    if (guardianClause) {
      usingNote.push(
        `  -- …and to an ACTIVE guardian of the pupil, which is what lets a parent`,
        `  -- follow one child across every school they have attended.`,
      );
    }
    if (SUPERUSER_NULL_READABLE.has(table)) {
      usingNote.push(
        `  -- …and, for whoever runs the server, the rows that belong to no school`,
        `  -- at all — their own actions, which are audited unattributed so that`,
        `  -- they land in no tenant's Safety Centre. A school's rows carry a`,
        `  -- schoolId and stay out of reach.`,
      );
    }
    if (alsoReadable.length > 0) {
      usingNote.push(
        `  -- ${alsoReadable.length > 1 ? "All are" : "It is"} in a SELECT-ONLY policy: readable, never writable.`,
      );
    }

    // TWO POLICIES WHEN THERE IS AN EXTRA WAY IN, AND THIS IS NOT COSMETIC.
    //
    // Postgres applies WITH CHECK to INSERT and UPDATE only. A DELETE is
    // authorised by USING ALONE. So a clause added to USING to make a row
    // READABLE also makes it DELETABLE, however carefully it was kept out of
    // WITH CHECK — and `npm run rls:verify` demonstrated exactly that: holding a
    // school's join code was enough to delete the school, cascading to every
    // row it owns. The comment above these clauses said "readable, never
    // writable" and was wrong for as long as it was only a comment.
    //
    // So the widened predicate now lives in a FOR SELECT policy, and writes —
    // INSERT, UPDATE and DELETE alike — are governed by a FOR ALL policy that
    // only ever sees the tenant predicate. Permissive policies are OR-ed, so a
    // SELECT still matches either one and reads are unchanged.
    const writeCheck = NULL_SCHOOL_WRITABLE.has(table)
      ? [
          `  -- Writes also allow a row belonging to no school, which is how a`,
          `  -- login — or a failed one — gets recorded at all. Absent from`,
          `  -- USING: writable, and visible to no school.`,
          `  WITH CHECK (${scoped}`,
          `              OR "${column}" IS NULL);`,
        ]
      : [`  WITH CHECK (${scoped});`];

    // An append-only table's "isolation" policy is FOR INSERT and nothing
    // else. It keeps the name so the count in tests/rls-sql.test.ts still
    // finds one write policy per tenant table; what changes is that no policy
    // anywhere on the table permits UPDATE or DELETE. See APPEND_ONLY.
    const appendOnly = APPEND_ONLY.has(table);
    if (appendOnly && alsoReadable.length === 0) {
      // Without a separate SELECT policy an INSERT-only table could be
      // written and never read. Every table in APPEND_ONLY has one today;
      // this fails generation rather than shipping a write-only log.
      throw new Error(`${table} is APPEND_ONLY but has no read policy of its own`);
    }

    lines.push(
      `-- ${table}`,
      `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "${table}_tenant_isolation" ON "${table}";`,
      `DROP POLICY IF EXISTS "${table}_readable" ON "${table}";`,
      ...(appendOnly
        ? [
            `-- APPEND-ONLY: this is the table's only write policy and it is FOR`,
            `-- INSERT. No policy on this table permits UPDATE or DELETE, so the`,
            `-- application cannot edit or remove a line however it is bound; the`,
            `-- retention sweep prunes by age on the owner connection, which is`,
            `-- outside row security. See APPEND_ONLY in scripts/gen-rls.ts.`,
            `CREATE POLICY "${table}_tenant_isolation" ON "${table}"`,
            `  FOR INSERT`,
            ...writeCheck,
          ]
        : [
            `CREATE POLICY "${table}_tenant_isolation" ON "${table}"`,
            ...(alsoReadable.length > 0 ? [`  FOR ALL`] : []),
            `  USING (${scoped})`,
            ...writeCheck,
          ]),
    );

    if (alsoReadable.length > 0) {
      lines.push(
        ``,
        ...usingNote,
        `CREATE POLICY "${table}_readable" ON "${table}"`,
        `  FOR SELECT`,
        `  USING (${scoped}`,
        ...alsoReadable.map((clause) => `         OR ${clause}`),
        `        );`,
      );
    }

    /**
     * THE ONE PLACE A ROW IS WRITTEN INTO ANOTHER SCHOOL'S TENANT, and the
     * write is pinned twice: to the acting user (`app.user_id`, bound on every
     * scoped query) and to the parent post being GLOBAL and APPROVED. So a
     * reader from any school may react to a global post and take their own
     * reaction back — INSERT and DELETE of rows that name THEM — and comment
     * on it, and can never touch anybody else's row or reach any row whose
     * post is not on the global feed. Reactions get DELETE because a reaction
     * is a toggle; comments do not, because a said thing stays said and only
     * the publishing school's moderation removes it.
     */
    if (table === "Reaction" || table === "Comment") {
      const userColumn = table === "Reaction" ? "userId" : "authorUserId";
      const globalPost = `EXISTS (
           SELECT 1 FROM "Post" p
            WHERE p."id" = "${table}"."postId"
              AND p."scope" = 'GLOBAL'
              AND p."status" = 'APPROVED')`;
      // The setting is '' on a session with no user; guarded explicitly so an
      // unset identity can never satisfy the equality by accident.
      const own = `current_setting('app.user_id', true) <> ''
          AND "${userColumn}" = current_setting('app.user_id', true)`;
      lines.push(
        ``,
        `  -- Cross-school interaction on a GLOBAL post: your own row, on an`,
        `  -- approved global post, and nothing else. See the note in`,
        `  -- scripts/gen-rls.ts above the ${table} write policies.`,
        `DROP POLICY IF EXISTS "${table}_global_insert" ON "${table}";`,
        `CREATE POLICY "${table}_global_insert" ON "${table}"`,
        `  FOR INSERT`,
        `  WITH CHECK (${own}`,
        `          AND ${globalPost});`,
      );
      if (table === "Reaction") {
        lines.push(
          `DROP POLICY IF EXISTS "${table}_global_delete" ON "${table}";`,
          `CREATE POLICY "${table}_global_delete" ON "${table}"`,
          `  FOR DELETE`,
          `  USING (${own}`,
          `     AND ${globalPost});`,
        );
      }
    }

    /**
     * THE OTHER TWO CROSS-TENANT WRITES: opening an enquiry with a school
     * that invited it, and replying on your own thread. Pinned the same way
     * the global-feed writes are — to the acting user, and to the target's
     * own opt-in being live at the moment of writing:
     *
     *   - An ADMISSION enquiry requires the school's profile to be published
     *     (and the school not removed). Unpublishing closes the door to NEW
     *     enquiries in the database, not in a page's `if`.
     *   - A JOB enquiry requires the named posting to be OPEN and to belong
     *     to the school the row claims — without that equality a crafted
     *     insert could ride any school's open vacancy into a different
     *     school's tenant.
     *   - A reply requires the parent enquiry to be the writer's OWN and
     *     still OPEN, and to sit in the same school as the message claims.
     *     The school side needs no policy here: their replies are ordinary
     *     tenant-scoped writes.
     *
     * INSERT only. No cross-tenant UPDATE or DELETE exists for either table:
     * a sent enquiry is the school's to answer, close and keep — the sender
     * cannot rewrite what the school has already read, exactly as a Comment
     * cannot be unsaid.
     */
    if (table === "Enquiry") {
      lines.push(
        ``,
        `  -- A cross-school enquiry: your own row, against a school that has`,
        `  -- opened the door (published profile, or the open vacancy named on`,
        `  -- the row). See the note in scripts/gen-rls.ts above the Enquiry`,
        `  -- write policy.`,
        `DROP POLICY IF EXISTS "${table}_outreach_insert" ON "${table}";`,
        `CREATE POLICY "${table}_outreach_insert" ON "${table}"`,
        `  FOR INSERT`,
        `  WITH CHECK (current_setting('app.user_id', true) <> ''`,
        `          AND "fromUserId" = current_setting('app.user_id', true)`,
        `          AND (("kind" = 'ADMISSION'`,
        `                AND "jobPostingId" IS NULL`,
        `                AND EXISTS (`,
        `           SELECT 1 FROM "School" s`,
        `            WHERE s."id" = "Enquiry"."schoolId"`,
        `              AND s."profilePublishedAt" IS NOT NULL`,
        `              AND s."removedAt" IS NULL))`,
        `           OR ("kind" = 'JOB'`,
        `                AND EXISTS (`,
        `           SELECT 1 FROM "JobPosting" j`,
        `            WHERE j."id" = "Enquiry"."jobPostingId"`,
        `              AND j."schoolId" = "Enquiry"."schoolId"`,
        `              AND j."status" = 'OPEN'))));`,
      );
    }
    /**
     * A NOTIFICATION'S LIFECYCLE BELONGS TO ITS PERSON, like its readability
     * (see SELF_READABLE.Notification). The self-read clause alone left a
     * trap the enquiry desk walked straight into: "the school replied" from
     * a school the reader has no binding at could be READ but never marked
     * read, cleared, or expired — every one of those writes is scoped by
     * `userId` in the app and was silently skipped by the tenant-only write
     * policy, leaving a permanently unread badge and a row housekeeping
     * could never retire. So UPDATE and DELETE of your OWN rows are allowed,
     * pinned to `app.user_id` on both sides. INSERT stays tenant-scoped:
     * reading, finishing and discarding your mail is yours; minting mail
     * into a school's tenant is not.
     *
     * ONE INSERT OUTSIDE ANY TENANT: a row with NO school. An expert's
     * tenant set is empty, so the tenant clause refused every request-time
     * notice addressed to them — the operator's answer to their identity
     * papers went by mail alone. A school-less row is nobody's tenant to
     * mint into, so it may be written when it is addressed to the acting
     * user, or by the operator (`app.is_superuser`), whose acts belong to
     * no school. A row that names a school still passes the tenant clause
     * or nothing; reading it is the self-read clause above, as before.
     */
    if (table === "Notification") {
      const own = `current_setting('app.user_id', true) <> ''
          AND "userId" = current_setting('app.user_id', true)`;
      lines.push(
        ``,
        `  -- Your own notices are yours to finish and discard, whichever`,
        `  -- school wrote them. See the note in scripts/gen-rls.ts above the`,
        `  -- Notification self policies.`,
        `DROP POLICY IF EXISTS "${table}_self_update" ON "${table}";`,
        `CREATE POLICY "${table}_self_update" ON "${table}"`,
        `  FOR UPDATE`,
        `  USING (${own})`,
        `  WITH CHECK (${own});`,
        `DROP POLICY IF EXISTS "${table}_self_delete" ON "${table}";`,
        `CREATE POLICY "${table}_self_delete" ON "${table}"`,
        `  FOR DELETE`,
        `  USING (${own});`,
        ``,
        `  -- A notice that belongs to no school (an expert's, the operator's`,
        `  -- answer): written for yourself, or by the operator. See the note`,
        `  -- in scripts/gen-rls.ts above the Notification self policies.`,
        `DROP POLICY IF EXISTS "${table}_no_school_insert" ON "${table}";`,
        `CREATE POLICY "${table}_no_school_insert" ON "${table}"`,
        `  FOR INSERT`,
        `  WITH CHECK ("schoolId" IS NULL`,
        `          AND current_setting('app.user_id', true) <> ''`,
        `          AND ("userId" = current_setting('app.user_id', true)`,
        `               OR current_setting('app.is_superuser', true) = '1'));`,
      );
    }
    /**
     * ACCEPTING AN EXPERT INVITATION IS A WRITE BY SOMEBODY WHO IS NOBODY
     * YET — no school, no membership; the unguessable token is the whole
     * authorisation, exactly as it is for reading the row (CODE_READABLE).
     * For as long as only the read half existed, acceptance was impossible:
     * the three-school simulation watched `acceptedAt` refuse to stamp
     * (P2025), roll back the profile, and strand a half-made account. The
     * UPDATE is pinned to the presented token on BOTH sides and to the
     * invite being still live, so the holder can consume their own
     * invitation and touch nothing else — not a used one, not a revoked
     * one, not anybody else's.
     */
    if (table === "ExpertInvite") {
      const held = `current_setting('app.join_code', true) <> ''
          AND "tokenHash" = current_setting('app.join_code', true)`;
      lines.push(
        ``,
        `  -- The token-holder consuming their own live invitation. See the`,
        `  -- note in scripts/gen-rls.ts above the ExpertInvite write policy.`,
        `DROP POLICY IF EXISTS "${table}_accept_update" ON "${table}";`,
        `CREATE POLICY "${table}_accept_update" ON "${table}"`,
        `  FOR UPDATE`,
        `  USING (${held}`,
        `     AND "acceptedAt" IS NULL`,
        `     AND "revokedAt" IS NULL)`,
        `  WITH CHECK (${held});`,
      );
    }
    for (const write of EXPERT_WRITES[table] ?? []) {
      lines.push(
        ``,
        `  -- ${write.note} Keyed on the engagement, not the`,
        `  -- school. See EXPERT_WRITES in scripts/gen-rls.ts.`,
        `DROP POLICY IF EXISTS "${table}_${write.name}" ON "${table}";`,
        `CREATE POLICY "${table}_${write.name}" ON "${table}"`,
        `  FOR ${write.command}`,
        ...(write.using ? [`  USING (${write.using})`] : []),
        `  WITH CHECK (${write.check});`,
      );
    }
    if (table === "EnquiryMessage") {
      lines.push(
        ``,
        `  -- A reply on your OWN still-open enquiry, in the school it belongs`,
        `  -- to, signed by you. See the note in scripts/gen-rls.ts above the`,
        `  -- Enquiry write policy.`,
        `DROP POLICY IF EXISTS "${table}_outreach_insert" ON "${table}";`,
        `CREATE POLICY "${table}_outreach_insert" ON "${table}"`,
        `  FOR INSERT`,
        `  WITH CHECK (current_setting('app.user_id', true) <> ''`,
        `          AND "authorUserId" = current_setting('app.user_id', true)`,
        `          AND EXISTS (`,
        `           SELECT 1 FROM "Enquiry" e`,
        `            WHERE e."id" = "EnquiryMessage"."enquiryId"`,
        `              AND e."schoolId" = "EnquiryMessage"."schoolId"`,
        `              AND e."fromUserId" = current_setting('app.user_id', true)`,
        `              AND e."status" = 'OPEN'));`,
      );
    }

    lines.push("");
  }

  /* ---------------------------------------------------------------------- *
   * The operator's visitor book: append-only, in the database.
   * ---------------------------------------------------------------------- */
  for (const table of [...OPERATOR_LOG_TABLES].sort()) {
    lines.push(
      `-- ${table}`,
      `--`,
      `-- APPEND-ONLY, AND DELIBERATELY HAS NO DELETE POLICY. Postgres denies`,
      `-- what no policy permits, so neither the school nor the operator can`,
      `-- remove a row saying the operator opened this school. The school could`,
      `-- otherwise tear pages out of its own visitor book; the operator, who is`,
      `-- bound to the school exactly like an admin while a grant is live, could`,
      `-- otherwise look, act, and erase the evidence they had been there.`,
      `--`,
      `-- READS are the SCHOOL'S, which is what puts the visit in their Safety`,
      `-- Centre, plus the operator's own so they can see their grants. WRITES`,
      `-- are the operator's alone: a school cannot forge a grant it never gave,`,
      `-- and cannot rewrite the reason it was given.`,
      `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "${table}_readable" ON "${table}";`,
      `DROP POLICY IF EXISTS "${table}_operator_insert" ON "${table}";`,
      `DROP POLICY IF EXISTS "${table}_operator_update" ON "${table}";`,
      `CREATE POLICY "${table}_readable" ON "${table}"`,
      `  FOR SELECT`,
      `  USING ("schoolId" = ANY (string_to_array(current_setting('app.school_ids', true), ','))`,
      `         OR current_setting('app.is_superuser', true) = '1');`,
      `CREATE POLICY "${table}_operator_insert" ON "${table}"`,
      `  FOR INSERT`,
      `  WITH CHECK (current_setting('app.is_superuser', true) = '1');`,
      `-- UPDATE exists only so a grant can be CLOSED early. There is no DELETE`,
      `-- policy on purpose — see above.`,
      `CREATE POLICY "${table}_operator_update" ON "${table}"`,
      `  FOR UPDATE`,
      `  USING (current_setting('app.is_superuser', true) = '1')`,
      `  WITH CHECK (current_setting('app.is_superuser', true) = '1');`,
    );

    /**
     * CLOSING IS THE ONLY EDIT. The UPDATE policy above says WHO may write a
     * row and nothing about WHAT: a policy compares the new row against a
     * predicate, never against the old one, so under it alone the operator
     * could rewrite the reason, backdate `startedAt` or stretch `expiresAt` on
     * a visit already in the school's book. A trigger can see both rows, so
     * this one refuses any UPDATE that changes a column other than `endedAt`
     * — for every role but the table's owner, who is "whoever runs the server
     * has psql" and is the honest limit every note on this table states.
     * `scripts/db-grants.mjs` says the same thing a second way, as a
     * column-level grant to the app role.
     *
     * The column list is read from the schema, so a column added to the model
     * is frozen too.
     */
    const frozen = scalarColumns(table).filter((column) => column !== "endedAt");
    lines.push(
      `-- The only column the application may change on a written row is`,
      `-- "endedAt". The owner is exempt (psql is the stated limit); everyone`,
      `-- else is refused with insufficient_privilege. See the note above the`,
      `-- trigger in scripts/gen-rls.ts.`,
      `CREATE OR REPLACE FUNCTION "${table}_close_only"() RETURNS trigger`,
      `  LANGUAGE plpgsql AS $$`,
      `BEGIN`,
      `  IF pg_has_role(current_user, (SELECT c.relowner FROM pg_class c WHERE c.oid = TG_RELID), 'MEMBER') THEN`,
      `    RETURN NEW;`,
      `  END IF;`,
      `  IF ${frozen.map((column) => `NEW."${column}" IS DISTINCT FROM OLD."${column}"`).join(`\n     OR `)} THEN`,
      `    RAISE EXCEPTION '${table} is append-only: only "endedAt" may change'`,
      `      USING ERRCODE = 'insufficient_privilege';`,
      `  END IF;`,
      `  RETURN NEW;`,
      `END $$;`,
      `DROP TRIGGER IF EXISTS "${table}_close_only" ON "${table}";`,
      `CREATE TRIGGER "${table}_close_only"`,
      `  BEFORE UPDATE ON "${table}"`,
      `  FOR EACH ROW EXECUTE FUNCTION "${table}_close_only"();`,
      "",
    );
  }

  lines.push(
    "-- Tables with no school policy, each because it holds no school-owned rows:",
    ...[...NO_SCHOOL_POLICY].sort().map((t) => `--   ${t}`),
    "-- They are scoped by user instead, which the application layer already does.",
    "",
    "COMMIT;",
    "",
  );

  return lines.join("\n");
}

const sql = generate();

if (process.argv.includes("--check")) {
  const existing = readFileSync(OUT_PATH, "utf8");
  if (existing !== sql) {
    process.stderr.write(
      "prisma/rls.sql is out of date with the schema. Run: npm run rls:generate\n",
    );
    process.exit(1);
  }
  process.stdout.write("prisma/rls.sql is up to date.\n");
} else {
  writeFileSync(OUT_PATH, sql);
  const count = (sql.match(/CREATE POLICY/g) ?? []).length;
  process.stdout.write(`Wrote prisma/rls.sql — ${count} policies.\n`);
}
