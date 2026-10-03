import { z } from "zod";

/**
 * The parts of the school version a school switches on for itself (the
 * owner's decision of 3 October 2026): transport, the library, a hostel,
 * inventory and assets, HR and payroll, and alumni. Each is OFF until the
 * school's admin switches it on, except ALUMNI, which every school starts
 * with. A coded list, so the web, the phone and the database agree on the
 * words; what each one says to a person is a dictionary key
 * (`modules.<code>.name` / `.what`), never this string.
 */
export const SCHOOL_MODULES = ["TRANSPORT", "LIBRARY", "HOSTEL", "INVENTORY", "PAYROLL", "ALUMNI"] as const;
export const schoolModuleSchema = z.enum(SCHOOL_MODULES);
export type SchoolModuleCode = z.infer<typeof schoolModuleSchema>;

/** The modules a new school is given without asking. */
export const DEFAULT_SCHOOL_MODULES: readonly SchoolModuleCode[] = ["ALUMNI"];

/**
 * The four roles that exist only with a module: a bus driver or attendant,
 * the library's desk, a hostel's warden, and a former pupil. Each reaches
 * only the doors its module names (the catalog's `access` list naming the
 * role, or a signed-in door naming it in `limitedRoles`).
 */
export const MODULE_ROLES = ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"] as const;
export type ModuleRoleCode = (typeof MODULE_ROLES)[number];

/** Which module brings which role: switching the module off leaves the role's home saying so. */
export const MODULE_OF_ROLE: Record<ModuleRoleCode, SchoolModuleCode> = {
  DRIVER: "TRANSPORT",
  LIBRARIAN: "LIBRARY",
  WARDEN: "HOSTEL",
  ALUMNUS: "ALUMNI",
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
