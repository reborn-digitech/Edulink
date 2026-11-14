/**
 * THE OWNER'S URL STAYS WITH THE PROCESSES THAT USE IT (TA-444). Fly applies an app's secrets to every machine of it,
 * so the web machines carry DATABASE_ADMIN_URL though only the release step and the jobs runner use it (db.ts reads
 * it only when JOBS_RUNNER=1): any disclosure of a web process's environment would hand over a role that reaches
 * every school past the row-level policies. A production web process drops it at boot (instrumentation.ts), before
 * any request is served. A laptop's dev server keeps it, as do the jobs runner and the release step, which run as
 * their own processes. No node:* import: instrumentation.ts is compiled for the edge too.
 */
export function withholdOwnerUrl(env: Record<string, string | undefined> = process.env): boolean {
  if (env.NODE_ENV !== "production" || env.JOBS_RUNNER === "1" || env.DATABASE_ADMIN_URL === undefined) return false;
  delete env.DATABASE_ADMIN_URL;
  return true;
}
