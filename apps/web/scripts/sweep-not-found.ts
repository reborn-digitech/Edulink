/**
 * THE NOT-FOUND REPORT (TA-512, decided 14 Nov 2026: list first, then declare and tighten). Unless the catalog declares
 * a status for the role (`statusByRole`, then `emptyBodyStatus`), the API sweep lets a permitted role's GET answer 200
 * or 404, so a fixed-address read that answers "not found" to the very role it serves (a wrong where clause, a lost
 * membership join) passes unseen. `--report-not-found` lists every such answer and fails nothing: each fixed-address
 * read (no parameter in its catalog path) that answered 404 to a permitted role on the strength of that default alone,
 * door by door with the roles it answered so, printed at the end of the run and, with `--report-not-found=<file>`,
 * written there as JSON (CI uploads it). The by-design 404s it finds are then to be declared per role, and only after
 * that does the default become "must succeed"; until then the default is unchanged and this list is the whole change.
 * Pure, so tests/ta-decision-512-not-found-report.test.ts holds it.
 */
import type { Endpoint } from "../src/lib/api-catalog";
import { declaredStatus } from "../src/lib/api-catalog/types";
import type { Role } from "../src/lib/constants";

export const NOT_FOUND_FLAG = "--report-not-found";

/**
 * The report mode from the command line: undefined when it is off, null when it is on with no file (`--report-not-found`),
 * the file's path with `--report-not-found=<file>`. An empty `=` is refused rather than read as "no file".
 */
export function notFoundReportFlag(argv: readonly string[]): string | null | undefined {
  const arg = argv.find((a) => a === NOT_FOUND_FLAG || a.startsWith(`${NOT_FOUND_FLAG}=`));
  if (arg === undefined) return undefined;
  if (arg === NOT_FOUND_FLAG) return null;
  const file = arg.slice(NOT_FOUND_FLAG.length + 1).trim();
  if (!file) throw new Error(`${NOT_FOUND_FLAG}=: name a file, or give the flag alone to print the list only`);
  return file;
}

/** The one read the sweep holds to 200 whatever the catalog says (api-sweep.ts expected()): the event stream. */
const ALWAYS_200 = "/api/v1/events";

/**
 * Whether this role's answer at this door is judged by the sweep's default `[200, 404]` alone: a GET at a fixed address
 * (no `{parameter}` in its catalog path), for a role the door's access names (not the account doors, decided by the
 * person's memberships, nor the operator's and the content team's, which refuse every role token), with no status the
 * catalog declares for that role. `permitted` is the sweep actor's own `permits` (its duties included).
 */
export function judgedByDefault(e: Pick<Endpoint, "method" | "path" | "access" | "emptyBodyStatus" | "statusByRole">, role: Role, permitted: boolean): boolean {
  if (e.method !== "GET" || /\{\w+\}/.test(e.path) || e.path === ALWAYS_200) return false;
  if (e.access === "anyone" || e.access === "account" || e.access === "operator" || e.access === "app-admin") return false;
  if (!permitted) return false;
  return declaredStatus(e, role) === undefined;
}

export type NotFoundDoor = { door: string; sample: string; roles: Role[] };
export type NotFoundReportJson = {
  finding: "TA-512";
  generatedAt: string;
  base: string;
  gate: string;
  judgedCalls: number;
  judgedDoors: number;
  notFoundCalls: number;
  doors: NotFoundDoor[];
};

/** The run's list: every call judged by the default, and the ones among them that answered 404. */
export class NotFoundReport {
  private readonly judged = new Map<string, Set<Role>>();
  private readonly found = new Map<string, NotFoundDoor>();

  /** One call judged by the default; `status` is what it answered. Only a 404 is listed. */
  note(e: Pick<Endpoint, "method" | "path">, role: Role, sample: string, status: number): void {
    const door = `${e.method} ${e.path}`;
    const seen = this.judged.get(door) ?? new Set<Role>();
    seen.add(role);
    this.judged.set(door, seen);
    if (status !== 404) return;
    const row = this.found.get(door) ?? { door, sample, roles: [] };
    if (!row.roles.includes(role)) row.roles.push(role);
    this.found.set(door, row);
  }

  /** The doors that answered 404, in door order, each with its roles in order. */
  doors(): NotFoundDoor[] {
    return [...this.found.values()].map((r) => ({ ...r, roles: [...r.roles].sort() })).sort((a, b) => a.door.localeCompare(b.door));
  }

  /** The printed list and its count; it states that nothing in it failed the run. */
  lines(): string[] {
    const doors = this.doors();
    const calls = doors.reduce((n, d) => n + d.roles.length, 0);
    const judgedCalls = [...this.judged.values()].reduce((n, s) => n + s.size, 0);
    return [
      ...doors.map((d) => `· not found (report): ${d.door} as ${d.roles.join(", ")}${d.sample !== d.door.replace(/^\w+ /, "") ? ` (sample ${d.sample})` : ""}`),
      `not-found report (TA-512): ${calls} of ${judgedCalls} calls at ${doors.length} of ${this.judged.size} fixed-address reads judged by the default [200, 404] answered 404 to a permitted role; listed, none failed — declare the by-design ones per role (statusByRole) before the default becomes "must succeed".`,
    ];
  }

  json(at: Date, base: string, gate: string): NotFoundReportJson {
    const doors = this.doors();
    return {
      finding: "TA-512",
      generatedAt: at.toISOString(),
      base,
      gate,
      judgedCalls: [...this.judged.values()].reduce((n, s) => n + s.size, 0),
      judgedDoors: this.judged.size,
      notFoundCalls: doors.reduce((n, d) => n + d.roles.length, 0),
      doors,
    };
  }
}
