/**
 * TA-407, the owner's decision of 14 November 2026 (option 1): own pay is refused where a second person exists.
 *
 * An ADMIN or ACCOUNTS clerk cannot save their own salary, edit their own slip or record or decide their own advance
 * while the school has another person who can write payroll; in a one-person office the write goes ahead and the head
 * is told of it. Whatever the case, the member of staff is told when their bank account or UPI id (masked) or their
 * salary changes, the head is told at every lock with the run's totals, and the audit carries the amounts before and
 * after.
 *
 * Two scratch ZZ schools of this suite's own, PAYROLL on: Duo has an ADMIN and an ACCOUNTS clerk (two writers), a
 * head and a teacher; Solo has one ADMIN (and a second ADMIN who has left, who does not count), a head and a teacher.
 * Both removed afterwards. The month drafted is October 2026 (no month after today's may be drafted).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { askAdvance, decideAdvance, draftRun, editSlip, lockRun, recordAdvance, saveSalary, saveStructure, savePayrollSettings } from "@/lib/payroll";
import { POST as salaryPost } from "@/app/api/v1/admin/payroll/salaries/route";
import { POST as decidePost } from "@/app/api/v1/admin/payroll/advances/decide/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-5);
const MONTH = "2026-10";
const ids = {
  duo: "", solo: "",
  dAdmin: "", dAdminM: "", dAccounts: "", dAccountsM: "", dHead: "", dTeacher: "", dTeacherM: "", dStructure: "",
  sAdmin: "", sAdminM: "", sLeft: "", sHead: "", sTeacher: "", sTeacherM: "", sStructure: "",
};

async function as(userId: string, role: string, schoolId: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}
const req = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const salary = (membershipId: string, structureId: string, basicPaise: number, extra: { bankAccount?: string; bankIfsc?: string; upiId?: string; paymentMode?: "BANK" | "UPI" | "CASH" | "CHEQUE"; effectiveFrom?: string } = {}) => ({
  membershipId,
  structureId,
  effectiveFrom: extra.effectiveFrom ?? "2026-04-01",
  basicPaise,
  overrides: {},
  pfUan: "",
  esiNumber: "",
  pan: "",
  bankAccount: extra.bankAccount ?? "",
  bankIfsc: extra.bankIfsc ?? "",
  bankName: "",
  ...(extra.upiId ? { upiId: extra.upiId } : {}),
  paymentMode: extra.paymentMode ?? "CASH",
});
const notes = (userId: string, schoolId: string, titleKey: string) => db.notification.findMany({ where: { userId, schoolId, titleKey }, orderBy: { createdAt: "asc" }, select: { body: true, bodyKey: true, bodyVars: true } });
const lastAudit = async (schoolId: string, action: string) => {
  const row = await db.auditLog.findFirstOrThrow({ where: { schoolId, action }, orderBy: { createdAt: "desc" }, select: { meta: true } });
  return (typeof row.meta === "string" ? JSON.parse(row.meta) : row.meta) as Record<string, unknown>;
};

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ TA407 ${tag} ${STAMP}`, slug: `zz-ta407-${tag.toLowerCase()}-${STAMP}`, code: `Z47${tag[0]}${SUFFIX}`, contactEmail: `zz-ta407-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.duo = (await mk("Duo")).id;
  ids.solo = (await mk("Solo")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.duo, module: "PAYROLL" }, { schoolId: ids.solo, module: "PAYROLL" }] });
  const user = (who: string) => db.user.create({ data: { name: `ZZ TA407 ${who}`, email: `zz-ta407-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const mem = (userId: string, schoolId: string, role: string, leftAt: Date | null = null) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", leftAt }, select: { id: true } });
  const [da, dc, dh, dt, sa, sl, sh, st] = await Promise.all(["DuoAdmin", "DuoAccounts", "DuoHead", "DuoTeacher", "SoloAdmin", "SoloLeft", "SoloHead", "SoloTeacher"].map(user));
  Object.assign(ids, { dAdmin: da!.id, dAccounts: dc!.id, dHead: dh!.id, dTeacher: dt!.id, sAdmin: sa!.id, sLeft: sl!.id, sHead: sh!.id, sTeacher: st!.id });
  ids.dAdminM = (await mem(ids.dAdmin, ids.duo, "ADMIN")).id;
  ids.dAccountsM = (await mem(ids.dAccounts, ids.duo, "ACCOUNTS")).id;
  await mem(ids.dHead, ids.duo, "PRINCIPAL");
  ids.dTeacherM = (await mem(ids.dTeacher, ids.duo, "TEACHER")).id;
  ids.sAdminM = (await mem(ids.sAdmin, ids.solo, "ADMIN")).id;
  await mem(ids.sLeft, ids.solo, "ADMIN", new Date("2026-06-30T00:00:00Z"));
  await mem(ids.sHead, ids.solo, "PRINCIPAL");
  ids.sTeacherM = (await mem(ids.sTeacher, ids.solo, "TEACHER")).id;
  const structure = async (ctx: Awaited<ReturnType<typeof as>>) => {
    await savePayrollSettings(ctx, { pfEnabled: false, pfOnFullBasic: false, esiEnabled: false, ptState: "NONE", employerName: "ZZ TA407 Trust", pfEstablishmentCode: "", esiEmployerCode: "" });
    return (await saveStructure(ctx, { name: `ZZ TA407 ${STAMP}`, components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }, { code: "HRA", label: "", formula: "PERCENT_OF_BASIC", value: 1000 }, { code: "TDS", label: "", formula: "FIXED", value: 0 }] })).id;
  };
  ids.dStructure = await structure(await as(ids.dAdmin, "ADMIN", ids.duo));
  ids.sStructure = await structure(await as(ids.sAdmin, "ADMIN", ids.solo));
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = people.map((p) => p.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: { in: [ids.duo, ids.solo] } }, { userId: { in: userIds } }] } });
  await db.school.deleteMany({ where: { id: { in: [ids.duo, ids.solo] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-407: a second person who can write payroll exists", () => {
  it("TA-407: the ADMIN's own salary is refused, through the door with a 403 and nothing written, while the ACCOUNTS clerk may set it", async () => {
    await as(ids.dAdmin, "ADMIN", ids.duo);
    const res = await salaryPost(req("/api/v1/admin/payroll/salaries", salary(ids.dAdminM, ids.dStructure, 9_000_000)));
    expect(res.status).toBe(403);
    expect(await db.staffSalary.count({ where: { membershipId: ids.dAdminM } })).toBe(0);
    await expect(saveSalary(await as(ids.dAdmin, "ADMIN", ids.duo), salary(ids.dAdminM, ids.dStructure, 9_000_000))).rejects.toMatchObject({ message: "payroll.refuseOwnPay" });
    // The other writer sets it; and the clerk's own is refused the same way.
    const saved = await saveSalary(await as(ids.dAccounts, "ACCOUNTS", ids.duo), salary(ids.dAdminM, ids.dStructure, 3_000_000));
    expect(saved.salary?.basicPaise).toBe(3_000_000);
    await expect(saveSalary(await as(ids.dAccounts, "ACCOUNTS", ids.duo), salary(ids.dAccountsM, ids.dStructure, 9_000_000))).rejects.toMatchObject({ message: "payroll.refuseOwnPay" });
  });

  it("TA-407: the ADMIN's own slip in a draft month is refused; the clerk's edit of it is audited with the figures before and after", async () => {
    const admin = await as(ids.dAdmin, "ADMIN", ids.duo);
    await saveSalary(admin, salary(ids.dTeacherM, ids.dStructure, 2_000_000));
    await draftRun(admin, MONTH);
    await expect(editSlip(await as(ids.dAdmin, "ADMIN", ids.duo), MONTH, ids.dAdminM, { arrearsPaise: 5_000_000 })).rejects.toMatchObject({ message: "payroll.refuseOwnPay" });
    const untouched = await db.payslip.findFirstOrThrow({ where: { membershipId: ids.dAdminM, run: { schoolId: ids.duo, month: MONTH } }, select: { arrearsPaise: true, netPaise: true } });
    expect(untouched.arrearsPaise).toBe(0);
    const edited = await editSlip(await as(ids.dAccounts, "ACCOUNTS", ids.duo), MONTH, ids.dAdminM, { arrearsPaise: 100_000 });
    expect(edited.arrearsPaise).toBe(100_000);
    const meta = await lastAudit(ids.duo, "payroll.slip.edit");
    expect(meta).toMatchObject({ month: MONTH, arrearsBeforePaise: 0, arrearsAfterPaise: 100_000, netBeforePaise: untouched.netPaise, netAfterPaise: edited.netPaise });
  });

  it("TA-407: the ADMIN records no advance for themself, and an advance they asked for is decided by the clerk, not by them", async () => {
    await expect(recordAdvance(await as(ids.dAdmin, "ADMIN", ids.duo), { membershipId: ids.dAdminM, amountPaise: 1_000_000, monthlyRecoveryPaise: 100_000, reason: "ZZ TA-407 own" })).rejects.toMatchObject({ message: "payroll.refuseOwnPay" });
    const asked = await askAdvance(await as(ids.dAdmin, "ADMIN", ids.duo), { amountPaise: 500_000, reason: "ZZ TA-407 ask" });
    await as(ids.dAdmin, "ADMIN", ids.duo);
    const res = await decidePost(req("/api/v1/admin/payroll/advances/decide", { advanceId: asked.id, decision: "RECORD", amountPaise: 2_000_000, monthlyRecoveryPaise: 100_000, note: "" }));
    expect(res.status).toBe(403);
    expect((await db.staffAdvance.findUniqueOrThrow({ where: { id: asked.id }, select: { status: true } })).status).toBe("REQUESTED");
    const done = await decideAdvance(await as(ids.dAccounts, "ACCOUNTS", ids.duo), { advanceId: asked.id, decision: "RECORD", amountPaise: 400_000, monthlyRecoveryPaise: 100_000, note: "" });
    expect(done.status).toBe("RECORDED");
    expect(await lastAudit(ids.duo, "payroll.advance.record")).toMatchObject({ askedPaise: 500_000, amountPaise: 400_000, monthlyRecoveryPaise: 100_000 });
  });
});

describe("TA-407: the member of staff is told of a change to their pay", () => {
  it("TA-407: a new UPI id and a new bank account each reach the teacher masked, never in full; a salary revision says the gross before and after; the audit carries the basic before and after", async () => {
    const admin = await as(ids.dAdmin, "ADMIN", ids.duo);
    const before = (await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle")).length;
    await saveSalary(admin, salary(ids.dTeacherM, ids.dStructure, 2_000_000, { upiId: "zz.teacher407@okbank", paymentMode: "UPI" }));
    let told = await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle");
    expect(told.length).toBe(before + 1);
    expect(told.at(-1)!.bodyKey).toBe("payroll.notifyPayUpiBody");
    expect(told.at(-1)!.body).not.toContain("zz.teacher407@okbank");
    expect(JSON.stringify(told.at(-1)!.bodyVars)).not.toContain("zz.teacher407@okbank");
    // The same UPI id saved again is no change and tells nobody.
    await saveSalary(admin, salary(ids.dTeacherM, ids.dStructure, 2_000_000, { upiId: "zz.teacher407@okbank", paymentMode: "UPI" }));
    expect((await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle")).length).toBe(before + 1);
    await saveSalary(admin, salary(ids.dTeacherM, ids.dStructure, 2_000_000, { bankAccount: "998877665544", bankIfsc: "SBIN0004070", paymentMode: "BANK" }));
    told = await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle");
    expect(told.length).toBe(before + 2);
    expect(told.at(-1)!.bodyKey).toBe("payroll.notifyPayBankBody");
    expect(told.at(-1)!.body).toContain("5544");
    expect(told.at(-1)!.body).not.toContain("998877665544");
    await saveSalary(admin, salary(ids.dTeacherM, ids.dStructure, 2_500_000, { effectiveFrom: "2026-11-01", paymentMode: "BANK" }));
    told = await notes(ids.dTeacher, ids.duo, "payroll.notifyPayChangedTitle");
    expect(told.length).toBe(before + 3);
    expect(told.at(-1)!.bodyKey).toBe("payroll.notifyPaySalaryBody");
    // Basic plus 10 % HRA: ₹22,000 a month before, ₹27,500 now.
    expect(told.at(-1)!.body).toContain("22,000");
    expect(told.at(-1)!.body).toContain("27,500");
    expect(await lastAudit(ids.duo, "payroll.salary.save")).toMatchObject({ basicBeforePaise: 2_000_000, basicAfterPaise: 2_500_000, grossBeforePaise: 2_200_000, grossAfterPaise: 2_750_000 });
  });
});

describe("TA-407: the head is told at every lock", () => {
  it("TA-407: locking the month tells the head with the run's headcount, gross and net", async () => {
    const run = await lockRun(await as(ids.dAccounts, "ACCOUNTS", ids.duo), MONTH);
    const told = await notes(ids.dHead, ids.duo, "payroll.notifyLockTitle");
    expect(told).toHaveLength(1);
    const vars = (typeof told[0]!.bodyVars === "string" ? JSON.parse(told[0]!.bodyVars) : told[0]!.bodyVars) as Record<string, unknown>;
    expect(vars.headcount).toBe(run.totals.headcount);
    expect(told[0]!.body).toContain(String(run.totals.headcount));
    expect(told[0]!.body).toContain(new Intl.NumberFormat("en-IN").format(run.totals.netPaise / 100));
    expect(told[0]!.body).toContain(new Intl.NumberFormat("en-IN").format(run.totals.grossPaise / 100));
  });
});

describe("TA-407: a one-person office", () => {
  it("TA-407: the lone ADMIN (a second ADMIN who has left does not count) saves their own salary, edits their own slip and records their own advance; the head is told of each", async () => {
    const admin = await as(ids.sAdmin, "ADMIN", ids.solo);
    const saved = await saveSalary(admin, salary(ids.sAdminM, ids.sStructure, 3_000_000));
    expect(saved.salary?.basicPaise).toBe(3_000_000);
    let told = await notes(ids.sHead, ids.solo, "payroll.notifyOwnPayTitle");
    expect(told.map((n) => n.bodyKey)).toEqual(["payroll.notifyOwnSalaryBody"]);
    expect(told[0]!.body).toContain("33,000");
    expect(await lastAudit(ids.solo, "payroll.salary.save")).toMatchObject({ basicBeforePaise: null, basicAfterPaise: 3_000_000, ownPay: true });
    await saveSalary(admin, salary(ids.sTeacherM, ids.sStructure, 1_000_000));
    await draftRun(admin, MONTH);
    await editSlip(await as(ids.sAdmin, "ADMIN", ids.solo), MONTH, ids.sAdminM, { arrearsPaise: 50_000 });
    await recordAdvance(await as(ids.sAdmin, "ADMIN", ids.solo), { membershipId: ids.sAdminM, amountPaise: 300_000, monthlyRecoveryPaise: 100_000, reason: "ZZ TA-407 solo" });
    told = await notes(ids.sHead, ids.solo, "payroll.notifyOwnPayTitle");
    expect(told.map((n) => n.bodyKey)).toEqual(["payroll.notifyOwnSalaryBody", "payroll.notifyOwnSlipBody", "payroll.notifyOwnAdvanceBody"]);
    // The teacher's slip is not the admin's own: the head is not told of an edit to it.
    await editSlip(await as(ids.sAdmin, "ADMIN", ids.solo), MONTH, ids.sTeacherM, { arrearsPaise: 10_000 });
    expect((await notes(ids.sHead, ids.solo, "payroll.notifyOwnPayTitle")).length).toBe(3);
    // And the teacher was told of their first salary.
    expect((await notes(ids.sTeacher, ids.solo, "payroll.notifyPayChangedTitle")).map((n) => n.bodyKey)).toEqual(["payroll.notifyPaySalaryNewBody"]);
  });
});
