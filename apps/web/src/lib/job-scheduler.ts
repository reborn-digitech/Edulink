import "server-only";
import { JOBS, runJob, type JobName } from "./jobs";

/**
 * The schedule, inside the process — for the container.
 *
 * `npm run cron:install` puts the jobs in a crontab, which is right on a VM
 * with a checkout. The container has neither a crontab nor tsx nor the
 * scripts directory: it has the traced server and nothing else. So a second
 * process from the SAME image, started with JOBS_RUNNER=1, runs this loop:
 * once a minute it reads the same five-field schedules `ops/crontab` is
 * generated from, and fires `runJob` for each one that matches the current
 * minute. The JobRun row is still the lock, so a crontab on a VM and a
 * runner in a container firing the same minute is the ordinary case the
 * registry already handles, not a race.
 *
 * ONE RUNNER, LOOPBACK ONLY. The runner uses the owner connection (a job is
 * operator work and reaches every tenant — see db.ts), and a Next server on
 * the owner connection must never serve a page: fly.toml binds it to
 * 127.0.0.1 on a port nothing routes to, and keeps it out of the http
 * service. Run one of them; a second only adds "skipped" rows.
 *
 * Schedules are read in the process's own time zone — set TZ (Asia/Kolkata
 * in fly.toml) or the 03:30 tidy runs at 03:30 UTC.
 *
 * STARTED BY A REQUEST, NOT AT BOOT. instrumentation.ts is the natural place,
 * and it is compiled for the edge runtime as well, where the mail transport
 * this module reaches (through jobs.ts) does not exist — the build fails on
 * `http`, `https` and `net`. So the runner's own launcher, scripts/jobs-runner.mjs,
 * starts the server and POSTs /api/internal/jobs, which calls `startJobScheduler`
 * once; the route is a Node route and answers 404 unless JOBS_RUNNER is "1".
 */

const MINUTE = 60_000;

/** Does a five-field crontab expression match this minute? `*`, n, a-b, a,b, star-slash-n, a-b/n; standard day-of-month OR day-of-week. */
export function matchesCron(schedule: string, at: Date): boolean {
  const fields = schedule.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`not a five-field schedule: "${schedule}"`);
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields as [string, string, string, string, string];
  const dom = fieldMatches(dayOfMonth, at.getDate(), 1, 31);
  const dow = fieldMatches(dayOfWeek, at.getDay(), 0, 7, { alias: { 7: 0 } });
  // cron's rule: when both day fields are restricted, either one matching is enough.
  const dayOk = dayOfMonth !== "*" && dayOfWeek !== "*" ? dom || dow : dom && dow;
  return fieldMatches(minute, at.getMinutes(), 0, 59) && fieldMatches(hour, at.getHours(), 0, 23) && dayOk && fieldMatches(month, at.getMonth() + 1, 1, 12);
}

function fieldMatches(field: string, value: number, min: number, max: number, opts: { alias?: Record<number, number> } = {}): boolean {
  for (const part of field.split(",")) {
    const [range, stepText] = part.split("/");
    const step = stepText ? Number(stepText) : 1;
    if (!Number.isInteger(step) || step < 1) throw new Error(`bad step in "${field}"`);
    let lo: number;
    let hi: number;
    if (range === "*") {
      lo = min;
      hi = max;
    } else if (range!.includes("-")) {
      const [a, b] = range!.split("-").map(Number);
      lo = a!;
      hi = b!;
    } else {
      lo = Number(range);
      hi = stepText ? max : lo;
    }
    if ([lo, hi].some((n) => !Number.isInteger(n) || n < min || n > max)) throw new Error(`bad field "${field}"`);
    for (let n = lo; n <= hi; n += step) {
      const v = opts.alias?.[n] ?? n;
      if (v === value) return true;
    }
  }
  return false;
}

export type SchedulerHandle = { stop(): void; tick(now?: Date): Promise<JobName[]> };

let active: SchedulerHandle | null = null;

/** The running scheduler, if the process has started one. */
export function jobSchedulerRunning(): boolean {
  return active !== null;
}

/**
 * Starts the loop. Returns a handle so a test can drive `tick` by hand and
 * stop the timer; `run` is injectable for the same reason. Never starts
 * unless JOBS_RUNNER is "1" — the web process must not schedule.
 */
export function startJobScheduler(opts: { run?: (name: JobName) => Promise<unknown>; now?: () => Date; log?: (line: string) => void } = {}): SchedulerHandle | null {
  if (process.env.JOBS_RUNNER !== "1") return null;
  // One per process: a second start (a retried kick) is the same scheduler.
  if (active) return active;
  const run = opts.run ?? ((name: JobName) => runJob(name));
  const now = opts.now ?? (() => new Date());
  const log = opts.log ?? ((line: string) => console.log(line));
  const firedAt = new Map<JobName, string>();

  const minuteKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;

  const tick = async (at: Date = now()): Promise<JobName[]> => {
    const key = minuteKey(at);
    const fired: JobName[] = [];
    for (const spec of Object.values(JOBS)) {
      if (!matchesCron(spec.schedule, at) || firedAt.get(spec.name) === key) continue;
      firedAt.set(spec.name, key);
      fired.push(spec.name);
      // Not awaited in sequence: a two-hour digest must not delay the tidy. Each outcome is one log line.
      void run(spec.name).then(
        (outcome) => log(JSON.stringify({ level: "info", at: new Date().toISOString(), job: spec.name, scheduler: "in-process", outcome })),
        (error: unknown) => log(JSON.stringify({ level: "error", at: new Date().toISOString(), job: spec.name, scheduler: "in-process", error: error instanceof Error ? error.message : String(error) })),
      );
    }
    return fired;
  };

  log(JSON.stringify({ level: "info", at: now().toISOString(), scheduler: "in-process", started: true, tz: process.env.TZ ?? "system", jobs: Object.values(JOBS).map((j) => `${j.name} @ ${j.schedule}`) }));

  // First tick on the next minute boundary, then every minute.
  let timer: NodeJS.Timeout | null = null;
  const schedule = () => {
    const ms = MINUTE - (now().getTime() % MINUTE);
    timer = setTimeout(() => {
      void tick();
      schedule();
    }, ms);
    timer.unref?.();
  };
  schedule();

  const handle: SchedulerHandle = {
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      if (active === handle) active = null;
    },
    tick,
  };
  active = handle;
  return handle;
}
