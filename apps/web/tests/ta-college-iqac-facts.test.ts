/**
 * The predictor's facts and readings: four findings of the testing analysis of 13 November 2026 in
 * lib/iqac-facts.ts, lib/iqac-filings.ts and lib/iqac-rules.ts.
 *
 *   TA-074  The NIRF estimate divided the teachers by one year's intake and counted visiting teachers,
 *           so the faculty-student mark was several times too generous.
 *   TA-075  Research items were read for one calendar year beyond the window, so consecutive yearly
 *           AQARs counted the same item twice.
 *   TA-076  A yearly AQAR was computed with the five-year sums the coordinator entered for the cycle.
 *   TA-571  An average of 0 days to results scored 0 of 4 on NAAC 2.5.1, and the insights offered no step.
 *
 * One scratch ZZ college of this suite's own (made through the owner connection, removed after), its
 * rows written straight to the tables; the library is called as the filings and the predictor call it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { gatherFacts, nirfFacts } from "@/lib/iqac-facts";
import { buildFiling } from "@/lib/iqac-filings";
import { evaluate, nirfSubs } from "@/lib/iqac-rules";
import { stepFor } from "@/lib/accreditation-insights";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-taiqf-${who}-${STAMP}@test.invalid`;
const ids = { school: "", dept: "", cycle: "", admin: "" };
const Y = 2024; // the academic year 2024-25

async function teacher(who: string, appointment: "REGULAR" | "VISITING") {
  const u = await db.user.create({ data: { name: `ZZ TA Iqac Facts ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } });
  const m = await db.membership.create({ data: { userId: u.id, schoolId: ids.school, role: "FACULTY", status: "ACTIVE" }, select: { id: true } });
  await db.facultyRecord.create({ data: { schoolId: ids.school, membershipId: m.id, designation: "ASSISTANT_PROFESSOR", appointment, highestQualification: "PG" } });
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA IQAC Facts ${STAMP}`, slug: `zz-taiqf-${STAMP}`, code: `ZTQF${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.school, module: "ACADEMICS" }, { schoolId: ids.school, module: "IQAC" }] });
  ids.admin = (await db.user.create({ data: { name: "ZZ TA Iqac Facts Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  ids.dept = (await db.department.create({ data: { schoolId: ids.school, code: "ZZA", name: "ZZ Arts" }, select: { id: true } })).id;
  // One three-year programme admitting sixty a year.
  await db.programme.create({ data: { schoolId: ids.school, departmentId: ids.dept, code: "ZZBA", name: "ZZ BA", level: "UG", durationYears: 3, intake: 60, regulator: "UGC", stream: "ARTS" } });
  for (let i = 1; i <= 6; i += 1) await teacher(`regular${i}`, "REGULAR");
  for (let i = 1; i <= 2; i += 1) await teacher(`visiting${i}`, "VISITING");
  // A CARE paper dated Y and one dated Y + 1.
  for (const year of [Y, Y + 1]) await db.researchItem.create({ data: { schoolId: ids.school, kind: "PUBLICATION", title: `ZZ paper ${year}`, year, indexing: "UGC_CARE" } });
  // The year's own spending: 20 lakh of assets bought and 100 lakh of purchases in 2024-25.
  await db.academicYear.create({ data: { schoolId: ids.school, name: "2024-25", startDate: new Date(`${Y}-06-01T00:00:00Z`), endDate: new Date(`${Y + 1}-05-31T00:00:00Z`) } });
  await db.asset.create({ data: { schoolId: ids.school, tagNumber: `ZZ-${TAIL}`, name: "ZZ projector", location: "Hall", costPaise: 20 * 100_000 * 100, purchaseDate: new Date(`${Y}-07-01T00:00:00Z`) } });
  await db.purchaseRecord.create({ data: { schoolId: ids.school, vendorName: "ZZ Supplies", dateKey: `${Y}-08-01`, invoiceRef: `ZZ-${TAIL}`, location: "Store", totalPaise: 100 * 100_000 * 100, createdByUserId: ids.admin } });
  // The cycle of five years, with the five-year sum the coordinator typed as the form asks.
  ids.cycle = (
    await db.accreditationCycle.create({
      data: { schoolId: ids.school, framework: "AFFILIATED_UG", institutionType: "COLLEGE", windowFrom: `${Y - 3}-06-01`, windowTo: `${Y + 2}-05-31`, enteredJson: JSON.stringify({ NON_SALARY_EXPENDITURE_LAKHS: { value: 500 } }), createdByUserId: ids.admin },
      select: { id: true },
    })
  ).id;
}, 60_000);

afterAll(async () => {
  await db.school.delete({ where: { id: ids.school } }).catch(() => undefined);
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-075: a research item counts in one academic year", () => {
  it("TA-075: over the window of academic year Y one paper of year Y counts, and two consecutive windows add to two, not three", async () => {
    const first = await gatherFacts(ids.school, `${Y}-06-01`, `${Y + 1}-05-31`, {});
    const second = await gatherFacts(ids.school, `${Y + 1}-06-01`, `${Y + 2}-05-31`, {});
    expect(first.facts.papers).toBe(1);
    expect((first.facts.papers ?? 0) + (second.facts.papers ?? 0)).toBe(2);
  }, 120_000);
});

describe("TA-074: NIRF's faculty-student ratio", () => {
  it("TA-074: N is the sanctioned strength of every year of the programme and F the full-time teachers: 180 and 6, FSR 20", async () => {
    const g = await gatherFacts(ids.school, `${Y - 2}-06-01`, `${Y + 1}-05-31`, {});
    const nf = await nirfFacts(ids.school, g);
    expect(nf.intake).toBe(180);
    expect(nf.faculty).toBe(6);
    expect(nirfSubs(nf).FSR).toBe(20);
  }, 120_000);
});

describe("TA-076: a yearly AQAR reads the year's own figures", () => {
  it("TA-076: the five-year non-salary sum typed for the cycle is not the AQAR's: 4.1.2 is 20 lakh of 100, 20 %", async () => {
    const built = await buildFiling(ids.school, "AQAR", Y, ids.cycle);
    expect(built.figures["4.1.2"]).toBe(20);
  }, 120_000);
});

describe("TA-571: results the day of the last paper", () => {
  it("TA-571: an average of 0 days scores 4 on RESULT_DAYS, and the insights need no step", () => {
    expect(evaluate("RESULT_DAYS", { resultDaysAvg: 0 }).score).toBe(4);
    expect(stepFor("RESULT_DAYS", { resultDaysAvg: 0 }, 4)).toMatchObject({ units: 0 });
    // The other ratios keep 0 for an empty side.
    expect(evaluate("STUDENT_TEACHER_RATIO", { studentsLatest: 0, fullTimeTeachers: 5 }).score).toBe(0);
  });
});
