/**
 * owner-batch-item13 (1 Nov 2026): THE API SWEEP'S ROLE VARIANTS hold to the catalog's reach. Every value of the closed
 * list (catalog types.ts REACHES) that a door declares maps to a pair — an actor the reach lets through and one it
 * refuses — and the walk actually puts both in front of some door; every variant is a fixture person; and the calls the
 * variants add are counted, so the run's length stays a number someone chose (scripts/sweep-sessions.ts).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ENDPOINTS } from "@/lib/api-catalog";
import { REACHES, reachFits, reachFor, reachRoles, type Endpoint, type Reach } from "@/lib/api-catalog/types";
import { NO_DUTY_VARIANT, REACH_PAIRS, SWEEP_VARIANTS, VARIANT_IDS, variantCallCount, variantCalls, type ReachActor } from "../scripts/sweep-sessions";

const roleOfVariant = new Map(SWEEP_VARIANTS.map((v) => [v.id, v.role]));
const usedReaches = (): Set<Reach> => {
  const used = new Set<Reach>();
  for (const e of ENDPOINTS) for (const role of reachRoles(e)) {
    const r = reachFor(e, role);
    if (r) used.add(r);
  }
  return used;
};

describe("the API sweep's role variants", () => {
  it("are one actor each, named once, with the ids the type lists", () => {
    expect(SWEEP_VARIANTS.map((v) => v.id).sort()).toEqual([...VARIANT_IDS].sort());
    expect(new Set(SWEEP_VARIANTS.map((v) => v.id)).size).toBe(SWEEP_VARIANTS.length);
    for (const v of SWEEP_VARIANTS) expect(v.who.split(/\s+/).length, v.id).toBeGreaterThanOrEqual(6);
  });

  it("every reach value has a pair: an actor let through and a variant refused, each of a role the value can describe", () => {
    for (const reach of REACHES) {
      const pair = REACH_PAIRS[reach];
      expect(pair.allowed.length, `${reach} lets nobody through`).toBeGreaterThan(0);
      expect(pair.refused.filter((a) => "variant" in a).length, `${reach} refuses no variant`).toBeGreaterThan(0);
      const roleOf = (a: ReachActor) => ("variant" in a ? roleOfVariant.get(a.variant) : a.base);
      for (const a of [...pair.allowed, ...pair.refused]) {
        const role = roleOf(a);
        expect(role, `${reach}: ${JSON.stringify(a)} is not a variant`).toBeDefined();
        if (role !== "any") expect(reachFits(reach, role!), `${reach} cannot describe ${JSON.stringify(a)}`).toBe(true);
      }
      // A variant is never both let through and refused by one value.
      const allowed = pair.allowed.filter((a) => "variant" in a).map((a) => (a as { variant: string }).variant);
      for (const a of pair.refused) if ("variant" in a) expect(allowed, `${reach}: ${a.variant}`).not.toContain(a.variant);
    }
    for (const [role, id] of Object.entries(NO_DUTY_VARIANT)) expect(roleOfVariant.get(id!), id).toBe(role);
  });

  it("every reach value the catalog declares is walked by the variants, refused and let through", () => {
    const used = usedReaches();
    expect(used.size).toBeGreaterThan(3);
    const seen = new Map<Reach, { allowed: number; refused: number }>();
    for (const e of ENDPOINTS) for (const call of variantCalls(e)) {
      if (!call.reach) continue;
      const row = seen.get(call.reach) ?? { allowed: 0, refused: 0 };
      if (call.verdict === "allowed") row.allowed++;
      if (call.verdict === "refused") row.refused++;
      seen.set(call.reach, row);
    }
    const unwalked: string[] = [];
    for (const r of used) {
      // The let-through side is the role's own actor's wherever the pair names only `base` actors there.
      const baseOnly = REACH_PAIRS[r].allowed.every((a) => "base" in a);
      if (!seen.get(r)?.refused) unwalked.push(`${r}: no variant refused at any door`);
      if (!baseOnly && !seen.get(r)?.allowed) unwalked.push(`${r}: no variant let through at any door`);
    }
    expect(unwalked).toEqual([]);
  });

  it("a door is walked by the variants its reach names for each role, the duty's variant and the support worker", () => {
    const door = (over: Partial<Endpoint>): Endpoint => ({ method: "GET", path: "/api/v1/x/{classId}", summary: "x", access: ["TEACHER", "ADMIN", "PRINCIPAL"], response: {} as never, ...over }) as Endpoint;
    const verdicts = (e: Endpoint) => Object.fromEntries(variantCalls(e).map((c) => [c.variant, c.verdict]));
    expect(verdicts(door({ reach: "teachesClass" }))).toEqual({ subjectTeacher: "allowed", coTeacher: "allowed", otherClassTeacher: "refused", adminWithoutHeadPages: "allowed", otherSchoolOffice: "refused", supportWorker: "role" });
    expect(verdicts(door({ reach: "formTeacher" }))).toMatchObject({ subjectTeacher: "refused", coTeacher: "allowed", otherClassTeacher: "refused" });
    expect(verdicts(door({ access: ["STUDENT", "PARENT"], reach: "ownChild" }))).toEqual({ classmate: "refused", otherGuardian: "refused", supportWorker: "role" });
    expect(verdicts(door({ access: ["ADMIN", "PRINCIPAL"], duties: ["HEAD_PAGES"] }))).toEqual({ adminWithoutHeadPages: "duty" });
    expect(verdicts(door({ access: ["EXPERT"], reach: "approvedExpert" }))).toEqual({ otherExpert: "allowed", expertUnderReview: "refused", supportWorker: "role" });
    // A sample that names no row (no parameter, query or body): nobody is refused anything there.
    expect(verdicts(door({ path: "/api/v1/family/x", sample: "/api/v1/family/x", access: ["STUDENT", "PARENT"], reach: "ownChild" }))).toEqual({ supportWorker: "role" });
    expect(verdicts(door({ path: "/api/v1/family/x", sample: "/api/v1/family/x?childId=cmut2zwrn00130rf8ezycwqgy", access: ["STUDENT", "PARENT"], reach: "ownChild" }))).toEqual({ classmate: "refused", otherGuardian: "refused", supportWorker: "role" });
    // A write whose valid body names no row (a guardian's own first child) is not asked a refusal; one naming a row is.
    const own = door({ method: "POST", path: "/api/v1/family/y", access: ["PARENT"], reach: "ownChild", sampleBody: () => ({}) });
    expect(variantCalls(own, () => true, "/api/v1/family/y", JSON.stringify({ allergies: "Peanuts" })).map((c) => c.variant)).toEqual(["supportWorker"]);
    expect(variantCalls(own, () => true, "/api/v1/family/y", JSON.stringify({ childId: "cmut2zwrn00130rf8ezycwqgy" })).filter((c) => c.verdict !== "role").map((c) => [c.variant, c.verdict, c.namedByPath])).toEqual([["otherGuardian", "refused", false]]);
    // No reach and no duty: the per-role walk alone.
    expect(variantCalls(door({}))).toEqual([]);
    // A write with a valid body is tried with it too.
    const write = variantCalls(door({ method: "POST", reach: "teachesClass", sampleBody: () => ({}) }));
    expect(write.find((c) => c.variant === "otherClassTeacher")?.withBody).toBe(true);
    expect(variantCallCount(write)).toBeGreaterThan(write.length);
  });

  it("every variant is a fixture person the fixtures make", () => {
    const fixtures = readFileSync("scripts/zz-fixtures.ts", "utf8") + readFileSync("scripts/zz-college.ts", "utf8");
    for (const v of SWEEP_VARIANTS) {
      // A numbered pupil or guardian is made by the class loop (`zz.pupil${…}`, `zz.parent${…}`); the rest by name.
      const numbered = "email" in v.person ? v.person.email.match(/^(zz\.(?:pupil|parent))\d+@/) : null;
      if ("email" in v.person) expect(fixtures.includes(numbered ? `${numbered[1]}\${` : v.person.email.replace("@zz.test", "@")), `${v.id}: ${v.person.email}`).toBe(true);
      else expect(fixtures.includes(v.person.supportName), `${v.id}: ${v.person.supportName}`).toBe(true);
    }
    // The second admin is never given the head's pages by the fixture's own grant.
    expect(fixtures).toMatch(/giveHeadPages\(db, northgate\.school\.id, \{ except: \[VARIANT_ADMIN_EMAIL\] \}\)/);
  });

  it("adds a counted number of calls, walking only doors with a reach or a duty", () => {
    let calls = 0;
    let doors = 0;
    for (const e of ENDPOINTS) {
      const n = variantCallCount(variantCalls(e));
      if (n === 0) continue;
      doors++;
      calls += n;
      expect(Boolean(e.reach || e.duties?.length || (Array.isArray(e.access) && e.access.includes("SUPPORT"))), `${e.method} ${e.path}`).toBe(true);
    }
    console.log(`role variants: ${calls} calls at most over ${doors} doors (before the sweep's own skips: no sample, a feature off, a variant the fixtures lack)`);
    expect(doors).toBeGreaterThan(100);
    // Within reason: the per-role walk is some 16,000 calls; the variants stay well under a third of that.
    expect(calls).toBeLessThan(5_000);
  });
});
