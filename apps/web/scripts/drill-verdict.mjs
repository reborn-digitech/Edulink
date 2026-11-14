/**
 * THE RESTORE DRILL'S VERDICT (TA-438). scripts/db-restore-drill.sh restored a dump and compared only the number of
 * tables with the live database, so a dump of an empty or wrong database of the same schema (the 6 November shape: a
 * wiped database with the migrations replayed) printed "passed", and fourteen mornings later pruning by age had
 * removed every good dump while every drill passed. Now the drill also fails when a key table restored empty, when a
 * key table restored with fewer than half the rows of the last drill that passed, or when the dump is less than half
 * the size of that drill's dump; a drill that passes is recorded beside the dumps (.drill-last-pass.json), and
 * db-backup.mjs never prunes the dump that record names.
 *
 *   node scripts/drill-verdict.mjs <offsite dir> <dump file> <live tables> <restored tables> Table=count …
 *
 * Exits 0 and records the pass, or exits 1 naming every problem. No dependencies: plain Node, beside the shell script.
 */
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

/** The tables a real database of this platform never has empty. */
export const DRILL_KEY_TABLES = ["School", "User", "Membership"];
/** The record of the last drill that passed, in the off-machine folder. */
export const DRILL_RECORD = ".drill-last-pass.json";

/**
 * @param {{ liveTables: number, restoredTables: number, restored: Record<string, number>, dumpBytes: number,
 *   last: { dump: string, dumpBytes: number, restored: Record<string, number> } | null }} input
 * @returns {{ ok: boolean, problems: string[] }}
 */
export function drillVerdict({ liveTables, restoredTables, restored, dumpBytes, last }) {
  const problems = [];
  if (liveTables !== restoredTables) problems.push(`the restored database has ${restoredTables} tables and the live one ${liveTables}`);
  for (const table of DRILL_KEY_TABLES) {
    const count = restored[table];
    if (!Number.isFinite(count) || count <= 0) {
      problems.push(`${table} restored with ${Number.isFinite(count) ? count : "no"} rows: a dump of an empty or wrong database is not a backup`);
      continue;
    }
    const before = last?.restored?.[table];
    if (Number.isFinite(before) && before > 0 && count < before / 2) {
      problems.push(`${table} restored with ${count} rows, fewer than half the ${before} of the last drill that passed (${last.dump})`);
    }
  }
  if (last && Number.isFinite(last.dumpBytes) && last.dumpBytes > 0 && dumpBytes < last.dumpBytes / 2) {
    problems.push(`the dump is ${dumpBytes} bytes, less than half the ${last.dumpBytes} of the last drill that passed (${last.dump})`);
  }
  return { ok: problems.length === 0, problems };
}

/** The last passing drill's record in a folder, or null. */
export function readDrillRecord(dir) {
  try {
    const record = JSON.parse(readFileSync(join(dir, DRILL_RECORD), "utf8"));
    return record && typeof record.dump === "string" ? record : null;
  } catch {
    return null;
  }
}

function cli(argv) {
  const [dir, dump, live, restoredTables, ...pairs] = argv;
  if (!dir || !dump) {
    process.stderr.write("usage: node scripts/drill-verdict.mjs <offsite dir> <dump> <live tables> <restored tables> Table=count …\n");
    process.exit(2);
  }
  const restored = {};
  for (const pair of pairs) {
    const [table, count] = pair.split("=");
    restored[table] = count === "" || count === undefined ? Number.NaN : Number(count);
  }
  const dumpBytes = statSync(dump).size;
  const last = readDrillRecord(dir);
  const verdict = drillVerdict({ liveTables: Number(live), restoredTables: Number(restoredTables), restored, dumpBytes, last });
  if (!verdict.ok) {
    for (const problem of verdict.problems) process.stderr.write(`drill: ${problem}\n`);
    process.exit(1);
  }
  writeFileSync(join(dir, DRILL_RECORD), `${JSON.stringify({ dump: basename(dump), dumpBytes, restored, at: new Date().toISOString() }, null, 2)}\n`);
  process.stdout.write(`drill: ${basename(dump)} recorded as the last good copy; pruning keeps it\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) cli(process.argv.slice(2));
