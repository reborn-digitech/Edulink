/**
 * EVERY DOOR HAS A CALLER (A3-inventory-8, audit of 5 October 2026).
 *
 * The inventory found four catalog doors no page or screen called: the fee
 * plan's removal, the operator's stop on an expert's payouts, the school's own
 * usage and the identity card's check (whose QR led to a missing /id-check
 * page). Each job is real, so each now has a web caller outside /api: the
 * remove button on a pupil's plan, the stop/pay-again action on the operator's
 * payee row, the usage card on the office's settings, and the /id-check page.
 * Read the way the inventory read them: the library function named by a file
 * under src/app that is not an /api route.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP = join(process.cwd(), "src/app");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return relative(APP, path) === "api" ? [] : files(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const callers = (fn: string) =>
  files(APP)
    .filter((f) => new RegExp(`\\b${fn}\\(`).test(readFileSync(f, "utf8")))
    .map((f) => relative(APP, f));

describe("the orphan doors of the inventory", () => {
  it.each([
    ["unassignPlan", "POST /fees/plans/remove", /^\(app\)\/admin\/fees\//],
    ["suspendPayee", "POST /operator/gigs/payees/{expertUserId}/suspend", /^root\/gigs\//],
    ["officeUsage", "GET /office/usage", /^\(app\)\/admin\/settings\//],
    ["idCheckView", "GET /id-cards/check", /^id-check\//],
  ])("%s (%s) is called by a page or its action", (fn, _door, where) => {
    expect(callers(fn).some((f) => where.test(f))).toBe(true);
  });
});
