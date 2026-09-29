/**
 * The arithmetic of the configurable report card, with no database: bands
 * read off a scale, papers combined by the weight of their kind, terms
 * combined by their share of the year, and the rules document normalised.
 */
import { describe, expect, it } from "vitest";
import { bandFor, combineTerms, DEFAULT_REPORT_CARD_CONFIG, kindWeighted, meanPercent, meanPoints, termSharesComplete, normaliseConfig, parseConfig, REPORT_CARD_PRESETS } from "@/lib/report-card-rules";

const cbse = REPORT_CARD_PRESETS[0]!.bands;

describe("bands", () => {
  it("reads the band off the scale, highest first, the lowest catching everything", () => {
    expect(bandFor(95, cbse)?.label).toBe("A1");
    expect(bandFor(91, cbse)?.label).toBe("A1");
    expect(bandFor(90.99, cbse)?.label).toBe("A2");
    expect(bandFor(33, cbse)?.label).toBe("D");
    expect(bandFor(0, cbse)?.label).toBe("E");
    expect(bandFor(12, cbse)?.points).toBeNull();
    expect(bandFor(null, cbse)).toBeNull();
    expect(bandFor(80, [])).toBeNull();
  });

  it("normalises a typed scale: sorted, unique labels, the lowest band from zero", () => {
    const bands = normaliseConfig({
      ...DEFAULT_REPORT_CARD_CONFIG,
      preset: "custom",
      bands: [
        { label: "b", minPercent: 40, points: null, descriptor: " Good " },
        { label: "A", minPercent: 70, points: 4, descriptor: null },
        { label: "B", minPercent: 50, points: null, descriptor: null },
        { label: "c", minPercent: 20, points: null, descriptor: null },
      ],
    }).bands;
    expect(bands.map((b) => [b.label, b.minPercent])).toEqual([["A", 70], ["b", 40], ["c", 0]]);
    expect(bands[1]!.descriptor).toBe("Good");
  });

  it("keeps a preset's name only while its bands are untouched", () => {
    expect(normaliseConfig(DEFAULT_REPORT_CARD_CONFIG).preset).toBe("cbse8");
    expect(normaliseConfig({ ...DEFAULT_REPORT_CARD_CONFIG, bands: cbse.slice(1) }).preset).toBe("custom");
    expect(normaliseConfig({ ...DEFAULT_REPORT_CARD_CONFIG, bands: [] }).preset).toBe("percent");
  });

  it("parses the stored document and falls back to the defaults for junk or a blank", () => {
    expect(parseConfig(null)).toEqual(DEFAULT_REPORT_CARD_CONFIG);
    expect(parseConfig("{not json")).toEqual(DEFAULT_REPORT_CARD_CONFIG);
    const partial = parseConfig(JSON.stringify({ kindWeights: { FINAL: 70 }, layout: { paper: "LETTER" } }));
    expect(partial.kindWeights).toEqual({ UNIT_TEST: 20, MID_TERM: 30, FINAL: 70 });
    expect(partial.layout.paper).toBe("LETTER");
    expect(partial.layout.showSignatures).toBe(true);
    expect(partial.bands).toEqual(cbse);
  });
});

describe("a subject's papers by the weight of their kind", () => {
  const weights = { UNIT_TEST: 20, MID_TERM: 30, FINAL: 50 };
  it("renormalises over the kinds the subject has, and an unmarked paper is left out, not nought", () => {
    const r = kindWeighted(
      [
        { label: "UT 1", kind: "UNIT_TEST", scoreMilli: 20_000, pointsMilli: 25_000 },
        { label: "UT 2", kind: "UNIT_TEST", scoreMilli: null, pointsMilli: 25_000 },
        { label: "Mid-term", kind: "MID_TERM", scoreMilli: 60_000, pointsMilli: 80_000 },
      ],
      weights,
    );
    // Unit tests 80 %, mid-term 75 %; weights 20:30 → 40 % and 60 %.
    expect(r.method).toBe("weighted");
    expect(r.percent).toBe(77);
    expect(r.parts.map((p) => p.weight)).toEqual([40, null, 60]);
    expect(r.parts[1]!.percent).toBeNull();
  });

  it("splits a kind's share between its papers by their maximum marks", () => {
    const r = kindWeighted(
      [
        { label: "UT 1", kind: "UNIT_TEST", scoreMilli: 10_000, pointsMilli: 10_000 },
        { label: "UT 2", kind: "UNIT_TEST", scoreMilli: 15_000, pointsMilli: 30_000 },
        { label: "Final", kind: "FINAL", scoreMilli: 50_000, pointsMilli: 100_000 },
      ],
      weights,
    );
    // Unit tests together 25/40 = 62.5 %, final 50 %; 20:50 → 2/7 and 5/7.
    expect(r.percent).toBe(53.57);
    expect(r.parts.map((p) => p.weight)).toEqual([7.14, 21.43, 71.43]);
  });

  it("with every weight zero it is marks over maximum, the parent's calculator", () => {
    const r = kindWeighted(
      [
        { label: "UT 1", kind: "UNIT_TEST", scoreMilli: 20_000, pointsMilli: 25_000 },
        { label: "Mid-term", kind: "MID_TERM", scoreMilli: 60_000, pointsMilli: 80_000 },
      ],
      { UNIT_TEST: 0, MID_TERM: 0, FINAL: 0 },
    );
    expect(r.method).toBe("exams");
    expect(r.percent).toBe(76.19);
    expect(r.parts.every((p) => p.weight === null)).toBe(true);
  });

  it("nothing marked is no percent", () => {
    expect(kindWeighted([{ label: "UT", kind: "UNIT_TEST", scoreMilli: null, pointsMilli: 25_000 }], weights).percent).toBeNull();
  });
});

describe("terms by their share of the year", () => {
  it("uses the terms' weights, or equal shares when no term has one, and skips a term with no result", () => {
    expect(combineTerms([{ termId: "a", name: "Term 1", percent: 80, weightPercent: 40 }, { termId: "b", name: "Term 2", percent: 60, weightPercent: 60 }]).percent).toBe(68);
    expect(combineTerms([{ termId: "a", name: "Term 1", percent: 80, weightPercent: null }, { termId: "b", name: "Term 2", percent: 60, weightPercent: null }]).percent).toBe(70);
    const r = combineTerms([{ termId: "a", name: "Term 1", percent: 80, weightPercent: 40 }, { termId: "b", name: "Term 2", percent: null, weightPercent: 60 }]);
    expect(r.percent).toBe(80);
    expect(r.parts.map((p) => p.weight)).toEqual([100, null]);
  });

  it("means the subjects' percents and points", () => {
    expect(meanPercent([{ percent: 80 }, { percent: 60 }, { percent: null }])).toBe(70);
    expect(meanPoints([{ points: 10 }, { points: 9 }, { points: null }])).toBe(9.5);
    expect(meanPoints([{ points: null }])).toBeNull();
  });

  it("⚠ prints no mean of points over a subject the scale gives none to: a failure does not raise the figure", () => {
    const passedAll = [{ points: 10, percent: 95 }, { points: 9, percent: 85 }, { points: 4, percent: 35 }];
    const failedOne = [{ points: 10, percent: 95 }, { points: 9, percent: 85 }, { points: null, percent: 20 }];
    expect(meanPoints(passedAll)).toBe(7.67);
    expect(meanPoints(failedOne)).toBeNull();
    // Nothing marked yet is not a failure: the subject is left out, as it was.
    expect(meanPoints([{ points: 10, percent: 95 }, { points: 9, percent: 85 }, { points: null, percent: null }])).toBe(9.5);
    // A scale with no points at all has no mean, whatever the results.
    expect(meanPoints([{ points: null, percent: 80 }, { points: null, percent: 20 }])).toBeNull();
  });

  it("⚠ a year's terms combine only when every term has its share, or none has", () => {
    const shares = (...w: (number | null)[]) => termSharesComplete(w.map((weightPercent) => ({ weightPercent })));
    expect(shares(null, null)).toBe(true);
    expect(shares(40, 60)).toBe(true);
    expect(shares(100, 0)).toBe(true);
    expect(shares(0, 0)).toBe(true);
    expect(shares(40, null)).toBe(false);
    expect(shares(null, 60, null)).toBe(false);
    expect(shares()).toBe(true);
  });
});
