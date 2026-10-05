/**
 * A3-S-15 (5 Oct 2026, risks batch): the API sweep's sessions lived 24 hours and only the run's own `finally`
 * deleted them. They now last two hours, are renewed while the run lives, and are deleted on a signal.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { keepSessionsAlive, purgeSessionsOnSignal, SWEEP_RENEW_EVERY_MS, SWEEP_SESSION_MS, sweepSessionExpiry } from "../scripts/sweep-sessions";

afterEach(() => vi.useRealTimers());

describe("the API sweep's sessions", () => {
  it("last two hours, and are renewed well inside that", () => {
    expect(SWEEP_SESSION_MS).toBe(7_200_000);
    expect(SWEEP_RENEW_EVERY_MS * 3).toBeLessThanOrEqual(SWEEP_SESSION_MS);
    expect(sweepSessionExpiry(1_000).getTime()).toBe(1_000 + 7_200_000);
  });

  it("are renewed on the timer while the run lives, and not after the stop", async () => {
    vi.useFakeTimers();
    const renew = vi.fn(async () => undefined);
    const stop = keepSessionsAlive(renew, 1_000);
    await vi.advanceTimersByTimeAsync(3_500);
    expect(renew).toHaveBeenCalledTimes(3);
    stop();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(renew).toHaveBeenCalledTimes(3);
  });

  it("are deleted once on the first signal, and the process then exits 130", async () => {
    const listeners = new Map<string, () => void>();
    const exit = vi.fn();
    const purge = vi.fn(async () => undefined);
    purgeSessionsOnSignal(purge, { once: (signal, listener) => void listeners.set(signal, listener), exit });
    expect([...listeners.keys()].sort()).toEqual(["SIGHUP", "SIGINT", "SIGTERM"]);
    listeners.get("SIGINT")!();
    listeners.get("SIGTERM")!();
    await new Promise((r) => setTimeout(r, 0));
    expect(purge).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(130);
  });

  it("are what api-sweep.ts mints, renews and purges; no day-long session is left in it", () => {
    const src = readFileSync(join(process.cwd(), "scripts", "api-sweep.ts"), "utf8");
    expect(src).not.toMatch(/86_400_000/);
    // The two mints (the actors, the session the sign-out door signs out) and the renewal.
    expect(src.match(/expiresAt: sweepSessionExpiry\(\)/g)?.length).toBe(3);
    expect(src).toMatch(/keepSessionsAlive\(\(\) => db\.session\.updateMany\(\{ where: \{ id: \{ in: minted \} \}/);
    expect(src).toMatch(/purgeSessionsOnSignal\(\(\) => db\.session\.deleteMany\(\{ where: \{ id: \{ in: minted \} \} \}\)\)/);
  });
});
