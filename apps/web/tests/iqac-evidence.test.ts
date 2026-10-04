/**
 * B-10 (the walk of 4 October 2026): a metric whose formula reads two facts drawn from the same rows — "placed"
 * over "outgoing", both the placement table's batches — stored each batch twice, and the predictor drew two list
 * items with one key ("PlacementTable:2025"), 18 times a page. One line per row, written and read.
 */
import { describe, expect, it } from "vitest";
import { uniqueEvidence } from "@/lib/iqac";

describe("a metric's evidence", () => {
  it("lists each row once, first label kept, order kept", () => {
    const ev = [
      { type: "PlacementTable", id: "2025", label: "2025" },
      { type: "PlacementTable", id: "2024", label: "2024" },
      { type: "PlacementTable", id: "2025", label: "2025 again" },
      { type: "ScholarshipClaim", id: "2025", label: "a claim" },
    ];
    expect(uniqueEvidence(ev)).toEqual([ev[0], ev[1], ev[3]]);
  });
});
