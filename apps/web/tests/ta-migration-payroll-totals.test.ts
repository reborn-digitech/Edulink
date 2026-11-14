/**
 * TA-114 (testing analysis of 13 November 2026; the owner's decision of 14 November 2026, option 1): a month's
 * payroll above about 2.147 crore rupees could not be drafted, because the run's totals were summed into 32-bit
 * integer columns: writeTotals sent a gross past 2,147,483,647 paise, the database client refused it, the whole
 * draft rolled back and the door answered 500. The same ceiling stopped the bank advice of a run whose net passed it.
 *
 * PayrollRun's grossPaise, deductionsPaise, employerPaise and netPaise and PayrollExport.totalPaise are now 64-bit
 * (BigInt). The client hands them back as bigint, which JSON cannot carry, so every reader turns them into numbers
 * at the boundary (src/lib/safe-paise.ts) and a value past Number.MAX_SAFE_INTEGER is refused, never rounded. The
 * contracts keep answering numbers.
 *
 * One scratch ZZ college of this suite's own with PAYROLL on and three members of staff at one crore rupees a month
 * each (a slip's own figures still fit 32 bits; the sum of three does not); removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";
import { payrollRunSchema, payrollSummarySchema } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { draftRun, lockRun, payrollExport, payrollSummary, runView, saveSalary, saveStructure, savePayrollSettings } from "@/lib/payroll";
import { financeTable } from "@/lib/accounts";
import { safePaise } from "@/lib/safe-paise";
import { GET as runGet } from "@/app/api/v1/admin/payroll/runs/[month]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MONTH = "2026-09";
const INT32_MAX = 2_147_483_647;
const ONE_CRORE_RUPEES = 1_000_000_000;
const ids = { school: "", admin: "", staff: [] as string[] };

async function office() {
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
  return (await getSession())!;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Migration Payroll ${STAMP}`, slug: `zz-tamig-pay-${STAMP}`, code: `ZMP${SUFFIX}`, contactEmail: `zz-tamig-pay-office-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "PAYROLL" } });
  await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true } });
  const user = (who: string) => db.user.create({ data: { name: `ZZ TA Migration Pay ${who}`, email: `zz-tamig-pay-${who.toLowerCase()}-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } });
  ids.admin = (await user("Admin")).id;
  await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  const ctx = await office();
  await savePayrollSettings(ctx, { pfEnabled: false, pfOnFullBasic: false, esiEnabled: false, ptState: "NONE", employerName: "ZZ TA Migration Trust", pfEstablishmentCode: "", esiEmployerCode: "" });
  const st = await saveStructure(ctx, { name: `ZZ TA Migration Faculty ${STAMP}`, components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }] });
  for (const who of ["One", "Two", "Three"]) {
    const m = await db.membership.create({ data: { userId: (await user(who)).id, schoolId: ids.school, role: "FACULTY", status: "ACTIVE" }, select: { id: true } });
    ids.staff.push(m.id);
    await saveSalary(ctx, { membershipId: m.id, structureId: st.id, effectiveFrom: "2026-04-01", basicPaise: ONE_CRORE_RUPEES, overrides: {}, pfUan: "", esiNumber: "", pan: "", bankAccount: `12345678901${ids.staff.length}`, bankIfsc: "SBIN0001234", bankName: "ZZ Bank", paymentMode: "BANK" });
  }
}, 90_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { userId: ids.admin } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { startsWith: "zz-tamig-pay-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-114: a month's payroll past 2,147,483,647 paise", () => {
  it("TA-114: is drafted, and the run's totals are the sum of its slips, answered as numbers", async () => {
    const run = await draftRun(await office(), MONTH);
    expect(run.slips).toHaveLength(3);
    const slipGross = run.slips!.reduce((a, s) => a + s.grossPaise, 0);
    expect(slipGross).toBe(3 * ONE_CRORE_RUPEES);
    expect(slipGross).toBeGreaterThan(INT32_MAX);
    expect(run.totals).toEqual({ headcount: 3, grossPaise: slipGross, deductionsPaise: run.slips!.reduce((a, s) => a + s.deductionsPaise, 0), employerPaise: 0, netPaise: run.slips!.reduce((a, s) => a + s.netPaise, 0) });
    for (const value of Object.values(run.totals)) expect(typeof value).toBe("number");
    // What the door sends: the contract takes it, and JSON carries it (a bigint would throw here).
    expect(payrollRunSchema.parse(JSON.parse(JSON.stringify(run))).totals.grossPaise).toBe(slipGross);
    const stored = await db.payrollRun.findFirstOrThrow({ where: { schoolId: ids.school, month: MONTH }, select: { grossPaise: true, netPaise: true } });
    expect(stored.grossPaise).toBe(BigInt(slipGross));
  });

  it("TA-114: the run's door answers 200 with the totals in JSON", async () => {
    await office();
    const response = await runGet(new Request(`http://localhost/api/v1/admin/payroll/runs/${MONTH}`), { params: Promise.resolve({ month: MONTH }) });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { totals: { grossPaise: number } };
    expect(body.totals.grossPaise).toBe(3 * ONE_CRORE_RUPEES);
  });

  it("TA-114: is locked, and its bank advice is cut with a total past the old ceiling", async () => {
    const ctx = await office();
    const locked = await lockRun(ctx, MONTH);
    expect(locked.status).toBe("LOCKED");
    const bank = await payrollExport(ctx, MONTH, "BANK_ADVICE");
    expect(bank.rows).toBe(3);
    expect(bank.totalPaise).toBe(locked.totals.netPaise);
    expect(bank.totalPaise).toBeGreaterThan(INT32_MAX);
    const view = await runView(ctx, MONTH);
    const row = view.exports.find((e) => e.kind === "BANK_ADVICE")!;
    expect(row.totalPaise).toBe(bank.totalPaise);
    expect(typeof row.totalPaise).toBe("number");
    expect(() => JSON.stringify(view)).not.toThrow();
  });

  it("TA-114: the summary and the year's finance table read the totals as numbers", async () => {
    const summary = await payrollSummary(await office());
    const run = summary.runs.find((r) => r.month === MONTH)!;
    expect(run.grossPaise).toBe(3 * ONE_CRORE_RUPEES);
    expect(payrollSummarySchema.parse(JSON.parse(JSON.stringify(summary))).runs[0]!.grossPaise).toBe(3 * ONE_CRORE_RUPEES);
    const { years } = await financeTable(ids.school, 1);
    expect(years[0]!.salariesPaise).toBe(3 * ONE_CRORE_RUPEES);
    expect(typeof years[0]!.salariesPaise).toBe("number");
  });

  it("TA-114: a stored total past Number.MAX_SAFE_INTEGER is refused, never rounded", async () => {
    expect(safePaise(BigInt(3 * ONE_CRORE_RUPEES))).toBe(3 * ONE_CRORE_RUPEES);
    expect(safePaise(BigInt(Number.MAX_SAFE_INTEGER))).toBe(Number.MAX_SAFE_INTEGER);
    expect(safePaise(-5n)).toBe(-5);
    expect(() => safePaise(BigInt(Number.MAX_SAFE_INTEGER) + 2n)).toThrow(RangeError);
    expect(() => safePaise(-BigInt(Number.MAX_SAFE_INTEGER) - 2n)).toThrow(RangeError);
    expect(() => safePaise(2 ** 53 + 2)).toThrow(RangeError);
    expect(() => safePaise(1.5)).toThrow(RangeError);
    // A run whose stored gross no number can hold: the read is refused, not answered with a rounded figure.
    const before = await db.payrollRun.findFirstOrThrow({ where: { schoolId: ids.school, month: MONTH }, select: { id: true, grossPaise: true } });
    await db.payrollRun.update({ where: { id: before.id }, data: { grossPaise: BigInt(Number.MAX_SAFE_INTEGER) + 2n } });
    await expect(runView(await office(), MONTH)).rejects.toBeInstanceOf(RangeError);
    await db.payrollRun.update({ where: { id: before.id }, data: { grossPaise: before.grossPaise } });
    expect((await runView(await office(), MONTH)).totals.grossPaise).toBe(3 * ONE_CRORE_RUPEES);
  });

  it("TA-114: the five stored totals are 64-bit in the schema, and a slip's own figures stay as they were", () => {
    const type = (model: string, field: string) => Prisma.dmmf.datamodel.models.find((m) => m.name === model)!.fields.find((f) => f.name === field)!.type;
    expect(["grossPaise", "deductionsPaise", "employerPaise", "netPaise"].map((f) => type("PayrollRun", f))).toEqual(["BigInt", "BigInt", "BigInt", "BigInt"]);
    expect(type("PayrollExport", "totalPaise")).toBe("BigInt");
    expect(type("Payslip", "grossPaise")).toBe("Int");
  });
});
