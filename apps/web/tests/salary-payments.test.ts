/**
 * HOW EACH SALARY SLIP WAS PAID (owner-batch-item2b, the owner's decision of 27 October 2026).
 *
 * A ZZ school of this suite's own with PAYROLL on and five people paid five ways: Alpha by bank, Bravo and Delta by
 * UPI, Charlie in cash, Echo by cheque. What is proved: the UPI id is sealed on arrival, shown masked, and opened only
 * into the UPI advice (whose bytes and SHA-256 are pinned) and the pay-from-your-app link (whose exact string is
 * pinned); it is in no API answer, payment row, audit row or log line. A payment is recorded only on a locked run,
 * for the slip's whole net, with a UTR or cheque number of the right shape, on a day from the month's first to
 * today; two presses of "Record" fired together end as ONE payment, and two different ones as one payment and a 409;
 * one UTR pays one slip; a void sets a payment aside with its reason on the row (not in the log) and the slip is
 * unpaid again. The UTR sheet is all or nothing with a line-by-line answer, and sent again whole answers ALREADY. The
 * run moves LOCKED → PAID when the last slip is recorded — the last two recorded together still end PAID once — and
 * back on a void; a PAID run is as frozen as a LOCKED one, its files still cut, Tally adding the payments. A member
 * of staff reads how their own slip was paid; the head reads it on a shared run and records nothing.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getAccessFallbackHTTPStatus } from "next/dist/client/components/http-access-fallback/http-access-fallback";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { draftRun, editSlip, listSalaries, lockRun, myPayslips, myStatement, payrollExport, payslipDocument, runView, saveSalary, saveStructure, savePayrollSettings, shareRun } from "@/lib/payroll";
import { importUtrSheet, recordPaymentLines, recordSalaryPayment, upiIntentFor, voidSalaryPayment } from "@/lib/salary-payments";
import { maskVpa, parseUtrSheet, sheetDate, slipRefsOf, upiPayLink } from "@/lib/salary-payment-rules";
import { tallyPayroll } from "@/lib/tally-export";
import { AccessError } from "@/lib/access-error";
import { GET as salariesGet } from "@/app/api/v1/admin/payroll/salaries/route";
import { GET as runGet } from "@/app/api/v1/admin/payroll/runs/[month]/route";
import { GET as mineGet } from "@/app/api/v1/account/payslips/route";
import { POST as recordPost } from "@/app/api/v1/admin/payroll/runs/[month]/payments/[membershipId]/route";
import { POST as voidPost } from "@/app/api/v1/admin/payroll/runs/[month]/payments/[membershipId]/void/route";
import { POST as sheetPost } from "@/app/api/v1/admin/payroll/runs/[month]/payments/sheet/route";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";
import { FORM_IDLE } from "@/lib/form-state";
import { recordPaymentAction, utrSheetAction } from "@/app/(app)/admin/payroll/actions";
import PayrollRunPage from "@/app/(app)/admin/payroll/runs/[month]/page";
import PayFromUpiApp from "@/app/(app)/admin/payroll/runs/[month]/pay/[membershipId]/page";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

// Server components compiled with the classic JSX runtime here need React in scope.
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const MONTH = "2026-09";
const PAID_ON = "2026-10-01";
const VPA_B = "ravi.k-01@okaxis";
const VPA_D = "dee_09@ybl";
const ACCOUNT = "998877665544";
const ids = { school: "", admin: "", principal: "", a: "", b: "", c: "", d: "", e: "", mAdmin: "", mA: "", mB: "", mC: "", mD: "", mE: "" };
const net: Record<string, number> = {};
const ref: Record<string, string> = {};

/** Every line the app writes to the console during the suite, to prove the UPI id is never in one. */
const logged: string[] = [];
const spies = (["log", "info", "warn", "error", "debug"] as const).map((k) => vi.spyOn(console, k).mockImplementation((...args: unknown[]) => void logged.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a, Object.getOwnPropertyNames(a ?? {})))).join(" "))));

async function as(userId: string, role: string, route: string | null = null) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId: ids.school, role: role as never });
  return route ? (null as never) : (await getSession())!;
}
const post = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const runPath = `/api/v1/admin/payroll/runs/${MONTH}`;
const salary = (membershipId: string, structureId: string, basicPaise: number, paymentMode: "BANK" | "UPI" | "CASH" | "CHEQUE", extra: { bankAccount?: string; bankIfsc?: string; upiId?: string } = {}) => ({
  membershipId,
  structureId,
  effectiveFrom: "2026-04-01",
  basicPaise,
  overrides: {},
  pfUan: "",
  esiNumber: "",
  pan: "",
  bankAccount: extra.bankAccount ?? "",
  bankIfsc: extra.bankIfsc ?? "",
  bankName: "",
  upiId: extra.upiId ?? "",
  paymentMode,
});

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Salary Pay ${STAMP}`, slug: `zz-salpay-${STAMP}`, code: `ZSP${String(STAMP).slice(-6)}`, contactEmail: `zz-salpay-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "PAYROLL" } });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Pay ${who}`, email: `zz-salpay-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const mem = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } });
  for (const [k, who, role] of [["admin", "Admin", "ADMIN"], ["principal", "Principal", "PRINCIPAL"], ["a", "Alpha", "TEACHER"], ["b", "Bravo", "TEACHER"], ["c", "Charlie", "TEACHER"], ["d", "Delta", "TEACHER"], ["e", "Echo", "TEACHER"]] as const) {
    ids[k] = (await user(who)).id;
    const m = (await mem(ids[k], role)).id;
    if (k === "admin") ids.mAdmin = m;
    else if (k !== "principal") ids[`m${k.toUpperCase()}` as "mA"] = m;
  }
});

afterAll(async () => {
  for (const s of spies) s.mockRestore();
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  await db.notification.deleteMany({ where: { schoolId: ids.school } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  await db.$disconnect();
});

describe("the pure part: references, the mask, the link and the sheet", () => {
  it("numbers the slips by the run's order of names, and masks a UPI id", () => {
    const refs = slipRefsOf("2026-09", [{ membershipId: "m3", staffName: "Charlie" }, { membershipId: "m1", staffName: "Alpha" }, { membershipId: "m2", staffName: "Alpha" }]);
    expect([...refs.entries()]).toEqual([["m1", "SAL-202609-001"], ["m2", "SAL-202609-002"], ["m3", "SAL-202609-003"]]);
    expect(maskVpa(VPA_B)).toBe("ra•••@okaxis");
  });

  it("builds the pay-from-your-app link exactly, the name and the note percent-encoded", () => {
    expect(upiPayLink({ vpa: VPA_B, payeeName: "ZZ Pay Bravo", amountPaise: 1_234_550, month: "2026-09" })).toBe("upi://pay?pa=ravi.k-01@okaxis&pn=ZZ%20Pay%20Bravo&am=12345.50&tn=Salary%202026-09&cu=INR");
    expect(() => upiPayLink({ vpa: "not a vpa", payeeName: "x", amountPaise: 100, month: "2026-09" })).toThrow();
    expect(() => upiPayLink({ vpa: VPA_B, payeeName: "x", amountPaise: 0, month: "2026-09" })).toThrow();
  });

  it("reads the sheet's dates as banks print them and its columns whatever their case", () => {
    expect(sheetDate("2026-10-01")).toBe("2026-10-01");
    expect(sheetDate("1/10/2026")).toBe("2026-10-01");
    expect(sheetDate("31-02-2026")).toBeNull();
    const lines = parseUtrSheet("slip ref,UTR,date,Amount\r\nsal-202609-001, axis1234567890 ,01-10-2026,\"1,000.00\"\r\n")!;
    expect(lines).toEqual([{ line: 2, slipRef: "SAL-202609-001", utr: "AXIS1234567890", dateKey: "2026-10-01", amountPaise: 100_000, amountBad: false }]);
    expect(parseUtrSheet("ref,amount\n1,2")).toBeNull();
  });
});

describe("the UPI id, sealed", () => {
  it("is sealed on arrival and shown masked; a bad id is refused; a blank keeps the sealed one", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    await savePayrollSettings(ctx, { pfEnabled: false, pfOnFullBasic: false, esiEnabled: false, ptState: "NONE", employerName: "ZZ Salary Pay Trust", pfEstablishmentCode: "", esiEmployerCode: "" });
    const st = await saveStructure(ctx, { name: "ZZ Flat", components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }, { code: "HRA", label: "", formula: "PERCENT_OF_BASIC", value: 1000 }] });
    await saveSalary(ctx, salary(ids.mA, st.id, 2_000_000, "BANK", { bankAccount: ACCOUNT, bankIfsc: "SBIN0001234" }));
    const saved = await saveSalary(ctx, salary(ids.mB, st.id, 1_500_000, "UPI", { upiId: "Ravi.K-01@OKAXIS" }));
    expect(saved.salary?.upiMasked).toBe("ra•••@okaxis");
    await saveSalary(ctx, salary(ids.mC, st.id, 1_000_000, "CASH"));
    // Delta is paid by UPI with no id yet: the draft warns.
    await saveSalary(ctx, salary(ids.mD, st.id, 1_800_000, "UPI"));
    await saveSalary(ctx, salary(ids.mE, st.id, 1_200_000, "CHEQUE"));
    await expect(saveSalary(ctx, salary(ids.mD, st.id, 1_800_000, "UPI", { upiId: "dee@@ybl" }))).rejects.toMatchObject({ key: "salaryPay.refuseVpa", status: 422 });
    const row = await db.staffSalary.findFirstOrThrow({ where: { membershipId: ids.mB } });
    expect(row.upiSealed).toMatch(/^v2\./);
    expect(row.upiSealed).not.toContain("ravi");
    // A blank keeps it, through a revision from a later date.
    const again = await saveSalary(ctx, { ...salary(ids.mB, st.id, 1_500_000, "UPI"), effectiveFrom: "2026-05-01" });
    expect(again.salary?.upiMasked).toBe("ra•••@okaxis");
    expect((await db.staffSalary.findFirstOrThrow({ where: { membershipId: ids.mB, effectiveFromKey: "2026-05-01" } })).upiSealed).toBe(row.upiSealed);
  });

  it("drafts with a NO_UPI warning for a UPI slip with no id, numbers the slips, and refuses a payment before the lock", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const run = await draftRun(ctx, MONTH);
    expect(run.slips!.map((s) => s.slipRef)).toEqual(["SAL-202609-001", "SAL-202609-002", "SAL-202609-003", "SAL-202609-004", "SAL-202609-005"]);
    expect(run.slips!.find((s) => s.membershipId === ids.mD)!.warnings).toContain("NO_UPI");
    expect(run.slips!.find((s) => s.membershipId === ids.mB)!.warnings).not.toContain("NO_UPI");
    expect(run.slips!.every((s) => s.payment === null)).toBe(true);
    await expect(recordSalaryPayment(ctx, MONTH, ids.mC, { amountPaise: 100, mode: "CASH", paidOn: PAID_ON, reference: "", note: "" })).rejects.toMatchObject({ key: "salaryPay.refuseNotLocked", status: 409 });
    const st = (await db.staffSalary.findFirstOrThrow({ where: { membershipId: ids.mD } })).structureId;
    await saveSalary(ctx, salary(ids.mD, st, 1_800_000, "UPI", { upiId: VPA_D }));
    const redrawn = await draftRun(ctx, MONTH);
    expect(redrawn.slips!.find((s) => s.membershipId === ids.mD)!.warnings).not.toContain("NO_UPI");
    await lockRun(ctx, MONTH);
    const locked = await runView(ctx, MONTH);
    expect(locked.status).toBe("LOCKED");
    for (const s of locked.slips!) {
      net[s.membershipId] = s.netPaise;
      ref[s.membershipId] = s.slipRef;
    }
    expect(locked.payments).toEqual({ due: 5, paid: 0, paidPaise: 0 });
  });

  it("opens the id into the UPI advice alone: name, VPA, amount, slip ref; the bytes and their SHA-256 pinned and recorded", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const file = await payrollExport(ctx, MONTH, "UPI_ADVICE");
    const want = `Beneficiary Name,VPA,Amount,Slip Ref\r\nZZ Pay Bravo,${VPA_B},${(net[ids.mB]! / 100).toFixed(2)},SAL-202609-002\r\nZZ Pay Delta,${VPA_D},${(net[ids.mD]! / 100).toFixed(2)},SAL-202609-004\r\n`;
    expect(file.content).toBe(want);
    expect(file.rows).toBe(2);
    expect(file.totalPaise).toBe(net[ids.mB]! + net[ids.mD]!);
    expect(file.filename).toMatch(/-upi-advice-2026-09\.csv$/);
    const row = await db.payrollExport.findFirstOrThrow({ where: { schoolId: ids.school, kind: "UPI_ADVICE" }, orderBy: { createdAt: "desc" } });
    expect(row.sha256).toBe(createHash("sha256").update(want).digest("hex"));
    // Cut again, the same bytes.
    expect((await payrollExport(ctx, MONTH, "UPI_ADVICE")).content).toBe(want);
    const audit = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school, action: "payroll.export.sealed" }, orderBy: { createdAt: "desc" } });
    expect(audit.meta).toContain("UPI_ADVICE");
    expect(audit.meta).not.toContain("okaxis");
  });

  it("builds the pay-from-your-app link from the sealed id on asking, audits that it was shown, and refuses a slip that is not UPI", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const intent = await upiIntentFor(ctx, MONTH, ids.mB);
    expect(intent.link).toBe(`upi://pay?pa=${VPA_B}&pn=ZZ%20Pay%20Bravo&am=${(net[ids.mB]! / 100).toFixed(2)}&tn=Salary%202026-09&cu=INR`);
    expect(intent.qr?.d.length).toBeGreaterThan(100);
    expect(intent.slipRef).toBe("SAL-202609-002");
    const shown = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school, action: "payroll.upiIntentShown" } });
    expect(shown.targetId).toBe(ids.mB);
    expect(shown.meta).not.toContain("okaxis");
    await expect(upiIntentFor(ctx, MONTH, ids.mA)).rejects.toMatchObject({ key: "salaryPay.refuseNotUpi" });
    // The head never asks for it.
    await expect(upiIntentFor(await as(ids.principal, "PRINCIPAL"), MONTH, ids.mB)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("the pages", () => {
  const page = <T extends Record<string, string>>(params: T) => ({ params: Promise.resolve(params), searchParams: Promise.resolve({}) });
  // The payment forms are <ActionForm>s, which speak through the toast and the dictionary as the app shell gives them.
  const draw = (tree: React.ReactNode) => renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, tree)));

  it("renders the run's slips with their refs and payment state, and the UPI slip's way to the pay page, with no UPI id in it", async () => {
    await as(ids.admin, "ADMIN");
    const html = draw(await PayrollRunPage(page({ month: MONTH })));
    expect(html).toContain("Slip ref SAL-202609-002");
    expect(html).toContain("ra•••@okaxis");
    expect(html).toContain(`/admin/payroll/runs/${MONTH}/pay/${ids.mB}`);
    expect(html).toContain("Not yet paid");
    expect(html).toContain("Upload the UTR sheet");
    // The bank slips wait for the bank advice to be cut before their UTRs are taken together.
    expect(html).toContain("Cut the bank advice and upload it to the school&#x27;s bank first");
    expect(html).not.toContain(VPA_B);
    expect(html).not.toContain(VPA_D);
  });

  it("renders the pay page with the link and its QR for an unpaid UPI slip, says why for a bank slip, and is 404 for no such person", async () => {
    await as(ids.admin, "ADMIN");
    const html = draw(await PayFromUpiApp(page({ month: MONTH, membershipId: ids.mB })));
    expect(html).toContain(`href="upi://pay?pa=${VPA_B}&amp;pn=ZZ%20Pay%20Bravo&amp;am=`);
    expect(html).toMatch(/<svg[^>]*role="img"[^>]*aria-label="QR code to pay ZZ Pay Bravo/);
    expect(html).toContain('name="mode" value="UPI"');
    const bank = draw(await PayFromUpiApp(page({ month: MONTH, membershipId: ids.mA })));
    expect(bank).toContain("This slip is not paid by UPI.");
    expect(bank).not.toContain("upi://");
    let status: number | undefined;
    try {
      await PayFromUpiApp(page({ month: MONTH, membershipId: "zz-nope0000000000000000000" }));
    } catch (e) {
      status = getAccessFallbackHTTPStatus(e as never);
    }
    expect(status).toBe(404);
  });
});

describe("recording a payment", () => {
  it("refuses a part payment, a UTR or cheque number of the wrong shape, and a day outside the month's first to today", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const base = { mode: "BANK" as const, paidOn: PAID_ON, reference: "SBIN123456789012", note: "" };
    await expect(recordSalaryPayment(ctx, MONTH, ids.mA, { ...base, amountPaise: net[ids.mA]! - 100 })).rejects.toMatchObject({ key: "teachPay.refuseAmount", status: 422, field: "amountPaise" });
    await expect(recordSalaryPayment(ctx, MONTH, ids.mA, { ...base, amountPaise: net[ids.mA]!, reference: "12345" })).rejects.toMatchObject({ key: "salaryPay.refuseUtr", status: 422 });
    await expect(recordSalaryPayment(ctx, MONTH, ids.mA, { ...base, amountPaise: net[ids.mA]!, paidOn: "2026-08-31" })).rejects.toMatchObject({ key: "salaryPay.refusePaidOn" });
    await expect(recordSalaryPayment(ctx, MONTH, ids.mA, { ...base, amountPaise: net[ids.mA]!, paidOn: "2099-01-01" })).rejects.toMatchObject({ key: "salaryPay.refusePaidOn" });
    await expect(recordSalaryPayment(ctx, MONTH, ids.mE, { ...base, mode: "CHEQUE", amountPaise: net[ids.mE]!, reference: "12AB56" })).rejects.toMatchObject({ key: "salaryPay.refuseCheque" });
    expect(await db.salaryPayment.count({ where: { schoolId: ids.school } })).toBe(0);
  });

  it("⚠ two presses of Record on one slip, fired together, end as ONE payment, both answered with it", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const input = { amountPaise: net[ids.mC]!, mode: "CASH" as const, paidOn: PAID_ON, reference: "ignored for cash", note: "ZZ paid at the counter" };
    const [one, two] = await Promise.all([recordSalaryPayment(ctx, MONTH, ids.mC, input), recordSalaryPayment(ctx, MONTH, ids.mC, input)]);
    expect(await db.salaryPayment.count({ where: { schoolId: ids.school, voidedAt: null } })).toBe(1);
    expect(one.slip.payment!.id).toBe(two.slip.payment!.id);
    expect(one.slip.payment).toMatchObject({ mode: "CASH", reference: null, paidOn: PAID_ON, amountPaise: net[ids.mC], recordedByName: "ZZ Pay Admin" });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "payroll.paymentRecorded", targetId: ids.mC } })).toBe(1);
  });

  it("⚠ two DIFFERENT payments of one slip fired together: one stands, the other is told 409", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const at = (utr: string) => recordSalaryPayment(ctx, MONTH, ids.mA, { amountPaise: net[ids.mA]!, mode: "BANK", paidOn: PAID_ON, reference: utr, note: "" });
    const settled = await Promise.allSettled([at("SBIN000000000001"), at("SBIN000000000002")]);
    expect(settled.filter((s) => s.status === "fulfilled")).toHaveLength(1);
    const lost = settled.find((s) => s.status === "rejected") as PromiseRejectedResult;
    expect(lost.reason).toMatchObject({ key: "salaryPay.refuseAlreadyPaid", status: 409 });
    expect(await db.salaryPayment.count({ where: { schoolId: ids.school, voidedAt: null, slip: { membershipId: ids.mA } } })).toBe(1);
  });

  it("lets one UTR pay one slip only", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const used = (await db.salaryPayment.findFirstOrThrow({ where: { schoolId: ids.school, voidedAt: null, mode: "BANK" } })).reference!;
    await expect(recordSalaryPayment(ctx, MONTH, ids.mB, { amountPaise: net[ids.mB]!, mode: "UPI", paidOn: PAID_ON, reference: used, note: "" })).rejects.toMatchObject({ key: "salaryPay.refuseUtrTaken", status: 409 });
  });

  it("voids with a reason kept on the row and not in the log; the slip is unpaid again; a second void is 409", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const done = await voidSalaryPayment(ctx, MONTH, ids.mA, "ZZ the bank returned the credit");
    expect(done.slip.payment).toBeNull();
    await expect(voidSalaryPayment(ctx, MONTH, ids.mA, "again")).rejects.toMatchObject({ key: "salaryPay.refuseNotPaid", status: 409 });
    const voided = await db.salaryPayment.findFirstOrThrow({ where: { schoolId: ids.school, voidedAt: { not: null } } });
    expect(voided).toMatchObject({ voidReason: "ZZ the bank returned the credit", liveSlipId: null, liveUtr: null, voidedByMembershipId: ids.mAdmin });
    const log = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school, action: "payroll.paymentVoided" } });
    expect(log.meta).not.toContain("returned");
  });
});

describe("the UTR sheet and the bank slips together", () => {
  it("refuses the whole sheet over one unknown ref and one wrong amount, saying each line, and records nothing", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const csv = ["Slip Ref,UTR,Date,Amount", `${ref[ids.mA]},HDFC111122223333,${PAID_ON},${(net[ids.mA]! / 100).toFixed(2)}`, `SAL-202609-099,HDFC111122224444,${PAID_ON},`, `${ref[ids.mB]},YBL111122225555,01/10/2026,1.00`, `${ref[ids.mC]},HDFC111122226666,${PAID_ON},`].join("\n");
    const answer = await importUtrSheet(ctx, MONTH, csv);
    expect(answer.accepted).toBe(false);
    expect(answer.recorded).toBe(0);
    expect(answer.lines).toEqual([
      // qb-B (QB-08): good, but the sheet was refused whole, so not recorded.
      { line: 2, slipRef: ref[ids.mA], outcome: "WOULD_RECORD", reason: null },
      { line: 3, slipRef: "SAL-202609-099", outcome: "REFUSED", reason: "UNKNOWN_REF" },
      { line: 4, slipRef: ref[ids.mB], outcome: "REFUSED", reason: "AMOUNT" },
      { line: 5, slipRef: ref[ids.mC], outcome: "REFUSED", reason: "MODE" },
    ]);
    expect(await db.salaryPayment.count({ where: { schoolId: ids.school, voidedAt: null } })).toBe(1); // Charlie's cash, from before
    await expect(importUtrSheet(ctx, MONTH, "Name,Amount\nx,1")).rejects.toMatchObject({ key: "salaryPay.refuseSheetHeader", status: 422 });
  });

  it("answers the run page's forms in place: the sheet's refused lines said one by one, what was pasted kept, never ?error=", async () => {
    await as(ids.admin, "ADMIN");
    const form = new FormData();
    form.set("month", MONTH);
    const csv = ["Slip Ref,UTR,Date", `SAL-202609-099,HDFC111122224444,${PAID_ON}`, `${ref[ids.mB]},YBL1,${PAID_ON}`].join("\n");
    form.set("csv", csv);
    const answer = await utrSheetAction(FORM_IDLE, form);
    expect(answer.ok).toBe(false);
    expect(answer.message).toBe("2 lines were refused, so nothing was recorded. Line 2, SAL-202609-099: no slip of this run has this reference; Line 3, SAL-202609-002: the UTR is not 12 to 22 letters and digits. Correct them and send the sheet again.");
    expect(answer.values?.csv).toBe(csv);
    const part = new FormData();
    for (const [k, v] of Object.entries({ month: MONTH, membershipId: ids.mB, amountPaise: "100", mode: "UPI", paidOn: PAID_ON, reference: "YBL111122225555", note: "" })) part.set(k, v);
    const refused = await recordPaymentAction(FORM_IDLE, part);
    expect(refused).toMatchObject({ ok: false, field: "amountPaise", values: { reference: "YBL111122225555" } });
    expect(refused.message).toContain("A different amount is not recorded.");
    expect(await db.salaryPayment.count({ where: { schoolId: ids.school, voidedAt: null } })).toBe(1);
  });

  it("records the corrected sheet, and the same sheet sent again is ALREADY throughout", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const csv = ["Slip Ref,UTR,Date", `${ref[ids.mA]},HDFC111122223333,${PAID_ON}`, `${ref[ids.mB]},YBL111122225555,01/10/2026`].join("\n");
    const answer = await importUtrSheet(ctx, MONTH, csv);
    expect(answer).toMatchObject({ accepted: true, recorded: 2, already: 0, refused: 0, status: "LOCKED" });
    const again = await importUtrSheet(ctx, MONTH, csv);
    expect(again).toMatchObject({ accepted: true, recorded: 0, already: 2, refused: 0 });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "payroll.paymentRecorded", meta: { contains: '"via":"sheet"' } } })).toBe(2);
  });

  it("refuses a UTR twice in one batch, and a UTR another slip already holds", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const answer = await recordPaymentLines(ctx, MONTH, [{ line: 1, slipRef: ref[ids.mD]!, reference: "HDFC111122223333", dateKey: PAID_ON, amountPaise: null }], "bank-batch");
    expect(answer.lines[0]).toMatchObject({ outcome: "REFUSED", reason: "UTR_TAKEN" });
  });
});

describe("PAID, by the payments", () => {
  it("⚠ the last two slips recorded together make the run PAID once; a void takes it back to LOCKED; recorded again, PAID", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const [d, e] = await Promise.all([
      recordSalaryPayment(ctx, MONTH, ids.mD, { amountPaise: net[ids.mD]!, mode: "UPI", paidOn: PAID_ON, reference: "AXIS999988887777", note: "" }, "upi-app"),
      recordSalaryPayment(ctx, MONTH, ids.mE, { amountPaise: net[ids.mE]!, mode: "CHEQUE", paidOn: PAID_ON, reference: "004512", note: "" }),
    ]);
    expect([d.status, e.status]).toContain("PAID");
    const run = await db.payrollRun.findFirstOrThrow({ where: { schoolId: ids.school, month: MONTH } });
    expect(run.status).toBe("PAID");
    expect(run.paidAt).not.toBeNull();
    const view = await runView(ctx, MONTH);
    expect(view.payments).toEqual({ due: 5, paid: 5, paidPaise: Object.values(net).reduce((a, n) => a + n, 0) });
    const back = await voidSalaryPayment(ctx, MONTH, ids.mE, "ZZ the cheque bounced");
    expect(back.status).toBe("LOCKED");
    expect((await db.payrollRun.findFirstOrThrow({ where: { id: run.id } })).paidAt).toBeNull();
    const again = await recordSalaryPayment(ctx, MONTH, ids.mE, { amountPaise: net[ids.mE]!, mode: "CASH", paidOn: PAID_ON, reference: "", note: "" });
    expect(again.status).toBe("PAID");
  });

  it("keeps a PAID run frozen: no draft, edit or lock; its files are still cut; Tally adds the payments as balanced Payment vouchers", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    await expect(draftRun(ctx, MONTH)).rejects.toMatchObject({ key: "payroll.refuseLocked" });
    await expect(editSlip(ctx, MONTH, ids.mA, { notes: "ZZ late" })).rejects.toMatchObject({ key: "payroll.refuseLocked" });
    await expect(lockRun(ctx, MONTH)).rejects.toMatchObject({ key: "payroll.refuseLocked" });
    expect((await payrollExport(ctx, MONTH, "BANK_ADVICE")).content).toContain(ACCOUNT);
    const tally = await tallyPayroll(ctx, MONTH, "CSV");
    expect(tally.content).toContain(",Journal,PAYROLL-2026-09,");
    expect(tally.content).toMatch(/01-10-2026,Payment,SALPAY-2026-09-20261001-UPI,Salaries payable,[\d.]+,,"Salaries for 2026-09 paid by UPI, 2 payslips"/);
    expect(tally.content).toMatch(/01-10-2026,Payment,SALPAY-2026-09-20261001-CASH,Cash,,[\d.]+,/);
    expect(tally.vouchers).toBe(4); // the journal; bank, cash and UPI on the one day
  });
});

describe("who reads it, and what never leaves the seal", () => {
  it("shows the member of staff how their own slip was paid, on the API and in their statement", async () => {
    const me = await as(ids.b, "TEACHER");
    const mine = await myPayslips(me);
    expect(mine.slips[0]!.payment).toEqual({ mode: "UPI", amountPaise: net[ids.mB], paidOn: PAID_ON, reference: "YBL111122225555" });
    expect((await myStatement(me, "2026-27")).months.map((m) => m.month)).toEqual([MONTH]);
    expect((await payslipDocument(me, MONTH, "self")).slip.payment?.reference).toBe("YBL111122225555");
  });

  it("lets the head read the payments of a shared run and record none", async () => {
    await shareRun(await as(ids.admin, "ADMIN"), MONTH, true);
    const head = await as(ids.principal, "PRINCIPAL");
    const run = await runView(head, MONTH);
    expect(run.slips!.every((s) => s.payment !== null)).toBe(true);
    await expect(recordSalaryPayment(head, MONTH, ids.mA, { amountPaise: 1, mode: "CASH", paidOn: PAID_ON, reference: "", note: "" })).rejects.toBeInstanceOf(AccessError);
  });

  it("answers the payment doors: 422 for an empty body, 200 for the same payment again, the sheet's lines; the void door", async () => {
    await as(ids.admin, "ADMIN", `POST ${runPath}/payments/${ids.mC}`);
    const params = { params: Promise.resolve({ month: MONTH, membershipId: ids.mC }) };
    expect((await recordPost(post(`${runPath}/payments/${ids.mC}`, {}), params)).status).toBe(422);
    const res = await recordPost(post(`${runPath}/payments/${ids.mC}`, { amountPaise: net[ids.mC], mode: "CASH", paidOn: PAID_ON, reference: "", note: "ZZ paid at the counter" }), { params: Promise.resolve({ month: MONTH, membershipId: ids.mC }) });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data?: { status: string }; status?: string };
    expect(JSON.stringify(body)).toContain("PAID");
    await as(ids.admin, "ADMIN", `POST ${runPath}/payments/sheet`);
    const sheet = await sheetPost(post(`${runPath}/payments/sheet`, { csv: `Slip Ref,UTR,Date\n${ref[ids.mA]},HDFC111122223333,${PAID_ON}\n` }), { params: Promise.resolve({ month: MONTH }) });
    expect(sheet.status).toBe(200);
    expect(await sheet.text()).toContain('"ALREADY"');
    await as(ids.a, "TEACHER", `POST ${runPath}/payments/${ids.mC}/void`);
    expect((await voidPost(post(`${runPath}/payments/${ids.mC}/void`, { reason: "ZZ" }), { params: Promise.resolve({ month: MONTH, membershipId: ids.mC }) })).status).toBe(403);
  });

  it("⚠ never answers, stores beside a payment, audits or logs the UPI id", async () => {
    await as(ids.admin, "ADMIN", "GET /api/v1/admin/payroll/salaries");
    const answers = [await (await salariesGet()).text()];
    await as(ids.admin, "ADMIN", `GET ${runPath}`);
    answers.push(await (await runGet(new Request(`http://localhost${runPath}`), { params: Promise.resolve({ month: MONTH }) })).text());
    await as(ids.b, "TEACHER", "GET /api/v1/account/payslips");
    answers.push(await (await mineGet()).text());
    answers.push(JSON.stringify(await listSalaries(await as(ids.admin, "ADMIN"))));
    expect(answers[1]).toContain("SAL-202609-002");
    for (const text of answers) {
      expect(text).not.toContain(VPA_B);
      expect(text).not.toContain(VPA_D);
      expect(text).not.toContain("ravi.k");
    }
    const payments = JSON.stringify(await db.salaryPayment.findMany({ where: { schoolId: ids.school } }));
    const audits = JSON.stringify(await db.auditLog.findMany({ where: { schoolId: ids.school } }));
    for (const text of [payments, audits, logged.join("\n")]) {
      expect(text).not.toContain(VPA_B);
      expect(text).not.toContain(VPA_D);
      expect(text).not.toContain(ACCOUNT);
    }
  });
});
