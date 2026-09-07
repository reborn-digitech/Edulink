import { PrismaClient } from "@prisma/client";

/**
 * Repairs mentoring notifications that point at routes which never existed.
 *
 * ⚠ THE CODE FIX DOES NOT REACH THE ROWS ALREADY WRITTEN. Six `url:` values in
 * `src/lib/mentoring.ts` pointed at `/parent/mentoring/…`,
 * `/expert/mentoring/…` and `/student/margdarshak/…`, none of which have ever
 * been routes. Every mentoring notification the app has sent — in the app and by
 * push — led to a 404, and the destination is STORED on each `Notification` row.
 * Fixing the sender stops new ones; the ones already sitting in somebody's list
 * stay broken until something rewrites them.
 *
 * WHAT IT DOES: rewrites those three prefixes to `/mentoring/`, keeping the
 * thread id. It touches nothing else — not the title, not the body, not read
 * state, and no row whose url is already correct.
 *
 * IDEMPOTENT. Run it twice and the second run reports zero, because the rows it
 * matches no longer match once rewritten.
 *
 * NOT A PRISMA MIGRATION on purpose: it repairs data written by a bug rather
 * than reshaping the schema, it is safe to run against a database at any
 * version, and a deployment that has never sent a mentoring notification should
 * be able to skip it without leaving a migration unapplied.
 *
 *   npx tsx scripts/fix-mentoring-links.ts          # report only
 *   npx tsx scripts/fix-mentoring-links.ts --write  # actually rewrite
 */

const DEAD_PREFIXES = [
  "/parent/mentoring/",
  "/expert/mentoring/",
  "/student/margdarshak/",
] as const;

const LIVE_PREFIX = "/mentoring/";

async function main() {
  const write = process.argv.includes("--write");
  const db = new PrismaClient();

  let total = 0;
  for (const prefix of DEAD_PREFIXES) {
    const where = { url: { startsWith: prefix } };
    const count = await db.notification.count({ where });
    total += count;

    if (!count) {
      console.log(`  ${prefix.padEnd(24)} 0`);
      continue;
    }

    if (!write) {
      const sample = await db.notification.findFirst({ where, select: { url: true } });
      console.log(`  ${prefix.padEnd(24)} ${count}   e.g. ${sample?.url} -> ${sample?.url?.replace(prefix, LIVE_PREFIX)}`);
      continue;
    }

    /**
     * ONE STATEMENT PER PREFIX, in the database, rather than reading rows into
     * this process and writing them back. Seven thousand round trips to change
     * a prefix is a script somebody kills half way through, which is the one
     * outcome that leaves the data in a state nobody has thought about.
     *
     * Parameterised — `$executeRaw`, never string concatenation — because that
     * is the rule everywhere else in this repo and a maintenance script is
     * exactly where people stop following it.
     *
     * ⚠ THE OFFSET IS `length(${prefix}) + 1`, NOT `${prefix.length + 1}`. A JS
     * number goes over the wire as `bigint`, and `substring(text from bigint)`
     * does not exist in Postgres — the first version failed with `42883` and
     * wrote nothing, which is the good version of getting this wrong. Letting
     * the database measure the prefix keeps the value an `int` and keeps the
     * offset derived from the same parameter the WHERE clause matches on, so
     * the two cannot disagree.
     */
    const updated = await db.$executeRaw`
      UPDATE "Notification"
         SET "url" = ${LIVE_PREFIX} || substring("url" from length(${prefix}) + 1)
       WHERE "url" LIKE ${prefix + "%"}
    `;
    console.log(`  ${prefix.padEnd(24)} ${updated} rewritten`);
  }

  if (!write) {
    console.log(
      total > 0
        ? `\n${total} notification(s) point nowhere. Re-run with --write to fix.`
        : "\nNothing to fix.",
    );
  } else {
    const left = await db.notification.count({
      where: { OR: DEAD_PREFIXES.map((p) => ({ url: { startsWith: p } })) },
    });
    console.log(`\nDone. Dead mentoring links remaining: ${left}`);
  }

  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
