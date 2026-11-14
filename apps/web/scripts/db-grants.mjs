/**
 * Restores what `prisma db push --force-reset` destroys, and then PROVES it.
 *
 *   node scripts/db-grants.mjs
 *
 * WHY THIS EXISTS. `--force-reset` drops and recreates the `public` SCHEMA, not
 * just the tables in it. That takes three things with it, none of which Prisma
 * puts back because Prisma never knew about them:
 *
 *   - the schema-level USAGE grant to the app role,
 *   - the default privileges that grant it rights on tables created later,
 *   - every row-level security policy in prisma/rls.sql.
 *
 * The app then gets `42501 permission denied for schema public` on every query,
 * which surfaces as a 500 on every page. This was a documented four-command
 * manual recovery for weeks; it is now part of the reset.
 *
 * THE VERIFY AT THE END IS THE POINT, and it is why this is a script rather
 * than three more lines in a package.json chain. `npm run rls:verify` passes
 * against a database in exactly this broken state — a role that cannot open the
 * schema also cannot cross a tenant boundary, so every isolation check comes
 * back green while nothing works at all. The only honest check is to connect AS
 * the app role and read a row. That is what happens below, and a failure here
 * exits non-zero rather than leaving somebody to discover it through a blank
 * page an hour later.
 *
 * Uses psql because the connection has to be made as a DIFFERENT role than the
 * one Prisma is configured for, which the Prisma client cannot do.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { libpqUrl } from "./pg-url.mjs";
import { parseRoleFlags, releaseRoleProblems, ROLE_FLAGS_SQL } from "./db-role-check.mjs";

function readEnvFile() {
  const out = {};
  if (!existsSync(".env")) return out;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...readEnvFile(), ...process.env };
// psql refuses Prisma's pool settings (`?connection_limit=30…`, deploy.md's
// capacity advice) with "invalid URI query parameter"; both URLs lose them here.
const appUrl = libpqUrl(env.DATABASE_URL);
const adminUrl = libpqUrl(env.DATABASE_ADMIN_URL) ?? appUrl;

if (!appUrl) {
  console.error("DATABASE_URL is not set. Nothing to grant to.");
  process.exit(1);
}

// The role and database are DERIVED, never hard-coded: a checked-in role name
// would silently grant nothing on anybody's machine but the one it was written on.
let appRole;
let database;
try {
  const parsed = new URL(appUrl);
  appRole = decodeURIComponent(parsed.username);
  database = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
} catch {
  console.error(`DATABASE_URL is not a URL this can parse.`);
  process.exit(1);
}

if (!appRole || !database) {
  console.error("DATABASE_URL has no role or no database name.");
  process.exit(1);
}

// Same role for app and owner means a single-role dev setup. Granting a role to
// itself is a no-op, so say so rather than pretending the grants achieved
// something. (FORCE ROW LEVEL SECURITY holds an owner too, unless it is a
// superuser or BYPASSRLS: step 0 asks, TA-243.) Refused in production.
const ownerRole = (() => {
  try {
    return decodeURIComponent(new URL(adminUrl).username);
  } catch {
    return null;
  }
})();
const singleRole = ownerRole === appRole;

function psql(args, opts = {}) {
  return execFileSync("psql", ["-v", "ON_ERROR_STOP=1", ...args], {
    stdio: opts.quiet ? "pipe" : "inherit",
    encoding: "utf8",
    env: { ...process.env, ...(opts.env ?? {}) },
  });
}

/* ---- 0. the two roles row security depends on (TA-194, TA-243) ------------ */

// Asked before anything is applied: the app role must be held by the policies,
// and the owner (every data step of a migration, every job, the dump) must pass
// them. Either wrong stops the release here, naming the role and the flag.
{
  const flagsOf = (url) => {
    try {
      return parseRoleFlags(psql(["-d", url, "-tAc", ROLE_FLAGS_SQL], { quiet: true }));
    } catch (error) {
      console.error(`\n  ✗ Could not read the role's flags: ${String(error.stderr ?? error.message ?? error).trim().split("\n").slice(-1)[0]}\n`);
      process.exit(1);
    }
  };
  const app = flagsOf(appUrl);
  const owner = singleRole ? app : flagsOf(adminUrl);
  const problems = releaseRoleProblems({ app, owner, singleRole, production: env.NODE_ENV === "production" });
  if (problems.length) {
    for (const problem of problems) console.error(`\n  ✗ ${problem}`);
    console.error("");
    process.exit(1);
  }
}

/* ---- 1. the grants -------------------------------------------------------- */

if (singleRole) {
  console.log(`\n  Single-role setup (${appRole} owns the schema) — no grants needed.`);
} else {
  console.log(`\n  Granting ${appRole} access to schema public on ${database}…`);
  psql([
    "-d", adminUrl,
    "-c", `GRANT USAGE ON SCHEMA public TO "${appRole}";`,
    // Tables created AFTER this point inherit the rights. Without it, the next
    // `prisma db push` produces tables the app cannot touch.
    "-c", `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${appRole}";`,
    // ...and the ones that already exist, which default privileges do not reach.
    "-c", `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${appRole}";`,
    // THEN TAKE BACK WHAT THE APP MUST NEVER HOLD. The audit log is append-only
    // — the policies in rls.sql already permit it no UPDATE or DELETE (see
    // APPEND_ONLY in scripts/gen-rls.ts); this makes the refusal a privilege
    // error rather than a silent zero, and survives a policy being added back.
    // The retention sweep prunes it on the owner connection, not this role.
    "-c", `REVOKE UPDATE, DELETE ON "AuditLog" FROM "${appRole}";`,
    // The operator's visitor book: a written visit may be CLOSED and nothing
    // else. Column-level, so the app role can set "endedAt" and cannot touch
    // the reason, the start or the expiry. The generated trigger in rls.sql
    // says the same thing for every role but the owner.
    "-c", `REVOKE UPDATE ON "OperatorAccess" FROM "${appRole}";`,
    "-c", `GRANT UPDATE ("endedAt") ON "OperatorAccess" TO "${appRole}";`,
    // The assistant's content (the curriculum corpus and the platform help) is read by the app and
    // written by the owner only: corpus:ingest and help:index run on the owner connection. Guarded
    // so a database without the tables yet (an older checkout) still takes the rest.
    "-c", `DO $$ DECLARE t text; BEGIN
      FOREACH t IN ARRAY ARRAY['ContentDocument', 'ContentChunk', 'HelpEntry'] LOOP
        IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
          EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON %I FROM %I', t, '${appRole}');
        END IF;
      END LOOP;
    END $$;`,
  ], { quiet: true });
}

/* ---- 2. the policies ------------------------------------------------------ */

console.log("  Applying prisma/rls.sql…");
psql(["-d", adminUrl, "-f", "prisma/rls.sql"], { quiet: true });

/* ---- 3. the check that actually catches this ------------------------------ */

console.log(`  Checking that ${appRole} can open the schema…`);
let readable = false;
let failure = "";
try {
  // Connects AS the app role, with no tenant set. RLS will correctly return zero
  // rows — that is fine and expected. What is being tested is whether the query
  // is permitted AT ALL, which is precisely what a lost USAGE grant breaks and
  // what every other check in this repo is blind to.
  const out = psql(["-d", appUrl, "-tAc", 'SELECT count(*) FROM "School";'], { quiet: true });
  readable = /^\d+$/.test(out.trim());
} catch (error) {
  failure = String(error.stderr ?? error.message ?? error).trim();
}

if (!readable) {
  console.error(`\n  ✗ ${appRole} still cannot read through the schema.\n`);
  if (failure) console.error(`    ${failure.split("\n").slice(-3).join("\n    ")}\n`);
  console.error("    Every page would 500 with 42501. The grants above did not take.\n");
  process.exit(1);
}

// The other half of the proof, for the two tables that must be less than
// fully writable: the app role holding UPDATE or DELETE on the audit log, or
// UPDATE on any visitor-book column but "endedAt", is a grant that did not
// take — and, unlike a lost USAGE grant, one that no page would ever show.
if (!singleRole) {
  console.log(`  Checking that ${appRole} cannot rewrite the audit log or the visitor book…`);
  let held = "";
  try {
    held = psql(
      [
        "-d", appUrl, "-tAc",
        `SELECT has_table_privilege('"AuditLog"', 'UPDATE')
             OR has_table_privilege('"AuditLog"', 'DELETE')
             OR has_column_privilege('"OperatorAccess"', 'reason', 'UPDATE')
             OR has_column_privilege('"OperatorAccess"', 'startedAt', 'UPDATE')
             OR has_column_privilege('"OperatorAccess"', 'expiresAt', 'UPDATE')
             OR NOT has_column_privilege('"OperatorAccess"', 'endedAt', 'UPDATE');`,
      ],
      { quiet: true },
    ).trim();
  } catch (error) {
    held = String(error.stderr ?? error.message ?? error).trim();
  }
  if (held !== "f") {
    console.error(`\n  ✗ ${appRole} still holds a write it must not (${held}).\n`);
    console.error("    The audit log is not append-only, or a visit row can be rewritten.\n");
    process.exit(1);
  }
}

console.log(`\n  ✓ Grants and policies restored, and ${appRole} can read.\n`);
