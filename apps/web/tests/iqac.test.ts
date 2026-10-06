/**
 * The IQAC module (module IQAC, role IQAC; 4 October 2026), through its
 * /api/v1 doors with primed sessions, at two ZZ colleges of this suite's own:
 * Quill has IQAC on, Bare keeps it off.
 *
 * What is proved: the framework's weights add to 1,000 for each institution
 * type and its bands read as NAAC's; a quantitative metric's value is the
 * hand computation over the college's rows (3.2.1 papers per teacher, 2.2.2
 * the student–teacher ratio), and the stored CGPA is the one recomputed from
 * the score rows; a qualitative score is refused without evidence; the SSS
 * keeps no name and takes one answer per person; a grievance is due fifteen
 * working days on and goes to the Ombudsperson only after; a generated
 * filing's hash is its body's, and regenerating it gives the same figures;
 * the disclosure is readable signed out only while published; MODULE_OFF at
 * the college with IQAC off; and another college's faculty member is
 * refused this college's rows.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { NAAC_FRAMEWORKS } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { actionKey } from "@/lib/safety-labels";
import { addWorkingDays, cgpaOf, evaluate, gradeOf, nextBand, scoreOf, totalWeight } from "@/lib/iqac-rules";
import { buildFiling, publishedDisclosure } from "@/lib/iqac-filings";
import { cgpaFromRows } from "@/lib/iqac";
import { GET as cyclesGet, POST as cyclesPost } from "@/app/api/v1/iqac/cycles/route";
import { GET as predictorGet } from "@/app/api/v1/iqac/cycles/[cycleId]/route";
import { POST as scorePost } from "@/app/api/v1/iqac/cycles/[cycleId]/metrics/[metricCode]/route";
import { GET as researchGet, POST as researchPost } from "@/app/api/v1/iqac/research/route";
import { POST as researchRemove } from "@/app/api/v1/iqac/research/[itemId]/remove/route";
import { POST as activitiesPost } from "@/app/api/v1/iqac/activities/route";
import { POST as surveysPost } from "@/app/api/v1/iqac/surveys/route";
import { GET as surveyGet } from "@/app/api/v1/iqac/surveys/[surveyId]/route";
import { GET as voiceGet } from "@/app/api/v1/voice/route";
import { POST as answerPost } from "@/app/api/v1/voice/surveys/[surveyId]/route";
import { POST as grievancePost } from "@/app/api/v1/voice/grievances/route";
import { POST as escalatePost } from "@/app/api/v1/voice/grievances/[grievanceId]/escalate/route";
import { POST as actPost } from "@/app/api/v1/iqac/grievances/[grievanceId]/route";
import { GET as filingsGet, POST as filingsPost } from "@/app/api/v1/iqac/filings/route";
import { POST as submitPost } from "@/app/api/v1/iqac/filings/[filingId]/submit/route";
import { POST as signoffPost } from "@/app/api/v1/iqac/filings/[filingId]/signoff/route";
import { POST as filedPost } from "@/app/api/v1/iqac/filings/[filingId]/filed/route";
import { POST as disclosurePost } from "@/app/api/v1/iqac/disclosure/route";
import { GET as overviewGet } from "@/app/api/v1/iqac/overview/route";
import { GET as evidenceGet } from "@/app/api/v1/iqac/evidence/route";
import { GET as financeTableGet } from "@/app/api/v1/accounts/finance-table/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { quill: "", bare: "", iqac: "", admin: "", principal: "", f1: "", f2: "", f1m: "", f2m: "", s1: "", s2: "", s1m: "", s2m: "", other: "", otherM: "", bareAdmin: "", cycle: "" };

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
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
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ IQAC ${tag} ${STAMP}`, slug: `zz-iqac-${tag.toLowerCase()}-${STAMP}`, code: `ZIQ${tag[0]}${SUFFIX}`, contactEmail: `zz-iqac-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } });
  ids.quill = (await mk("Quill")).id;
  ids.bare = (await mk("Bare")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.quill, module: "ACADEMICS" }, { schoolId: ids.quill, module: "IQAC" }, { schoolId: ids.bare, module: "ACADEMICS" }] });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Iqac ${who}`, email: `zz-iqac-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [iqac, admin, principal, f1, f2, s1, s2, other, bareAdmin] = await Promise.all([user("Coordinator"), user("Admin"), user("Principal"), user("Faculty1"), user("Faculty2"), user("Student1"), user("Student2"), user("Other"), user("BareAdmin")]);
  Object.assign(ids, { iqac: iqac.id, admin: admin.id, principal: principal.id, f1: f1.id, f2: f2.id, s1: s1.id, s2: s2.id, other: other.id, bareAdmin: bareAdmin.id });
  const m = (userId: string, schoolId: string, role: string, joinedAt?: Date) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", ...(joinedAt ? { joinedAt } : {}) }, select: { id: true } });
  await m(iqac.id, ids.quill, "IQAC");
  await m(admin.id, ids.quill, "ADMIN");
  await m(principal.id, ids.quill, "PRINCIPAL");
  await m(bareAdmin.id, ids.bare, "ADMIN");
  ids.f1m = (await m(f1.id, ids.quill, "FACULTY")).id;
  ids.f2m = (await m(f2.id, ids.quill, "FACULTY")).id;
  ids.otherM = (await m(other.id, ids.bare, "FACULTY")).id;
  // Students on the roll since before the window opened.
  const old = new Date("2020-01-01T00:00:00Z");
  ids.s1m = (await m(s1.id, ids.quill, "STUDENT", old)).id;
  ids.s2m = (await m(s2.id, ids.quill, "STUDENT", old)).id;
  for (let i = 3; i <= 10; i += 1) await m((await user(`Student${i}`)).id, ids.quill, "STUDENT", old);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { schoolId: { in: [ids.quill, ids.bare] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.quill, ids.bare] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the framework as data", () => {
  it("weighs every institution type out of 1,000, with the criteria of the 2022 manuals", () => {
    expect(totalWeight(NAAC_FRAMEWORKS.AFFILIATED_UG)).toBe(1000);
    expect(totalWeight(NAAC_FRAMEWORKS.AUTONOMOUS)).toBe(1000);
    expect(NAAC_FRAMEWORKS.AFFILIATED_UG.criteria.map((c) => c.weight)).toEqual([100, 350, 110, 100, 140, 100, 100]);
    expect(NAAC_FRAMEWORKS.AUTONOMOUS.criteria.map((c) => c.weight)).toEqual([150, 300, 150, 100, 100, 100, 100]);
    expect(NAAC_FRAMEWORKS.BINARY_MATURITY.metrics).toEqual([]);
    for (const fw of [NAAC_FRAMEWORKS.AFFILIATED_UG, NAAC_FRAMEWORKS.AUTONOMOUS]) {
      expect(new Set(fw.metrics.map((m) => m.code)).size).toBe(fw.metrics.length);
      for (const m of fw.metrics) expect(m.kind === "QN" ? !!m.formula : m.formula === null, m.code).toBe(true);
    }
  });

  it("reads the band from the CGPA as NAAC's table does, and the distance to the next", () => {
    expect(gradeOf(3.51)).toBe("A++");
    expect(gradeOf(3.5)).toBe("A+");
    expect(gradeOf(3.01)).toBe("A");
    expect(gradeOf(2.76)).toBe("B++");
    expect(gradeOf(2.51)).toBe("B+");
    expect(gradeOf(2.01)).toBe("B");
    expect(gradeOf(1.51)).toBe("C");
    expect(gradeOf(1.5)).toBe("D");
    expect(nextBand(2.9)).toEqual({ grade: "A", min: 3.01, distance: 0.11 });
    expect(nextBand(3.8)).toBeNull();
  });

  it("scores a formula as a hand computation does", () => {
    // 3 papers over 4 teachers is 0.75 a teacher against the benchmark of 1: 3 of 4.
    expect(evaluate("PAPERS_PER_TEACHER", { papers: 3, fullTimeTeachers: 4 })).toEqual({ value: 0.75, score: 3, missing: [] });
    // 300 students to 10 teachers is 30:1 against 20:1 — 4 × 20 ÷ 30 = 2.67.
    expect(evaluate("STUDENT_TEACHER_RATIO", { studentsLatest: 300, fullTimeTeachers: 10 })).toEqual({ value: 30, score: 2.67, missing: [] });
    expect(scoreOf({ type: "bands", bands: [[50, 4], [35, 3], [20, 2], [5, 1]] }, 40)).toBe(3);
    expect(evaluate("PASS_PCT", { passed: 5, appeared: null })).toMatchObject({ value: null, score: 0, missing: ["appeared"] });
    const fw = { metrics: [{ code: "a", weight: 30 }, { code: "b", weight: 70 }] };
    expect(cgpaOf(fw as never, new Map([["a", 4], ["b", 2]]))).toBe(2.6);
  });
});

describe("the module switch and the fence", () => {
  it("answers MODULE_OFF at a college with IQAC off, at the gate and in the handler", async () => {
    await expect(gateRequest("GET /api/v1/iqac/overview", { role: "ADMIN", schoolId: ids.bare })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/iqac/overview", { role: "IQAC", schoolId: ids.quill })).resolves.toBe("pass");
    await as(ids.bareAdmin, ids.bare, "ADMIN");
    const res = await overviewGet();
    expect(res.status).toBe(403);
    expect((await body(res)).code).toBe("MODULE_OFF");
  });

  it("refuses the wrong role before reading a body", async () => {
    await as(ids.s1, ids.quill, "STUDENT");
    expect((await cyclesPost(json("/api/v1/iqac/cycles", {}))).status).toBe(403);
    await as(ids.f1, ids.quill, "FACULTY");
    expect((await grievancePost(json("/api/v1/voice/grievances", {}))).status).toBe(403);
  });
});

describe("the predictor", () => {
  it("computes 3.2.1 and 2.2.2 from the rows, and the stored CGPA is the one the score rows give", async () => {
    await as(ids.f1, ids.quill, "FACULTY");
    const year = new Date().getUTCFullYear();
    expect((await researchPost(json("/api/v1/iqac/research", { kind: "PUBLICATION", title: "ZZ A paper in a CARE journal", indexing: "UGC_CARE", year }))).status).toBe(200);
    // A faculty member's item is always their own, whoever they name.
    const reg = await body<{ items: { facultyMembershipId: string }[]; scope: string }>(await researchGet());
    expect(reg.scope).toBe("MINE");
    expect(reg.items.every((i) => i.facultyMembershipId === ids.f1m)).toBe(true);
    await as(ids.iqac, ids.quill, "IQAC");
    const now = new Date();
    const y = now.getUTCMonth() >= 5 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
    const res = await cyclesPost(json("/api/v1/iqac/cycles", { windowFrom: `${y - 4}-06-01`, windowTo: `${y + 1}-05-31` }));
    expect(res.status).toBe(200);
    ids.cycle = (await body<{ items: { id: string }[] }>(res)).items[0]!.id;
    // A second open cycle is refused.
    expect((await cyclesPost(json("/api/v1/iqac/cycles", { windowFrom: `${y - 4}-06-01`, windowTo: `${y + 1}-05-31` }))).status).toBe(409);
    const p = await body<{ cycle: { cgpa: number }; criteria: { kis: { metrics: { code: string; value: number | null; score: number | null; inputs: { key: string; value: number | null }[] }[] }[] }[] }>(await predictorGet(get(`/api/v1/iqac/cycles/${ids.cycle}`), params({ cycleId: ids.cycle })));
    const metric = (code: string) => p.criteria.flatMap((c) => c.kis.flatMap((k) => k.metrics)).find((m) => m.code === code)!;
    // One CARE paper over two full-time teachers: 0.5 a teacher, 2 of 4.
    expect(metric("3.2.1").value).toBe(0.5);
    expect(metric("3.2.1").score).toBe(2);
    // Ten students to two teachers: 5:1, under 20:1 — the full 4.
    expect(metric("2.2.2").value).toBe(5);
    expect(metric("2.2.2").score).toBe(4);
    // A fact no module holds reads 0 with its reason: no exam results.
    expect(metric("2.6.3").value).toBeNull();
    expect(metric("2.6.3").score).toBe(0);
    const cycle = await db.accreditationCycle.findUniqueOrThrow({ where: { id: ids.cycle }, select: { cgpa: true, framework: true } });
    expect(cycle.cgpa).toBe(await cgpaFromRows(ids.cycle, cycle.framework));
    expect(p.cycle.cgpa).toBe(cycle.cgpa);
  });

  it("refuses a qualitative score without evidence, and takes it with a cited record", async () => {
    await as(ids.iqac, ids.quill, "IQAC");
    const noEvidence = await scorePost(json("/x", { score: 3, note: "ZZ best practices" }), params({ cycleId: ids.cycle, metricCode: "7.2.1" }));
    expect(noEvidence.status).toBe(422);
    // A quantitative metric is not scored by hand.
    expect((await scorePost(json("/x", { score: 3 }), params({ cycleId: ids.cycle, metricCode: "3.2.1" }))).status).toBe(422);
    const act = await activitiesPost(json("/api/v1/iqac/activities", { kind: "NSS", title: "ZZ NSS camp", at: "2025-12-01", participants: 4 }));
    expect(act.status).toBe(200);
    const activityId = (await body<{ items: { id: string }[] }>(act)).items[0]!.id;
    const before = (await db.accreditationCycle.findUniqueOrThrow({ where: { id: ids.cycle }, select: { cgpa: true } })).cgpa!;
    const ok = await scorePost(json("/x", { score: 3, note: "ZZ two practices", evidence: [{ type: "Activity", id: activityId }] }), params({ cycleId: ids.cycle, metricCode: "7.2.1" }));
    expect(ok.status).toBe(200);
    const after = (await db.accreditationCycle.findUniqueOrThrow({ where: { id: ids.cycle }, select: { cgpa: true, framework: true } }));
    // 3 points on a weight of 30 out of 1,000 is 0.09 on the CGPA.
    expect(Math.abs(after.cgpa! - before - 0.09)).toBeLessThanOrEqual(0.011);
    expect(after.cgpa).toBe(await cgpaFromRows(ids.cycle, after.framework));
    expect(actionKey("iqac.metric.score")).toBe("audit.iqacMetricScore");
  });
});

describe("the student's voice", () => {
  it("keeps the SSS anonymous: no membership on the row, one answer per person", async () => {
    await as(ids.iqac, ids.quill, "IQAC");
    const today = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
    const res = await surveysPost(json("/api/v1/iqac/surveys", { kind: "SSS", title: "ZZ SSS", opensOn: today, closesOn: "2099-01-01" }));
    expect(res.status).toBe(200);
    const surveyId = (await body<{ items: { id: string; kind: string }[] }>(res)).items.find((s) => s.kind === "SSS")!.id;
    await as(ids.s1, ids.quill, "STUDENT");
    const voice = await body<{ surveys: { id: string; questions: { code: string }[] }[] }>(await voiceGet());
    const s = voice.surveys.find((x) => x.id === surveyId)!;
    expect(s.questions).toHaveLength(20);
    const answers = Object.fromEntries(s.questions.map((q) => [q.code, 3]));
    expect((await answerPost(json("/x", { answers: { Q01: 3 } }), params({ surveyId }))).status).toBe(422);
    expect((await answerPost(json("/x", { answers }), params({ surveyId }))).status).toBe(200);
    expect((await answerPost(json("/x", { answers }), params({ surveyId }))).status).toBe(409);
    const rows = await db.surveyResponse.findMany({ where: { surveyId } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.respondentMembershipId).toBeNull();
    expect(rows[0]!.respondentHash).not.toContain(ids.s1m);
    expect(await db.auditLog.count({ where: { schoolId: ids.quill, action: "iqac.survey.answer" } })).toBe(0);
    // Aggregates only, and none below five answers.
    await as(ids.iqac, ids.quill, "IQAC");
    const r = await body<{ suppressed: boolean; overall: number | null }>(await surveyGet(get("/x"), params({ surveyId })));
    expect(r.suppressed).toBe(true);
    expect(r.overall).toBeNull();
    // The predictor's SSS mean keeps the same floor, and is read only from a closed survey so it
    // cannot move answer by answer (campaign S-17).
    const { gatherFacts } = await import("@/lib/iqac-facts");
    const mean = async () => (await gatherFacts(ids.quill, "2022-07-01", "2027-06-30", {})).facts.sssMean ?? null;
    expect(await mean()).toBeNull();
    await db.survey.update({ where: { id: surveyId }, data: { closedAt: new Date() } });
    expect(await mean()).toBeNull();
    await db.surveyResponse.createMany({ data: [1, 2, 3, 4].map((n) => ({ schoolId: ids.quill, surveyId, respondentHash: `zz-floor-${n}-${STAMP}`, answersJson: JSON.stringify(answers) })) });
    expect(await mean()).toBe(3);
    await db.surveyResponse.deleteMany({ where: { surveyId, respondentHash: { startsWith: "zz-floor-" } } });
    await db.survey.update({ where: { id: surveyId }, data: { closedAt: null } });
  });

  it("dates a grievance fifteen working days on, and sends it to the Ombudsperson only after", async () => {
    expect(addWorkingDays("2026-10-03", 15)).toBe("2026-10-21"); // a Saturday start: the Sundays of the 4th, 11th and 18th are skipped
    await as(ids.s2, ids.quill, "STUDENT");
    const res = await grievancePost(json("/api/v1/voice/grievances", { kind: "RAGGING", text: "ZZ Seniors stopped me in the corridor every evening." }));
    expect(res.status).toBe(200);
    const g = (await body<{ grievances: { id: string; dueOn: string; status: string }[] }>(res)).grievances[0]!;
    const row = await db.grievance.findUniqueOrThrow({ where: { id: g.id }, select: { committeeKind: true, filedAt: true, dueOn: true } });
    expect(row.committeeKind).toBe("ANTI_RAGGING");
    expect(row.dueOn).toBe(addWorkingDays(new Date(row.filedAt.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10), 15));
    expect((await escalatePost(json("/x", { note: "ZZ Nothing has happened" }), params({ grievanceId: g.id }))).status).toBe(409);
    await db.grievance.update({ where: { id: g.id }, data: { dueOn: "2020-01-01" } });
    const esc = await escalatePost(json("/x", { note: "ZZ Past the limit" }), params({ grievanceId: g.id }));
    expect(esc.status).toBe(200);
    expect((await db.grievance.findUniqueOrThrow({ where: { id: g.id }, select: { status: true } })).status).toBe("ESCALATED");
    // A grievance's attachment is not in the IQAC's evidence list, where its title is the kind and its uploader the student (campaign S-9).
    const fileId = `zz-grv-${STAMP}`;
    await db.uploadTicket.create({ data: { userId: ids.s2, fileId, mime: "application/pdf", size: 1000 } });
    expect((await grievancePost(json("/api/v1/voice/grievances", { kind: "HARASSMENT", text: "ZZ Something I want the committee to see.", fileId }))).status).toBe(200);
    expect(await db.iqacFile.count({ where: { fileId } })).toBe(1);
    await as(ids.iqac, ids.quill, "IQAC");
    const evidence = await body<{ items: { fileId: string; title: string; by: string }[] }>(await evidenceGet());
    expect(evidence.items.map((i) => i.fileId)).not.toContain(fileId);
    expect(evidence.items.some((i) => i.by === "ZZ Iqac Student2" || i.title === "HARASSMENT")).toBe(false);
    // The IQAC reads that a ragging grievance exists, not its words; the office acts.
    await as(ids.admin, ids.quill, "ADMIN");
    expect((await actPost(json("/x", { action: "RESOLVE", note: "ZZ done" }), params({ grievanceId: g.id }))).status).toBe(409);
  });
});

describe("the filings", () => {
  it("keeps the body's hash, regenerates to the same figures, and waits for the principal's sign-off", async () => {
    await as(ids.iqac, ids.quill, "IQAC");
    const year = new Date().getUTCFullYear() - 1;
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "AQAR", year, cycleId: ids.cycle }))).status).toBe(200);
    const f = (await body<{ items: { id: string; hash: string; status: string; figures: Record<string, number> }[] }>(await filingsGet())).items[0]!;
    const row = await db.collegeFiling.findUniqueOrThrow({ where: { id: f.id }, select: { body: true, hash: true, figuresJson: true } });
    expect(row.hash).toBe(createHash("sha256").update(row.body).digest("hex"));
    const again = await buildFiling(ids.quill, "AQAR", year, ids.cycle);
    expect(again.figures).toEqual(JSON.parse(row.figuresJson));
    expect(f.status).toBe("DRAFT");
    expect((await submitPost(json("/x", {}), params({ filingId: f.id }))).status).toBe(200);
    // The IQAC cannot sign its own document off.
    expect((await signoffPost(json("/x", { decision: "SIGN" }), params({ filingId: f.id }))).status).toBe(403);
    await as(ids.principal, ids.quill, "PRINCIPAL");
    expect((await signoffPost(json("/x", { decision: "RETURN" }), params({ filingId: f.id }))).status).toBe(422);
    expect((await signoffPost(json("/x", { decision: "SIGN", note: "ZZ Approved." }), params({ filingId: f.id }))).status).toBe(200);
    expect((await db.collegeFiling.findUniqueOrThrow({ where: { id: f.id }, select: { status: true } })).status).toBe("SIGNED_OFF");
  });

  it("refuses a second AQAR for a year already filed unless asked again, and sends nothing to the principal at a college with none (A3-journeys-35, A3-journeys-36)", async () => {
    await as(ids.iqac, ids.quill, "IQAC");
    const year = new Date().getUTCFullYear() - 1;
    const label = `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
    const signed = await db.collegeFiling.findFirstOrThrow({ where: { schoolId: ids.quill, kind: "AQAR", year, status: "SIGNED_OFF" }, select: { id: true } });
    expect((await filedPost(json("/x", { fileId: null }), params({ filingId: signed.id }))).status).toBe(200);
    // Generating that year's AQAR again is refused with the warning, and makes nothing.
    const again = await filingsPost(json("/api/v1/iqac/filings", { kind: "AQAR", year, cycleId: ids.cycle }));
    expect(again.status).toBe(409);
    expect((await body(again)).error).toBe(`This filing for ${label} is already filed. To make another, tick “Make it again” and generate.`);
    expect(await db.collegeFiling.count({ where: { schoolId: ids.quill, kind: "AQAR", year } })).toBe(1);
    // Asked again, it is made, as a draft beside the filed one.
    expect((await filingsPost(json("/api/v1/iqac/filings", { kind: "AQAR", year, cycleId: ids.cycle, again: true }))).status).toBe(200);
    const draft = await db.collegeFiling.findFirstOrThrow({ where: { schoolId: ids.quill, kind: "AQAR", year, status: "DRAFT" }, select: { id: true } });
    // With no principal on the roll, "send to the principal" is refused and the draft stays a draft.
    const principal = await db.membership.findFirstOrThrow({ where: { schoolId: ids.quill, role: "PRINCIPAL" }, select: { id: true } });
    await db.membership.update({ where: { id: principal.id }, data: { leftAt: new Date() } });
    try {
      const sent = await submitPost(json("/x", {}), params({ filingId: draft.id }));
      expect(sent.status).toBe(409);
      expect((await body(sent)).error).toBe("This college has no principal to sign it off. Add the principal first.");
      expect((await db.collegeFiling.findUniqueOrThrow({ where: { id: draft.id }, select: { status: true } })).status).toBe("DRAFT");
    } finally {
      await db.membership.update({ where: { id: principal.id }, data: { leftAt: null } });
    }
    expect((await submitPost(json("/x", {}), params({ filingId: draft.id }))).status).toBe(200);
  });

  it("a past year's filing reads the same figures when it is built again years later (LIFECYCLE-8)", async () => {
    const year = new Date().getUTCFullYear() - 1;
    const now = await buildFiling(ids.quill, "AQAR", year, ids.cycle);
    const nirf = await buildFiling(ids.quill, "NIRF", year, ids.cycle);
    vi.useFakeTimers({ toFake: ["Date"], now: Date.now() + 3 * 365 * 86_400_000 });
    try {
      // The teachers' experience once moved with the calendar (2.4.3 read 20.98, then 6.34).
      expect((await buildFiling(ids.quill, "AQAR", year, ids.cycle)).figures).toEqual(now.figures);
      expect((await buildFiling(ids.quill, "NIRF", year, ids.cycle)).figures).toEqual(nirf.figures);
    } finally {
      vi.useRealTimers();
    }
  });

  it("a year's QA options count only a NIRF filed for a year inside its window, so a later NIRF does not move a filed AQAR (DS-10)", async () => {
    const { gatherFacts } = await import("@/lib/iqac-facts");
    const qa = async () => (await gatherFacts(ids.quill, "2020-06-01", "2021-05-31", {})).facts.qaOptions ?? 0;
    const before = await qa();
    const filing = (year: number) => ({ schoolId: ids.quill, kind: "NIRF", year, format: "CSV", body: "", hash: `zz-ds10-${year}-${STAMP}` });
    await db.collegeFiling.create({ data: filing(2026) });
    expect(await qa()).toBe(before);
    await db.collegeFiling.create({ data: filing(2020) });
    expect(await qa()).toBe(before + 1);
    await db.collegeFiling.deleteMany({ where: { schoolId: ids.quill, hash: { startsWith: "zz-ds10-" } } });
  });

  it("publishes the disclosure for a signed-out reader, and takes it down", async () => {
    await as(ids.iqac, ids.quill, "IQAC");
    expect((await disclosurePost(json("/x", { publish: true }))).status).toBe(200);
    const doc = await publishedDisclosure(`zz-iqac-quill-${STAMP}`);
    expect(doc?.title).toContain("Mandatory Disclosure");
    expect(JSON.stringify(doc)).not.toMatch(/Student\d/);
    expect((await disclosurePost(json("/x", { publish: false }))).status).toBe(200);
    expect(await publishedDisclosure(`zz-iqac-quill-${STAMP}`)).toBeNull();
  });
});

describe("the tables the IQAC files from", () => {
  it("reads the three-year finance table, as the catalog says (campaign W-8)", async () => {
    await as(ids.iqac, ids.quill, "IQAC");
    const res = await financeTableGet(get("/api/v1/accounts/finance-table"));
    expect(res.status).toBe(200);
    expect(Array.isArray((await body<{ years: unknown[] }>(res)).years)).toBe(true);
    // A faculty member does not.
    await as(ids.f1, ids.quill, "FACULTY");
    expect((await financeTableGet(get("/api/v1/accounts/finance-table"))).status).toBe(403);
  });

  it("counts the heavy doors per person: a filing cut from live rows past the hour's budget is 429 with Retry-After (campaign S-18)", async () => {
    await as(ids.iqac, ids.quill, "IQAC");
    const { HEAVY_READ_BUDGET } = await import("@/lib/api-v1");
    const bucket = `heavy:${ids.iqac}`;
    await db.rateLimit.upsert({ where: { bucket }, create: { bucket, hits: HEAVY_READ_BUDGET.limit, windowEndsAt: new Date(Date.now() + 3_600_000) }, update: { hits: HEAVY_READ_BUDGET.limit, windowEndsAt: new Date(Date.now() + 3_600_000) } });
    const refused = await filingsPost(json("/api/v1/iqac/filings", {}));
    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("retry-after"))).toBeGreaterThan(0);
    await db.rateLimit.deleteMany({ where: { bucket } });
    expect((await filingsPost(json("/api/v1/iqac/filings", {}))).status).toBe(422);
  });
});

describe("another college", () => {
  it("refuses a faculty member of another college this college's rows", async () => {
    await as(ids.f1, ids.quill, "FACULTY");
    const own = await body<{ items: { id: string }[] }>(await researchGet());
    const itemId = own.items[0]!.id;
    await as(ids.other, ids.bare, "FACULTY");
    // At Bare the module is off; and the row is not Bare's in any case.
    expect((await researchRemove(json("/x", {}), params({ itemId }))).status).toBe(403);
    await db.schoolModule.create({ data: { schoolId: ids.bare, module: "IQAC" } });
    expect((await researchRemove(json("/x", {}), params({ itemId }))).status).toBe(404);
    const list = await body<{ items: unknown[] }>(await researchGet());
    expect(list.items).toEqual([]);
    expect((await cyclesGet()).status).toBe(403);
  });
});
