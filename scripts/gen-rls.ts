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
  "PushSubscription",
  "Guardianship",
  "Competition",
  "OutboundEmail",
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
const SELF_READABLE: Record<string, string> = { Membership: "userId" };

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
  const tenantTables = models().filter((m) => !NO_SCHOOL_POLICY.has(m));

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
    const scoped = `"${column}" = ANY (string_to_array(current_setting('app.school_ids', true), ','))`;
    const selfColumn = SELF_READABLE[table];
    const codeColumn = CODE_READABLE[table];
    const globalClause = GLOBALLY_READABLE[table];

    // Extra ways IN to a row, each read-only and each keyed on something the
    // caller already holds. Order matters only for readability.
    const alsoReadable: string[] = [];
    if (selfColumn) alsoReadable.push(`"${selfColumn}" = current_setting('app.user_id', true)`);
    if (codeColumn) alsoReadable.push(`"${codeColumn}" = current_setting('app.join_code', true)`);
    if (globalClause) alsoReadable.push(`(${globalClause})`);

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
        `  -- …and any post its own school has APPROVED for the global feed, which`,
        `  -- is the one row in this schema a different school may read. Status is`,
        `  -- in the predicate so nothing reaches other schools before the school`,
        `  -- that wrote it has approved it.`,
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

    lines.push("");
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
