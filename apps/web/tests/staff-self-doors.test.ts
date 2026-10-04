/**
 * A member of staff's own doors name every staff role (campaign 2026-10-04,
 * G-1 and G-2). The college's six (FACULTY, HOD, EXAM_CONTROLLER, IQAC, TPO,
 * ACCOUNTS) are limited roles: the gate answers 403 to any door that does not
 * name them, whatever the handler would allow. The libraries behind these
 * doors already took every role in SCHOOL_STAFF_ROLES; the catalog and the
 * handlers named only the school's six, so a faculty member's "My payslips"
 * on the phone and a check-in were refused. The catalog, the handler and the
 * library must agree.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENDPOINTS } from "@/lib/api-catalog";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";

const SELF_DOORS: [method: string, path: string, file: string][] = [
  ["GET", "/api/v1/account/payslips", "account/payslips/route.ts"],
  ["GET", "/api/v1/account/payslips/statement", "account/payslips/statement/route.ts"],
  ["GET", "/api/v1/account/payslips/{month}/pdf", "account/payslips/[month]/pdf/route.ts"],
  ["POST", "/api/v1/account/advances", "account/advances/route.ts"],
  ["GET", "/api/v1/account/inventory", "account/inventory/route.ts"],
  ["POST", "/api/v1/account/inventory/requests", "account/inventory/requests/route.ts"],
  ["POST", "/api/v1/account/inventory/requests/cancel", "account/inventory/requests/cancel/route.ts"],
  ["GET", "/api/v1/staff/attendance/me", "staff/attendance/me/route.ts"],
  ["POST", "/api/v1/staff/attendance/check-in", "staff/attendance/check-in/route.ts"],
];

describe("a member of staff's own doors", () => {
  it.each(SELF_DOORS)("%s %s names every staff role in the catalog and the handler", (method, path, file) => {
    const door = ENDPOINTS.find((e) => e.method === method && e.path === path);
    expect(door, `${method} ${path} is in the catalog`).toBeDefined();
    expect(Array.isArray(door!.access) ? [...door!.access].sort() : door!.access).toEqual([...SCHOOL_STAFF_ROLES].sort());
    const handler = readFileSync(join(__dirname, "..", "src", "app", "api", "v1", file), "utf8");
    expect(handler).toMatch(/requireApiRole\(\.\.\.SCHOOL_STAFF_ROLES\)/);
  });
});
