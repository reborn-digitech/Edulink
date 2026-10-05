/**
 * THE NBA SAR's FORMULAS (UG Engineering, Tier-II; nbaind.org), as pure
 * functions over counts, so a test computes them by hand. Each takes what
 * the rows give and returns the item's marks under the format's rule; the
 * item numbers are the format's (and NBA_SAR_ITEMS' in packages/contracts
 * v1/council-filings.ts). Where the rows give nothing to divide by, the
 * figure is null and the marks are 0 — the SAR is never credited for a
 * record the platform does not hold.
 *
 *   4.1  Enrolment ratio: first-year admissions over the sanctioned intake;
 *        ≥ 90 % 20 marks, ≥ 80 % 18, ≥ 70 % 16, ≥ 60 % 14, ≥ 50 % 12, else 0.
 *   4.2.1 Success without backlogs: 25 × the mean success index of up to
 *        three batches (graduated with no backlog ÷ admitted).
 *   4.2.2 Success in the stipulated period: 15 × the mean success index
 *        (graduated in the programme's duration ÷ admitted).
 *   4.3, 4.4, 8.3  Academic performance of a year of study: API = the mean
 *        grade point (10-point) of the successful students × successful ÷
 *        appeared; 4.3 and 4.4 give 1.5 × API (to 15), 8.3 gives API (to 10).
 *   4.5  Placement, higher studies and entrepreneurship: 40 × the mean
 *        placement index ((X + Y + Z) ÷ N, placement-analytics.ts's rule).
 *   5.1  Student–faculty ratio: 20 marks at 15:1 or better, falling evenly
 *        to 10 at 25:1, 0 beyond.
 *   5.2  Cadre proportion: required faculty RF = students ÷ 20 in the ratio
 *        1:2:6 (professor : associate : assistant); marks =
 *        (AF1/RF1 + 0.6 × AF2/RF2 + 0.4 × AF3/RF3) × 12.5, at most 25, and 0
 *        when there is neither a professor nor an associate professor.
 *   5.3  Faculty qualification: FQ = 2.5 × (10 X + 4 Y) ÷ F, X with a Ph.D.,
 *        Y with a master's (M.E./M.Tech.: the platform's "PG"), F the faculty
 *        the 20:1 ratio requires; at most 25.
 *   8.1  First-year student–faculty ratio: ≤ 20 5 marks, ≤ 25 3, else 0.
 */

export const round2 = (n: number) => Math.round(n * 100) / 100;
const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function enrolmentMarks(admitted: number, intake: number): { ratio: number | null; marks: number } {
  if (intake <= 0) return { ratio: null, marks: 0 };
  const ratio = round2((admitted / intake) * 100);
  const marks = ratio >= 90 ? 20 : ratio >= 80 ? 18 : ratio >= 70 ? 16 : ratio >= 60 ? 14 : ratio >= 50 ? 12 : 0;
  return { ratio, marks };
}

/** A batch's success index: graduated ÷ admitted, capped at 1; null for a batch nobody was admitted to. */
export const successIndex = (graduated: number, admitted: number) => (admitted > 0 ? Math.min(1, graduated / admitted) : null);

export function successMarks(indices: readonly (number | null)[], max: number): { mean: number | null; marks: number } {
  const m = mean(indices.filter((x): x is number => x !== null));
  return { mean: m === null ? null : round2(m), marks: m === null ? 0 : round2(max * m) };
}

/** API of a year of study: the successful students' mean grade point × the share who succeeded. */
export function academicPerformance(successfulGpas: readonly number[], appeared: number): number | null {
  if (appeared <= 0) return null;
  const m = mean(successfulGpas);
  return m === null ? 0 : round2(m * (successfulGpas.length / appeared));
}

export const apiMarks = (api: number | null, factor: number, max: number) => (api === null ? 0 : round2(Math.min(max, api * factor)));

export function placementMarks(indices: readonly (number | null)[]): { mean: number | null; marks: number } {
  return successMarks(indices, 40);
}

export function sfrMarks(students: number, faculty: number): { ratio: number | null; marks: number } {
  if (faculty <= 0) return { ratio: null, marks: 0 };
  const ratio = round2(students / faculty);
  const marks = ratio <= 15 ? 20 : ratio <= 25 ? round2(20 - (ratio - 15)) : 0;
  return { ratio, marks };
}

export function cadreMarks(students: number, professors: number, associates: number, assistants: number): number {
  const rf = students / 20;
  if (rf <= 0 || (professors === 0 && associates === 0)) return 0;
  const [rf1, rf2, rf3] = [rf / 9, (2 * rf) / 9, (6 * rf) / 9];
  return round2(Math.min(25, (professors / rf1 + 0.6 * (associates / rf2) + 0.4 * (assistants / rf3)) * 12.5));
}

export function qualificationMarks(students: number, phd: number, masters: number): { fq: number | null; marks: number } {
  const required = students / 20;
  if (required <= 0) return { fq: null, marks: 0 };
  const fq = round2(2.5 * ((10 * phd + 4 * masters) / required));
  return { fq, marks: Math.min(25, fq) };
}

export function firstYearSfrMarks(students: number, faculty: number): { ratio: number | null; marks: number } {
  if (faculty <= 0) return { ratio: null, marks: 0 };
  const ratio = round2(students / faculty);
  return { ratio, marks: ratio <= 20 ? 5 : ratio <= 25 ? 3 : 0 };
}
