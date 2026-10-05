/**
 * STREAMS-8 (5 Oct 2026): `api:sweep --cross=school|person` wrote to the ZZ fixture schools (a "ZZ Sweep Applicant"
 * application, a guardian's decision on a fixture PEN change) and never swept its own window away, as the main run
 * does. The cross dispatch now runs through inOwnWindow, which sweeps the run's window when it ends or throws.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { inOwnWindow } from "../scripts/sweep-window";

describe("a sweep's own window", () => {
  it("is swept from the moment the run started, after it ends", async () => {
    const start = new Date("2026-10-05T04:22:04Z");
    const swept: Date[] = [];
    const order: string[] = [];
    const result = await inOwnWindow(async () => (order.push("run"), 7), async (at) => void (order.push("sweep"), swept.push(at)), () => start);
    expect(result).toBe(7);
    expect(order).toEqual(["run", "sweep"]);
    expect(swept).toEqual([start]);
  });

  it("is swept when the run throws half-way, and the failure still reaches the caller", async () => {
    const swept: Date[] = [];
    await expect(inOwnWindow(async () => { throw new Error("server gone"); }, async (at) => void swept.push(at))).rejects.toThrow("server gone");
    expect(swept).toHaveLength(1);
  });

  it("is what the cross probes run through in api-sweep.ts", () => {
    const sweep = readFileSync(join(process.cwd(), "scripts", "api-sweep.ts"), "utf8");
    expect(sweep).toMatch(/if \(CROSS_MODE\) return inOwnWindow\(\(\) => crossProbe\(CROSS_MODE\), sweepAway\);/);
    expect(sweep).not.toMatch(/if \(CROSS_MODE\) return crossProbe\(CROSS_MODE\);/);
  });
});
