/**
 * HOW OLD ARE THE NEWEST COPIES? (TA-521). The morning dump, the Monday base backup and the monthly drill are run by a
 * scheduled task of the desktop app, only while the laptop is awake and the app open, and nothing read the age of the
 * newest dump: the protection added after 6 November could stop for days unseen, which is the state the loss happened
 * in. This answers it from the off-machine folder, and exits 1 when the newest dump is older than 26 hours or the
 * newest base backup older than eight days, so the morning report (and anyone) can see it stopped.
 *
 *   node scripts/db-backup-age.mjs        (EDULINK_OFFSITE_DIR, default ~/Desktop/OffMachineCopy/edulink-backups)
 *
 * Reads file names and times only; touches no database.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const DUMP_MAX_HOURS = 26;
export const BASE_MAX_DAYS = 8;

const HOUR = 3_600_000;

/**
 * @param {{ dumps: { name: string, mtimeMs: number }[], bases: { name: string, mtimeMs: number }[], now: number }} input
 * @returns {{ ok: boolean, problems: string[], lines: string[] }}
 */
export function backupFreshness({ dumps, bases, now }) {
  const problems = [];
  const lines = [];
  const newest = (files) => files.reduce((a, b) => (a && a.mtimeMs >= b.mtimeMs ? a : b), null);
  const dump = newest(dumps);
  if (!dump) {
    problems.push("no dump in the off-machine folder at all");
  } else {
    const hours = Math.floor((now - dump.mtimeMs) / HOUR);
    lines.push(`newest dump ${dump.name}, ${hours} hours old`);
    if (now - dump.mtimeMs > DUMP_MAX_HOURS * HOUR) problems.push(`the newest dump (${dump.name}) is ${hours} hours old, more than ${DUMP_MAX_HOURS}: the morning backup has stopped`);
  }
  const base = newest(bases);
  if (!base) {
    problems.push("no base backup in the off-machine folder at all");
  } else {
    const days = Math.floor((now - base.mtimeMs) / (24 * HOUR));
    lines.push(`newest base ${base.name}, ${days} days old`);
    if (now - base.mtimeMs > BASE_MAX_DAYS * 24 * HOUR) problems.push(`the newest base backup (${base.name}) is ${days} days old, more than ${BASE_MAX_DAYS}: the Monday base backup has stopped`);
  }
  return { ok: problems.length === 0, problems, lines };
}

function filesIn(dir, pattern) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => pattern.test(name))
    .map((name) => ({ name, mtimeMs: statSync(join(dir, name)).mtimeMs }));
}

function cli() {
  const dir = process.env.EDULINK_OFFSITE_DIR ?? join(homedir(), "Desktop", "OffMachineCopy", "edulink-backups");
  const verdict = backupFreshness({ dumps: filesIn(dir, /^edulink-.*\.dump$/), bases: filesIn(join(dir, "pitr-bases"), /^base-.*\.tar$/), now: Date.now() });
  for (const line of verdict.lines) process.stdout.write(`backup age: ${line}\n`);
  for (const problem of verdict.problems) process.stderr.write(`backup age: ${problem}\n`);
  if (!verdict.ok) process.exit(1);
  process.stdout.write("backup age: fresh\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli();
