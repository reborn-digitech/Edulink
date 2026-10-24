/**
 * THE RUN'S EDGES (QA campaign, layer 3).
 *
 *   BeforeAll  the dev server must answer /api/health, or the run stops at once ("got 0" means it is down, and a
 *              hundred red scenarios would say nothing about the product).
 *   Before     a scenario tagged @missing is not run: it describes what the code cannot do yet, and stays in the
 *              file as the gap's statement (its reason is the comment above it).
 *   After      every scenario is tallied: passed, failed, missing, or skipped for its environment (a platform
 *              feature that is off on the dev database, a model server, Meta), so the counts the report pastes
 *              tell those apart.
 *   AfterAll   the sessions this run minted are purged (and only those), the server is checked again, and the
 *              tally is printed.
 */
import { After, AfterAll, Before, BeforeAll, setDefaultTimeout, Status } from "@cucumber/cucumber";
import { purgeTokens } from "./actors";
import { BASE, type BddWorld } from "./world";

setDefaultTimeout(120_000);

const tally = { passed: 0, failed: 0, missing: 0, environment: 0, undefined: 0, other: 0 };
const failures: string[] = [];
const environment: string[] = [];

async function health(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(20_000) });
    return res.status;
  } catch {
    return 0;
  }
}

BeforeAll(async function () {
  const status = await health();
  if (status !== 200) throw new Error(`the dev server at ${BASE} answered /api/health with ${status} (got 0 means it is down): not running the scenarios`);
});

Before({ tags: "@missing" }, function () {
  return "skipped";
});

After(function (this: BddWorld, { pickle, result }) {
  const tags = pickle.tags.map((t) => t.name);
  const name = `${pickle.uri.replace(/^.*features\//, "")} — ${pickle.name}`;
  const status = result?.status;
  if (tags.includes("@missing")) tally.missing++;
  else if (status === Status.PASSED) tally.passed++;
  else if (status === Status.FAILED) {
    tally.failed++;
    failures.push(name);
  } else if (status === Status.SKIPPED) {
    tally.environment++;
    environment.push(`${name}${this.vars.has("__skip") ? ` (${String(this.vars.get("__skip"))})` : ""}`);
  } else if (status === Status.UNDEFINED) tally.undefined++;
  else tally.other++;
});

AfterAll(async function () {
  const purged = purgeTokens();
  const status = await health();
  const lines = [
    "",
    "BDD tally (QA campaign layer 3)",
    `  passed ${tally.passed} · failed ${tally.failed} · missing ${tally.missing} · skipped for the environment ${tally.environment} · undefined ${tally.undefined} · other ${tally.other}`,
    ...(failures.length ? ["  failed:", ...failures.map((f) => `    - ${f}`)] : []),
    ...(environment.length ? ["  skipped for the environment:", ...environment.map((f) => `    - ${f}`)] : []),
    `  sessions: ${purged}`,
    `  /api/health after the run: ${status}`,
  ];
  process.stdout.write(lines.join("\n") + "\n");
});
