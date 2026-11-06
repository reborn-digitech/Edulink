/**
 * A DUMP BEFORE ANYTHING TOUCHES THE SCHEMA, AND ONE EVERY MORNING (7 November 2026).
 *
 *   npm run db:backup                 dump → apps/web/storage/backups, copied to the off-machine folder
 *   npm run db:backup -- --quiet      the same, one line
 *
 * ops/backup.sh takes the dump (custom format, listed back to prove it restores) into storage/backups, which git
 * ignores. The copy then goes to the OFF-MACHINE FOLDER, ~/Desktop/OffMachineCopy/edulink-backups by default
 * (EDULINK_OFFSITE_DIR to change it): the owner's Desktop is synced to iCloud Drive, so the copy leaves the
 * machine without any account or token in a script. Fourteen days are kept in both places (KEEP_DAYS).
 *
 * db:migrate, db:push and db:reset run this FIRST and stop if it fails: no migration without a dump that lists.
 * The dev database was lost on 6 November 2026 with no dump anywhere; this is the line that makes that impossible.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const quiet = process.argv.includes("--quiet");
const here = resolve(new URL(".", import.meta.url).pathname);
const webDir = resolve(here, "..");
const repoDir = resolve(webDir, "..", "..");

function readEnvFile() {
  try {
    const out = {};
    for (const line of readFileSync(join(webDir, ".env"), "utf8").split("\n")) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (match) out[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}

const fileEnv = readEnvFile();
const adminUrl = process.env.DATABASE_ADMIN_URL ?? fileEnv.DATABASE_ADMIN_URL ?? fileEnv.DATABASE_URL;
if (!adminUrl) {
  process.stderr.write("db:backup: no DATABASE_ADMIN_URL or DATABASE_URL in the environment or .env\n");
  process.exit(1);
}
const backupDir = resolve(webDir, process.env.BACKUP_DIR ?? "storage/backups");
const offsiteDir = process.env.EDULINK_OFFSITE_DIR ?? join(homedir(), "Desktop", "OffMachineCopy", "edulink-backups");
const keepDays = Number(process.env.KEEP_DAYS ?? 14);

const before = new Set(existsSync(backupDir) ? readdirSync(backupDir) : []);
const run = spawnSync("bash", [join(repoDir, "ops", "backup.sh")], {
  stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
  env: { ...fileEnv, ...process.env, DATABASE_ADMIN_URL: adminUrl, BACKUP_DIR: backupDir, KEEP_DAYS: String(keepDays), PATH: `/opt/homebrew/opt/postgresql@16/bin:/opt/homebrew/bin:${process.env.PATH ?? ""}` },
});
if (run.status !== 0) {
  process.stderr.write(`db:backup: the dump FAILED (exit ${run.status}); nothing continues without a dump that lists\n${quiet ? String(run.stderr ?? "") : ""}`);
  process.exit(run.status ?? 1);
}
const fresh = readdirSync(backupDir).filter((f) => f.endsWith(".dump") && !before.has(f));
if (fresh.length !== 1) {
  process.stderr.write(`db:backup: expected one new dump in ${backupDir}, found ${fresh.length}\n`);
  process.exit(1);
}
const dump = fresh[0];
mkdirSync(offsiteDir, { recursive: true });
copyFileSync(join(backupDir, dump), join(offsiteDir, dump));
const copied = statSync(join(offsiteDir, dump)).size;
if (copied !== statSync(join(backupDir, dump)).size) {
  process.stderr.write(`db:backup: the off-machine copy of ${dump} is ${copied} bytes, not the dump's size\n`);
  process.exit(1);
}
let pruned = 0;
const cutoff = Date.now() - keepDays * 86_400_000;
for (const f of readdirSync(offsiteDir)) {
  if (/^edulink-.*\.dump$/.test(f) && statSync(join(offsiteDir, f)).mtimeMs < cutoff) {
    unlinkSync(join(offsiteDir, f));
    pruned++;
  }
}
const mb = (copied / 1024 / 1024).toFixed(1);
process.stdout.write(`db:backup: ${dump} (${mb} MB) in ${backupDir} and copied to ${offsiteDir}${pruned ? `; ${pruned} older than ${keepDays} days pruned there` : ""}\n`);
