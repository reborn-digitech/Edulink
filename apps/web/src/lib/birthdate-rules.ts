import { ageInYears } from "./dates";

/**
 * WHAT A DATE OF BIRTH MAY BE ON AN ADMISSION (A3-journeys-5, audit of 5 October 2026).
 *
 * A date of birth of 12/12/2030 for grade 3 was accepted at application,
 * carried through the admission and printed on a bonafide certificate, and the
 * alumni list called the child "Under 18". Pure rules, so the school's
 * admissions, the college's and the tests read one answer.
 *
 * NOT IN THE FUTURE, anywhere. Compared as calendar days (the stored value is
 * a date-only instant at UTC midnight): today is allowed, tomorrow is not.
 *
 * A SCHOOL'S GRADE BAND. A child's age at the START OF THE ACADEMIC YEAR they
 * apply for must lie between the grade + 3 and the grade + 8 years: grade 1
 * takes 4 to 9, grade 10 takes 13 to 18. Wide on purpose — a child held back,
 * one who started early, a late admission after an illness — and narrow
 * enough that a slip of the decade (2030 for 2020, 2010 for 2018) is caught.
 * The early years sit below grade 1 on the same ladder (UKG as grade 0, LKG
 * as −1, nursery as −2). A grade the ladder does not know (a school's own
 * name for a class) is not checked.
 *
 * A COLLEGE: at least 14 years old on the day the application is made — a
 * floor, with no ceiling, because adults return to study.
 */

const EARLY_YEARS: Record<string, number> = {
  PLAYGROUP: -2, NURSERY: -2, "PRE-NURSERY": -2, "PRE-KG": -2,
  LKG: -1, "JR KG": -1, "JR. KG": -1, "JUNIOR KG": -1, KG1: -1,
  UKG: 0, "SR KG": 0, "SR. KG": 0, "SENIOR KG": 0, KG2: 0, KG: 0, K: 0, PREP: 0,
};

/** The grade as a rung: "3" → 3, "UKG" → 0, "Nursery" → −2; null for a name the ladder does not know. */
export function gradeRung(grade: string): number | null {
  const g = grade.trim().toUpperCase().replace(/^(GRADE|CLASS|STD\.?|STANDARD)\s+/, "");
  if (/^\d{1,2}$/.test(g)) {
    const n = Number(g);
    return n >= 1 && n <= 12 ? n : null;
  }
  return g in EARLY_YEARS ? EARLY_YEARS[g]! : null;
}

/** The ages (whole years at the start of the year) a school's grade takes; null when the grade is not on the ladder. */
export function gradeAgeBand(grade: string): { min: number; max: number } | null {
  const rung = gradeRung(grade);
  return rung === null ? null : { min: rung + 3, max: rung + 8 };
}

/** Whether a date-only birthdate lies after today (compared by calendar day, UTC, as it is stored). */
export function isFutureBirthdate(birthdate: Date, now: Date = new Date()): boolean {
  return birthdate.toISOString().slice(0, 10) > now.toISOString().slice(0, 10);
}

export type BirthdateProblem =
  | { kind: "future" }
  | { kind: "grade"; grade: string; min: number; max: number }
  | { kind: "tooYoung"; min: number };

/** A school applicant's date of birth against the grade applied for, aged at the year's first day. */
export function schoolBirthdateProblem(birthdate: Date | null, grade: string, yearStart: Date, now: Date = new Date()): BirthdateProblem | null {
  if (!birthdate) return null;
  if (isFutureBirthdate(birthdate, now)) return { kind: "future" };
  const band = gradeAgeBand(grade);
  if (!band) return null;
  const age = ageInYears(birthdate, yearStart);
  return age < band.min || age > band.max ? { kind: "grade", grade, ...band } : null;
}

/** The youngest a college applicant may be. */
export const COLLEGE_MIN_AGE = 14;

/** A college applicant's date of birth: not in the future, and at least fourteen today. */
export function collegeBirthdateProblem(birthdate: Date | null, now: Date = new Date()): BirthdateProblem | null {
  if (!birthdate) return null;
  if (isFutureBirthdate(birthdate, now)) return { kind: "future" };
  return ageInYears(birthdate, now) < COLLEGE_MIN_AGE ? { kind: "tooYoung", min: COLLEGE_MIN_AGE } : null;
}
