/**
 * 1 Nov 2026: the API sweep retries ONE dropped call once while /api/health answers, and ends the run as before when
 * health does not answer or the retry is dropped too (scripts/sweep-retry.ts). Two runs had aborted hours in on a
 * single unanswered request with health answering 200 right after.
 */
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { healthAnswers, retryOnceIfHealthy } from "../scripts/sweep-retry";

const deps = (healthy: boolean, again: { status: number }) => ({
  healthy: vi.fn(async () => healthy),
  pause: vi.fn(async () => undefined),
  again: vi.fn(async () => again),
});

describe("the API sweep's one retry", () => {
  it("leaves an answered call alone: no health look, no retry", async () => {
    const d = deps(true, { status: 200 });
    expect(await retryOnceIfHealthy({ status: 404 }, d)).toEqual({ answer: { status: 404 }, retried: false });
    expect(d.healthy).not.toHaveBeenCalled();
    expect(d.again).not.toHaveBeenCalled();
  });

  it("retries a dropped call once, after the pause, while health answers", async () => {
    const d = deps(true, { status: 422 });
    expect(await retryOnceIfHealthy({ status: 0 }, d)).toEqual({ answer: { status: 422 }, retried: true });
    expect(d.healthy).toHaveBeenCalledTimes(1);
    expect(d.pause).toHaveBeenCalledTimes(1);
    expect(d.again).toHaveBeenCalledTimes(1);
  });

  it("takes the server for gone when health does not answer, without retrying", async () => {
    const d = deps(false, { status: 200 });
    expect(await retryOnceIfHealthy({ status: 0 }, d)).toEqual({ gone: "health" });
    expect(d.again).not.toHaveBeenCalled();
  });

  it("takes the server for gone when the one retry is dropped too", async () => {
    const d = deps(true, { status: 0 });
    expect(await retryOnceIfHealthy({ status: 0 }, d)).toEqual({ gone: "retry" });
    expect(d.again).toHaveBeenCalledTimes(1);
  });

  it("looks at /api/health patiently: a second look answers for a first that did not", async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => {
      n++;
      if (n === 1) throw new Error("busy");
      return new Response("ok", { status: 200 });
    }) as unknown as typeof fetch;
    expect(await healthAnswers("http://x", 2, 50, fetchImpl, 10)).toBe(true);
    const down = vi.fn(async () => new Response("no", { status: 503 })) as unknown as typeof fetch;
    expect(await healthAnswers("http://x", 1, 50, down, 10)).toBe(false);
    // The patience a stalled server is given: four looks of fifteen seconds, five seconds apart.
    const { HEALTH_TRIES, HEALTH_TIMEOUT_MS, HEALTH_GAP_MS } = await import("../scripts/sweep-retry");
    expect(HEALTH_TRIES * HEALTH_TIMEOUT_MS + (HEALTH_TRIES - 1) * HEALTH_GAP_MS).toBeGreaterThanOrEqual(60_000);
  });

  it("is what api-sweep.ts does with a dropped call, and the summary counts the retries", () => {
    const src = readFileSync("scripts/api-sweep.ts", "utf8");
    expect(src).toMatch(/retryOnceIfHealthy\(first, \{/);
    expect(src).toMatch(/calls retried once/);
    expect(src).not.toMatch(/serverStillThere/);
  });
});
