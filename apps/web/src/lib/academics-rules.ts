/**
 * The arithmetic of the college's academics (4 October 2026), with no
 * database and no session, so the suite, the data audit and every reader
 * share one reading of each rule.
 *
 *   - a lecture's attendance: late counts as attended; the percentage is
 *     attended over held, to one decimal, and null before anything is marked;
 *   - the projection: how many of the lectures still to come may be missed
 *     with the percentage kept at the threshold (negative: how many short
 *     even with full attendance);
 *   - the internal total: each component's marks over its maximum, times its
 *     weight, summed, in hundredths of a mark — the figure InternalLock
 *     freezes and data:audit recomputes;
 *   - outcome attainment on the NBA's three levels;
 *   - a course file's coverage against the term's elapsed fraction, on the
 *     syllabus module's rule (behind when two or more weeks short).
 */

export type Mark = "PRESENT" | "ABSENT" | "LATE";

export function attendedOf(marks: readonly string[]): { held: number; attended: number } {
  let attended = 0;
  for (const m of marks) if (m === "PRESENT" || m === "LATE") attended += 1;
  return { held: marks.length, attended };
}

/** Attended over held, to one decimal; null with nothing held. */
export function percentOf(attended: number, held: number): number | null {
  if (held <= 0) return null;
  return Math.round((attended / held) * 1000) / 10;
}

/**
 * How many of `remaining` lectures may be missed and the percentage still
 * reach `threshold` at the end of term: the largest m with
 * (attended + remaining − m) / (held + remaining) ≥ threshold %. Negative
 * when even full attendance falls short (by that many lectures).
 */
export function canMissMore(input: { attended: number; held: number; remaining: number; threshold: number }): number {
  const { attended, held, remaining, threshold } = input;
  const total = held + remaining;
  if (total === 0) return 0;
  // attended + remaining − m ≥ threshold/100 × total, in integers to dodge floating error.
  const need = Math.ceil((threshold * total) / 100 - 1e-9);
  const m = attended + remaining - need;
  return m >= 0 ? Math.min(m, remaining) : m;
}

/** Whether a student may sit: at or above the threshold, or condoned. A course with nothing held yet is not a shortfall. */
export function isEligible(percent: number | null, threshold: number, condoned: boolean): boolean {
  return condoned || percent === null || percent >= threshold;
}

export type ComponentRule = { id: string; maxMarks: number; weight: number };

/**
 * A student's internal total in hundredths of a mark: Σ marks/max × weight.
 * `marksTenths` by component id; a missing or null entry (absent) counts
 * nothing. Rounded once, at the end.
 */
export function internalTotalHundredths(components: readonly ComponentRule[], marksTenths: ReadonlyMap<string, number | null>): number {
  let sum = 0;
  for (const c of components) {
    const m = marksTenths.get(c.id);
    if (m === null || m === undefined || c.maxMarks <= 0) continue;
    // (m / 10) / max × weight × 100 = m × weight × 10 / max
    sum += (m * c.weight * 10) / c.maxMarks;
  }
  return Math.round(sum);
}

export const sumWeights = (components: readonly { weight: number }[]) => components.reduce((a, c) => a + c.weight, 0);

/** A course's credits: lecture, tutorial and practical credits added. */
export const creditsOf = (c: { creditsL: number; creditsT: number; creditsP: number }) => c.creditsL + c.creditsT + c.creditsP;

/** The share of a component's maximum that counts as attaining its outcomes. */
export const ATTAINMENT_TARGET_PERCENT = 60;

/** The NBA's levels: 3 when 70 % or more of the students reach the target, 2 at 60 %, 1 at 50 %, else 0. */
export function attainmentLevel(reached: number, assessed: number): number | null {
  if (assessed <= 0) return null;
  const share = (reached / assessed) * 100;
  return share >= 70 ? 3 : share >= 60 ? 2 : share >= 50 ? 1 : 0;
}

/** Direct and indirect combined, 80:20 as most affiliating universities ask; the direct alone while the exit survey is not in. */
export function combinedLevel(direct: number | null, indirect: number | null): number | null {
  if (direct === null) return indirect;
  if (indirect === null) return direct;
  return Math.round((direct * 0.8 + indirect * 0.2) * 100) / 100;
}

/** A programme outcome's attainment: the course outcomes mapped to it, weighted by the mapping's level (1–3). */
export function poAttainment(rows: readonly { coLevel: number | null; mapLevel: number }[]): number | null {
  let num = 0;
  let den = 0;
  for (const r of rows) {
    if (r.coLevel === null) continue;
    num += r.coLevel * r.mapLevel;
    den += r.mapLevel;
  }
  return den === 0 ? null : Math.round((num / den) * 100) / 100;
}

/** Days between two YYYY-MM-DD keys. */
export function daysBetweenKeys(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number) as [number, number, number];
  const [by, bm, bd] = b.split("-").map(Number) as [number, number, number];
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** How far through the term `today` is, 0–1. */
export function termElapsed(startsOn: string, endsOn: string, today: string): number {
  const span = daysBetweenKeys(startsOn, endsOn);
  if (span <= 0) return today >= endsOn ? 1 : 0;
  return Math.min(1, Math.max(0, daysBetweenKeys(startsOn, today) / span));
}

/** The syllabus module's rule: by now this many weeks should be taught; behind at two or more short. */
export function coverage(planned: number, taught: number, elapsed: number): { expected: number; behind: boolean } {
  const expected = Math.round(elapsed * planned);
  return { expected, behind: expected - taught >= 2 };
}

/** Two weekly slots clash when they fall on the same weekday and period. */
export const slotKey = (s: { weekday: number; periodId: string }) => `${s.weekday}|${s.periodId}`;

/** A faculty member's weekly load against the college's band. */
export function loadState(hours: number, min: number, max: number): "UNDER" | "WITHIN" | "OVER" {
  return hours > max ? "OVER" : hours < min ? "UNDER" : "WITHIN";
}

/** Marks typed by a person ("7.5", "AB" for absent) in tenths; undefined when it is not a number. */
export function parseMarks(raw: string): number | null | undefined {
  const v = raw.trim();
  if (/^(ab|abs|absent|-)$/i.test(v)) return null;
  if (!/^\d+(\.\d)?$/.test(v)) return undefined;
  return Math.round(Number(v) * 10);
}

/**
 * A term's registration window against today, the college's day key
 * (A3-journeys-28): a window that opens on 01/11 was listed as "Registration
 * closed" in October, which a registrar reads as missed. Not yet open, open
 * (the closing day included), or over.
 */
export function registrationWindow(opensOn: string, closesOn: string, today: string): "UPCOMING" | "OPEN" | "CLOSED" {
  if (today < opensOn) return "UPCOMING";
  return today <= closesOn ? "OPEN" : "CLOSED";
}
