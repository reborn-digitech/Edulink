import "server-only";
import { cache } from "react";
import { DEFAULT_SCHOOL_MODULES, SCHOOL_MODULES, type SchoolModuleCode } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError, ModuleOffError } from "./access-error";
import type { ActiveContext } from "./session";
import { MODULE_META } from "./module-meta";

export { MODULE_META, SCHOOL_MODULES, type SchoolModuleCode };

/**
 * The parts of the school version a school switches on for itself (the
 * owner's decision of 3 October 2026). One SchoolModule row per module that
 * is ON; absence is off. The admin switches, from /admin/settings/modules or
 * POST /api/v1/admin/modules; ALUMNI is on for every school from the start.
 *
 * WHAT A MODULE BUILDER CALLS:
 *   - nothing, for an /api/v1 door: give its catalog entry `module: "X"` and
 *     the session's gate (role-gate.ts) answers 403 MODULE_OFF before the
 *     handler runs, for every role;
 *   - `assertModuleOn(schoolId, "X")` in a server action or a lib function a
 *     page calls, which throws the same refusal;
 *   - `isModuleOn` / `enabledModules` to decide what a page draws, and
 *     <ModuleOff> (components/module-off.tsx) for the page itself when off.
 */

/** The modules a school has on, in SCHOOL_MODULES order. Read once per request. */
export const enabledModules = cache(async (schoolId: string | null | undefined): Promise<SchoolModuleCode[]> => {
  if (!schoolId) return [];
  const rows = await db.schoolModule.findMany({ where: { schoolId }, select: { module: true } });
  const on = new Set(rows.map((r) => r.module));
  return SCHOOL_MODULES.filter((m) => on.has(m));
});

export async function isModuleOn(schoolId: string | null | undefined, module: SchoolModuleCode): Promise<boolean> {
  return (await enabledModules(schoolId)).includes(module);
}

/** Throws ModuleOffError (a 403 with code MODULE_OFF at the API) unless the school has `module` on. */
export async function assertModuleOn(schoolId: string | null | undefined, module: SchoolModuleCode): Promise<void> {
  if (!(await isModuleOn(schoolId, module))) throw new ModuleOffError(module);
}

/** Every module with whether it is on and since when: the admin's page and GET /api/v1/admin/modules. */
export async function schoolModules(ctx: ActiveContext): Promise<{ module: SchoolModuleCode; on: boolean; enabledAt: Date | null }[]> {
  if (!ctx.schoolId || (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL")) throw new AccessError("access.wrongRoleForThisAction");
  const rows = await db.schoolModule.findMany({ where: { schoolId: ctx.schoolId }, select: { module: true, enabledAt: true } });
  const byModule = new Map(rows.map((r) => [r.module, r.enabledAt]));
  return SCHOOL_MODULES.map((module) => ({ module, on: byModule.has(module), enabledAt: byModule.get(module) ?? null }));
}

/**
 * Switch one module on or off. The ADMIN's alone (the head reads the page),
 * as every settings door is. Idempotent: switching on what is on, or off
 * what is off, changes nothing and writes no audit row. Switching off keeps
 * everything the module recorded — it only hides it — so switching back on
 * finds it as it was; and it takes away nobody's membership: a driver whose
 * school switches transport off still belongs to the school, and their home
 * says the module is off.
 */
export async function setModule(ctx: ActiveContext, module: SchoolModuleCode, on: boolean): Promise<{ changed: boolean }> {
  if (!ctx.schoolId || ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  if (!(SCHOOL_MODULES as readonly string[]).includes(module)) throw new AccessError("access.wrongRoleForThisAction");
  const schoolId = ctx.schoolId;
  if (on) {
    const existing = await db.schoolModule.findUnique({ where: { schoolId_module: { schoolId, module } }, select: { id: true } });
    if (existing) return { changed: false };
    try {
      await db.schoolModule.create({ data: { schoolId, module, enabledByUserId: ctx.user.id } });
    } catch {
      // Two presses at once: the other one switched it on.
      return { changed: false };
    }
  } else {
    const gone = await db.schoolModule.deleteMany({ where: { schoolId, module } });
    if (gone.count === 0) return { changed: false };
  }
  await audit({ schoolId, actorUserId: ctx.user.id, action: on ? "school.module.on" : "school.module.off", targetType: "School", targetId: schoolId, meta: { module } });
  return { changed: true };
}

/**
 * The rows a NEW school starts with (ALUMNI), written by whoever makes the
 * school in the same breath: the operator's createSchool, a school's own
 * registration and the fixture scripts. `client` is the transaction the
 * school was made in, when there is one.
 */
export async function writeDefaultModules(schoolId: string, client: Pick<typeof db, "schoolModule"> = db): Promise<void> {
  await client.schoolModule.createMany({ data: DEFAULT_SCHOOL_MODULES.map((module) => ({ schoolId, module })), skipDuplicates: true });
}
