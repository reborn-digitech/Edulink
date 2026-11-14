/**
 * The release step's proof of the two database roles row security depends on (TA-194, TA-243); the app's own copy
 * of the same two rules is src/lib/db-role-check.ts. No dependencies: db-grants.mjs runs in the container, which
 * carries psql and no TypeScript.
 *
 *   - The application's role (DATABASE_URL) must be held by the policies: neither a superuser nor BYPASSRLS. A
 *     single-role setup (the app connects as the owner) is a developer's machine's and is refused in production.
 *   - The owner's role (DATABASE_ADMIN_URL) must pass them: a superuser or BYPASSRLS. Every tenant table has FORCE
 *     ROW LEVEL SECURITY, so an owner that is neither runs every data step of a migration, every job and the dump
 *     over no school's rows, and only the dump says so.
 */

/** The query both connections answer: their own role and its two flags, as `name|t|f`. */
export const ROLE_FLAGS_SQL = "SELECT rolname || '|' || rolsuper || '|' || rolbypassrls FROM pg_roles WHERE rolname = current_user";

/** `name|t|f` (psql -tA) as { role, superuser, bypassRls }, or null when it is not that. */
export function parseRoleFlags(line) {
  const parts = String(line ?? "").trim().split("|");
  if (parts.length !== 3 || !parts[0]) return null;
  const flag = (v) => v === "t" || v === "true";
  return { role: parts[0], superuser: flag(parts[1]), bypassRls: flag(parts[2]) };
}

/** Every reason the release must stop, as sentences; [] when both roles are as row security needs them. */
export function releaseRoleProblems({ app, owner, singleRole, production }) {
  const problems = [];
  if (singleRole && production) {
    problems.push(`DATABASE_URL and DATABASE_ADMIN_URL name one role (${app?.role ?? "?"}): in production the app connects as the unprivileged app role, which row security holds, and never as the owner.`);
  }
  if (app && !singleRole && (app.superuser || app.bypassRls)) {
    problems.push(`The application's role "${app.role}" is ${app.superuser ? "a superuser" : "BYPASSRLS"}, so row-level security does not apply to it. Point DATABASE_URL at the unprivileged app role (docs/runbooks/go-live.md, step 2.2).`);
  }
  // A single-role setup is refused above in production and is a developer's own choice elsewhere.
  if (owner && !singleRole && !owner.superuser && !owner.bypassRls) {
    problems.push(`The owner's role "${owner.role}" is neither a superuser nor BYPASSRLS, so row-level security holds it and every data step, job and dump would see no school's rows. Run ALTER ROLE "${owner.role}" BYPASSRLS as a superuser, or use the provider's owner (docs/runbooks/go-live.md, step 0.4).`);
  }
  return problems;
}

/** Whether a command run on the owner connection applies migrations (`prisma migrate deploy`), whose data steps run as the owner. */
export function appliesMigrations(argv) {
  const at = argv.indexOf("migrate");
  return at >= 0 && argv[at + 1] === "deploy";
}

/**
 * THE OWNER BEFORE ANY MIGRATION (TA-243). db:release and db:migrate run `prisma migrate deploy` before db:grants, so
 * db-grants.mjs's step 0 came after the migrations' data steps had already run, over no school's rows under an owner
 * that row security holds, and been recorded applied. with-admin-db.mjs asks this before it spawns migrate deploy:
 * every reason to stop, as releaseRoleProblems words them ([] for any other command). `readFlags(url)` reads a
 * connection's own role (psql in the script); a role whose flags cannot be read stops the migration too.
 */
export function migrateRoleProblems({ argv, adminUrl, appUrl, production, readFlags }) {
  if (!appliesMigrations(argv)) return [];
  const roleOf = (url) => {
    try {
      return decodeURIComponent(new URL(url).username) || null;
    } catch {
      return null;
    }
  };
  const singleRole = !appUrl || roleOf(adminUrl) === roleOf(appUrl);
  let owner;
  try {
    owner = readFlags(adminUrl);
  } catch (error) {
    return [`Could not read the owner's role flags before migrating (${String(error?.message ?? error).trim().split("\n").slice(-1)[0]}), so nothing was applied.`];
  }
  if (!owner) return ["Could not read the owner's role flags before migrating, so nothing was applied."];
  return releaseRoleProblems({ app: singleRole ? owner : null, owner, singleRole, production });
}
