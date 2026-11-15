import "server-only";
import { cache } from "react";
import { defaultModulesForKind, isCollegeKind, modulesForKind, presetUnion, SCHOOL_MODULES, STREAMS, type InstitutionKind, type SchoolModuleCode } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { readJson } from "./json";
import { AccessError, ModuleOffError, NotACollegeError, NotForThisKindError } from "./access-error";
import type { TranslationKey } from "./i18n/dictionary";
import type { ActiveContext } from "./session";
import { MODULE_META } from "./module-meta";

export { MODULE_META, SCHOOL_MODULES, type SchoolModuleCode };

/**
 * The parts of the school version a school switches on for itself (the
 * owner's decision of 3 October 2026). One SchoolModule row per module that
 * is ON; absence is off. The admin switches, from /admin/settings/modules or
 * POST /api/v1/admin/modules; ALUMNI is on for every school from the start.
 * ASSISTANT is the operator's to switch, never the admin's (16 Oct 2026).
 *
 * WHAT A MODULE BUILDER CALLS:
 *   - nothing, for an /api/v1 door: give its catalog entry `module: "X"` and
 *     the session's gate (role-gate.ts) answers 403 MODULE_OFF before the
 *     handler runs, for every role;
 *   - `assertModuleOn(schoolId, "X")` in a server action or a lib function a
 *     page calls, which throws the same refusal;
 *   - `isModuleOn` / `enabledModules` to decide what a page draws, and
 *     <ModuleOff> (components/module-off.tsx) for the page itself when off;
 *   - `institutionKindOf` / `isAutonomous` for what kind of institution the
 *     tenant is (4 Oct 2026): a college is offered the college's six modules
 *     (ACADEMICS, EXAMS, IQAC, PLACEMENT, ADMISSIONS, SCHOLARSHIPS) as well.
 */

/** The modules a school has on, in SCHOOL_MODULES order. Read once per request. */
export const enabledModules = cache(async (schoolId: string | null | undefined): Promise<SchoolModuleCode[]> => {
  if (!schoolId) return [];
  const rows = await db.schoolModule.findMany({ where: { schoolId }, select: { module: true } });
  const on = new Set(rows.map((r) => r.module));
  return SCHOOL_MODULES.filter((m) => on.has(m));
});

/**
 * A guardian's session names no school, so a module entry on a family's menu
 * is decided by the children's schools (4 Oct 2026): the union of what any
 * child's school has on. The page itself still checks the one child's school
 * (assertModuleOn) when it is opened. Read once per request.
 */
export const enabledModulesForFamily = cache(async (userId: string): Promise<SchoolModuleCode[]> => {
  const children = await db.guardianship.findMany({
    where: { parentUserId: userId, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } },
    select: { student: { select: { schoolId: true } } },
  });
  const schoolIds = [...new Set(children.map((c) => c.student.schoolId))];
  if (schoolIds.length === 0) return [];
  const rows = await db.schoolModule.findMany({ where: { schoolId: { in: schoolIds } }, select: { module: true } });
  const on = new Set(rows.map((r) => r.module));
  return SCHOOL_MODULES.filter((m) => on.has(m));
});

/**
 * What kind of institution a tenant is (School.kind: SCHOOL, JUNIOR_COLLEGE,
 * COLLEGE, AUTONOMOUS_COLLEGE), or null with no school. Read once per request.
 */
export const institutionKindOf = cache(async (schoolId: string | null | undefined): Promise<InstitutionKind | null> => {
  if (!schoolId) return null;
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { kind: true } });
  return (school?.kind as InstitutionKind | undefined) ?? null;
});

/**
 * A SCHOOL'S WRITE, NOT A COLLEGE'S: refused at an institution of a college kind, answered as a door at the wrong kind
 * of institution is (404 NOT_FOUND, role-gate.ts rule 4, "schoolCampus.refuseNotThisKind"), so that a page's action
 * and every other caller meet the refusal the door's own catalog `kinds` gives. The school's admissions (TA-269), and
 * since the owner's word of 15 November 2026 ("Yes, close it") a school's exam series (exams.ts createSeries).
 */
export async function refuseAtACollege(schoolId: string): Promise<void> {
  const kind = await institutionKindOf(schoolId);
  if (isCollegeKind(kind)) throw new NotForThisKindError(kind ?? "COLLEGE", "schoolCampus.refuseNotThisKind");
}

/**
 * THE AUTONOMOUS SWITCH (4 October 2026): an autonomous college sets its own
 * syllabus and conducts its own exams, so the EXAMS module runs full conduct
 * there and imports the university's results everywhere else. The exams
 * builder reads this and nothing else; it is the tenant's kind, set when the
 * college is made, not a module or a setting.
 */
export async function isAutonomous(schoolId: string | null | undefined): Promise<boolean> {
  return (await institutionKindOf(schoolId)) === "AUTONOMOUS_COLLEGE";
}

export async function isModuleOn(schoolId: string | null | undefined, module: SchoolModuleCode): Promise<boolean> {
  return (await enabledModules(schoolId)).includes(module);
}

/** Throws ModuleOffError (a 403 with code MODULE_OFF at the API) unless the school has `module` on. */
export async function assertModuleOn(schoolId: string | null | undefined, module: SchoolModuleCode): Promise<void> {
  if (!(await isModuleOn(schoolId, module))) throw new ModuleOffError(module);
}

/**
 * A college's door at any other kind of tenant (W-17, 4 Oct 2026): throws
 * NotACollegeError — 403 MODULE_OFF at the API, the module gate's answer —
 * unless `schoolId` is a college. No school (a guardian's session) is not a
 * college either; a guardian's read passes the CHILD'S school. `key` keeps the
 * sentence the desk already said.
 */
export async function assertCollege(schoolId: string | null | undefined, key?: TranslationKey): Promise<void> {
  if (!isCollegeKind((await institutionKindOf(schoolId)) ?? "SCHOOL")) throw new NotACollegeError(key);
}

/**
 * Every module this institution is offered, with whether it is on and since
 * when: the admin's page and GET /api/v1/admin/modules. A school (and a junior
 * college) is offered the school version's six; a college all twelve.
 * ASSISTANT is left out (16 Oct 2026): the platform's operator switches it
 * (operatorSchoolModules, operator-college.ts), not the school.
 */
export async function schoolModules(ctx: ActiveContext): Promise<{ module: SchoolModuleCode; on: boolean; enabledAt: Date | null; byPlatform: boolean }[]> {
  if (!ctx.schoolId || (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL")) throw new AccessError("access.wrongRoleForThisAction");
  const [rows, kind] = await Promise.all([
    db.schoolModule.findMany({ where: { schoolId: ctx.schoolId }, select: { module: true, enabledAt: true, enabledByUserId: true } }),
    institutionKindOf(ctx.schoolId),
  ]);
  const byModule = new Map(rows.map((r) => [r.module, r.enabledAt]));
  // "Switched on by the platform" (4 Oct 2026): the switch's author belongs to no role here — the operator, on the institution's behalf.
  const enablers = [...new Set(rows.map((r) => r.enabledByUserId).filter((id): id is string => Boolean(id)))];
  const members = enablers.length ? new Set((await db.membership.findMany({ where: { schoolId: ctx.schoolId, userId: { in: enablers } }, select: { userId: true } })).map((m) => m.userId)) : new Set<string>();
  const platform = new Set(rows.filter((r) => r.enabledByUserId && !members.has(r.enabledByUserId)).map((r) => r.module));
  return modulesForKind(kind).filter((module) => !isOperatorsModule(module)).map((module) => ({ module, on: byModule.has(module), enabledAt: byModule.get(module) ?? null, byPlatform: platform.has(module) }));
}

/**
 * A module a kind of institution always has on (4 Oct 2026): ACADEMICS at a
 * college — departments, courses and lectures are what a college is. Its
 * card on the modules page says so and offers no switch; `setModule`
 * refuses to switch it off.
 */
export function isAlwaysOn(module: SchoolModuleCode, kind: string | null | undefined): boolean {
  return module === "ACADEMICS" && isCollegeKind(kind);
}

/**
 * A module the platform's operator switches for a school and the school does
 * not (the owner's decision of 16 October 2026): ASSISTANT, which opens under
 * the student and teacher plans. It is not on the admin's modules page or door,
 * and `setModule` refuses it; the operator's switch (switchModuleFor with
 * byOperator, from operator-college.ts) still offers it.
 */
export function isOperatorsModule(module: SchoolModuleCode): boolean {
  return module === "ASSISTANT";
}

/**
 * Switch one module on or off. The ADMIN's alone (the head reads the page),
 * as every settings door is. Idempotent: switching on what is on, or off
 * what is off, changes nothing and writes no audit row. Switching off keeps
 * everything the module recorded — it only hides it — so switching back on
 * finds it as it was, its settings too (15 Nov 2026): the switch-off's audit
 * row keeps the settings the module's row held, and the switch back on takes
 * them from it (switchOff below), so a module left off for longer than the
 * audit log is kept (RETENTION_AUDIT_DAYS, two years by default) comes back
 * with its defaults. And it takes away nobody's membership: a driver whose
 * school switches transport off still belongs to the school, and their home
 * says the module is off.
 */
export async function setModule(ctx: ActiveContext, module: SchoolModuleCode, on: boolean): Promise<{ changed: boolean }> {
  if (!ctx.schoolId || ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  if (isOperatorsModule(module)) throw new AccessError("modules.refuseAssistant");
  return switchModuleFor(ctx.schoolId, ctx.user.id, module, on);
}

/**
 * The one path a module is switched by after the institution is made: the
 * admin's `setModule` above, and the operator's on the institution's behalf
 * (operator-college.ts, which asserts the superuser and binds the school
 * first). The same refusals for both; the operator's audit row in the
 * school's log carries `byOperator: true` (4 Oct 2026), and its
 * enabledByUserId is the operator, which is how the modules page says
 * "switched on by the platform".
 */
export async function switchModuleFor(schoolId: string, actorUserId: string, module: SchoolModuleCode, on: boolean, opts: { byOperator?: boolean } = {}): Promise<{ changed: boolean }> {
  if (!(SCHOOL_MODULES as readonly string[]).includes(module)) throw new AccessError("access.wrongRoleForThisAction");
  const ctx = { user: { id: actorUserId } };
  // A college's six are a college's: a school is not offered them, and switching one on there is refused.
  const kind = await institutionKindOf(schoolId);
  if (on && !modulesForKind(kind).includes(module)) throw new AccessError("modules.refuseNotForKind");
  // A college cannot run without its academics (the academics builder, 4 Oct 2026): ACADEMICS stays on.
  if (!on && isAlwaysOn(module, kind)) throw new AccessError("academics.refuseAlwaysOn");
  if (!on) return switchOff(schoolId, ctx.user.id, module, opts);
  const existing = await db.schoolModule.findUnique({ where: { schoolId_module: { schoolId, module } }, select: { id: true } });
  if (existing) return { changed: false };
  // Back with the settings it had when it was last switched off, or none.
  const settingsJson = await settingsAtLastSwitchOff(schoolId, module);
  try {
    await db.schoolModule.create({ data: { schoolId, module, enabledByUserId: ctx.user.id, settingsJson } });
  } catch {
    // Two presses at once: the other one switched it on.
    return { changed: false };
  }
  await audit({ schoolId, actorUserId: ctx.user.id, action: "school.module.on", targetType: "School", targetId: schoolId, meta: opts.byOperator ? { module, byOperator: true } : { module } });
  return { changed: true };
}

/** The key under which a switch-off's audit row keeps the module's settings; the safety centre's trail leaves it out (safety.ts). */
export const KEPT_SETTINGS_KEY = "settingsJson";

/**
 * A switch-off. THE ROW IT DELETES HOLDS THE MODULE'S SETTINGS (SchoolModule.settingsJson), so they leave with it on
 * the switch-off's own audit row, as the column held them and in the same transaction as the delete, for the switch
 * back on to find (settingsAtLastSwitchOff); a module with no settings writes that row as it always did. A lost
 * audit row would be lost settings, so a refused one undoes the switch-off: audit() passes a refusal on the switch's
 * own transaction to it (and a null, which it answered there until 15 November 2026, is read the same), so the module
 * stays on with its settings and the caller is told it failed. The delete hands back the row it took in the one
 * statement, so a save of the settings at the same moment cannot fall between a read and the delete.
 */
async function switchOff(schoolId: string, actorUserId: string, module: SchoolModuleCode, opts: { byOperator?: boolean }): Promise<{ changed: boolean }> {
  return db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const [gone] = await tx.$queryRaw<{ settingsJson: string | null }[]>`
      DELETE FROM "SchoolModule" WHERE "schoolId" = ${schoolId} AND "module" = ${module} RETURNING "settingsJson"
    `;
    if (!gone) return { changed: false };
    const meta = { module, ...(opts.byOperator ? { byOperator: true } : {}), ...(gone.settingsJson === null ? {} : { [KEPT_SETTINGS_KEY]: gone.settingsJson }) };
    const written = await audit({ schoolId, actorUserId, action: "school.module.off", targetType: "School", targetId: schoolId, meta }, tx);
    if (!written) throw new Error("The switch-off's audit row, which keeps the module's settings, was not written");
    return { changed: true };
  });
}

/**
 * The settings this school's module had when it was last switched off, as the column held them (switchOff keeps
 * them on that school.module.off row); null when it had none, or when that row is gone: a switch-off before
 * 15 November 2026, or one longer ago than the audit log is kept. This school's rows only, whatever the binding
 * could read. Each module's reader checks what it reads (transport takes only true, the alumni feed only a known
 * mode, placement only numbers and a boolean), so a restored value is held to the same rules as a stored one.
 */
async function settingsAtLastSwitchOff(schoolId: string, module: SchoolModuleCode): Promise<string | null> {
  const row = await db.auditLog.findFirst({
    // writeJson spells the meta {"module":"…",…}; the kept settings are a JSON string inside it, their quotes
    // escaped, so they cannot spell a module's name here.
    where: { schoolId, action: "school.module.off", meta: { contains: `"module":"${module}"` } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { meta: true },
  });
  const meta = readJson<Record<string, unknown>>(row?.meta, {});
  const kept = meta[KEPT_SETTINGS_KEY];
  return meta.module === module && typeof kept === "string" ? kept : null;
}

/**
 * The rows a NEW institution starts with — ALUMNI for a school, ALUMNI and
 * ACADEMICS for a college (defaultModulesForKind) — written by whoever makes
 * it in the same breath: the operator's createSchool, a school's own
 * registration and the fixture scripts. `client` is the transaction the
 * school was made in, when there is one.
 *
 * A college's STREAMS (5 Oct 2026) add their preset's `modulesOn`, the union
 * over every stream (STREAM_PRESETS in packages/contracts v1/streams.ts):
 * EXAMS, ADMISSIONS, SCHOLARSHIPS and IQAC for every stream, PLACEMENT for a
 * professional one, INVENTORY for engineering and pharmacy. Only at the
 * making: a change of streams later switches nothing.
 */
export async function writeDefaultModules(schoolId: string, client: Pick<typeof db, "schoolModule"> = db, kind: string = "SCHOOL", streams: readonly string[] = []): Promise<void> {
  // No stream (a fixture or a test that makes a college by hand): the kind's defaults alone, as before the streams.
  const known = STREAMS.filter((s) => streams.includes(s));
  const fromStreams = isCollegeKind(kind) && known.length > 0 ? presetUnion(known).modulesOn : [];
  const modules = SCHOOL_MODULES.filter((m) => defaultModulesForKind(kind).includes(m) || (fromStreams.includes(m) && modulesForKind(kind).includes(m)));
  await client.schoolModule.createMany({ data: modules.map((module) => ({ schoolId, module })), skipDuplicates: true });
}
