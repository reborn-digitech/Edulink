/**
 * The bank statement, against the database: a UTR line confirms the UPI
 * claim it matches, a line carrying the EL reference of an intent the
 * family never claimed confirms that intent (one row, never two), a cheque line and a NEFT line are recorded for the
 * pupil whose code is in the narration (CHEQUE and BANK, the statement's
 * reference on the receipt, the statement's date as the day paid), an
 * unknown line and a debit are listed for the office to key, and the same
 * statement imported again records nothing twice. The platform records;
 * it moves nothing (decision 0003, tests/fees-invariants.test.ts).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { saveFeeSettings } from "@/lib/fees";
import { claimUpiPayment, confirmClaim, familyFees, recordCounterPayment, startUpiPayment } from "@/lib/fees-payments";
import { commitBankImport, methodFromNarration, parseStatementAmount, parseStatementDate, previewBankImport, referenceFromLine } from "@/lib/fees-bank-import";
import { AccessError } from "@/lib/tenancy";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
let schoolId = "";
let yearId = "";
let adminUserId = "";
let adminMembershipId = "";
let parentUserId = "";
let pupilA = "";
let pupilB = "";
let claimedPaymentId = "";
const CODE_A = `ZZBKA${STAMP}`;
const CODE_B = `ZZBKB${STAMP}`;
const CHEQUE = String(STAMP).slice(-6);

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return { sessionId: "t", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null, user: { id: over.userId, name: "ZZ Bank", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } };
}
const admin = () => ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" });
const parent = () => ctx({ userId: parentUserId, role: "PARENT" });
const describeError = (e: AccessError) => e.key;

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  schoolId = (await db.school.create({ data: { name: `ZZ Bank School ${STAMP}`, slug: `zz-bank-${STAMP}`, code: `ZBK${String(STAMP).slice(-5)}`, contactEmail: `zz-bank-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  yearId = (await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Bank ${who}`, email: `zz-bank-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, par, pa, pb] = await Promise.all([mk("Admin"), mk("Parent"), mk("PupilA"), mk("PupilB")]);
  adminUserId = a.id;
  parentUserId = par.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  pupilA = (await db.membership.create({ data: { userId: pa.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: CODE_A, gradeLevel: "3" }, select: { id: true } })).id;
  pupilB = (await db.membership.create({ data: { userId: pb.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: CODE_B, gradeLevel: "3" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilA, studentSchoolId: schoolId, status: "ACTIVE" } });
  for (const pupil of [pupilA, pupilB]) {
    await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupil, academicYearId: yearId, label: "Term 1", dueDate: new Date(`${TODAY}T00:00:00.000Z`), grossPaise: 20_000_00, netPaise: 20_000_00, status: "OPEN" } });
    await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupil, academicYearId: yearId, label: "Term 2", dueDate: new Date(`${addDaysToKey(TODAY, 30)}T00:00:00.000Z`), grossPaise: 10_000_00, netPaise: 10_000_00, status: "OPEN" } });
  }
  // Pupil A's family started a UPI payment and claimed it with a UTR; the statement will carry that UTR.
  await saveFeeSettings(admin(), { upiId: "zzbank@okaxis", upiPayee: "ZZ Bank School", receiptPrefix: "rcpt", bankNote: "A/c 1" });
  const fam = await familyFees(parent());
  const start = await startUpiPayment(parent(), { studentMembershipId: pupilA, demandIds: fam.child!.demands.filter((d) => d.label === "Term 1").map((d) => d.id) });
  claimedPaymentId = start.paymentId;
  await claimUpiPayment(parent(), { paymentId: start.paymentId, utr: `UTR${String(STAMP).slice(-12)}` });
  // The office keyed a cheque at the counter last week; the statement shows it clearing.
  await recordCounterPayment(admin(), { studentMembershipId: pupilB, amountPaise: 1_000_00, method: "CHEQUE", reference: `CHQ${CHEQUE}`, paidAtKey: addDaysToKey(TODAY, -7) });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const UTR = () => `UTR${String(STAMP).slice(-12)}`;
const statement = () =>
  [
    "Date,Description,Ref No,Debit,Credit",
    `${TODAY.slice(8, 10)}/${TODAY.slice(5, 7)}/${TODAY.slice(0, 4)},UPI/${UTR()}/ZZ PARENT,${UTR()},,20000.00`,
    `01/09/2026,CLG CHQ ${CODE_B} RAVI,${CHEQUE}2,,5000`,
    `02-09-2026,NEFT ${CODE_A} TERM FEES,N26${String(STAMP).slice(-12)},,"7,500.50"`,
    `03/09/2026,CLG CHQ CLEARED,CHQ${CHEQUE},,1000`,
    `04/09/2026,NEFT UNKNOWN PERSON,N00${String(STAMP).slice(-12)},,250`,
    `05/09/2026,BANK CHARGES,,25.00,`,
    `06/09/2026,NEFT ${CODE_A} NO REF,,,100`,
  ].join("\n");

describe("reading a statement", () => {
  it("amounts, dates, the method off the narration and the reference off the line", () => {
    expect([parseStatementAmount("1,250.50"), parseStatementAmount("₹ 800"), parseStatementAmount("12.345"), parseStatementAmount("0"), parseStatementAmount("")]).toEqual([1_250_50, 800_00, null, null, null]);
    expect([parseStatementDate("02/09/2026"), parseStatementDate("2026-09-02"), parseStatementDate("2 Sep 26"), parseStatementDate("31/02/2026"), parseStatementDate("someday")]).toEqual(["2026-09-02", "2026-09-02", "2026-09-02", null, null]);
    expect([methodFromNarration("CLG CHQ 123", ""), methodFromNarration("UPI/123/x", ""), methodFromNarration("NEFT CR", "N1"), methodFromNarration("", "")]).toEqual(["CHEQUE", "UPI", "BANK", "BANK"]);
    expect([referenceFromLine(" n26-ab ", "x"), referenceFromLine("", "NEFT N260912345678 RAVI"), referenceFromLine("", "CLG CHQ 004512 RAVI"), referenceFromLine("", "nothing here"), referenceFromLine("", "UPI/ELABCDEF123456/412345678901/RAVI")]).toEqual(["N26AB", "N260912345678", "004512", "", "412345678901"]);
  });

  it("previews each line: the UTR confirms the claim, the cheque and the NEFT record for the coded pupil, the cleared cheque is already there, the rest are for the office", async () => {
    const preview = await previewBankImport(admin(), statement());
    expect(preview.lines.map((l) => [l.line, l.outcome, l.method, l.pupilName, l.problemKey])).toEqual([
      [2, "claim", "UPI", "ZZ Bank PupilA", null],
      [3, "new", "CHEQUE", "ZZ Bank PupilB", null],
      [4, "new", "BANK", "ZZ Bank PupilA", null],
      [5, "already", "CHEQUE", "ZZ Bank PupilB", null],
      [6, "unmatched", "BANK", null, "officeBulk.bankNoPupil"],
      [7, "unmatched", "BANK", null, "officeBulk.bankDebit"],
      [8, "unmatched", "BANK", "ZZ Bank PupilA", "fees.refuseReference"],
    ]);
    expect(preview.lines[0]).toMatchObject({ paymentId: claimedPaymentId, amountPaise: 20_000_00, reference: UTR() });
    expect(preview.lines[2]).toMatchObject({ amountPaise: 7_500_50, dateKey: "2026-09-02", reference: `N26${String(STAMP).slice(-12)}` });
    expect(preview.counts).toEqual({ new: 2, claim: 1, already: 1, unmatched: 3 });
    expect(await db.feePayment.count({ where: { schoolId, status: "PAID" } })).toBe(1);
  });

  it("refuses a sheet without a narration or an amount column, and anyone but the office", async () => {
    await expect(previewBankImport(admin(), "a,b\n1,2\n")).rejects.toThrow("officeBulk.bankNeedColumns");
    await expect(previewBankImport(admin(), "Description\nx\n")).rejects.toThrow("officeBulk.bankNeedAmount");
    await expect(previewBankImport(ctx({ userId: adminUserId, membershipId: "x", schoolId, role: "PRINCIPAL" }), statement())).rejects.toThrow("fees.refuseOffice");
  });
});

describe("recording it", () => {
  it("records the matched lines through the counter, confirms the claim, and the second import of the same statement records nothing", async () => {
    const first = await commitBankImport(admin(), statement(), describeError);
    expect(first).toEqual({ recorded: 2, confirmed: 1, already: 1, unmatched: 3, failed: [] });
    const paid = await db.feePayment.findMany({ where: { schoolId, status: "PAID" }, orderBy: { createdAt: "asc" }, select: { method: true, reference: true, amountPaise: true, paidAt: true, studentMembershipId: true, receipt: { select: { serial: true } }, clientId: true } });
    expect(paid.map((p) => [p.method, p.reference, p.amountPaise, p.studentMembershipId])).toEqual([
      ["UPI", UTR(), 20_000_00, pupilA],
      ["CHEQUE", `CHQ${CHEQUE}`, 1_000_00, pupilB],
      ["CHEQUE", `${CHEQUE}2`, 5_000_00, pupilB],
      ["BANK", `N26${String(STAMP).slice(-12)}`, 7_500_50, pupilA],
    ]);
    expect(paid[3]!.paidAt?.toISOString()).toBe("2026-09-02T00:00:00.000Z");
    expect(paid[3]!.clientId).toBe(`bank:N26${String(STAMP).slice(-12)}`);
    expect(paid.every((p) => p.receipt?.serial)).toBe(true);
    const demandsA = await db.feeDemand.findMany({ where: { schoolId, studentMembershipId: pupilA }, orderBy: { dueDate: "asc" }, select: { paidPaise: true, status: true } });
    expect(demandsA.map((d) => [d.paidPaise, d.status])).toEqual([
      [20_000_00, "PAID"],
      [7_500_50, "PART"],
    ]);

    const second = await commitBankImport(admin(), statement(), describeError);
    expect(second).toEqual({ recorded: 0, confirmed: 0, already: 4, unmatched: 3, failed: [] });
    expect(await db.feePayment.count({ where: { schoolId, status: "PAID" } })).toBe(4);
    expect(await db.auditLog.count({ where: { schoolId, action: "fees.bankImport" } })).toBe(2);
  });

  it("a line whose amount differs from the claim it names is left for the office, a future date is refused, and a line past the pupil's dues is reported, not kept as credit", async () => {
    const utr = `UTR9${String(STAMP).slice(-11)}`;
    const fam = await familyFees(parent());
    const start = await startUpiPayment(parent(), { studentMembershipId: pupilA, demandIds: fam.child!.demands.filter((d) => d.label === "Term 2").map((d) => d.id) });
    await db.feePayment.update({ where: { id: start.paymentId }, data: { status: "CLAIMED", reference: utr, claimedAt: new Date() } });
    const tomorrow = addDaysToKey(TODAY, 1);
    const preview = await previewBankImport(admin(), `Date,Narration,Reference,Amount\n01/09/2026,UPI,${utr},1.00\n${tomorrow},NEFT ${CODE_B},N77${String(STAMP).slice(-12)},10\n`);
    expect(preview.lines.map((l) => [l.outcome, l.problemKey])).toEqual([
      ["unmatched", "fees.matchAmountDiffers"],
      ["unmatched", "fees.refuseDate"],
    ]);
    const over = await commitBankImport(admin(), `Date,Narration,Reference,Amount\n01/09/2026,NEFT ${CODE_A} TOO MUCH,N88${String(STAMP).slice(-12)},99999\n`, describeError);
    expect(over).toEqual({ recorded: 0, confirmed: 0, already: 0, unmatched: 0, failed: [{ line: 2, error: "fees.refuseOverpayment" }] });
    expect(await db.feePayment.count({ where: { schoolId, status: "PAID" } })).toBe(4);
  });
});

describe("a UPI intent the family never claimed", () => {
  let pupilC = "";
  let term1 = "";
  let term2 = "";
  const UTR_C = `UTRC${String(STAMP).slice(-12)}`;
  const line = (reference: string, utr: string, amount: string) => `Date,Description,Ref No,Credit\n${TODAY.slice(8, 10)}/${TODAY.slice(5, 7)}/${TODAY.slice(0, 4)},UPI/${reference}/ZZ PARENT,${utr},${amount}\n`;

  beforeAll(async () => {
    const pc = await db.user.create({ data: { name: "ZZ Bank PupilC", email: `zz-bank-pupilc-${STAMP}@test.invalid` }, select: { id: true } });
    pupilC = (await db.membership.create({ data: { userId: pc.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZZBKC${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
    await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilC, studentSchoolId: schoolId, status: "ACTIVE" } });
    term1 = (await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupilC, academicYearId: yearId, label: "Term 1", dueDate: new Date(`${TODAY}T00:00:00.000Z`), grossPaise: 3_000_00, netPaise: 3_000_00, status: "OPEN" }, select: { id: true } })).id;
    term2 = (await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupilC, academicYearId: yearId, label: "Term 2", dueDate: new Date(`${addDaysToKey(TODAY, 30)}T00:00:00.000Z`), grossPaise: 4_000_00, netPaise: 4_000_00, status: "OPEN" }, select: { id: true } })).id;
  });

  it("is confirmed by the statement line carrying its EL reference: one payment row, PAID with its receipt, the demand PAID, and a re-import records nothing", async () => {
    const start = await startUpiPayment(parent(), { studentMembershipId: pupilC, demandIds: [term1] });
    expect(await db.feePayment.findUniqueOrThrow({ where: { id: start.paymentId }, select: { status: true } })).toEqual({ status: "INITIATED" });
    const csv = line(start.reference, UTR_C, "3000.00");

    const preview = await previewBankImport(admin(), csv);
    expect(preview.lines.map((l) => [l.outcome, l.paymentId, l.pupilName, l.reference, l.problemKey])).toEqual([["claim", start.paymentId, "ZZ Bank PupilC", UTR_C, null]]);

    const first = await commitBankImport(admin(), csv, describeError);
    expect(first).toEqual({ recorded: 0, confirmed: 1, already: 0, unmatched: 0, failed: [] });
    const rows = await db.feePayment.findMany({ where: { schoolId, studentMembershipId: pupilC }, select: { id: true, status: true, method: true, reference: true, note: true, amountPaise: true, confirmedByUserId: true, receipt: { select: { serial: true } } } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: start.paymentId, status: "PAID", method: "UPI", reference: UTR_C, note: start.reference, amountPaise: 3_000_00, confirmedByUserId: adminUserId });
    expect(rows[0]!.receipt?.serial).toBeTruthy();
    expect(await db.feeDemand.findUniqueOrThrow({ where: { id: term1 }, select: { paidPaise: true, status: true } })).toEqual({ paidPaise: 3_000_00, status: "PAID" });
    expect(await db.auditLog.count({ where: { schoolId, action: "fees.claimConfirm", targetId: start.paymentId } })).toBe(1);

    const second = await commitBankImport(admin(), csv, describeError);
    expect(second).toEqual({ recorded: 0, confirmed: 0, already: 1, unmatched: 0, failed: [] });
    expect(await db.feePayment.count({ where: { schoolId, studentMembershipId: pupilC } })).toBe(1);
  });

  it("is left for the office when the line's amount differs from the intent's", async () => {
    const start = await startUpiPayment(parent(), { studentMembershipId: pupilC, demandIds: [term2] });
    const csv = line(start.reference, `UTRD${String(STAMP).slice(-12)}`, "3999.00");
    const preview = await previewBankImport(admin(), csv);
    expect(preview.lines.map((l) => [l.outcome, l.paymentId, l.problemKey])).toEqual([["unmatched", start.paymentId, "fees.matchAmountDiffers"]]);
    const result = await commitBankImport(admin(), csv, describeError);
    expect(result).toEqual({ recorded: 0, confirmed: 0, already: 0, unmatched: 1, failed: [] });
    expect(await db.feePayment.findUniqueOrThrow({ where: { id: start.paymentId }, select: { status: true, reference: true } })).toEqual({ status: "INITIATED", reference: null });
    expect(await db.feePayment.count({ where: { schoolId, studentMembershipId: pupilC } })).toBe(2);
    expect(await db.feeDemand.findUniqueOrThrow({ where: { id: term2 }, select: { paidPaise: true, status: true } })).toEqual({ paidPaise: 0, status: "OPEN" });
  });

  it("a line naming an intent the family CLAIMED under another UTR is left for the office: the family's UTR stands and no second row is written", async () => {
    const start = await startUpiPayment(parent(), { studentMembershipId: pupilC, demandIds: [term2] });
    const theirs = `UTRX${String(STAMP).slice(-12)}`;
    await claimUpiPayment(parent(), { paymentId: start.paymentId, utr: theirs });
    const csv = line(start.reference, `UTRY${String(STAMP).slice(-12)}`, "4000.00");
    const preview = await previewBankImport(admin(), csv);
    expect(preview.lines.map((l) => [l.outcome, l.paymentId, l.pupilName, l.problemKey])).toEqual([["unmatched", start.paymentId, "ZZ Bank PupilC", "fees.matchClaimedOtherReference"]]);
    const result = await commitBankImport(admin(), csv, describeError);
    expect(result).toEqual({ recorded: 0, confirmed: 0, already: 0, unmatched: 1, failed: [] });
    expect(await db.feePayment.findUniqueOrThrow({ where: { id: start.paymentId }, select: { status: true, reference: true } })).toEqual({ status: "CLAIMED", reference: theirs });
    expect(await db.feePayment.count({ where: { schoolId, studentMembershipId: pupilC } })).toBe(3);
    expect(await db.feeDemand.findUniqueOrThrow({ where: { id: term2 }, select: { paidPaise: true, status: true } })).toEqual({ paidPaise: 0, status: "OPEN" });
  });

  it("the office's own confirm still refuses an unclaimed intent without a statement", async () => {
    const pending = await db.feePayment.findFirstOrThrow({ where: { schoolId, studentMembershipId: pupilC, status: "INITIATED" }, select: { id: true } });
    await expect(confirmClaim(admin(), pending.id)).rejects.toThrow("fees.refuseNotClaimed");
  });
});
