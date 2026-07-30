/**
 * Reports — and with --delete, removes — stored files no record references.
 *
 *   npm run files:check     what would go, and how much space
 *   npm run files:reclaim   actually delete it
 *   … --json               one line of machine-readable output, for a cron job
 *
 * Reporting is the default because the failure mode of getting this wrong is
 * deleting a child's submitted work. Read the output before passing --delete.
 *
 * THIS IS AN OPERATOR TOOL, NOT AN ADMIN SCREEN, and deliberately so. An orphan
 * is a file no record points at — so it has no owning record, and therefore no
 * school. There is nothing to scope it to: a Riverside admin pressing "reclaim"
 * would be deleting bytes left behind by Oakfield's deleted rows. Every other
 * destructive action in this app answers "whose is it?" before it runs; this one
 * cannot, so it belongs to whoever runs the server.
 *
 * It is not an in-process timer either. Two app instances would mean two sweeps,
 * and the one thing a deletion pass should never be is racing itself.
 */
import "dotenv/config";
import { reclaimOrphans, DEFAULT_GRACE_MS } from "../src/lib/orphans";

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const del = process.argv.includes("--delete");
  const json = process.argv.includes("--json");

  const report = await reclaimOrphans({ dryRun: !del });

  // One line, so a scheduled run can be piped somewhere that alerts on it.
  // Exit stays 0 unless the sweep itself failed: finding orphans is the normal
  // state of a system that has ever deleted a post, not an error condition.
  if (json) {
    process.stdout.write(
      `${JSON.stringify({
        dryRun: !del,
        scanned: report.scanned,
        referenced: report.referenced,
        unreferenced: report.orphans.length,
        skippedRecent: report.skippedRecent,
        unrecognised: report.unrecognised.length,
        deleted: report.deleted.length,
        bytesReclaimed: report.bytesReclaimed,
      })}\n`,
    );
    return;
  }

  const lines: string[] = [
    "",
    del ? "Reclaiming unreferenced files" : "Checking for unreferenced files (nothing will be deleted)",
    "",
    `  on disk        ${report.scanned}`,
    `  referenced     ${report.referenced}`,
    `  unreferenced   ${report.orphans.length}`,
  ];

  if (report.skippedRecent > 0) {
    lines.push(
      `  left alone     ${report.skippedRecent} (modified in the last ${Math.round(
        DEFAULT_GRACE_MS / 60000,
      )} minutes — an upload may still be writing its row)`,
    );
  }
  if (report.unrecognised.length > 0) {
    lines.push(
      `  not ours       ${report.unrecognised.length} (left untouched: ${report.unrecognised
        .slice(0, 3)
        .join(", ")}${report.unrecognised.length > 3 ? ", …" : ""})`,
    );
  }

  lines.push("");

  if (report.orphans.length === 0) {
    lines.push("  Nothing to reclaim.", "");
  } else {
    const total = report.orphans.reduce((sum, o) => sum + o.bytes, 0);
    for (const orphan of report.orphans.slice(0, 20)) {
      lines.push(`  ${orphan.fileId}  ${mb(orphan.bytes)}  last touched ${orphan.modifiedAt.toISOString()}`);
    }
    if (report.orphans.length > 20) lines.push(`  … and ${report.orphans.length - 20} more`);
    lines.push("");
    lines.push(
      del
        ? `  Deleted ${report.deleted.length}, reclaiming ${mb(report.bytesReclaimed)}.`
        : `  ${mb(total)} would be reclaimed. Re-run with --delete to remove them.`,
    );
    lines.push("");
  }

  process.stdout.write(lines.join("\n"));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { db } = await import("../src/lib/db");
    await db.$disconnect();
  });
