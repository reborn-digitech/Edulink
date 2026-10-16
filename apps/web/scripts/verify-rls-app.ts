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

  // The addressee bootstrap's fixtures: a pending invitation in school A,
  // addressed to a VERIFIED user, and another addressed to an UNVERIFIED one.
  psql(
    DB,
    `INSERT INTO "User" (id,name,email,"emailVerifiedAt",prefs,"updatedAt") VALUES
       ('verify-addr','Addressee','addressee@x.test',now(),'{}',now()),
       ('verify-addr-unv','Unverified','unv@x.test',NULL,'{}',now());
     INSERT INTO "Invite" (id,"schoolId",role,email,"tokenHash","expiresAt",status) VALUES
       ('verify-inv-addr','verify-a','TEACHER','addressee@x.test','verify-hash-addr',now() + interval '7 day','PENDING'),
       ('verify-inv-unv','verify-a','TEACHER','unv@x.test','verify-hash-unv',now() + interval '7 day','PENDING');`,
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

    // ---- the addressee clause: your own VERIFIED email's pending invites ---
    // The one thing this opens is what /join offers a signed-in user; shown
    // to be exactly that wide: verified sees their own, unverified sees
    // nothing, and nobody writes through it.
    const asAddr = <T,>(userId: string, sql: (tx: TxLike) => Promise<T>) =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, userId);
        return sql(tx);
      });
    type InviteRow = { id: string };
    const mine = (await asAddr("verify-addr", (tx) =>
      (tx as unknown as { invite: { findMany: (a?: unknown) => Promise<InviteRow[]> } }).invite.findMany({ select: { id: true } }),
    )) as InviteRow[];
    check(
      "a VERIFIED address reads exactly the pending invitations addressed to it",
      mine.length === 1 && mine[0]?.id === "verify-inv-addr",
      `saw ${JSON.stringify(mine.map((i) => i.id))} — expected only verify-inv-addr`,
    );
    const unv = (await asAddr("verify-addr-unv", (tx) =>
      (tx as unknown as { invite: { findMany: (a?: unknown) => Promise<InviteRow[]> } }).invite.findMany({ select: { id: true } }),
    )) as InviteRow[];
    check(
      "⚠ an UNVERIFIED address reads none — a claim is not a fact",
      unv.length === 0,
      `saw ${JSON.stringify(unv.map((i) => i.id))} for an unverified email`,
    );
    let inviteWriteRefused = false;
    try {
      await asAddr("verify-addr", (tx) =>
        (tx as unknown as { invite: { update: (a: unknown) => Promise<unknown> } }).invite.update({
          where: { id: "verify-inv-addr" },
          data: { status: "ACCEPTED" },
        }),
      );
    } catch {
      inviteWriteRefused = true;
    }
    check(
      "⚠ …and cannot WRITE the invitation through that clause",
      inviteWriteRefused,
      "the addressee clause reached WITH CHECK — an invitee could accept or revoke rows directly",
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
     * A CHILD'S OWN RECORD, WITH NO SCHOOL BOUND AT ALL.
     *
     * The situation this is for: a pupil who has left, whose next school is
     * not on this platform — so there is no tenant to bind, now or ever
     * again. Every check below runs with `app.user_id` set and
     * `app.school_ids` deliberately UNSET, which is exactly the state their
     * session is in.
     *
     * The negatives are the reason this is safe to have. Opening a child's
     * report card to the child is only correct if it opens nobody else's.
     * ---------------------------------------------------------------- */

    // verify-pupil LEFT school A (their membership carries a leftAt) and their
    // record there must survive it. verify-other is a stranger at the same
    // school, with a report card of their own.
    psql(
      DB,
      `INSERT INTO "Class" (id,"schoolId",name,"joinCode","updatedAt") VALUES
         ('verify-class-a','verify-a','A Class','VCLASSA',now());
       INSERT INTO "ReportCard"
         (id,"schoolId","classId","studentMembershipId",title,status,"fromDateKey","toDateKey","attendancePresent","attendanceTotal","updatedAt") VALUES
         ('verify-card-pupil','verify-a','verify-class-a','verify-m-pupil-a','Term 1','PUBLISHED','2026-01-05','2026-04-01',9,10,now()),
         ('verify-card-other','verify-a','verify-class-a','verify-m-other','Term 1','PUBLISHED','2026-01-05','2026-04-01',8,10,now());
       INSERT INTO "ReportCardItem" (id,"schoolId","reportCardId",title,position) VALUES
         ('verify-item-pupil','verify-a','verify-card-pupil','Maths',0),
         ('verify-item-other','verify-a','verify-card-other','Maths',0);
       INSERT INTO "EarnedBadge" (id,"schoolId","studentMembershipId","badgeId",label) VALUES
         ('verify-badge-pupil','verify-a','verify-m-pupil-a','abhyaas:fractions','Fractions'),
         ('verify-badge-other','verify-a','verify-m-other','abhyaas:fractions','Fractions');
       INSERT INTO "AttendanceSession" (id,"schoolId","classId","dateKey") VALUES
         ('verify-sess','verify-a','verify-class-a','2026-03-02');
       INSERT INTO "AttendanceRecord" (id,"schoolId","sessionId","studentMembershipId",status,"updatedAt") VALUES
         ('verify-att-pupil','verify-a','verify-sess','verify-m-pupil-a','PRESENT',now()),
         ('verify-att-other','verify-a','verify-sess','verify-m-other','PRESENT',now());
       -- A parent of the pupil, and nobody else's parent.
       INSERT INTO "User" (id,name,prefs,"updatedAt") VALUES ('verify-parent','Parent','{}',now());
       INSERT INTO "Guardianship" (id,"parentUserId","studentMembershipId","studentSchoolId",relation,status) VALUES
         ('verify-guard','verify-parent','verify-m-pupil-a','verify-a','PARENT','ACTIVE');`,
    );

    /** Bound to a PERSON and to no school whatsoever. */
    const asPersonOnly = async <T>(userId: string, work: (tx: TxLike) => Promise<T>): Promise<T> =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, userId);
        return work(tx);
      });

    const countOf = (tx: TxLike, model: string, id: string) =>
      (tx as unknown as Record<string, { count: (a: unknown) => Promise<number> }>)[model]!.count({
        where: { id },
      });

    for (const [model, own, theirs] of [
      ["reportCard", "verify-card-pupil", "verify-card-other"],
      ["reportCardItem", "verify-item-pupil", "verify-item-other"],
      ["earnedBadge", "verify-badge-pupil", "verify-badge-other"],
      ["attendanceRecord", "verify-att-pupil", "verify-att-other"],
    ] as const) {
      const mine = await asPersonOnly("verify-pupil", (tx) => countOf(tx, model, own));
      check(
        `⚠ a pupil who has LEFT still reads their own ${model}, with no school bound`,
        mine === 1,
        `read ${mine} — a leaver cannot open their own record, which is the whole feature`,
      );

      const stranger = await asPersonOnly("verify-pupil", (tx) => countOf(tx, model, theirs));
      check(
        `⚠ …and NOT a classmate's ${model}`,
        stranger === 0,
        `read ${stranger} of somebody else's rows — the clause opens a table, not a row`,
      );

      const parentSees = await asPersonOnly("verify-parent", (tx) => countOf(tx, model, own));
      check(
        `⚠ …their guardian reads it too, across a school the child has left (${model})`,
        parentSees === 1,
        `a parent read ${parentSees} — they cannot follow their child's journey`,
      );

      const parentStranger = await asPersonOnly("verify-parent", (tx) => countOf(tx, model, theirs));
      check(
        `⚠ …and that guardian reads NO other child's ${model}`,
        parentStranger === 0,
        `a parent read ${parentStranger} rows about a child who is not theirs`,
      );

      // Nobody at all. The clauses key on app.user_id, so an unbound request
      // must still see nothing — the fail-closed property the whole file rests
      // on, re-checked here because these are the most sensitive tables in it.
      const nobody = await client.$transaction((tx: TxLike) => countOf(tx, model, own));
      check(
        `⚠ …and a request that is nobody reads no ${model} at all`,
        nobody === 0,
        `an unbound request read ${nobody} rows`,
      );
    }

    // READ ONLY, the lesson the join code taught: a clause in USING authorises
    // DELETE unless the widening lives in a FOR SELECT policy.
    let leaverDeleted = 0;
    try {
      await asPersonOnly("verify-pupil", (tx) =>
        (
          tx as unknown as { reportCard: { deleteMany: (a: unknown) => Promise<{ count: number }> } }
        ).reportCard.deleteMany({ where: { id: "verify-card-pupil" } }),
      );
      leaverDeleted = psqlCount(`SELECT count(*) FROM "ReportCard" WHERE id = 'verify-card-pupil'`);
    } catch {
      leaverDeleted = 1;
    }
    check(
      "⚠ …and a pupil cannot DELETE their own report card, only read it",
      leaverDeleted === 1,
      "a leaver withdrew a document their school issued — a read clause authorised a DELETE again",
    );

    let leaverWrote = 0;
    try {
      await asPersonOnly("verify-pupil", (tx) =>
        (
          tx as unknown as { reportCard: { updateMany: (a: unknown) => Promise<{ count: number }> } }
        ).reportCard.updateMany({ where: { id: "verify-card-pupil" }, data: { title: "Straight As" } }),
      );
      leaverWrote = psqlCount(
        `SELECT count(*) FROM "ReportCard" WHERE id = 'verify-card-pupil' AND title = 'Term 1'`,
      );
    } catch {
      leaverWrote = 1;
    }
    check(
      "⚠ …nor edit one",
      leaverWrote === 1,
      "a leaver rewrote their own report card — the record is theirs to READ",
    );

    /* ---------------------------------------------------------------- *
     * THE PREVIOUS SCHOOL'S PUBLISHED REPORT CARDS (R-70, 10 Oct 2026).
     *
     * verify-pupil left school A (verify-rec-a is A's live leaving record)
     * and is on B's roll now. B reads A's PUBLISHED card about the pupil and
     * its items, and nothing else: not A's draft about the same child, not
     * A's card about a child B never taught, and nothing once the pupil has
     * left B too. The clause is anchored on the certificate, so it opens no
     * card where no departure was recorded (verify-m-other has a card at A
     * and no certificate B can read).
     * ---------------------------------------------------------------- */
    psql(
      DB,
      `INSERT INTO "ReportCard"
         (id,"schoolId","classId","studentMembershipId",title,status,"fromDateKey","toDateKey","attendancePresent","attendanceTotal","updatedAt") VALUES
         ('verify-card-draft','verify-a','verify-class-a','verify-m-pupil-a','Term 2','DRAFT','2026-01-05','2026-04-01',9,10,now());`,
    );
    const cardCount = (school: string, id: string) =>
      withTenantOn(client, school, (tx) =>
        (tx as unknown as { reportCard: { count: (a: unknown) => Promise<number> } }).reportCard.count({ where: { id } }),
      );
    const itemCount = (school: string, id: string) =>
      withTenantOn(client, school, (tx) =>
        (tx as unknown as { reportCardItem: { count: (a: unknown) => Promise<number> } }).reportCardItem.count({ where: { id } }),
      );
    check(
      "⚠ R-70: the school the child attends NOW reads the previous school's PUBLISHED report card",
      (await cardCount("verify-b", "verify-card-pupil")) === 1,
      "the receiving school cannot read the card — the previous-schools panel is empty",
    );
    check(
      "⚠ …and its items",
      (await itemCount("verify-b", "verify-item-pupil")) === 1,
      "the card opens but its items do not — it renders empty",
    );
    const draftSeen = await cardCount("verify-b", "verify-card-draft");
    check(
      "⚠ …but NOT the previous school's DRAFT about the same child",
      draftSeen === 0,
      `school B read ${draftSeen} draft card(s) — a working surface crossed the fence`,
    );
    const otherCardSeen = await cardCount("verify-b", "verify-card-other");
    check(
      "⚠ …nor a card about a child that was never their pupil",
      otherCardSeen === 0,
      `school B read ${otherCardSeen} card(s) about a stranger — the clause is a browse, not a handover`,
    );
    psql(DB, `UPDATE "Membership" SET "leftAt" = now() WHERE id = 'verify-m-pupil-b'`);
    const leftBSeen = await cardCount("verify-b", "verify-card-pupil");
    psql(DB, `UPDATE "Membership" SET "leftAt" = NULL WHERE id = 'verify-m-pupil-b'`);
    check(
      "⚠ …and nothing once the child has left the receiving school too",
      leftBSeen === 0,
      `school B still read ${leftBSeen} card(s) after the pupil left it — leftAt is not in the predicate`,
    );
    let receiverEditedCard = 0;
    try {
      await withTenantOn(client, "verify-b", (tx) =>
        (tx as unknown as { reportCard: { updateMany: (a: unknown) => Promise<{ count: number }> } }).reportCard.updateMany({ where: { id: "verify-card-pupil" }, data: { title: "Rewritten" } }),
      );
      receiverEditedCard = psqlCount(`SELECT count(*) FROM "ReportCard" WHERE id = 'verify-card-pupil' AND title = 'Term 1'`);
    } catch {
      receiverEditedCard = 1;
    }
    check(
      "⚠ …and the receiving school cannot edit a card it did not write",
      receiverEditedCard === 1,
      "the receiving school rewrote another school's report card — a read clause authorised an UPDATE",
    );

    // The journey: a guardian listing every school their child has attended,
    // including the one they left, with no school bound.
    const parentSeesMemberships = await asPersonOnly("verify-parent", (tx) =>
      (
        tx as unknown as { membership: { count: (a: unknown) => Promise<number> } }
      ).membership.count({ where: { id: "verify-m-pupil-a" } }),
    );
    check(
      "⚠ a guardian reads their child's membership at a school the child has LEFT",
      parentSeesMemberships === 1,
      "a parent cannot see which schools their child attended — no journey to show",
    );

    const parentSeesStrangerMembership = await asPersonOnly("verify-parent", (tx) =>
      (
        tx as unknown as { membership: { count: (a: unknown) => Promise<number> } }
      ).membership.count({ where: { id: "verify-m-other" } }),
    );
    check(
      "⚠ …and no membership of a child who is not theirs",
      parentSeesStrangerMembership === 0,
      `a parent read ${parentSeesStrangerMembership} membership row(s) belonging to another family`,
    );

    const parentSeesCertificate = await asPersonOnly("verify-parent", (tx) =>
      recordCount(tx, { where: { id: "verify-rec-a" } }),
    );
    check(
      "⚠ …and the leaving certificate, which is the family's to hand on",
      parentSeesCertificate === 1,
      "a guardian cannot read the certificate they are the ones expected to produce",
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
     * THE OPERATOR, INSIDE ONE SCHOOL.
     *
     * The oversight feature binds ONE school with `forSchool` while a grant is
     * live, so the operator is governed by the ordinary tenant clause exactly
     * as that school's admin is. That is the whole containment argument, and
     * the unit suite cannot test it: it runs as the owner with the policies
     * off, where a bug that opened every school would pass silently.
     *
     * These bind school A and check that B stays dark — including with the
     * superuser flag ALSO set, which is the state an operator is actually in.
     * ---------------------------------------------------------------- */

    const asOperatorInSchool = async <T>(
      schoolIds: string,
      work: (tx: TxLike) => Promise<T>,
    ): Promise<T> =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.school_ids', $1, true)`, schoolIds);
        await tx.$executeRawUnsafe(`SELECT set_config('app.is_superuser', '1', true)`);
        return work(tx);
      });

    const postsIn = (tx: TxLike, schoolId: string) =>
      (tx as unknown as { post: { count: (a: unknown) => Promise<number> } }).post.count({
        where: { schoolId, scope: { not: "GLOBAL" } },
      });

    const ownSchool = await asOperatorInSchool("verify-a", (tx) => postsIn(tx, "verify-a"));
    check(
      "⚠ an operator holding a grant on ONE school reads that school",
      ownSchool >= 1,
      `read ${ownSchool} of school A's posts — an opened school shows nothing, so oversight does nothing`,
    );

    const nextDoor = await asOperatorInSchool("verify-a", (tx) => postsIn(tx, "verify-b"));
    check(
      "⚠ …and the school NEXT DOOR stays dark, flag or no flag",
      nextDoor === 0,
      `read ${nextDoor} of school B's posts while holding a grant on A — opening one school opened another`,
    );

    // The register is the sharpest version of the same question: a grant is a
    // school binding, not a key to children's attendance everywhere.
    const attendanceNextDoor = await asOperatorInSchool("verify-a", (tx) =>
      (
        tx as unknown as { attendanceRecord: { count: (a: unknown) => Promise<number> } }
      ).attendanceRecord.count({ where: { schoolId: "verify-b" } }),
    );
    check(
      "⚠ …including their register",
      attendanceNextDoor === 0,
      `read ${attendanceNextDoor} of school B's attendance rows from a grant on school A`,
    );

    /* -- The visitor book, which is what makes the whole thing accountable. -- */

    psql(
      DB,
      `INSERT INTO "OperatorAccess" (id,"schoolId","userId",reason,"expiresAt") VALUES
         ('verify-grant','verify-a','verify-u','Checking a report', now() + interval '1 hour');`,
    );

    const schoolSeesGrant = await withTenantOn(client, "verify-a", (tx) =>
      (
        tx as unknown as { operatorAccess: { count: (a?: unknown) => Promise<number> } }
      ).operatorAccess.count(),
    );
    check(
      "⚠ a school can READ that the operator opened it",
      schoolSeesGrant === 1,
      "the school cannot see the visit — the accountability half of oversight is ornamental",
    );

    const otherSchoolSeesGrant = await withTenantOn(client, "verify-b", (tx) =>
      (
        tx as unknown as { operatorAccess: { count: (a?: unknown) => Promise<number> } }
      ).operatorAccess.count(),
    );
    check(
      "⚠ …and no other school can",
      otherSchoolSeesGrant === 0,
      `school B read ${otherSchoolSeesGrant} of school A's operator visits`,
    );

    // NO DELETE POLICY EXISTS, so nobody may remove a row saying the operator
    // was here — not the school whose book it is, and not the operator, who is
    // bound to that school while the grant is live and could otherwise look,
    // act, and erase the evidence.
    let schoolDeleted = 0;
    try {
      await withTenantOn(client, "verify-a", (tx) =>
        (
          tx as unknown as {
            operatorAccess: { deleteMany: (a: unknown) => Promise<{ count: number }> };
          }
        ).operatorAccess.deleteMany({ where: { id: "verify-grant" } }),
      );
      schoolDeleted = psqlCount(`SELECT count(*) FROM "OperatorAccess" WHERE id = 'verify-grant'`);
    } catch {
      schoolDeleted = 1;
    }
    check(
      "⚠ …and the SCHOOL cannot tear the page out",
      schoolDeleted === 1,
      "a school deleted the record of an operator visit — the visitor book is not a record",
    );

    let operatorDeleted = 0;
    try {
      await asOperatorInSchool("verify-a", (tx) =>
        (
          tx as unknown as {
            operatorAccess: { deleteMany: (a: unknown) => Promise<{ count: number }> };
          }
        ).operatorAccess.deleteMany({ where: { id: "verify-grant" } }),
      );
      operatorDeleted = psqlCount(`SELECT count(*) FROM "OperatorAccess" WHERE id = 'verify-grant'`);
    } catch {
      operatorDeleted = 1;
    }
    check(
      "⚠ …and NEITHER CAN THE OPERATOR, which is the point",
      operatorDeleted === 1,
      "the operator deleted the record of their own visit — they can look, act and cover their tracks",
    );

    /**
     * ⚠ WRITING THE VISITOR BOOK NEEDS THE OPERATOR FLAG, NOT JUST A SCHOOL.
     *
     * The half the sweep cannot reach. The application binds the school AND
     * sets `app.is_superuser` when it opens a grant; the first version bound
     * only the school, because `forSchool` derives the flag from an override
     * store that is empty on a fresh request. Postgres refused the INSERT,
     * which is how the bug was found at all — a SELECT in the same state
     * returns zero rows and looks like an empty school.
     */
    let insertedWithSchoolOnly = 0;
    try {
      await withTenantOn(client, "verify-a", (tx) =>
        (
          tx as unknown as { operatorAccess: { create: (a: unknown) => Promise<unknown> } }
        ).operatorAccess.create({
          data: {
            id: "verify-grant-nosu",
            schoolId: "verify-a",
            userId: "verify-u",
            reason: "No flag set",
            expiresAt: new Date(Date.now() + 3_600_000),
          },
        }),
      );
      insertedWithSchoolOnly = psqlCount(
        `SELECT count(*) FROM "OperatorAccess" WHERE id = 'verify-grant-nosu'`,
      );
    } catch {
      insertedWithSchoolOnly = 0; // refused outright is the pass
    }
    check(
      "⚠ a grant cannot be written by binding a school alone",
      insertedWithSchoolOnly === 0,
      "anybody who can bind a school can forge an operator visit, which makes the visitor book worthless",
    );

    let insertedAsOperator = 0;
    try {
      await asOperatorInSchool("verify-a", (tx) =>
        (
          tx as unknown as { operatorAccess: { create: (a: unknown) => Promise<unknown> } }
        ).operatorAccess.create({
          data: {
            id: "verify-grant-su",
            schoolId: "verify-a",
            userId: "verify-u",
            reason: "Flag set",
            expiresAt: new Date(Date.now() + 3_600_000),
          },
        }),
      );
      insertedAsOperator = psqlCount(
        `SELECT count(*) FROM "OperatorAccess" WHERE id = 'verify-grant-su'`,
      );
    } catch {
      insertedAsOperator = 0;
    }
    check(
      "⚠ …and CAN be written with the operator flag set, which is what opening does",
      insertedAsOperator === 1,
      "the operator cannot record their own visit, so opening a school fails outright",
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

    /**
     * THE TIMETABLE, which is the first table in this schema that every role in
     * a school reads and only one role writes.
     *
     * Worth its own checks rather than trusting "it got the standard policy",
     * because the standard policy is what makes the app-layer admin gate the
     * ONLY thing standing between a pupil and their own timetable — so it had
     * better be true that the school boundary underneath it holds. Reads and
     * writes both, in both directions.
     */
    await withTenantOn(client, "verify-a", (tx) =>
      (tx as unknown as { timetablePeriod: { create: (a: unknown) => Promise<unknown> } })
        .timetablePeriod.create({
          data: {
            id: "verify-period-a",
            schoolId: "verify-a",
            name: "Period 1",
            startMinute: 510,
            endMinute: 555,
            kind: "LESSON",
            position: 0,
          },
        }),
    );
    // `verify-class-a` was created for the report-card checks above and is
    // reused rather than duplicated — a second class with the same id fails on
    // the primary key and takes the whole run down before anything is asserted.
    psql(
      DB,
      `INSERT INTO "TimetableSlot" (id,"schoolId","classId","periodId",weekday,subject,"updatedAt")
         VALUES ('verify-slot-a','verify-a','verify-class-a','verify-period-a',1,'Maths',now());`,
    );

    const ownSlots = await withTenantOn(client, "verify-a", (tx) =>
      (tx as unknown as { timetableSlot: { count: (a?: unknown) => Promise<number> } })
        .timetableSlot.count(),
    );
    check(
      "⚠ a school reads its own timetable",
      ownSlots === 1,
      `saw ${ownSlots} slot(s) — the policy is refusing the school its own grid`,
    );

    const neighbourSlots = await withTenantOn(client, "verify-b", (tx) =>
      (tx as unknown as { timetableSlot: { count: (a?: unknown) => Promise<number> } })
        .timetableSlot.count(),
    );
    check(
      "⚠ …and the school next door reads none of it",
      neighbourSlots === 0,
      `school B saw ${neighbourSlots} of school A's lessons — who teaches whom, and when`,
    );

    let wroteIntoNeighbour = 0;
    try {
      await withTenantOn(client, "verify-b", (tx) =>
        (tx as unknown as { timetableSlot: { create: (a: unknown) => Promise<unknown> } })
          .timetableSlot.create({
            data: {
              id: "verify-slot-forged",
              schoolId: "verify-a",
              classId: "verify-class-a",
              periodId: "verify-period-a",
              weekday: 2,
              subject: "Forged",
            },
          }),
      );
      wroteIntoNeighbour = 1;
    } catch {
      wroteIntoNeighbour = 0;
    }
    check(
      "⚠ …and cannot write a lesson into it",
      wroteIntoNeighbour === 0,
      "a school wrote a lesson into another school's timetable — WITH CHECK is not holding",
    );

    let deletedNeighbour = 0;
    try {
      deletedNeighbour = await withTenantOn(client, "verify-b", (tx) =>
        (tx as unknown as { timetableSlot: { deleteMany: (a: unknown) => Promise<{ count: number }> } })
          .timetableSlot.deleteMany({ where: { schoolId: "verify-a" } }),
      ).then((r) => (r as unknown as { count: number }).count);
    } catch {
      deletedNeighbour = 0;
    }
    check(
      "⚠ …and cannot delete one either",
      deletedNeighbour === 0,
      `school B deleted ${deletedNeighbour} of school A's lessons — DELETE is authorised by USING alone`,
    );

    /**
     * THE CROSS-SCHOOL LEADERBOARD, which is the second place in this schema
     * where one school reads another school's row — and the first where the
     * question "what exactly crosses" had to be decided rather than inherited.
     *
     * These checks are the enforcement. The library returns an empty board when
     * the flag is off, but that is belt and braces; what makes the claim true is
     * that the POLICY refuses another school's standing for a competition whose
     * organiser has not switched the leaderboard on, and refuses every
     * `CompetitionEntry` — where the children are — under all conditions.
     */
    psql(
      DB,
      `INSERT INTO "Competition" (id,title,summary,"organizerName",status,"leaderboardEnabled","updatedAt") VALUES
         ('verify-comp-open','Open board','x','Org','PUBLISHED',true,now()),
         ('verify-comp-shut','Shut board','x','Org','PUBLISHED',false,now());
       INSERT INTO "Competition" (id,title,summary,"organizerName","organizerSchoolId",status,"leaderboardEnabled","updatedAt") VALUES
         ('verify-comp-own','School A''s own, board on','x','School A','verify-a','PUBLISHED',true,now());
       INSERT INTO "CompetitionStanding" (id,"competitionId","schoolId","schoolName",entrants,"bestRank","updatedAt") VALUES
         ('verify-stand-open-a','verify-comp-open','verify-a','A',3,2,now()),
         ('verify-stand-shut-a','verify-comp-shut','verify-a','A',3,1,now()),
         ('verify-stand-own-a','verify-comp-own','verify-a','A',3,1,now());
       INSERT INTO "CompetitionEntry" (id,"competitionId","studentMembershipId","schoolId",status,rank,"updatedAt")
         VALUES ('verify-entry-a','verify-comp-open','verify-m-pupil-a','verify-a','RESULTS',2,now());`,
    );

    const boardFromB = await withTenantOn(client, "verify-b", (tx) =>
      (tx as unknown as { competitionStanding: { count: (a?: unknown) => Promise<number> } })
        .competitionStanding.count({ where: { competitionId: "verify-comp-open" } }),
    );
    check(
      "⚠ a school reads ANOTHER school's standing when the leaderboard is on",
      boardFromB === 1,
      "school B saw no standings — the leaderboard cannot work across schools at all",
    );

    const shutBoardFromB = await withTenantOn(client, "verify-b", (tx) =>
      (tx as unknown as { competitionStanding: { count: (a?: unknown) => Promise<number> } })
        .competitionStanding.count({ where: { competitionId: "verify-comp-shut" } }),
    );
    check(
      "⚠ …and reads NOTHING when the organiser has not switched it on",
      shutBoardFromB === 0,
      `school B saw ${shutBoardFromB} standing(s) for a competition with the leaderboard off — the flag is not in the predicate`,
    );

    /**
     * THE ONE THAT MATTERS. The whole design rests on entries never crossing:
     * the standings carry a school, a count and a place, and the NAMES are in
     * CompetitionEntry. If this ever returns a row, a leaderboard has become a
     * list of other people's children.
     */
    const entriesFromB = await withTenantOn(client, "verify-b", (tx) =>
      (tx as unknown as { competitionEntry: { count: (a?: unknown) => Promise<number> } })
        .competitionEntry.count({ where: { competitionId: "verify-comp-open" } }),
    );
    check(
      "⚠ …and NEVER another school's entries, which is where the children are",
      entriesFromB === 0,
      `school B read ${entriesFromB} of school A's competition entries — a leaderboard is now a list of other schools' children`,
    );

    /**
     * A SCHOOL-POSTED competition's standing never crosses, flag or no flag.
     * Since school-posted competitions became their own school's alone
     * (competitions.ts), no page can show another school this row — so a
     * policy that let it cross would serve crafted queries only. The
     * `organizerSchoolId IS NULL` arm of the standing policy is what this
     * checks: the board is ON and the row still stays home.
     */
    const ownBoardFromB = await withTenantOn(client, "verify-b", (tx) =>
      (tx as unknown as { competitionStanding: { count: (a?: unknown) => Promise<number> } })
        .competitionStanding.count({ where: { competitionId: "verify-comp-own" } }),
    );
    check(
      "⚠ …and never a SCHOOL-POSTED competition's standing, even with its board on",
      ownBoardFromB === 0,
      `school B read ${ownBoardFromB} standing(s) for school A's own competition — the platform-only arm is missing from the policy`,
    );

    // The school's own standing is still its own to read — tightening the
    // cross arm must not have cost the organiser their own board.
    const ownBoardFromA = await withTenantOn(client, "verify-a", (tx) =>
      (tx as unknown as { competitionStanding: { count: (a?: unknown) => Promise<number> } })
        .competitionStanding.count({ where: { competitionId: "verify-comp-own" } }),
    );
    check(
      "…while the organising school still reads its own",
      ownBoardFromA === 1,
      "school A cannot read its own standing row — the tenant arm broke",
    );

    let wroteStanding = 0;
    try {
      await withTenantOn(client, "verify-b", (tx) =>
        (tx as unknown as { competitionStanding: { update: (a: unknown) => Promise<unknown> } })
          .competitionStanding.update({
            where: { id: "verify-stand-open-a" },
            data: { bestRank: 99 },
          }),
      );
      wroteStanding = 1;
    } catch {
      wroteStanding = 0;
    }
    check(
      "⚠ …and cannot edit another school's place on the board",
      wroteStanding === 0,
      "a school rewrote another school's standing — the global clause reached WITH CHECK",
    );

    /* ---------------------------------------------------------------- *
     * OUTREACH: the directory, the job board, and the enquiry policies.
     *
     * The three clauses and two pinned INSERTs added for cross-school
     * outreach, each asked of Postgres directly — because every one of them
     * is a claim about what a NON-member can and cannot do, which is exactly
     * the state the unit suite (owner connection, policies off) cannot see.
     * ---------------------------------------------------------------- */

    psql(
      DB,
      `UPDATE "School" SET "profilePublishedAt" = now() WHERE id = 'verify-b';
       INSERT INTO "JobPosting" (id,"schoolId",title,body,subjects,"employmentType","hiringContactMembershipId",status,"updatedAt") VALUES
         ('verify-job-open','verify-b','Maths teacher','x','[]','FULL_TIME','verify-m-b','OPEN',now()),
         ('verify-job-closed','verify-b','Old vacancy','x','[]','FULL_TIME','verify-m-b','CLOSED',now());`,
    );

    const asPerson = async <T>(userId: string, work: (tx: TxLike) => Promise<T>): Promise<T> =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, userId);
        return work(tx);
      });
    const outreachTx = (tx: TxLike) =>
      tx as unknown as Record<
        string,
        {
          count: (a?: unknown) => Promise<number>;
          create: (a: unknown) => Promise<unknown>;
          updateMany: (a: unknown) => Promise<{ count: number }>;
          deleteMany: (a: unknown) => Promise<{ count: number }>;
        }
      >;

    // The directory: with NOTHING bound, exactly the published school shows.
    const directorySchools = await client.school.findMany({});
    check(
      "⚠ with nothing bound, the directory shows the PUBLISHED school and only it",
      directorySchools.length === 1 &&
        (directorySchools[0] as { id: string }).id === "verify-b",
      `saw ${JSON.stringify((directorySchools as { id: string }[]).map((s) => s.id))} — either an unpublished school leaked into the directory or a published one is missing from it`,
    );

    // The board: the OPEN posting crosses, the closed one does not.
    const board = (await (
      client as unknown as { jobPosting: { findMany: (a?: unknown) => Promise<{ id: string }[]> } }
    ).jobPosting.findMany({})) as { id: string }[];
    check(
      "⚠ the board shows the OPEN vacancy to everyone and the closed one to nobody outside",
      board.length === 1 && board[0]?.id === "verify-job-open",
      `saw ${JSON.stringify(board.map((p) => p.id))}`,
    );

    // Opening an enquiry: your own row, against the published school — the
    // write a parent with NO school binding performs.
    let openedOwn = 0;
    try {
      await asPerson("verify-other", (tx) =>
        outreachTx(tx).enquiry!.create({
          data: {
            id: "verify-enq",
            schoolId: "verify-b",
            kind: "ADMISSION",
            fromUserId: "verify-other",
            schoolName: "B",
          },
        }),
      );
      openedOwn = 1;
    } catch {
      openedOwn = 0;
    }
    check(
      "⚠ a school-less user CAN open an enquiry with a school that published",
      openedOwn === 1,
      "the outreach INSERT policy refused the one write it exists to allow — no parent can ever enquire",
    );

    const refusedInsert = async (label: string, data: Record<string, unknown>, why: string) => {
      let inserted = 0;
      try {
        await asPerson("verify-other", (tx) => outreachTx(tx).enquiry!.create({ data }));
        inserted = 1;
      } catch {
        inserted = 0;
      }
      check(label, inserted === 0, why);
    };

    await refusedInsert(
      "⚠ …but cannot SIGN somebody else's name on one",
      { id: "verify-enq-forged", schoolId: "verify-b", kind: "ADMISSION", fromUserId: "verify-u", schoolName: "B" },
      "an enquiry was written naming a different user as its opener — enquiries can be forged",
    );
    await refusedInsert(
      "⚠ …and not at a school that has NOT published",
      { id: "verify-enq-unpub", schoolId: "verify-a", kind: "ADMISSION", fromUserId: "verify-other", schoolName: "A" },
      "an admissions enquiry landed at an unpublished school — the opt-in is ornamental",
    );
    await refusedInsert(
      "⚠ …and cannot ride one school's vacancy into ANOTHER school's tenant",
      { id: "verify-enq-ride", schoolId: "verify-a", kind: "JOB", jobPostingId: "verify-job-open", fromUserId: "verify-other", schoolName: "A" },
      "a JOB enquiry named school A while riding school B's vacancy — the school equality is missing from the policy",
    );
    await refusedInsert(
      "⚠ …and not against a CLOSED vacancy",
      { id: "verify-enq-closed", schoolId: "verify-b", kind: "JOB", jobPostingId: "verify-job-closed", fromUserId: "verify-other", schoolName: "B" },
      "an enquiry rode a closed vacancy — closing a posting does not close its door",
    );

    // Replying: the opener on their OWN open thread, and nobody else's name.
    let replied = 0;
    try {
      await asPerson("verify-other", (tx) =>
        outreachTx(tx).enquiryMessage!.create({
          data: {
            id: "verify-msg-own",
            schoolId: "verify-b",
            enquiryId: "verify-enq",
            authorUserId: "verify-other",
            body: "hello",
          },
        }),
      );
      replied = 1;
    } catch {
      replied = 0;
    }
    check(
      "⚠ the opener can write a message on their own open enquiry",
      replied === 1,
      "the opener cannot reply on their own thread — every enquiry is a single shout into a well",
    );

    let strangerWrote = 0;
    try {
      await asPerson("verify-u", (tx) =>
        outreachTx(tx).enquiryMessage!.create({
          data: {
            id: "verify-msg-stranger",
            schoolId: "verify-b",
            enquiryId: "verify-enq",
            authorUserId: "verify-u",
            body: "me too",
          },
        }),
      );
      strangerWrote = 1;
    } catch {
      strangerWrote = 0;
    }
    check(
      "⚠ …and a STRANGER cannot write onto somebody else's enquiry",
      strangerWrote === 0,
      "a user wrote a message on an enquiry they did not open, from outside the school — enquiries are a public wall",
    );

    // Reads: the opener alone outside the school; the target school inside.
    const openerReads = await asPerson("verify-other", async (tx) => ({
      enquiries: await outreachTx(tx).enquiry!.count(),
      messages: await outreachTx(tx).enquiryMessage!.count(),
    }));
    check(
      "⚠ the opener reads their enquiry and its messages with no school bound",
      openerReads.enquiries === 1 && openerReads.messages === 1,
      `opener saw ${openerReads.enquiries} enquiry(ies) and ${openerReads.messages} message(s)`,
    );
    const strangerReads = await asPerson("verify-u", async (tx) => ({
      enquiries: await outreachTx(tx).enquiry!.count(),
      messages: await outreachTx(tx).enquiryMessage!.count(),
    }));
    check(
      "⚠ …and a stranger reads NEITHER",
      strangerReads.enquiries === 0 && strangerReads.messages === 0,
      `a third user saw ${strangerReads.enquiries} enquiry(ies) and ${strangerReads.messages} message(s) that are not theirs`,
    );
    const targetReads = await withTenantOn(client, "verify-b", (tx) =>
      outreachTx(tx as TxLike).enquiry!.count(),
    );
    const otherSchoolReads = await withTenantOn(client, "verify-a", (tx) =>
      outreachTx(tx as TxLike).enquiry!.count(),
    );
    check(
      "⚠ the TARGET school reads the enquiry as an ordinary tenant row; the school next door reads nothing",
      targetReads === 1 && otherSchoolReads === 0,
      `target school saw ${targetReads}, another school saw ${otherSchoolReads}`,
    );

    // The opener holds INSERT and nothing else: a sent enquiry cannot be
    // rewritten or unsent from outside the school.
    const rewrote = await asPerson("verify-other", (tx) =>
      outreachTx(tx).enquiry!.updateMany({ where: { id: "verify-enq" }, data: { status: "CLOSED" } }),
    );
    const unsent = await asPerson("verify-other", (tx) =>
      outreachTx(tx).enquiryMessage!.deleteMany({ where: { id: "verify-msg-own" } }),
    );
    check(
      "⚠ the opener cannot rewrite or unsend what the school has received",
      rewrote.count === 0 && unsent.count === 0,
      `updated ${rewrote.count} enquiry(ies), deleted ${unsent.count} message(s) — the outreach write is wider than INSERT`,
    );

    // The answer must be READABLE to the person it answers: notifications
    // are self-readable, and only your own — the clause the enquiry desk
    // forced into existence (see SELF_READABLE.Notification in gen-rls.ts).
    psql(
      DB,
      `INSERT INTO "Notification" (id,"userId","schoolId",kind,title,body,meta,"createdAt") VALUES
         ('verify-notif-own','verify-other','verify-b','ENQUIRY','Reply','','{}',now()),
         ('verify-notif-stranger','verify-u','verify-b','ENQUIRY','Reply','','{}',now());`,
    );
    const ownNotifs = await asPerson("verify-other", (tx) =>
      outreachTx(tx).notification!.count(),
    );
    check(
      "⚠ the opener reads the notification that answers them, with no school bound",
      ownNotifs === 1,
      `saw ${ownNotifs} notification(s) — either the school's reply never reaches a school-less opener, or they can read somebody else's notices`,
    );

    // …and the answer is theirs to FINISH: marking read, clearing, and
    // housekeeping are all `userId`-scoped writes, silently skipped by a
    // tenant-only policy — which left the cross-school notice permanently
    // unread. Own rows only, both directions.
    const markedOwn = await asPerson("verify-other", (tx) =>
      outreachTx(tx).notification!.updateMany({
        where: { id: "verify-notif-own" },
        data: { readAt: new Date() },
      }),
    );
    const markedStranger = await asPerson("verify-other", (tx) =>
      outreachTx(tx).notification!.updateMany({
        where: { id: "verify-notif-stranger" },
        data: { readAt: new Date() },
      }),
    );
    check(
      "⚠ …and can mark it read — their own and nobody else's",
      markedOwn.count === 1 && markedStranger.count === 0,
      `marked ${markedOwn.count} of their own, ${markedStranger.count} of a stranger's — either the unread badge is permanent or read-state is forgeable`,
    );
    const clearedOwn = await asPerson("verify-other", (tx) =>
      outreachTx(tx).notification!.deleteMany({ where: { id: "verify-notif-own" } }),
    );
    const clearedStranger = await asPerson("verify-other", (tx) =>
      outreachTx(tx).notification!.deleteMany({ where: { id: "verify-notif-stranger" } }),
    );
    check(
      "⚠ …and clear it — their own and nobody else's",
      clearedOwn.count === 1 && clearedStranger.count === 0,
      `cleared ${clearedOwn.count} of their own, ${clearedStranger.count} of a stranger's — housekeeping can never retire the row, or can retire somebody else's`,
    );

    // Accepting an expert invitation: the token-holder consumes their OWN
    // live invite and nothing else — the write half the three-school
    // simulation found missing (P2025 mid-accept, stranded account).
    psql(
      DB,
      `INSERT INTO "ExpertInvite" (id,"schoolId","tokenHash","expiresAt") VALUES
         ('verify-xinv-live','verify-b','verify-xinv-hash-live', now() + interval '7 day'),
         ('verify-xinv-used','verify-b','verify-xinv-hash-used', now() + interval '7 day');
       UPDATE "ExpertInvite" SET "acceptedAt" = now() WHERE id = 'verify-xinv-used';`,
    );
    const asTokenHolder = async <T>(hash: string, work: (tx: TxLike) => Promise<T>): Promise<T> =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.join_code', $1, true)`, hash);
        return work(tx);
      });
    const accepted = await asTokenHolder("verify-xinv-hash-live", (tx) =>
      outreachTx(tx).expertInvite!.updateMany({
        where: { id: "verify-xinv-live" },
        data: { acceptedAt: new Date(), acceptedUserId: "verify-u" },
      }),
    );
    const wrongToken = await asTokenHolder("verify-xinv-hash-live", (tx) =>
      outreachTx(tx).expertInvite!.updateMany({
        where: { id: "verify-xinv-used" },
        data: { revokedAt: new Date() },
      }),
    );
    const reused = await asTokenHolder("verify-xinv-hash-live", (tx) =>
      outreachTx(tx).expertInvite!.updateMany({
        where: { id: "verify-xinv-live" },
        data: { acceptedUserId: "verify-other" },
      }),
    );
    check(
      "⚠ an expert invitation can be ACCEPTED by its token-holder — once, and only itself",
      accepted.count === 1 && wrongToken.count === 0 && reused.count === 0,
      `accepted ${accepted.count} (want 1), touched another invite ${wrongToken.count} (want 0), rewrote a consumed one ${reused.count} (want 0)`,
    );

    // ---- expert-registration (15 Oct 2026) ----
    // THE OPERATOR'S INVITATION FROM AN APPROVED APPLICATION: the superuser writes and reads back an
    // ExpertInvite naming NO school, and nothing more — not without the flag, not a school's invitation,
    // not a school's rows read, not a delete. The unit suite runs as the owner and cannot see this.
    const asOperatorNowhere = async <T>(superuser: boolean, work: (tx: TxLike) => Promise<T>): Promise<T> =>
      client.$transaction(async (tx: TxLike) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', 'verify-u', true)`);
        if (superuser) await tx.$executeRawUnsafe(`SELECT set_config('app.is_superuser', '1', true)`);
        return work(tx);
      });
    const operatorInvite = (id: string, schoolId: string | null) => ({ data: { id, schoolId, tokenHash: `verify-oinv-${id}`, email: "verify-applicant@test.invalid", expiresAt: new Date(Date.now() + 86_400_000) } });
    const madeByOperator = await asOperatorNowhere(true, (tx) => outreachTx(tx).expertInvite!.create(operatorInvite("verify-oinv-1", null)).then(() => true, () => false));
    const madeWithoutFlag = await asOperatorNowhere(false, (tx) => outreachTx(tx).expertInvite!.create(operatorInvite("verify-oinv-2", null)).then(() => true, () => false));
    const madeForSchool = await asOperatorNowhere(true, (tx) => outreachTx(tx).expertInvite!.create(operatorInvite("verify-oinv-3", "verify-b")).then(() => true, () => false));
    const operatorSees = await asOperatorNowhere(true, (tx) => outreachTx(tx).expertInvite!.count({ where: { id: { in: ["verify-oinv-1", "verify-xinv-live"] } } }));
    const operatorDeletes = await asOperatorNowhere(true, (tx) => outreachTx(tx).expertInvite!.deleteMany({ where: { id: "verify-oinv-1" } }));
    check(
      "⚠ the operator writes and reads back an expert invitation naming no school — and no school's, not without the flag, never a delete",
      madeByOperator && !madeWithoutFlag && !madeForSchool && operatorSees === 1 && operatorDeletes.count === 0,
      `made one with the flag ${madeByOperator} (want true), without ${madeWithoutFlag} (want false), for a school ${madeForSchool} (want false); saw ${operatorSees} (want 1: its own, not school B's); deleted ${operatorDeletes.count} (want 0)`,
    );
    // ---- end expert-registration ----

    // website-builder B (15 Oct 2026)
    // A SCHOOL'S OWN WEBSITE DOMAIN: readable by anyone once LIVE (the public site route finds the school for a host
    // with no session), never while it is still being set up; another school reads the LIVE one and writes neither;
    // the operator reads both. The unit suite runs as the owner and cannot see this.
    psql(
      DB,
      `INSERT INTO "SchoolSiteDomain" ("id","schoolId","domain","status","certStatus","createdByUserId") VALUES
         ('verify-dom-live','verify-a','www.verify-a.test','LIVE','ISSUED','verify-u'),
         ('verify-dom-pending','verify-a','www.verify-a-next.test','PENDING_DNS','NONE','verify-u');`,
    );
    type DomainTx = { schoolSiteDomain: { findMany(a: unknown): Promise<{ id: string }[]>; updateMany(a: unknown): Promise<{ count: number }> } };
    const domainIds = (rows: { id: string }[]) => rows.map((r) => r.id).sort().join(",");
    const domainsNobody = await (client as unknown as DomainTx).schoolSiteDomain.findMany({ select: { id: true } });
    const domainsAsB = await withTenantOn(client, "verify-b", (tx) => (tx as unknown as DomainTx).schoolSiteDomain.findMany({ select: { id: true } }));
    const domainsAsA = await withTenantOn(client, "verify-a", (tx) => (tx as unknown as DomainTx).schoolSiteDomain.findMany({ select: { id: true } }));
    const domainForgedByB = await withTenantOn(client, "verify-b", (tx) => (tx as unknown as DomainTx).schoolSiteDomain.updateMany({ where: { id: "verify-dom-live" }, data: { status: "FAILED" } }));
    const domainsOperator = await asOperatorNowhere(true, (tx) => (tx as unknown as DomainTx).schoolSiteDomain.findMany({ select: { id: true } }));
    check(
      "⚠ a school's own website domain is readable by anyone once LIVE, never while it is being set up; another school writes none; the operator reads both",
      domainIds(domainsNobody) === "verify-dom-live" && domainIds(domainsAsB) === "verify-dom-live" && domainIds(domainsAsA) === "verify-dom-live,verify-dom-pending" && domainForgedByB.count === 0 && domainIds(domainsOperator) === "verify-dom-live,verify-dom-pending",
      `no tenant saw [${domainIds(domainsNobody)}] (want the LIVE one), school B [${domainIds(domainsAsB)}] (want the LIVE one), school A [${domainIds(domainsAsA)}] (want both), B rewrote ${domainForgedByB.count} (want 0), the operator saw [${domainIds(domainsOperator)}] (want both)`,
    );
    // end website-builder B
    // website-two (16 Oct 2026)
    // The dates are written at UTC, as Prisma writes them, and the open one lasts an hour: a policy reading now() in
    // the session's zone would hide it (16 Oct 2026).
    // A LINK TO REVIEW A WEBSITE'S DRAFT: an open one (neither revoked nor expired) is readable by anyone, because the
    // review route has no session and finds the school by the token's hash; a revoked or expired one stays the
    // school's own; another school writes none.
    psql(
      DB,
      `INSERT INTO "SchoolSiteShare" ("id","schoolId","tokenHash","createdByUserId","expiresAt","revokedAt") VALUES
         ('verify-share-open','verify-a','verify-hash-open','verify-u', (now() AT TIME ZONE 'utc') + interval '1 hour', NULL),
         ('verify-share-revoked','verify-a','verify-hash-revoked','verify-u', (now() AT TIME ZONE 'utc') + interval '7 days', now()),
         ('verify-share-expired','verify-a','verify-hash-expired','verify-u', (now() AT TIME ZONE 'utc') - interval '1 hour', NULL);`,
    );
    type ShareTx = { schoolSiteShare: { findMany(a: unknown): Promise<{ id: string }[]>; updateMany(a: unknown): Promise<{ count: number }> } };
    const shareIds = (rows: { id: string }[]) => rows.map((r) => r.id).filter((id) => id.startsWith("verify-share-")).sort().join(",");
    const sharesNobody = await (client as unknown as ShareTx).schoolSiteShare.findMany({ select: { id: true } });
    const sharesAsA = await withTenantOn(client, "verify-a", (tx) => (tx as unknown as ShareTx).schoolSiteShare.findMany({ select: { id: true } }));
    const shareForgedByB = await withTenantOn(client, "verify-b", (tx) => (tx as unknown as ShareTx).schoolSiteShare.updateMany({ where: { id: "verify-share-open" }, data: { revokedAt: new Date() } }));
    check(
      "⚠ a website draft's review link is readable by anyone only while it is open; a revoked or expired one stays the school's; another school writes none",
      shareIds(sharesNobody) === "verify-share-open" && shareIds(sharesAsA) === "verify-share-expired,verify-share-open,verify-share-revoked" && shareForgedByB.count === 0,
      `no tenant saw [${shareIds(sharesNobody)}] (want the open one), school A [${shareIds(sharesAsA)}] (want all three), B rewrote ${shareForgedByB.count} (want 0)`,
    );
    // end website-two

    // AN EXPERT REACHES THEIR ENGAGEMENT AND NOTHING ELSE OF THE SCHOOL. One
    // confirmed booking used to put the whole school in their tenant set; the
    // set is now empty and every reach is a clause keyed on the booking or
    // the mentorship. Two experts at school A, so "their own" means something.
    psql(
      DB,
      `INSERT INTO "User" (id,name,prefs,"updatedAt") VALUES
         ('verify-x1','Expert One','{}',now()),
         ('verify-x2','Expert Two','{}',now()),
         ('verify-x3','Expert Three','{}',now());
       INSERT INTO "ExpertProfile" (id,"userId",headline,"updatedAt") VALUES
         ('verify-xp1','verify-x1','Robotics',now()),
         ('verify-xp2','verify-x2','Chess',now());
       INSERT INTO "ExpertSlot" (id,"expertProfileId","startsAt","endsAt","updatedAt") VALUES
         ('verify-xs1','verify-xp1', now() + interval '1 day', now() + interval '1 day 1 hour', now()),
         ('verify-xs2','verify-xp2', now() + interval '2 day', now() + interval '2 day 1 hour', now()),
         ('verify-xs3','verify-xp1', now() + interval '3 day', now() + interval '3 day 1 hour', now());
       INSERT INTO "ExpertBooking" (id,"schoolId","expertProfileId","expertUserId","slotId",topic,status,"bookedByMembershipId","updatedAt") VALUES
         ('verify-xb1','verify-a','verify-xp1','verify-x1','verify-xs1','Robots','CONFIRMED','verify-m-a',now()),
         ('verify-xb2','verify-a','verify-xp2','verify-x2','verify-xs2','Openings','CONFIRMED','verify-m-other',now()),
         ('verify-xb3','verify-b','verify-xp1','verify-x1','verify-xs3','Old talk','CANCELLED','verify-m-b',now());
       INSERT INTO "ExpertMessage" (id,"schoolId","bookingId","authorUserId",body) VALUES
         ('verify-xm1','verify-a','verify-xb1','verify-u','See you at ten'),
         ('verify-xm2','verify-a','verify-xb2','verify-other','Bring a board'),
         ('verify-xm3','verify-b','verify-xb3','verify-u','Sorry, cancelled');
       INSERT INTO "MentorThread" (id,"schoolId","expertProfileId","expertUserId","studentMembershipId",purpose,status,"updatedAt") VALUES
         ('verify-xt1','verify-b','verify-xp1','verify-x1','verify-m-pupil-b','Science fair','ACTIVE',now()),
         ('verify-xt2','verify-b','verify-xp2','verify-x2','verify-m-pupil-b','Chess club','PENDING_CONSENT',now());
       INSERT INTO "MentorMessage" (id,"schoolId","threadId","authorUserId",body) VALUES
         ('verify-xmm1','verify-b','verify-xt1','verify-pupil','Hello');
       INSERT INTO "GigSlot" (id,"providerUserId","providerKind",kind,title,"startsAt","endsAt","meetingUrl",seats,"seatsTaken","updatedAt") VALUES
         ('verify-gs1','verify-x1','EXPERT','ONE_TO_ONE','Robots, one to one', now() + interval '1 day', now() + interval '1 day 30 minutes','https://meet.example/x1',1,1,now()),
         ('verify-gs2','verify-x2','EXPERT','ONE_TO_ONE','Openings, one to one', now() + interval '2 day', now() + interval '2 day 30 minutes','https://meet.example/x2',1,1,now());
       INSERT INTO "GigBooking" (id,"schoolId","slotId","studentMembershipId","providerUserId",kind,"bookedByUserId",purpose,status,"updatedAt") VALUES
         ('verify-gb1','verify-b','verify-gs1','verify-m-b','verify-x1','ONE_TO_ONE','verify-u','Robots','CONFIRMED',now()),
         ('verify-gb2','verify-b','verify-gs2','verify-m-b','verify-x2','ONE_TO_ONE','verify-u','Openings','CONFIRMED',now());`,
    );
    type Counted = Record<string, { count: (a?: unknown) => Promise<number>; findMany: (a?: unknown) => Promise<{ id: string }[]> }>;
    const ids = async (tx: TxLike, model: string) => (await (tx as unknown as Counted)[model]!.findMany({ select: { id: true } })).map((r) => r.id).sort();
    const same = (got: string[], want: string[]) => JSON.stringify(got) === JSON.stringify(want);
    const expertOne = await asPerson("verify-x1", async (tx) => ({
      bookings: await ids(tx, "expertBooking"),
      bookingMessages: await ids(tx, "expertMessage"),
      threads: await ids(tx, "mentorThread"),
      mentorMessages: await ids(tx, "mentorMessage"),
      schools: (await ids(tx, "school")).filter((id) => id === "verify-a" || id === "verify-b"),
      members: await ids(tx, "membership"),
      posts: (await ids(tx, "post")).length,
      records: await (tx as unknown as Counted).schoolRecord!.count(),
      audit: await (tx as unknown as Counted).auditLog!.count(),
      notifications: await (tx as unknown as Counted).notification!.count(),
    }));
    check(
      "⚠ an expert reads their OWN bookings and mentorships, and the messages of the live ones only",
      same(expertOne.bookings, ["verify-xb1", "verify-xb3"]) && same(expertOne.bookingMessages, ["verify-xm1"]) && same(expertOne.threads, ["verify-xt1"]) && same(expertOne.mentorMessages, ["verify-xmm1"]),
      `bookings ${JSON.stringify(expertOne.bookings)}, their messages ${JSON.stringify(expertOne.bookingMessages)} (want only verify-xm1: another expert's and a cancelled booking's stay shut), threads ${JSON.stringify(expertOne.threads)}, mentor messages ${JSON.stringify(expertOne.mentorMessages)}`,
    );
    check(
      "⚠ …the school of a live engagement, the one member of staff who booked them and the one pupil they mentor",
      same(expertOne.schools, ["verify-a", "verify-b"]) && same(expertOne.members, ["verify-m-a", "verify-m-pupil-b"]),
      `schools ${JSON.stringify(expertOne.schools)}, memberships ${JSON.stringify(expertOne.members)} (want the booker verify-m-a and the pupil verify-m-pupil-b, and nobody else at either school)`,
    );
    // A seat in a session (gigs, decision 0004) is the pupil's school's row. Its provider reads their own by their
    // own user id and nothing through it: verify-m-b, the pupil of verify-gb1, is not among the members above, and
    // the expert's own binding writes nothing to the row (the server writes under the school's binding instead).
    const seats = await asPerson("verify-x1", async (tx) => ({
      own: await ids(tx, "gigBooking"),
      changed: await (tx as unknown as Record<string, { updateMany: (a: unknown) => Promise<{ count: number }> }>).gigBooking!.updateMany({ where: { id: { in: ["verify-gb1", "verify-gb2"] } }, data: { status: "DELIVERED" } }).then((r) => r.count, () => 0),
    }));
    check(
      "⚠ an expert reads their OWN seats in sessions and no other provider's, writes none of them, and the seat opens nothing of the school",
      same(seats.own, ["verify-gb1"]) && seats.changed === 0 && !expertOne.members.includes("verify-m-b"),
      `seats ${JSON.stringify(seats.own)} (want only verify-gb1), rows changed ${seats.changed} (want 0), members ${JSON.stringify(expertOne.members)} (must not hold verify-m-b)`,
    );
    // Posts the whole platform may read (an approved GLOBAL one) are not the school's private rows; count only what is not global.
    const privatePosts = await asPerson("verify-x1", (tx) => (tx as unknown as Counted).post!.count({ where: { NOT: { scope: "GLOBAL" } } }));
    check(
      "⚠ …and NOTHING else of the school: no post of its own, no leaving certificate, no audit line, nobody's notifications",
      privatePosts === 0 && expertOne.records === 0 && expertOne.audit === 0 && expertOne.notifications === 0,
      `an expert with a confirmed booking read ${privatePosts} of the school's own post(s), ${expertOne.records} certificate(s), ${expertOne.audit} audit line(s), ${expertOne.notifications} notification(s) — one booking opens the school`,
    );
    const pendingExpert = await asPerson("verify-x2", async (tx) => ({
      mentorMessages: await ids(tx, "mentorMessage"),
      schools: (await ids(tx, "school")).filter((id) => id === "verify-b"),
      members: await ids(tx, "membership"),
    }));
    check(
      "⚠ a mentorship no guardian has agreed to opens nothing: not the school, not the pupil",
      pendingExpert.mentorMessages.length === 0 && !pendingExpert.members.includes("verify-m-pupil-b"),
      `before consent the expert read memberships ${JSON.stringify(pendingExpert.members)}, messages ${JSON.stringify(pendingExpert.mentorMessages)}`,
    );

    const wrote = async (userId: string, model: string, data: Record<string, unknown>): Promise<boolean> => {
      try {
        await asPerson(userId, (tx) => outreachTx(tx)[model]!.create({ data }));
        return true;
      } catch {
        return false;
      }
    };
    const ownMessage = await wrote("verify-x1", "expertMessage", { id: "verify-xw1", schoolId: "verify-a", bookingId: "verify-xb1", authorUserId: "verify-x1", body: "On my way" });
    const intoAnothers = await wrote("verify-x1", "expertMessage", { id: "verify-xw2", schoolId: "verify-a", bookingId: "verify-xb2", authorUserId: "verify-x1", body: "Hello" });
    const intoCancelled = await wrote("verify-x1", "expertMessage", { id: "verify-xw3", schoolId: "verify-b", bookingId: "verify-xb3", authorUserId: "verify-x1", body: "Hello" });
    const asSomebodyElse = await wrote("verify-x1", "expertMessage", { id: "verify-xw4", schoolId: "verify-a", bookingId: "verify-xb1", authorUserId: "verify-u", body: "Forged" });
    const underWrongSchool = await wrote("verify-x1", "expertMessage", { id: "verify-xw5", schoolId: "verify-b", bookingId: "verify-xb1", authorUserId: "verify-x1", body: "Misfiled" });
    const toPupil = await wrote("verify-x1", "mentorMessage", { id: "verify-xw6", schoolId: "verify-b", threadId: "verify-xt1", authorUserId: "verify-x1", body: "Well done" });
    const beforeConsent = await wrote("verify-x2", "mentorMessage", { id: "verify-xw7", schoolId: "verify-b", threadId: "verify-xt2", authorUserId: "verify-x2", body: "Hello" });
    const aPost = await wrote("verify-x1", "post", { id: "verify-xw8", schoolId: "verify-a", authorUserId: "verify-x1", scope: "SCHOOL", title: "From outside", status: "APPROVED", tags: "[]", media: "[]" });
    check(
      "⚠ an expert writes in their own live engagement, signed by them, filed under its school — and nowhere else",
      ownMessage && toPupil && !intoAnothers && !intoCancelled && !asSomebodyElse && !underWrongSchool && !beforeConsent && !aPost,
      `own message ${ownMessage} and to their pupil ${toPupil} (want true); another expert's booking ${intoAnothers}, a cancelled one ${intoCancelled}, signed as somebody else ${asSomebodyElse}, filed under another school ${underWrongSchool}, before consent ${beforeConsent}, a post on the school's bulletin ${aPost} (want false)`,
    );
    const cancelled = await asPerson("verify-x1", (tx) => outreachTx(tx).expertBooking!.updateMany({ where: { id: "verify-xb1" }, data: { status: "CANCELLED" } }));
    const anothers = await asPerson("verify-x1", (tx) => outreachTx(tx).expertBooking!.updateMany({ where: { id: "verify-xb2" }, data: { status: "CANCELLED" } }));
    const givenAway = await asPerson("verify-x1", (tx) => outreachTx(tx).expertBooking!.updateMany({ where: { id: "verify-xb1" }, data: { expertUserId: "verify-x2" } })).then(
      (r) => r.count,
      () => 0,
    );
    const afterCancel = await asPerson("verify-x1", async (tx) => ({
      messages: await ids(tx, "expertMessage"),
      schoolA: (await ids(tx, "school")).includes("verify-a"),
      booker: (await ids(tx, "membership")).includes("verify-m-a"),
    }));
    check(
      "⚠ an expert cancels their own booking, not another's, cannot give it away — and the school shuts behind them",
      cancelled.count === 1 && anothers.count === 0 && givenAway === 0 && afterCancel.messages.length === 0 && !afterCancel.schoolA && !afterCancel.booker,
      `cancelled own ${cancelled.count} (want 1), another's ${anothers.count} (want 0), gave it to somebody else ${givenAway} (want 0); after cancelling still read messages ${JSON.stringify(afterCancel.messages)}, the school ${afterCancel.schoolA}, the booker ${afterCancel.booker}`,
    );
    // Telling the school and the line in its log are NOT the expert's to
    // write: the server writes both under the school's binding, after the
    // library has found the engagement to be theirs (asTheSchool).
    const told = await wrote("verify-x1", "notification", { id: "verify-xn1", schoolId: "verify-a", userId: "verify-u", kind: "EXPERT", title: "Cancelled", body: "" });
    const logged = await wrote("verify-x1", "auditLog", { id: "verify-xa1", schoolId: "verify-a", actorUserId: "verify-x1", action: "expert.cancel", meta: "{}" });
    const boundTold = await withTenantOn(client, "verify-a", (tx: TxLike) =>
      outreachTx(tx).notification!.create({ data: { id: "verify-xn2", schoolId: "verify-a", userId: "verify-u", kind: "EXPERT", title: "Cancelled", body: "" } }).then(
        () => true,
        () => false,
      ),
    );
    check(
      "⚠ an expert's own session writes the school no notice and no audit line; the school's binding does",
      !told && !logged && boundTold,
      `with only the expert bound: notification ${told}, audit line ${logged} (want false); under the school's binding ${boundTold} (want true)`,
    );

    // SOMEBODY WAITING FOR A YES READS THEIR OWN REQUEST AND NOTHING OF THE
    // SCHOOL. A code used to make a membership; it now makes a JoinRequest,
    // and a student code and a birthday a GuardianClaim. Neither is a row any
    // policy counts as belonging, and neither is the asker's to write.
    psql(
      DB,
      `INSERT INTO "JoinRequest" (id,"schoolId","userId","classId",via,status) VALUES
         ('verify-jr1','verify-a','verify-x3','verify-class-a','CLASS','PENDING'),
         ('verify-jr2','verify-a','verify-x2',NULL,'SCHOOL','PENDING');
       INSERT INTO "GuardianClaim" (id,"schoolId","studentMembershipId","claimantUserId",relation,status) VALUES
         ('verify-gc1','verify-a','verify-m-pupil-a','verify-x3','PARENT','PENDING'),
         ('verify-gc2','verify-a','verify-m-other','verify-x2','PARENT','PENDING');`,
    );
    const asker = await asPerson("verify-x3", async (tx) => ({
      joins: await ids(tx, "joinRequest"),
      claims: await ids(tx, "guardianClaim"),
      schoolA: (await ids(tx, "school")).includes("verify-a"),
      members: (await ids(tx, "membership")).filter((id) => ["verify-m-a", "verify-m-other", "verify-m-pupil-a"].includes(id)),
      classes: (await ids(tx, "class")).length,
      guardianships: await outreachTx(tx).guardianship!.count({ where: { studentMembershipId: "verify-m-pupil-a" } }),
    }));
    check(
      "⚠ somebody waiting reads their own request and their own claim — and nothing of the school they asked",
      same(asker.joins, ["verify-jr1"]) && same(asker.claims, ["verify-gc1"]) && !asker.schoolA && asker.members.length === 0 && asker.classes === 0,
      `joins ${JSON.stringify(asker.joins)}, claims ${JSON.stringify(asker.claims)} (want their own one of each); read the school ${asker.schoolA}, its members ${JSON.stringify(asker.members)}, ${asker.classes} class(es)`,
    );
    const guardianSees = await asPerson("verify-parent", async (tx) => ({ claims: await ids(tx, "guardianClaim"), joins: await ids(tx, "joinRequest") }));
    check(
      "⚠ a guardian reads the claims on their OWN child, not another child's, and no join",
      same(guardianSees.claims, ["verify-gc1"]) && guardianSees.joins.length === 0,
      `claims ${JSON.stringify(guardianSees.claims)} (want only verify-gc1), joins ${JSON.stringify(guardianSees.joins)}`,
    );
    const selfAsked = await wrote("verify-x3", "joinRequest", { id: "verify-jr3", schoolId: "verify-b", userId: "verify-x3", via: "SCHOOL" });
    const selfClaimed = await wrote("verify-x3", "guardianClaim", { id: "verify-gc3", schoolId: "verify-b", studentMembershipId: "verify-m-pupil-b", claimantUserId: "verify-x3" });
    const selfApproved = await asPerson("verify-x3", (tx) => outreachTx(tx).joinRequest!.updateMany({ where: { id: "verify-jr1" }, data: { status: "APPROVED" } })).then((r) => r.count, () => 0);
    const selfLinked = await asPerson("verify-x3", (tx) => outreachTx(tx).guardianClaim!.updateMany({ where: { id: "verify-gc1" }, data: { status: "APPROVED" } })).then((r) => r.count, () => 0);
    const guardianApproved = await asPerson("verify-parent", (tx) => outreachTx(tx).guardianClaim!.updateMany({ where: { id: "verify-gc1" }, data: { status: "APPROVED" } })).then((r) => r.count, () => 0);
    const selfEnrolled = await wrote("verify-x3", "membership", { id: "verify-m-x3", userId: "verify-x3", schoolId: "verify-a", role: "STUDENT", status: "ACTIVE" });
    check(
      "⚠ nobody files or decides a request from their own session: the asker cannot approve theirs, nor make the membership it asks for",
      !selfAsked && !selfClaimed && selfApproved === 0 && selfLinked === 0 && guardianApproved === 0 && !selfEnrolled,
      `with only the person bound: filed a join ${selfAsked}, filed a claim ${selfClaimed}, approved own join ${selfApproved}, approved own claim ${selfLinked}, a guardian approved from their own session ${guardianApproved}, made own membership ${selfEnrolled} (want false and 0 throughout)`,
    );
    const hereQueue = await withTenantOn(client, "verify-a", async (tx: TxLike) => ({ joins: await ids(tx, "joinRequest"), claims: await ids(tx, "guardianClaim") }));
    const thereQueue = await withTenantOn(client, "verify-b", async (tx: TxLike) => ({ joins: await ids(tx, "joinRequest"), claims: await ids(tx, "guardianClaim") }));
    const decidedHere = await withTenantOn(client, "verify-a", (tx: TxLike) => outreachTx(tx).joinRequest!.updateMany({ where: { id: "verify-jr1" }, data: { status: "DECLINED" } }));
    const decidedThere = await withTenantOn(client, "verify-b", (tx: TxLike) => outreachTx(tx).joinRequest!.updateMany({ where: { id: "verify-jr2" }, data: { status: "APPROVED" } }));
    check(
      "⚠ the queue is the school's: it reads and decides its own requests, and another school finds none",
      same(hereQueue.joins, ["verify-jr1", "verify-jr2"]) && same(hereQueue.claims, ["verify-gc1", "verify-gc2"]) && thereQueue.joins.length === 0 && thereQueue.claims.length === 0 && decidedHere.count === 1 && decidedThere.count === 0,
      `school A read joins ${JSON.stringify(hereQueue.joins)} and claims ${JSON.stringify(hereQueue.claims)}, decided ${decidedHere.count} (want 1); school B read ${JSON.stringify(thereQueue.joins)} and ${JSON.stringify(thereQueue.claims)}, decided ${decidedThere.count} of A's (want 0)`,
    );

    // A FAMILY'S ASK TO CHANGE THE PUPIL RECORD IS THE SCHOOL'S ROW. The
    // family files it and takes it back through the server, under the
    // school's binding, after the library has found them to be the pupil or
    // a guardian; from their own session they read none and write none, and
    // another school finds none to decide.
    psql(
      DB,
      `INSERT INTO "RecordChangeRequest" (id,"schoolId","studentMembershipId","requestedByUserId","changesJson",reason,status,"updatedAt") VALUES
         ('verify-rc1','verify-a','verify-m-pupil-a','verify-parent','[{"field":"city","from":null,"to":"Pune"}]','verify','PENDING',now());`,
    );
    const askHere = await withTenantOn(client, "verify-a", (tx: TxLike) => ids(tx, "recordChangeRequest"));
    const askThere = await withTenantOn(client, "verify-b", (tx: TxLike) => ids(tx, "recordChangeRequest"));
    const askOwn = await asPerson("verify-parent", (tx) => ids(tx, "recordChangeRequest")).catch(() => [] as string[]);
    const askSelfApplied = await asPerson("verify-parent", (tx) => outreachTx(tx).recordChangeRequest!.updateMany({ where: { id: "verify-rc1" }, data: { status: "APPLIED" } })).then((r) => r.count, () => 0);
    const askSelfFiled = await wrote("verify-parent", "recordChangeRequest", { id: "verify-rc2", schoolId: "verify-a", studentMembershipId: "verify-m-pupil-a", requestedByUserId: "verify-parent", changesJson: "[]", reason: "verify" });
    const askDecidedThere = await withTenantOn(client, "verify-b", (tx: TxLike) => outreachTx(tx).recordChangeRequest!.updateMany({ where: { id: "verify-rc1" }, data: { status: "APPLIED" } }));
    const askDecidedHere = await withTenantOn(client, "verify-a", (tx: TxLike) => outreachTx(tx).recordChangeRequest!.updateMany({ where: { id: "verify-rc1" }, data: { status: "DECLINED" } }));
    check(
      "⚠ an ask to change a pupil's record is the school's: it reads and decides its own, another school finds none, and the family's own session neither files nor applies one",
      same(askHere, ["verify-rc1"]) && askThere.length === 0 && askOwn.length === 0 && askSelfApplied === 0 && !askSelfFiled && askDecidedThere.count === 0 && askDecidedHere.count === 1,
      `school A read ${JSON.stringify(askHere)} and decided ${askDecidedHere.count} (want the one, and 1); school B read ${JSON.stringify(askThere)} and decided ${askDecidedThere.count} (want none, and 0); the guardian's own session read ${JSON.stringify(askOwn)}, applied ${askSelfApplied}, filed ${askSelfFiled} (want none, 0, false)`,
    );

    // A SIGNATURE AND THE PAPER'S COPY OF IT ARE THE SCHOOL'S ROWS. Nobody's
    // own session reads a picture or signs a paper; the server does both
    // under the school's binding, after the library has found the signer to
    // hold the role the line names.
    psql(
      DB,
      `INSERT INTO "SignatureImage" (id,"schoolId",kind,png,"updatedAt") VALUES ('verify-sig1','verify-a','SEAL',decode('89504e47','hex'),now());
       INSERT INTO "PaperSignature" (id,"schoolId","paperKind","paperId",slot,role,status,"updatedAt") VALUES ('verify-ps1','verify-a','CERTIFICATE','verify-paper','RIGHT','PRINCIPAL','PENDING',now());`,
    );
    const inkHere = await withTenantOn(client, "verify-a", async (tx: TxLike) => ({ images: await ids(tx, "signatureImage"), papers: await ids(tx, "paperSignature") }));
    const inkThere = await withTenantOn(client, "verify-b", async (tx: TxLike) => ({ images: await ids(tx, "signatureImage"), papers: await ids(tx, "paperSignature") }));
    const inkOwn = await asPerson("verify-parent", async (tx) => ({ images: await ids(tx, "signatureImage"), papers: await ids(tx, "paperSignature") })).catch(() => ({ images: [] as string[], papers: [] as string[] }));
    const inkSelfSigned = await asPerson("verify-parent", (tx) => outreachTx(tx).paperSignature!.updateMany({ where: { id: "verify-ps1" }, data: { status: "SIGNED" } })).then((r) => r.count, () => 0);
    const inkSignedThere = await withTenantOn(client, "verify-b", (tx: TxLike) => outreachTx(tx).paperSignature!.updateMany({ where: { id: "verify-ps1" }, data: { status: "SIGNED" } }));
    check(
      "⚠ a signature, the seal and a paper's copy of them are the school's: another school reads and signs none, and nobody's own session reads a picture or signs a paper",
      same(inkHere.images, ["verify-sig1"]) && same(inkHere.papers, ["verify-ps1"]) && inkThere.images.length === 0 && inkThere.papers.length === 0 && inkOwn.images.length === 0 && inkOwn.papers.length === 0 && inkSelfSigned === 0 && inkSignedThere.count === 0,
      `school A read ${JSON.stringify(inkHere)} (want the one of each); school B read ${JSON.stringify(inkThere)} and signed ${inkSignedThere.count} (want none, and 0); a person's own session read ${JSON.stringify(inkOwn)} and signed ${inkSelfSigned} (want none, and 0)`,
    );

    // Closure closes the DATABASE's door, not a page's: once the school
    // closes the thread, the opener's reply is refused by the policy itself.
    psql(DB, `UPDATE "Enquiry" SET status = 'CLOSED' WHERE id = 'verify-enq'`);
    let wroteAfterClose = 0;
    try {
      await asPerson("verify-other", (tx) =>
        outreachTx(tx).enquiryMessage!.create({
          data: {
            id: "verify-msg-late",
            schoolId: "verify-b",
            enquiryId: "verify-enq",
            authorUserId: "verify-other",
            body: "one more thing",
          },
        }),
      );
      wroteAfterClose = 1;
    } catch {
      wroteAfterClose = 0;
    }
    check(
      "⚠ a CLOSED enquiry takes no more words from outside, in the database itself",
      wroteAfterClose === 0,
      "the opener wrote onto a closed enquiry — closure is a page decoration, not a policy",
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
