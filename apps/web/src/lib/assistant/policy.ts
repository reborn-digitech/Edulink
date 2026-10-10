/**
 * THE ROLE POLICY, ONE TABLE (docs/plans/assistant.md §2 and §8.1, decided 8 Oct 2026): who gets the
 * platform help, who gets the tutor, and which of their own doors the assistant may read for them.
 * tests/assistant-policy.test.ts reads it role by role. Pure: no database, no network.
 *
 *   - Platform help: every role that belongs to a school (an alumnus too: §9.9).
 *   - The tutor: STUDENT, TEACHER, FACULTY, HOD. A teacher's topic questions are not limited to their
 *     own subjects (§9.8) and never by a pupil's sittings (§9.1).
 *   - EXPERT and RECRUITER belong to no school: no conversation is filed for them (NO_SCHOOL).
 *   - Tools: cheap GET doors the person may already open, called with their own session
 *     (tools.ts). A door's answer is data for the prompt, never an instruction.
 */
import type { Role } from "../constants";

export type ToolName =
  | "myTimetable"
  | "myExams"
  | "collegeExams"
  | "myAssignments"
  | "childTimetable"
  | "childExams"
  | "childAssignments"
  | "childAttendance"
  | "childFees"
  | "teacherTimetable"
  | "registersDue"
  | "teacherAssignments"
  | "officeSyllabusCoverage"
  | "myLectures";

export type RolePolicy = {
  /** Platform help from the help index. */
  help: boolean;
  /** Topic questions from the curriculum corpus. */
  tutor: boolean;
  /** The assessment rule (hints, open sittings) applies: a pupil's questions only. */
  assessed: boolean;
  /** The curriculum is scoped to the person's board and class band (a pupil); a teacher searches every class. */
  gradeScoped: boolean;
  tools: ToolName[];
};

const HELP_ONLY: RolePolicy = { help: true, tutor: false, assessed: false, gradeScoped: false, tools: [] };

export const ROLE_POLICY: Record<Role, RolePolicy> = {
  STUDENT: { help: true, tutor: true, assessed: true, gradeScoped: true, tools: ["myTimetable", "myExams", "collegeExams", "myAssignments"] },
  TEACHER: { help: true, tutor: true, assessed: false, gradeScoped: false, tools: ["teacherTimetable", "registersDue", "teacherAssignments"] },
  FACULTY: { help: true, tutor: true, assessed: false, gradeScoped: false, tools: ["myLectures"] },
  HOD: { help: true, tutor: true, assessed: false, gradeScoped: false, tools: ["myLectures"] },
  PARENT: { ...HELP_ONLY, tools: ["childTimetable", "childExams", "childAssignments", "childAttendance", "childFees"] },
  ADMIN: { ...HELP_ONLY, tools: ["registersDue", "officeSyllabusCoverage"] },
  PRINCIPAL: { ...HELP_ONLY, tools: ["officeSyllabusCoverage"] },
  DRIVER: HELP_ONLY,
  LIBRARIAN: HELP_ONLY,
  WARDEN: HELP_ONLY,
  ALUMNUS: HELP_ONLY,
  EXAM_CONTROLLER: HELP_ONLY,
  IQAC: HELP_ONLY,
  TPO: HELP_ONLY,
  ACCOUNTS: HELP_ONLY,
  EXPERT: { help: false, tutor: false, assessed: false, gradeScoped: false, tools: [] },
  RECRUITER: { help: false, tutor: false, assessed: false, gradeScoped: false, tools: [] },
};

export function policyFor(role: Role | null | undefined): RolePolicy {
  return role ? ROLE_POLICY[role] : { help: false, tutor: false, assessed: false, gradeScoped: false, tools: [] };
}

/** The four roles the tutor answers (the plan's TUTOR_ROLES), derived from the table so the two cannot disagree. */
export const TUTOR_ROLES: readonly Role[] = (Object.keys(ROLE_POLICY) as Role[]).filter((r) => ROLE_POLICY[r].tutor);

/** Class bands for the explanation (§5 Phase B): 1–5, 6–8, 9–10, 11–12, and college. */
export type GradeBand = "PRIMARY" | "MIDDLE" | "SECONDARY" | "SENIOR" | "COLLEGE" | "TEACHER";

export function gradeBandOf(grade: number | null, opts: { college?: boolean; teacher?: boolean } = {}): GradeBand {
  if (opts.teacher) return "TEACHER";
  if (opts.college) return "COLLEGE";
  if (grade === null) return "SECONDARY";
  if (grade <= 5) return "PRIMARY";
  if (grade <= 8) return "MIDDLE";
  if (grade <= 10) return "SECONDARY";
  return "SENIOR";
}

/** The board's books searched first for a school of this board (School.board, SCHOOL_BOARDS); NCERT for the rest (§8.7). */
export function corpusBoardFor(schoolBoard: string | null | undefined): string {
  if (schoolBoard === "MSBSHSE") return "Balbharati";
  if (schoolBoard === "NIOS") return "NIOS";
  return "NCERT";
}
