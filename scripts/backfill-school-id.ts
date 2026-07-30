/**
 * Adds the denormalised `schoolId` to the five tables that used to reach their
 * school through a join, and fills it in from the parent row.
 *
 *   npx tsx --tsconfig scripts/tsconfig.json scripts/backfill-school-id.ts
 *
 * Exists so an existing dev database does not have to be thrown away. `prisma db
 * push` cannot add a NOT NULL column to a table that already has rows without
 * either a default or a reset, and a reset costs whatever you were in the middle
 * of testing. This adds the column with an empty default, fills it from the
 * parent, and leaves the schema in the shape `db push` expects.
 *
 * Safe to run twice: it checks for the column before adding it, and the UPDATE
 * only touches rows that are still empty.
 *
 * Production is a different job — this is written for SQLite, and a Postgres
 * deployment would do it as a proper migration with the column added NOT NULL
 * after the backfill.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** table -> the parent it inherits from, and the key that reaches it. */
const TABLES: { table: string; parent: string; fk: string }[] = [
  { table: "ClassTeacher", parent: "Class", fk: "classId" },
  { table: "Enrollment", parent: "Class", fk: "classId" },
  { table: "Comment", parent: "Post", fk: "postId" },
  { table: "Reaction", parent: "Post", fk: "postId" },
  { table: "RemarkMessage", parent: "RemarkThread", fk: "threadId" },
];

async function hasColumn(table: string, column: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info("${table}")`);
  return rows.some((r) => r.name === column);
}

async function main() {
  const report: string[] = [];

  for (const { table, parent, fk } of TABLES) {
    if (!(await hasColumn(table, "schoolId"))) {
      // The empty default is what makes this possible on a table with rows; the
      // UPDATE below replaces it immediately.
      await db.$executeRawUnsafe(
        `ALTER TABLE "${table}" ADD COLUMN "schoolId" TEXT NOT NULL DEFAULT ''`,
      );
      report.push(`  ${table}: column added`);
    }

    const filled = await db.$executeRawUnsafe(
      `UPDATE "${table}" SET "schoolId" = (
         SELECT p."schoolId" FROM "${parent}" p WHERE p."id" = "${table}"."${fk}"
       ) WHERE "schoolId" = '' OR "schoolId" IS NULL`,
    );
    report.push(`  ${table}: ${filled} row(s) filled from ${parent}`);

    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "${table}_schoolId_idx" ON "${table}"("schoolId")`,
    );
  }

  // A row whose parent has no school (a GLOBAL post) would be left empty, and an
  // empty tenant is worse than a missing column — it matches nothing and is
  // invisible. Say so rather than leaving it to be found by an RLS policy.
  const orphaned: string[] = [];
  for (const { table } of TABLES) {
    const rows = await db.$queryRawUnsafe<{ n: number }[]>(
      `SELECT COUNT(*) AS n FROM "${table}" WHERE "schoolId" = '' OR "schoolId" IS NULL`,
    );
    const n = Number(rows[0]?.n ?? 0);
    if (n > 0) orphaned.push(`${table} (${n})`);
  }

  process.stdout.write(
    ["", "Backfilling denormalised schoolId", "", ...report, ""].join("\n"),
  );
  if (orphaned.length > 0) {
    process.stdout.write(
      `  UNFILLED, needs a look: ${orphaned.join(", ")}\n` +
        "  These rows have a parent with no school. They will not be visible to\n" +
        "  any tenant once RLS is on.\n\n",
    );
    process.exitCode = 1;
  } else {
    process.stdout.write("  Every row has a school.\n\n");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
