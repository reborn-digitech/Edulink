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
]);

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
  // A LEAVING CERTIFICATE OUTLIVES THE MEMBERSHIP IT DESCRIBES, which is the
  // whole difficulty. The moment a pupil leaves Riverside, Riverside drops out
  // of their tenant set — correctly — and a policy keyed only on `schoolId`
  // would hide their own certificate from them at exactly the moment they need
  // to show it to somebody. Keyed on their user id it opens theirs and nobody
  // else's, read-only like every other clause here.
  SchoolRecord: "studentUserId",
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
 */
const MEMBER_READABLE: Record<string, string> = {
  SchoolRecord: `EXISTS (
           SELECT 1 FROM "Membership" m
            WHERE m."userId" = "SchoolRecord"."studentUserId"
              AND m."schoolId" = ANY (string_to_array(current_setting('app.school_ids', true), ','))
              AND m."status" = 'ACTIVE'
              AND m."leftAt" IS NULL
         )`,
};

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
    if (SUPERUSER_NULL_READABLE.has(table)) {
      alsoReadable.push(
        `("${column}" IS NULL AND current_setting('app.is_superuser', true) = '1')`,
      );
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
    if (memberClause) {
      usingNote.push(
        `  -- …and the leaving certificate of a child who is one of YOUR pupils`,
        `  -- now, whichever school issued it. The one clause in this file that`,
        `  -- crosses schools, on one table that holds a summary rather than a`,
        `  -- record — see MEMBER_READABLE. Anchored on a live ACTIVE membership,`,
        `  -- so it cannot be used to browse.`,
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

    lines.push(
      `-- ${table}`,
      `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`,
      `ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "${table}_tenant_isolation" ON "${table}";`,
      `DROP POLICY IF EXISTS "${table}_readable" ON "${table}";`,
      `CREATE POLICY "${table}_tenant_isolation" ON "${table}"`,
      ...(alsoReadable.length > 0 ? [`  FOR ALL`] : []),
      `  USING (${scoped})`,
      ...writeCheck,
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
