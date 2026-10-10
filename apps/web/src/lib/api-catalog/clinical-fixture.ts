/**
 * The fixed ids of the clinical desk's ZZ fixture (scripts/zz-clinical.ts writes
 * the rows with them; R-56, the clinical half, 10 Oct 2026), so the catalog's
 * samples, the suite and a walk can name a posting or an entry. Each is in the
 * shape the contracts' cuid check accepts. Only ZZ data: every row is ZZ
 * Dhanvantari Nursing College's, so the sweep's Vidya actors are answered 404
 * at the tenant fence (a write there is refused for its empty body first).
 *
 *   college        ZZ Dhanvantari Nursing College (zz-dhanvantari-college), HEALTH_SCIENCES
 *   department     its nursing department; programme BSCN (INC), scheme, the division "ZZ SY BSc Nursing A"
 *   site(1)        ZZ Civil Hospital, Pune, with departments(1) Medical ward and (2) Surgical ward
 *   posting(1..2)  rotation 1 (Medical ward, running today, zz.faculty.d2 supervising) and 2 (Surgical ward, ahead, zz.faculty.d1)
 *   entry(1..4)    zz.cstudent.d1's SIGNED and RETURNED entries, d2's SUBMITTED, d3's DRAFT, all of posting 1
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const CLINICAL_FIXTURE = {
  college: pad("zzclncoll", 1),
  department: pad("zzclndept", 1),
  programme: pad("zzclnprog", 1),
  scheme: pad("zzclnschm", 1),
  division: pad("zzclndiv", 1),
  site: (n: number) => pad("zzclnsite", n),
  ward: (n: number) => pad("zzclnward", n),
  posting: (n: number) => pad("zzclnpost", n),
  entry: (n: number) => pad("zzclnentry", n),
} as const;
