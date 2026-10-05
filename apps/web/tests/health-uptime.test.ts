/**
 * R-30 (5 Oct 2026, risks batch): /api/health's uptimeSeconds is the process's age (process.uptime()), not the
 * age of the route's module, which `next dev` re-evaluates on an edit to anything it imports.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as healthGet } from "@/app/api/health/route";

afterEach(() => vi.restoreAllMocks());

describe("the health probe's uptime", () => {
  it("is the process's own clock, whenever the module was loaded", async () => {
    vi.spyOn(process, "uptime").mockReturnValue(14_478.4);
    const body = (await (await healthGet()).json()) as { uptimeSeconds: number };
    expect(body.uptimeSeconds).toBe(14_478);
  });
});
