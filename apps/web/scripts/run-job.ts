/**
 * Run one scheduled job by name — the only entry point cron uses.
 *
 *   npm run job -- notifications:tidy
 *   npm run job -- digest:weekly --json
 *
 * `--json` prints one line a monitor can read. A run on named tenants
 * (LIFECYCLE-10): `--schools <id,id>` / `--users <id,id>` narrow it (refused
 * for a job that cannot narrow, and recorded as no run of the job), and only
 * then may `--now 2027-05-31T22:15:00Z` hand the job another clock. It is NOT
 * a dry run: the job writes for real on the tenants it reaches. Without a
 * scope a clock more than five minutes from now is refused (TA-171), because
 * it would act on every tenant. Exit status: 0 when the job
 * ran or was skipped because another copy is running; 1 when it failed or
 * the name is unknown. Runs through the owner connection (see package.json):
 * a job is operator work and reaches every tenant.
 */
import { isJobName, JOB_NAMES, runJob } from "../src/lib/jobs";

async function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const flag = (key: string) => {
    const at = args.indexOf(key);
    return at >= 0 ? args[at + 1] : undefined;
  };
  const values = new Set([flag("--now"), flag("--schools"), flag("--users")].filter(Boolean));
  const name = args.find((a) => !a.startsWith("--") && !values.has(a));
  if (!name || !isJobName(name)) {
    console.error(`Unknown job "${name ?? ""}". One of: ${JOB_NAMES.join(", ")}`);
    process.exit(1);
  }

  const nowArg = flag("--now");
  const now = nowArg ? new Date(nowArg) : new Date();
  if (Number.isNaN(now.getTime())) {
    console.error(`--now "${nowArg}" is not a date`);
    process.exit(1);
  }
  const list = (v: string | undefined) => (v ? v.split(",").map((x) => x.trim()).filter(Boolean) : undefined);
  const scope = flag("--schools") || flag("--users") ? { schoolIds: list(flag("--schools")), userIds: list(flag("--users")) } : undefined;
  const outcome = await runJob(name, now, scope);
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
