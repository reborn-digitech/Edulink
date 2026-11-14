/**
 * Runs a command against the database as the OWNER instead of the app role.
 *
 *   node scripts/with-admin-db.mjs prisma db push
 *
 * Schema changes and seeding cannot go through the application's role. That role
 * is deliberately unprivileged and subject to row-level security, so its inserts
 * are checked against `app.school_ids` — which a seed has no way to set, because
 * it is creating the schools in the first place. Every INSERT was simply refused.
 *
 * That split is not a workaround, it is the shape of the thing: migrations and
 * seeds are operator work and run as the owner; the application runs as a role
 * that cannot see across tenants even by accident.
 *
 * DATABASE_ADMIN_URL is the owner connection. Falls back to DATABASE_URL so a
 * single-role setup still works, which is fine before rls.sql has been applied.
 */
import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { describeDatabase, fenceVerdict } from "./db-fence.mjs";
import { migrateRoleProblems, parseRoleFlags, ROLE_FLAGS_SQL } from "./db-role-check.mjs";
import { libpqUrl } from "./pg-url.mjs";

function readEnvFile() {
  try {
    const out = {};
    for (const line of readFileSync(".env", "utf8").split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const fileEnv = readEnvFile();
const adminUrl =
  process.env.DATABASE_ADMIN_URL ?? fileEnv.DATABASE_ADMIN_URL ?? fileEnv.DATABASE_URL;

if (!adminUrl) {
  process.stderr.write("No DATABASE_ADMIN_URL or DATABASE_URL found in the environment or .env\n");
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
if (!command) {
  process.stderr.write("Usage: node scripts/with-admin-db.mjs <command> [args...]\n");
  process.exit(1);
}

// THE FENCE (scripts/db-fence.mjs, 7 November 2026): no shadow database, no diff against migration folders, no
// reset outside npm run db:reset; and the database named before anything runs, so a wrong URL is seen first.
const verdict = fenceVerdict([command, ...args], { resetConsent: process.env.EDULINK_DB_RESET === "1" });
if (!verdict.ok) {
  process.stderr.write(`with-admin-db: refused — ${verdict.why}\n`);
  process.exit(2);
}
if (!process.env.EDULINK_DB_QUIET) process.stderr.write(`with-admin-db: ${describeDatabase(adminUrl)} ← ${[command, ...args].join(" ").slice(0, 120)}\n`);

// THE OWNER BEFORE ANY MIGRATION (TA-243): `prisma migrate deploy` runs before db:grants in db:release and db:migrate,
// so the owner's flags are asked here, before a data step can run over no school's rows and be recorded applied.
const roleProblems = migrateRoleProblems({
  argv: [command, ...args],
  adminUrl,
  appUrl: process.env.DATABASE_URL ?? fileEnv.DATABASE_URL,
  production: (process.env.NODE_ENV ?? fileEnv.NODE_ENV) === "production",
  readFlags: (url) => {
    try {
      return parseRoleFlags(execFileSync("psql", ["-v", "ON_ERROR_STOP=1", "-d", libpqUrl(url), "-tAc", ROLE_FLAGS_SQL], { stdio: "pipe", encoding: "utf8" }));
    } catch (error) {
      // psql's own last line only: the error's message repeats the command, whose URL holds the password.
      throw new Error(String(error?.stderr ?? "").trim().split("\n").slice(-1)[0] || "psql could not connect");
    }
  },
});
if (roleProblems.length) {
  for (const problem of roleProblems) process.stderr.write(`with-admin-db: refused — ${problem}\n`);
  process.exit(2);
}

// The ENVIRONMENT WINS over .env, the way dotenv itself works: a crontab line
// that says STORAGE_DIR=/mnt/files must mean it. The file fills gaps; it does
// not override what the operator set on the command line. (A battery found
// the spread the other way round, with a job sweeping the wrong disk.)
const child = spawn(command, args, {
  stdio: "inherit",
  env: { ...fileEnv, ...process.env, DATABASE_URL: adminUrl },
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 1));
