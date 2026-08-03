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
const appUrl = env.DATABASE_URL;
const adminUrl = env.DATABASE_ADMIN_URL ?? appUrl;

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
// itself is a no-op, and RLS would not apply to an owner anyway, so say so
// rather than pretending the grants achieved something.
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

console.log(`\n  ✓ Grants and policies restored, and ${appRole} can read.\n`);
