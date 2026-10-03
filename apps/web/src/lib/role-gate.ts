import "server-only";
import { ENDPOINTS } from "./api-catalog";
import { permits, type Endpoint } from "./api-catalog/types";
import { MODULE_OF_ROLE } from "@edulink/contracts";
import { isModuleRole, ROLE_HOME, type ModuleRole, type Role } from "./constants";
import { NAV, isActive } from "./nav";
import { AccessError, ModuleOffError } from "./access-error";
import { assertModuleOn, enabledModules } from "./modules";

/**
 * THE GATE FOR THE MODULE ROLES, and for the modules themselves (3 October
 * 2026). Read by `getSession` with the route the middleware wrote on the
 * request (lib/route-header.ts), so it runs before any handler or page does
 * anything with the session — there is no route wrapper in this codebase, and
 * every handler and page asks `getSession` first.
 *
 * TWO RULES.
 *
 *   1. A module role — DRIVER, LIBRARIAN, WARDEN, ALUMNUS — passes an /api/v1
 *      door only when the catalog lets it (`permits`: an `access` list naming
 *      the role, or a "signed-in" door naming it in `limitedRoles`), and is
 *      refused with 403 otherwise. On a page of the school's working surface
 *      (APP_SEGMENTS: everything under app/(app)) it passes only its own home,
 *      its own NAV entries and the notices; anywhere else there its session
 *      carries no school and no role, which every page gate already answers
 *      by sending the person to choose. Default-deny on purpose: the library
 *      functions written before these roles branch on ADMIN, PRINCIPAL,
 *      TEACHER and STUDENT, and more than one of them treats a role it does
 *      not name as an admin (a post approved without review, any class's
 *      register). A module builder opens a door by naming the role in the
 *      catalog and a page by giving the role a NAV entry — nothing else.
 *
 *   2. An /api/v1 door whose catalog entry names a `module` answers 403 with
 *      code MODULE_OFF, for every role, while the session's school has not
 *      switched that module on.
 *
 * And while a module role's OWN module is off at its school (a driver whose
 * school switched transport off), it keeps only its home, the notices and
 * the person's own doors (PERSON_DOORS) — it still belongs to the school,
 * and its home says the module is off.
 *
 * The four roles that existed before are not checked against `access` here:
 * their handlers do that and the API sweep proves it, and this file is not
 * the place to change what they are answered.
 */

type Route = { e: Endpoint; re: RegExp; params: number };

const compiled = new WeakMap<readonly Endpoint[], Route[]>();
function routesOf(catalog: readonly Endpoint[]): Route[] {
  let routes = compiled.get(catalog);
  if (!routes) {
    routes = catalog
      .map((e) => ({ e, re: new RegExp(`^${e.path.replace(/\{[^}]+\}/g, "[^/]+")}$`), params: (e.path.match(/\{/g) ?? []).length }))
      // A literal segment wins over a parameter, as it does in the router:
      // /shared/bulletin/global before /shared/bulletin/{postId}.
      .sort((a, b) => a.params - b.params);
    compiled.set(catalog, routes);
  }
  return routes;
}

/** The catalog entry behind a request, or null for a path the catalog does not list. `catalog` is for the suite. */
export function endpointFor(method: string, path: string, catalog: readonly Endpoint[] = ENDPOINTS): Endpoint | null {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  for (const r of routesOf(catalog)) if (r.e.method === method && r.re.test(clean)) return r.e;
  return null;
}

/**
 * The top-level segments of app/(app): the school's working surface, where a
 * module role reaches only its own pages. tests/role-gate.test.ts holds this
 * list to the directory. Pages outside it — the account, the role chooser,
 * a pupil's record, sign-in — are the person's own and are not gated here.
 */
export const APP_SEGMENTS = [
  "admin", "alumni", "archive", "attachments", "attendance", "bulletin", "certificates", "competitions", "driver",
  "enquiries", "exams", "expert", "experts", "explore", "hostel", "incidents", "joins", "library", "mentoring",
  "notifications", "parent", "people", "principal", "remarks", "report-cards", "reports", "reviews", "sessions",
  "student", "teacher", "timetable", "vacancies",
] as const;

/** Pages every module role may open besides its home and its NAV: the notices. */
const MODULE_ROLE_PAGES = ["/notifications"];

/**
 * The person's own doors: who I am, my account, my devices, my notices, my
 * sign-out. A module role keeps these while its module is off.
 */
const PERSON_DOORS = ["/api/v1/me", "/api/v1/account", "/api/v1/auth/", "/api/v1/shared/notifications", "/api/v1/events", "/api/v1/shared/inbox"];
const isPersonDoor = (path: string) => PERSON_DOORS.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`));

/** Whether the school on the session has this module role's own module on. */
async function ownModuleOn(role: ModuleRole, schoolId: string | null): Promise<boolean> {
  return (await enabledModules(schoolId)).includes(MODULE_OF_ROLE[role]);
}

/**
 * Whether a module role may open this page: anything outside the school's
 * working surface; on it, its home, the notices, and the NAV entries whose
 * module the school has on — none of the NAV while its own module is off.
 */
export function modulePagePermitted(role: Role, path: string, modulesOn: readonly string[]): boolean {
  const segment = path.split("/")[1] ?? "";
  if (!(APP_SEGMENTS as readonly string[]).includes(segment)) return true;
  const home = ROLE_HOME[role];
  if (path === home || path.startsWith(`${home}/`)) return true;
  if (MODULE_ROLE_PAGES.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  if (isModuleRole(role) && !modulesOn.includes(MODULE_OF_ROLE[role])) return false;
  return NAV[role].some((item) => (!item.module || modulesOn.includes(item.module)) && isActive(path, item));
}

/**
 * What the gate makes of one request. Throws the API refusals (AccessError,
 * ModuleOffError — apiFailure answers them 403); returns "no-context" when a
 * page must be served as if the session had no school, and "pass" otherwise.
 */
export async function gateRequest(route: string | null, ctx: { role: Role | null; schoolId: string | null }, catalog: readonly Endpoint[] = ENDPOINTS): Promise<"pass" | "no-context"> {
  if (!route) return "pass";
  const space = route.indexOf(" ");
  const method = route.slice(0, space);
  const path = route.slice(space + 1);
  if (path.startsWith("/api/v1/")) {
    // Nothing to look up for the older roles while no door names a module.
    if (!isModuleRole(ctx.role) && !routesOf(catalog).some((r) => r.e.module)) return "pass";
    const e = endpointFor(method, path, catalog);
    if (isModuleRole(ctx.role)) {
      if (!e || !permits(e, ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
      if (!isPersonDoor(path) && !(await ownModuleOn(ctx.role, ctx.schoolId))) throw new ModuleOffError(MODULE_OF_ROLE[ctx.role]);
    }
    if (e?.module && ctx.schoolId) await assertModuleOn(ctx.schoolId, e.module);
    return "pass";
  }
  if (path.startsWith("/api/")) return "pass";
  if (isModuleRole(ctx.role) && !modulePagePermitted(ctx.role, path, await enabledModules(ctx.schoolId))) return "no-context";
  return "pass";
}
