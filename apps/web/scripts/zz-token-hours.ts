/**
 * How long a zz:token session lasts (TA-462). One hour unless `--hours=N` names a whole number from 1 to 24: the
 * phone's browser suite in CI has run 38 to 46 minutes and more on a contended runner, so its steps mint for six
 * (.github/workflows/battery.yml), as the web harness mints for six (e2e/global-setup.ts) and the sweep for 24.
 * Apart from scripts/zz-token.ts, which runs at import, so the suites can call it.
 */
export const DEFAULT_TOKEN_HOURS = 1;
export const MAX_TOKEN_HOURS = 24;

export function tokenHours(flags: readonly string[]): number {
  const flag = flags.find((a) => a.startsWith("--hours="));
  if (flag === undefined) return DEFAULT_TOKEN_HOURS;
  const raw = flag.slice("--hours=".length);
  const hours = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_TOKEN_HOURS) throw new Error(`--hours takes a whole number of hours from 1 to ${MAX_TOKEN_HOURS}, not "${raw}"`);
  return hours;
}

export function tokenExpiry(hours: number, now: number = Date.now()): Date {
  return new Date(now + hours * 3_600_000);
}
