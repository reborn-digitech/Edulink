/**
 * The fixed ids of the studio desk's ZZ fixture (scripts/zz-studio.ts writes
 * the rows with them at ZZ Vidya College, whose streams gain ARCHITECTURE),
 * so the API catalog's samples, the suite and the coordinator can name a
 * studio or a jury without a field of their own in the sweep's fixture. Each
 * is in the shape the contracts' cuid check accepts. Only ZZ data.
 *
 *   department / programme / scheme / course / offering
 *                   "ZZ Architecture", ZZ BArch (stream ARCHITECTURE, COA), its scheme, AR101
 *                   "ZZ Architectural Design I", offered this term by zz.faculty01 to
 *                   zz.cstudent01–03 (registered, no division: a shared offering)
 *   studio(1)       the studio on AR101 with its four stage days (brief 40 days back, pin-up 20
 *                   back, final 10 ahead, jury 14 ahead), coordinator zz.faculty01
 *   jury(1)         the interim jury 18 days back, chaired by zz.faculty01 with zz.faculty02 and
 *                   zz.hod01 on the panel and one external juror, SIGNED with marks for the three
 *   jury(2)         the final jury 14 days ahead, chaired by zz.faculty02, unsigned, no marks
 *   submission(1..3) zz.cstudent01's pin-up SUBMITTED, 02's LATE, 03's final DRAFT
 *   mark(1..3)      jury(1)'s marks for zz.cstudent01–03
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const STUDIO_FIXTURE = {
  department: pad("zzstdept", 1),
  programme: pad("zzstprog", 1),
  scheme: pad("zzstschm", 1),
  course: pad("zzstcrs", 1),
  offering: pad("zzstoff", 1),
  studio: (n: number) => pad("zzststudio", n),
  jury: (n: number) => pad("zzstjury", n),
  submission: (n: number) => pad("zzstsub", n),
  mark: (n: number) => pad("zzstmark", n),
} as const;
