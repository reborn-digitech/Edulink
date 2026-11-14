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
 *
 * THE DEV MACHINE'S DATABASE ONLY (TA-254). The go-live runbook once ran db:migrate with the production URLs from a
 * laptop, and this dumped production into storage/backups and the iCloud-synced Desktop. So before ops/backup.sh is
 * spawned the server is asked where it answered and which database it is (scripts/local-db-guard.mjs's rules), and
 * anything that is not a database on this machine is refused. Production's dumps are ops/backup.sh's, at the provider.
 *
 * ONE FILE PER RUN (TA-418): the dump's name carries the second and this process's id and is handed to ops/backup.sh
 * (BACKUP_OUT), which takes one backup at a time; the run copies the file it named, not "the one new file".
 * THE LAST GOOD COPY STAYS (TA-438): pruning by age skips the dump the last passing restore drill recorded.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { localDatabaseVerdict } from "./local-db-guard.mjs";
import { readDrillRecord } from "./drill-verdict.mjs";
import { libpqUrl } from "./pg-url.mjs";

/** What the server says of itself, as `addr|database` (the address empty on a unix socket). */
export const SERVER_IDENTITY_SQL = "SELECT coalesce(host(inet_server_addr()), '') || '|' || current_database()";

/**
 * TA-254: whether the database a backup would dump is this machine's, from SERVER_IDENTITY_SQL's answer. An answer
 * that cannot be read is refused: nothing is dumped from a server that was not asked.
 * @param {string} line psql -tA's answer
 * @param {{ ci?: boolean }} [opts]
 */
export function backupLocalityVerdict(line, { ci = false } = {}) {
  const text = String(line ?? "").trim();
  const bar = text.lastIndexOf("|");
  if (bar < 0 || !text.slice(bar + 1)) return { local: false, why: "the server's address and database could not be read" };
  const addr = text.slice(0, bar);
  return localDatabaseVerdict(addr === "" ? null : addr, { ci, database: text.slice(bar + 1) });
}

/** TA-418: the dump's file name, by the UTC second and the process that takes it. */
export function backupFileName(at, pid) {
  const stamp = at.toISOString().replace(/\.\d+Z$/, "Z").replace(/[-:]/g, "");
  return `edulink-${stamp}-${pid}.dump`;
}

/**
 * TA-438: the dumps of a folder older than the cut-off, but never the one the last passing drill restored.
 * @param {{ name: string, mtimeMs: number }[]} files
 * @param {{ cutoffMs: number, keep: string | null }} opts
 */
export function prunableDumps(files, { cutoffMs, keep }) {
  return files.filter((f) => /^edulink-.*\.dump$/.test(f.name) && f.mtimeMs < cutoffMs && f.name !== keep).map((f) => f.name);
}

const PG_PATH = (path) => `/opt/homebrew/opt/postgresql@16/bin:/opt/homebrew/bin:${path ?? ""}`;

function readEnvFile(webDir) {
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

function main() {
  const quiet = process.argv.includes("--quiet");
  const here = resolve(new URL(".", import.meta.url).pathname);
  const webDir = resolve(here, "..");
  const repoDir = resolve(webDir, "..", "..");

  const fileEnv = readEnvFile(webDir);
  const adminUrl = process.env.DATABASE_ADMIN_URL ?? fileEnv.DATABASE_ADMIN_URL ?? fileEnv.DATABASE_URL;
  if (!adminUrl) {
    process.stderr.write("db:backup: no DATABASE_ADMIN_URL or DATABASE_URL in the environment or .env\n");
    process.exit(1);
  }

  // TA-254: asked before anything is dumped. psql's own last line only: its error repeats no URL, the command does.
  let identity = "";
  try {
    identity = execFileSync("psql", ["-X", "-v", "ON_ERROR_STOP=1", "-d", libpqUrl(adminUrl), "-tAc", SERVER_IDENTITY_SQL], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PATH: PG_PATH(process.env.PATH), PGCONNECT_TIMEOUT: "10" },
    });
  } catch (error) {
    const why = String(error?.stderr ?? "").trim().split("\n").slice(-1)[0] || "psql could not connect";
    process.stderr.write(`db:backup: refused — the server could not be asked where it is (${why}); nothing was dumped\n`);
    process.exit(1);
  }
  const locality = backupLocalityVerdict(identity, { ci: process.env.GITHUB_ACTIONS === "true" });
  if (!locality.local) {
    process.stderr.write(`db:backup: refused — ${locality.why}. This dump goes to this laptop and its iCloud-synced Desktop, so it is for a database on this machine only; production is dumped at the provider (ops/backup.sh, docs/runbooks/backup-restore.md). Nothing was dumped.\n`);
    process.exit(1);
  }

  const backupDir = resolve(webDir, process.env.BACKUP_DIR ?? "storage/backups");
  const offsiteDir = process.env.EDULINK_OFFSITE_DIR ?? join(homedir(), "Desktop", "OffMachineCopy", "edulink-backups");
  const keepDays = Number(process.env.KEEP_DAYS ?? 14);

  const dump = backupFileName(new Date(), process.pid);
  const run = spawnSync("bash", [join(repoDir, "ops", "backup.sh")], {
    stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
    env: { ...fileEnv, ...process.env, DATABASE_ADMIN_URL: adminUrl, BACKUP_DIR: backupDir, BACKUP_OUT: join(backupDir, dump), KEEP_DAYS: String(keepDays), PATH: PG_PATH(process.env.PATH) },
  });
  if (run.status !== 0) {
    process.stderr.write(`db:backup: the dump FAILED (exit ${run.status}); nothing continues without a dump that lists\n${quiet ? String(run.stderr ?? "") : ""}`);
    process.exit(run.status ?? 1);
  }
  if (!existsSync(join(backupDir, dump))) {
    process.stderr.write(`db:backup: ops/backup.sh exited 0 but ${dump} is not in ${backupDir}\n`);
    process.exit(1);
  }
  mkdirSync(offsiteDir, { recursive: true });
  copyFileSync(join(backupDir, dump), join(offsiteDir, dump));
  const copied = statSync(join(offsiteDir, dump)).size;
  if (copied !== statSync(join(backupDir, dump)).size) {
    process.stderr.write(`db:backup: the off-machine copy of ${dump} is ${copied} bytes, not the dump's size\n`);
    process.exit(1);
  }
  const keep = readDrillRecord(offsiteDir)?.dump ?? null;
  const files = readdirSync(offsiteDir).map((name) => ({ name, mtimeMs: statSync(join(offsiteDir, name)).mtimeMs }));
  const prune = prunableDumps(files, { cutoffMs: Date.now() - keepDays * 86_400_000, keep });
  for (const name of prune) unlinkSync(join(offsiteDir, name));
  const mb = (copied / 1024 / 1024).toFixed(1);
  process.stdout.write(`db:backup: ${dump} (${mb} MB) in ${backupDir} and copied to ${offsiteDir}${prune.length ? `; ${prune.length} older than ${keepDays} days pruned there` : ""}${keep ? `; ${keep} kept as the last drill's good copy` : ""}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
