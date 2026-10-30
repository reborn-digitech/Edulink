/**
 * qb-B (31 October 2026): the QA pass's payroll findings QB-06 to QB-10 and the payroll copy of QB-11, at a ZZ
 * school of this suite's own with PAYROLL on (people at @test.invalid), deleted by id.
 *
 * QB-06 a second "Add support staff" press answered `salary: null`, even fired together with the first; every
 * answer now carries the salary. QB-07 the bank advice had no Slip Ref, though the UTR sheet matches by it alone.
 * QB-08 a refused UTR sheet called its good lines RECORDED while nothing was written; they are WOULD_RECORD. QB-09
 * the run page listed slips by the database's collation while the references were numbered by code point, so a
 * lower-case name scattered the numbering (001, 005, 002…); one comparator orders both. QB-10 a support worker,
 * who cannot ask for an advance, was invited to. QB-11 "1 rows" on the run page, and an overpayment called a part
 * payment with the amount unformatted.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { utrSheetAnswerSchema } from "@edulink/contracts";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { draftRun, lockRun, payrollExport, runView, saveSalary, saveStructure, savePayrollSettings } from "@/lib/payroll";
import { importUtrSheet } from "@/lib/salary-payments";
import { compareSlips, slipRefsOf } from "@/lib/salary-payment-rules";
import { addSupportStaff } from "@/lib/support-staff";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";
import { FORM_IDLE } from "@/lib/form-state";
import { recordPaymentAction } from "@/app/(app)/admin/payroll/actions";
import PayrollRunPage from "@/app/(app)/admin/payroll/runs/[month]/page";
import MyPayslipsPage from "@/app/account/payslips/page";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const MONTH = "2026-09";
const PAID_ON = "2026-10-01";
const ACCOUNT_A = "112233445566";
const ACCOUNT_R = "665544332211";
const ids = { school: "", admin: "", anita: "", ramu: "", rohan: "", mAdmin: "", mAnita: "", mRamu: "", mRohan: "", structure: "", support: "", supportUser: "" };
const net: Record<string, number> = {};

async function as(userId: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId: ids.school, role: role as never });
  return (await getSession())!;
}
const draw = (tree: React.ReactNode) => renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, tree)));
const salary = (membershipId: string, basicPaise: number, paymentMode: "BANK" | "UPI" | "CASH", extra: { bankAccount?: string; bankIfsc?: string; upiId?: string } = {}) => ({
  membershipId,
  structureId: ids.structure,
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
  ids.school = (await db.school.create({ data: { name: `ZZ QbB Payroll ${STAMP}`, slug: `zz-qbb-pay-${STAMP}`, code: `ZQP${String(STAMP).slice(-6)}`, contactEmail: `zz-qbb-pay-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "PAYROLL" } });
  // A lower-case name among capitalised ones: the database's collation and a code-point sort disagree about it.
  for (const [k, name, role] of [["admin", "ZZ QbB Admin", "ADMIN"], ["anita", "ZZ Anita Rao", "TEACHER"], ["ramu", "ZZ item12 Ramu Gardener", "TEACHER"], ["rohan", "ZZ Rohan Kale", "TEACHER"]] as const) {
    ids[k] = (await db.user.create({ data: { name, email: `zz-qbb-pay-${k}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    const m = (await db.membership.create({ data: { userId: ids[k], schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } })).id;
    ids[`m${k[0]!.toUpperCase()}${k.slice(1)}` as "mAdmin"] = m;
  }
  const ctx = await as(ids.admin, "ADMIN");
  await savePayrollSettings(ctx, { pfEnabled: false, pfOnFullBasic: false, esiEnabled: false, ptState: "NONE", employerName: "ZZ QbB Trust", pfEstablishmentCode: "", esiEmployerCode: "" });
  ids.structure = (await saveStructure(ctx, { name: "ZZ QbB Flat", components: [{ code: "BASIC", label: "", formula: "FIXED", value: 0 }] })).id;
  await saveSalary(ctx, salary(ids.mAnita, 1_766_900, "BANK", { bankAccount: ACCOUNT_A, bankIfsc: "SBIN0001234" }));
  await saveSalary(ctx, salary(ids.mRamu, 1_200_000, "BANK", { bankAccount: ACCOUNT_R, bankIfsc: "HDFC0004321" }));
  await saveSalary(ctx, salary(ids.mRohan, 1_500_000, "UPI", { upiId: "rohan.k@okaxis" }));
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const workers = (await db.membership.findMany({ where: { schoolId: ids.school, role: "SUPPORT" }, select: { userId: true } })).map((m) => m.userId);
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const all = [...workers, ...users.map((u) => u.id)];
  await db.session.deleteMany({ where: { userId: { in: all } } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { userId: { in: all } }] } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: all } } });
  expect(await db.school.count({ where: { id: ids.school } })).toBe(0);
  await db.$disconnect();
});

describe("QB-06: every answer to Add support staff carries the salary", () => {
  it("⚠ two presses at once with a salary, and a third a moment later: one person, and all three answers say the salary", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const input = { name: "ZZ Sunita Kamble", designation: "Cleaner", phone: "", joinedOnKey: "2026-06-01", salary: { structureId: ids.structure, basicPaise: 1_200_000, paymentMode: "CASH" as const } };
    const [a, b] = await Promise.all([addSupportStaff(ctx, input), addSupportStaff(ctx, input)]);
    expect(a.membershipId).toBe(b.membershipId);
    expect([a.duplicate, b.duplicate].sort()).toEqual([false, true]);
    const later = await addSupportStaff(ctx, input);
    expect(later).toMatchObject({ membershipId: a.membershipId, duplicate: true });
    for (const answer of [a, b, later]) {
      expect(answer.salary?.salary).toMatchObject({ basicPaise: 1_200_000, paymentMode: "CASH", effectiveFrom: "2026-06-01" });
    }
    expect(await db.membership.count({ where: { schoolId: ids.school, role: "SUPPORT" } })).toBe(1);
    expect(await db.staffSalary.count({ where: { membershipId: a.membershipId } })).toBe(1);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "staff.support.add" } })).toBe(1);
    ids.support = a.membershipId;
    ids.supportUser = (await db.membership.findUniqueOrThrow({ where: { id: a.membershipId }, select: { userId: true } })).userId;
  });
});

describe("QB-09: the page's order and the slip references agree", () => {
  it("numbers the slips in the order one comparator lists them, case and accents aside", () => {
    const slips = [
      { membershipId: "m4", staffName: "ZZ Kale" },
      { membershipId: "m2", staffName: "ZZ item12 Ramu" },
      { membershipId: "m1", staffName: "ZZ Anita" },
      { membershipId: "m3", staffName: "ZZ Éva" },
      { membershipId: "m5", staffName: "zz anita" },
    ];
    const ordered = [...slips].sort(compareSlips).map((s) => s.membershipId);
    expect(ordered).toEqual(["m1", "m5", "m3", "m2", "m4"]);
    const refs = slipRefsOf(MONTH, slips);
    expect(ordered.map((m) => refs.get(m))).toEqual(["SAL-202609-001", "SAL-202609-002", "SAL-202609-003", "SAL-202609-004", "SAL-202609-005"]);
  });

  it("lists the run's slips with their references running 001, 002… down the page", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    await draftRun(ctx, MONTH);
    await lockRun(ctx, MONTH);
    const view = await runView(ctx, MONTH);
    expect(view.slips!.map((s) => s.name)).toEqual(["ZZ Anita Rao", "ZZ item12 Ramu Gardener", "ZZ Rohan Kale", "ZZ Sunita Kamble"]);
    expect(view.slips!.map((s) => s.slipRef)).toEqual(["SAL-202609-001", "SAL-202609-002", "SAL-202609-003", "SAL-202609-004"]);
    for (const s of view.slips!) net[s.membershipId] = s.netPaise;
  });
});

describe("QB-07: the bank advice carries the slip reference", () => {
  it("cuts Sr No, name, account, IFSC, amount, narration and Slip Ref, the bytes pinned", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const file = await payrollExport(ctx, MONTH, "BANK_ADVICE");
    const amount = (m: string) => (net[m]! / 100).toFixed(2);
    expect(file.content).toBe(
      "Sr No,Beneficiary Name,Account Number,IFSC,Amount,Narration,Slip Ref\r\n" +
        `1,ZZ Anita Rao,${ACCOUNT_A},SBIN0001234,${amount(ids.mAnita)},SALARY ${MONTH},SAL-202609-001\r\n` +
        `2,ZZ item12 Ramu Gardener,${ACCOUNT_R},HDFC0004321,${amount(ids.mRamu)},SALARY ${MONTH},SAL-202609-002\r\n`,
    );
    expect(file.rows).toBe(2);
  });
});

describe("QB-08: a refused UTR sheet calls no line recorded", () => {
  it("answers WOULD_RECORD for a good line of a sheet refused whole, and writes nothing", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    const csv = ["Slip Ref,UTR,Date", `SAL-202609-001,HDFC111122223333,${PAID_ON}`, `SAL-202609-099,HDFC111122224444,${PAID_ON}`].join("\n");
    const answer = utrSheetAnswerSchema.parse(await importUtrSheet(ctx, MONTH, csv));
    expect(answer).toMatchObject({ accepted: false, recorded: 0, refused: 1 });
    expect(answer.lines.map((l) => l.outcome)).toEqual(["WOULD_RECORD", "REFUSED"]);
    expect(answer.lines.some((l) => l.outcome === "RECORDED")).toBe(false);
    expect(await db.salaryPayment.count({ where: { schoolId: ids.school } })).toBe(0);
  });
});

describe("QB-11: the payroll copy", () => {
  it("refuses an overpayment without calling it a part payment, the net in rupees with grouping", async () => {
    await as(ids.admin, "ADMIN");
    const form = new FormData();
    for (const [k, v] of Object.entries({ month: MONTH, membershipId: ids.mAnita, amountPaise: String(net[ids.mAnita]! + 10_000), mode: "BANK", paidOn: PAID_ON, reference: "SBIN123456789012", note: "" })) form.set(k, v);
    const answer = await recordPaymentAction(FORM_IDLE, form);
    expect(answer).toMatchObject({ ok: false, field: "amountPaise" });
    expect(answer.message).not.toContain("part payment");
    expect(answer.message).toContain("₹17,669.00");
    expect(await db.salaryPayment.count({ where: { schoolId: ids.school } })).toBe(0);
  });

  it("says '1 row' for a file of one line on the run page", async () => {
    const ctx = await as(ids.admin, "ADMIN");
    expect((await payrollExport(ctx, MONTH, "UPI_ADVICE")).rows).toBe(1);
    const html = draw(await PayrollRunPage({ params: Promise.resolve({ month: MONTH }), searchParams: Promise.resolve({}) } as never));
    expect(html).toMatch(/upi-advice-2026-09\.csv: 1 row, by/);
    expect(html).not.toContain(": 1 rows");
    expect(html).toMatch(/bank-advice-2026-09\.csv: 2 rows, by/);
  });
});

describe("QB-10: a support worker is not asked to ask for an advance", () => {
  it("shows no advances card to a support worker with none; a teacher still has the way to ask", async () => {
    await as(ids.supportUser, "SUPPORT");
    const support = draw(await MyPayslipsPage({ searchParams: Promise.resolve({}) }));
    expect(support).toContain("ZZ QbB Flat");
    expect(support).not.toContain("Ask the office for an advance");
    await as(ids.anita, "TEACHER");
    const teacher = draw(await MyPayslipsPage({ searchParams: Promise.resolve({}) }));
    expect(teacher).toContain("Ask the office for an advance");
  });
});
