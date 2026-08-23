/**
 * Run one scheduled job by name — the only entry point cron uses.
 *
 *   npm run job -- notifications:tidy
 *   npm run job -- digest:weekly --json
 *
 * `--json` prints one line a monitor can read. Exit status: 0 when the job
 * ran or was skipped because another copy is running; 1 when it failed or
 * the name is unknown. Runs through the owner connection (see package.json):
 * a job is operator work and reaches every tenant.
 */
import { isJobName, JOB_NAMES, runJob } from "../src/lib/jobs";

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const name = args.find((a) => !a.startsWith("--"));
  if (!name || !isJobName(name)) {
    console.error(`Unknown job "${name ?? ""}". One of: ${JOB_NAMES.join(", ")}`);
    process.exit(1);
  }

  const outcome = await runJob(name);
  const stamp = new Date().toISOString();
  if (json) {
    console.log(JSON.stringify({ at: stamp, job: name, ...outcome }));
  } else if (outcome.status === "done") {
    console.log(`${name}: done in ${outcome.ms} ms — ${JSON.stringify(outcome.summary)}`);
  } else if (outcome.status === "skipped") {
    console.log(`${name}: skipped — another copy has been running since ${outcome.since.toISOString()}`);
  } else {
    console.error(`${name}: FAILED after ${outcome.ms} ms — ${outcome.error}`);
  }
  process.exit(outcome.status === "failed" ? 1 : 0);
}

main().catch((error) => {
  console.error("[job]", error);
  process.exit(1);
});
