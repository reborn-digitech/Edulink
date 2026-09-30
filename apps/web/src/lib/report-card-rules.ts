import type { CardSubject, ExamKindWeights, GradeBand, ReportCardConfig, ReportCardLayout } from "@edulink/contracts";
import { dictionaryFor, translatorFor, type TranslationKey } from "@edulink/i18n";

/**
 * The arithmetic of a configurable report card, with no database in it, so
 * a test can pin every rule and the fixtures can build a card the way the
 * app would.
 *
 * A SUBJECT'S PERCENT is its papers combined by the weight of their kind
 * (unit test, mid-term, final) inside the term, renormalised over the kinds
 * the subject actually has; a school whose weights are all zero gets marks
 * over maximum, which is what a parent with a calculator can reproduce. AN
 * ANNUAL CARD combines each term's subject percent by the term's share of
 * the year. A BAND is read off the scale by percent, highest band first.
 */
export type ExamKindKey = keyof ExamKindWeights;

/**
 * THE DEFAULTS SPEAK THE SCHOOL'S LANGUAGE. A band's descriptor, a
 * co-scholastic area, the signature labels — the office edits them as text
 * and the card prints that text, so the words a school starts from come out
 * of the dictionary in its own locale rather than in English. `Words` is a
 * translator narrowed to the `reportCardDefaults` block; the English one is
 * the fallback for callers with no locale in hand (the fixtures, the tests).
 */
export type Words = (key: string) => string;
const englishWords: Words = (key) => translatorFor(dictionaryFor("en"))(key as TranslationKey);
const w = (words: Words, key: string) => words(`reportCardDefaults.${key}`);

export function presetsFor(words: Words = englishWords): { key: string; name: string; bands: GradeBand[] }[] {
  return [
    {
      key: "cbse8",
      name: w(words, "presetCbse8"),
      bands: [
        { label: "A1", minPercent: 91, points: 10, descriptor: w(words, "outstanding") },
        { label: "A2", minPercent: 81, points: 9, descriptor: w(words, "excellent") },
        { label: "B1", minPercent: 71, points: 8, descriptor: w(words, "veryGood") },
        { label: "B2", minPercent: 61, points: 7, descriptor: w(words, "good") },
        { label: "C1", minPercent: 51, points: 6, descriptor: w(words, "fair") },
        { label: "C2", minPercent: 41, points: 5, descriptor: w(words, "average") },
        { label: "D", minPercent: 33, points: 4, descriptor: w(words, "belowAverage") },
        { label: "E", minPercent: 0, points: null, descriptor: w(words, "needsImprovement") },
      ],
    },
    {
      key: "mh5",
      name: w(words, "presetMh5"),
      bands: [
        { label: "A", minPercent: 75, points: null, descriptor: w(words, "distinction") },
        { label: "B", minPercent: 60, points: null, descriptor: w(words, "firstClass") },
        { label: "C", minPercent: 45, points: null, descriptor: w(words, "secondClass") },
        { label: "D", minPercent: 35, points: null, descriptor: w(words, "passClass") },
        { label: "E", minPercent: 0, points: null, descriptor: w(words, "notPassed") },
      ],
    },
    { key: "percent", name: w(words, "presetPercent"), bands: [] },
  ];
}

export function defaultLayoutFor(words: Words = englishWords): ReportCardLayout {
  return {
    font: "default",
    signerLeft: "NONE",
    signerRight: "NONE",
    showSeal: false,
    showAttendance: true,
    showPractice: true,
    showCoScholastic: true,
    showGradePoints: true,
    showAddress: true,
    showSignatures: true,
    showRemark: true,
    useBrandColour: true,
    signatureLeft: w(words, "classTeacher"),
    signatureRight: w(words, "principal"),
    headerNote: null,
    footerNote: null,
    paper: "A4",
  };
}

export function defaultConfigFor(words: Words = englishWords): ReportCardConfig {
  return {
    preset: "cbse8",
    bands: presetsFor(words)[0]!.bands,
    coScholastic: {
      areas: [w(words, "workEducation"), w(words, "artEducation"), w(words, "physicalEducation"), w(words, "discipline")],
      scale: [
        { label: "A", descriptor: w(words, "outstanding") },
        { label: "B", descriptor: w(words, "veryGood") },
        { label: "C", descriptor: w(words, "fair") },
      ],
    },
    kindWeights: { UNIT_TEST: 20, MID_TERM: 30, FINAL: 50 },
    layout: defaultLayoutFor(words),
  };
}

/** The English defaults, for code with no locale in hand. */
export const REPORT_CARD_PRESETS = presetsFor();
export const DEFAULT_LAYOUT = defaultLayoutFor();
export const DEFAULT_REPORT_CARD_CONFIG = defaultConfigFor();

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Bands highest first, labels unique, the lowest band starting at zero so every percent lands somewhere. */
export function normaliseBands(bands: GradeBand[]): GradeBand[] {
  const seen = new Set<string>();
  const out: GradeBand[] = [];
  for (const b of bands) {
    const key = b.label.trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ label: b.label.trim(), minPercent: Math.min(100, Math.max(0, b.minPercent)), points: b.points, descriptor: b.descriptor?.trim() || null });
  }
  out.sort((a, b) => b.minPercent - a.minPercent);
  if (out.length > 0) out[out.length - 1] = { ...out[out.length - 1]!, minPercent: 0 };
  return out;
}

export function normaliseConfig(input: ReportCardConfig, words: Words = englishWords): ReportCardConfig {
  const defaults = defaultLayoutFor(words);
  const areas = [...new Set(input.coScholastic.areas.map((a) => a.trim()).filter(Boolean))];
  const scaleSeen = new Set<string>();
  const scale = input.coScholastic.scale
    .map((g) => ({ label: g.label.trim(), descriptor: g.descriptor?.trim() || null }))
    .filter((g) => g.label && !scaleSeen.has(g.label.toUpperCase()) && scaleSeen.add(g.label.toUpperCase()));
  const bands = normaliseBands(input.bands);
  // A preset keeps its name while its labels, thresholds and points stand; the descriptors are the school's to reword.
  const shape = (list: GradeBand[]) => JSON.stringify(list.map((b) => [b.label.toUpperCase(), b.minPercent, b.points]));
  const preset = presetsFor(words).find((p) => p.key === input.preset && shape(p.bands) === shape(bands))?.key ?? (bands.length === 0 ? "percent" : "custom");
  return {
    preset,
    bands,
    coScholastic: { areas, scale },
    kindWeights: {
      UNIT_TEST: Math.min(100, Math.max(0, input.kindWeights.UNIT_TEST)),
      MID_TERM: Math.min(100, Math.max(0, input.kindWeights.MID_TERM)),
      FINAL: Math.min(100, Math.max(0, input.kindWeights.FINAL)),
    },
    layout: { ...defaults, ...input.layout, signatureLeft: input.layout.signatureLeft.trim() || defaults.signatureLeft, signatureRight: input.layout.signatureRight.trim() || defaults.signatureRight, headerNote: input.layout.headerNote?.trim() || null, footerNote: input.layout.footerNote?.trim() || null },
  };
}

/** The stored JSON, or the defaults; a malformed document never takes a page down. */
export function parseConfig(raw: string | null | undefined, words: Words = englishWords): ReportCardConfig {
  const fallback = defaultConfigFor(words);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<ReportCardConfig>;
    const merged: ReportCardConfig = {
      preset: typeof parsed.preset === "string" ? parsed.preset : fallback.preset,
      bands: Array.isArray(parsed.bands) ? parsed.bands : fallback.bands,
      coScholastic: {
        areas: Array.isArray(parsed.coScholastic?.areas) ? parsed.coScholastic.areas : fallback.coScholastic.areas,
        scale: Array.isArray(parsed.coScholastic?.scale) ? parsed.coScholastic.scale : fallback.coScholastic.scale,
      },
      kindWeights: { ...fallback.kindWeights, ...(parsed.kindWeights ?? {}) },
      layout: { ...fallback.layout, ...(parsed.layout ?? {}) },
    };
    return normaliseConfig(merged, words);
  } catch {
    return fallback;
  }
}

/**
 * The percent as the card prints it: one decimal, rounded the way `toFixed(1)`
 * rounds, so the number a reader sees and the number a band is read from are
 * the same number. Built from the string on purpose — `Math.round(x * 10) / 10`
 * and `toFixed(1)` part company on a few binary fractions, and the card
 * prints `toFixed`.
 */
export function shownPercent(percent: number | null): number | null {
  return percent === null ? null : Number(percent.toFixed(1));
}

/**
 * The band a percent falls in; null on a scale with no bands or for no percent.
 *
 * ⚠ THE CALLER ROUNDS FIRST. Pass `shownPercent(x)`, never the raw figure: a
 * card that prints "91.0 %" must carry the band of 91.0, and 90.96 banded raw
 * comes out one grade lower than the number beside it. Every letter on a
 * card — the overall, each subject, each paper — is read from the rounded
 * percent the card shows.
 */
export function bandFor(percent: number | null, bands: GradeBand[]): GradeBand | null {
  if (percent === null || bands.length === 0) return null;
  const sorted = [...bands].sort((a, b) => b.minPercent - a.minPercent);
  return sorted.find((b) => percent >= b.minPercent) ?? sorted[sorted.length - 1] ?? null;
}

export type PaperPart = { label: string; kind: string; scoreMilli: number | null; pointsMilli: number | null };

/**
 * A subject's papers combined by the weight of their kind. Unmarked papers are
 * left out rather than counted as nought: a test not sat is not a mark of zero.
 */
export function kindWeighted(parts: PaperPart[], weights: ExamKindWeights): { percent: number | null; method: "weighted" | "exams"; parts: CardSubject["parts"] } {
  const marked = parts.filter((p) => p.scoreMilli !== null && p.pointsMilli !== null && p.pointsMilli > 0);
  const byKind = new Map<string, { score: number; max: number }>();
  for (const p of marked) {
    const k = byKind.get(p.kind) ?? { score: 0, max: 0 };
    k.score += p.scoreMilli!;
    k.max += p.pointsMilli!;
    byKind.set(p.kind, k);
  }
  const partView = (p: PaperPart, weight: number | null) => ({
    label: p.label,
    kind: p.kind,
    scoreMilli: p.scoreMilli,
    pointsMilli: p.pointsMilli,
    percent: p.scoreMilli !== null && p.pointsMilli ? round2((p.scoreMilli / p.pointsMilli) * 100) : null,
    weight,
  });
  if (marked.length === 0) return { percent: null, method: "exams", parts: parts.map((p) => partView(p, null)) };
  const weightOf = (kind: string) => (weights as Record<string, number>)[kind] ?? 0;
  const sumW = [...byKind.keys()].reduce((a, k) => a + weightOf(k), 0);
  if (sumW <= 0) {
    const score = marked.reduce((a, p) => a + p.scoreMilli!, 0);
    const max = marked.reduce((a, p) => a + p.pointsMilli!, 0);
    return { percent: round2((score / max) * 100), method: "exams", parts: parts.map((p) => partView(p, null)) };
  }
  let percent = 0;
  for (const [kind, k] of byKind) percent += (weightOf(kind) / sumW) * ((k.score / k.max) * 100);
  return {
    percent: round2(percent),
    method: "weighted",
    parts: parts.map((p) => {
      const k = byKind.get(p.kind);
      if (!k || p.scoreMilli === null || !p.pointsMilli) return partView(p, null);
      // The kind's share, split among its papers by their maximum marks.
      return partView(p, round2((weightOf(p.kind) / sumW) * 100 * (p.pointsMilli / k.max)));
    }),
  };
}

export type TermPart = { termId: string; name: string; percent: number | null; weightPercent: number | null };

/** Terms combined by their share of the year; equal shares when no term has one. */
export function combineTerms(terms: TermPart[]): { percent: number | null; parts: { termId: string; name: string; percent: number | null; weight: number | null }[] } {
  const present = terms.filter((t) => t.percent !== null);
  if (present.length === 0) return { percent: null, parts: terms.map((t) => ({ termId: t.termId, name: t.name, percent: t.percent, weight: null })) };
  const anyWeight = present.some((t) => t.weightPercent !== null && t.weightPercent > 0);
  const raw = present.map((t) => (anyWeight ? (t.weightPercent ?? 0) : 1));
  const sum = raw.reduce((a, b) => a + b, 0) || present.length;
  const shares = new Map(present.map((t, i) => [t.termId, (anyWeight ? raw[i]! : 1) / sum]));
  const percent = present.reduce((a, t) => a + (shares.get(t.termId) ?? 0) * t.percent!, 0);
  return {
    percent: round2(percent),
    parts: terms.map((t) => ({ termId: t.termId, name: t.name, percent: t.percent, weight: shares.has(t.termId) ? round2((shares.get(t.termId) ?? 0) * 100) : null })),
  };
}

/**
 * The mean of the subjects' grade points, when the scale carries any.
 *
 * ⚠ A SUBJECT WITH A RESULT AND NO POINTS STOPS THE MEAN. On a scale like
 * CBSE's the lowest band, E, carries no points. Leaving such a subject out
 * and averaging the rest gave a pupil who failed mathematics a HIGHER figure
 * than one who scraped a D in it: 9.5 over two subjects against 7.7 over
 * three. There is no honest mean over a subject the scale gives no number
 * to, so the card prints none, and the letters say the rest. A subject with
 * no result at all (nothing marked yet) is not a failure and is left out, as
 * it always was.
 */
export function meanPoints(subjects: { points: number | null; percent?: number | null }[]): number | null {
  const withPoints = subjects.filter((s) => s.points !== null);
  if (withPoints.length === 0) return null;
  if (subjects.some((s) => s.points === null && s.percent !== null && s.percent !== undefined)) return null;
  return round2(withPoints.reduce((a, s) => a + s.points!, 0) / withPoints.length);
}

/**
 * Whether a year's terms can be combined as they stand: every term has its
 * share, or none has. ONE TERM WITH A SHARE AND ANOTHER WITHOUT is an office
 * half-way through setting them, and combining then gave the term without a
 * share nothing at all — a whole term's marks off the annual card with
 * nothing on the card to say so. A share of nought is a share: a term the
 * school has said counts for nothing.
 */
export function termSharesComplete(terms: { weightPercent: number | null }[]): boolean {
  const withShare = terms.filter((t) => t.weightPercent !== null && t.weightPercent > 0).length;
  if (withShare === 0) return true;
  return terms.every((t) => t.weightPercent !== null);
}

/** The overall percent: the mean of the subjects' percents. */
export function meanPercent(subjects: { percent: number | null }[]): number | null {
  const withPercent = subjects.filter((s) => s.percent !== null);
  if (withPercent.length === 0) return null;
  return round2(withPercent.reduce((a, s) => a + s.percent!, 0) / withPercent.length);
}
