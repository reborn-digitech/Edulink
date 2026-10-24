/**
 * QA-06 (QA campaign of 24 October 2026, F-1 of layer 6): the checkout's
 * confirm and the gateway's webhook settling one payment at the same moment.
 * Razorpay hands the browser its handler and posts the webhook within
 * milliseconds of each other, and the guardian who had just paid was told
 * "Nothing is due to pay." (403) while the webhook settled. Two confirms at
 * once (a double tap) did the same.
 *
 * The cause: `settle` read the payment before taking any lock, so the loser
 * read INITIATED, waited on the winner's row, then went on to allocate money
 * the winner had already allocated: "nothing due" when the pupil owed nothing
 * else, and with another demand still open the same money allocated a second
 * time to it and a second receipt attempted for one payment.
 *
 * Now the payment row is locked first and read again under the lock: the
 * loser finds it PAID and is told "already", with the winner's receipt.
 * Each round fires the two together in both orders; the pupil always owes a
 * second demand so a double allocation would show.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { saveGatewayAccount } from "@/lib/fees";
import { confirmOnlineCheckout, startOnlineCheckout } from "@/lib/fees-payments";
import { signCheckout, signWebhookBody } from "@/lib/gateway";
import { POST as schoolHook } from "@/app/api/webhooks/razorpay/[schoolId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const KEY_SECRET = `zz-fixma-key-${SUFFIX}`;
const HOOK_SECRET = `zz-fixma-hook-${SUFFIX}`;
const mail = (who: string) => `zz-fixma-settle-${who}-${STAMP}@test.invalid`;
const ids = { school: "", year: "", admin: "", adminM: "", parent: "" };

function ctx(userId: string, role: ActiveContext["role"], school: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId: school, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}

let pupils = 0;
/** A pupil owing two terms; the guardian opens a checkout for the first. */
async function openOrder(owesMore = true) {
  pupils += 1;
  const user = await db.user.create({ data: { name: `ZZ FixMA Pupil ${pupils}`, email: mail(`pupil${pupils}`), isTestFixture: true }, select: { id: true } });
  const pupil = (await db.membership.create({ data: { userId: user.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZFMS${SUFFIX}${pupils}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.parent, studentMembershipId: pupil, studentSchoolId: ids.school, status: "ACTIVE" } });
  const demand = async (label: string, paise: number) => (await db.feeDemand.create({ data: { schoolId: ids.school, studentMembershipId: pupil, academicYearId: ids.year, label, dueDate: new Date(`2026-1${pupils % 3}-01T00:00:00Z`), grossPaise: paise, netPaise: paise, status: "OPEN" }, select: { id: true } })).id;
  const term2 = await demand("ZZ Term 2", 12_500_00);
  const term3 = owesMore ? await demand("ZZ Term 3", 12_500_00) : null;
  const start = await startOnlineCheckout(ctx(ids.parent, "PARENT", null), { studentMembershipId: pupil, demandIds: [term2] });
  return { pupil, term2, term3, paymentId: start.paymentId, orderId: start.orderId!, amountPaise: start.amountPaise };
}

function confirm(o: { paymentId: string; orderId: string }, gatewayPaymentId: string) {
  return confirmOnlineCheckout(ctx(ids.parent, "PARENT", null), { paymentId: o.paymentId, gatewayPaymentId, signature: signCheckout(KEY_SECRET, o.orderId, gatewayPaymentId) });
}
async function webhook(o: { orderId: string; amountPaise: number }, gatewayPaymentId: string) {
  const body = JSON.stringify({ id: `evt_${gatewayPaymentId}`, event: "payment.captured", payload: { payment: { entity: { id: gatewayPaymentId, order_id: o.orderId, amount: o.amountPaise, method: "upi" } } } });
  const res = await schoolHook(new Request(`http://localhost/api/webhooks/razorpay/${ids.school}`, { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": signWebhookBody(HOOK_SECRET, body) }, body }), { params: Promise.resolve({ schoolId: ids.school }) });
  return { status: res.status, body: (await res.json()) as { ok?: boolean; outcome?: string } };
}

/** The payment PAID once: one receipt, Term 2 paid, Term 3 untouched. */
async function expectSettledOnce(o: Awaited<ReturnType<typeof openOrder>>) {
  const payment = await db.feePayment.findUniqueOrThrow({ where: { id: o.paymentId }, include: { allocations: true, receipt: true } });
  expect(payment.status).toBe("PAID");
  expect(payment.receipt).not.toBeNull();
  expect(payment.allocations.map((a) => [a.demandId, a.amountPaise])).toEqual([[o.term2, 12_500_00]]);
  expect(await db.feeReceipt.count({ where: { payment: { studentMembershipId: o.pupil } } })).toBe(1);
  const t2 = await db.feeDemand.findUniqueOrThrow({ where: { id: o.term2 } });
  expect([t2.status, t2.paidPaise]).toEqual(["PAID", 12_500_00]);
  if (o.term3) {
    const t3 = await db.feeDemand.findUniqueOrThrow({ where: { id: o.term3 } });
    expect([t3.status, t3.paidPaise]).toEqual(["OPEN", 0]);
  }
  return payment.receipt!.id;
}

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  delete process.env.FEES_GATEWAY_TRANSPORT;
  ids.school = (await db.school.create({ data: { name: `ZZ FixMA Settle ${STAMP}`, slug: `zz-fixma-settle-${STAMP}`, code: `ZFM${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ FixMA Admin", email: mail("admin"), isTestFixture: true }, select: { id: true } })).id;
  ids.parent = (await db.user.create({ data: { name: "ZZ FixMA Parent", email: mail("parent"), isTestFixture: true }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  await saveGatewayAccount(ctx(ids.admin, "ADMIN", ids.school, ids.adminM), { keyId: `rzp_test_zzfixma${SUFFIX}`, secret: KEY_SECRET, webhookSecret: HOOK_SECRET, mode: "TEST" });
});

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.gatewayEvent.deleteMany({ where: { schoolId: ids.school } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
});

describe("QA-06: the confirm and the webhook settling one payment together", { timeout: 30_000 }, () => {
  for (const [round, order, owesMore] of [
    [1, "webhook first", true],
    [2, "confirm first", true],
    [3, "webhook first", true],
    [4, "webhook first", false],
    [5, "confirm first", false],
  ] as const) {
    it(`round ${round} (${order}, ${owesMore ? "another term still owed" : "nothing else owed, the report's own case"}): both answer 2xx, one settles and the other is told already, one receipt`, async () => {
      const o = await openOrder(owesMore);
      const pay = `pay_zzfixma${SUFFIX}r${round}`;
      const [first, second] = order === "webhook first" ? [() => webhook(o, pay), () => confirm(o, pay)] : [() => confirm(o, pay), () => webhook(o, pay)];
      const settled = await Promise.allSettled([first(), second()]);
      const reasons = settled.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => String(r.reason));
      expect(reasons).toEqual([]);
      const values = settled.map((r) => (r as PromiseFulfilledResult<unknown>).value);
      const hook = values.find((v) => (v as { status?: number }).status !== undefined) as Awaited<ReturnType<typeof webhook>>;
      const conf = values.find((v) => (v as { status?: number }).status === undefined) as Awaited<ReturnType<typeof confirm>>;
      expect(hook.status).toBe(200);
      expect([hook.body.outcome, conf.outcome].sort()).toEqual(["already", "settled"]);
      const receiptId = await expectSettledOnce(o);
      expect(conf.receiptId).toBe(receiptId);
    });
  }

  it("two confirms at once (a double tap): one settles, the other is told already with the same receipt", async () => {
    const o = await openOrder();
    const pay = `pay_zzfixma${SUFFIX}dbl`;
    const settled = await Promise.allSettled([confirm(o, pay), confirm(o, pay)]);
    expect(settled.filter((r) => r.status === "rejected").map((r) => String((r as PromiseRejectedResult).reason))).toEqual([]);
    const values = settled.map((r) => (r as PromiseFulfilledResult<Awaited<ReturnType<typeof confirm>>>).value);
    expect(values.map((v) => v.outcome).sort()).toEqual(["already", "settled"]);
    const receiptId = await expectSettledOnce(o);
    expect(values.map((v) => v.receiptId)).toEqual([receiptId, receiptId]);
    // One settlement audited, one receipt told to the family.
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "fees.onlineSettled", targetId: o.paymentId } })).toBe(1);
  });
});
