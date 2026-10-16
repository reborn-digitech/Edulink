/**
 * THE SWEEPS' READING OF THE FEATURE SWITCHES AND THE PLANS (16 Oct 2026; scripts/sweep-features.ts).
 *
 * The page sweep and the API sweep judge a door or a page by what the database says about the switches and the
 * plans, with a copy of the server's rules that runs in a plain script. These tests hold that copy to the rules:
 * `planNeeded` to person-plans.ts PLAN_TABLE cell by cell, `doorGate` to the session's own gate (role-gate.ts) for
 * every catalogued door of a feature in four states of the switches and plans, and FEATURE_PAGES to every layout
 * under app/(app) that gates its pages by a feature — so a layout added, moved or re-gated without the sweep
 * knowing fails here rather than as a puzzling sweep line.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { PERSON_PLANS, PLATFORM_FEATURES, type FeatureCode, type PlanCode } from "@edulink/contracts";
import { ENDPOINTS } from "@/lib/api-catalog";
import { featuresOf } from "@/lib/api-catalog/types";
import { gateRequest } from "@/lib/role-gate";
import { FeatureOffError, PlanRequiredError } from "@/lib/access-error";
import { setFeaturesForTests } from "@/lib/platform-features";
import { PLAN_TABLE, setActivePlansForTests } from "@/lib/person-plans";
import { SESSION_FEATURES } from "@/lib/nav";
import { ROLES, type Role } from "@/lib/constants";
import { accessFor, doorGate, FEATURE_PAGES, featurePageOf, gateFlags, pageGate, planNeeded, runSwitches, type GateState } from "../scripts/sweep-features";

const ALL = [...PLATFORM_FEATURES];
afterEach(() => {
  setFeaturesForTests(ALL);
  setActivePlansForTests([]);
});

const state = (on: readonly FeatureCode[], plans: readonly PlanCode[], entitled: Record<string, FeatureCode[]> = {}): GateState => ({
  on: new Set(on),
  activePlans: new Set(plans),
  entitled: new Map(Object.entries(entitled).map(([u, f]) => [u, new Set(f)])),
});

describe("the sweeps' copy of the plan table", () => {
  it("names the same plan as PLAN_TABLE for every role and feature", () => {
    for (const role of ROLES) {
      for (const code of PLATFORM_FEATURES) {
        const row = PLAN_TABLE[role as Role];
        const want = row && row.features.includes(code) ? row.plan : null;
        expect(planNeeded(role, code), `${role} × ${code}`).toBe(want);
      }
    }
    expect(planNeeded(null, "QUESTION_BANK")).toBeNull();
  });

  it("opens a locked feature to the person whose entitlement covers it, and only to them", () => {
    const s = state(["QUESTION_BANK"], ["STUDENT"], { pupil01: ["QUESTION_BANK"] });
    expect(accessFor(["QUESTION_BANK"], { role: "STUDENT", userId: "pupil01" }, s)).toEqual({ state: "open" });
    expect(accessFor(["QUESTION_BANK"], { role: "STUDENT", userId: "pupil02" }, s)).toEqual({ state: "plan", feature: "QUESTION_BANK", plan: "STUDENT" });
    expect(accessFor(["QUESTION_BANK"], { role: "TEACHER", userId: "teacher" }, s)).toEqual({ state: "open" });
    expect(accessFor(["QUESTION_BANK"], { role: "STUDENT", userId: "pupil02" }, state(["QUESTION_BANK"], []))).toEqual({ state: "open" });
    expect(accessFor(["QUESTION_BANK"], { role: "STUDENT", userId: "pupil02" }, state([], ["STUDENT"]))).toEqual({ state: "off", feature: "QUESTION_BANK" });
  });

  it("reads the two flags", () => {
    expect(gateFlags(["--features=on"])).toEqual({ features: true, plans: false });
    expect(gateFlags(["--plans=on", "--features=on"])).toEqual({ features: true, plans: true });
    expect(gateFlags([])).toEqual({ features: false, plans: false });
  });
});

describe("the sweeps' copy of the session's gate (role-gate.ts rule 3)", () => {
  // The older roles and the outside ones, with no school so the module rule asks nothing; the limited roles meet
  // their own rules after this one and are judged the same way by the sweep (the feature answer comes first).
  const roles: Role[] = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "EXPERT"];
  const states: { name: string; on: readonly FeatureCode[]; plans: readonly PlanCode[] }[] = [
    { name: "everything off", on: [], plans: [] },
    { name: "everything on, no plan active", on: ALL, plans: [] },
    { name: "everything on, every plan active", on: ALL, plans: [...PERSON_PLANS] },
    { name: "expert sessions alone, the expert plan active", on: ["EXPERT_SESSIONS"], plans: ["EXPERT"] },
  ];
  const doors = ENDPOINTS.filter((e) => featuresOf(e).length > 0 && e.path.startsWith("/api/v1/"));

  it("has doors to compare", () => expect(doors.length).toBeGreaterThan(50));

  for (const st of states) {
    it(`answers every feature door as the gate does: ${st.name}`, async () => {
      setFeaturesForTests(st.on);
      setActivePlansForTests(st.plans);
      const s = state(st.on, st.plans);
      const seen = new Set<string>();
      for (const e of doors) {
        const path = e.path.replace(/\{[^}]+\}/g, "zz-sweep-id");
        for (const role of roles) {
          let got: "open" | "off" | "plan";
          try {
            await gateRequest(`${e.method} ${path}`, { role, schoolId: null, userId: null });
            got = "open";
          } catch (error) {
            if (error instanceof PlanRequiredError) got = "plan";
            else if (error instanceof FeatureOffError) got = "off";
            else throw error;
          }
          expect(doorGate(e, { role, userId: null }, s).state, `${e.method} ${e.path} as ${role}`).toBe(got);
          seen.add(got);
        }
      }
      // Each state is a real one: off where nothing is on, a 402 somewhere once a plan is asked for.
      expect(seen.has(st.on.length === 0 ? "off" : "open")).toBe(true);
      if (st.plans.length) expect(seen.has("plan")).toBe(true);
    });
  }
});

describe("the feature layouts the page sweep knows", () => {
  const appDir = join(__dirname, "..", "src", "app", "(app)");
  const layouts: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "layout.tsx") layouts.push(full);
    }
  };
  walk(appDir);
  const constants: Record<string, readonly FeatureCode[]> = { SESSION_FEATURES };
  const found = layouts.flatMap((file) => {
    const text = readFileSync(file, "utf8");
    const call = /(featurePageLock|requireFeatureSwitchPage)\(([^)]*)\)/.exec(text);
    if (!call) return [];
    const arg = call[2]!.trim();
    const literal = /^"([A-Z_]+)"$/.exec(arg);
    const features = literal ? [literal[1] as FeatureCode] : constants[arg];
    if (!features) throw new Error(`${file}: the sweep cannot read the feature argument ${arg}`);
    const route = `/${relative(appDir, file).split(sep).slice(0, -1).filter((s) => !/^\(.*\)$/.test(s)).join("/")}`;
    return [{ prefix: route, features: [...features], planFree: call[1] === "requireFeatureSwitchPage" }];
  });

  it("lists exactly the layouts that gate by a feature, with their features and whether a plan is asked", () => {
    const table = FEATURE_PAGES.map((p) => ({ prefix: p.prefix, features: [...p.features], planFree: p.planFree === true }));
    const byPrefix = (a: { prefix: string }, b: { prefix: string }) => a.prefix.localeCompare(b.prefix);
    expect(table.sort(byPrefix)).toEqual(found.sort(byPrefix));
  });

  it("finds a page's layout by its route, not its query", () => {
    expect(featurePageOf("/student/practice/fractions?x=1")?.prefix).toBe("/student/practice");
    expect(featurePageOf("/sessions?tab=mine")?.features).toEqual(["EXPERT_SESSIONS", "TEACHER_SESSIONS"]);
    expect(featurePageOf("/sessionsx")).toBeNull();
    expect(featurePageOf("/admin")).toBeNull();
  });

  it("keeps a lapsed plan's pages open on the switch alone", () => {
    const s = state(["EXPERT_SESSIONS"], ["EXPERT"]);
    expect(pageGate("/expert/earnings", { role: "EXPERT", userId: "x" }, s)).toEqual({ state: "open" });
    expect(pageGate("/expert/availability", { role: "EXPERT", userId: "x" }, s)).toEqual({ state: "plan", feature: "EXPERT_SESSIONS", plan: "EXPERT" });
    expect(pageGate("/expert/earnings", { role: "EXPERT", userId: "x" }, state([], []))).toEqual({ state: "off", feature: "EXPERT_SESSIONS" });
    expect(pageGate("/admin", { role: "ADMIN", userId: "x" }, s)).toBeNull();
  });
});

describe("--features=on and --plans=on", () => {
  /** A database with two features on and one plan active, the ZZ operator, and a record of the sessions made. */
  const fakeDb = () => {
    const sessions: string[] = [];
    const db = {
      platformFeature: { findMany: async () => PLATFORM_FEATURES.map((code) => ({ code, enabled: code === "JOB_BOARD" || code === "ASSISTANT" })) },
      personPlan: { findMany: async () => PERSON_PLANS.map((code) => ({ code, active: code === "TEACHER" })) },
      user: { findUnique: async () => ({ id: "zz-operator", isSuperuser: true }) },
      session: {
        create: async () => {
          sessions.push("made");
          return { id: `s${sessions.length}` };
        },
        deleteMany: async () => {
          sessions.push("deleted");
          return { count: 1 };
        },
      },
    };
    return { db: db as unknown as PrismaClient, sessions };
  };

  it("switches on only what is off, through the operator's doors, and puts exactly that back once", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init: { method: string; body: string }) => {
      calls.push(`${init.method} ${url.replace("http://sweep.test", "")} ${init.body}`);
      return new Response("{}", { status: 200 });
    });
    try {
      const { db, sessions } = fakeDb();
      const run = runSwitches(db, "http://sweep.test", { features: true, plans: true });
      const on = await run.on();
      expect(on.features).toEqual(PLATFORM_FEATURES.filter((c) => c !== "JOB_BOARD" && c !== "ASSISTANT"));
      expect(on.plans).toEqual(["STUDENT", "EXPERT"]);
      expect(calls).toContain('POST /api/v1/operator/features/QUESTION_BANK {"on":true}');
      expect(calls.some((c) => c.includes("JOB_BOARD"))).toBe(false);
      expect(calls).toContain('PUT /api/v1/operator/person-plans {"code":"STUDENT","active":true}');
      calls.length = 0;
      await Promise.all([run.restore(), run.restore()]);
      await run.restore();
      expect(calls.filter((c) => c.endsWith('{"on":false}'))).toHaveLength(on.features.length);
      expect(calls.filter((c) => c.endsWith('"active":false}'))).toHaveLength(2);
      expect(calls.some((c) => c.includes("JOB_BOARD") || c.includes('"code":"TEACHER"'))).toBe(false);
      // One short operator session per batch, each deleted after it.
      expect(sessions).toEqual(["made", "deleted", "made", "deleted"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("touches nothing without the flags, and stops at a refused switch with what it did remembered", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init: { method: string; body: string }) => {
      calls.push(`${init.method} ${url}`);
      return new Response("no", { status: calls.length === 2 ? 500 : 200 });
    });
    try {
      const { db } = fakeDb();
      expect(await runSwitches(db, "http://sweep.test", { features: false, plans: false }).on()).toEqual({ features: [], plans: [] });
      expect(calls).toHaveLength(0);
      const run = runSwitches(db, "http://sweep.test", { features: true, plans: false });
      await expect(run.on()).rejects.toThrow(/answered 500/);
      calls.length = 0;
      await run.restore();
      expect(calls).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
