/**
 * THE FEES LEDGER'S ARITHMETIC, BY ITS INVARIANTS (QA campaign of 24 October 2026, unit layer).
 *
 * tests/fees.test.ts pins the concession rules with a handful of worked cases. What a family is billed rests on
 * them for every pupil and every instalment, so this holds the rules over thousands of generated cases from a
 * fixed seed (the same cases every run): whatever the heads, amounts and concessions,
 *
 *   - no line's concession is below nought or above the line's gross, and none is a fraction of a paisa;
 *   - the flat all-heads amounts are taken ONCE per instalment, exactly as much as the instalment has room for;
 *   - a line's own concessions are never reduced by the flat amount's spreading;
 *   - while no line is full, each line's share of the flat amount is its pro-rata share to within the rounding;
 *   - the balance of a demand is never negative, is nothing once settled, and the two copies of that rule
 *     (fees.ts `toDemandRow`, fees-reports.ts `demandOutstanding`) agree.
 *
 * Pure: no database, no session.
 */
import { describe, expect, it } from "vitest";
import { concessionOnInstalment, concessionOnLine, toDemandRow } from "@/lib/fees";
import { demandOutstanding } from "@/lib/fees-reports";

/** mulberry32: a small seeded generator, so a failure names a case that can be replayed. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Concession = { headId: string | null; kind: string; value: number };
type Line = { headId: string; grossPaise: number };

function caseOf(r: () => number): { lines: Line[]; concessions: Concession[] } {
  const int = (max: number) => Math.floor(r() * (max + 1));
  const heads = ["TUI", "DEV", "BUS", "EXM", "LAB"];
  const n = 1 + int(4);
  const lines: Line[] = Array.from({ length: n }, (_, i) => ({ headId: heads[i]!, grossPaise: r() < 0.08 ? 0 : int(5_00_000) }));
  const concessions: Concession[] = Array.from({ length: int(4) }, () => {
    const onHead = r() < 0.5 ? heads[int(heads.length - 1)]! : null;
    // PERCENT is in hundredths of a percent (10000 = 100 %); AMOUNT in paise.
    return r() < 0.5 ? { headId: onHead, kind: "PERCENT", value: int(10_000) } : { headId: onHead, kind: "AMOUNT", value: int(6_00_000) };
  });
  return { lines, concessions };
}

const CASES = 5_000;

describe("a concession on an instalment, over generated cases", () => {
  it("each line's concession is a whole paisa within [0, its gross]; the instalment never goes below nought", () => {
    const r = rng(20261024);
    for (let k = 0; k < CASES; k++) {
      const { lines, concessions } = caseOf(r);
      const off = concessionOnInstalment(lines, concessions);
      expect(off, `case ${k}`).toHaveLength(lines.length);
      off.forEach((o, i) => {
        expect(Number.isInteger(o), `case ${k} line ${i}`).toBe(true);
        expect(o, `case ${k} line ${i}`).toBeGreaterThanOrEqual(0);
        expect(o, `case ${k} line ${i}`).toBeLessThanOrEqual(lines[i]!.grossPaise);
      });
    }
  });

  it("⚠ the flat all-heads amount is taken once per instalment, exactly as far as there is room, never once per line", () => {
    const r = rng(7);
    for (let k = 0; k < CASES; k++) {
      const { lines, concessions } = caseOf(r);
      const own = lines.map((l) => concessionOnLine(l.grossPaise, l.headId, concessions));
      const off = concessionOnInstalment(lines, concessions);
      const flat = concessions.filter((c) => !c.headId && c.kind === "AMOUNT").reduce((a, c) => a + c.value, 0);
      const gross = lines.reduce((a, l) => a + l.grossPaise, 0);
      const ownTotal = own.reduce((a, x) => a + x, 0);
      const expected = gross > 0 && flat > 0 ? ownTotal + Math.min(flat, gross - ownTotal) : ownTotal;
      expect(off.reduce((a, x) => a + x, 0), `case ${k}: ${JSON.stringify({ lines, concessions })}`).toBe(expected);
      // The spreading only ever adds to a line's own concession.
      off.forEach((o, i) => expect(o, `case ${k} line ${i}`).toBeGreaterThanOrEqual(own[i]!));
    }
  });

  it("while no line fills up, each line's share of the flat amount is its pro-rata share to within the rounding", () => {
    const r = rng(42);
    let checked = 0;
    for (let k = 0; k < CASES; k++) {
      const { lines } = caseOf(r);
      const gross = lines.reduce((a, l) => a + l.grossPaise, 0);
      if (gross === 0) continue;
      const flat = Math.floor(r() * Math.min(...lines.map((l) => l.grossPaise)));
      if (flat === 0) continue;
      const off = concessionOnInstalment(lines, [{ headId: null, kind: "AMOUNT", value: flat }]);
      if (off.some((o, i) => o === lines[i]!.grossPaise && lines[i]!.grossPaise > 0)) continue;
      checked += 1;
      off.forEach((o, i) => expect(Math.abs(o - (flat * lines[i]!.grossPaise) / gross), `case ${k} line ${i}`).toBeLessThanOrEqual(lines.length * 0.5));
    }
    expect(checked).toBeGreaterThan(CASES / 10);
  });

  it("a line's own concession: a percentage on its head or on all, an amount on its head; capped at the line", () => {
    const r = rng(99);
    for (let k = 0; k < CASES; k++) {
      const gross = Math.floor(r() * 3_00_000);
      const pct = Math.floor(r() * 10_000);
      const amt = Math.floor(r() * 4_00_000);
      const got = concessionOnLine(gross, "TUI", [
        { headId: null, kind: "PERCENT", value: pct },
        { headId: "TUI", kind: "AMOUNT", value: amt },
        // Neither of these is the line's: another head's, and the flat all-heads amount.
        { headId: "BUS", kind: "PERCENT", value: 10_000 },
        { headId: null, kind: "AMOUNT", value: 1_00_000 },
      ]);
      expect(got, `case ${k}`).toBe(Math.min(gross, Math.round((gross * pct) / 10_000) + amt));
    }
  });

  it("is the same answer for the same input, and an empty instalment or no concessions is nothing off", () => {
    const lines = [{ headId: "TUI", grossPaise: 1_000_01 }, { headId: "BUS", grossPaise: 333_33 }, { headId: "LAB", grossPaise: 7 }];
    const concessions = [{ headId: null, kind: "AMOUNT", value: 500_00 }, { headId: "BUS", kind: "PERCENT", value: 3_333 }];
    expect(concessionOnInstalment(lines, concessions)).toEqual(concessionOnInstalment(lines, concessions));
    expect(concessionOnInstalment([], concessions)).toEqual([]);
    expect(concessionOnInstalment(lines, [])).toEqual([0, 0, 0]);
    expect(concessionOnInstalment([{ headId: "TUI", grossPaise: 0 }], [{ headId: null, kind: "AMOUNT", value: 100 }])).toEqual([0]);
  });
});

describe("a demand's balance", () => {
  const STATUSES = ["OPEN", "PART", "PAID", "WAIVED", "CANCELLED", "CARRIED"];
  it("is never negative, is owed only while OPEN or PART, and the ledger's copy and the reports' copy agree", () => {
    const r = rng(5);
    for (let k = 0; k < CASES; k++) {
      const net = Math.floor(r() * 2_00_000);
      const paid = Math.floor(r() * 2_50_000);
      const status = STATUSES[Math.floor(r() * STATUSES.length)]!;
      const due = new Date(Date.UTC(2026, Math.floor(r() * 12), 1 + Math.floor(r() * 28)));
      const row = toDemandRow({ id: "d", label: "Term", dueDate: due, grossPaise: net, concessionPaise: 0, netPaise: net, paidPaise: paid, status, linesJson: "[]" }, "2026-07-15");
      const owed = demandOutstanding({ netPaise: net, paidPaise: paid, status });
      expect(row.outstandingPaise, `case ${k}`).toBe(owed);
      expect(owed).toBeGreaterThanOrEqual(0);
      if (status !== "OPEN" && status !== "PART") expect(owed).toBe(0);
      else expect(owed).toBe(Math.max(0, net - paid));
      // Overdue: something owed, due before today in the school's zone.
      expect(row.overdue, `case ${k}`).toBe(owed > 0 && row.dueDateKey < "2026-07-15");
    }
  });

  it("reads its lines from the stored JSON, and a broken document as no lines rather than a crash", () => {
    const base = { id: "d", label: "Term 1", dueDate: new Date("2026-06-10T00:00:00Z"), grossPaise: 100, concessionPaise: 0, netPaise: 100, paidPaise: 0, status: "OPEN" };
    expect(toDemandRow({ ...base, linesJson: '[{"headId":"h","code":"TUI","name":"Tuition","grossPaise":100,"concessionPaise":0}]' }, "2026-06-10").lines).toHaveLength(1);
    expect(toDemandRow({ ...base, linesJson: "{not json" }, "2026-06-10").lines).toEqual([]);
    // Due today is not overdue.
    expect(toDemandRow({ ...base, linesJson: "[]" }, "2026-06-10").overdue).toBe(false);
  });
});
