/**
 * Proves the application half of row-level security, through Prisma.
 *
 *   npm run rls:verify
 *
 * prisma/rls-verify.sql proves the POLICIES isolate tenants. This proves the
 * thing that feeds them: that `withTenant` actually reaches the database, and —
 * the part that matters — that the tenant does not survive on a pooled
 * connection and leak into whatever runs next.
 *
 * Not part of `npm test`, which deliberately runs with no database server. This
 * needs a Postgres, and it is the thing to run before trusting a deployment.
 *
 * What it does to your machine: creates a database, an unprivileged role, and
 * two schools' worth of rows, then drops the lot. Set PGDATABASE_RLS to use a
 * different database name.
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { withTenantOn } from "../src/lib/tenant-tx";

const ROOT = resolve(process.cwd());
const DB = process.env.PGDATABASE_RLS ?? "edulink_rls_verify";
const APP_ROLE = "edulink_app_verify";
const APP_PASSWORD = "verify-only-password";
const OWNER = process.env.PGUSER ?? process.env.USER ?? "postgres";
const APP_URL = `postgresql://${APP_ROLE}:${APP_PASSWORD}@localhost:5432/${DB}`;
const OWNER_URL = `postgresql://${OWNER}@localhost:5432/${DB}`;

const PG_SCHEMA = resolve(ROOT, "prisma/.pg-schema.prisma");
const PG_CLIENT = resolve(ROOT, ".pg-client");

const failures: string[] = [];

/** The little of a Prisma transaction client these checks use. */
type TxLike = {
  $executeRawUnsafe(sql: string, ...values: unknown[]): Promise<number>;
  membership: {
    findMany(args: unknown): Promise<unknown>;
    create(args: unknown): Promise<unknown>;
  };
  school: {
    findMany(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
  };
};

function psql(database: string, sql: string): string {
  return execFileSync("psql", ["-d", database, "-v", "ON_ERROR_STOP=1", "-tAc", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** One number, straight out of psql as the owner — used to check what a policy
 *  refused actually stayed refused, rather than asking the refused client. */
function psqlCount(sql: string): number {
  return Number.parseInt(psql(DB, sql).trim(), 10);
}

function check(name: string, ok: boolean, detail: string): void {
  if (ok) {
    process.stdout.write(`  ok    ${name}\n`);
  } else {
    failures.push(`${name} — ${detail}`);
    process.stdout.write(`  FAIL  ${name}\n        ${detail}\n`);
  }
}

async function main() {
  // ---- a database with the policies on -----------------------------------
  psql("postgres", `DROP DATABASE IF EXISTS "${DB}"`);
  psql("postgres", `CREATE DATABASE "${DB}"`);

  // The postgres-flavoured schema and its own client, so the app's SQLite client
  // is left alone. Regenerated every run: a stale one would test the wrong shape.
  const schema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf8")
    .replace("generator client {", `generator client {\n  output   = "../.pg-client"`);
  writeFileSync(PG_SCHEMA, schema);

  execFileSync("npx", ["prisma", "db", "push", "--schema", PG_SCHEMA], {
    cwd: ROOT,
    env: { ...process.env, DATABASE_URL: OWNER_URL },
    stdio: "pipe",
  });

  execFileSync("psql", ["-d", DB, "-v", "ON_ERROR_STOP=1", "-f", "prisma/rls.sql"], {
    cwd: ROOT,
    stdio: "pipe",
  });

  psql(DB, `DROP ROLE IF EXISTS ${APP_ROLE}`);
  psql(DB, `CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_PASSWORD}'`);
  psql(DB, `GRANT USAGE ON SCHEMA public TO ${APP_ROLE}`);
  psql(DB, `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_ROLE}`);

  // Two schools, inserted as the owner so setup is not fighting the policies.
  psql(
    DB,
    `INSERT INTO "School" (id,name,slug,code,"contactEmail",timezone,"updatedAt") VALUES
       ('verify-a','A','a','VA','a@x.test','UTC',now()),
       ('verify-b','B','b','VB','b@x.test','UTC',now());
     INSERT INTO "User" (id,name,prefs,"updatedAt") VALUES
       ('verify-u','U','{}',now()),
       ('verify-other','Other','{}',now());
     INSERT INTO "User" (id,name,prefs,"updatedAt") VALUES
       ('verify-pupil','Pupil','{}',now());
     INSERT INTO "Membership" (id,"userId","schoolId",role,status,"joinedAt","leftAt") VALUES
       ('verify-m-a','verify-u','verify-a','TEACHER','ACTIVE',now(),NULL),
       ('verify-m-b','verify-u','verify-b','ADMIN','ACTIVE',now(),NULL),
       ('verify-m-other','verify-other','verify-a','TEACHER','ACTIVE',now(),NULL),
       -- A pupil who has LEFT school A and is now at school B. The whole point
       -- of SchoolRecord in one row pair.
       ('verify-m-pupil-a','verify-pupil','verify-a','STUDENT','ACTIVE',now(),now()),
       ('verify-m-pupil-b','verify-pupil','verify-b','STUDENT','ACTIVE',now(),NULL);
     -- The state a transfer LEAVES BEHIND, before anybody merges anything: the
     -- same child holding two accounts, one per school, with nothing joining
     -- them. verify-merge-old has the certificate; verify-merge-new is the
     -- account they actually sign in with.
     INSERT INTO "User" (id,name,prefs,"updatedAt") VALUES
       ('verify-merge-old','Old account','{}',now()),
       ('verify-merge-new','New account','{}',now());
     INSERT INTO "Membership" (id,"userId","schoolId",role,status,"joinedAt","leftAt") VALUES
       ('verify-m-merge-old','verify-merge-old','verify-a','STUDENT','ACTIVE',now(),now()),
       ('verify-m-merge-new','verify-merge-new','verify-b','STUDENT','ACTIVE',now(),NULL);
     INSERT INTO "SchoolRecord"
       (id,"schoolId","studentUserId","studentMembershipId","schoolName","joinedAt","leftAt",reason,"attendanceMarked","attendancePresent","reportCardCount") VALUES
       ('verify-rec-a','verify-a','verify-pupil','verify-m-pupil-a','A',now(),now(),'TRANSFERRED',10,9,2),
       ('verify-rec-stranger','verify-a','verify-other','verify-m-other','A',now(),now(),'LEFT',4,4,1),
       ('verify-rec-merge','verify-a','verify-merge-old','verify-m-merge-old','A',now(),now(),'TRANSFERRED',6,6,1);
     INSERT INTO "Post" (id,"schoolId","authorUserId",scope,title,status,tags,media,"updatedAt") VALUES
       ('verify-post-a','verify-a','verify-u','SCHOOL','A post','APPROVED','[]','[]',now()),
       ('verify-post-b','verify-b','verify-u','SCHOOL','B post','APPROVED','[]','[]',now()),
       ('verify-global-a','verify-a','verify-u','GLOBAL','A global post','APPROVED','[]','[]',now()),
       ('verify-global-pending','verify-a','verify-u','GLOBAL','A unapproved global','PENDING','[]','[]',now());`,
  );

  process.stdout.write(`\nVerifying the application half against ${DB}\n\n`);

  // ---- through Prisma, as the unprivileged role ---------------------------
  process.env.DATABASE_URL = APP_URL;
  const { PrismaClient } = await import(`${PG_CLIENT}/index.js`);
  const client = new PrismaClient({ datasources: { db: { url: APP_URL } } });

  try {
    // 1. No tenant set: RLS returns nothing rather than everything.
    //
    // SCOPED TO NON-GLOBAL POSTS, because a global post is readable by every
    // school BY DESIGN and therefore also readable with no school bound at all.
    // That widening gets its own check below rather than being folded in here,
    // where it would quietly weaken the thing this check exists to prove.
    const blind = await client.post.count({ where: { scope: { not: "GLOBAL" } } });
    check(
      "a query with no tenant set sees no school's posts",
      blind === 0,
      `saw ${blind} post(s) — the policies are not failing closed`,
    );

    const blindGlobal = await client.post.count({ where: { scope: "GLOBAL", status: "APPROVED" } });
    check(
      "⚠ …but an APPROVED global post IS readable with no tenant bound",
      blindGlobal > 0,
      "the global clause is not reaching, so the global feed cannot work",
    );

    // 2. Inside withTenant, the tenant's own rows and only those.
    // Through the REAL helper, not a copy of it — that is the point of
    // tenant-tx.ts taking its client as an argument.
    const asA: { id: string }[] = await withTenantOn(client, "verify-a", (tx) =>
      (tx as { post: { findMany: (a: unknown) => Promise<{ id: string }[]> } }).post.findMany({
        where: { scope: { not: "GLOBAL" } },
        select: { id: true },
      }),
    );
    check(
      "acting for A sees exactly A's row",
      asA.length === 1 && asA[0]?.id === "verify-post-a",
      `saw ${JSON.stringify(asA.map((p) => p.id))}`,
    );

    // 3. THE ONE THAT MATTERS. The next query, which sets no tenant, must not
    //    inherit the last one from a pooled connection.
    const after = await client.post.count({ where: { scope: { not: "GLOBAL" } } });
    check(
      "the next query does NOT inherit the previous tenant",
      after === 0,
      `saw ${after} post(s) — SET LOCAL leaked past its transaction, and one ` +
        "request is reading another school's rows",
    );

    // 4. And the other tenant, so this is isolation and not a blanket denial.
    const asB: { id: string }[] = await withTenantOn(client, "verify-b", (tx) =>
      (tx as { post: { findMany: (a: unknown) => Promise<{ id: string }[]> } }).post.findMany({
        where: { scope: { not: "GLOBAL" } },
        select: { id: true },
      }),
    );
    check(
      "acting for B sees exactly B's row",
      asB.length === 1 && asB[0]?.id === "verify-post-b",
      `saw ${JSON.stringify(asB.map((p) => p.id))}`,
    );

    // ---- the login bootstrap: app.user_id, on Membership, reads only -------
    // This is the one hole deliberately left in the school scoping, so it is
    // the one that has to be shown to be exactly as big as it claims.
    type Row = { id: string; userId: string };
    const asUser = (sql: (tx: TxLike) => Promise<unknown>) =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, "verify-u");
        return sql(tx);
      });

    const own = (await asUser((tx) =>
      tx.membership.findMany({ select: { id: true, userId: true } }),
    )) as Row[];
    check(
      "with only app.user_id set, a user sees their own memberships across schools",
      own.length === 2 && own.every((m) => m.userId === "verify-u"),
      `saw ${JSON.stringify(own.map((m) => m.id))} — expected verify-m-a and verify-m-b`,
    );
    check(
      "…and NOT another user's, in a school they are in themselves",
      !own.some((m) => m.id === "verify-m-other"),
      "another user's membership row came back — the self clause is too wide",
    );

    // The asymmetry that makes the read safe: USING allows it, WITH CHECK does
    // not, so this cannot become self-service enrolment.
    let insertRefused = false;
    try {
      await asUser((tx) =>
        tx.membership.create({
          data: {
            id: "verify-m-forged",
            userId: "verify-u",
            schoolId: "verify-a",
            role: "ADMIN",
            status: "ACTIVE",
          },
        }),
      );
    } catch {
      insertRefused = true;
    }
    check(
      "⚠ app.user_id cannot WRITE a membership — no self-service enrolment",
      insertRefused,
      "a user inserted their own ADMIN membership with no school bound; " +
        "app.user_id has leaked into WITH CHECK",
    );

    const stillBlind = await client.membership.count();
    check(
      "app.user_id does not survive its transaction either",
      stillBlind === 0,
      `saw ${stillBlind} membership(s) with nothing set`,
    );

    // ---- the join-code bootstrap: app.join_code, reads, exactly one row ----
    // A child typing a class code has no session, no membership and no school,
    // and the row the code names is the thing that would say which school to
    // scope to. Knowing the code is the authorisation — so it had better open
    // that row and nothing else.
    const withCode = <T,>(code: string, sql: (tx: TxLike) => Promise<T>) =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.join_code', $1, true)`, code);
        return sql(tx);
      });

    const foundByCode = (await withCode("VA", (tx) =>
      tx.school.findMany({ select: { id: true } }),
    )) as { id: string }[];
    check(
      "a code opens the one row it names, with no school bound at all",
      foundByCode.length === 1 && foundByCode[0]?.id === "verify-a",
      `saw ${JSON.stringify(foundByCode.map((s) => s.id))} — a join code that finds nothing is a front door that will not open`,
    );

    const foundByWrongCode = (await withCode("NOT-A-CODE", (tx) =>
      tx.school.findMany({ select: { id: true } }),
    )) as { id: string }[];
    check(
      "⚠ …and a code that matches nothing opens nothing",
      foundByWrongCode.length === 0,
      `saw ${foundByWrongCode.length} school(s)`,
    );

    let codeWrote = false;
    try {
      await withCode("VA", (tx) =>
        tx.school.update({ where: { id: "verify-a" }, data: { name: "forged" } }),
      );
      codeWrote = true;
    } catch {
      codeWrote = false;
    }
    check(
      "⚠ a code gets a look and never a write",
      !codeWrote,
      "somebody holding a join code was able to rename the school",
    );

    const blindAfterCode = await client.school.count();
    check(
      "app.join_code does not survive its transaction either",
      blindAfterCode === 0,
      `saw ${blindAfterCode} school(s) with nothing set`,
    );

    // ---- the audit log: unattributed rows are writable, never readable ----
    // Some of the things most worth recording happen before any school is known.
    // Written the way audit() writes it: raw, with no RETURNING. `create()`
    // would need to read the row back through USING, where a row belonging to no
    // school matches nothing — permitted to insert, refused to return.
    let unattributedWritten = false;
    let why = "";
    try {
      await client.$executeRawUnsafe(
        `INSERT INTO "AuditLog" ("id","action","meta","createdAt") VALUES ($1,$2,'{}',now())`,
        "verify-audit-null",
        "verify.login",
      );
      unattributedWritten = true;
    } catch (error) {
      why = error instanceof Error ? error.message.split("\n").slice(-2).join(" ").trim() : String(error);
    }
    check(
      "an audit row with no school can be written — a login is recordable",
      unattributedWritten,
      `refused, so every sign-in goes unrecorded and audit() swallows it: ${why}`,
    );

    let returningRefused = false;
    try {
      await client.auditLog.create({ data: { action: "verify.returning", meta: "{}" } });
    } catch {
      returningRefused = true;
    }
    check(
      "⚠ …but never readable, so RETURNING it back is still refused",
      returningRefused,
      "an unattributed audit row can be read back, which means any school can read every school's failed logins",
    );

    const seenByA = (await withTenantOn(client, "verify-a", (tx) =>
      (tx as { auditLog: { count: (a?: unknown) => Promise<number> } }).auditLog.count(),
    )) as number;
    check(
      "⚠ …and belongs to no school, so it is in nobody's Safety Centre",
      seenByA === 0,
      `school A can see ${seenByA} unattributed audit row(s)`,
    );

    // The isolation that still has to hold: a row that DOES name a school.
    await withTenantOn(client, "verify-a", (tx) =>
      (tx as { auditLog: { create: (a: unknown) => Promise<unknown> } }).auditLog.create({
        data: { schoolId: "verify-a", action: "verify.scoped", meta: "{}" },
      }),
    );
    const bSees = (await withTenantOn(client, "verify-b", (tx) =>
      (tx as { auditLog: { count: (a?: unknown) => Promise<number> } }).auditLog.count(),
    )) as number;
    check(
      "⚠ an audit row that names a school is still invisible to the other one",
      bSees === 0,
      `school B can read ${bSees} of school A's audit row(s)`,
    );

    let forgedIntoOther = false;
    try {
      await withTenantOn(client, "verify-a", (tx) =>
        (tx as { auditLog: { create: (a: unknown) => Promise<unknown> } }).auditLog.create({
          data: { schoolId: "verify-b", action: "verify.forged", meta: "{}" },
        }),
      );
      forgedIntoOther = true;
    } catch {
      forgedIntoOther = false;
    }
    check(
      "⚠ …and cannot be written INTO another school's history",
      !forgedIntoOther,
      "acting for A wrote an audit row attributed to B",
    );

    /* ---- the global feed: the one row a school may read from another ----
     *
     * Placed ABOVE the deliberate poisoning below, and that placement is load-
     * bearing. Written underneath it, the join-code probe inherited a leaked
     * `app.school_ids` and reported a school-deleting vulnerability that did not
     * exist. The comment below says exactly this; it is worth being the second
     * person it caught.
     */
    const bSeesGlobal = (await withTenantOn(client, "verify-b", (tx) =>
      (tx as unknown as { post: { findMany: (a: unknown) => Promise<{ id: string }[]> } }).post.findMany({
        where: { scope: "GLOBAL", status: "APPROVED" },
        select: { id: true },
      }),
    )) as { id: string }[];
    check(
      "⚠ a post school A APPROVED for the global feed IS readable by school B",
      bSeesGlobal.some((p) => p.id === "verify-global-a"),
      "the global clause does not reach, so the global feed is empty for everyone but its author",
    );

    const bSeesEverything = (await withTenantOn(client, "verify-b", (tx) =>
      (tx as unknown as { post: { findMany: (a: unknown) => Promise<{ id: string }[]> } }).post.findMany({
        select: { id: true },
      }),
    )) as { id: string }[];
    const visible = new Set(bSeesEverything.map((p) => p.id));
    check(
      "⚠ …while school A's SCHOOL-scoped post stays invisible to B",
      !visible.has("verify-post-a"),
      "widening the policy for the global feed has exposed ordinary school posts to other schools",
    );
    check(
      "⚠ …and a GLOBAL post its own school has not approved stays invisible too",
      !visible.has("verify-global-pending"),
      "status is not in the predicate, so a post reaches other schools before its own school has read it",
    );

    let bEdited = 0;
    try {
      const r = (await withTenantOn(client, "verify-b", (tx) =>
        (tx as unknown as { post: { updateMany: (a: unknown) => Promise<{ count: number }> } }).post.updateMany({
          where: { id: "verify-global-a" },
          data: { title: "hijacked" },
        }),
      )) as { count: number };
      bEdited = r.count;
    } catch {
      bEdited = 0;
    }
    check(
      "⚠ …and B may READ A's global post but never edit it",
      bEdited === 0,
      `another school edited ${bEdited} of A's global post(s)`,
    );

    // THE ONE THAT CAUGHT A REAL BUG. Postgres applies WITH CHECK to INSERT and
    // UPDATE only — a DELETE is authorised by USING alone. So the read clause,
    // carefully kept out of WITH CHECK, still authorised deletes until the
    // policy was split into FOR ALL (writes) and FOR SELECT (reads).
    let bDeleted = 0;
    try {
      const r = (await withTenantOn(client, "verify-b", (tx) =>
        (tx as unknown as { post: { deleteMany: (a: unknown) => Promise<{ count: number }> } }).post.deleteMany({
          where: { id: "verify-global-a" },
        }),
      )) as { count: number };
      bDeleted = r.count;
    } catch {
      bDeleted = 0;
    }
    check(
      "⚠ …nor delete it, because a read clause must not authorise a DELETE",
      bDeleted === 0,
      `another school deleted ${bDeleted} of A's global post(s) — moderation nobody granted`,
    );

    // The same hazard on the OTHER read-only clauses, which had never been
    // tested for it: a join code is a credential for reading one row.
    let deletedByCode = 0;
    try {
      const r = (await client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.join_code', $1, true)`, "VA");
        return (tx as unknown as {
          school: { deleteMany: (a: unknown) => Promise<{ count: number }> };
        }).school.deleteMany({ where: { id: "verify-a" } });
      })) as { count: number };
      deletedByCode = r.count;
    } catch {
      deletedByCode = 0;
    }
    check(
      "⚠ knowing a join code does NOT let you delete the row it names",
      deletedByCode === 0,
      `a join code authorised DELETE — removed ${deletedByCode} school row(s), cascading to everything they own`,
    );

    /* ---------------------------------------------------------------- *
     * The leaving certificate, and the only clause in this schema that
     * lets one school read a row another school wrote.
     *
     * A pupil left school A and is now at school B. B must be able to read
     * what A certified about them — that is what a transfer certificate IS —
     * and B must still be unable to read anything else of A's, and unable to
     * read A's certificates about children who are not B's. Every one of those
     * is a claim about Postgres, so none of them can be made by `npm test`,
     * which runs as the owner with no policies in force.
     * ---------------------------------------------------------------- */
    const recordCount = (tx: TxLike, args?: unknown) =>
      (tx as unknown as { schoolRecord: { count: (a?: unknown) => Promise<number> } }).schoolRecord.count(
        args,
      );

    const issuerSees = await withTenantOn(client, "verify-a", (tx) =>
      recordCount(tx as TxLike, { where: { id: "verify-rec-a" } }),
    );
    check(
      "⚠ the school that ISSUED a leaving certificate can still read it",
      issuerSees === 1,
      "the issuer cannot read what it certified, so it cannot correct or withdraw one",
    );

    const receiverSees = await withTenantOn(client, "verify-b", (tx) =>
      recordCount(tx as TxLike, { where: { id: "verify-rec-a" } }),
    );
    check(
      "⚠ …and so can the school the child attends NOW, though it never wrote it",
      receiverSees === 1,
      "the receiving school cannot read the certificate — the whole feature does nothing",
    );

    // The line that keeps that from being a hole. B reads certificates about
    // B's OWN pupils. `verify-other` has a certificate from A and has never
    // been anywhere near B.
    const strangerSeen = await withTenantOn(client, "verify-b", (tx) =>
      recordCount(tx as TxLike, { where: { id: "verify-rec-stranger" } }),
    );
    check(
      "⚠ …but NOT a certificate about somebody who was never their pupil",
      strangerSeen === 0,
      `school B read ${strangerSeen} certificate(s) about a child it has never taught — the clause is a browse, not a handover`,
    );

    // And it opens ONE table. If reading a certificate about their own pupil
    // also let B reach A's posts, the clause would be a tenant boundary with a
    // hole in it rather than a document being handed over.
    const bSeesAPosts = await withTenantOn(client, "verify-b", (tx) =>
      (tx as unknown as { post: { count: (a: unknown) => Promise<number> } }).post.count({
        where: { schoolId: "verify-a", scope: { not: "GLOBAL" } },
      }),
    );
    check(
      "⚠ …and reading it opens nothing else of the issuing school's",
      bSeesAPosts === 0,
      `school B read ${bSeesAPosts} of school A's posts — the certificate clause has widened past its table`,
    );

    // The pupil themselves, with NO school bound at all — which is their real
    // situation the moment they leave, and the reason `studentUserId` is on
    // the row. A policy keyed only on schoolId would hide their own
    // certificate from them at exactly the moment they need to show it.
    let pupilSees = -1;
    try {
      pupilSees = await client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', 'verify-pupil', true)`);
        return recordCount(tx, { where: { id: "verify-rec-a" } });
      });
    } catch {
      pupilSees = -1;
    }
    check(
      "⚠ …and the child reads their own with no school bound at all",
      pupilSees === 1,
      "a pupil cannot read their own leaving certificate once they have left",
    );

    // Read-only, like every other widening clause here. The lesson the join
    // code taught: a clause added to USING authorises DELETE too unless the
    // widening lives in a FOR SELECT policy.
    let receiverWrote = 0;
    try {
      await withTenantOn(client, "verify-b", (tx) =>
        (
          tx as unknown as { schoolRecord: { deleteMany: (a: unknown) => Promise<{ count: number }> } }
        ).schoolRecord.deleteMany({ where: { id: "verify-rec-a" } }),
      );
      receiverWrote = await psqlCount(
        `SELECT count(*) FROM "SchoolRecord" WHERE id = 'verify-rec-a'`,
      );
    } catch {
      receiverWrote = 1; // refused outright is a pass
    }
    check(
      "⚠ …and cannot delete a certificate it did not write",
      receiverWrote === 1,
      "the receiving school withdrew another school's certificate — a read clause authorised a DELETE again",
    );

    /* ---------------------------------------------------------------- *
     * Joining two accounts, which is the only ordinary write in this app
     * that touches two schools in ONE transaction.
     *
     * The unit suite connects as the owner and therefore cannot see any of
     * this: with the policies off, every UPDATE below succeeds whatever is
     * bound, so a merge that reached into a school the person has nothing to
     * do with would pass every test in `tests/account-merge.test.ts`. That is
     * the exact shape of the bug this file exists for.
     * ---------------------------------------------------------------- */

    const membershipOwner = (id: string): string =>
      psql(DB, `SELECT "userId" FROM "Membership" WHERE id = '${id}'`).trim();

    const moveMembership = async (bound: string, from: string, to: string): Promise<number> => {
      try {
        const result = await withTenantOn(client, bound, (tx) =>
          (
            tx as unknown as {
              membership: { updateMany: (a: unknown) => Promise<{ count: number }> };
            }
          ).membership.updateMany({ where: { userId: from }, data: { userId: to } }),
        );
        return result.count;
      } catch {
        return -1; // refused outright is a stronger pass than "changed nothing"
      }
    };

    // FIRST THE NEGATIVE, because it is the one that matters. A merge bound to
    // only the signed-in session's school — which is what `$tenantTransaction`
    // does on its own, and what this feature would have done if `forTenant` had
    // been forgotten — must not be able to move the OTHER school's membership.
    const reachedTooFar = await moveMembership("verify-b", "verify-merge-old", "verify-merge-new");
    check(
      "⚠ a merge bound to one school cannot move another school's membership",
      reachedTooFar <= 0 && membershipOwner("verify-m-merge-old") === "verify-merge-old",
      `an update bound to school B changed ${reachedTooFar} of school A's membership rows — a cross-school write is escaping its tenant set`,
    );

    // And the gap itself, in the database rather than in prose: before any
    // merge, school B cannot read the certificate, because the child's OTHER
    // account is the one holding it and that account has never been at B.
    const beforeMerge = await withTenantOn(client, "verify-b", (tx) =>
      recordCount(tx as TxLike, { where: { id: "verify-rec-merge" } }),
    );
    check(
      "⚠ before a merge the new school cannot see the old account's certificate",
      beforeMerge === 0,
      "school B could already read it, so this check proves nothing about the merge",
    );

    // Now the merge itself: bound to BOTH schools, exactly as `mergeAccounts`
    // binds them, from ids Postgres handed back rather than from a form.
    const bothSchools = "verify-a,verify-b";
    const moved = await moveMembership(bothSchools, "verify-merge-old", "verify-merge-new");
    check(
      "⚠ …and bound to both, it can",
      moved === 1 && membershipOwner("verify-m-merge-old") === "verify-merge-new",
      `moved ${moved} membership row(s) — the merge cannot write at all under the policies`,
    );

    let recordMoved = -1;
    try {
      recordMoved = (
        await withTenantOn(client, bothSchools, (tx) =>
          (
            tx as unknown as {
              schoolRecord: { updateMany: (a: unknown) => Promise<{ count: number }> };
            }
          ).schoolRecord.updateMany({
            where: { studentUserId: "verify-merge-old" },
            data: { studentUserId: "verify-merge-new" },
          }),
        )
      ).count;
    } catch {
      recordMoved = -1;
    }
    check(
      "⚠ …and the certificate moves with it",
      recordMoved === 1,
      `moved ${recordMoved} certificate(s) — the child's history would be split across two accounts, one of which can no longer sign in`,
    );

    // THE PAYOFF, and the only claim the whole feature is for. The certificate
    // has not moved school and nobody has been granted anything: it now names a
    // user who holds a live membership at B, and `MEMBER_READABLE` does the
    // rest. Nothing in rls.sql changed to make this true.
    const afterMerge = await withTenantOn(client, "verify-b", (tx) =>
      recordCount(tx as TxLike, { where: { id: "verify-rec-merge" } }),
    );
    check(
      "⚠ …so the new school can now read where the child came from",
      afterMerge === 1,
      "after the merge school B still cannot read the certificate — the transfer story is still broken",
    );

    /* ---------------------------------------------------------------- *
     * The superuser boundary.
     *
     * This is the whole reason the flag is safe to have, and it is a NEGATIVE
     * claim, so it cannot be shown by a unit test that runs as the owner with
     * no policies in force. `app.is_superuser` appears in exactly two policies,
     * School and Invite. Everything below asks Postgres to confirm the "and
     * nothing else" — with the flag set and NO school bound at all.
     * ---------------------------------------------------------------- */
    const asSuperuser = async <T>(work: (tx: TxLike) => Promise<T>): Promise<T> =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.is_superuser', '1', true)`);
        // Deliberately no app.school_ids: an operator belongs to no school, and
        // binding one here would prove nothing about the flag.
        return work(tx);
      });

    const superuserSchools = (await asSuperuser((tx) => tx.school.findMany({}))) as unknown[];
    check(
      "⚠ a superuser sees every school, with no school bound",
      superuserSchools.length >= 2,
      `saw ${superuserSchools.length} school(s) — the operator cannot administer what they cannot list`,
    );

    const anyTx = (tx: TxLike) => tx as unknown as Record<string, { count: (a?: unknown) => Promise<number> }>;

    // The list that matters. Each is a table an operator must NOT be able to
    // read, and each is a different shape of school data.
    //
    // Post carries a WHERE, and finding out why was worth the run: an operator
    // CAN see an approved GLOBAL post, because every school can — that is the
    // global feed, and it is public across schools on purpose. Counting all
    // posts made this check fail for a reason that had nothing to do with the
    // superuser flag. What the check meant all along is "no more than anybody
    // else sees", so it now asks for the school-scoped ones.
    const tables: [string, unknown][] = [
      ["membership", {}],
      ["attendanceRecord", {}],
      ["grade", {}],
      ["remarkMessage", {}],
      ["post", { where: { scope: { not: "GLOBAL" } } }],
      ["enrollment", {}],
      // AuditLog carries a WHERE for the same reason Post does, and the reason
      // is new: an operator CAN now read the rows that belong to no school —
      // their own actions, audited unattributed so they land in no tenant's
      // Safety Centre and are readable at /root/audit. Counting all rows would
      // fail this check for a reason that has nothing to do with the boundary.
      // The claim that matters is unchanged and is asserted below: a row
      // carrying a schoolId stays out of reach.
      ["auditLog", { where: { schoolId: { not: null } } }],
    ];

    for (const [table, args] of tables) {
      let rows = -1;
      try {
        rows = await asSuperuser((tx) => anyTx(tx)[table]!.count(args));
      } catch {
        rows = -1; // refused outright is also a pass
      }
      check(
        `⚠ …and NO ${table} rows, because the flag opens two tables and not this one`,
        rows <= 0,
        `a superuser read ${rows} ${table} row(s) — the operator boundary is not where it claims to be`,
      );
    }

    /**
     * The other half of the audit boundary, and it is a POSITIVE claim.
     *
     * Every operator action is audited with schoolId NULL so that it appears in
     * no school's Safety Centre. That was correct and it meant nothing could
     * read the rows at all — written, invisible to every school, and invisible
     * to the person who wrote them. An audit trail with no reader is worse than
     * none, because it is trusted.
     *
     * So the policy now lets a superuser SELECT rows where schoolId IS NULL.
     * The check above proves that did not widen into a school's history; this
     * one proves it went far enough to be worth having.
     */
    let unattributed = -1;
    try {
      unattributed = await asSuperuser((tx) =>
        anyTx(tx).auditLog!.count({ where: { schoolId: null } }),
      );
    } catch {
      unattributed = -1;
    }
    check(
      "⚠ …but a superuser CAN read the rows that belong to no school — their own trail",
      unattributed > 0,
      `a superuser read ${unattributed} unattributed AuditLog row(s) — /root/audit would be empty and the operator's actions unreadable`,
    );

    // And an ordinary school cannot, which is what "belongs to no school" means.
    let tenantSawUnattributed = -1;
    try {
      tenantSawUnattributed = await withTenantOn(client, "verify-a", (tx) =>
        (tx as unknown as { auditLog: { count: (a: unknown) => Promise<number> } }).auditLog.count({
          where: { schoolId: null },
        }),
      );
    } catch {
      tenantSawUnattributed = 0;
    }
    check(
      "⚠ …and no school can, so the operator's log is not in anybody's Safety Centre",
      tenantSawUnattributed === 0,
      `a school read ${tenantSawUnattributed} unattributed AuditLog row(s) — including failed sign-ins from other schools`,
    );

    // Writes, not only reads: Invite is superuser-writable ON PURPOSE (it is how
    // a school gets its first admin) and Membership is not (that would be
    // self-service enrolment into any school on the server).
    let mintedMembership = 0;
    try {
      await asSuperuser((tx) =>
        tx.membership.create({
          data: {
            id: "verify-superuser-membership",
            userId: "verify-u",
            schoolId: "verify-a",
            role: "ADMIN",
            status: "ACTIVE",
          },
        }),
      );
      mintedMembership = 1;
    } catch {
      mintedMembership = 0;
    }
    check(
      "⚠ a superuser cannot mint themselves a membership in any school",
      mintedMembership === 0,
      "the operator wrote a Membership row — they can join any school they like, which defeats the boundary",
    );

    // LAST, because it deliberately poisons the connection: the mistake this
    // design exists to prevent, demonstrated rather than described — a plain
    // SET, outside a transaction, on a pooled connection. Anything added after
    // this runs with 'verify-a' still set and will quietly pass for the wrong
    // reason, which is how the four checks above first "failed".
    await client.$executeRawUnsafe(`SET app.school_ids = 'verify-a'`);
    const leaked = await client.post.count();
    check(
      "plain SET (not SET LOCAL) is shown to leak, as documented",
      leaked > 0,
      "a plain SET did NOT leak here — the warning in db.ts may be overstated " +
        "for this Postgres/pooler combination, which is worth knowing either way",
    );
  } finally {
    await client.$disconnect();
  }

  // ---- tidy up ------------------------------------------------------------
  psql("postgres", `DROP DATABASE IF EXISTS "${DB}"`);
  psql("postgres", `DROP ROLE IF EXISTS ${APP_ROLE}`);
  if (existsSync(PG_SCHEMA)) rmSync(PG_SCHEMA);
  if (existsSync(PG_CLIENT)) rmSync(PG_CLIENT, { recursive: true, force: true });

  if (failures.length > 0) {
    process.stdout.write(`\n${failures.length} check(s) failed.\n\n`);
    process.exit(1);
  }
  process.stdout.write("\nAll checks passed.\n\n");
}

main().catch((error) => {
  console.error("\nVerification could not run:\n", error instanceof Error ? error.message : error);
  console.error("\nNeeds a running Postgres and psql on PATH.\n");
  process.exit(1);
});
