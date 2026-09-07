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
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

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
