/**
 * HR and payroll (the PAYROLL module, 3 October 2026).
 *
 * Two ZZ schools of this suite's own: Mint has PAYROLL on, Sage has it off.
 * What is proved: the statutory arithmetic against the coded rates (PF at
 * 12 % to the wage ceiling and its EPS share, ESI at 0.75 % / 3.25 % rounded
 * up to the rupee within the wage limit, Maharashtra PT by the men's and
 * women's slabs and February); loss of pay from the staff register and
 * approved unpaid leave; a run drafted, reviewed, locked — and then refusing
 * every change; its stored totals and digest; the files cut from it (ECR,
 * bank advice opening the sealed account into the file alone); the sealed
 * numbers never in an answer; the head reading slips only from a shared
 * run; a member of staff reading only their own; advances asked, recorded
 * and recovered from the locked slips; and MODULE_OFF where it is off.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ESI_RATES, PF_RATES } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { computeSlip, lopHalfDaysFor, professionalTax, slipDigest, totalsOf, financialYearOf, monthsOfFinancialYear, type SlipInput } from "@/lib/payroll-rules";
import { askAdvance, decideAdvance, draftRun, ecrShares, editSlip, lockRun, listSalaries, myPayslips, payrollExport, payrollSummary, payslipDocument, runView, saveSalary, saveStructure, shareRun, myStatement, savePayrollSettings } from "@/lib/payroll";
import { renderPayslipPdf } from "@/lib/payslip-pdf";
import { RuleRefusal } from "@/lib/rule-refusal";
import { AccessError } from "@/lib/access-error";
import { GET as summaryGet } from "@/app/api/v1/admin/payroll/route";
import { GET as salariesGet } from "@/app/api/v1/admin/payroll/salaries/route";
import { GET as mineGet } from "@/app/api/v1/account/payslips/route";
import { GET as runGet } from "@/app/api/v1/admin/payroll/runs/[month]/route";
import { POST as lockPost } from "@/app/api/v1/admin/payroll/runs/[month]/lock/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MONTH = "2026-09";
const ACCOUNT = "123456789012";
const PAN = "ABCDE1234F";
const ids = { mint: "", sage: "", admin: "", principal: "", teacher: "", teacher2: "", driver: "", sageAdmin: "", mTeacher: "", mTeacher2: "", mDriver: "", mAdmin: "", structure: "" };

const settings = { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH" as const };
const slip = (over: Partial<SlipInput>): SlipInput => ({
  month: "2026-09",
  daysInMonth: 30,
  lopHalfDays: 0,
  basicPaise: 1_500_000,
  components: [
    { code: "BASIC", label: "", formula: "FIXED", value: 0 },
    { code: "HRA", label: "", formula: "PERCENT_OF_BASIC", value: 4000 },
    { code: "PF_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
    { code: "PF_EMPLOYER", label: "", formula: "FIXED", value: 0 },
    { code: "ESI_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
    { code: "ESI_EMPLOYER", label: "", formula: "FIXED", value: 0 },
    { code: "PT", label: "", formula: "FIXED", value: 0 },
  ],
  overrides: {},
  settings,
  gender: "M",
  arrearsPaise: 0,
  tdsOverridePaise: null,
  advances: [],
  ...over,
});
const line = (s: ReturnType<typeof computeSlip>, code: string) => s.lines.find((l) => l.code === code);

async function as(userId: string, role: string, schoolId: string, route: string | null = null) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId, role: role as never });
  // With a route set, the session's gate runs on read: a door the school has off would throw here rather than in the handler under test.
  return route ? (null as never) : (await getSession())!;
}
const req = (path: string, body?: unknown) => new Request(`http://localhost${path}`, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ Payroll ${tag} ${STAMP}`, slug: `zz-pay-${tag.toLowerCase()}-${STAMP}`, code: `ZPY${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-pay-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.mint = (await mk("Mint")).id;
  ids.sage = (await mk("Sage")).id;
  await db.schoolModule.create({ data: { schoolId: ids.mint, module: "PAYROLL" } });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Pay ${who}`, email: `zz-pay-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, p, t, t2, d, sa] = await Promise.all([user("Admin"), user("Principal"), user("Teacher"), user("TeacherTwo"), user("Driver"), user("SageAdmin")]);
  Object.assign(ids, { admin: a.id, principal: p.id, teacher: t.id, teacher2: t2.id, driver: d.id, sageAdmin: sa.id });
  const mem = (userId: string, schoolId: string, role: string) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } });
  ids.mAdmin = (await mem(a.id, ids.mint, "ADMIN")).id;
  await mem(p.id, ids.mint, "PRINCIPAL");
  ids.mTeacher = (await mem(t.id, ids.mint, "TEACHER")).id;
  ids.mTeacher2 = (await mem(t2.id, ids.mint, "TEACHER")).id;
  ids.mDriver = (await mem(d.id, ids.mint, "DRIVER")).id;
  await mem(sa.id, ids.sage, "ADMIN");
  await db.staffRecord.create({ data: { schoolId: ids.mint, membershipId: ids.mTeacher, gender: "F", designation: "TGT Science" } });
  // The register for September: two days of unpaid leave, an absence, a half day, and an absence covered by approved casual leave.
  await db.leaveRequest.createMany({
    data: [
      { schoolId: ids.mint, teacherMembershipId: ids.mTeacher, fromDateKey: "2026-09-14", toDateKey: "2026-09-15", kind: "UNPAID", reason: "ZZ", status: "APPROVED" },
      { schoolId: ids.mint, teacherMembershipId: ids.mTeacher, fromDateKey: "2026-09-21", toDateKey: "2026-09-21", kind: "CASUAL", reason: "ZZ", status: "APPROVED" },
    ],
  });
  await db.staffAttendance.createMany({
    data: [
      { schoolId: ids.mint, membershipId: ids.mTeacher, dateKey: "2026-09-17", status: "ABSENT" },
      { schoolId: ids.mint, membershipId: ids.mTeacher, dateKey: "2026-09-18", status: "HALF_DAY" },
      { schoolId: ids.mint, membershipId: ids.mTeacher, dateKey: "2026-09-21", status: "ABSENT" },
      // A Sunday off is no loss of pay.
      { schoolId: ids.mint, membershipId: ids.mTeacher, dateKey: "2026-09-20", status: "ABSENT" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [ids.mint, ids.sage] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the statutory arithmetic, against the coded rates", () => {
  const pf = PF_RATES[0];
  const esi = ESI_RATES[0];

  it("PF is 12 % of basic + DA to the ₹15,000 ceiling, the employer's 8.33 % of it to the pension", () => {
    const s = computeSlip(slip({}));
    expect(line(s, "PF_EMPLOYEE")!.paise).toBe((1_500_000 * pf.employeeBp) / 10_000); // ₹1,800
    expect(line(s, "PF_EMPLOYER")!.paise).toBe(180_000);
    expect(line(s, "PF_EMPLOYER")!.epsPaise).toBe(Math.round((1_500_000 * pf.epsBp) / 10_000)); // ₹1,249.50
    // Above the ceiling, the wage stops at it; contributing on the whole is the school's choice.
    const high = computeSlip(slip({ basicPaise: 3_000_000 }));
    expect(line(high, "PF_EMPLOYEE")!.paise).toBe(180_000);
    expect(line(high, "PF_EMPLOYEE")!.basePaise).toBe(pf.wageCeilingPaise);
    const full = computeSlip(slip({ basicPaise: 3_000_000, settings: { ...settings, pfOnFullBasic: true } }));
    expect(line(full, "PF_EMPLOYEE")!.paise).toBe(360_000);
    // The pension share stays on the ceiling whatever the school contributes on.
    expect(line(full, "PF_EMPLOYER")!.epsPaise).toBe(124_950);
  });

  it("QA-08: the ECR's employer columns add up to the employer's share: EPS rounded first, the difference what is left", () => {
    // ₹15,000 EPF wages: EE ₹1,800, EPS ₹1,249.50 → ₹1,250, the difference ₹550 (it was ₹551, the columns adding to ₹1,801).
    const s = computeSlip(slip({}));
    expect(ecrShares(line(s, "PF_EMPLOYEE")!, line(s, "PF_EMPLOYER"))).toEqual({ epfWage: 15_000, epsWage: 15_000, ee: 1_800, eps: 1_250, diff: 550 });
    // On the whole basic: the employer pays ₹3,600, the pension stays ₹1,250 on the ceiling, the difference ₹2,350.
    const full = computeSlip(slip({ basicPaise: 3_000_000, settings: { ...settings, pfOnFullBasic: true } }));
    expect(ecrShares(line(full, "PF_EMPLOYEE")!, line(full, "PF_EMPLOYER"))).toMatchObject({ ee: 3_600, eps: 1_250, diff: 2_350 });
    // Every wage from ₹100 to ₹15,000 a rupee at a time: EPS + difference is always the employer's rounded share.
    for (let wage = 10_000; wage <= 1_500_000; wage += 100) {
      const w = computeSlip(slip({ basicPaise: wage }));
      const er = line(w, "PF_EMPLOYER")!;
      const c = ecrShares(line(w, "PF_EMPLOYEE")!, er);
      if (c.eps + c.diff !== Math.round(er.paise / 100)) throw new Error(`wage ${wage / 100}: ${c.eps} + ${c.diff} ≠ ${Math.round(er.paise / 100)}`);
    }
  });

  it("ESI is 0.75 % and 3.25 % of the gross, each rounded up to the rupee, while the gross is within ₹21,000", () => {
    // Basic 15,000 + HRA 40 % = 21,000: just within the limit.
    const s = computeSlip(slip({}));
    expect(s.grossPaise).toBe(2_100_000);
    expect(s.grossPaise).toBeLessThanOrEqual(esi.wageLimitPaise);
    expect(line(s, "ESI_EMPLOYEE")!.paise).toBe(15_800); // 157.50 → 158
    expect(line(s, "ESI_EMPLOYER")!.paise).toBe(68_300); // 682.50 → 683
    const over = computeSlip(slip({ basicPaise: 1_600_000 }));
    expect(line(over, "ESI_EMPLOYEE")).toBeUndefined();
    expect(line(over, "ESI_EMPLOYER")).toBeUndefined();
  });

  it("Maharashtra PT by the men's and women's slabs, ₹300 in February", () => {
    expect(professionalTax(750_000, "MH", "M", "2026-09")).toBe(0);
    expect(professionalTax(900_000, "MH", "M", "2026-09")).toBe(17_500);
    expect(professionalTax(2_100_000, "MH", "M", "2026-09")).toBe(20_000);
    expect(professionalTax(2_100_000, "MH", "M", "2027-02")).toBe(30_000);
    expect(professionalTax(2_100_000, "MH", "F", "2026-09")).toBe(0);
    expect(professionalTax(3_000_000, "MH", "F", "2026-09")).toBe(20_000);
    expect(professionalTax(3_000_000, "NONE", "M", "2026-09")).toBe(0);
  });

  it("earnings are cut for the days without pay, fixed deductions are not, and net is gross − deductions", () => {
    const s = computeSlip(slip({ lopHalfDays: 6 })); // three days of thirty
    expect(line(s, "BASIC")!.paise).toBe(Math.round((1_500_000 * 54) / 60));
    expect(line(s, "BASIC")!.fullPaise).toBe(1_500_000);
    expect(s.netPaise).toBe(s.grossPaise - s.deductionsPaise);
    expect(totalsOf(s.lines)).toEqual({ grossPaise: s.grossPaise, deductionsPaise: s.deductionsPaise, employerPaise: s.employerPaise, netPaise: s.netPaise });
  });

  it("an advance's instalment never takes the net below nothing", () => {
    const s = computeSlip(slip({ advances: [{ id: "a1", instalmentPaise: 10_000_000 }] }));
    expect(s.netPaise).toBe(0);
    expect(line(s, "ADVANCE")!.paise).toBe(s.grossPaise - s.deductionsPaise + line(s, "ADVANCE")!.paise);
  });

  it("loss of pay, day by day: unpaid leave and unexcused absence lose pay; paid leave, Sundays and unmarked days do not", () => {
    const d = (over: Partial<Parameters<typeof lopHalfDaysFor>[0][number]>) => ({ employed: true, working: true, status: null, leaveKind: null, ...over });
    expect(lopHalfDaysFor([d({ status: "ABSENT" })])).toBe(2);
    expect(lopHalfDaysFor([d({ status: "ABSENT", leaveKind: "CASUAL" })])).toBe(0);
    expect(lopHalfDaysFor([d({ status: "ABSENT", leaveKind: "UNPAID" })])).toBe(2);
    expect(lopHalfDaysFor([d({ status: "HALF_DAY" })])).toBe(1);
    expect(lopHalfDaysFor([d({ leaveKind: "UNPAID" })])).toBe(2);
    expect(lopHalfDaysFor([d({ status: "ON_LEAVE", leaveKind: "SICK" })])).toBe(0);
    expect(lopHalfDaysFor([d({ status: "PRESENT", leaveKind: "UNPAID" })])).toBe(0);
    expect(lopHalfDaysFor([d({ working: false, status: "ABSENT" })])).toBe(0);
    expect(lopHalfDaysFor([d({ employed: false, working: false })])).toBe(2);
    expect(lopHalfDaysFor([d({})])).toBe(0);
  });

  it("financial years run April to March", () => {
    expect(financialYearOf("2026-04")).toBe("2026-27");
    expect(financialYearOf("2027-03")).toBe("2026-27");
    expect(monthsOfFinancialYear("2026-27")[0]).toBe("2026-04");
    expect(monthsOfFinancialYear("2026-27")[11]).toBe("2027-03");
  });
});

describe("a month's run", () => {
  it("is refused at a school with the module off, as MODULE_OFF at the API", async () => {
    await as(ids.sageAdmin, "ADMIN", ids.sage, "GET /api/v1/admin/payroll");
    const res = await summaryGet();
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("MODULE_OFF");
    const ctx = await as(ids.sageAdmin, "ADMIN", ids.sage);
    await expect(payrollSummary(ctx)).rejects.toMatchObject({ code: "MODULE_OFF" });
  });

  it("sets up a structure and salaries, sealing the PAN and bank account", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.mint);
    await savePayrollSettings(ctx, { ...settings, employerName: "ZZ Mint Trust", pfEstablishmentCode: "MHBAN0000001000", esiEmployerCode: "31000000000000001" });
    const st = await saveStructure(ctx, {
      name: "ZZ Teaching",
      components: [
        { code: "BASIC", label: "", formula: "FIXED", value: 0 },
        { code: "HRA", label: "", formula: "PERCENT_OF_BASIC", value: 4000 },
        { code: "PF_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
        { code: "PF_EMPLOYER", label: "", formula: "FIXED", value: 0 },
        { code: "ESI_EMPLOYEE", label: "", formula: "FIXED", value: 0 },
        { code: "ESI_EMPLOYER", label: "", formula: "FIXED", value: 0 },
        { code: "PT", label: "", formula: "FIXED", value: 0 },
        { code: "TDS", label: "", formula: "FIXED", value: 0 },
      ],
    });
    ids.structure = st.id;
    // An earning that is a share of the gross it is part of is refused.
    await expect(saveStructure(ctx, { name: "ZZ Bad", components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }, { code: "HRA", label: "", formula: "PERCENT_OF_GROSS", value: 1000 }] })).rejects.toBeInstanceOf(RuleRefusal);
    const saved = await saveSalary(ctx, { membershipId: ids.mTeacher, structureId: st.id, effectiveFrom: "2026-04-01", basicPaise: 1_500_000, overrides: {}, pfUan: "100200300400", esiNumber: "3100123456", pan: PAN, bankAccount: ACCOUNT, bankIfsc: "SBIN0001234", bankName: "ZZ Bank", paymentMode: "BANK" });
    expect(saved.salary?.bankLast4).toBe("9012");
    expect(saved.salary?.panLast4).toBe("234F");
    await saveSalary(ctx, { membershipId: ids.mTeacher2, structureId: st.id, effectiveFrom: "2026-04-01", basicPaise: 3_000_000, overrides: { HRA: 500_000 }, pfUan: "", esiNumber: "", pan: "", bankAccount: "", bankIfsc: "", bankName: "", paymentMode: "CASH" });
    const row = await db.staffSalary.findFirstOrThrow({ where: { membershipId: ids.mTeacher } });
    expect(row.bankAccountSealed).not.toContain(ACCOUNT);
    expect(row.panSealed).not.toContain(PAN);
  });

  it("never answers a sealed number: the salaries list, the API and the person's own page show the last four only", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.mint);
    const list = JSON.stringify(await listSalaries(ctx));
    expect(list).not.toContain(ACCOUNT);
    expect(list).not.toContain(PAN);
    await as(ids.admin, "ADMIN", ids.mint, "GET /api/v1/admin/payroll/salaries");
    const res = await salariesGet();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain(ACCOUNT);
    expect(text).not.toContain(PAN);
    expect(text).toContain("9012");
  });

  it("drafts September from the register and the leave: 3.5 days without pay for the teacher, totals the sum of the slips", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.mint);
    const run = await draftRun(ctx, MONTH);
    expect(run.status).toBe("DRAFT");
    expect(run.slips).toHaveLength(2);
    // The driver has no salary: named, not paid.
    expect(run.missingSalary.map((m) => m.membershipId)).toContain(ids.mDriver);
    const mine = run.slips!.find((s) => s.membershipId === ids.mTeacher)!;
    expect(mine.lopDays).toBe(3.5);
    expect(mine.paidDays).toBe(26.5);
    expect(mine.lines.find((l) => l.code === "BASIC")!.paise).toBe(Math.round((1_500_000 * 53) / 60));
    // She is a woman with a gross under ₹25,000: no PT.
    expect(mine.lines.find((l) => l.code === "PT")).toBeUndefined();
    for (const s of run.slips!) expect(s.netPaise).toBe(s.grossPaise - s.deductionsPaise);
    expect(run.totals.grossPaise).toBe(run.slips!.reduce((a, s) => a + s.grossPaise, 0));
    expect(run.totals.netPaise).toBe(run.slips!.reduce((a, s) => a + s.netPaise, 0));
    expect(run.totals.headcount).toBe(2);
    const other = run.slips!.find((s) => s.membershipId === ids.mTeacher2)!;
    expect(other.lines.find((l) => l.code === "HRA")!.fullPaise).toBe(500_000);
    expect(other.lines.find((l) => l.code === "PT")!.paise).toBe(20_000);
    expect(other.warnings).toContain("NO_UAN");
  });

  it("takes the office's review — arrears, the month's TDS — and keeps it when drawn again", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.mint);
    const edited = await editSlip(ctx, MONTH, ids.mTeacher2, { arrearsPaise: 100_000, tdsOverridePaise: 250_000, notes: "ZZ arrears for August" });
    expect(edited.lines.find((l) => l.code === "ARREARS")!.paise).toBe(100_000);
    expect(edited.lines.find((l) => l.code === "TDS")!.paise).toBe(250_000);
    const again = await draftRun(ctx, MONTH);
    const slip2 = again.slips!.find((s) => s.membershipId === ids.mTeacher2)!;
    expect(slip2.arrearsPaise).toBe(100_000);
    expect(slip2.tdsOverridePaise).toBe(250_000);
    expect(slip2.notes).toBe("ZZ arrears for August");
  });

  it("shows the head the totals but no slip until the office shares the run", async () => {
    const head = await as(ids.principal, "PRINCIPAL", ids.mint);
    const run = await runView(head, MONTH);
    expect(run.slips).toBeNull();
    expect(run.totals.headcount).toBe(2);
    await expect(payslipDocument(head, MONTH, ids.mTeacher)).rejects.toBeInstanceOf(AccessError);
    const admin = await as(ids.admin, "ADMIN", ids.mint);
    await shareRun(admin, MONTH, true);
    const head2 = await as(ids.principal, "PRINCIPAL", ids.mint);
    expect((await runView(head2, MONTH)).slips).toHaveLength(2);
    // The head never drafts or edits.
    await expect(draftRun(head2, MONTH)).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses the files before the lock, locks with a digest of the slips, and then refuses every change", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.mint);
    await expect(payrollExport(ctx, MONTH, "PF_ECR")).rejects.toMatchObject({ status: 409 });
    await as(ids.admin, "ADMIN", ids.mint, `POST /api/v1/admin/payroll/runs/${MONTH}/lock`);
    expect((await lockPost(req(`/api/v1/admin/payroll/runs/${MONTH}/lock`, {}), { params: Promise.resolve({ month: MONTH }) })).status).toBe(422);
    const res = await lockPost(req(`/api/v1/admin/payroll/runs/${MONTH}/lock`, { confirm: true }), { params: Promise.resolve({ month: MONTH }) });
    expect(res.status).toBe(200);
    const run = await db.payrollRun.findFirstOrThrow({ where: { schoolId: ids.mint, month: MONTH } });
    expect(run.status).toBe("LOCKED");
    const slips = await db.payslip.findMany({ where: { runId: run.id } });
    expect(run.lockDigest).toBe(slipDigest(slips));
    const ctx2 = await as(ids.admin, "ADMIN", ids.mint);
    await expect(editSlip(ctx2, MONTH, ids.mTeacher, { notes: "ZZ late" })).rejects.toMatchObject({ key: "payroll.refuseLocked", status: 409 });
    await expect(draftRun(ctx2, MONTH)).rejects.toMatchObject({ key: "payroll.refuseLocked" });
    await expect(lockRun(ctx2, MONTH)).rejects.toMatchObject({ key: "payroll.refuseLocked" });
    // Nothing moved: the digest still holds.
    expect(slipDigest(await db.payslip.findMany({ where: { runId: run.id } }))).toBe(run.lockDigest);
    // Each person was told.
    expect(await db.notification.count({ where: { userId: ids.teacher, kind: "SYSTEM" } })).toBeGreaterThan(0);
  });

  it("cuts the ECR in EPFO's #~# lines, and the bank advice with the sealed account opened into the file alone, each recorded and audited", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.mint);
    const ecr = await payrollExport(ctx, MONTH, "PF_ECR");
    const lines = ecr.content.trim().split("\n");
    expect(lines).toHaveLength(1); // the other teacher has no UAN
    const f = lines[0]!.split("#~#");
    expect(f).toHaveLength(11);
    expect(f[0]).toBe("100200300400");
    expect(f[1]).toBe(`ZZ PAY TEACHER`);
    // EPF wages are the earned basic; EE share 12 % of it, EPS 8.33 %, the difference the rest of the employer's 12 %.
    const epf = Number(f[3]);
    expect(Number(f[6])).toBe(Math.round(epf * 0.12));
    expect(Number(f[7]) + Number(f[8])).toBe(Number(f[6]));
    expect(f[9]).toBe("4"); // 3.5 NCP days, rounded
    // The return's total is what its lines remit (QA-08).
    expect(ecr.totalPaise).toBe((Number(f[6]) + Number(f[7]) + Number(f[8])) * 100);
    const bank = await payrollExport(ctx, MONTH, "BANK_ADVICE");
    expect(bank.content).toContain(ACCOUNT);
    expect(bank.rows).toBe(1); // the other is paid in cash
    const tds = await payrollExport(ctx, MONTH, "TDS_SUMMARY");
    expect(tds.rows).toBe(1);
    const rows = await db.payrollExport.findMany({ where: { schoolId: ids.mint }, orderBy: { createdAt: "asc" } });
    expect(rows.map((r) => r.kind)).toEqual(["PF_ECR", "BANK_ADVICE", "TDS_SUMMARY"]);
    expect(rows.every((r) => /^[0-9a-f]{64}$/.test(r.sha256))).toBe(true);
    const audits = await db.auditLog.findMany({ where: { schoolId: ids.mint, action: { in: ["payroll.export", "payroll.export.sealed"] } }, select: { action: true, meta: true } });
    expect(audits.filter((a) => a.action === "payroll.export.sealed")).toHaveLength(2);
    // The audit row never carries the number.
    expect(JSON.stringify(audits)).not.toContain(ACCOUNT);
  });

  it("lets a member of staff read their own slips, structure and PDF, never another's", async () => {
    await as(ids.teacher, "TEACHER", ids.mint, "GET /api/v1/account/payslips");
    const res = await mineGet();
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).not.toContain(ACCOUNT);
    const me = await as(ids.teacher, "TEACHER", ids.mint);
    const mine = await myPayslips(me);
    expect(mine.slips.map((s) => s.month)).toEqual([MONTH]);
    expect(mine.structure?.name).toBe("ZZ Teaching");
    const doc = await payslipDocument(me, MONTH, "self");
    expect(doc.slip.membershipId).toBe(ids.mTeacher);
    const pdf = await renderPayslipPdf(doc);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    // The admin's door to a slip is not the teacher's.
    await expect(payslipDocument(me, MONTH, ids.mTeacher2)).rejects.toBeInstanceOf(AccessError);
    await as(ids.teacher, "TEACHER", ids.mint, `GET /api/v1/admin/payroll/runs/${MONTH}`);
    expect((await runGet(req(`/api/v1/admin/payroll/runs/${MONTH}`), { params: Promise.resolve({ month: MONTH }) })).status).toBe(403);
    const st = await myStatement(me, "2026-27");
    expect(st.months).toHaveLength(1);
    expect(st.netPaise).toBe(mine.slips[0]!.netPaise);
  });

  it("takes an advance asked, recorded with an instalment, and recovers it from the next run; what is back is read from the locked slips", async () => {
    const me = await as(ids.teacher2, "TEACHER", ids.mint);
    const ask = await askAdvance(me, { amountPaise: 500_000, reason: "ZZ a family wedding" });
    await expect(askAdvance(me, { amountPaise: 100_000, reason: "ZZ again" })).rejects.toMatchObject({ key: "payroll.refuseAdvanceWaiting" });
    const admin = await as(ids.admin, "ADMIN", ids.mint);
    await expect(decideAdvance(admin, { advanceId: ask.id, decision: "RECORD", monthlyRecoveryPaise: 900_000, note: "" })).rejects.toMatchObject({ key: "payroll.refuseInstalment" });
    const rec = await decideAdvance(admin, { advanceId: ask.id, decision: "RECORD", monthlyRecoveryPaise: 200_000, note: "" });
    expect(rec.status).toBe("RECORDED");
    expect(rec.outstandingPaise).toBe(500_000);
    const oct = await draftRun(admin, "2026-10");
    const s = oct.slips!.find((x) => x.membershipId === ids.mTeacher2)!;
    expect(s.lines.find((l) => l.code === "ADVANCE")).toMatchObject({ paise: 200_000, advanceId: ask.id });
    // Not yet back: October is a draft.
    const mine = await myPayslips(await as(ids.teacher2, "TEACHER", ids.mint));
    expect(mine.advances[0]!.recoveredPaise).toBe(0);
    await lockRun(await as(ids.admin, "ADMIN", ids.mint), "2026-10");
    const after = await myPayslips(await as(ids.teacher2, "TEACHER", ids.mint));
    expect(after.advances[0]!.recoveredPaise).toBe(200_000);
    expect(after.advances[0]!.outstandingPaise).toBe(300_000);
  });

  it("refuses a month that has not begun", async () => {
    const admin = await as(ids.admin, "ADMIN", ids.mint);
    await expect(draftRun(admin, "2099-01")).rejects.toMatchObject({ key: "payroll.refuseFutureMonth" });
  });
});
