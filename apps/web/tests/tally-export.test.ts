/**
 * THE TALLY EXPORT (the risks batch, R-2, package 5B, 5 October 2026), at a
 * school of this suite's own with its receipts, a refund, a reversed payment
 * and a locked payroll month written directly.
 *
 * What is proved: the receipts of a span become Receipt vouchers in Tally's
 * XML import shape (ENVELOPE / Import Data / Vouchers; a debit
 * ISDEEMEDPOSITIVE Yes with a negative AMOUNT), Cash or Bank debited and each
 * fee head credited as the frozen receipt states it; a reversed receipt is
 * left out and counted; a refund paid back is a Payment voucher; the CSV day
 * book carries the same lines; every voucher sums to zero; a locked payroll
 * month is one balanced Journal voucher and a draft month is refused; the
 * office and the accounts desk alone may export (the door refuses the rest
 * before the query), payroll needs its module, and each file is audited
 * with no person's name or amount.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { tallyCsv, tallyPayroll, tallyReceipts } from "@/lib/tally-export";
import { GET as receiptsGet } from "@/app/api/v1/tally/receipts/route";
import { GET as payrollGet } from "@/app/api/v1/tally/payroll/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tally-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  return (await getSession()) as ActiveContext;
}
async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ Tally ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role, status: "ACTIVE" }, select: { id: true } })).id;
}
const snapshot = (lines: { head: string; amountPaise: number }[]) => JSON.stringify({ pupil: { name: "ZZ Tally Pupil" }, lines: lines.map((l) => ({ demandLabel: "Term 1", head: l.head, code: l.head.slice(0, 3).toUpperCase(), amountPaise: l.amountPaise })) });
const sums = (xml: string) =>
  [...xml.matchAll(/<VOUCHER [\s\S]*?<\/VOUCHER>/g)].map((m) => [...m[0].matchAll(/<AMOUNT>(-?[\d.]+)<\/AMOUNT>/g)].reduce((a, x) => a + Math.round(Number(x[1]) * 100), 0));

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ Tally Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { name: `ZZ Tally School ${STAMP}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata" });
  if (!made.ok) throw new Error(made.errorKey);
  ids.school = made.schoolId;
  await db.school.update({ where: { id: ids.school }, data: { isTestFixture: true } });
  for (const [who, role] of [["admin", "ADMIN"], ["principal", "PRINCIPAL"], ["teacher", "TEACHER"], ["pupil", "STUDENT"]] as const) await person(who, role);
  const year = await db.academicYear.create({ data: { schoolId: ids.school!, name: "2026–27", startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: true }, select: { id: true } });
  const pay = async (n: number, method: string, status: string, amountPaise: number, paidAt: string, lines: { head: string; amountPaise: number }[]) => {
    const p = await db.feePayment.create({ data: { schoolId: ids.school!, studentMembershipId: ids.pupilM!, amountPaise, method, status, paidAt: new Date(paidAt), reference: method === "CASH" ? null : `UTR${n}` }, select: { id: true } });
    await db.feeReceipt.create({ data: { schoolId: ids.school!, paymentId: p.id, academicYearId: year.id, number: n, serial: `RCPT/2026-27/00000${n}`, issuedAt: new Date(paidAt), snapshotJson: snapshot(lines) } });
    return p.id;
  };
  await pay(1, "CASH", "PAID", 1_200_000, "2026-09-02T05:00:00Z", [{ head: "Tuition", amountPaise: 1_000_000 }, { head: "Library", amountPaise: 200_000 }]);
  ids.upi = await pay(2, "UPI", "PAID", 500_000, "2026-09-03T05:00:00Z", [{ head: "Tuition", amountPaise: 500_000 }]);
  await pay(3, "CASH", "REVERSED", 300_000, "2026-09-04T05:00:00Z", [{ head: "Tuition", amountPaise: 300_000 }]);
  await db.feeRefund.create({ data: { schoolId: ids.school!, paymentId: ids.upi!, amountPaise: 100_000, reason: "ZZ overpaid", status: "DONE", requestedByUserId: ids.admin!, settledAt: new Date("2026-09-10T05:00:00Z") } });
  // Payroll: on, one locked month and one draft.
  await db.schoolModule.create({ data: { schoolId: ids.school!, module: "PAYROLL" } });
  const slip = (runId: string) =>
    db.payslip.create({
      data: {
        schoolId: ids.school!,
        runId,
        membershipId: ids.teacherM!,
        staffName: "ZZ Tally Teacher",
        department: "Teaching",
        daysInMonth: 31,
        grossPaise: 3_000_000,
        deductionsPaise: 420_000,
        employerPaise: 180_000,
        netPaise: 2_580_000,
        linesJson: JSON.stringify([
          { code: "BASIC", kind: "EARNING", label: "Basic", paise: 1_500_000 },
          { code: "HRA", kind: "EARNING", label: "HRA", paise: 1_500_000 },
          { code: "PF_EMPLOYEE", kind: "DEDUCTION", label: "PF", paise: 180_000 },
          { code: "PT", kind: "DEDUCTION", label: "PT", paise: 20_000 },
          { code: "TDS", kind: "DEDUCTION", label: "TDS", paise: 220_000 },
          { code: "PF_EMPLOYER", kind: "EMPLOYER_CONTRIBUTION", label: "PF (employer)", paise: 180_000 },
        ]),
      },
    });
  const locked = await db.payrollRun.create({ data: { schoolId: ids.school!, month: "2026-08", status: "LOCKED", headcount: 1, grossPaise: 3_000_000, deductionsPaise: 420_000, employerPaise: 180_000, netPaise: 2_580_000, lockedAt: new Date() }, select: { id: true } });
  await slip(locked.id);
  const draft = await db.payrollRun.create({ data: { schoolId: ids.school!, month: "2026-09", status: "DRAFT" }, select: { id: true } });
  await slip(draft.id);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.session.deleteMany({ where: { userId: { in: users.map((u) => u.id) } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { targetId: ids.school }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the receipts as Tally vouchers", () => {
  it("writes Tally's XML import envelope with balanced Receipt and Payment vouchers, the reversed one left out", async () => {
    const admin = await as("admin", "ADMIN");
    const file = await tallyReceipts(admin, "2026-09-01", "2026-09-30", "XML");
    expect(file.content).toContain("<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME>");
    expect(file.vouchers).toBe(3);
    expect(file.skipped).toBe(1);
    expect(file.content).not.toContain("RCPT/2026-27/000003");
    // The cash receipt: Cash debited 12,000.00, Tuition and Library credited.
    const first = /<VOUCHER VCHTYPE="Receipt"[\s\S]*?RCPT\/2026-27\/000001[\s\S]*?<\/VOUCHER>/.exec(file.content)![0];
    expect(first).toContain("<DATE>20260902</DATE>");
    expect(first).toContain("<LEDGERNAME>Cash</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-12000.00</AMOUNT>");
    expect(first).toContain("<LEDGERNAME>Fees - Tuition</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>10000.00</AMOUNT>");
    expect(first).toContain("<LEDGERNAME>Fees - Library</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>2000.00</AMOUNT>");
    // The UPI receipt goes to the bank; the refund on it is a Payment voucher.
    expect(file.content).toMatch(/RCPT\/2026-27\/000002[\s\S]*?<LEDGERNAME>Bank<\/LEDGERNAME><ISDEEMEDPOSITIVE>Yes<\/ISDEEMEDPOSITIVE><AMOUNT>-5000.00<\/AMOUNT>/);
    expect(file.content).toMatch(/<VOUCHER VCHTYPE="Payment"[\s\S]*?REFUND-RCPT\/2026-27\/000002[\s\S]*?<LEDGERNAME>Fee refunds<\/LEDGERNAME><ISDEEMEDPOSITIVE>Yes<\/ISDEEMEDPOSITIVE><AMOUNT>-1000.00<\/AMOUNT>/);
    expect(sums(file.content)).toEqual([0, 0, 0]);
    const audit = await db.auditLog.findFirstOrThrow({ where: { schoolId: ids.school, action: "tally.export" }, orderBy: { createdAt: "desc" } });
    expect(audit.meta).not.toContain("ZZ Tally Pupil");
  });

  it("writes the same lines as a CSV day book, and refuses a span backwards or longer than a year", async () => {
    const admin = await as("admin", "ADMIN");
    const csv = await tallyReceipts(admin, "2026-09-01", "2026-09-30", "CSV");
    expect(csv.content.split("\r\n")[0]).toBe("date,voucher_type,voucher_number,ledger,debit,credit,narration");
    expect(csv.content).toContain("02-09-2026,Receipt,RCPT/2026-27/000001,Cash,12000.00,,");
    expect(tallyCsv([])).toBe("date,voucher_type,voucher_number,ledger,debit,credit,narration\r\n");
    await expect(tallyReceipts(admin, "2026-09-30", "2026-09-01", "XML")).rejects.toMatchObject({ key: "tally.refuseRange" });
    await expect(tallyReceipts(admin, "2025-01-01", "2026-09-01", "XML")).rejects.toMatchObject({ key: "tally.refuseRangeTooLong" });
  });

  it("is the office's and the accounts desk's alone, refused at the door before the query", async () => {
    await as("teacher", "TEACHER");
    expect((await receiptsGet(new Request("http://localhost/api/v1/tally/receipts?from=bad"))).status).toBe(403);
    await as("principal", "PRINCIPAL");
    expect((await payrollGet(new Request("http://localhost/api/v1/tally/payroll?month=2026-08"))).status).toBe(403);
    await as("admin", "ADMIN");
    const res = await receiptsGet(new Request("http://localhost/api/v1/tally/receipts?from=2026-09-01&to=2026-09-30&format=XML"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/xml");
    expect((await receiptsGet(new Request("http://localhost/api/v1/tally/receipts?from=bad"))).status).toBe(422);
  });
});

describe("a payroll month as a Tally journal", () => {
  it("is one balanced Journal voucher for a locked month, and a draft month is refused", async () => {
    const admin = await as("admin", "ADMIN");
    const file = await tallyPayroll(admin, "2026-08", "XML");
    expect(file.vouchers).toBe(1);
    expect(file.content).toContain('<VOUCHER VCHTYPE="Journal" ACTION="Create"><DATE>20260831</DATE>');
    expect(file.content).toContain("<LEDGERNAME>Salaries and wages</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-30000.00</AMOUNT>");
    expect(file.content).toContain("<LEDGERNAME>Employer contributions</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-1800.00</AMOUNT>");
    expect(file.content).toContain("<LEDGERNAME>Salaries payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>25800.00</AMOUNT>");
    // The employee's and the employer's PF together on one liability.
    expect(file.content).toContain("<LEDGERNAME>PF payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>3600.00</AMOUNT>");
    expect(sums(file.content)).toEqual([0]);
    await expect(tallyPayroll(admin, "2026-09", "XML")).rejects.toMatchObject({ key: "tally.refuseNotLocked" });
  });

  it("needs the payroll module on", async () => {
    await db.schoolModule.deleteMany({ where: { schoolId: ids.school, module: "PAYROLL" } });
    const admin = await as("admin", "ADMIN");
    await expect(tallyPayroll(admin, "2026-08", "XML")).rejects.toMatchObject({ code: "MODULE_OFF" });
  });
});
