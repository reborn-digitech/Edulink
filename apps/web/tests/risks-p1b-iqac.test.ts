/**
 * The risks batch's package 1B, the IQAC's decisions applied by code (5 Oct 2026; docs/audit-2026-10-05/
 * 08-remaining-risks.md):
 *   - G4-3: an anonymous survey is not opened without FEES_SECRET_KEY (409 with a sentence); with it, it is;
 *   - G4-17: working days are the college's own — its teaching week and its closing holidays — for a grievance's due day;
 *   - R-47: the hundred scenarios hold a per-author ceiling and, for an HOD, a per-department one; an NBA scenario's
 *     year is held to the years the department's programmes have run;
 *   - R-40: the NIRF band table's top-hundred line is NIRF 2025's published 100th score (54.39);
 *   - G4-15: every NAAC and NIRF figure reads provisional until the IQAC coordinator signs the benchmark list; signing
 *     is the IQAC's alone, audited, and a changed list is unsigned again;
 *   - R-21: a council return's no-history fields (a teacher's designation, a programme's intake) are frozen at
 *     generation: the filed year's figures do not move when the rows change, the open year's do.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NIRF_BANDS, type NbaInputs } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { createSurvey, fileGrievance, workingCalendar } from "@/lib/iqac";
import { addWorkingDays, benchmarkListVersion } from "@/lib/iqac-rules";
import { MAX_SCENARIOS_PER_AUTHOR, MAX_SCENARIOS_PER_DEPARTMENT, naacInsights, nbaYearRange, saveScenario } from "@/lib/iqac-insights";
import { benchmarksView, signBenchmarks } from "@/lib/iqac-benchmarks";
import { generateFiling, buildFiling } from "@/lib/iqac-filings";
import { councilDocument, defaultFilingYear } from "@/lib/council-filings";
import { todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-p1b-iqac-${who.toLowerCase()}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const ids: Record<string, string> = {};
const users: string[] = [];

async function as(who: string, role: string, school = "college"): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids[school]!, role: role as never });
  return (await getSession())!;
}

async function person(who: string, role: string, school = "college"): Promise<string> {
  ids[who] = (await db.user.create({ data: { name: `ZZ P1B ${who}`, email: MAIL(who), isMinor: false }, select: { id: true } })).id;
  users.push(ids[who]!);
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids[school]!, role, status: "ACTIVE" }, select: { id: true } })).id;
  return ids[`${who}M`]!;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ P1B Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  users.push(ids.operator);
  const operator = { user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } } as unknown as ActiveContext;
  for (const [key, streams] of [["college", ["ENGINEERING"]], ["pharmacy", ["PHARMACY"]]] as const) {
    const made = await createSchool(operator, { name: `ZZ P1B Iqac ${key} ${STAMP}`, contactEmail: MAIL(`contact-${key}`), timezone: TZ, kind: "COLLEGE", streams: [...streams] });
    if (!made.ok) throw new Error(made.errorKey);
    ids[key] = made.schoolId;
    await db.school.update({ where: { id: made.schoolId }, data: { isTestFixture: true } });
    await db.schoolModule.createMany({ data: ["ACADEMICS", "IQAC"].map((module) => ({ schoolId: made.schoolId, module })), skipDuplicates: true });
  }
  await person("iqac", "IQAC");
  await person("admin", "ADMIN");
  await person("principal", "PRINCIPAL");
  const hodM = await person("hod", "HOD");
  await person("student", "STUDENT");
  ids.dept = (await db.department.create({ data: { schoolId: ids.college!, code: "ZZCSE", name: "ZZ P1B Computers", hodMembershipId: hodM }, select: { id: true } })).id;
  ids.programme = (await db.programme.create({ data: { schoolId: ids.college!, departmentId: ids.dept!, code: "ZZBTCS", name: "ZZ P1B BTech CS", level: "UG", durationYears: 4, intake: 60, regulator: "AICTE", stream: "ENGINEERING" }, select: { id: true } })).id;
  const scheme = await db.scheme.create({ data: { schoolId: ids.college!, programmeId: ids.programme!, name: "ZZ scheme", effectiveYear: 2024 }, select: { id: true } });
  await db.studentProgramme.create({ data: { schoolId: ids.college!, studentMembershipId: ids.studentM!, programmeId: ids.programme!, schemeId: scheme.id, entryYear: 2024 } });
  ids.cycle = (await db.accreditationCycle.create({ data: { schoolId: ids.college!, framework: "AFFILIATED_UG", institutionType: "AFFILIATED", windowFrom: "2021-06-01", windowTo: "2026-05-31" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.college!, ids.pharmacy!] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college!, ids.pharmacy!] } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("G4-3: no key, no anonymous survey", () => {
  it("refuses to open an anonymous survey without FEES_SECRET_KEY, and opens it with the key", async () => {
    const iqac = await as("iqac", "IQAC");
    const input = { kind: "SSS" as const, title: "ZZ P1B Satisfaction", opensOn: "2026-10-01", closesOn: "2026-10-31", offeringId: null, termId: null };
    const key = process.env.FEES_SECRET_KEY;
    expect(key, "the test environment sets the key").toBeTruthy();
    delete process.env.FEES_SECRET_KEY;
    try {
      await expect(createSurvey(iqac, input)).rejects.toMatchObject({ key: "riskDecisions.refuseSurveyNoKey", status: 409 });
      expect(await db.survey.count({ where: { schoolId: ids.college! } })).toBe(0);
    } finally {
      process.env.FEES_SECRET_KEY = key;
    }
    const opened = await createSurvey(iqac, input);
    expect(opened.items.map((s) => s.title)).toContain("ZZ P1B Satisfaction");
  });
});

describe("G4-17: working days by the college's own calendar", () => {
  it("counts the college's teaching days and skips its holidays", () => {
    // Monday to Saturday, no calendar (as before): 2026-10-03 is a Saturday; 15 working days skip three Sundays.
    expect(addWorkingDays("2026-10-03", 15)).toBe("2026-10-21");
    // A Monday-to-Friday college: 5 working days from Friday 2026-10-02 end on Friday 2026-10-09.
    expect(addWorkingDays("2026-10-02", 5, { teachingDays: [1, 2, 3, 4, 5] })).toBe("2026-10-09");
    // A college that teaches on Sunday and is shut on Saturday, with Wednesday the 7th a holiday.
    expect(addWorkingDays("2026-10-02", 5, { teachingDays: [0, 1, 2, 3, 4, 5], closed: new Set(["2026-10-07"]) })).toBe("2026-10-09");
  });

  it("dates a grievance by the college's week and holidays", async () => {
    await db.school.update({ where: { id: ids.college! }, data: { teachingDays: "1,2,3,4,5" } });
    const today = todayKey(TZ);
    const holiday = (await import("@/lib/dates")).addDaysToKey(today, 2);
    await db.holiday.create({ data: { schoolId: ids.college!, name: "ZZ P1B holiday", startDateKey: holiday, endDateKey: holiday, kind: "HOLIDAY" } });
    const cal = await workingCalendar(ids.college!, today);
    expect(cal.teachingDays).toEqual([1, 2, 3, 4, 5]);
    expect(cal.closed?.has(holiday)).toBe(true);
    const g = await fileGrievance(await as("student", "STUDENT"), { kind: "ACADEMIC", text: "ZZ P1B the lab is shut every week", fileId: null, anonymousToStaff: false });
    const row = await db.grievance.findFirstOrThrow({ where: { schoolId: ids.college! }, select: { dueOn: true } });
    expect(row.dueOn).toBe(addWorkingDays(today, 15, cal));
    expect(row.dueOn).not.toBe(addWorkingDays(today, 15));
    expect(g).toBeTruthy();
  });
});

describe("R-47: scenarios held per author and per department, and their years", () => {
  const nba = (year: number, name: string) => ({ kind: "NBA" as const, year, departmentId: ids.dept!, name, inputs: { S: 0, F: 0, intake: 0, admitted: 0, successNoBacklog: null, successStipulated: null, apiFirst: null, apiSecond: null, apiThird: null, placement: null, professors: 0, associates: 0, assistants: 0, phd: 0, masters: 0, firstYearStudents: 0, firstYearFaculty: 0, self: {} } satisfies NbaInputs });

  it("refuses an NBA year outside the department's programmes, 1900 among them", async () => {
    const range = await nbaYearRange(ids.college!, ids.dept!);
    expect(range).toEqual({ from: 2024, to: defaultFilingYear() + 1 });
    const hod = await as("hod", "HOD");
    await expect(saveScenario(hod, nba(1900, "ZZ 1900"))).rejects.toMatchObject({ key: "riskDecisions.refuseScenarioYear", status: 422 });
    await expect(saveScenario(hod, nba(range.to + 1, "ZZ next year"))).rejects.toMatchObject({ key: "riskDecisions.refuseScenarioYear" });
    expect((await saveScenario(hod, nba(range.to, "ZZ this year"))).items.some((s) => s.name === "ZZ this year")).toBe(true);
  });

  it("stops an HOD at the department's ceiling and anyone at their own, inside the college's hundred", async () => {
    await db.iqacScenario.deleteMany({ where: { schoolId: ids.college! } });
    await db.iqacScenario.createMany({ data: Array.from({ length: MAX_SCENARIOS_PER_DEPARTMENT }, (_, i) => ({ schoolId: ids.college!, kind: "NBA", year: 2025, departmentId: ids.dept!, name: `ZZ dept filler ${i}`, inputsJson: "{}", marks: 0, createdByUserId: ids.iqac! })) });
    const hod = await as("hod", "HOD");
    await expect(saveScenario(hod, nba(2025, "ZZ one more"))).rejects.toMatchObject({ key: "riskDecisions.refuseScenarioDepartment", status: 409 });
    // The IQAC's own ceiling: those 25 are theirs.
    const iqac = await as("iqac", "IQAC");
    await expect(saveScenario(iqac, { kind: "NAAC", cycleId: ids.cycle!, name: "ZZ naac", inputs: { facts: {}, ql: {}, nirf: null } })).rejects.toMatchObject({ key: "riskDecisions.refuseScenarioAuthor", status: 409 });
    expect(MAX_SCENARIOS_PER_AUTHOR).toBe(25);
    // The principal, another author, still saves one: the college's hundred is not full.
    expect((await saveScenario(await as("principal", "PRINCIPAL"), { kind: "NAAC", cycleId: ids.cycle!, name: "ZZ head's", inputs: { facts: {}, ql: {}, nirf: null } })).items.some((s) => s.name === "ZZ head's")).toBe(true);
  });
});

describe("R-40: the NIRF band table", () => {
  it("puts the top hundred at NIRF 2025's published 100th score, the unpublished bands below it in order", () => {
    // https://www.nirfindia.org/Rankings/2025/CollegeRanking.html (retrieved 5 Oct 2026): rank 100, Fatima College, Madurai, 54.39.
    expect(NIRF_BANDS.map((b) => [b.code, b.min])).toEqual([["TOP_100", 54.39], ["B101_150", 54], ["B151_200", 51], ["B201_300", 47], ["BELOW", 0]]);
    for (let i = 1; i < NIRF_BANDS.length; i += 1) expect(NIRF_BANDS[i]!.min).toBeLessThan(NIRF_BANDS[i - 1]!.min);
  });
});

describe("G4-15: provisional until the coordinator signs the benchmark list", () => {
  it("reads provisional, lets the IQAC alone sign the current version, audits it, and lapses when the list changes", async () => {
    const iqac = await as("iqac", "IQAC");
    const before = await benchmarksView(iqac);
    expect(before).toMatchObject({ provisional: true, version: benchmarkListVersion(), canSign: true, signedAt: null });
    expect(before.naac.length).toBeGreaterThan(30);
    expect(before.nirfBands[0]).toEqual({ code: "TOP_100", min: 54.39 });
    expect((await naacInsights(iqac, { cycleId: ids.cycle! })).benchmarks?.provisional).toBe(true);
    await expect(signBenchmarks(await as("admin", "ADMIN"), { version: before.version })).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    expect((await benchmarksView(await as("principal", "PRINCIPAL"))).canSign).toBe(false);
    await expect(signBenchmarks(iqac, { version: "deadbeef" })).rejects.toMatchObject({ key: "riskDecisions.refuseBenchmarksChanged", status: 409 });
    const signed = await signBenchmarks(await as("iqac", "IQAC"), { version: before.version });
    expect(signed).toMatchObject({ provisional: false, signedByName: "ZZ P1B iqac" });
    expect(await db.auditLog.count({ where: { schoolId: ids.college!, action: "iqac.benchmarks.sign" } })).toBe(1);
    expect((await naacInsights(await as("iqac", "IQAC"), { cycleId: ids.cycle! })).benchmarks?.provisional).toBe(false);
    // Signing again changes nothing; a list that changed since (another version stored) reads provisional again.
    await signBenchmarks(await as("iqac", "IQAC"), { version: before.version });
    expect(await db.auditLog.count({ where: { schoolId: ids.college!, action: "iqac.benchmarks.sign" } })).toBe(1);
    await db.school.update({ where: { id: ids.college! }, data: { benchmarksSignedVersion: "00000000" } });
    expect((await benchmarksView(await as("iqac", "IQAC"))).provisional).toBe(true);
  });
});

describe("R-21: a council return's no-history fields are frozen at generation", () => {
  it("keeps the filed year's designation and intake when the rows change; the open year reads the rows", async () => {
    const school = ids.pharmacy!;
    await person("pIqac", "IQAC", "pharmacy");
    const teacherM = await person("pTeacher", "FACULTY", "pharmacy");
    const dept = await db.department.create({ data: { schoolId: school, code: "ZZPH", name: "ZZ P1B Pharmaceutics" }, select: { id: true } });
    await db.departmentFaculty.create({ data: { schoolId: school, departmentId: dept.id, membershipId: teacherM } });
    await db.facultyRecord.create({ data: { schoolId: school, membershipId: teacherM, designation: "ASSISTANT_PROFESSOR", highestQualification: "PG", appointment: "REGULAR" } });
    const programme = await db.programme.create({ data: { schoolId: school, departmentId: dept.id, code: "ZZBPH", name: "ZZ P1B BPharm", level: "UG", durationYears: 4, intake: 60, regulator: "PCI", stream: "PHARMACY" }, select: { id: true } });
    const year = defaultFilingYear();
    await generateFiling(await as("pIqac", "IQAC", "pharmacy"), { kind: "PCI_INSPECTION", year, cycleId: null });
    const filing = await db.collegeFiling.findFirstOrThrow({ where: { schoolId: school, kind: "PCI_INSPECTION", year }, select: { figuresJson: true, body: true, snapshotJson: true } });
    expect(JSON.parse(filing.snapshotJson)).toMatchObject({ intake: { [programme.id]: 60 }, teachers: { [teacherM]: { designation: "ASSISTANT_PROFESSOR", departmentId: dept.id } } });
    const filed = JSON.parse(filing.figuresJson) as Record<string, number>;
    expect(filed.intake).toBe(60);

    // The college moves on: the teacher is promoted and moved, the intake doubled.
    const other = await db.department.create({ data: { schoolId: school, code: "ZZPC", name: "ZZ P1B Chemistry" }, select: { id: true } });
    await db.facultyRecord.update({ where: { membershipId: teacherM }, data: { designation: "PROFESSOR", departmentId: other.id } });
    await db.departmentFaculty.updateMany({ where: { schoolId: school, membershipId: teacherM }, data: { departmentId: other.id } });
    await db.programme.update({ where: { id: programme.id }, data: { intake: 120 } });

    const again = await councilDocument(school, "PCI_INSPECTION", year, null);
    expect(again.figures).toEqual(filed);
    expect(JSON.stringify(again.document)).toContain("ASSISTANT_PROFESSOR");
    expect(JSON.stringify(again.document)).not.toContain("\"PROFESSOR\"");
    // The data audit's regeneration reads the same snapshot.
    expect((await buildFiling(school, "PCI_INSPECTION", year, null)).figures).toEqual(filed);
    // The open year, with no filing, reads the rows as they stand.
    const open = await councilDocument(school, "PCI_INSPECTION", year + 1, null);
    expect(open.figures.intake).toBe(120);
    // Moved to a department with no pharmacy programme, the teacher is no longer the stream's in the open year, still the filed year's.
    expect([filed.faculty, open.figures.faculty]).toEqual([1, 0]);
    // Generating again (a draft made anew) takes the rows as they stand now.
    const live = await councilDocument(school, "PCI_INSPECTION", year, null, { snapshot: "live" });
    expect(live.figures.intake).toBe(120);
  });
});
