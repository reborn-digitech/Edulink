/**
 * A Prisma connection URL, made fit for libpq (psql, pg_dump, pg_restore).
 *
 *   import { libpqUrl } from "./pg-url.mjs";
 *   node scripts/pg-url.mjs "$DATABASE_URL"      # prints the URL libpq accepts
 *
 * WHY. deploy.md's capacity advice appends Prisma's pool settings to
 * DATABASE_URL (`?connection_limit=30&pool_timeout=20`). Prisma reads them;
 * libpq refuses the whole URL — `psql: error: invalid URI query parameter:
 * "connection_limit"` — and the release step's db-grants.mjs hands that URL to
 * psql, so the release would fail on the first deploy that took the advice.
 * Every script that passes a URL to a libpq tool passes it through here.
 *
 * What is removed: the parameters Prisma documents for PostgreSQL that libpq
 * does not know, or knows with another meaning (Prisma's `sslidentity` and
 * `sslpassword` are a PKCS#12 bundle and its password; libpq has neither in
 * that sense). What is kept: everything else, so `sslmode`, `application_name`,
 * `options` and `connect_timeout` (the same seconds in both) still reach the
 * server. `schema` is Prisma's search path; every table here is in `public`,
 * which is psql's default, so dropping it changes nothing these scripts read.
 */
import { pathToFileURL } from "node:url";

export const PRISMA_ONLY_PARAMS = [
  "schema",
  "connection_limit",
  "pool_timeout",
  "socket_timeout",
  "pgbouncer",
  "statement_cache_size",
  "sslaccept",
  "sslidentity",
  "sslpassword",
  "max_connection_lifetime",
  "max_idle_connection_lifetime",
];

/**
 * The same URL without Prisma's own query parameters. A string that is not a
 * URL (a bare database name, a key=value conninfo) is returned unchanged:
 * libpq reads those itself and Prisma never wrote them.
 */
export function libpqUrl(url) {
  if (typeof url !== "string" || !/^postgres(ql)?:\/\//i.test(url.trim())) return url;
  const trimmed = url.trim();
  const queryAt = trimmed.indexOf("?");
  if (queryAt < 0) return trimmed;
  // Split by hand rather than through URL: a URL object re-encodes the
  // userinfo and the host list (`host1,host2`) in ways libpq then misreads.
  const base = trimmed.slice(0, queryAt);
  const hashAt = trimmed.indexOf("#", queryAt);
  const query = trimmed.slice(queryAt + 1, hashAt < 0 ? undefined : hashAt);
  const kept = query
    .split("&")
    .filter((pair) => pair !== "")
    .filter((pair) => !PRISMA_ONLY_PARAMS.includes(paramName(pair)));
  return kept.length ? `${base}?${kept.join("&")}` : base;
}

function paramName(pair) {
  const name = pair.split("=")[0] ?? "";
  try {
    return decodeURIComponent(name).toLowerCase();
  } catch {
    return name.toLowerCase();
  }
}

// As a command: print the cleaned URL for a shell script (ops/backup.sh, ops/restore.sh).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const input = process.argv[2];
  if (!input) {
    process.stderr.write("usage: node scripts/pg-url.mjs <postgres URL>\n");
    process.exit(2);
  }
  process.stdout.write(`${libpqUrl(input)}\n`);
}
