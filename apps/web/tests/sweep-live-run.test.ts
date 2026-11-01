/**
 * 1 Nov 2026: the API sweep never calls a generation-run door with a live run's id, and while a run is live it calls
 * none of the doors that start or stop a run or a model server (scripts/sweep-live-run.ts).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ENDPOINTS } from "@/lib/api-catalog";
import { isLiveRun, liveRunSkip, RUN_ACTING_DOORS } from "../scripts/sweep-live-run";

const door = (method: string, path: string) => ({ method, path });

describe("the API sweep and the generation run in hand", () => {
  it("names only doors the catalog has", () => {
    for (const key of RUN_ACTING_DOORS) expect(ENDPOINTS.some((e) => `${e.method} ${e.path}` === key), key).toBe(true);
  });

  it("skips a quiz-jobs door whose sample names the live run", () => {
    const live = ["cmvvm1lqb00000rlok8uihvcu"];
    expect(liveRunSkip(door("GET", "/api/v1/appadmin/quiz-jobs/{jobId}"), "/api/v1/appadmin/quiz-jobs/cmvvm1lqb00000rlok8uihvcu", live)).toMatch(/live generation run/);
    expect(liveRunSkip(door("POST", "/api/v1/appadmin/quiz-jobs/{jobId}/stop"), "/api/v1/appadmin/quiz-jobs/cmvvm1lqb00000rlok8uihvcu/stop", live)).toMatch(/live generation run/);
  });

  it("skips the start and stop doors while any run is live, and calls them when none is", () => {
    const live = ["cmvvm1lqb00000rlok8uihvcu"];
    for (const key of RUN_ACTING_DOORS) {
      const [method, path] = key.split(" ") as [string, string];
      const sample = path.replace("{jobId}", "zz-sweep-no-such-job").replace("{server}", "zz-sweep-no-such-server");
      expect(liveRunSkip(door(method, path), sample, live), key).toMatch(/a generation run is active/);
      expect(liveRunSkip(door(method, path), sample, []), key).toBeNull();
    }
    // A read of the run in hand, or of a finished run, is still called.
    expect(liveRunSkip(door("GET", "/api/v1/appadmin/quiz-jobs"), "/api/v1/appadmin/quiz-jobs", live)).toBeNull();
    expect(liveRunSkip(door("GET", "/api/v1/appadmin/quiz-jobs/{jobId}"), "/api/v1/appadmin/quiz-jobs/cfinished000000000000000", live)).toBeNull();
    expect(liveRunSkip(door("GET", "/api/v1/me"), "/api/v1/me", live)).toBeNull();
  });

  it("takes queued, running, stopping and active runs for live", () => {
    expect(isLiveRun({ state: "RUNNING", active: true })).toBe(true);
    expect(isLiveRun({ state: "STOPPING", active: null })).toBe(true);
    expect(isLiveRun({ state: "DONE", active: null })).toBe(false);
    expect(isLiveRun({ state: "STOPPED", active: null })).toBe(false);
  });

  it("is applied by api-sweep.ts before any call to a door, the variants' included", () => {
    const src = readFileSync("scripts/api-sweep.ts", "utf8");
    expect(src).toMatch(/liveRunSkip\(e, path, await liveRunIds\(\)\)/);
  });
});
