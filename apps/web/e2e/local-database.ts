import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { join } from "node:path";

/**
 * TA-263's question for the Playwright set-up and tear-down: is the database they are about to write to on this
 * machine? Asked through the guard's own command, `node scripts/local-db-guard.mjs <what>` (the form db:reset runs),
 * and never by importing it. From a17f4711 global-setup.ts and global-teardown.ts imported the .mjs, and Playwright's
 * loader rewrote it to CommonJS while Node loaded it as an ES module ("exports is not defined in ES module scope"),
 * so the set-up threw before any test and no browser test, axe check or screenshot ran on CI (R1 of the CI triage of
 * 15 November 2026). A file under e2e/ imports no .mjs (tests/ci-triage-web.test.ts).
 *
 * Synchronous, so it is answered before anything is written. `url` is the one the caller's own client writes to:
 * the guard connects with it and asks the server where it answered and which database it is. Throws, with the
 * guard's reason, unless the guard said the database is local; a command that printed no verdict did not ask, and
 * is refused too. The guard's process gets this one's environment (NODE_ENV, GITHUB_ACTIONS, EDULINK_LOCAL_DATABASES).
 */
export function refuseUnlessLocalDatabaseAt(url: string | undefined, what: string): void {
  // The real path: the guard runs its command only when it is the script Node was given (import.meta.url against
  // argv[1]), and a path through a symbolic link would fail that test and exit 0 having asked nothing.
  const guard = realpathSync(join(__dirname, "..", "scripts", "local-db-guard.mjs"));
  let said: string;
  try {
    said = execFileSync(process.execPath, [guard, what], {
      env: { ...process.env, DATABASE_URL: url },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const why = String((error as { stderr?: unknown }).stderr ?? "").trim();
    throw new Error(why.startsWith("refusing to run") ? why : `refusing to run ${what}: the local database guard did not pass${why ? ` (${why})` : ""}`);
  }
  if (!said.includes(`${what}: `)) throw new Error(`refusing to run ${what}: the local database guard gave no verdict`);
  process.stdout.write(said);
}
