/**
 * Send the parent weekly digest. Cron-ready:
 *
 *   0 16 * * 5  cd /path/to/edulink && npm run digest:weekly
 *
 * Idempotent over a six-day window — running it twice sends nothing twice —
 * so a retried cron or a nervous operator does no harm.
 */
import { sendWeeklyDigests } from "../src/lib/digest";

async function main() {
  const result = await sendWeeklyDigests();
  console.log(
    `weekly digest: sent ${result.sent}, skipped ${result.skipped} (already had one), ` +
      `${result.quiet} with nothing to say`,
  );
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error("[digest:weekly]", error);
    process.exit(1);
  },
);
