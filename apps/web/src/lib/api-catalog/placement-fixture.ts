/**
 * The fixed ids of the ZZ placement rows at ZZ Vidya College
 * (scripts/zz-placement.ts writes them), so the API catalog's samples can
 * name a company, a drive, an offer, an internship, a project or a meet
 * without a field of their own in the sweep's fixture. Each is in the shape
 * the contracts' cuid check accepts. Only ZZ data.
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const PLACEMENT_FIXTURE = {
  /** ZZ Zeta Analytics, zz.recruiter01's company, verified. */
  company: pad("zzplcomp", 1),
  /** Last season's drive, CLOSED with offers; this season's, OPEN. */
  closedDrive: pad("zzpldrive", 1),
  openDrive: pad("zzpldrive", 2),
  /** zz.recruiter01's requirement to Vidya, already a drive (the open one): accepting it again answers that drive. */
  requirement: pad("zzplreq", 1),
  /** zz.calumni01's offer in the closed drive, accepted and joined. */
  offer: pad("zzploffer", 1),
  /** zz.cstudent02's internship in progress (approved, diary kept). */
  internship: pad("zzplintern", 1),
  project: pad("zzplproj", 1),
  meet: pad("zzplmeet", 1),
} as const;
