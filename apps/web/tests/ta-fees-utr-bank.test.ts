/**
 * The fees batch of the testing analysis of 13 November 2026: one bank credit, one payment.
 *
 *   TA-255  "one UTR, one payment" was a read, not a rule: a refunded UTR could be claimed again, two claims at once
 *           both passed, and the counter took a UTR a claim already stood for.
 *   TA-259  the bank import said "already recorded" by the reference alone, and picked one of two rows that share
 *           a reference by chance.
 *   TA-336  the bank import read a debit as a credit on a statement with one amount column.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { saveFeeSettings } from "@/lib/fees";
import { claimUpiPayment, confirmClaim, recordCounterPayment, requestRefund, startUpiPayment } from "@/lib/fees-payments";
import { parseStatementAmount, previewBankImport } from "@/lib/fees-bank-import";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tafees-utr-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const CODE_A = `ZTUA${SUFFIX}`;
const CODE_B = `ZTUB${SUFFIX}`;

function ctx(userId: string, role: ActiveContext["role"], schoolId: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.school!, ids.adminM!);
const parent = () => ctx(ids.parent!, "PARENT", null);
let dueDay = 0;
/** A fresh open demand of ₹2,500 for the pupil, due on a day of its own. */
async function due(studentMembershipId: string, paise = 2_500_00): Promise<string> {
  dueDay += 1;
  return (await db.feeDemand.create({ data: { schoolId: ids.school!, studentMembershipId, academicYearId: ids.year!, label: `ZZ Due ${dueDay}`, dueDate: new Date(Date.UTC(2026, 5, dueDay)), grossPaise: paise, netPaise: paise, status: "OPEN" }, select: { id: true } })).id;
}
const utr = (n: number) => `ZZUTR${SUFFIX}${String(n).padStart(4, "0")}`;

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TAF UTR ${STAMP}`, slug: `zz-taf-utr-${STAMP}`, code: `ZTU${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  for (const who of ["admin", "parent", "pupilA", "pupilB"]) ids[who] = (await db.user.create({ data: { name: `ZZ TAF UTR ${who}`, email: mail(who) }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.a = (await db.membership.create({ data: { userId: ids.pupilA!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: CODE_A }, select: { id: true } })).id;
  ids.b = (await db.membership.create({ data: { userId: ids.pupilB!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: CODE_B }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.a, studentSchoolId: ids.school, status: "ACTIVE" } });
  await saveFeeSettings(admin(), { upiId: "zzutr@okaxis", upiPayee: "ZZ UTR School" });
}, 60_000);

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
}, 60_000);

describe("TA-255: one UTR, one payment", { timeout: 60_000 }, () => {
  it("TA-255: a UTR whose payment was refunded in full cannot be claimed again for another term", async () => {
    const first = await startUpiPayment(parent(), { studentMembershipId: ids.a!, demandIds: [await due(ids.a!)] });
    await claimUpiPayment(parent(), { paymentId: first.paymentId, utr: utr(1) });
    await confirmClaim(admin(), first.paymentId);
    await requestRefund(admin(), { paymentId: first.paymentId, amountPaise: first.amountPaise, reason: "Paid for the wrong term" });
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: first.paymentId }, select: { status: true } })).status).toBe("REFUNDED");
    const next = await startUpiPayment(parent(), { studentMembershipId: ids.a!, demandIds: [await due(ids.a!)] });
    await expect(claimUpiPayment(parent(), { paymentId: next.paymentId, utr: utr(1) })).rejects.toThrow("fees.refuseUtrUsed");
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: next.paymentId }, select: { status: true } })).status).toBe("INITIATED");
  });

  it("TA-255: two claims sent together with one UTR: one stands and the other is refused", async () => {
    for (let round = 0; round < 4; round += 1) {
      const one = await startUpiPayment(parent(), { studentMembershipId: ids.a!, demandIds: [await due(ids.a!)] });
      const two = await startUpiPayment(parent(), { studentMembershipId: ids.a!, demandIds: [await due(ids.a!)] });
      const results = await Promise.allSettled([claimUpiPayment(parent(), { paymentId: one.paymentId, utr: utr(10 + round) }), claimUpiPayment(parent(), { paymentId: two.paymentId, utr: utr(10 + round) })]);
      expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
      expect(results.filter((r) => r.status === "rejected").map((r) => ((r as PromiseRejectedResult).reason as Error).message)).toEqual(["fees.refuseUtrUsed"]);
      expect(await db.feePayment.count({ where: { schoolId: ids.school, reference: utr(10 + round), status: "CLAIMED" } })).toBe(1);
    }
  });

  it("TA-255: the counter refuses a UTR, whatever its case, that a confirmed claim already stands for; a cheque number is not looked at", async () => {
    const claim = await startUpiPayment(parent(), { studentMembershipId: ids.a!, demandIds: [await due(ids.a!)] });
    await claimUpiPayment(parent(), { paymentId: claim.paymentId, utr: utr(20) });
    await confirmClaim(admin(), claim.paymentId);
    await due(ids.b!);
    await expect(recordCounterPayment(admin(), { studentMembershipId: ids.b!, amountPaise: 2_500_00, method: "BANK", reference: utr(20).toLowerCase() })).rejects.toThrow("fees.refuseUtrUsed");
    await expect(recordCounterPayment(admin(), { studentMembershipId: ids.b!, amountPaise: 2_500_00, method: "UPI", reference: utr(20) })).rejects.toThrow("fees.refuseUtrUsed");
    // And a claim whose UTR the counter already recorded is not confirmed a second time.
    await recordCounterPayment(admin(), { studentMembershipId: ids.b!, amountPaise: 2_500_00, method: "BANK", reference: utr(21) });
    const late = await startUpiPayment(parent(), { studentMembershipId: ids.a!, demandIds: [await due(ids.a!)] });
    await db.feePayment.update({ where: { id: late.paymentId }, data: { status: "CLAIMED", reference: utr(21), claimedAt: new Date() } });
    await expect(confirmClaim(admin(), late.paymentId)).rejects.toThrow("fees.refuseUtrUsed");
  });
});

describe("TA-259: the bank import's 'already recorded'", { timeout: 60_000 }, () => {
  it("TA-259: a cheque number on another pupil's payment, with another amount, is a problem for the office, not 'already'", async () => {
    await due(ids.b!, 1_000_00);
    await recordCounterPayment(admin(), { studentMembershipId: ids.b!, amountPaise: 1_000_00, method: "CHEQUE", reference: "004512" });
    await due(ids.a!, 5_000_00);
    const preview = await previewBankImport(admin(), ["Date,Description,Ref No,Credit", `02/09/2026,CLG CHQ ${CODE_A} RAVI,004512,5000.00`].join("\n"));
    expect(preview.lines.map((l) => [l.outcome, l.problemKey, l.studentMembershipId])).toEqual([["unmatched", "fees.matchReferenceElsewhere", ids.a]]);
  });

  it("TA-259: of a FAILED claim and a counter payment sharing a UTR, the one that stands for money answers the line, whichever was read last", async () => {
    await due(ids.a!, 1_200_00);
    const counter = await recordCounterPayment(admin(), { studentMembershipId: ids.a!, amountPaise: 1_200_00, method: "BANK", reference: utr(30) });
    // The rejected claim keeps its UTR, written after the counter row.
    await db.feePayment.create({ data: { schoolId: ids.school!, studentMembershipId: ids.a!, amountPaise: 1_200_00, method: "UPI", status: "FAILED", reference: utr(30), failedReason: "No such credit", payerUserId: ids.parent! } });
    await due(ids.a!, 1_200_00);
    const preview = await previewBankImport(admin(), ["Date,Description,Ref No,Credit", `03/09/2026,NEFT ${CODE_A} FEES,${utr(30)},1200.00`].join("\n"));
    expect(preview.lines.map((l) => [l.outcome, l.paymentId])).toEqual([["already", counter.paymentId]]);
  });
});

describe("TA-336: debits on a statement with one amount column", { timeout: 60_000 }, () => {
  it("TA-336: an amount marked Dr is not a credit", () => {
    expect([parseStatementAmount("2,500.00 Dr"), parseStatementAmount("Dr 2500"), parseStatementAmount("2500.00DR"), parseStatementAmount("7,500.00 Cr"), parseStatementAmount("7500")]).toEqual([null, null, null, 7_500_00, 7_500_00]);
  });

  it("TA-336: a line marked DR, in its amount or in a Type or Dr/Cr column, is a debit and records nothing for the pupil it names", async () => {
    await due(ids.a!, 2_500_00);
    const typed = await previewBankImport(admin(), ["Date,Narration,Ref No,Amount,Type", `04/09/2026,NEFT REFUND ${CODE_A},N4${SUFFIX}DR01,2500.00,DR`, `04/09/2026,NEFT ${CODE_A} FEES,N4${SUFFIX}CR01,2500.00,CR`].join("\n"));
    expect(typed.lines.map((l) => [l.outcome, l.problemKey])).toEqual([
      ["unmatched", "officeBulk.bankDebit"],
      ["new", null],
    ]);
    const marked = await previewBankImport(admin(), ["Date,Narration,Ref No,Amount", `05/09/2026,NEFT REFUND ${CODE_A},N5${SUFFIX}DR01,"2,500.00 Dr"`].join("\n"));
    expect(marked.lines.map((l) => [l.outcome, l.problemKey])).toEqual([["unmatched", "officeBulk.bankDebit"]]);
    const drcr = await previewBankImport(admin(), ["Date,Narration,Ref No,Amount,Dr/Cr", `06/09/2026,NEFT ${CODE_A} FEES,N6${SUFFIX}CR01,2500.00,Cr`, `06/09/2026,NEFT REFUND ${CODE_A},N6${SUFFIX}DR01,2500.00,Dr`].join("\n"));
    expect(drcr.lines.map((l) => [l.outcome, l.amountPaise, l.problemKey])).toEqual([
      ["new", 2_500_00, null],
      ["unmatched", 2_500_00, "officeBulk.bankDebit"],
    ]);
  });
});
