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

function psql(database: string, sql: string): string {
  return execFileSync("psql", ["-d", database, "-v", "ON_ERROR_STOP=1", "-tAc", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
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
    .replace('provider = "sqlite"', 'provider = "postgresql"')
    .replace("generator client {", 'generator client {\n  output   = "../.pg-client"');
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
     INSERT INTO "User" (id,name,prefs,"updatedAt") VALUES ('verify-u','U','{}',now());
     INSERT INTO "Post" (id,"schoolId","authorUserId",scope,title,status,tags,media,"updatedAt") VALUES
       ('verify-post-a','verify-a','verify-u','SCHOOL','A post','APPROVED','[]','[]',now()),
       ('verify-post-b','verify-b','verify-u','SCHOOL','B post','APPROVED','[]','[]',now());`,
  );

  process.stdout.write(`\nVerifying the application half against ${DB}\n\n`);

  // ---- through Prisma, as the unprivileged role ---------------------------
  process.env.DATABASE_URL = APP_URL;
  const { PrismaClient } = await import(`${PG_CLIENT}/index.js`);
  const client = new PrismaClient({ datasources: { db: { url: APP_URL } } });

  try {
    // 1. No tenant set: RLS returns nothing rather than everything.
    const blind = await client.post.count();
    check(
      "a query with no tenant set sees nothing",
      blind === 0,
      `saw ${blind} post(s) — the policies are not failing closed`,
    );

    // 2. Inside withTenant, the tenant's own rows and only those.
    // Through the REAL helper, not a copy of it — that is the point of
    // tenant-tx.ts taking its client as an argument.
    const asA: { id: string }[] = await withTenantOn(client, "verify-a", (tx) =>
      (tx as { post: { findMany: (a: unknown) => Promise<{ id: string }[]> } }).post.findMany({
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
    const after = await client.post.count();
    check(
      "the next query does NOT inherit the previous tenant",
      after === 0,
      `saw ${after} post(s) — SET LOCAL leaked past its transaction, and one ` +
        "request is reading another school's rows",
    );

    // 4. And the other tenant, so this is isolation and not a blanket denial.
    const asB: { id: string }[] = await withTenantOn(client, "verify-b", (tx) =>
      (tx as { post: { findMany: (a: unknown) => Promise<{ id: string }[]> } }).post.findMany({
        select: { id: true },
      }),
    );
    check(
      "acting for B sees exactly B's row",
      asB.length === 1 && asB[0]?.id === "verify-post-b",
      `saw ${JSON.stringify(asB.map((p) => p.id))}`,
    );

    // 5. The mistake this design exists to prevent, demonstrated rather than
    //    described: a plain SET, outside a transaction, on a pooled connection.
    await client.$executeRawUnsafe(`SET app.school_id = 'verify-a'`);
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
