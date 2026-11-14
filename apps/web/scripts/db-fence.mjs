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
 *   - TA-437: the words are read as the shell would hand them to Prisma, so a `sh -c "… --shadow-database-url …"`
 *     string is split before it is tested, and a version-pinned `prisma@6.19.3` (or `node_modules/.bin/prisma`) is
 *     Prisma; `prisma migrate dev` is refused outright (it uses a shadow database of its own, and on drift it asks in
 *     the terminal to reset the database, where one "y" drops every table with no dump); and the seed asks
 *     seedVerdict before it wipes: never over a database that holds a school, unless db:reset's consent is set.
 *
 * Pure, so tests/db-fence.test.ts can hold the rules without a database.
 */

const SHADOW = /^--shadow-database-url(=|$)/;
const MIGRATION_FOLDERS = /^--(from|to)-migrations(=|$)/;
const RESET_FLAGS = new Set(["--force-reset", "--accept-data-loss"]);
/** Prisma's CLI however it is named: `prisma`, `prisma@6.19.3`, `node_modules/.bin/prisma`. */
const PRISMA_CLI = /(^|\/)prisma(@[^/\s]+)?$/;

/**
 * The verdict on one command line: `{ ok: true }` or `{ ok: false, why }`.
 * @param {string[]} argv the command and its arguments as the wrapper received them
 * @param {{ resetConsent?: boolean }} [opts] whether EDULINK_DB_RESET=1 was set by npm run db:reset
 */
export function fenceVerdict(argv, { resetConsent = false } = {}) {
  // Split as a shell would (TA-437): `sh -c "npx prisma migrate diff … --shadow-database-url …"` is one argument.
  const words = argv
    .flatMap((w) => String(w).split(/\s+/))
    .map((w) => w.replace(/^["']+|["']+$/g, ""))
    .filter(Boolean);
  const prisma = words.some((w) => PRISMA_CLI.test(w));
  if (words.some((w) => SHADOW.test(w))) {
    return { ok: false, why: "a shadow database URL is refused: Prisma drops and recreates whatever database it names, and one did so to the dev database on 6 November 2026. Derive SQL from the live datasource: prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script" };
  }
  if (prisma && words.includes("diff") && words.some((w) => MIGRATION_FOLDERS.test(w))) {
    return { ok: false, why: "migrate diff against migration folders needs a shadow database and is refused; compare the live datasource with the schema file instead (--from-schema-datasource … --to-schema-datamodel …)" };
  }
  if (prisma && words.includes("migrate") && words.includes("dev")) {
    return { ok: false, why: "prisma migrate dev is refused: it uses a shadow database, and on drift it asks to reset the database, where one 'y' drops every table with no dump. Write the migration from the live datasource: prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script" };
  }
  const reset = (prisma && words.includes("migrate") && words.includes("reset")) || words.some((w) => RESET_FLAGS.has(w));
  if (reset && !resetConsent) {
    return { ok: false, why: "a reset of the database is refused here; npm run db:reset is the one way, and it asks the server whether it is local first (scripts/local-db-guard.mjs)" };
  }
  return { ok: true };
}

/**
 * TA-437: whether the seed may wipe and rebuild. It deletes every school, person, register, mark and audit row before
 * it builds two schools, so it runs only over a database that holds no school (a fresh one, or one db:reset has just
 * emptied after its dump), unless EDULINK_DB_RESET=1 is set, which only npm run db:reset sets.
 * @param {number} schoolCount the School rows the database holds now
 * @param {{ resetConsent?: boolean }} [opts]
 */
export function seedVerdict(schoolCount, { resetConsent = false } = {}) {
  if (!Number.isFinite(schoolCount) || schoolCount < 0) {
    return { ok: false, why: "the seed could not count the schools this database holds, so it wipes nothing" };
  }
  if (schoolCount > 0 && !resetConsent) {
    return { ok: false, why: `this database holds ${schoolCount} school${schoolCount === 1 ? "" : "s"}, and the seed deletes every school, person, register, mark and audit row before it builds its own. Never seed a database with data in it; npm run db:reset (which dumps first) is the one way to start again` };
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
