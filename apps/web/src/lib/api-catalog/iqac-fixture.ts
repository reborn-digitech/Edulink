/**
 * The fixed ids of the ZZ IQAC rows at ZZ Vidya College (scripts/zz-iqac.ts
 * writes them), so the catalog's samples can name a cycle, a survey, a
 * grievance, a committee, a research item or a filing without a field of
 * their own in the sweep's fixture. Each in the shape a cuid check accepts.
 * Only ZZ data.
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const IQAC_FIXTURE = {
  cycle: pad("zziqaccycle", 1),
  /** The open SSS, and the closed course feedback with its responses. */
  openSurvey: pad("zziqacsurvey", 1),
  closedSurvey: pad("zziqacsurvey", 2),
  /** The open grievance and the resolved one (acting on the resolved one again is refused 409, a no-op). */
  openGrievance: pad("zziqacgriev", 1),
  resolvedGrievance: pad("zziqacgriev", 2),
  committee: (n: number) => pad("zziqaccomm", n),
  research: (n: number) => pad("zziqacres", n),
  activity: (n: number) => pad("zziqacact", n),
  /** The generated AQAR, signed off and filed. */
  aqar: pad("zziqacfiling", 1),
  /** A qualitative metric of the affiliated framework the fixture scored. */
  qualitativeMetric: "7.2.1",
} as const;
