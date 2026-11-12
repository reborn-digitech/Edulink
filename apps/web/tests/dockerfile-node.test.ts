import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The production image runs the Node the repository pins. The static review
 * of 2026-10-01 found the Dockerfile on Node 20, end-of-life since April
 * 2026, while .nvmrc said 24; this holds the two together.
 */
describe("the production image", () => {
  it("runs the Node major that .nvmrc pins, in both stages", () => {
    const pinned = readFileSync(new URL("../../../.nvmrc", import.meta.url), "utf8").trim().replace(/^v/, "").split(".")[0];
    const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
    const stages = [...dockerfile.matchAll(/^FROM node:(\d+)[^\s]* AS (\w+)/gm)].map((m) => ({ stage: m[2], major: m[1] }));
    expect(stages.length).toBeGreaterThanOrEqual(2);
    for (const stage of stages) expect(stage).toEqual({ stage: stage.stage, major: pinned });
  });

  it("carries every local module the scripts it copies import (run 43299208835 lost db-fence.mjs under with-admin-db.mjs)", () => {
    const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
    const copied = new Set([...dockerfile.matchAll(/\/repo\/apps\/web\/scripts\/([\w-]+\.mjs)/g)].map((m) => m[1]!));
    expect(copied.size).toBeGreaterThanOrEqual(4);
    for (const file of copied) {
      const source = readFileSync(new URL(`../scripts/${file}`, import.meta.url), "utf8");
      for (const m of source.matchAll(/^import .* from "\.\/([\w-]+\.mjs)";/gm)) expect(copied, `${file} imports ${m[1]}, which the image does not copy`).toContain(m[1]!);
    }
  });
});
