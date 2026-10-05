/**
 * The fixed ids of the stream records' ZZ fixture (scripts/zz-stream-records.ts
 * writes the rows with them), so the API catalog's samples, the suite and the
 * coordinator can name a batch or a record without a field of their own in
 * the sweep's fixture. Each is in the shape the contracts' cuid check
 * accepts. Only ZZ data.
 *
 *   vidyaBatch(1)         ZZ Vidya College's division "ZZ FY BSc Physics A" as one lab batch A (its three students)
 *   vidyaPractical(1..3)  PHY101's experiment 1 for zz.cstudent01–03 (the first signed by zz.faculty01)
 *   nssActivity(1)        Vidya's NSS activity this year (a camp day, zz.cstudent01 and 02)
 *   squadVisit(1)         zz.faculty01's flying-squad visit to the paper F.schedule(3)'s hall
 *   shastri.*             ZZ Shastri's engineering department, programme, scheme, two courses with
 *                         practicals, their offerings in the Shastri term, a LAB room, the division
 *                         "ZZ FY BTech ME A" with zz.cstudent.s1–s3, batches A and B, and a practical
 *                         record on each of the three students
 *   posting(99)           a teaching-practice posting no row has (the observation door's sample: no
 *                         ZZ college has EDUCATION, so every caller is refused before it is read)
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const STREAM_RECORDS_FIXTURE = {
  vidyaBatch: (n: number) => pad("zzsrvbat", n),
  vidyaPractical: (n: number) => pad("zzsrvprac", n),
  nssActivity: (n: number) => pad("zzsrnssact", n),
  squadVisit: (n: number) => pad("zzsrsquad", n),
  posting: (n: number) => pad("zzsrpost", n),
  shastri: {
    department: pad("zzsrsdept", 1),
    programme: pad("zzsrsprog", 1),
    scheme: pad("zzsrsschm", 1),
    course: (n: number) => pad("zzsrscrs", n),
    offering: (n: number) => pad("zzsrsoff", n),
    room: pad("zzsrsroom", 1),
    division: pad("zzsrsdiv", 1),
    batch: (n: number) => pad("zzsrsbat", n),
    practical: (n: number) => pad("zzsrsprac", n),
  },
} as const;
