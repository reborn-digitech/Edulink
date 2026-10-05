/**
 * THE HEAVY ACCREDITATION DOORS ARE COUNTED, THE PUBLIC FACULTY DOOR TOO, AND
 * THE SCENARIO CAP HOLDS UNDER A RACE (A3-S-7, A3-S-8; audit of 5 Oct 2026).
 *
 * Each council return, insights, simulate and scenarios door recomputes a
 * college's facts (1.3 to 2.6 s a call on the dev server) and none called
 * budget(), where the filing generate and the cycle compute do (S-18); the
 * signed-out /api/v1/public/faculty/{slug} answered 130 calls in a row with
 * no 429; and the hundred-scenario cap was a count taken before the insert.
 * Proved: a caller at the end of the heavy budget is answered 429 by every one
 * of the thirteen handlers; an address at the end of the look-up budget is 429
 * at the public door; two saves racing for the hundredth place write one row.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { HEAVY_READ_BUDGET } from "@/lib/api-v1";
import { CODE_LOOKUPS } from "@/lib/rate-limit";
import { saveScenario } from "@/lib/iqac-insights";
import { GET as councilGet } from "@/app/api/v1/iqac/council/route";
import { GET as pciGet } from "@/app/api/v1/iqac/council/pci/route";
import { GET as bciGet } from "@/app/api/v1/iqac/council/bci/route";
import { GET as ncteGet } from "@/app/api/v1/iqac/council/ncte/route";
import { GET as nbaCouncilGet } from "@/app/api/v1/iqac/council/nba/route";
import { GET as insightsGet } from "@/app/api/v1/iqac/insights/route";
import { GET as insightsNbaGet } from "@/app/api/v1/iqac/insights/nba/route";
import { GET as insightsNirfGet } from "@/app/api/v1/iqac/insights/nirf/route";
import { GET as simulateGet } from "@/app/api/v1/iqac/simulate/route";
import { GET as simulateNbaGet } from "@/app/api/v1/iqac/simulate/nba/route";
import { GET as scenariosGet, POST as scenariosPost } from "@/app/api/v1/iqac/scenarios/route";
import { DELETE as scenarioDelete } from "@/app/api/v1/iqac/scenarios/[scenarioId]/route";
import { GET as compareGet } from "@/app/api/v1/iqac/scenarios/compare/route";
import { GET as publicFacultyGet } from "@/app/api/v1/public/faculty/[slug]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ADDRESS = `203.0.113.${STAMP % 250}`;
const ids = { college: "", iqac: "", cycle: "" };

const get = (path: string) => new Request(`http://localhost${path}`);

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ Budgets College ${STAMP}`, slug: `zz-budgets-${STAMP}`, code: `ZBG${SUFFIX}`, contactEmail: `zz-budgets-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: ["ACADEMICS", "IQAC"].map((module) => ({ schoolId: ids.college, module })) });
  ids.iqac = (await db.user.create({ data: { name: "ZZ Budgets IQAC", email: `zz-budgets-iqac-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.iqac, schoolId: ids.college, role: "IQAC", status: "ACTIVE" } });
  ids.cycle = (await db.accreditationCycle.create({ data: { schoolId: ids.college, framework: "AFFILIATED_UG", institutionType: "COLLEGE", windowFrom: "2022-06-01", windowTo: "2027-05-31", status: "OPEN", createdByUserId: ids.iqac }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`heavy:${ids.iqac}`, `public-faculty:${ADDRESS}`] } } });
  await db.session.deleteMany({ where: { userId: ids.iqac } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
  await db.school.deleteMany({ where: { id: ids.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

/** The bucket at its limit, its window open for ten minutes: the next call is one too many. */
const exhaust = (bucket: string, limit: number) =>
  db.rateLimit.upsert({ where: { bucket }, create: { bucket, hits: limit, windowEndsAt: new Date(Date.now() + 600_000) }, update: { hits: limit, windowEndsAt: new Date(Date.now() + 600_000) } });

describe("the heavy accreditation doors", () => {
  it("answer 429 to a caller at the end of the heavy-read budget, every one of the thirteen", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(ids.iqac, { schoolId: ids.college, role: "IQAC" });
    expect((await getSession())?.role).toBe("IQAC");
    await exhaust(`heavy:${ids.iqac}`, HEAVY_READ_BUDGET.limit);
    const calls: [string, () => Promise<Response>][] = [
      ["council", () => councilGet()],
      ["council/pci", () => pciGet(get("/api/v1/iqac/council/pci"))],
      ["council/bci", () => bciGet(get("/api/v1/iqac/council/bci"))],
      ["council/ncte", () => ncteGet(get("/api/v1/iqac/council/ncte"))],
      ["council/nba", () => nbaCouncilGet(get("/api/v1/iqac/council/nba"))],
      ["insights", () => insightsGet(get("/api/v1/iqac/insights"))],
      ["insights/nba", () => insightsNbaGet(get("/api/v1/iqac/insights/nba"))],
      ["insights/nirf", () => insightsNirfGet()],
      ["simulate", () => simulateGet(get("/api/v1/iqac/simulate"))],
      ["simulate/nba", () => simulateNbaGet(get("/api/v1/iqac/simulate/nba"))],
      ["scenarios GET", () => scenariosGet(get("/api/v1/iqac/scenarios"))],
      ["scenarios POST", () => scenariosPost(new Request("http://localhost/api/v1/iqac/scenarios", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }))],
      ["scenarios DELETE", () => scenarioDelete(new Request("http://localhost/x", { method: "DELETE" }), { params: Promise.resolve({ scenarioId: "zz-none" }) })],
      ["scenarios/compare", () => compareGet(get("/api/v1/iqac/scenarios/compare"))],
    ];
    const statuses = [];
    for (const [name, call] of calls) statuses.push(`${name} ${(await call()).status}`);
    expect(statuses).toEqual(calls.map(([name]) => `${name} 429`));
    await db.rateLimit.deleteMany({ where: { bucket: `heavy:${ids.iqac}` } });
  });
});

describe("the public faculty door", () => {
  it("answers 429 to an address at the end of the look-up budget, and 200 before it", async () => {
    __resetCookies();
    __setHeaders({ "x-forwarded-for": ADDRESS });
    const call = () => publicFacultyGet(get("/api/v1/public/faculty/zz-none"), { params: Promise.resolve({ slug: "zz-none" }) });
    expect((await call()).status).toBe(200);
    await exhaust(`public-faculty:${ADDRESS}`, CODE_LOOKUPS.limit);
    expect((await call()).status).toBe(429);
  });
});

describe("the hundred-scenario cap", () => {
  it("lets one of two saves racing for the last place through, and refuses the other 409", async () => {
    await db.iqacScenario.createMany({ data: Array.from({ length: 99 }, (_, i) => ({ schoolId: ids.college, kind: "NAAC", cycleId: ids.cycle, name: `ZZ filler ${i}`, inputsJson: "{}", cgpa: 0 })) });
    __resetCookies();
    __setHeaders({});
    await createSession(ids.iqac, { schoolId: ids.college, role: "IQAC" });
    const ctx = (await getSession())!;
    const input = (name: string) => ({ kind: "NAAC" as const, cycleId: ids.cycle, name, inputs: { facts: {}, ql: {}, nirf: null } });
    const results = await Promise.allSettled([saveScenario(ctx, input("ZZ racer A")), saveScenario(ctx, input("ZZ racer B"))]);
    expect(results.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    const refused = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(refused.reason).toMatchObject({ key: "insights.refuseTooMany", status: 409 });
    expect(await db.iqacScenario.count({ where: { schoolId: ids.college } })).toBe(100);
  });
});
