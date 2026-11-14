/**
 * Is the database server really on this machine? Asked of the server itself.
 *
 *   import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";
 *   await refuseUnlessLocalDatabase(prismaClient, "zz:fixtures");
 *
 * The fixtures (zz:fixtures, demo:schools) mint known passwords and a
 * superuser, and the seed (db:seed, db:reset) deletes every school first. All
 * three looked at the URL's host and accepted "localhost" — and a `fly proxy`
 * to production IS localhost. So the question goes to the server instead:
 * `inet_server_addr()` is the address the server answered this connection on.
 *
 *   NULL                  a unix socket: this machine            → local
 *   127.0.0.0/8, ::1      the loopback: this machine             → local
 *   fdaa::/16             Fly's private network (6PN): a `fly proxy`
 *                         or `fly mpg proxy` tunnel to a deployed database → refused
 *   anything else         another machine, whatever the URL says → refused
 *
 * One exception, for CI alone: a GitHub Actions service container answers on
 * its Docker bridge address (172.16.0.0/12 or 192.168.0.0/16) though the
 * runner reaches it on localhost. Accepted only when GITHUB_ACTIONS=true,
 * which the runner sets and a laptop holding a production tunnel does not.
 *
 * TA-523: the loopback is not proof on its own. Through `ssh -L 5433:127.0.0.1:5432` to a database host, or a
 * `kubectl port-forward` to a Postgres pod, the far end connects to that server's own loopback (or forwards its
 * socket), and the server answers 127.0.0.1 or NULL. So a loopback or socket answer counts as this machine only
 * when the database is one a laptop or CI holds by name: edulink_dev, edulink_ci, edulink_test, or a name listed in
 * EDULINK_LOCAL_DATABASES (comma-separated). Production's database is `edulink` (go-live step 1.3).
 */
import { pathToFileURL } from "node:url";

/** The databases a developer's machine or CI holds by name. */
export const KNOWN_LOCAL_DATABASES = ["edulink_dev", "edulink_ci", "edulink_test"];

function localNames(extra) {
  const fromEnv = String(process.env.EDULINK_LOCAL_DATABASES ?? "")
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  return new Set([...KNOWN_LOCAL_DATABASES, ...fromEnv, ...(extra ?? [])]);
}

/**
 * The pure decision, for the tests: the server's address as Postgres reports it, whether this is a CI runner, and
 * the database's own name (current_database()). With no `database` given the name is not asked, as before TA-523;
 * refuseUnlessLocalDatabase always gives it.
 */
export function localDatabaseVerdict(serverAddr, { ci = false, database, knownLocal } = {}) {
  const verdict = addressVerdict(serverAddr, { ci });
  if (!verdict.local || database === undefined) return verdict;
  if (!localNames(knownLocal).has(String(database))) {
    return {
      local: false,
      why: `${verdict.why}, but the database is "${database || "(unreadable)"}", not one this machine holds by name (${[...localNames(knownLocal)].join(", ")}): a tunnel that ends on the database host's own loopback answers the same way. Add it to EDULINK_LOCAL_DATABASES only if it really is on this machine`,
    };
  }
  return verdict;
}

function addressVerdict(serverAddr, { ci }) {
  if (serverAddr === null || serverAddr === undefined || serverAddr === "") {
    return { local: true, why: "the server answered on a unix socket, which only this machine can open" };
  }
  const addr = String(serverAddr).trim().toLowerCase().replace(/\/\d+$/, "");
  const v4 = addr.startsWith("::ffff:") ? addr.slice(7) : addr;
  if (/^127\.\d+\.\d+\.\d+$/.test(v4) || addr === "::1") {
    return { local: true, why: `the server answered on the loopback (${addr})` };
  }
  if (/^fdaa:/.test(addr)) {
    return {
      local: false,
      why: `the server answered on ${addr}, an address on Fly's private network: this "localhost" is a fly proxy tunnel to a deployed database, not a database on this machine`,
    };
  }
  if (ci && (/^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(v4) || /^192\.168\.\d+\.\d+$/.test(v4))) {
    return { local: true, why: `the server is CI's own service container (${addr}, a Docker bridge address)` };
  }
  return { local: false, why: `the server answered on ${addr}, which is not this machine — a tunnel or a remote host, whatever the URL's host says` };
}

/** The address the server answered this connection on, through a Prisma client (or anything with $queryRawUnsafe). */
export async function databaseServerAddress(client) {
  const rows = await client.$queryRawUnsafe("SELECT host(inet_server_addr()) AS addr");
  return rows[0]?.addr ?? null;
}

/** The address the server answered on and the database's own name, in one question (TA-523). */
export async function databaseServerIdentity(client) {
  const rows = await client.$queryRawUnsafe("SELECT host(inet_server_addr()) AS addr, current_database() AS name");
  return { addr: rows[0]?.addr ?? null, name: typeof rows[0]?.name === "string" ? rows[0].name : "" };
}

/**
 * Throws, naming what was refused and why, unless the database is on this
 * machine. A production NODE_ENV is refused before anything is asked.
 */
export async function refuseUnlessLocalDatabase(client, what) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`refusing to run ${what}: NODE_ENV=production. It writes known passwords or wipes schools, and is for a database on this machine only.`);
  }
  const { addr, name } = await databaseServerIdentity(client);
  const verdict = localDatabaseVerdict(addr, { ci: process.env.GITHUB_ACTIONS === "true", database: name });
  if (!verdict.local) {
    throw new Error(`refusing to run ${what}: ${verdict.why}. It writes known passwords or wipes schools, and is for a database on this machine only.`);
  }
  return verdict;
}

// As a command, for a package.json chain that must stop BEFORE its first step
// (db:reset's `prisma db push --force-reset`): exits 1 with the reason.
//   node scripts/local-db-guard.mjs db:reset      (DATABASE_URL from with-admin-db.mjs)
// No top-level await: tsx loads this file into the CommonJS fixture scripts,
// where a module that awaits at its top cannot be required.
async function cli(what) {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try {
    const verdict = await refuseUnlessLocalDatabase(db, what);
    process.stdout.write(`  ${what}: ${verdict.why}.\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void cli(process.argv[2] ?? "this script");
}
