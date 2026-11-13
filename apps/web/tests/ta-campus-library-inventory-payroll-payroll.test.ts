/**
 * Payroll's findings of the testing analysis of 13 November 2026 (batch campus-library-inventory-payroll).
 *
 * TA-292: ESI cover was decided on the month's earned gross, so unpaid leave switched it on and arrears switched it
 * off. TA-290: a first salary saved with the PAN box blank stayed without the PAN the faculty record already held.
 * TA-047: the slip froze the name a member of staff chose for screens, and the ECR, the bank advice and the TDS
 * summary printed it. TA-428: a line break in a name split that member's ECR line in two. TA-042: two months drafted
 * before either was locked each took the same instalment of an advance, and locking both took back more than was
 * lent. TA-043: a recorded advance could not be cancelled, and a second press recorded it twice.
 *
 * One scratch ZZ school of this suite's own with PAYROLL on and four members of staff; removed afterwards. The
 * months drafted are August to November 2026 (no month after today's may be drafted).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { computeSlip, type SlipInput } from "@/lib/payroll-rules";
import { cancelAdvance, draftRun, lockRun, payrollExport, recordAdvance, saveSalary, saveStructure, savePayrollSettings } from "@/lib/payroll";
import { openPan, writePan } from "@/lib/pan";
import { POST as cancelPost } from "@/app/api/v1/admin/payroll/advances/cancel/route";
import type { PayslipLine } from "@edulink/contracts";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const PAN = "ABCDE1234F";
const ids = { school: "", admin: "", adminM: "", t1: "", m1: "", t2: "", m2: "", t3: "", m3: "", structure: "", advance1: "" };

async function office() {
  __resetCookies();
  __setHeaders({});
  await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
  return (await getSession())!;
}
const advanceLines = async (month: string, membershipId: string) => {
  const slip = await db.payslip.findFirstOrThrow({ where: { membershipId, run: { schoolId: ids.school, month } }, select: { linesJson: true } });
  return (JSON.parse(slip.linesJson) as PayslipLine[]).filter((l) => l.code === "ADVANCE");
};

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Payroll ${STAMP}`, slug: `zz-ta-payroll-${STAMP}`, code: `ZTP${SUFFIX}`, contactEmail: `zz-ta-payroll-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "PAYROLL" } });
  const user = (who: string, extra: { name?: string; preferredName?: string } = {}) => db.user.create({ data: { name: extra.name ?? `ZZ TA Pay ${who}`, preferredName: extra.preferredName ?? null, email: `zz-ta-pay-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, t1, t2, t3] = await Promise.all([user("Admin"), user("Anuradha", { name: "ZZ Anuradha Kulkarni", preferredName: "Anu Miss" }), user("Break", { name: "ZZ Line\nBreak" }), user("Faculty")]);
  Object.assign(ids, { admin: admin.id, t1: t1.id, t2: t2.id, t3: t3.id });
  const mem = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } });
  ids.adminM = (await mem(admin.id, "ADMIN")).id;
  ids.m1 = (await mem(t1.id, "TEACHER")).id;
  ids.m2 = (await mem(t2.id, "TEACHER")).id;
  ids.m3 = (await mem(t3.id, "TEACHER")).id;
  const ctx = await office();
  await savePayrollSettings(ctx, { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH", employerName: "ZZ TA Trust", pfEstablishmentCode: "MHBAN0000001000", esiEmployerCode: "31000000000000001" });
  const st = await saveStructure(ctx, {
    name: `ZZ TA Teaching ${STAMP}`,
    components: [
      { code: "BASIC", label: "", formula: "FIXED", value: 0 },
      { code: "PF_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
      { code: "PF_EMPLOYER", label: "", formula: "FIXED", value: 0 },
      { code: "TDS", label: "", formula: "FIXED", value: 0 },
    ],
  });
  ids.structure = st.id;
  await saveSalary(ctx, { membershipId: ids.m1, structureId: st.id, effectiveFrom: "2026-04-01", basicPaise: 1_500_000, overrides: {}, pfUan: "100200300401", esiNumber: "", pan: PAN, bankAccount: "123456789012", bankIfsc: "SBIN0001234", bankName: "ZZ Bank", paymentMode: "BANK" });
  await saveSalary(ctx, { membershipId: ids.m2, structureId: st.id, effectiveFrom: "2026-04-01", basicPaise: 1_200_000, overrides: {}, pfUan: "100200300402", esiNumber: "", pan: "", bankAccount: "", bankIfsc: "", bankName: "", paymentMode: "CASH" });
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { userId: ids.admin } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-292: ESI cover on the month's rate of wages", () => {
  const base = (over: Partial<SlipInput>): SlipInput => ({
    month: "2026-09",
    daysInMonth: 30,
    lopHalfDays: 0,
    basicPaise: 2_400_000,
    components: [
      { code: "BASIC", label: "", formula: "FIXED", value: 0 },
      { code: "ESI_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
      { code: "ESI_EMPLOYER", label: "", formula: "FIXED", value: 0 },
    ],
    overrides: {},
    settings: { pfEnabled: false, pfOnFullBasic: false, esiEnabled: true, ptState: "NONE" },
    gender: "M",
    arrearsPaise: 0,
    tdsOverridePaise: null,
    advances: [],
    ...over,
  });
  const esi = (s: ReturnType<typeof computeSlip>) => s.lines.filter((l) => l.code === "ESI_EMPLOYEE" || l.code === "ESI_EMPLOYER");

  it("TA-292: ₹24,000 a month with six unpaid days (₹19,200 earned) is not covered; ₹20,000 with ₹2,000 arrears stays covered", () => {
    const leave = computeSlip(base({ lopHalfDays: 12 }));
    expect(leave.grossPaise).toBe(1_920_000);
    expect(esi(leave)).toEqual([]);
    const arrears = computeSlip(base({ basicPaise: 2_000_000, arrearsPaise: 200_000 }));
    expect(arrears.grossPaise).toBe(2_200_000);
    const lines = esi(arrears);
    expect(lines.map((l) => l.code).sort()).toEqual(["ESI_EMPLOYEE", "ESI_EMPLOYER"]);
    // Worked on what was earned that month, the arrears included.
    expect(lines.find((l) => l.code === "ESI_EMPLOYEE")!.basePaise).toBe(2_200_000);
  });
});

describe("TA-290: a first salary saved with the PAN box blank", () => {
  it("TA-290: takes the PAN the faculty record already holds, opening to the same number", async () => {
    await db.facultyRecord.create({ data: { schoolId: ids.school, membershipId: ids.m3, designation: "ASSISTANT_PROFESSOR", appointment: "REGULAR", highestQualification: "PHD" } });
    await writePan({ kind: "STAFF", schoolId: ids.school, membershipId: ids.m3 }, "PQRST6789K");
    const saved = await saveSalary(await office(), { membershipId: ids.m3, structureId: ids.structure, effectiveFrom: "2026-04-01", basicPaise: 1_000_000, overrides: {}, pfUan: "", esiNumber: "", pan: "", bankAccount: "", bankIfsc: "", bankName: "", paymentMode: "CASH" });
    expect(saved.salary?.panLast4).toBe("789K");
    const row = await db.staffSalary.findFirstOrThrow({ where: { membershipId: ids.m3 }, select: { panSealed: true } });
    expect(openPan({ kind: "STAFF", schoolId: ids.school, membershipId: ids.m3 }, "SALARY", row.panSealed)).toBe("PQRST6789K");
  });
});

describe("TA-047 and TA-428: the names the slip freezes and the files print", () => {
  it("TA-047: the slip, the ECR and the bank advice carry the account's own name, not the preferred name", async () => {
    const ctx = await office();
    await draftRun(ctx, "2026-08");
    await lockRun(ctx, "2026-08");
    const slip = await db.payslip.findFirstOrThrow({ where: { membershipId: ids.m1, run: { schoolId: ids.school, month: "2026-08" } }, select: { staffName: true } });
    expect(slip.staffName).toBe("ZZ Anuradha Kulkarni");
    const ecr = await payrollExport(ctx, "2026-08", "PF_ECR");
    expect(ecr.content).toContain("100200300401#~#ZZ ANURADHA KULKARNI#~#");
    expect(ecr.content).not.toContain("ANU MISS");
    const bank = await payrollExport(ctx, "2026-08", "BANK_ADVICE");
    expect(bank.content).toContain("ZZ Anuradha Kulkarni");
    expect(bank.content).not.toContain("Anu Miss");
  });

  it("TA-428: a line break in a name leaves one ECR line of eleven fields per member", async () => {
    const ecr = await payrollExport(await office(), "2026-08", "PF_ECR");
    const lines = ecr.content.split("\n").filter(Boolean);
    expect(lines).toHaveLength(ecr.rows);
    for (const l of lines) expect(l.split("#~#")).toHaveLength(11);
    expect(lines.find((l) => l.startsWith("100200300402#~#"))).toContain("#~#ZZ LINE BREAK#~#");
  });
});

describe("TA-042: two draft runs open together and one advance", () => {
  it("TA-042: the second lock is refused until its run is drawn afresh, and what is taken back adds to no more than was lent", async () => {
    const ctx = await office();
    const adv = await recordAdvance(ctx, { membershipId: ids.m1, amountPaise: 500_000, monthlyRecoveryPaise: 300_000, reason: "ZZ TA-042" });
    ids.advance1 = adv.id;
    await db.staffAdvance.update({ where: { id: adv.id }, data: { decidedAt: new Date("2026-08-20T00:00:00Z") } });
    await draftRun(ctx, "2026-09");
    await draftRun(ctx, "2026-10");
    expect((await advanceLines("2026-09", ids.m1)).map((l) => l.paise)).toEqual([300_000]);
    expect((await advanceLines("2026-10", ids.m1)).map((l) => l.paise)).toEqual([300_000]);
    await lockRun(ctx, "2026-09");
    await expect(lockRun(ctx, "2026-10")).rejects.toMatchObject({ message: "payroll.refuseAdvanceRedraw" });
    expect((await db.payrollRun.findFirstOrThrow({ where: { schoolId: ids.school, month: "2026-10" }, select: { status: true } })).status).toBe("DRAFT");
    await draftRun(ctx, "2026-10");
    expect((await advanceLines("2026-10", ids.m1)).map((l) => l.paise)).toEqual([200_000]);
    await lockRun(ctx, "2026-10");
    const frozen = await db.payslip.findMany({ where: { membershipId: ids.m1, run: { schoolId: ids.school, status: { in: ["LOCKED", "PAID"] } } }, select: { linesJson: true } });
    const taken = frozen.flatMap((s) => JSON.parse(s.linesJson) as PayslipLine[]).filter((l) => l.code === "ADVANCE" && l.advanceId === adv.id).reduce((a, l) => a + l.paise, 0);
    expect(taken).toBe(500_000);
  });
});

describe("TA-043: a recorded advance cancelled, and a second press", () => {
  it("TA-043: two presses of one form record one advance", async () => {
    const ctx = await office();
    const input = { membershipId: ids.m2, amountPaise: 400_000, monthlyRecoveryPaise: 100_000, reason: "ZZ TA-043 typed twice" };
    const [a, b] = await Promise.all([recordAdvance(ctx, input), recordAdvance(ctx, input)]);
    expect(a.id).toBe(b.id);
    expect(await db.staffAdvance.count({ where: { schoolId: ids.school, membershipId: ids.m2 } })).toBe(1);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "payroll.advance.record", targetId: a.id } })).toBe(1);
  });

  it("TA-043: the office cancels it; a draft that already took its instalment refuses the lock, and drawn afresh takes nothing for it", async () => {
    const ctx = await office();
    const adv = await db.staffAdvance.findFirstOrThrow({ where: { schoolId: ids.school, membershipId: ids.m2 }, select: { id: true } });
    await db.staffAdvance.update({ where: { id: adv.id }, data: { decidedAt: new Date("2026-10-20T00:00:00Z") } });
    await draftRun(ctx, "2026-11");
    expect((await advanceLines("2026-11", ids.m2)).map((l) => l.advanceId)).toEqual([adv.id]);
    // The door: an empty body is refused, a reason cancels it.
    const door = (body: unknown) => cancelPost(new Request("http://localhost/api/v1/admin/payroll/advances/cancel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
    expect((await door({})).status).toBe(422);
    const res = await door({ advanceId: adv.id, note: "ZZ the wrong person" });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { status: string }).status).toBe("CANCELLED");
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "payroll.advance.cancel", targetId: adv.id } })).toBe(1);
    await expect(lockRun(ctx, "2026-11")).rejects.toMatchObject({ message: "payroll.refuseAdvanceRedraw" });
    await draftRun(ctx, "2026-11");
    expect(await advanceLines("2026-11", ids.m2)).toEqual([]);
    // A second cancel finds it no longer recorded; an advance partly taken back on a locked slip is not cancelled.
    await expect(cancelAdvance(ctx, { advanceId: adv.id, note: "ZZ again" })).rejects.toMatchObject({ message: "payroll.refuseAdvanceNotRecorded" });
    await expect(cancelAdvance(ctx, { advanceId: ids.advance1, note: "ZZ forgive" })).rejects.toMatchObject({ message: "payroll.refuseAdvanceRecovered" });
  });
});
