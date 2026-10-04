/**
 * The fixed ids of the college office's ZZ rows at ZZ Vidya College
 * (scripts/zz-college-office.ts writes them), so the catalog's samples can
 * name a round, an application in each state, a claim, a concession, a
 * hostel, a route or an e-resource without a field of their own in the
 * sweep's fixture. Each is in the shape the contracts' cuid check accepts.
 * Only ZZ data.
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const OFFICE_FIXTURE = {
  /** CAP round 1 of the 2026 intake, with five allotment rows imported. */
  round: pad("zzcround", 1),
  /** A merit round of the same intake, open for typed applications. */
  meritRound: pad("zzcround", 2),
  allotment: (n: number) => pad("zzcallot", n),
  /** Applications: one in scrutiny, one with its fee due, one admitted, one cancelled with its refund recorded. */
  applicationScrutiny: pad("zzcapp", 1),
  applicationFeeDue: pad("zzcapp", 2),
  applicationAdmitted: pad("zzcapp", 3),
  applicationCancelled: pad("zzcapp", 4),
  /** cstudent01's SANCTIONED claim and cstudent03's LAPSED one. */
  claimSanctioned: pad("zzcclaim", 1),
  claimLapsed: pad("zzcclaim", 2),
  /** A concession above the office's limit, already refused by the principal (deciding again answers it as it stands). */
  concessionDecided: pad("zzcconc", 1),
  hostel: pad("zzchostel", 1),
  room: (n: number) => pad("zzchroom", n),
  route: pad("zzcroute", 1),
  eResource: pad("zzceres", 1),
  intakeYear: 2026,
} as const;
