import { describe, expect, it } from "vitest";
import { termClass } from "@/lib/exam-cell-marks";
import { needOf } from "@/components/placement/parts";
import { buildCalendar } from "@/lib/fees-family";

/** The copy and formatting fixes of the audit of 5 October 2026 that live in a function (A3-journeys-19, -40). */
describe("copy that reads right", () => {
  const bands = [
    { cls: "DISTINCTION" as const, minSgpa: 7.75 },
    { cls: "FIRST" as const, minSgpa: 6 },
  ];

  it("a supplementary pass carries no class; a regular one does (A3-journeys-40)", () => {
    expect(termClass("PASS", "REGULAR", 900, bands)).toBe("DISTINCTION");
    expect(termClass("PASS", "SUPPLEMENTARY", 900, bands)).toBeNull();
    expect(termClass("ATKT", "REGULAR", 900, bands)).toBeNull();
  });

  it("the dream floor reads in lakh, never raw rupees (A3-journeys-19)", () => {
    expect(needOf({ code: "PLACED", need: "3750000", have: null })).toBe("37.5");
    expect(needOf({ code: "CGPA", need: "8.00", have: "7.50" })).toBe("8.00");
    expect(needOf({ code: "BACKLOGS", need: null, have: "1" })).toBe("");
  });

  it("a reminder still to come is upcoming, not overdue (A3-journeys-40)", () => {
    const rows = buildCalendar({
      instalments: [],
      demands: [{ id: "d", label: "T", dueDateKey: "2026-12-15", grossPaise: 100, concessionPaise: 0, netPaise: 100, paidPaise: 0, outstandingPaise: 100, status: "OPEN", overdue: false, lines: [] }],
      demandInstalment: new Map([["d", null]]),
      today: "2026-10-05",
    });
    expect(rows.filter((r) => r.kind === "REMINDER").every((r) => r.status === "UPCOMING")).toBe(true);
    expect(rows.some((r) => r.kind === "REMINDER" && r.date > "2026-12-15")).toBe(true);
  });
});
