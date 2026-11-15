/**
 * THE NOT-FOUND REPORT AND THE DEFAULT (TA-512, decided 14 Nov 2026: list first, then declare and tighten). Unless the
 * catalog declares a status for the role (`statusByRole`, then `emptyBodyStatus`), the API sweep let a permitted role's
 * GET answer 200 or 404, so a fixed-address read that answers "not found" to the very role it serves (a wrong where
 * clause, a lost membership join) passed unseen. `--report-not-found` lists every such answer: each fixed-address read
 * (no parameter in its catalog path) that answered 404 to a permitted role with nothing declared for that role, door by
 * door with the roles it answered so, printed at the end of the run and, with `--report-not-found=<file>`, written there
 * as JSON (CI uploads it). The run with platform features and plans on (15 Nov 2026) listed twelve such reads, each by
 * design for the role that met it and now declared for that role alone in the catalog; so the default for a
 * fixed-address read is 200 (`defaultGetStatus`, read by api-sweep.ts expected()), and a 404 there fails the run, while
 * the report still lists it, to be declared for its role with why, or fixed. A read whose path names a parameter keeps
 * [200, 404]. Pure, so tests/ta-decision-512-not-found-report.test.ts and tests/ta-decision-512-tightened-default.test.ts
 * hold it.
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
 * A FIXED-ADDRESS READ: a GET with no `{parameter}` in its catalog path (a query string is not one), other than the
 * event stream, at a door whose access names roles — not anyone's, nor the account doors (decided by the person's
 * memberships), nor the operator's and the content team's (which refuse every role token). A permitted role's 404 there
 * is either declared for that role in the catalog (a query naming another tenant's row, a filing the college's streams
 * do not bring) or a fault.
 */
export function fixedAddressRead(e: Pick<Endpoint, "method" | "path" | "access">): boolean {
  if (e.method !== "GET" || /\{\w+\}/.test(e.path) || e.path === ALWAYS_200) return false;
  return !(e.access === "anyone" || e.access === "account" || e.access === "operator" || e.access === "app-admin");
}

/**
 * THE DEFAULT for a permitted role's GET where the catalog declares nothing for that role (TA-512's last step, 15 Nov
 * 2026; api-sweep.ts expected() reads it after `declaredStatus`): a fixed-address read must answer 200; a read whose
 * path names a parameter may answer 404 too, its sample being another tenant's row to some actors (G4-2).
 */
export function defaultGetStatus(e: Pick<Endpoint, "method" | "path" | "access">): number[] {
  return fixedAddressRead(e) ? [200] : [200, 404];
}

/**
 * Whether this role's answer at this door is judged by the sweep's default alone, which is then 200: a fixed-address
 * read, for a role the door lets in, with no status the catalog declares for that role. `permitted` is the sweep
 * actor's own `permits` (its duties included).
 */
export function judgedByDefault(e: Pick<Endpoint, "method" | "path" | "access" | "emptyBodyStatus" | "statusByRole">, role: Role, permitted: boolean): boolean {
  if (!fixedAddressRead(e) || !permitted) return false;
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

  /** The printed list and its count; each call in it is also one of the run's unexpected answers, which it says. */
  lines(): string[] {
    const doors = this.doors();
    const calls = doors.reduce((n, d) => n + d.roles.length, 0);
    const judgedCalls = [...this.judged.values()].reduce((n, s) => n + s.size, 0);
    return [
      ...doors.map((d) => `· not found (report): ${d.door} as ${d.roles.join(", ")}${d.sample !== d.door.replace(/^\w+ /, "") ? ` (sample ${d.sample})` : ""}`),
      `not-found report (TA-512): ${calls} of ${judgedCalls} calls at ${doors.length} of ${this.judged.size} fixed-address reads judged by the default [200] answered 404 to a permitted role; each failed the run (above) — declare a by-design one for its role (statusByRole) with why, or fix the read.`,
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
