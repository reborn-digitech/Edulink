/**
 * The features-on API sweep of 15 November 2026 (TA-512's run, `npm run api:sweep -- --features=on --plans=on`) answered
 * 36 calls unexpectedly. Its diagnosis found four causes; three are pinned here (the fourth, the problem report's 500,
 * is a case of tests/ta-mobile-core-app-report.test.ts):
 *
 *   - the sweep's plan state had drifted from the server's gate: since TA-185 a person holding a plan holds every
 *     feature the plan lists today, but the sweep still counted only the rows written, and expected 402 for 31 calls
 *     the server rightly let through (scripts/sweep-features.ts readGateState now reads the one rule in contracts);
 *   - TA-545's per-role answers on the absence-notes door had left out the empty body's 422, which the sweep's
 *     empty-body call meets first;
 *   - tests/competition-leaderboard.test.ts deleted every competition titled "ZZ …" in every school, the sweeps'
 *     "ZZ Sweep Quiz" fixture among them, so a later sweep entered whatever open competition came first.
 *
 * One scratch ZZ person of this suite's own, with entitlement rows of its own, removed afterwards by id.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { featuresOfPlanRow } from "@edulink/contracts";
import { ENDPOINTS } from "@/lib/api-catalog";
import { entitledFeatures } from "@/lib/person-plans";
import { readGateState } from "../scripts/sweep-features";

const db = new PrismaClient();
const STAMP = Date.now();
let userId = "";

beforeAll(async () => {
  userId = (await db.user.create({ data: { name: `ZZ Sweep Findings ${STAMP}`, email: `zz-sweep-findings-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  const now = Date.now();
  const window = { validFrom: new Date(now - 86_400_000), validTo: new Date(now + 30 * 86_400_000) };
  // A TEACHER plan whose window was written when the plan listed only teaching sessions and the assistant, and whose
  // assistant row the operator later revoked: the plan's other features today are held, the revoked one is not.
  await db.entitlement.createMany({
    data: [
      { userId, feature: "TEACHER_SESSIONS", source: "GRANT", planCode: "TEACHER", ...window },
      { userId, feature: "ASSISTANT", source: "GRANT", planCode: "TEACHER", ...window, revokedAt: new Date(now - 3_600_000) },
    ],
  });
});

afterAll(async () => {
  await db.entitlement.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("the sweeps judge plans by the server's own rule", () => {
  it("TA-512 (sweep): a held plan's features today are held, a revoked row keeps its feature shut, and the sweep reads exactly what the gate reads", async () => {
    const server = [...(await entitledFeatures(userId))].sort();
    const swept = [...((await readGateState(db, [userId])).entitled.get(userId) ?? new Set())].sort();
    expect(server).toContain("TEACHER_SESSIONS");
    expect(server).not.toContain("ASSISTANT");
    // Every feature the TEACHER plan lists today but the window names no row for is held: the rule the sweep missed.
    const teacher = await db.personPlan.findUnique({ where: { code: "TEACHER" }, select: { code: true, features: true } });
    const opened = featuresOfPlanRow(teacher ?? { code: "TEACHER", features: null }).filter((f) => f !== "ASSISTANT" && f !== "TEACHER_SESSIONS");
    expect(opened.length).toBeGreaterThan(0);
    for (const feature of opened) expect(server).toContain(feature);
    expect(swept).toEqual(server);
  });
});

describe("the absence-notes door's declared answers", () => {
  it("TA-545 (sweep): the pupil's and the guardian's declared answers keep the empty body's 422 beside 200 and 403", () => {
    const door = ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/family/students/{membershipId}/absence-notes");
    expect(door).toBeTruthy();
    for (const role of ["STUDENT", "PARENT"] as const) {
      const declared = door!.statusByRole?.[role];
      expect((Array.isArray(declared) ? [...declared] : declared === undefined ? [] : [declared]).sort()).toEqual([200, 403, 422]);
    }
  });
});

describe("the leaderboard suite leaves the sweeps' competition fixture alone", () => {
  it("TA-512 (sweep): the leaderboard suite no longer removes competitions by a title prefix alone", () => {
    const source = readFileSync(join(__dirname, "competition-leaderboard.test.ts"), "utf8");
    expect(source).not.toMatch(/competition\.deleteMany\(\{\s*where:\s*\{\s*title:\s*\{\s*startsWith:/);
  });
});
