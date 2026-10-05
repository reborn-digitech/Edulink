/**
 * THE INSIGHTS ENGINE'S ARITHMETIC, BY HAND (5 October 2026). Pure — no
 * database, no session: every number below is worked out on paper in the
 * comment above the assertion and then compared with what
 * src/lib/accreditation-insights.ts gives, so a change to a formula, a scale
 * or a rounding rule shows up here as a different number and not as a shrug.
 * The engine reads iqac-rules.ts (NAAC, NIRF) and council-rules.ts (NBA); it
 * carries no formula of its own, and these cases hold both ends: the rule
 * files' numbers, and the engine's steps and paths over them.
 *
 * THE TINY NAAC FRAMEWORK (weights add to 100, so a weight is a percentage of
 * the CGPA; the criterion codes are the metric codes' first part):
 *   2.4.2  QN PHD_NET_PCT   weight 20  percent, benchmark 75   lever phdNetTeachers (+1 teacher)
 *   2.1.1  QN ENROLMENT_PCT weight 20  percent, benchmark 100  lever admitted
 *   7.2.1  QL                weight 30  the IQAC's own 0–4
 *   2.7.1  QN SSS            weight 15  direct (the mean is the score) lever sssMean (+0.1)
 *   3.4.2  QN MOUS           weight 15  count, benchmark 10    lever mous (+1)
 * TODAY'S FIGURES: 10 of 20 teachers with a PhD or NET/SET, 120 admitted to
 * 100 seats, the SSS mean 2.4, 5 MoUs, 7.2.1 not yet scored.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NaacFramework, NaacMetric, NbaInputs, NirfInputs } from "@edulink/contracts";
import { NBA_SAR_ITEMS } from "@edulink/contracts";
import { cgpaOf, evaluate, gainPerUnit, gradeOf, nextBand, nirfSubs, scoreOf, FORMULAS } from "@/lib/iqac-rules";
import { nbaMarks } from "@/lib/council-rules";
import { exactCgpa, naacInsightsOf, nbaInsightsOf, nbaTotals, nirfInsightsOf, nirfScore, pathToBand, simulateNaac, stepFor, type NaacInputs } from "@/lib/accreditation-insights";

const metric = (code: string, kind: "QN" | "QL", weight: number, formula: NaacMetric["formula"]): NaacMetric => ({ code, ki: code.split(".").slice(0, 2).join("."), kind, weight, text: `ZZ ${code}`, formula, window: "CURRENT" });
const metrics: NaacMetric[] = [
  metric("2.4.2", "QN", 20, "PHD_NET_PCT"),
  metric("2.1.1", "QN", 20, "ENROLMENT_PCT"),
  metric("7.2.1", "QL", 30, null),
  metric("2.7.1", "QN", 15, "SSS"),
  metric("3.4.2", "QN", 15, "MOUS"),
];
const fw: NaacFramework = {
  code: "AFFILIATED_UG",
  criteria: [
    { code: "2", name: "ZZ Teaching", weight: 55 },
    { code: "3", name: "ZZ Research", weight: 15 },
    { code: "7", name: "ZZ Values", weight: 30 },
  ],
  keyIndicators: [],
  metrics,
  note: null,
};
const TODAY: NaacInputs = { facts: { phdNetTeachers: 10, fullTimeTeachers: 20, admitted: 120, sanctionedSeats: 100, sssMean: 2.4, mous: 5 }, ql: { "7.2.1": null } };
const near = (x: number, y: number, digits = 4) => expect(x).toBeCloseTo(y, digits);

describe("the scales the engine reads, by hand", () => {
  it("a metric one step below its band: 10 of 20 teachers is 50 %, 50 ÷ 75 × 4 = 2.67", () => {
    const ev = evaluate("PHD_NET_PCT", TODAY.facts);
    // 10 ÷ 20 × 100 = 50; 50 ÷ 75 × 4 = 2.6667, printed to two places.
    expect(ev.value).toBe(50);
    expect(ev.score).toBe(2.67);
    expect(scoreOf(FORMULAS.PHD_NET_PCT.scale, 56.25)).toBeCloseTo(3, 10);
  });

  it("the smallest number of teachers that reaches score 3 is 2 more: 12 of 20 is 60 %, 60 ÷ 75 × 4 = 3.2; 11 of 20 is 55 %, 2.93", () => {
    expect(stepFor("PHD_NET_PCT", TODAY.facts, 3)).toEqual({ units: 2, delta: 2, toValue: 60, toScore: 3.2 });
    // One more teacher is not enough: 11 ÷ 20 × 100 = 55; 55 ÷ 75 × 4 = 2.9333.
    expect(evaluate("PHD_NET_PCT", { ...TODAY.facts, phdNetTeachers: 11 }).score).toBe(2.93);
    // The top: 75 % of 20 is 15 teachers, 5 more, and the score is exactly 4.
    expect(stepFor("PHD_NET_PCT", TODAY.facts, 4)).toEqual({ units: 5, delta: 5, toValue: 75, toScore: 4 });
  });

  it("a metric already at the top has no step and is not in the list: 120 ÷ 100 = 120 %, capped at 4", () => {
    expect(evaluate("ENROLMENT_PCT", TODAY.facts)).toEqual({ value: 120, score: 4, missing: [] });
    expect(stepFor("ENROLMENT_PCT", TODAY.facts, 4)).toEqual({ units: 0, delta: 0, toValue: 120, toScore: 4 });
    expect(naacInsightsOf(fw, TODAY).map((i) => i.code)).not.toContain("2.1.1");
    expect(gainPerUnit(metrics[1]!, TODAY.facts, 4, 100)).toBe(0);
  });

  it("a 'fewer is better' lever steps down: result days 40 → score 4 × 30 ÷ 40 = 3, and 30 days is the top", () => {
    const facts = { resultDaysAvg: 40 };
    expect(evaluate("RESULT_DAYS", facts).score).toBe(3);
    // The lever's step is −1 day; the smallest number of days sooner that reaches 4 is 10.
    expect(stepFor("RESULT_DAYS", facts, 4)).toEqual({ units: 10, delta: -10, toValue: 30, toScore: 4 });
  });

  it("a fact the rows do not hold has no step and says which one", () => {
    expect(stepFor("PHD_NET_PCT", { phdNetTeachers: 10, fullTimeTeachers: null }, 3)).toBeNull();
    expect(stepFor("PHD_NET_PCT", { phdNetTeachers: null, fullTimeTeachers: 20 }, 3)).toBeNull();
    const row = naacInsightsOf(fw, { ...TODAY, facts: { ...TODAY.facts, fullTimeTeachers: null } }).find((i) => i.code === "2.4.2")!;
    expect(row.missing).toEqual(["fullTimeTeachers"]);
    expect(row.nextStep).toBeNull();
    expect(row.score).toBe(0);
  });
});

describe("the tiny framework's CGPA, band and criteria, by hand", () => {
  const sim = simulateNaac(fw, TODAY);
  it("Σ score × weight ÷ Σ weight: (2.67×20 + 4×20 + 0×30 + 2.4×15 + 2×15) ÷ 100 = 199.4 ÷ 100 = 1.994, printed 1.99, band C", () => {
    // 53.4 + 80 + 0 + 36 + 30 = 199.4.
    expect(exactCgpa(fw, sim.scores)).toBeCloseTo(1.994, 10);
    expect(cgpaOf(fw, sim.scores)).toBe(1.99);
    expect(sim.cgpa).toBe(1.99);
    expect(sim.grade).toBe("C");
    expect(gradeOf(1.99)).toBe("C");
  });

  it("the next band is B from 2.01, 0.02 away", () => {
    expect(sim.nextBand).toEqual({ grade: "B", min: 2.01, distance: 0.02 });
    expect(nextBand(1.99)).toEqual({ grade: "B", min: 2.01, distance: 0.02 });
  });

  it("a criterion's score is the weighted mean of its metrics: criterion 2 = (2.67×20 + 4×20 + 2.4×15) ÷ 55 = 169.4 ÷ 55 = 3.08", () => {
    expect(sim.criteria.find((c) => c.code === "2")?.score).toBe(3.08);
    // Criterion 3: 2 ÷ 1 → the one metric's own 2.00; criterion 7: unscored, 0.
    expect(sim.criteria.find((c) => c.code === "3")?.score).toBe(2);
    expect(sim.criteria.find((c) => c.code === "7")?.score).toBe(0);
  });

  it("a rounding edge: 200.9 ÷ 100 = 2.009 prints as 2.01 and so is band B — the band follows the printed figure, as NAAC's does", () => {
    const edge = new Map<string, number>([["2.4.2", 2.67], ["2.1.1", 4], ["7.2.1", 0], ["2.7.1", 2.5], ["3.4.2", 2]]);
    // 53.4 + 80 + 0 + 37.5 + 30 = 200.9.
    expect(exactCgpa(fw, edge)).toBeCloseTo(2.009, 10);
    expect(cgpaOf(fw, edge)).toBe(2.01);
    expect(gradeOf(cgpaOf(fw, edge))).toBe("B");
  });
});

describe("the insights over the tiny framework", () => {
  const rows = naacInsightsOf(fw, TODAY);
  const byCode = (c: string) => rows.find((r) => r.code === c)!;

  it("lists every metric below 4: three quantitative ones, then the qualitative one", () => {
    expect(rows.map((r) => r.code)).toEqual(["3.4.2", "2.4.2", "2.7.1", "7.2.1"]);
  });

  it("3.4.2 MoUs: 5 → score 2; the next whole score is 3 at 8 MoUs (4 × 8 ÷ 10 = 3.2), 3 more, adding (3.2 − 2) × 15 ÷ 100 = 0.18; 0.06 a MoU", () => {
    const r = byCode("3.4.2");
    expect(r.score).toBe(2);
    expect(r.nextStep).toMatchObject({ delta: 3, toValue: 8, toScore: 3.2 });
    near(r.nextStep!.points, 0.18);
    near(r.efficiency, 0.06);
    // To the top: 10 MoUs, 5 more, (4 − 2) × 15 ÷ 100 = 0.30.
    expect(r.toTop).toMatchObject({ delta: 5, toValue: 10, toScore: 4 });
    near(r.toTop!.points, 0.3);
    // The predictor's own per-unit figure: one MoU is 6 ÷ 10 × 4 = 2.4, + 0.4 × 15 ÷ 100 = 0.06.
    near(r.pointsPerUnit, 0.06);
  });

  it("2.4.2 PhD teachers: 2 more reach 3.2, adding (3.2 − 2.67) × 20 ÷ 100 = 0.106; 0.053 a teacher — dearer than a MoU, so second", () => {
    const r = byCode("2.4.2");
    expect(r.nextStep).toMatchObject({ delta: 2, toValue: 60, toScore: 3.2 });
    near(r.nextStep!.points, 0.106);
    near(r.efficiency, 0.053);
    expect(r.unit).toBe("teacher");
    expect(r.lever).toBe("phdNetTeachers");
    expect(r.leverValue).toBe(10);
  });

  it("2.7.1 the survey mean: 2.4 → 3 is 6 tenths, adding 0.6 × 15 ÷ 100 = 0.09; 0.015 a tenth", () => {
    const r = byCode("2.7.1");
    expect(r.nextStep).toMatchObject({ delta: 0.6, toValue: 3, toScore: 3 });
    near(r.nextStep!.points, 0.09);
    near(r.efficiency, 0.015);
    // To the top: 4 − 2.4 = 1.6, sixteen tenths, 1.6 × 15 ÷ 100 = 0.24.
    expect(r.toTop).toMatchObject({ delta: 1.6, toScore: 4 });
    near(r.toTop!.points, 0.24);
  });

  it("a qualitative unscored metric: score 0, 'scored' false, one whole step is 1 × 30 ÷ 100 = 0.30, to the top 4 × 30 ÷ 100 = 1.20", () => {
    const r = byCode("7.2.1");
    expect(r.kind).toBe("QL");
    expect(r.scored).toBe(false);
    expect(r.score).toBe(0);
    expect(r.value).toBeNull();
    expect(r.nextStep).toMatchObject({ delta: 1, toScore: 1 });
    near(r.nextStep!.points, 0.3);
    near(r.toTop!.points, 1.2);
    expect(r.cta).toBe("QUALITATIVE");
    // The predictor's gainPerUnit for a qualitative metric: min(1, 4 − 0) × 30 ÷ 100.
    near(gainPerUnit(metrics[2]!, TODAY.facts, 0, 100), 0.3);
  });

  it("scoring it 2 moves the step to 3 and the CGPA by 2 × 30 ÷ 100 = 0.60, from 1.994 to 2.594, printed 2.59", () => {
    const scored = { ...TODAY, ql: { "7.2.1": 2 } };
    expect(byCode("7.2.1").toTop!.points).toBeGreaterThan(0);
    const r = naacInsightsOf(fw, scored).find((i) => i.code === "7.2.1")!;
    expect(r.scored).toBe(true);
    expect(r.nextStep).toMatchObject({ toScore: 3 });
    near(exactCgpa(fw, simulateNaac(fw, scored).scores), 2.594, 10);
    expect(simulateNaac(fw, scored).cgpa).toBe(2.59);
  });

  it("a shared lever moves two metrics at once: one more full-time teacher lowers the PhD share's score and raises the student–teacher ratio's", () => {
    // 2.4.2 alone: 10 of 21 is 47.62 % → 2.5397 → 2.54 (−0.13 of a score). The ratio: 400 students over 20 teachers is 20 → 4;
    // over 21 is 19.05 → capped at 4, so there is no gain and the loss stands: (2.54 − 2.67) × 20 ÷ 100 = −0.026.
    const sttr = metric("2.2.2", "QN", 20, "STUDENT_TEACHER_RATIO");
    const two: NaacFramework = { ...fw, metrics: [metrics[0]!, sttr] };
    const inputs: NaacInputs = { facts: { phdNetTeachers: 10, fullTimeTeachers: 20, studentsLatest: 400 }, ql: {} };
    const net = (fte: number) => exactCgpa(two, simulateNaac(two, { ...inputs, facts: { ...inputs.facts, fullTimeTeachers: fte } }).scores);
    // (2.67 × 20 + 4 × 20) ÷ 40 = 3.335 today; (2.54 × 20 + 4 × 20) ÷ 40 = 3.27 with 21.
    expect(net(20)).toBeCloseTo(3.335, 10);
    expect(net(21)).toBeCloseTo(3.27, 10);
  });
});

describe("the path to the next band sums to at least the distance", () => {
  it("to B (2.01, 0.02 away): one MoU step, 3 MoUs, adds 0.18 ≥ 0.02 and lands at 2.17 (217.4 ÷ 100 = 2.174)", () => {
    const path = pathToBand(fw, TODAY, 2.01);
    expect(path.reachable).toBe(true);
    expect(path.steps).toHaveLength(1);
    expect(path.steps[0]).toMatchObject({ code: "3.4.2", kind: "QN", units: 3, delta: 3 });
    near(path.steps[0]!.points, 0.18);
    near(path.points, 0.18);
    expect(path.points).toBeGreaterThanOrEqual(0.02);
    expect(path.cgpaAfter).toBe(2.17);
  });

  it("to B+ (2.51, 0.52 away): MoUs to 8 (0.18), MoUs to 10 (0.12), PhD teachers to 12 (0.106), to 15 (0.16) = 0.566 ≥ 0.52, 256 ÷ 100 = 2.56", () => {
    // Greedy by what a step adds per unit: MoUs 0.06 twice, then the teachers 0.053 twice; the survey's 0.015 is never reached.
    const path = pathToBand(fw, TODAY, 2.51);
    expect(path.reachable).toBe(true);
    expect(path.steps.map((s) => [s.code, s.units])).toEqual([["3.4.2", 5], ["2.4.2", 5]]);
    near(path.steps[0]!.points, 0.3);
    near(path.steps[1]!.points, 0.266);
    near(path.points, 0.566);
    expect(path.points).toBeGreaterThanOrEqual(0.52);
    expect(path.cgpaAfter).toBe(2.56);
  });

  it("to A (3.01, 1.02 away): the quantitative steps run out at 2.80 (280 ÷ 100), and the qualitative metric's first step (0.30) is what crosses it, 3.10", () => {
    // Every quantitative metric at 4: 80 + 80 + 60 + 60 = 280 ÷ 100 = 2.80; the unscored 7.2.1 to 1 adds 30 ÷ 100.
    const path = pathToBand(fw, TODAY, 3.01);
    expect(path.reachable).toBe(true);
    expect(path.steps.map((s) => [s.code, s.kind, s.units])).toEqual([["3.4.2", "QN", 5], ["2.4.2", "QN", 5], ["2.7.1", "QN", 16], ["7.2.1", "QL", 1]]);
    near(path.steps.reduce((a, s) => a + s.points, 0), 0.3 + 0.266 + 0.24 + 0.3);
    near(path.points, 1.106);
    expect(path.points).toBeGreaterThanOrEqual(1.02);
    expect(path.cgpaAfter).toBe(3.1);
  });

  it("a band no step can reach says so: the framework's ceiling is 4.00 (every metric at 4), so a band at 4.01 is never reached", () => {
    // Every metric at 4 gives 400 ÷ 100 = 4.00; 4.01 is out of reach however many steps are taken.
    const path = pathToBand(fw, TODAY, 4.01);
    expect(path.reachable).toBe(false);
    expect(path.cgpaAfter).toBe(4);
  });
});

/**
 * THE NBA SAR, UG ENGINEERING. The figures: 300 students (S) and 20 faculty
 * counted as F = 15 for the ratio; first-year intake 60, 45 admitted; success
 * without backlogs 0.60, stipulated period not yet known; the third year's API
 * 6.0, the second and first years not yet known; placement index 0.50; cadre
 * 1 professor, 3 associates, 8 assistants; 3 PhDs and 10 master's; first year
 * 120 students to 5 faculty. Items hold their own arithmetic (council-rules.ts):
 */
const NBA: NbaInputs = {
  S: 300, F: 15, intake: 60, admitted: 45,
  successNoBacklog: 0.6, successStipulated: null, apiFirst: null, apiSecond: null, apiThird: 6, placement: 0.5,
  professors: 1, associates: 3, assistants: 8, phd: 3, masters: 10, firstYearStudents: 120, firstYearFaculty: 5,
  self: { "1": 30, "2": 200 },
};

describe("the NBA SAR's items, by hand", () => {
  const marks = nbaMarks(NBA);
  it("each computed item's marks", () => {
    // 4.1: 45 ÷ 60 = 75 % → the 70 % row, 16.
    expect(marks["4.1"]).toBe(16);
    // 4.2.1: 25 × 0.60 = 15; 4.2.2: nothing finished, 0.
    expect(marks["4.2.1"]).toBe(15);
    expect(marks["4.2.2"]).toBe(0);
    // 4.3: 1.5 × 6.0 = 9; 4.4 and 8.3: no API, 0.
    expect(marks["4.3"]).toBe(9);
    expect(marks["4.4"]).toBe(0);
    expect(marks["8.3"]).toBe(0);
    // 4.5: 40 × 0.5 = 20.
    expect(marks["4.5"]).toBe(20);
    // 5.1: 300 ÷ 15 = 20 → 20 − (20 − 15) = 15.
    expect(marks["5.1"]).toBe(15);
    // 5.2: RF = 300 ÷ 20 = 15; RF1 = 15 ÷ 9, RF2 = 30 ÷ 9, RF3 = 90 ÷ 9 = 10; (1 ÷ 1.6667 + 0.6 × 3 ÷ 3.3333 + 0.4 × 8 ÷ 10) × 12.5 = (0.6 + 0.54 + 0.32) × 12.5 = 18.25.
    expect(marks["5.2"]).toBe(18.25);
    // 5.3: FQ = 2.5 × (10 × 3 + 4 × 10) ÷ 15 = 2.5 × 70 ÷ 15 = 11.6667 → 11.67.
    expect(marks["5.3"]).toBe(11.67);
    // 8.1: 120 ÷ 5 = 24 → between 20 and 25: 3.
    expect(marks["8.1"]).toBe(3);
  });

  it("the totals: computed 16 + 15 + 0 + 9 + 0 + 20 + 15 + 18.25 + 11.67 + 3 + 0 = 107.92; self 30 + min(120, 200) = 150; total 257.92 of the sheet's maximum", () => {
    const t = nbaTotals(NBA);
    expect(t.computed).toBe(107.92);
    expect(t.self).toBe(150);
    expect(t.total).toBe(257.92);
    expect(t.max).toBe(NBA_SAR_ITEMS.reduce((a, i) => a + i.marks, 0));
    expect(t.max).toBe(1000);
  });
});

describe("the NBA insights: the cheapest criterion to raise", () => {
  const rows = nbaInsightsOf(NBA);
  const by = (c: string) => rows.find((r) => r.code === c)!;

  it("5.2 the cadre comes first: a second professor takes 18.25 to 25.75, capped at 25, so +6.75 for one teacher", () => {
    // 2 ÷ 1.6667 = 1.2; (1.2 + 0.54 + 0.32) × 12.5 = 25.75 → 25.
    expect(rows[0]!.code).toBe("5.2");
    expect(rows[0]!.nextStep).toMatchObject({ delta: 1, toValue: 2, toScore: 25 });
    near(rows[0]!.nextStep!.points, 6.75, 2);
    near(rows[0]!.efficiency, 6.75, 2);
    expect(rows[0]!.cta).toBe("FACULTY_RECORDS");
  });

  it("the whole order of the computed items by marks per unit: 5.2 6.75, 8.1 2.0, 5.3 1.66, 5.1 1.25, 4.1 0.67, 4.5 0.4, 4.2.1 0.25, 4.3 0.15, then the three with no figure yet", () => {
    expect(rows.filter((r) => r.computed).map((r) => r.code)).toEqual(["5.2", "8.1", "5.3", "5.1", "4.1", "4.5", "4.2.1", "4.3", "4.2.2", "4.4", "8.3"]);
  });

  it("8.1: one more first-year teacher makes 120 ÷ 6 = 20 → 5 marks, +2", () => {
    expect(by("8.1").nextStep).toMatchObject({ delta: 1, toValue: 6, toScore: 5 });
    near(by("8.1").nextStep!.points, 2, 2);
  });

  it("5.3: one more PhD: 2.5 × (40 + 40) ÷ 15 = 13.33, +1.66; full marks (25) need 10p + 40 ≥ 150, 11 PhDs, 8 more, +13.33", () => {
    expect(by("5.3").nextStep).toMatchObject({ delta: 1, toValue: 4, toScore: 13.33 });
    near(by("5.3").nextStep!.points, 1.66, 2);
    expect(by("5.3").toTop).toMatchObject({ delta: 8, toValue: 11, toScore: 25 });
    near(by("5.3").toTop!.points, 13.33, 2);
  });

  it("5.1: one more teacher, 300 ÷ 16 = 18.75 → 20 − 3.75 = 16.25, +1.25; to full marks the ratio must be 15, F = 20, 5 more, +5", () => {
    expect(by("5.1").nextStep).toMatchObject({ delta: 1, toValue: 16, toScore: 16.25 });
    near(by("5.1").nextStep!.points, 1.25, 2);
    expect(by("5.1").toTop).toMatchObject({ delta: 5, toValue: 20, toScore: 20 });
  });

  it("4.1: the next row is 80 % of 60 = 48 admitted, 3 more: 18 marks, +2; full marks at 90 % = 54, 9 more, +4", () => {
    expect(by("4.1").nextStep).toMatchObject({ delta: 3, toValue: 48, toScore: 18 });
    expect(by("4.1").toTop).toMatchObject({ delta: 9, toValue: 54, toScore: 20 });
  });

  it("an index is moved a percentage point at a time: 4.2.1 needs 0.64 for a whole mark (25 × 0.64 = 16): 4 points; 4.5 needs 0.53 (40 × 0.53 = 21.2): 3 points, +1.2", () => {
    expect(by("4.2.1").nextStep).toMatchObject({ delta: 0.04, toValue: 0.64, toScore: 16 });
    expect(by("4.2.1").unit).toBe("percentPoint");
    expect(by("4.5").nextStep).toMatchObject({ delta: 0.03, toValue: 0.53, toScore: 21.2 });
    near(by("4.5").nextStep!.points, 1.2, 2);
    // 4.3: 6.0 → 6.7 (1.5 × 6.7 = 10.05), seven tenths, +1.05.
    expect(by("4.3").nextStep).toMatchObject({ delta: 0.7, toValue: 6.7, toScore: 10.05 });
  });

  it("an item with no figure (no batch finished) has no step and 0 efficiency", () => {
    for (const c of ["4.2.2", "4.4", "8.3"]) {
      expect(by(c).nextStep).toBeNull();
      expect(by(c).efficiency).toBe(0);
      expect(by(c).marks).toBe(0);
    }
  });

  it("the self-assessed criteria follow, unwritten first by the marks left: 10 (120) before 6 (80); '1' written at 30 of 60 after them; '2' at its cap is gone", () => {
    const self = rows.filter((r) => !r.computed);
    expect(self[0]!.code).toBe("10");
    expect(self[1]!.code).toBe("6");
    expect(self.map((r) => r.code)).not.toContain("2");
    expect(self.at(-1)!.code).toBe("1");
    expect(self.at(-1)).toMatchObject({ marks: 30, max: 60 });
    expect(self.at(-1)!.nextStep).toMatchObject({ points: 30 });
  });

  it("an item at full marks is not listed: 5.1 at 15 ÷ 1 → with F = 20 it is 20 of 20", () => {
    expect(nbaInsightsOf({ ...NBA, F: 20 }).map((r) => r.code)).not.toContain("5.1");
  });
});

/**
 * NIRF. THE STRONG COLLEGE: 40 faculty to an intake of 1,000, 40 % with a PhD,
 * by experience 30 % / 30 % / 40 %, 30 % placed and 10 % in higher studies,
 * 60 % passing in time, 40 % women students and 10 % women faculty.
 */
const NIRF: NirfInputs = { faculty: 40, intake: 1000, phdPct: 40, f1: 0.3, f2: 0.3, f3: 0.4, placedPct: 30, higherPct: 10, passInTimePct: 60, womenStudentsPct: 40, womenFacultyPct: 10 };
const WEAK: NirfInputs = { faculty: 20, intake: 1000, phdPct: 20, f1: 0.6, f2: 0.2, f3: 0.2, placedPct: 20, higherPct: 10, passInTimePct: 40, womenStudentsPct: 30, womenFacultyPct: 10 };

describe("the NIRF sub-scores, by hand", () => {
  it("FSR 30 × 20 × (40 ÷ 1000) = 24; FQE = 10 × 40 ÷ 75 + (3 × 0.9 + 3 × 0.9 + 4 × 1) = 5.33 + 9.4 = 14.73; GPH 40 × (0.3 + 0.1) = 16; GUE 40 × 60 ÷ 80 = 30; WD 15 × 0.8 + 15 × 0.5 = 19.5", () => {
    expect(nirfSubs(NIRF)).toEqual({ FSR: 24, FQE: 14.73, GPH: 16, GUE: 30, WD: 19.5 });
    expect(nirfScore(NIRF).subs).toEqual({ FSR: 24, FQE: 14.73, GPH: 16, GUE: 30, WD: 19.5 });
  });

  it("the parameters: TLR 24 + 14.73 = 38.73, GO 16 + 30 = 46, OI 19.5; partial 38.73 × 0.4 + 46 × 0.25 + 19.5 × 0.1 = 15.49 + 11.5 + 1.95 = 28.94 of 43 covered (20 + 20 + 3)", () => {
    const s = nirfScore(NIRF);
    expect(s.parameters.find((p) => p.code === "TLR")).toMatchObject({ marks: 38.73, covered: 50 });
    expect(s.parameters.find((p) => p.code === "GO")).toMatchObject({ marks: 46, covered: 80 });
    expect(s.parameters.find((p) => p.code === "OI")).toMatchObject({ marks: 19.5, covered: 30 });
    expect(s.partial).toBe(28.94);
    expect(s.coveredMarks).toBe(43);
    // 28.94 ÷ 43 × 100 = 67.30 → at or above 57: the top-hundred reading, with no band above.
    expect(s.projected).toBe(67.3);
    expect(s.band?.code).toBe("TOP_100");
    expect(s.nextBand).toBeNull();
  });

  it("the weaker college: FSR 12, FQE 2.67 + 7.2 = 9.87, GPH 12, GUE 20, WD 16.5; partial 21.87 × 0.4 + 32 × 0.25 + 16.5 × 0.1 = 18.40; 18.40 ÷ 43 × 100 = 42.79, below 47; the next band is 201–300 at 47, 4.21 away", () => {
    expect(nirfSubs(WEAK)).toEqual({ FSR: 12, FQE: 9.87, GPH: 12, GUE: 20, WD: 16.5 });
    const s = nirfScore(WEAK);
    expect(s.partial).toBe(18.4);
    expect(s.projected).toBe(42.79);
    expect(s.band?.code).toBe("BELOW");
    expect(s.nextBand).toEqual({ code: "B201_300", min: 47, distance: 4.21 });
  });

  it("a fact the college has not recorded leaves its sub-parameter out, not at zero", () => {
    const s = nirfScore({ ...NIRF, faculty: null });
    expect(s.subs.FSR).toBeNull();
    expect(s.subs.GPH).toBe(16);
    // TLR now holds only FQE (20 covered), so the cover falls to 20 × 0.4 + 20 + 3 = 31.
    expect(s.coveredMarks).toBe(31);
  });
});

describe("the NIRF sub-parameter moves, by hand", () => {
  const rows = nirfInsightsOf(NIRF);
  const by = (c: string) => rows.find((r) => r.code === c)!;

  it("FSR: one more teacher adds 30 × 20 × 41 ÷ 1000 − 24 = 0.60 (under a mark); 42 gives 25.2, +1.2, two teachers, 1.2 × 0.4 = 0.48 of the score", () => {
    expect(by("FSR").nextStep).toMatchObject({ delta: 2, toValue: 42, toScore: 25.2 });
    near(by("FSR").nextStep!.points, 0.48);
    // Full marks (30): 30 × 20 × f ÷ 1000 ≥ 30 → f ≥ 50, ten more, 6 × 0.4 = 2.4.
    expect(by("FSR").toTop).toMatchObject({ delta: 10, toValue: 50, toScore: 30 });
    near(by("FSR").toTop!.points, 2.4);
  });

  it("FQE: a teacher with a PhD is 100 ÷ 40 = 2.5 points of the share; three of them (47.5 %) lift 5.33 to 6.33, FQE 14.73 → 15.73, +1.00, 0.40 of the score", () => {
    expect(by("FQE").unit).toBe("phdTeacher");
    expect(by("FQE").nextStep).toMatchObject({ delta: 7.5, toValue: 47.5, toScore: 15.73 });
    near(by("FQE").nextStep!.points, 0.4);
  });

  it("GUE: 2 points more in time, 40 × 62 ÷ 80 = 31 against 30, +1, 0.25 of the score; GPH: 3 points more placed, 40 × 0.43 = 17.2, +1.2, 0.30", () => {
    expect(by("GUE").nextStep).toMatchObject({ delta: 2, toValue: 62, toScore: 31 });
    near(by("GUE").nextStep!.points, 0.25);
    expect(by("GPH").nextStep).toMatchObject({ delta: 3, toValue: 33, toScore: 17.2 });
    near(by("GPH").nextStep!.points, 0.3);
  });

  it("WD: women faculty are at 10 %, below the 20 % that earns the full 15, so they are the lever: 12 % gives 15 × 0.6 = 9, WD 19.5 → 21, +1.5, 0.15 of the score", () => {
    expect(by("WD").lever).toBe("womenFacultyPct");
    expect(by("WD").nextStep).toMatchObject({ delta: 2, toValue: 12, toScore: 21 });
    near(by("WD").nextStep!.points, 0.15);
  });

  it("ranked by score points per unit: FSR 0.24, FQE 0.133, GUE 0.125, GPH 0.1, WD 0.075; the sub-parameters NIRF does not publish come last with no step", () => {
    expect(rows.slice(0, 5).map((r) => r.code)).toEqual(["FSR", "FQE", "GUE", "GPH", "WD"]);
    near(by("FSR").efficiency, 0.24);
    near(by("FQE").efficiency, 0.4 / 3);
    near(by("GUE").efficiency, 0.125);
    near(by("GPH").efficiency, 0.1);
    near(by("WD").efficiency, 0.075);
    const rest = rows.slice(5);
    expect(rest.length).toBeGreaterThan(0);
    for (const r of rest) {
      expect(r.nextStep).toBeNull();
      expect(r.marks).toBeNull();
    }
    expect(rest.map((r) => r.code)).toEqual(expect.arrayContaining(["SS", "FRU", "PU", "QP", "GMS", "RD", "ESCS", "PCS", "PR"]));
  });

  it("a sub-parameter at its full marks is not listed: GUE with 80 % passing in time is 40 of 40", () => {
    expect(nirfInsightsOf({ ...NIRF, passInTimePct: 80 }).map((r) => r.code)).not.toContain("GUE");
  });
});

describe("the engine is pure: it reads no server module", () => {
  it("imports only the contracts and the two rule files, so the simulator can ship it to the browser", () => {
    const src = readFileSync(join(__dirname, "..", "src", "lib", "accreditation-insights.ts"), "utf8");
    const imports = [...src.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    expect(imports.sort()).toEqual(["./council-rules", "./iqac-rules", "@edulink/contracts"]);
    expect(src).not.toMatch(/@prisma|node:|server-only|next\/|@\/lib\/(db|session|prisma)/);
  });
});
