/**
 * THE PEER-TEAM VISIT FILE (the risks batch, R-2, package 5B, 5 October
 * 2026), at an engineering college of this suite's own with a NAAC cycle,
 * an SSR, a department's NBA SAR, an IQAC file and a metric score.
 *
 * What is proved: the IQAC files a NAAC visit naming its cycle and an HOD an
 * NBA visit of their own engineering department only; an HOD neither reads
 * nor writes a NAAC visit; the principal reads and changes nothing; the
 * schedule stays inside the visit's days; an evidence line points only at
 * this college's own filing or file, an https link, a metric, a note; the SAR
 * pack is read from the filings (what is generated, what is missing, the
 * cycle's CGPA or the SAR's marks); a line whose filing is gone reads MISSING
 * and its criterion's coverage says so; the dates cannot leave a slot outside;
 * the index downloads as CSV and is audited.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { addVisitItem, createVisit, listVisits, removeVisitItem, updateVisit, visitDetail, visitIndexCsv } from "@/lib/peer-visits";
import { criterionOf } from "@edulink/contracts";
import { POST as visitsPost } from "@/app/api/v1/iqac/visits/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-visit-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  return (await getSession()) as ActiveContext;
}
async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ Visit ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}
async function refusal(work: Promise<unknown>): Promise<string> {
  try {
    await work;
  } catch (e) {
    return (e as { key?: string }).key ?? String(e);
  }
  return "no refusal";
}
const NAAC = { framework: "NAAC" as const, year: 2026, title: "ZZ NAAC peer team", fromDate: "2026-12-07", toDate: "2026-12-09", team: [{ name: "ZZ Prof Rao", role: "Chair" }] };

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ Visit Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ Visit College ${STAMP}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", kind: "COLLEGE", streams: ["ENGINEERING"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.college = made.schoolId;
  await db.school.update({ where: { id: ids.college }, data: { isTestFixture: true } });
  for (const [who, role] of [["iqac", "IQAC"], ["principal", "PRINCIPAL"], ["hod", "HOD"], ["otherHod", "HOD"]] as const) await person(who, role);
  const C = ids.college!;
  ids.mech = (await db.department.create({ data: { schoolId: C, code: "MECH", name: "ZZ Visit Mechanical", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  ids.civil = (await db.department.create({ data: { schoolId: C, code: "CIVIL", name: "ZZ Visit Civil", hodMembershipId: ids.otherHodM }, select: { id: true } })).id;
  for (const [code, dept] of [["BEME", ids.mech], ["BECE", ids.civil]] as const) await db.programme.create({ data: { schoolId: C, departmentId: dept!, code, name: `ZZ ${code}`, level: "UG", durationYears: 4, intake: 60, regulator: "AICTE", stream: "ENGINEERING" } });
  ids.cycle = (await db.accreditationCycle.create({ data: { schoolId: C, framework: "NAAC_AFFILIATED", institutionType: "AFFILIATED", windowFrom: "2021-22", windowTo: "2025-26", cgpa: 2.84 }, select: { id: true } })).id;
  ids.ssr = (await db.collegeFiling.create({ data: { schoolId: C, kind: "SSR", cycleId: ids.cycle, year: 2026, format: "JSON", body: "{}", hash: "a".repeat(64), status: "DRAFT" }, select: { id: true } })).id;
  ids.sar = (await db.collegeFiling.create({ data: { schoolId: C, kind: "NBA_SAR", year: 2026, format: "JSON", body: "{}", hash: "b".repeat(64), status: "DRAFT", departmentId: ids.mech, figuresJson: JSON.stringify({ totalMarks: 612.5 }) }, select: { id: true } })).id;
  ids.file = (await db.iqacFile.create({ data: { schoolId: C, fileId: `zz-visit-file-${STAMP}`, title: "ZZ Minutes of the IQAC", purpose: "EVIDENCE", uploadedByUserId: ids.iqac! }, select: { id: true } })).id;
  await db.metricScore.create({ data: { schoolId: C, cycleId: ids.cycle!, metricCode: "3.2.1", kind: "QN", runId: "zz", value: 12, score: 3 } });
  // Another college's filing, which no line here may point at.
  const other = await createSchool(operator(), { name: `ZZ Visit Other ${STAMP}`, contactEmail: MAIL("contact2"), timezone: "Asia/Kolkata", kind: "COLLEGE", streams: ["ARTS"] });
  if (!other.ok) throw new Error(other.errorKey);
  ids.other = other.schoolId;
  ids.otherFiling = (await db.collegeFiling.create({ data: { schoolId: ids.other, kind: "SSR", year: 2026, format: "JSON", body: "{}", hash: "c".repeat(64) }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  for (const id of [ids.college, ids.other]) {
    if (!id) continue;
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: id }, { targetId: id }] } });
    await db.school.deleteMany({ where: { id } });
  }
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("who files a visit", () => {
  it("the IQAC files a NAAC visit naming its cycle; an HOD files only their own department's NBA visit", async () => {
    const iqac = await as("iqac", "IQAC");
    expect(await refusal(createVisit(iqac, { ...NAAC, cycleId: null }))).toBe("peerVisit.refuseCycle");
    expect(await refusal(createVisit(iqac, { ...NAAC, cycleId: ids.cycle, toDate: "2026-12-20" }))).toBe("peerVisit.refuseTooLong");
    const naac = await createVisit(iqac, { ...NAAC, cycleId: ids.cycle });
    ids.naac = naac.id;
    expect(naac.canEdit).toBe(true);
    const hod = await as("hod", "HOD");
    expect(await refusal(createVisit(hod, { ...NAAC, cycleId: ids.cycle }))).toBe("access.wrongRoleForThisAction");
    expect(await refusal(createVisit(hod, { framework: "NBA", departmentId: ids.civil, year: 2026, title: "ZZ NBA civil", fromDate: "2027-01-11", toDate: "2027-01-12", team: [] }))).toBe("access.wrongRoleForThisAction");
    const nba = await createVisit(hod, { framework: "NBA", departmentId: ids.mech, year: 2026, title: "ZZ NBA mechanical", fromDate: "2027-01-11", toDate: "2027-01-12", team: [] });
    ids.nba = nba.id;
    expect(nba.departmentName).toBe("ZZ Visit Mechanical");
    // The HOD sees their own NBA visit alone; the NAAC visit is not theirs to read.
    expect((await listVisits(hod)).visits.map((v) => v.id)).toEqual([nba.id]);
    expect(await refusal(visitDetail(hod, ids.naac!))).toBe("access.entryNotFound");
    // The principal reads both and changes neither.
    const principal = await as("principal", "PRINCIPAL");
    expect((await listVisits(principal)).visits).toHaveLength(2);
    expect((await visitDetail(principal, ids.naac!)).canEdit).toBe(false);
    expect(await refusal(updateVisit(principal, ids.naac!, { status: "DONE" }))).toBe("access.wrongRoleForThisAction");
    // The door refuses the principal's write before the body.
    expect((await visitsPost(new Request("http://localhost/api/v1/iqac/visits", { method: "POST", body: "{}" }))).status).toBe(403);
  });
});

describe("the file", () => {
  it("keeps the schedule inside the visit's days", async () => {
    const iqac = await as("iqac", "IQAC");
    expect(await refusal(addVisitItem(iqac, ids.naac!, { kind: "SCHEDULE", dayKey: "2026-12-10", startMinute: 600, endMinute: 660, activity: "ZZ Lab visit", venue: "", ownerName: "" }))).toBe("peerVisit.refuseDayOutside");
    expect(await refusal(addVisitItem(iqac, ids.naac!, { kind: "SCHEDULE", dayKey: "2026-12-07", startMinute: 600, endMinute: 540, activity: "ZZ Lab visit", venue: "", ownerName: "" }))).toBe("peerVisit.refuseTimes");
    const v = await addVisitItem(iqac, ids.naac!, { kind: "SCHEDULE", dayKey: "2026-12-08", startMinute: 600, endMinute: 690, activity: "ZZ Meeting the IQAC", venue: "ZZ Board room", ownerName: "ZZ Coordinator" });
    expect(v.schedule).toHaveLength(1);
    expect(await refusal(updateVisit(iqac, ids.naac!, { fromDate: "2026-12-09", toDate: "2026-12-10" }))).toBe("peerVisit.refuseScheduleOutside");
  });

  it("points evidence only at this college's own filings and files, an https link, a metric or a note, each resolved", async () => {
    const iqac = await as("iqac", "IQAC");
    expect(await refusal(addVisitItem(iqac, ids.naac!, { kind: "EVIDENCE", criterion: "1.1.1", title: "ZZ Theirs", linkKind: "FILING", linkId: ids.otherFiling, note: "" }))).toBe("peerVisit.refuseLink");
    expect(await refusal(addVisitItem(iqac, ids.naac!, { kind: "EVIDENCE", criterion: "1.1.1", title: "ZZ Plain", linkKind: "LINK", url: "http://example.org/x", note: "" }))).toBe("peerVisit.refuseUrl");
    expect(await refusal(addVisitItem(iqac, ids.naac!, { kind: "EVIDENCE", criterion: "1.1.1", title: "ZZ Sheet", linkKind: "WORKSHEET", note: "" }))).toBe("peerVisit.refuseWorksheet");
    await addVisitItem(iqac, ids.naac!, { kind: "EVIDENCE", criterion: "1.1.1", title: "ZZ The SSR", linkKind: "FILING", linkId: ids.ssr, note: "" });
    await addVisitItem(iqac, ids.naac!, { kind: "EVIDENCE", criterion: "6.5.1", title: "ZZ IQAC minutes", linkKind: "FILE", linkId: ids.file, note: "" });
    await addVisitItem(iqac, ids.naac!, { kind: "EVIDENCE", criterion: "3.2.1", title: "ZZ Research grants", linkKind: "METRIC", note: "" });
    const v = await addVisitItem(iqac, ids.naac!, { kind: "EVIDENCE", criterion: "7.1.1", title: "ZZ Gender audit", linkKind: "LINK", url: "https://example.org/gender-audit", note: "ZZ on the website" });
    const by = (c: string) => v.evidence.find((e) => e.criterion === c)!;
    expect(by("1.1.1").resolved).toMatchObject({ ok: true, label: "SSR 2026 · DRAFT", href: "/iqac/documents#ssr" });
    expect(by("6.5.1").resolved).toMatchObject({ ok: true, label: "ZZ Minutes of the IQAC", href: `/api/files/zz-visit-file-${STAMP}` });
    expect(by("3.2.1").resolved).toMatchObject({ ok: true, label: "3.2.1 · 3" });
    expect(by("7.1.1").resolved).toMatchObject({ ok: true, href: "https://example.org/gender-audit" });
    expect(v.pack.coverage.map((c) => [c.criterion, c.lines])).toEqual([["1", 1], ["2", 0], ["3", 1], ["4", 0], ["5", 0], ["6", 1], ["7", 1]]);
  });

  it("reads the SAR pack from the filings, and says MISSING when a line's filing is gone", async () => {
    const iqac = await as("iqac", "IQAC");
    const v = await visitDetail(iqac, ids.naac!);
    expect(v.pack.filings.map((f) => `${f.kind} ${f.year}`)).toEqual(["SSR 2026"]);
    expect(v.pack.missing).toEqual(["IIQA", "AQAR"]);
    expect(v.pack.figure).toBe(2.84);
    await db.collegeFiling.delete({ where: { id: ids.ssr } });
    const after = await visitDetail(iqac, ids.naac!);
    expect(after.evidence.find((e) => e.criterion === "1.1.1")?.resolved).toMatchObject({ ok: false });
    expect(after.pack.coverage.find((c) => c.criterion === "1")).toEqual({ criterion: "1", lines: 1, missing: 1 });
    expect(after.pack.missing).toContain("SSR");
    const hod = await as("hod", "HOD");
    const nba = await visitDetail(hod, ids.nba!);
    expect(nba.pack).toMatchObject({ figure: 612.5, missing: [] });
    expect(nba.pack.filings.map((f) => f.href)).toEqual([`/iqac/documents/nba?year=2026&departmentId=${ids.mech}`]);
    expect(nba.pack.coverage).toHaveLength(10);
  });

  it("downloads the index as CSV, audited, and a line comes off", async () => {
    const iqac = await as("iqac", "IQAC");
    const sheet = await visitIndexCsv(iqac, ids.naac!);
    expect(sheet.rows.filter((r) => r.section === "evidence")).toHaveLength(4);
    expect(sheet.rows.find((r) => r.section === "schedule")).toMatchObject({ day: "2026-12-08", time: "10:00-11:30", title: "ZZ Meeting the IQAC" });
    expect(await db.auditLog.count({ where: { schoolId: ids.college, action: "iqac.visit.export" } })).toBe(1);
    const v = await visitDetail(iqac, ids.naac!);
    const left = await removeVisitItem(iqac, ids.naac!, v.evidence[0]!.id);
    expect(left.evidence).toHaveLength(3);
    expect(criterionOf("C4.5")).toBe("4");
    expect(criterionOf("10.1")).toBe("10");
  });
});
