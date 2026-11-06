/**
 * THE FENCE AROUND THE DATABASE COMMANDS (7 November 2026, after the dev database was lost on the 6th).
 *
 * Every database script goes through scripts/with-admin-db.mjs, and that wrapper asks this fence first. The loss:
 * a builder ran `prisma migrate diff … --shadow-database-url <url>` with a URL a failed sed had left pointing at the
 * dev database itself, and Prisma reset it — every table dropped, the migrations replayed into an empty database —
 * because a shadow database is one Prisma DROPS AND RECREATES. No backup existed. So:
 *
 *   - `--shadow-database-url`, and `migrate diff` against migration folders (which needs a shadow), are refused
 *     outright. Migration SQL is derived from the live datasource, which writes nothing:
 *       prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
 *   - `migrate reset`, `--force-reset` and `--accept-data-loss` are refused unless EDULINK_DB_RESET=1, which only
 *     `npm run db:reset` sets, after scripts/local-db-guard.mjs has asked the server itself whether it is local.
 *   - the wrapper prints the database it is about to touch, so a wrong URL is seen before the command runs.
 *
 * Pure, so tests/db-fence.test.ts can hold the rules without a database.
 */

const SHADOW = /^--shadow-database-url(=|$)/;
const MIGRATION_FOLDERS = /^--(from|to)-migrations(=|$)/;
const RESET_FLAGS = new Set(["--force-reset", "--accept-data-loss"]);

/**
 * The verdict on one command line: `{ ok: true }` or `{ ok: false, why }`.
 * @param {string[]} argv the command and its arguments as the wrapper received them
 * @param {{ resetConsent?: boolean }} [opts] whether EDULINK_DB_RESET=1 was set by npm run db:reset
 */
export function fenceVerdict(argv, { resetConsent = false } = {}) {
  const words = argv.map(String);
  const prisma = words.findIndex((w) => /(^|\/)prisma$/.test(w)) >= 0 || words.includes("prisma");
  if (words.some((w) => SHADOW.test(w))) {
    return { ok: false, why: "a shadow database URL is refused: Prisma drops and recreates whatever database it names, and one did so to the dev database on 6 November 2026. Derive SQL from the live datasource: prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script" };
  }
  if (prisma && words.includes("diff") && words.some((w) => MIGRATION_FOLDERS.test(w))) {
    return { ok: false, why: "migrate diff against migration folders needs a shadow database and is refused; compare the live datasource with the schema file instead (--from-schema-datasource … --to-schema-datamodel …)" };
  }
  const reset = (prisma && words.includes("migrate") && words.includes("reset")) || words.some((w) => RESET_FLAGS.has(w));
  if (reset && !resetConsent) {
    return { ok: false, why: "a reset of the database is refused here; npm run db:reset is the one way, and it asks the server whether it is local first (scripts/local-db-guard.mjs)" };
  }
  return { ok: true };
}

/** The database a connection URL names, for the line the wrapper prints; never the password. */
export function describeDatabase(url) {
  try {
    const u = new URL(url);
    return `${u.pathname.replace(/^\//, "") || "(no database)"} on ${u.hostname || "(socket)"}${u.port ? `:${u.port}` : ""} as ${u.username || "(default user)"}`;
  } catch {
    return "(unreadable URL)";
  }
}
