/**
 * The fixed ids of the college homework fixture (R-48, the risks batch of
 * 5 October 2026; scripts/zz-college-homework.ts writes the rows with them),
 * so the API catalog's samples and the suite can name a piece of work without
 * a field of their own in the sweep's fixture. Only ZZ data, at ZZ Vidya College.
 *
 *   work(1)   PHY101 (offering 1, zz.faculty01): "ZZ Lab report 1", 20 points, published; zz.cstudent01
 *             handed it in and is marked 15, zz.cstudent02 handed it in and waits for a mark
 *   work(2)   PHY103 (offering 3, the elective shared across divisions, zz.hod01): "ZZ Elective reading",
 *             10 points, published, nothing handed in — the work with no class
 *   work(3)   PHY101: "ZZ Draft problem set", a draft the students cannot see
 *   submission(1|2)  the two hand-ins on work(1); grade(1) zz.cstudent01's mark
 */
const pad = (prefix: string, n: number) => `c${prefix}${String(n).padStart(20 - prefix.length, "0")}`;

export const COLLEGE_HOMEWORK_FIXTURE = {
  work: (n: number) => pad("zzhwwork", n),
  submission: (n: number) => pad("zzhwsub", n),
  grade: (n: number) => pad("zzhwgrade", n),
} as const;
