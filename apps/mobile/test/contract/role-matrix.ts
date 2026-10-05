/**
 * What the role matrix expects of one GET, from the OpenAPI document alone.
 *
 * The access list (x-access, x-limited-roles) says which roles a door opens
 * to. Since LOAD-6 (4 Oct 2026) the matrix also reads where the actor stands,
 * the way the web's API sweep does (apps/web/scripts/api-sweep.ts, SWEEPS-4):
 *
 * - a door whose module (x-module) the actor's school has off answers 403
 *   MODULE_OFF to every role it would otherwise open to ("must"); a guardian's
 *   session names no school, so there the gate's answer is the handler's for
 *   the child's school and MODULE_OFF is allowed, not required ("may");
 * - a college's door (x-college: filed in a college module's catalog file,
 *   module or none) may answer 403 MODULE_OFF to an actor who is not at a
 *   college ("may");
 * - a door naming duties (x-duties, 5 Oct 2026) opens to a FACULTY or HOD
 *   only holding one of them — the actor's own /me `duties`.
 *
 * Kept out of the contract test itself so the phone's ordinary battery can
 * hold these rules against the committed document without a server
 * (test/lib/role-matrix.test.ts).
 */
import { isCollegeKind, type Me } from "@edulink/contracts";

export type Access = "anyone" | "signed-in" | "account" | "operator" | "app-admin" | string[];
export type Op = { "x-access": Access; "x-limited-roles"?: string[]; "x-module"?: string; "x-college"?: boolean; "x-duties"?: string[] };
export type Doc = { paths: Record<string, Record<string, Op>> };
export type Want = "2xx" | 401 | 403 | "2xx-or-403";
export type Off = "must" | "may" | "no";
/** Where an actor stands: the active school (null for a guardian), the modules on there (a guardian: the children's schools'), and whether it is a college. */
export type Tenant = { schoolId: string | null; modules: ReadonlySet<string>; college: boolean } | null;
/** One answer as the app's client returns it. */
export type Answer = { ok: boolean; status?: number; code?: string };

/**
 * What the catalog's access list says a role gets: a permitted role answers
 * 2xx; a refused one 403; no session 401 unless the door is for anyone. A
 * permitted role may also answer 422 — the door wanted a query the bare path
 * does not carry — which `judge` treats as a door that opened.
 */
export function allowed(op: Op, role: string | null, limitedRoles: readonly string[], duties: readonly string[] = []): Want {
  const access = op["x-access"];
  if (access === "anyone") return "2xx";
  if (role === null) return 401;
  // The operator's and the content team's endpoints: no school role opens them.
  if (access === "operator" || access === "app-admin") return 403;
  // An account door is decided by the person's memberships, which a role token does not say.
  if (access === "account") return "2xx-or-403";
  // "signed-in" is every role but a limited role's (module, college staff, recruiter), which passes only where x-limited-roles names it.
  const byRole = access === "signed-in" ? !limitedRoles.includes(role) || (op["x-limited-roles"] ?? []).includes(role) : access.includes(role);
  if (!byRole) return 403;
  // A door naming duties (x-duties, 5 Oct 2026) opens to a FACULTY or HOD only holding one: the actor's /me `duties`.
  if (op["x-duties"]?.length && (role === "FACULTY" || role === "HOD") && !op["x-duties"].some((d) => duties.includes(d))) return 403;
  return "2xx";
}

/** The actor's standing from its own /api/v1/me: no school and no school among its contexts (an expert, a recruiter) is null. */
export function tenantFromMe(me: Pick<Me, "active" | "modules" | "institutionKind" | "contexts">): Tenant {
  const schools = me.contexts.filter((c) => c.schoolId);
  if (!me.active.schoolId && schools.length === 0) return null;
  const college = me.active.schoolId ? isCollegeKind(me.institutionKind ?? "SCHOOL") : schools.some((c) => c.institutionKind != null && isCollegeKind(c.institutionKind));
  return { schoolId: me.active.schoolId, modules: new Set(me.modules), college };
}

/** Whether a permitted role's answer must, or may, be the module gate's 403 MODULE_OFF; "no" for a refused role, signed out, or an operator's door. */
export function moduleOff(op: Op, want: Want, tenant: Tenant): Off {
  if (!tenant || (want !== "2xx" && want !== "2xx-or-403")) return "no";
  const module = op["x-module"];
  if (module && !tenant.modules.has(module)) return tenant.schoolId ? "must" : "may";
  if (op["x-college"] && !tenant.college) return "may";
  return "no";
}

/** Whether the answer is what `want` allows, with the module gate's answer where `off` says; null when fine, else the line the test prints. */
export function judge(want: Want, off: Off, res: Answer): string | null {
  const isModuleOff = !res.ok && res.status === 403 && res.code === "MODULE_OFF";
  const got = res.ok || ((want === "2xx" || want === "2xx-or-403") && res.status === 422) ? "2xx" : res.status;
  const base = want === "2xx-or-403" ? got === "2xx" || got === 403 : got === want;
  const fine = off === "must" ? isModuleOff : base || (off === "may" && isModuleOff);
  if (fine) return null;
  const wanted = off === "must" ? "403 MODULE_OFF" : off === "may" ? `${want} or 403 MODULE_OFF` : `${want}`;
  return `wanted ${wanted}, got ${got}${res.ok ? "" : ` (${res.code})`}`;
}

/** The parameterless GETs the app's screens call that the document lists: what one actor's walk visits. */
export function walkedGets(doc: Doc, calls: readonly { method: string; path: string }[]): string[] {
  return [...new Set(calls.filter((c) => c.method === "GET" && !c.path.includes("/x")).map((c) => c.path))].filter((p) => doc.paths[p]?.get);
}

/**
 * next dev's cost of one door in the walk, with room: one actor's walk of the
 * whole list (170 doors) took 71–90 s on 5 October 2026 (about 0.5 s a door, each door
 * compiled on its first call), against the old fixed 60 s that timed out
 * every walk (STREAMS-7). `next start` answers the same walk in seconds, so a
 * passing run is never slower for the larger budget.
 */
export const WALK_MS_PER_DOOR = 1_500;
/** The floor the budget never goes under: the old fixed default. */
export const WALK_MS_FLOOR = 60_000;

/** One actor's walk budget: EDULINK_CONTRACT_WALK_MS when set to a positive number, else derived from how many doors the walk visits. */
export function walkBudgetMs(doors: number, env?: string): number {
  const set = Number(env);
  if (env && Number.isFinite(set) && set > 0) return set;
  return Math.max(WALK_MS_FLOOR, doors * WALK_MS_PER_DOOR);
}
