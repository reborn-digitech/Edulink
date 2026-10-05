/**
 * Actionable insights and the simulator (module IQAC, 5 October 2026),
 * through their /api/v1 doors with primed sessions at the ZZ colleges the
 * fixtures build: ZZ Vidya (arts, science, commerce; the NAAC cycle) and ZZ
 * Shastri (engineering; the mechanical department's NBA SAR). Read-only at
 * the fixtures but for this suite's own rows: a temporary IQAC coordinator
 * at Shastri, the scenarios it and Vidya's coordinator save (removed by
 * their doors, then by id), and a ZZ college of its own with IQAC off.
 *
 * What is proved: the engine imports nothing that needs a server, so the
 * simulator page ships the predictor's own functions; the simulator at
 * today's figures gives exactly the predictor's CGPA and every metric's
 * score; an insight's next step is the hand computation (2.4.2's teachers
 * with a PhD or NET/SET) and the cheapest path's points reach the next band
 * once applied; every call to action is a page of the web app that one of
 * its roles reaches from their menu; a scenario is saved (its stored CGPA
 * the recompute of its own inputs), listed with its lead over today,
 * compared, shown as insights and removed, each audited; the NBA SAR's
 * insights and simulator give the SAR's own totals and each step raises the
 * item's marks; the NIRF estimate is nirfScore of the rows' figures and each
 * step raises the sub-parameter's marks; MODULE_OFF at a college with IQAC
 * off; a student is refused every door, and the office may read but not save.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { INSIGHT_CTAS, NAAC_BANDS, NAAC_FRAMEWORKS, type NaacInsights, type NbaInsights, type NbaSimulation, type NirfInsights, type NaacSimulation, type Scenarios, type ScenarioCompare, type CouncilView } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { NAV } from "@/lib/nav";
import { actionKey } from "@/lib/safety-labels";
import { IQAC_FIXTURE as F } from "@/lib/api-catalog/iqac-fixture";
import { naacBaseline, nbaBaseline } from "@/lib/iqac-insights";
import { nirfScore, pathToBand, simulateNaac, nbaTotals } from "@/lib/accreditation-insights";
import { evaluate } from "@/lib/iqac-rules";
import { defaultFilingYear } from "@/lib/council-filings";
import { GET as predictorGet } from "@/app/api/v1/iqac/cycles/[cycleId]/route";
import { GET as insightsGet } from "@/app/api/v1/iqac/insights/route";
import { GET as nbaInsightsGet } from "@/app/api/v1/iqac/insights/nba/route";
import { GET as nirfInsightsGet } from "@/app/api/v1/iqac/insights/nirf/route";
import { GET as scenariosGet, POST as scenariosPost } from "@/app/api/v1/iqac/scenarios/route";
import { DELETE as scenarioDelete } from "@/app/api/v1/iqac/scenarios/[scenarioId]/route";
import { GET as compareGet } from "@/app/api/v1/iqac/scenarios/compare/route";
import { GET as simulateGet } from "@/app/api/v1/iqac/simulate/route";
import { GET as simulateNbaGet } from "@/app/api/v1/iqac/simulate/nba/route";
import { GET as councilNbaGet } from "@/app/api/v1/iqac/council/nba/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const STARTED = new Date();
const ids = { vidya: "", shastri: "", bare: "", iqac: "", admin: "", principal: "", student: "", shastriAdmin: "", shastriIqac: "", bareAdmin: "", dept: "" };
const saved: string[] = [];

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const del = (path: string) => new Request(`http://localhost${path}`, { method: "DELETE" });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
async function as(userId: string, schoolId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
}
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

beforeAll(async () => {
  const school = async (slug: string) => (await db.school.findUniqueOrThrow({ where: { slug }, select: { id: true } })).id;
  ids.vidya = await school("zz-vidya-college");
  ids.shastri = await school("zz-shastri-college");
  const person = async (email: string, schoolId: string, role: string) => (await db.membership.findFirstOrThrow({ where: { schoolId, role, status: "ACTIVE", user: { email } }, select: { userId: true } })).userId;
  ids.iqac = await person("zz.iqac@zz.test", ids.vidya, "IQAC");
  ids.admin = await person("zz.cadmin@zz.test", ids.vidya, "ADMIN");
  ids.principal = await person("zz.cprincipal@zz.test", ids.vidya, "PRINCIPAL");
  ids.student = await person("zz.cstudent01@zz.test", ids.vidya, "STUDENT");
  ids.shastriAdmin = await person("zz.cadmin.s@zz.test", ids.shastri, "ADMIN");
  // This suite's own people and college: an IQAC coordinator at Shastri (it has none), and a college with IQAC off.
  const coordinator = await db.user.create({ data: { name: "ZZ Insights Coordinator", email: `zz-insights-iqac-${STAMP}@test.invalid` }, select: { id: true } });
  ids.shastriIqac = coordinator.id;
  await db.membership.create({ data: { userId: coordinator.id, schoolId: ids.shastri, role: "IQAC", status: "ACTIVE" } });
  ids.bare = (await db.school.create({ data: { name: `ZZ Insights Bare ${STAMP}`, slug: `zz-insights-bare-${STAMP}`, code: `ZIB${SUFFIX}`, contactEmail: `zz-insights-bare-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  const bareAdmin = await db.user.create({ data: { name: "ZZ Insights Bare Admin", email: `zz-insights-bare-admin-${STAMP}@test.invalid` }, select: { id: true } });
  ids.bareAdmin = bareAdmin.id;
  await db.membership.create({ data: { userId: bareAdmin.id, schoolId: ids.bare, role: "ADMIN", status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.iqacScenario.deleteMany({ where: { id: { in: saved } } });
  await db.iqacScenario.deleteMany({ where: { schoolId: ids.shastri, createdByUserId: ids.shastriIqac } });
  await db.session.deleteMany({ where: { userId: { in: [ids.iqac, ids.admin, ids.principal, ids.student, ids.shastriAdmin] }, createdAt: { gte: STARTED } } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.membership.deleteMany({ where: { schoolId: ids.shastri, userId: ids.shastriIqac } });
  await db.school.deleteMany({ where: { id: ids.bare } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the engine ships to the browser", () => {
  it("imports nothing a browser cannot run: the contracts and the two pure rule files", () => {
    const root = join(__dirname, "..", "src", "lib");
    const imports = (file: string) => [...readFileSync(join(root, file), "utf8").matchAll(/^import[^;]*?from\s+"([^"]+)"/gms)].map((m) => m[1]);
    expect(imports("accreditation-insights.ts").sort()).toEqual(["./council-rules", "./iqac-rules", "@edulink/contracts"]);
    expect(imports("iqac-rules.ts")).toEqual(["@edulink/contracts"]);
    expect(imports("council-rules.ts")).toEqual([]);
    for (const f of ["accreditation-insights.ts", "iqac-rules.ts", "council-rules.ts"]) expect(readFileSync(join(root, f), "utf8")).not.toMatch(/server-only|from "\.\/db"|node:/);
  });

  it("names, for every call to action, a page of the web app that one of its roles reaches from their menu", () => {
    for (const [code, cta] of Object.entries(INSIGHT_CTAS)) {
      const path = cta.href.split("#")[0]!.split("?")[0]!;
      expect(existsSync(join(__dirname, "..", "src", "app", "(app)", ...path.split("/").filter(Boolean), "page.tsx")), `${code} ${path}`).toBe(true);
      const reached = cta.roles.some((role) => (NAV[role] ?? []).some((item) => path === item.href || (item.prefix && path.startsWith(`${item.href}/`)) || (item.also ?? []).some((a) => path === a || path.startsWith(`${a}/`))));
      expect(reached, `${code} ${path} from ${cta.roles.join(",")}`).toBe(true);
    }
  });

  it("labels the two new audit actions", () => {
    expect(actionKey("iqac.scenario.save")).toBe("audit.iqacScenarioSave");
    expect(actionKey("iqac.scenario.remove")).toBe("audit.iqacScenarioRemove");
  });
});

describe("NAAC at ZZ Vidya", () => {
  it("gives the predictor's CGPA and every metric's score at today's figures, in the browser's functions and at the simulate door", async () => {
    await as(ids.iqac, ids.vidya, "IQAC");
    const p = await body<{ cycle: { cgpa: number; framework: keyof typeof NAAC_FRAMEWORKS }; criteria: { kis: { metrics: { code: string; score: number | null }[] }[] }[] }>(await predictorGet(get(`/api/v1/iqac/cycles/${F.cycle}`), params({ cycleId: F.cycle })));
    const fw = NAAC_FRAMEWORKS[p.cycle.framework];
    const base = await naacBaseline(F.cycle);
    const sim = simulateNaac(fw, base);
    expect(sim.cgpa).toBe(p.cycle.cgpa);
    for (const m of p.criteria.flatMap((c) => c.kis.flatMap((k) => k.metrics))) expect(sim.scores.get(m.code), m.code).toBe(m.score ?? 0);
    const res = await simulateGet(get(`/api/v1/iqac/simulate?cycleId=${F.cycle}`));
    expect(res.status).toBe(200);
    const door = await body<NaacSimulation>(res);
    expect(door.cgpa).toBe(p.cycle.cgpa);
    expect(door.nirf).not.toBeNull();
    expect(door.notAScore.length).toBeGreaterThan(20);
  });

  it("reads the next band's distance and a metric's next step as a hand computation does, and the cheapest path reaches the band", async () => {
    await as(ids.iqac, ids.vidya, "IQAC");
    const res = await insightsGet(get(`/api/v1/iqac/insights?cycleId=${F.cycle}`));
    expect(res.status).toBe(200);
    const ins = await body<NaacInsights>(res);
    const fw = NAAC_FRAMEWORKS[ins.cycle.framework];
    const base = await naacBaseline(F.cycle);
    // The next band: the lowest band whose floor is above the CGPA, and the distance rounded as NAAC prints a CGPA.
    const above = [...NAAC_BANDS].reverse().find((b) => b.min > ins.cgpa)!;
    expect(ins.paths[0]!.grade).toBe(above.grade);
    expect(ins.paths[0]!.distance).toBe(Math.round((above.min - ins.cgpa) * 100) / 100);
    expect(ins.notAScore).toMatch(/NAAC, NBA or NIRF/);
    // The cheapest path: its points cover the distance, and its steps applied give a CGPA in the band.
    const path = pathToBand(fw, base, above.min);
    expect(path.reachable).toBe(ins.paths[0]!.reachable);
    if (path.reachable) {
      expect(ins.paths[0]!.points).toBeGreaterThanOrEqual(ins.paths[0]!.distance);
      expect(path.cgpaAfter).toBeGreaterThanOrEqual(above.min);
    }
    expect(ins.paths[0]!.steps.length).toBe(path.steps.length);
    // 3.2.1, papers per full-time teacher against the benchmark of 1 (score = 4 × papers ÷ teachers, the ratio to two
    // places): the next whole score needs k more papers with (p + k) ÷ t ≥ (⌊score⌋ + 1) ÷ 4, k = ⌈(⌊score⌋ + 1) × t ÷ 4 − p⌉.
    // At the fixture, 2 papers over 3 teachers: 0.67 a teacher, 2.68; one more paper makes 1.00 a teacher, 4.
    const papers = ins.ranked.find((r) => r.code === "3.2.1")!;
    const t = base.facts.fullTimeTeachers!;
    const p0 = base.facts.papers!;
    const s321 = evaluate("PAPERS_PER_TEACHER", base.facts).score;
    expect(papers.score).toBe(s321);
    expect(papers.nextStep!.units).toBe(Math.ceil(((Math.floor(s321) + 1) * t) / 4 - p0 - 1e-9));
    expect(papers.nextStep!.toScore).toBe(evaluate("PAPERS_PER_TEACHER", { ...base.facts, papers: p0 + papers.nextStep!.units }).score);
    // What the step adds is the framework's CGPA change: (new score − old) × weight ÷ 1,000 (3.2.1 weighs 8 here).
    expect(papers.nextStep!.points).toBeCloseTo(((papers.nextStep!.toScore - s321) * 8) / 1000, 4);
    expect(papers.sentence).toContain("3.2.1");
    expect(papers.cta.code).toBe("RESEARCH");
    // 1.3.2, students on projects over students on the roll against 100 %: k = ⌈(⌊score⌋ + 1) ÷ 4 × students − on projects⌉.
    const projects = ins.ranked.find((r) => r.code === "1.3.2")!;
    const s132 = evaluate("PROJECT_WORK_PCT", base.facts).score;
    expect(projects.nextStep!.units).toBe(Math.ceil(((Math.floor(s132) + 1) / 4) * base.facts.studentsLatest! - base.facts.projectStudents! - 1e-9));
    expect(projects.cta.code).toBe("INTERNSHIPS");
    // Ranked by what one unit buys, most first.
    const eff = ins.ranked.filter((r) => r.nextStep && r.nextStep.points > 0).map((r) => r.nextStep!.points / r.nextStep!.units);
    for (let i = 1; i < eff.length; i += 1) expect(eff[i]!).toBeLessThanOrEqual(eff[i - 1]! + 1e-9);
    // "What you did last": the audit rows of the CTAs' pages, each marked as after the last compute or counted in it.
    expect(ins.computedAt).not.toBeNull();
    for (const d of ins.lastDone) expect(d.sinceCompute, d.action).toBe(Date.parse(d.at) > Date.parse(ins.computedAt!));
    expect(ins.lastDone.every((d) => d.cta !== null && d.label.length > 0)).toBe(true);
    // The qualitative metrics below 4 are listed to score with evidence, unscored first, each with its CTA to the predictor.
    expect(ins.qualitative.length).toBeGreaterThan(0);
    expect(ins.qualitative[0]!.scored).toBe(false);
    expect(ins.qualitative.every((q) => q.cta.code === "QUALITATIVE" && q.cta.href.startsWith("/iqac/predictor#metric-"))).toBe(true);
  });

  it("saves a scenario, lists it with its lead over today, compares two, shows one as insights, and removes them — audited", async () => {
    await as(ids.iqac, ids.vidya, "IQAC");
    const base = await naacBaseline(F.cycle);
    const fw = NAAC_FRAMEWORKS[(await db.accreditationCycle.findUniqueOrThrow({ where: { id: F.cycle }, select: { framework: true } })).framework as keyof typeof NAAC_FRAMEWORKS];
    // A teacher with a PhD more is a teacher more: every one of Vidya's three has one, and a fourth PhD among three teachers is refused (A3-journeys-13).
    const more = { facts: { ...base.facts, papers: (base.facts.papers ?? 0) + 6, phdNetTeachers: (base.facts.phdNetTeachers ?? 0) + 1, fullTimeTeachers: (base.facts.fullTimeTeachers ?? 0) + 1 }, ql: { ...base.ql, "7.3.1": 3 }, nirf: null };
    const res = await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NAAC", cycleId: F.cycle, name: `ZZ Insights more papers ${STAMP}`, inputs: more }));
    expect(res.status).toBe(200);
    const list = await body<Scenarios>(res);
    const mine = list.items.find((s) => s.name === `ZZ Insights more papers ${STAMP}`)!;
    saved.push(mine.id);
    const expected = simulateNaac(fw, more).cgpa;
    expect(mine.result).toBe(expected);
    expect(mine.savedResult).toBe(expected);
    expect((await db.iqacScenario.findUniqueOrThrow({ where: { id: mine.id }, select: { cgpa: true } })).cgpa).toBe(expected);
    expect(mine.today).toBe(simulateNaac(fw, base).cgpa);
    expect(mine.delta).toBe(Math.round((expected - mine.today) * 100) / 100);
    expect(mine.delta).toBeGreaterThan(0);
    expect(mine.canRemove).toBe(true);
    expect(await db.auditLog.count({ where: { schoolId: ids.vidya, action: "iqac.scenario.save", targetId: mine.id } })).toBe(1);

    // The principal saves another: today's figures as they are.
    await as(ids.principal, ids.vidya, "PRINCIPAL");
    const res2 = await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NAAC", cycleId: F.cycle, name: `ZZ Insights today ${STAMP}`, inputs: { facts: base.facts, ql: base.ql, nirf: null } }));
    expect(res2.status).toBe(200);
    const today = (await body<Scenarios>(res2)).items.find((s) => s.name === `ZZ Insights today ${STAMP}`)!;
    saved.push(today.id);
    expect(today.delta).toBe(0);

    // Compared, b − a: the figures that differ are exactly the two facts and the one score changed.
    await as(ids.admin, ids.vidya, "ADMIN");
    const cmp = await body<ScenarioCompare>(await compareGet(get(`/api/v1/iqac/scenarios/compare?a=${today.id}&b=${mine.id}`)));
    expect(cmp.inputs.map((i) => i.key).sort()).toEqual(["fullTimeTeachers", "papers", "phdNetTeachers", "ql:7.3.1"]);
    expect(cmp.inputs.find((i) => i.key === "papers")!.delta).toBe(6);
    expect(cmp.result.delta).toBe(Math.round((expected - today.result) * 100) / 100);
    expect(cmp.scores.find((s) => s.code === "7.3.1")!.delta).toBe(3);

    // Shown as insights: the gap is the scenario's, not today's.
    const asInsights = await body<NaacInsights>(await insightsGet(get(`/api/v1/iqac/insights?scenarioId=${mine.id}`)));
    expect(asInsights.scenarioId).toBe(mine.id);
    expect(asInsights.cgpa).toBe(expected);
    expect(asInsights.qualitative.some((q) => q.code === "7.3.1" && q.scored && q.score === 3)).toBe(true);
    const viaDoor = await body<NaacSimulation>(await simulateGet(get(`/api/v1/iqac/simulate?scenarioId=${mine.id}`)));
    expect(viaDoor.cgpa).toBe(expected);

    // The office reads but does not save or remove; a figure the framework does not read is refused.
    expect((await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NAAC", cycleId: F.cycle, name: "ZZ office", inputs: more }))).status).toBe(403);
    expect((await scenarioDelete(del(`/api/v1/iqac/scenarios/${mine.id}`), params({ scenarioId: mine.id }))).status).toBe(403);
    await as(ids.iqac, ids.vidya, "IQAC");
    expect((await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NAAC", cycleId: F.cycle, name: "ZZ stray", inputs: { facts: { notAFact: 1 }, ql: {}, nirf: null } }))).status).toBe(422);

    for (const id of [mine.id, today.id]) {
      const gone = await scenarioDelete(del(`/api/v1/iqac/scenarios/${id}`), params({ scenarioId: id }));
      expect(gone.status).toBe(200);
      expect((await body<Scenarios>(gone)).items.some((s) => s.id === id)).toBe(false);
      expect(await db.auditLog.count({ where: { schoolId: ids.vidya, action: "iqac.scenario.remove", targetId: id } })).toBe(1);
    }
    expect((await scenarioDelete(del(`/api/v1/iqac/scenarios/${mine.id}`), params({ scenarioId: mine.id }))).status).toBe(404);
  });

  it("keeps the fixture's saved scenario equal to the recompute of its own figures", async () => {
    const row = await db.iqacScenario.findUnique({ where: { id: F.scenario }, select: { inputsJson: true, cgpa: true, cycleId: true } });
    if (!row) return; // Built by zz:fixtures (zz-iqac.ts); absent before the first rebuild.
    const cycle = await db.accreditationCycle.findUniqueOrThrow({ where: { id: row.cycleId! }, select: { framework: true } });
    expect(simulateNaac(NAAC_FRAMEWORKS[cycle.framework as keyof typeof NAAC_FRAMEWORKS], JSON.parse(row.inputsJson)).cgpa).toBe(row.cgpa);
  });
});

describe("the NBA SAR and NIRF at ZZ Shastri", () => {
  const year = defaultFilingYear() + 1;

  it("gives the SAR's own totals, and each step raises its item's marks", async () => {
    await as(ids.shastriAdmin, ids.shastri, "ADMIN");
    const sar = await body<CouncilView>(await councilNbaGet(get(`/api/v1/iqac/council/nba?year=${year}`)));
    expect(sar.departmentId).toBeTruthy();
    ids.dept = sar.departmentId!;
    const res = await nbaInsightsGet(get(`/api/v1/iqac/insights/nba?year=${year}&departmentId=${ids.dept}`));
    expect(res.status).toBe(200);
    const ins = await body<NbaInsights>(res);
    expect(ins.computed).toBe(sar.total!.computed);
    expect(ins.self).toBe(sar.total!.self);
    expect(ins.max).toBe(1000);
    for (const item of sar.items.filter((i) => i.computed)) {
      const listed = ins.ranked.find((r) => r.code === item.code);
      if (listed) expect(listed.marks, item.code).toBe(item.score);
      else expect(item.score, item.code).toBe(item.marks);
    }
    for (const r of ins.ranked.filter((x) => x.nextStep)) {
      expect(r.nextStep!.toScore - r.marks, r.code).toBeGreaterThanOrEqual(Math.min(1, r.max - r.marks) - 1e-6);
      expect(r.sentence).toContain(r.code);
    }
    // 4.1 by hand: the first marks come at half the intake admitted (12 of 20), so k = ⌈intake ÷ 2⌉ − admitted below it.
    const base41 = await nbaBaseline(ids.shastri, ids.dept, year);
    const enrol = ins.ranked.find((r) => r.code === "4.1");
    if (base41.intake > 0 && base41.admitted / base41.intake < 0.5) {
      expect(enrol!.nextStep!.units).toBe(Math.ceil(base41.intake / 2) - base41.admitted);
      expect(enrol!.nextStep!.toScore).toBe(12);
      expect(enrol!.cta.code).toBe("ADMISSIONS");
    }
    // The criteria the department wrote (1, 6, 9 in the fixture) are listed with what is left; the unwritten first.
    expect(ins.selfAssess.length).toBeGreaterThan(0);
    expect(ins.selfAssess[0]!.leverValue).toBeNull();
    expect(ins.selfAssess.every((s) => s.cta.code === "NBA_WORKSHEET")).toBe(true);
    // The simulator at today's figures: the same total, from the browser's functions and the door.
    const base = await nbaBaseline(ids.shastri, ids.dept, year);
    expect(nbaTotals(base).total).toBe(Math.round((sar.total!.computed + sar.total!.self) * 100) / 100);
    const sim = await body<NbaSimulation>(await simulateNbaGet(get(`/api/v1/iqac/simulate/nba?year=${year}&departmentId=${ids.dept}`)));
    expect(sim.total).toBe(nbaTotals(base).total);
    for (const [code, marks] of Object.entries(sim.marks)) expect(marks, code).toBe(sar.items.find((i) => i.code === code)!.score);
  });

  it("saves and compares NBA scenarios, and reads one as insights", async () => {
    await as(ids.shastriIqac, ids.shastri, "IQAC");
    const base = await nbaBaseline(ids.shastri, ids.dept, year);
    const better = { ...base, F: base.F + 2, phd: base.phd + 1, self: { ...base.self, "7": 30 } };
    const res = await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NBA", year, departmentId: ids.dept, name: `ZZ Insights two hires ${STAMP}`, inputs: better }));
    expect(res.status).toBe(200);
    const s = (await body<Scenarios>(res)).items.find((x) => x.name === `ZZ Insights two hires ${STAMP}`)!;
    saved.push(s.id);
    expect(s.result).toBe(nbaTotals(better).total);
    expect(s.today).toBe(nbaTotals(base).total);
    expect(s.delta).toBeGreaterThanOrEqual(30);
    const viaInsights = await body<NbaInsights>(await nbaInsightsGet(get(`/api/v1/iqac/insights/nba?scenarioId=${s.id}`)));
    expect(viaInsights.total).toBe(s.result);
    expect(viaInsights.selfAssess.find((x) => x.code === "7")?.marks ?? 50).toBe(30);
    // A self-assessed mark above the item's is refused, and an NAAC scenario does not compare with an NBA one.
    expect((await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NBA", year, departmentId: ids.dept, name: "ZZ too many", inputs: { ...base, self: { "7": 51 } } }))).status).toBe(422);
  });

  it("reads NIRF as nirfScore of the rows' figures, and each step raises its sub-parameter's marks", async () => {
    await as(ids.shastriAdmin, ids.shastri, "ADMIN");
    const res = await nirfInsightsGet();
    expect(res.status).toBe(200);
    const ins = await body<NirfInsights>(res);
    const s = nirfScore(ins.inputs);
    expect(ins.partial).toBe(s.partial);
    expect(ins.coveredMarks).toBe(s.coveredMarks);
    expect(ins.projected).toBe(s.projected);
    expect(ins.band?.code ?? null).toBe(s.band?.code ?? null);
    for (const r of ins.ranked.filter((x) => x.nextStep)) {
      expect(r.nextStep!.toScore).toBeGreaterThan(r.marks!);
      const weight = { TLR: 0.4, RP: 0.15, GO: 0.25, OI: 0.1, PR: 0.1 }[r.parameter as "TLR"]!;
      expect(r.nextStep!.points).toBeCloseTo((r.nextStep!.toScore - r.marks!) * weight, 3);
    }
    // The sub-parameters NIRF does not publish are listed last, with no step: keep their data ready.
    const unpublished = ins.ranked.filter((r) => !r.published);
    expect(unpublished.map((r) => r.code).sort()).toEqual(["ESCS", "FRU", "GMS", "PR", "PU", "QP", "SS"]);
    expect(unpublished.every((r) => r.nextStep === null && r.cta.code === "DOCUMENTS")).toBe(true);
  });

  it("answers 404 for the NBA doors at a college that does not teach engineering", async () => {
    await as(ids.iqac, ids.vidya, "IQAC");
    expect((await nbaInsightsGet(get("/api/v1/iqac/insights/nba"))).status).toBe(404);
    expect((await simulateNbaGet(get("/api/v1/iqac/simulate/nba"))).status).toBe(404);
  });
});

describe("the module switch and the roles", () => {
  it("answers MODULE_OFF at a college with IQAC off, at the gate and in the handler", async () => {
    await expect(gateRequest("GET /api/v1/iqac/insights", { role: "ADMIN", schoolId: ids.bare })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/iqac/insights", { role: "IQAC", schoolId: ids.vidya })).resolves.toBe("pass");
    await as(ids.bareAdmin, ids.bare, "ADMIN");
    const res = await insightsGet(get("/api/v1/iqac/insights"));
    expect(res.status).toBe(403);
    expect((await body(res)).code).toBe("MODULE_OFF");
  });

  it("refuses a student every door, before any body is read", async () => {
    await as(ids.student, ids.vidya, "STUDENT");
    expect((await insightsGet(get("/api/v1/iqac/insights"))).status).toBe(403);
    expect((await nbaInsightsGet(get("/api/v1/iqac/insights/nba"))).status).toBe(403);
    expect((await nirfInsightsGet()).status).toBe(403);
    expect((await scenariosGet(get("/api/v1/iqac/scenarios"))).status).toBe(403);
    expect((await scenariosPost(json("/api/v1/iqac/scenarios", {}))).status).toBe(403);
    expect((await scenarioDelete(del(`/api/v1/iqac/scenarios/${F.scenario}`), params({ scenarioId: F.scenario }))).status).toBe(403);
    expect((await compareGet(get(`/api/v1/iqac/scenarios/compare?a=${F.scenario}&b=${F.scenario}`))).status).toBe(403);
    expect((await simulateGet(get("/api/v1/iqac/simulate"))).status).toBe(403);
    expect((await simulateNbaGet(get("/api/v1/iqac/simulate/nba"))).status).toBe(403);
  });
});

describe("a part is never more than its whole in a saved scenario (audit of 5 October 2026, A3-journeys-13)", () => {
  it("refuses 50 passed of 3 appeared, naming the figures and the metric, and saves nothing; today's figures break no whole", async () => {
    await as(ids.iqac, ids.vidya, "IQAC");
    const { NAAC_WHOLES, NBA_PART_WHOLES, partsOver } = await import("@/lib/accreditation-insights");
    const base = await naacBaseline(F.cycle);
    // The fixture's own scenario is written from today's figures (zz-iqac.ts), so they must keep every whole.
    expect(partsOver(NAAC_WHOLES, base.facts)).toEqual([]);
    const name = `ZZ Insights impossible pass rate ${STAMP}`;
    const res = await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NAAC", cycleId: F.cycle, name, inputs: { facts: { ...base.facts, passed: 50, appeared: 3 }, ql: base.ql, nirf: null } }));
    expect(res.status).toBe(422);
    const fw = NAAC_FRAMEWORKS[(await db.accreditationCycle.findUniqueOrThrow({ where: { id: F.cycle }, select: { framework: true } })).framework as keyof typeof NAAC_FRAMEWORKS];
    const code = fw.metrics.find((m) => m.formula === "PASS_PCT")!.code;
    expect((await body(res)).error).toBe(`In ${code}, “Students who passed” cannot be more than “Students who appeared”.`);
    expect(await db.iqacScenario.count({ where: { schoolId: ids.vidya, name } })).toBe(0);
    // At the whole it is saved.
    const atWhole = await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NAAC", cycleId: F.cycle, name, inputs: { facts: { ...base.facts, passed: 3, appeared: 3 }, ql: base.ql, nirf: null } }));
    expect(atWhole.status).toBe(200);
    saved.push((await db.iqacScenario.findFirstOrThrow({ where: { schoolId: ids.vidya, name }, select: { id: true } })).id);
    // NBA: more professors, associates and assistants than the department's teachers.
    await as(ids.shastriIqac, ids.shastri, "IQAC");
    const year = defaultFilingYear() + 1;
    const dept = (await body<CouncilView>(await councilNbaGet(get(`/api/v1/iqac/council/nba?year=${year}`)))).departmentId!;
    const nba = await nbaBaseline(ids.shastri, dept, year);
    expect(partsOver(NBA_PART_WHOLES, nba)).toEqual([]);
    const over = await scenariosPost(json("/api/v1/iqac/scenarios", { kind: "NBA", year, departmentId: dept, name: `ZZ Insights phantom professors ${STAMP}`, inputs: { ...nba, professors: nba.F + 1, associates: 0, assistants: 0 } }));
    expect(over.status).toBe(422);
    expect((await body(over)).error).toBe("In 5.2, “Professors + Associate professors + Assistant professors” cannot be more than “Full-time faculty”.");
  });
});
