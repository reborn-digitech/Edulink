/**
 * R-30 (risks batch, 5 Oct 2026): the cross-school probe (`api:sweep --cross=school`) skipped 499 doors as "no id
 * in the path to swap", among them doors whose valid body or query names an id the other school's fixture holds.
 * scripts/cross-sampler.ts decides what the probe sends; these tests read the real catalog with two fixtures that
 * hold every row (no server, no database) and pin the decisions.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ENDPOINTS, type Endpoint, type SweepFixture } from "@/lib/api-catalog";
import { crossPlan, idsSwapped } from "../scripts/cross-sampler";

// Every field of SweepFixture, read from its type, so a field added there is in the fake too.
const src = readFileSync("src/lib/api-catalog/types.ts", "utf8");
const start = src.indexOf("export type SweepFixture = {");
const FIELDS = [...src.slice(start, src.indexOf("\n};", start)).matchAll(/^\s{2}(\w+): /gm)].map((m) => m[1]!);
const OBJECTS = new Set(["reportCardConfig", "certificateTemplate", "admissionCycle", "appraisal", "period"]);
/** A fixture holding every row: each id field a cuid-shaped id of this school's, the bodies it sends back its own. */
function fake(tag: string): SweepFixture {
  const value = (field: string): unknown => {
    if (field === "todayKey") return "2026-10-05";
    if (OBJECTS.has(field)) return { name: `ZZ ${tag}` };
    if (field.endsWith("Id")) return `c${tag}${String(FIELDS.indexOf(field)).padStart(4, "0")}${"x".repeat(16)}`;
    return `${tag}-${field}`;
  };
  return Object.fromEntries(FIELDS.map((f) => [f, value(f)])) as unknown as SweepFixture;
}
const home = fake("home");
const other = fake("othr");
const door = (method: string, path: string): Endpoint => {
  const e = ENDPOINTS.find((x) => x.method === method && x.path === path);
  if (!e) throw new Error(`${method} ${path} is not catalogued`);
  return e;
};

describe("idsSwapped", () => {
  it("counts the fixture's ids carried in place of the other school's, and refuses any other difference", () => {
    expect(idsSwapped({ classId: home.classId, n: 1 }, { classId: other.classId, n: 1 }, home, other)).toBe(1);
    expect(idsSwapped({ ids: [home.studentMembershipId, home.classId] }, { ids: [other.studentMembershipId, other.classId] }, home, other)).toBe(2);
    expect(idsSwapped({ a: "x" }, { a: "x" }, home, other)).toBe(0);
    // A name, a rule set or another field's id is not a swap: sending it would write the other school's data here.
    expect(idsSwapped({ name: "ZZ home" }, { name: "ZZ othr" }, home, other)).toBeNull();
    expect(idsSwapped({ classId: home.classId }, { classId: other.termId }, home, other)).toBeNull();
    expect(idsSwapped({ ids: [home.classId] }, { ids: [other.classId, other.classId] }, home, other)).toBeNull();
  });
});

describe("crossPlan", () => {
  it("sends the other school's ids in the body where the path names none", () => {
    const plan = crossPlan(door("POST", "/api/v1/office/substitutions"), home, other);
    expect(plan.kind).toBe("body");
    if (plan.kind === "body") expect(JSON.stringify(plan.body)).toContain(other.substitutionSlotId!);
  });

  it("sends the other school's pupil as the guardian's child where a door's probe body names one (the placement consent)", () => {
    const plan = crossPlan(door("POST", "/api/v1/family/placement/applications/{applicationId}/consent"), { ...home, placementApplicationId: "czzsameappforboth00000000" }, { ...other, placementApplicationId: "czzsameappforboth00000000" });
    expect(plan).toMatchObject({ kind: "body", body: { childId: other.studentMembershipId } });
  });

  it("puts the other school's id on a read's query, with the id as the needle a 2xx must not carry", () => {
    const plan = crossPlan(door("GET", "/api/v1/family/overview"), home, other);
    expect(plan).toEqual({ kind: "query", path: `/api/v1/family/overview?childId=${other.studentMembershipId}`, needles: [other.studentMembershipId] });
  });

  it("does not send a body that differs in more than ids, and skips a door with no id anywhere", () => {
    expect(crossPlan(door("POST", "/api/v1/office/report-card-config"), home, other).kind).toBe("body-not-ids");
    expect(crossPlan(door("GET", "/api/v1/admin/overview"), home, other).kind).toBe("none");
  });

  it("leaves the paths with ids and the fixed fixture samples as they were", () => {
    expect(crossPlan(door("POST", "/api/v1/placement/students/{membershipId}/dream"), home, other)).toMatchObject({ kind: "path", path: `/api/v1/placement/students/${other.studentMembershipId}/dream`, body: { on: false } });
    expect(crossPlan(door("POST", "/api/v1/iqac/surveys/{surveyId}/links"), home, other).kind).toBe("fixed");
    expect(crossPlan(door("POST", "/api/v1/admin/leave/{leaveId}/decide"), home, { ...other, leaveRequestId: null }).kind).toBe("no-row");
  });

  it("reaches doors the path-only rule skipped (a dry count over the catalog)", () => {
    const kinds = ENDPOINTS.map((e) => crossPlan(e, home, other).kind);
    const byBodyOrQuery = kinds.filter((k) => k === "body" || k === "query").length;
    expect(byBodyOrQuery).toBeGreaterThanOrEqual(40);
  });
});
