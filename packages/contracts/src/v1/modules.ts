import { z } from "zod";

/**
 * The parts of the school version a school switches on for itself (the
 * owner's decision of 3 October 2026): transport, the library, a hostel,
 * inventory and assets, HR and payroll, and alumni. Each is OFF until the
 * school's admin switches it on, except ALUMNI, which every school starts
 * with, and ASSISTANT (the help and tutor chat, docs/plans/assistant.md and
 * decision 0005), which every school and college starts with and the office
 * may switch off (9 Oct 2026; migration 20261010… backfilled every tenant); since 15 Oct 2026 a new
 * tenant starts with it off and it opens only while the operator has the ASSISTANT platform feature on
 * (v1/platform-features.ts). A coded list, so the web, the phone and the database agree on the
 * words; what each one says to a person is a dictionary key
 * (`modules.<code>.name` / `.what`), never this string.
 */
export const SCHOOL_VERSION_MODULES = ["TRANSPORT", "LIBRARY", "HOSTEL", "INVENTORY", "PAYROLL", "ALUMNI", "ASSISTANT"] as const;

/**
 * THE COLLEGE'S OWN SIX (the owner's decision of 4 October 2026), switched on
 * the same page by a college's admin and offered to no school: ACADEMICS
 * (departments, programmes, courses, offerings, lecture attendance — on for
 * every college from the start), EXAMS (forms, hall tickets, results, grade
 * cards; full conduct where the college is autonomous), IQAC (NAAC, NIRF,
 * AISHE), PLACEMENT (drives, the recruiter portal, internships), ADMISSIONS
 * and SCHOLARSHIPS. ADMISSIONS is the COLLEGE's form (the CET list, scrutiny,
 * quota); the school's own admissions pages (src/lib/admissions.ts, /admin/
 * admissions) stay ungated by it, as they were before there were colleges.
 */
export const COLLEGE_MODULES = ["ACADEMICS", "EXAMS", "IQAC", "PLACEMENT", "ADMISSIONS", "SCHOLARSHIPS"] as const;

/** Every module, the school version's six then the college's six: the one list the gate, the catalog and the phone read. */
export const SCHOOL_MODULES = [...SCHOOL_VERSION_MODULES, ...COLLEGE_MODULES] as const;
export const schoolModuleSchema = z.enum(SCHOOL_MODULES);
export type SchoolModuleCode = z.infer<typeof schoolModuleSchema>;

/**
 * The modules a new school is given without asking. ASSISTANT is no longer among them (15 Oct 2026): the
 * assistant is dark on the whole platform until the operator switches the ASSISTANT platform feature on
 * (v1/platform-features.ts), and a new school then switches its own module on. Existing SchoolModule
 * rows are left as they are.
 */
export const DEFAULT_SCHOOL_MODULES: readonly SchoolModuleCode[] = ["ALUMNI"];
/** …and a new college: alumni, and academics, which a college cannot run without. */
export const DEFAULT_COLLEGE_MODULES: readonly SchoolModuleCode[] = ["ALUMNI", "ACADEMICS"];

/**
 * WHAT KIND OF INSTITUTION A TENANT IS (4 October 2026): a school (every row
 * before this day), a junior college (classes 11 and 12, which runs entirely
 * as the school version does), an affiliated college, or an autonomous one —
 * which sets its own syllabus and conducts its own exams, and is the one
 * switch the exams builder reads (`isAutonomous` in apps/web/src/lib/modules.ts).
 * Stored on School.kind; named to a person by `institution.kind.<KIND>`.
 */
export const INSTITUTION_KINDS = ["SCHOOL", "JUNIOR_COLLEGE", "COLLEGE", "AUTONOMOUS_COLLEGE"] as const;
export const institutionKindSchema = z.enum(INSTITUTION_KINDS);
export type InstitutionKind = z.infer<typeof institutionKindSchema>;
/** The kinds that are a college: offered the college modules and roles. */
export const COLLEGE_KINDS: readonly InstitutionKind[] = ["COLLEGE", "AUTONOMOUS_COLLEGE"];
export function isCollegeKind(kind: string | null | undefined): boolean {
  return kind === "COLLEGE" || kind === "AUTONOMOUS_COLLEGE";
}
/** The modules an institution of this kind is offered on its modules page: a school's six, or all twelve for a college. */
export function modulesForKind(kind: string | null | undefined): readonly SchoolModuleCode[] {
  return isCollegeKind(kind) ? SCHOOL_MODULES : SCHOOL_VERSION_MODULES;
}
/** The modules a new institution of this kind starts with. */
export function defaultModulesForKind(kind: string | null | undefined): readonly SchoolModuleCode[] {
  return isCollegeKind(kind) ? DEFAULT_COLLEGE_MODULES : DEFAULT_SCHOOL_MODULES;
}

/**
 * The global feed's kind filter (School.globalFeedKinds): which kinds of
 * institution a tenant's people read posts from. The admin chooses one of
 * three words; each stands for a set of kinds (a junior college reads and is
 * read as a school).
 */
export const GLOBAL_FEED_KIND_CHOICES = ["SCHOOLS", "COLLEGES", "BOTH"] as const;
export type GlobalFeedKindChoice = (typeof GLOBAL_FEED_KIND_CHOICES)[number];
export const GLOBAL_FEED_KINDS_OF: Record<GlobalFeedKindChoice, readonly InstitutionKind[]> = {
  SCHOOLS: ["SCHOOL", "JUNIOR_COLLEGE"],
  COLLEGES: ["COLLEGE", "AUTONOMOUS_COLLEGE"],
  BOTH: INSTITUTION_KINDS,
};

/**
 * The four roles that exist only with a module: a bus driver or attendant,
 * the library's desk, a hostel's warden, and a former pupil. Each reaches
 * only the doors its module names (the catalog's `access` list naming the
 * role, or a signed-in door naming it in `limitedRoles`).
 */
export const MODULE_ROLES = ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"] as const;
export type ModuleRoleCode = (typeof MODULE_ROLES)[number];

/**
 * THE COLLEGE'S SIX STAFF ROLES (4 October 2026): a college teacher (FACULTY;
 * TEACHER stays for schools and junior colleges), a head of department, the
 * exam controller, the IQAC coordinator, the training and placement officer,
 * and the accounts office. Each is a Membership behind the same default-deny
 * gate as the module roles: it passes only the doors naming it in `access` or
 * `limitedRoles`.
 */
export const COLLEGE_ROLES = ["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const;
export type CollegeRoleCode = (typeof COLLEGE_ROLES)[number];

/**
 * EVERY ROLE BEHIND THE DEFAULT-DENY GATE: the module roles, the college's
 * staff roles, and the RECRUITER — an outside account like the expert, with
 * no school of its own, which reaches a college only through a placement
 * drive. A "signed-in" door opens to none of these unless it names them in
 * `limitedRoles`.
 */
export const LIMITED_ROLES = [...MODULE_ROLES, ...COLLEGE_ROLES, "RECRUITER"] as const;
export type LimitedRoleCode = (typeof LIMITED_ROLES)[number];
export function isLimitedRoleCode(role: string | null | undefined): role is LimitedRoleCode {
  return role !== null && role !== undefined && (LIMITED_ROLES as readonly string[]).includes(role);
}
/** The person's own doors (who I am, my account, my notices, sign-out) open to every limited role: name this list in their `limitedRoles`. */
export const ALL_LIMITED_ROLES: LimitedRoleCode[] = [...LIMITED_ROLES];

/**
 * Which module brings which role: switching the module off leaves the role's
 * home saying so. ACCOUNTS is not here on purpose: it is a college's core
 * office role and hangs on no module (scholarships are one of the things it
 * does, not the reason it exists). RECRUITER is not here either: it belongs
 * to no institution, and a college's PLACEMENT switch is read at the drive.
 */
export const MODULE_OF_ROLE: Record<ModuleRoleCode, SchoolModuleCode> & Partial<Record<LimitedRoleCode, SchoolModuleCode>> = {
  DRIVER: "TRANSPORT",
  LIBRARIAN: "LIBRARY",
  WARDEN: "HOSTEL",
  ALUMNUS: "ALUMNI",
  FACULTY: "ACADEMICS",
  HOD: "ACADEMICS",
  EXAM_CONTROLLER: "EXAMS",
  IQAC: "IQAC",
  TPO: "PLACEMENT",
};

/** GET /api/v1/admin/modules — every module, whether it is on, and since when. */
export const schoolModulesSchema = z.object({
  modules: z.array(
    z.object({
      module: schoolModuleSchema,
      on: z.boolean(),
      enabledAt: z.string().datetime().nullable(),
    }),
  ),
});
export type SchoolModules = z.infer<typeof schoolModulesSchema>;

/** POST /api/v1/admin/modules — switch one module on or off. */
export const schoolModuleSwitchSchema = z.object({ module: schoolModuleSchema, on: z.boolean() });
export type SchoolModuleSwitch = z.infer<typeof schoolModuleSwitchSchema>;
