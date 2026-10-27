import "server-only";
import { ENDPOINTS } from "./api-catalog";
import { doorForKind, featuresOf, permits, type Endpoint } from "./api-catalog/types";
import { isCollegeKind, MODULE_OF_ROLE } from "@edulink/contracts";
import { isLimitedRole, ROLE_HOME, type LimitedRole, type Role } from "./constants";
import { NAV, isActive } from "./nav";
import { AccessError, ModuleOffError, NotForThisKindError } from "./access-error";
import { routePath } from "./route-header";
import { assertModuleOn, enabledModules, institutionKindOf } from "./modules";
import { assertAnyFeatureOn, assertFeatureSwitchOn } from "./platform-features";

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
 *   3. (15 October 2026) A door whose catalog entry names a platform `feature`
 *      — an /api/v1 door, or one of the catalogued doors outside it — answers
 *      404 with code FEATURE_OFF, for every role and before any other refusal,
 *      while the operator has that feature off (src/lib/platform-features.ts,
 *      `mayUse`). A door whose entry says `featureInHandler` is left to its
 *      handler. This is the ONE place a door's feature is enforced.
 *      (16 October 2026) While the feature is on but needs a plan the caller's
 *      role must hold and the caller does not (src/lib/person-plans.ts), the
 *      door answers 402 PLAN_REQUIRED naming the plan; a door marked `planFree`
 *      asks the platform switch alone.
 *
 *   4. (owner-batch-item5, 27 October 2026) A door whose catalog entry names
 *      `kinds` answers 404 NOT_FOUND, for every role, after the feature and
 *      before anything else, at a tenant whose kind is not among them — a
 *      college's criterion table asked at a school (NotForThisKindError). A
 *      guardian's session names no school, so the handler decides there.
 *
 * And while a module role's OWN module is off at its school (a driver whose
 * school switched transport off), it keeps only its home, the notices and
 * the person's own doors (PERSON_DOORS) — it still belongs to the school,
 * and its home says the module is off.
 *
 * THE COLLEGE'S SEVEN (4 October 2026) are behind the same two rules: the six
 * college staff roles (FACULTY, HOD, EXAM_CONTROLLER, IQAC, TPO, ACCOUNTS) and
 * the RECRUITER are LIMITED_ROLES with the four module roles, and pass only
 * what names them. Their own module is MODULE_OF_ROLE's (FACULTY and HOD
 * ACADEMICS, EXAM_CONTROLLER EXAMS, IQAC IQAC, TPO PLACEMENT); ACCOUNTS and
 * RECRUITER hang on none, so nothing of theirs is closed by a switch.
 *
 * THE DUTIES (5 October 2026): a catalog entry with `duties` lets a FACULTY or
 * HOD through only holding one of them on their membership (getSession reads
 * Membership.dutiesJson and passes it here as `duties`); a NAV entry with
 * `duty` opens its page only to the holder. Both roles are limited roles, so
 * the rule sits beside rule 1.
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
 * module role reaches only its own pages. tests/modules.test.ts ("names every
 * top-level segment of app/(app) in APP_SEGMENTS") holds this list to the
 * directory. Pages outside it — the account, the role chooser,
 * a pupil's record, sign-in — are the person's own and are not gated here.
 */
export const APP_SEGMENTS = [
  "accounts", "admin", "alumni", "archive", "assistant", "attachments", "attendance", "bulletin", "certificates", "competitions", "driver", "duties",
  "enquiries", "exam-cell", "exams", "expert", "experts", "explore", "faculty", "hod", "hostel", "incidents", "iqac", "joins",
  "library", "mentoring", "notifications", "parent", "people", "placement", "principal", "recruiter", "remarks",
  "report-cards", "reports", "reviews", "sessions", "student", "teacher", "timetable", "vacancies",
] as const;

/**
 * Pages every module role may open besides its home and its NAV: the notices, and /assistant (Vidura pass 1, 17 Oct
 * 2026: no longer a menu entry; it sends the person back with Vidura's drawer open).
 */
const MODULE_ROLE_PAGES = ["/notifications", "/assistant"];

/**
 * owner-batch-item2a (27 Oct 2026): SUPPORT STAFF. The owner's decision is that
 * a support worker who is ever given a login sees their own payslips and
 * profile and nothing else. The /api/v1 side is the catalog's (only the three
 * payslip doors and the person's own doors name SUPPORT); the pages under
 * /account are outside APP_SEGMENTS and so open to every limited role, and a
 * support worker would otherwise reach my items, my letters, my attendance
 * and my leave there. On those it is served as if it had no school; joining
 * two accounts of their own (/account/merge) stays theirs.
 */
const SUPPORT_ACCOUNT_PAGES = ["/account/payslips", "/account/merge"];
export function supportPagePermitted(path: string): boolean {
  if (!path.startsWith("/account/")) return true;
  return SUPPORT_ACCOUNT_PAGES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * The person's own doors: who I am, my account, my devices, my notices, my
 * sign-out. A module role keeps these while its module is off.
 */
const PERSON_DOORS = ["/api/v1/me", "/api/v1/account", "/api/v1/auth/", "/api/v1/shared/notifications", "/api/v1/events", "/api/v1/shared/inbox"];
const isPersonDoor = (path: string) => PERSON_DOORS.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`));

/** Whether the school on the session has this limited role's own module on; a role that hangs on no module (ACCOUNTS, RECRUITER) always has. */
async function ownModuleOn(role: LimitedRole, schoolId: string | null): Promise<boolean> {
  const own = MODULE_OF_ROLE[role];
  return !own || (await enabledModules(schoolId)).includes(own);
}

/**
 * Whether a module role may open this page: anything outside the school's
 * working surface; on it, its home, the notices, and the NAV entries whose
 * module the school has on — none of the NAV while its own module is off.
 * A NAV entry carrying `duty` (5 Oct 2026) opens only to a member holding it:
 * `duties` are the session's own (a FACULTY's or HOD's).
 */
export function modulePagePermitted(role: Role, path: string, modulesOn: readonly string[], duties: readonly string[] = []): boolean {
  const segment = path.split("/")[1] ?? "";
  if (!(APP_SEGMENTS as readonly string[]).includes(segment)) return true;
  const home = ROLE_HOME[role];
  if (path === home || path.startsWith(`${home}/`)) return true;
  if (MODULE_ROLE_PAGES.some((p) => path === p || path.startsWith(`${p}/`))) return true;
  if (isLimitedRole(role)) {
    const own = MODULE_OF_ROLE[role];
    if (own && !modulesOn.includes(own)) return false;
  }
  return NAV[role].some((item) => (!item.module || modulesOn.includes(item.module)) && (!item.duty || duties.includes(item.duty)) && isActive(path, item));
}

/**
 * A page the role's own menu lists, behind a module this school has off — the
 * library desk's line of the no-dues (/accounts/no-dues, ACADEMICS) at a
 * school. The menu hides the entry; typed in, it used to be served as if the
 * session had no school, and the librarian landed on "Where would you like to
 * go?" (the walk of 4 October, B-12). It is answered as a page that is not
 * here (404) instead: nothing of it is drawn, and nothing suggests a choice
 * of school would open it.
 */
export function ownPageModuleOff(role: Role, path: string, modulesOn: readonly string[]): boolean {
  return NAV[role].some((item) => !!item.module && !modulesOn.includes(item.module) && isActive(path, item));
}

/**
 * What the gate makes of one request. Throws the API refusals (AccessError,
 * ModuleOffError — apiFailure answers them 403 — and FeatureOffError, 404); returns "no-context" when a
 * page must be served as if the session had no school, "not-found" for the
 * role's own menu page whose module is off here, and "pass" otherwise.
 */
/**
 * Rule 3: the door's platform feature, unless its handler decides (`featureInHandler`). Throws FeatureOffError (404
 * FEATURE_OFF), or PlanRequiredError (402 PLAN_REQUIRED) when the feature is on and the caller's role needs a plan
 * they do not hold (16 Oct 2026); a `planFree` door asks the switch alone.
 */
/** Rule 4 (owner-batch-item5): a door naming `kinds` at a tenant of another kind is not here. No school on the session: the handler decides. */
async function assertDoorKind(e: Endpoint | null, schoolId: string | null): Promise<void> {
  if (!e?.kinds || !schoolId) return;
  const kind = (await institutionKindOf(schoolId)) ?? "SCHOOL";
  if (doorForKind(e, kind)) return;
  throw new NotForThisKindError(kind, e.kinds.every((k) => isCollegeKind(k)) ? "collegeOffice.refuseNotCollege" : "schoolCampus.refuseNotThisKind");
}

async function assertDoorFeature(e: Endpoint | null, ctx: { userId?: string | null; schoolId: string | null; role?: Role | null }): Promise<void> {
  if (!e?.feature || e.featureInHandler) return;
  if (e.planFree) return assertFeatureSwitchOn(featuresOf(e));
  await assertAnyFeatureOn(featuresOf(e), { userId: ctx.userId ?? null, schoolId: ctx.schoolId, role: ctx.role ?? null });
}

export async function gateRequest(route: string | null, ctx: { role: Role | null; schoolId: string | null; duties?: readonly string[]; userId?: string | null }, catalog: readonly Endpoint[] = ENDPOINTS): Promise<"pass" | "no-context" | "not-found"> {
  // FAIL CLOSED (campaign S-11). No stamp means the middleware did not run — a path its matcher
  // skips, such as one ending in ".ab", still reaches a page — and a stamp whose path does not
  // decode ("!") cannot be gated. Either way a limited role is served as if it had no school,
  // which every page gate answers by sending it to choose; the older roles pass as before.
  if (!route) return isLimitedRole(ctx.role) ? "no-context" : "pass";
  const space = route.indexOf(" ");
  const method = route.slice(0, space);
  const raw = route.slice(space + 1);
  const path = raw === "!" ? null : routePath(raw);
  if (path === null) return isLimitedRole(ctx.role) ? "no-context" : "pass";
  if (path.startsWith("/api/v1/")) {
    // Nothing to look up for the older roles while no door names a module or a feature.
    if (!isLimitedRole(ctx.role) && !routesOf(catalog).some((r) => r.e.module || r.e.feature || r.e.kinds)) return "pass";
    const e = endpointFor(method, path, catalog);
    // A feature the operator has off is "not here" for everybody, whatever else the door would say.
    await assertDoorFeature(e, ctx);
    // Rule 4: a door for other kinds of institution is not here either (owner-batch-item5).
    await assertDoorKind(e, ctx.schoolId);
    if (isLimitedRole(ctx.role)) {
      // A door naming `duties` (5 Oct 2026) lets a FACULTY or HOD through only with one of them; its own sentence says so.
      if (!e || !permits({ access: e.access, limitedRoles: e.limitedRoles }, ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
      if (!permits(e, ctx.role, ctx.duties ?? [])) throw new AccessError("duties.refuseNoDuty");
      const own = MODULE_OF_ROLE[ctx.role];
      if (own && !isPersonDoor(path) && !(await ownModuleOn(ctx.role, ctx.schoolId))) throw new ModuleOffError(own);
    }
    if (e?.module && ctx.schoolId) await assertModuleOn(ctx.schoolId, e.module);
    return "pass";
  }
  if (path.startsWith("/api/")) {
    // The catalogued doors outside /api/v1 (api-catalog/unversioned.ts): the web's practice answer is the question bank's.
    if (routesOf(catalog).some((r) => r.e.feature && !r.e.path.startsWith("/api/v1/"))) await assertDoorFeature(endpointFor(method, path, catalog), ctx);
    return "pass";
  }
  if (ctx.role === "SUPPORT" && !supportPagePermitted(path)) return "no-context";
  if (isLimitedRole(ctx.role)) {
    const on = await enabledModules(ctx.schoolId);
    if (!modulePagePermitted(ctx.role, path, on, ctx.duties ?? [])) return ownPageModuleOff(ctx.role, path, on) ? "not-found" : "no-context";
  }
  return "pass";
}
