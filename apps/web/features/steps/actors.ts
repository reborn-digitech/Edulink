/**
 * WHO A SCENARIO IS (QA campaign, layer 3). A minted session from the repository's own harness,
 * `npm run zz:token -- --tag=qa-bdd ROLE [email]`, never a password typed anywhere: the token is a ZZ or
 * @demo.relay.test person's session with userAgent "zz-token", an hour long, recorded under the tag so the run's
 * AfterAll purges exactly what it minted (`--purge --tag=qa-bdd`) and nobody else's.
 *
 * One token per role and person for the whole run: a scenario that signs in as the ZZ ADMIN reuses the token the
 * first such scenario minted, so a run of a hundred scenarios mints some thirty sessions, not a hundred.
 */
import { spawnSync } from "node:child_process";
import { join } from "node:path";

export const WEB_ROOT = join(__dirname, "..", "..");
export const TAG = process.env.BDD_TOKEN_TAG ?? "qa-bdd";

const cache = new Map<string, string>();

function npm(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const out = spawnSync("npm", ["run", "-s", "zz:token", "--", `--tag=${TAG}`, ...args], { cwd: WEB_ROOT, encoding: "utf8", timeout: 60_000 });
  return { status: out.status, stdout: out.stdout ?? "", stderr: out.stderr ?? "" };
}

/** The bearer token for this role (and person, when named), minted once per run. */
export function tokenFor(role: string, email?: string): string {
  const key = `${role}|${email ?? ""}`;
  const known = cache.get(key);
  if (known) return known;
  if (email && !/@(zz\.test|demo\.relay\.test)$/.test(email)) throw new Error(`only ZZ and @demo.relay.test people may be signed in as (got ${email})`);
  const out = npm(email ? [role, email] : [role]);
  const token = out.stdout.trim().split("\n").pop() ?? "";
  if (out.status !== 0 || !/^[\w-]{30,}$/.test(token)) {
    throw new Error(`zz:token ${role} ${email ?? ""} failed (exit ${out.status}): ${out.stderr.split("\n").filter(Boolean).slice(-3).join(" | ")}`);
  }
  cache.set(key, token);
  return token;
}

/** Deletes the sessions this run minted, and only those. */
export function purgeTokens(): string {
  const out = npm(["--purge"]);
  cache.clear();
  return out.stderr.trim();
}
