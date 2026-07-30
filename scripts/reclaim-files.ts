/**
 * Reports — and with --delete, removes — stored files no record references.
 *
 *   npm run files:check     what would go, and how much space
 *   npm run files:reclaim   actually delete it
 *
 * Reporting is the default because the failure mode of getting this wrong is
 * deleting a child's submitted work. Read the output before passing --delete.
 */
import "dotenv/config";
import { reclaimOrphans, DEFAULT_GRACE_MS } from "../src/lib/orphans";

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const del = process.argv.includes("--delete");

  const report = await reclaimOrphans({ dryRun: !del });

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
