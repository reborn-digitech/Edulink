/**
 * WHAT THE PRACTICE PAGE LISTS (B-13, campaign of 4 October 2026). The topic
 * list is the whole shared bank — nearly four hundred chapters from Class 3
 * to Class 12 and the placement banks — so a college student's page offered
 * the school's "Class 3 … Class 13" chips and ran to 48,364 px at 390 px.
 *
 * Now: at a college there are no class chips (a college student has no
 * school class; the placement banks' level is an internal number, not a
 * class) and the placement banks come first; everywhere the list is paged.
 * At a school the class chips and the own-grade default stay as they were.
 */
export const PRACTICE_PAGE_SIZE = 24;

export type PracticeListing<T> = {
  /** The class chips to offer; none at a college. */
  grades: number[];
  gradeNum: number | null;
  /** The subject chips: the chosen class's own lineup, or every subject. */
  subjects: string[];
  shown: T[];
  total: number;
  page: number;
  pages: number;
};

/** The placement banks (placement-student.ts) sit at this level in the shared catalogue. */
const COLLEGE_BANK_LEVEL = 13;

export function practiceListing<T extends { subject: string; classLevel: number }>(
  topics: T[],
  opts: { college: boolean; subject?: string; grade?: string; enrolledGrade: number | null; page?: string },
): PracticeListing<T> {
  const ordered = opts.college ? [...topics.filter((t) => t.classLevel === COLLEGE_BANK_LEVEL), ...topics.filter((t) => t.classLevel !== COLLEGE_BANK_LEVEL)] : topics;
  const grades = opts.college ? [] : [...new Set(topics.map((t) => t.classLevel))].sort((a, b) => a - b);
  // No explicit choice defaults to the child's OWN grade at a school; "all" is the way out.
  const gradeNum = opts.college || opts.grade === "all" ? null : opts.grade ? Number(opts.grade) || null : opts.enrolledGrade && grades.includes(opts.enrolledGrade) ? opts.enrolledGrade : null;
  const subjects = [...new Set(ordered.filter((t) => !gradeNum || t.classLevel === gradeNum).map((t) => t.subject))];
  const filtered = ordered.filter((t) => (!opts.subject || t.subject === opts.subject) && (!gradeNum || t.classLevel === gradeNum));
  const pages = Math.max(1, Math.ceil(filtered.length / PRACTICE_PAGE_SIZE));
  const asked = Number.parseInt(opts.page ?? "1", 10);
  const page = Number.isFinite(asked) ? Math.min(Math.max(1, asked), pages) : 1;
  return { grades, gradeNum, subjects, shown: filtered.slice((page - 1) * PRACTICE_PAGE_SIZE, page * PRACTICE_PAGE_SIZE), total: filtered.length, page, pages };
}
