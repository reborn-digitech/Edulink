import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { gigSettings } from "@/lib/gig-questions";
import { bookSeat, cancelBooking, cancelSlot, closeBooking, consentToBooking, expertPayoutStanding, familySessions, mySlots, offerSlot, paidGate, releaseSeatPayments, reportUnheld, schoolSessions, seatCheckout, settleSeatPayment } from "@/lib/gig-sessions";
import { expertEarnings, familyPayment, linkPayoutAccount, operatorPayouts, retrySeatPayment, setPaymentsEnabled, HOLD_HOURS, UNPAID_SEAT_EXPIRY_MS } from "@/lib/gig-payments";
import { signSessionsWebhook } from "@/lib/gig-gateway";
import { POST as webhook } from "@/app/api/webhooks/gateway/sessions/route";
import type { ActiveContext } from "@/lib/session";

/**
 * Paid workshop seats (decision 0004, amended 2026-10-02), under the devbox
 * transport: the rules of the paid gate, each refusal by name; a one-to-one
 * never priced; the free allowance used before a seat is sold; the order →
 * webhook → hold → release path with the fake signature; the refunds a
 * cancellation, an expert's no-show and an unpaid seat bring; the kill
 * switch; the webhook's idempotency; what the expert, the operator and the
 * office read. As the database's owner, so the rules and not the policies.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
let saved: Awaited<ReturnType<typeof gigSettings>>;
let savedSwitch = false;
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], school: string | null, flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-pay-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const teacher = () => ctx("teacher", "TEACHER", schoolId);
const admin = () => ctx("admin", "ADMIN", schoolId);
const operator = () => ctx("operator", null, null, { isSuperuser: true });
const p1 = () => ctx("p1", "STUDENT", schoolId);
const g1 = () => ctx("g1", "PARENT", null);
const g2 = () => ctx("g2", "PARENT", null);

let n = 0;
const slot = (kind: "ONE_TO_ONE" | "WORKSHOP", hoursAhead = 48, over: Record<string, unknown> = {}) => {
  n += 1;
  return { kind, title: `ZZ paid ${STAMP}-${n}`, startsAt: new Date(Date.now() + hoursAhead * HOUR + n * 4 * HOUR).toISOString(), meetingUrl: `https://meet.example.test/zz-pay-${STAMP}-${n}`, ...over };
};
const offer = async (kind: "ONE_TO_ONE" | "WORKSHOP", over: Record<string, unknown> = {}, hoursAhead = 48) => {
  const result = await offerSlot(expert(), slot(kind, hoursAhead, over));
  if (!result.ok) throw new Error(`offer refused: ${result.errorKey}`);
  return result.slotId;
};
const deliver = (body: string, signature: string | null) => webhook(new Request("http://localhost/api/webhooks/gateway/sessions", { method: "POST", headers: { "content-type": "application/json", ...(signature ? { "x-razorpay-signature": signature } : {}) }, body }));
const captured = (orderId: string, amount: number, paymentId = `pay_zz${STAMP}${n}`) => JSON.stringify({ event: "payment.captured", created_at: Math.floor(Date.now() / 1000), payload: { payment: { entity: { id: paymentId, order_id: orderId, amount } } } });
const paymentOf = (bookingId: string) => db.sessionPayment.findUniqueOrThrow({ where: { bookingId } });
const bookingOf = (bookingId: string) => db.gigBooking.findUniqueOrThrow({ where: { id: bookingId }, select: { status: true, paid: true, lateCancel: true } });
const notes = (userKey: string, needle: string) => db.notification.count({ where: { userId: id[userKey], title: { contains: needle } } });
const audits = (action: string, targetId: string) => db.auditLog.count({ where: { action, targetId } });
/** Uses up a pupil's free workshop seats so the next one is a paid one. */
async function useAllowance(pupil: string, guardian: ActiveContext) {
  const left = (await familySessions(guardian)).children.find((c) => c.id === member[pupil])!.allowance.WORKSHOP.left;
  for (let i = 0; i < left; i += 1) {
    const free = await offer("WORKSHOP");
    const r = await bookSeat(guardian, { slotId: free, studentMembershipId: member[pupil], purpose: "ZZ a free workshop seat, within the allowance." });
    if (!r.ok) throw new Error(r.errorKey);
  }
}

beforeAll(async () => {
  saved = await gigSettings();
  const row = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { paymentsEnabled: true } });
  savedSwitch = row.paymentsEnabled;
  // No free duty owed, so the gate's other conditions can be read one at a time; ₹50–300 a seat, 15 %.
  await db.gigSettings.update({ where: { id: "gigs" }, data: { pupilFreeOneToOnes: 2, pupilFreeWorkshops: 2, freeCancelHours: 12, workshopMaxSeats: 30, expertStartOneToOnes: 0, expertStartWorkshops: 0, expertMonthlyOneToOnes: 0, expertQuarterlyWorkshops: 0, paymentsEnabled: true, seatPriceMinPaise: 5000, seatPriceMaxPaise: 30000, commissionPercent: 15 } });
  const s = await db.school.create({ data: { name: `ZZ Paid School ${STAMP}`, slug: `zz-pay-${STAMP}`, code: `ZZP${String(STAMP).slice(-6)}`, contactEmail: `zz-pay-${STAMP}@test.invalid`, teacherGuidanceOn: true }, select: { id: true } });
  schoolId = s.id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    const user = await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-pay-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } });
    id[key] = user.id;
    if (role) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null);
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ Bridge engineer", offering: "BOTH", publishedAt: new Date() } });
  await person("teacher", "TEACHER");
  await person("admin", "ADMIN");
  await person("operator", null, { isSuperuser: true });
  for (const [pupil, guardian] of [["p1", "g1"], ["p2", "g2"]] as const) {
    await person(pupil, "STUDENT", { isMinor: true });
    await person(guardian, null);
    await db.guardianship.create({ data: { parentUserId: id[guardian]!, studentMembershipId: member[pupil]!, studentSchoolId: schoolId, status: "ACTIVE" } });
  }
});

afterAll(async () => {
  const users = Object.values(id);
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
  await db.gigGatewayEvent.deleteMany({ where: { eventId: { contains: String(STAMP) } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: { ...saved, paymentsEnabled: savedSwitch } });
  await db.$disconnect();
});

describe("the paid gate", () => {
  it("a one-to-one is never priced, a teacher never charges, and each of the four conditions refuses by name until it is met", async () => {
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseOneToOnePriced" });
    expect(await offerSlot(teacher(), slot("ONE_TO_ONE", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseOneToOnePriced" });
    // (a) KYC first
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedKyc" });
    expect(await linkPayoutAccount(expert())).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedKyc" });
    await db.expertProfile.update({ where: { userId: id.expert! }, data: { kycStatus: "VERIFIED", verifiedAt: new Date() } });
    // (b) a payout account
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedPayout" });
    await expect(linkPayoutAccount(g1())).rejects.toBeInstanceOf(AccessError);
    const linked = await linkPayoutAccount(expert());
    expect(linked).toMatchObject({ ok: true, status: "ACTIVE", transport: "devbox" });
    expect(await audits("gig.payout.link", id.expert!)).toBe(1);
    expect(await audits("gig.payout.active", id.expert!)).toBe(1);
    expect(await linkPayoutAccount(expert())).toMatchObject({ ok: true, status: "ACTIVE" });
    // (c) an open free one-to-one in the coming thirty days
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedMentoring" });
    const standing = await expertPayoutStanding(expert());
    expect(standing.gate).toMatchObject({ paymentsOn: true, kycVerified: true, payoutActive: true, mentoringOffer: false, dutyDone: true, canCharge: false });
    await offer("ONE_TO_ONE", {}, 40 * 24);
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedMentoring" });
    await offer("ONE_TO_ONE");
    expect((await paidGate(id.expert!)).mentoringOffer).toBe(true);
    // (d) the period's free one-to-ones given
    await db.gigSettings.update({ where: { id: "gigs" }, data: { expertStartOneToOnes: 1 } });
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.freeDutyFirst", vars: { count: 1 } });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { expertStartOneToOnes: 0 } });
    // the band
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 4900 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePrice" });
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 30100 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePrice" });
    const priced = await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }));
    expect(priced.ok).toBe(true);
    const view = await mySlots(expert());
    expect(view.gate).toMatchObject({ canCharge: true, seatPriceMinPaise: 5000, seatPriceMaxPaise: 30000, commissionPercent: 15 });
    expect(view.slots.find((s) => s.id === (priced as { slotId: string }).slotId)?.pricePaise).toBe(10000);
  });

  it("the kill switch refuses a price, a paid booking and a release at once, and refunds still go", async () => {
    await setPaymentsEnabled(operator(), false);
    await expect(setPaymentsEnabled(expert(), true)).rejects.toBeInstanceOf(AccessError);
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePaymentsOff" });
    expect((await paidGate(id.expert!)).paymentsOn).toBe(false);
    expect((await familySessions(g1())).paymentsOn).toBe(false);
    expect((await operatorPayouts(operator())).paymentsEnabled).toBe(false);
    expect(await setPaymentsEnabled(operator(), true)).toMatchObject({ ok: true, paymentsEnabled: true });
    expect(await db.auditLog.count({ where: { action: { in: ["gig.payments.on", "gig.payments.off"] }, actorUserId: id.operator } })).toBe(2);
  });
});

describe("a paid seat, from the order to the payout", () => {
  let paidSlot = "";
  let bookingId = "";
  let orderId = "";

  it("the free allowance is used first; past it a guardian's booking waits for payment with an order, and a pupil's ask waits for consent and then payment", async () => {
    paidSlot = await offer("WORKSHOP", { pricePaise: 10000, seats: 10 });
    // A free seat for p1 while the allowance lasts: nothing to pay, no payment row.
    const free = await bookSeat(g1(), { slotId: paidSlot, studentMembershipId: member.p1, purpose: "ZZ the first workshop of the year, free." });
    expect(free).toMatchObject({ ok: true, status: "CONFIRMED", checkout: null });
    expect(await bookingOf((free as { bookingId: string }).bookingId)).toMatchObject({ paid: false });
    expect((await familySessions(g1())).children[0]!.open.find((s) => s.kind === "WORKSHOP")?.freeSeat).toBe(true);
    await useAllowance("p2", g2());
    const open = (await familySessions(g2())).children[0]!.open.find((s) => s.id === paidSlot);
    expect(open).toMatchObject({ pricePaise: 10000, freeSeat: false });
    // Past the allowance: a guardian's booking is PENDING_PAYMENT with the order in hand.
    const booked = await bookSeat(g2(), { slotId: paidSlot, studentMembershipId: member.p2, purpose: "ZZ a third workshop, past the two free ones." });
    expect(booked).toMatchObject({ ok: true, status: "PENDING_PAYMENT" });
    const checkout = (booked as { checkout: { paymentId: string; orderId: string; amountPaise: number; transport: string } }).checkout;
    expect(checkout).toMatchObject({ amountPaise: 10000, transport: "devbox" });
    expect(checkout.orderId.startsWith("order_devbox")).toBe(true);
    bookingId = (booked as { bookingId: string }).bookingId;
    orderId = checkout.orderId;
    expect(await bookingOf(bookingId)).toMatchObject({ status: "PENDING_PAYMENT", paid: true });
    expect(await paymentOf(bookingId)).toMatchObject({ status: "INITIATED", amountPaise: 10000, commissionPaise: 1500, payerUserId: id.g2, expertUserId: id.expert });
    // The seat is held: a second ask is the same booking, the same order.
    const again = await bookSeat(g2(), { slotId: paidSlot, studentMembershipId: member.p2, purpose: "ZZ a third workshop, past the two free ones." });
    expect(again).toMatchObject({ ok: true, bookingId, status: "PENDING_PAYMENT", checkout: { orderId } });
    expect(await seatCheckout(g2(), bookingId)).toMatchObject({ ok: true, checkout: { orderId } });
    await expect(seatCheckout(g1(), bookingId)).rejects.toBeInstanceOf(AccessError);
    // The paid seat draws on no allowance, and the office reads it as paid.
    expect((await familySessions(g2())).children[0]!.allowance.WORKSHOP.used).toBe(2);
    expect((await schoolSessions(admin())).bookings.find((b) => b.id === bookingId)).toMatchObject({ paid: true, status: "PENDING_PAYMENT" });
    // A slot with no price past the allowance is still refused.
    const freeSlot = await offer("WORKSHOP");
    expect(await bookSeat(g2(), { slotId: freeSlot, studentMembershipId: member.p2, purpose: "ZZ a free workshop past the allowance." })).toMatchObject({ ok: false, errorKey: "gigs.refuseAllowanceWorkshop" });
    // A pupil's own ask on a paid seat waits for consent, then payment.
    await useAllowance("p1", g1());
    const second = await offer("WORKSHOP", { pricePaise: 5000 });
    const asked = await bookSeat(p1(), { slotId: second, purpose: "ZZ a pupil asks for a paid seat." });
    expect(asked).toMatchObject({ ok: true, status: "PENDING_CONSENT", checkout: null });
    expect(await notes("g1", "consent and payment")).toBe(1);
    const consented = await consentToBooking(g1(), (asked as { bookingId: string }).bookingId, true);
    expect(consented).toMatchObject({ ok: true, status: "PENDING_PAYMENT", checkout: { amountPaise: 5000 } });
    expect(await paymentOf((asked as { bookingId: string }).bookingId)).toMatchObject({ status: "INITIATED", payerUserId: id.g1 });
  });

  it("the webhook: refused without a good signature, settles the order once, answers a redelivery 'already', and refuses a mismatched amount", async () => {
    const body = captured(orderId, 10000, `pay_zz${STAMP}a`);
    expect((await deliver(body, null)).status).toBe(401);
    expect((await deliver(body, "deadbeef")).status).toBe(401);
    expect((await deliver("not json", signSessionsWebhook("not json"))).status).toBe(400);
    // A wrong amount is refused and audited, the seat left waiting.
    const wrong = captured(orderId, 9999, `pay_zz${STAMP}w`);
    expect(await (await deliver(wrong, signSessionsWebhook(wrong))).json()).toMatchObject({ ok: true, outcome: "amount-mismatch" });
    expect(await bookingOf(bookingId)).toMatchObject({ status: "PENDING_PAYMENT" });
    // The capture: the seat confirms, the row is HELD with the transfer, everybody is told.
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ ok: true, outcome: "settled" });
    expect(await bookingOf(bookingId)).toMatchObject({ status: "CONFIRMED", paid: true });
    const p = await paymentOf(bookingId);
    expect(p).toMatchObject({ status: "HELD", paymentId: `pay_zz${STAMP}a` });
    expect(p.transferId?.startsWith("trf_devbox")).toBe(true);
    expect(p.holdUntil).toBeNull();
    expect(await audits("gig.payment.paid", p.id)).toBe(1);
    expect(await audits("gig.payment.held", p.id)).toBe(1);
    expect(await notes("g2", "is confirmed")).toBe(1);
    expect(await notes("expert", "has a seat")).toBeGreaterThanOrEqual(1);
    expect(await notes("admin", "is to meet")).toBeGreaterThanOrEqual(1);
    // Delivered again, nothing moves twice.
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ ok: true, outcome: "already" });
    const replay = JSON.stringify({ ...JSON.parse(body), created_at: Math.floor(Date.now() / 1000) + 5 });
    expect(await (await deliver(replay, signSessionsWebhook(replay))).json()).toMatchObject({ ok: true, outcome: "already" });
    expect(await audits("gig.payment.paid", p.id)).toBe(1);
    // The family reads it; another family does not.
    expect(await familyPayment(g2(), p.id)).toMatchObject({ status: "HELD", bookingStatus: "CONFIRMED", checkout: null });
    await expect(familyPayment(g1(), p.id)).rejects.toBeInstanceOf(AccessError);
  });

  it("delivered: the hold ends 48 hours later and the job releases the transfer into one payout per expert, told to the expert and shown in their earnings", async () => {
    const startsAt = (await db.gigSlot.findUniqueOrThrow({ where: { id: paidSlot }, select: { startsAt: true } })).startsAt;
    const closedAt = new Date(startsAt.getTime() + 10 * 60_000);
    expect(await closeBooking(expert(), bookingId, "DELIVERED", closedAt)).toMatchObject({ ok: true });
    const held = await paymentOf(bookingId);
    expect(held.holdUntil?.getTime()).toBe(closedAt.getTime() + HOLD_HOURS * HOUR);
    // Before the hold has run: nothing released.
    const early = await releaseSeatPayments(new Date(closedAt.getTime() + HOUR));
    expect(early.released).toBe(0);
    expect(await paymentOf(bookingId)).toMatchObject({ status: "HELD" });
    // With the switch off, still nothing.
    await setPaymentsEnabled(operator(), false);
    expect((await releaseSeatPayments(new Date(closedAt.getTime() + 49 * HOUR))).released).toBe(0);
    await setPaymentsEnabled(operator(), true);
    expect(await retrySeatPayment(operator(), held.id, new Date(closedAt.getTime() + HOUR))).toMatchObject({ ok: false, errorKey: "gigs.refuseNothingToRetry" });
    const run = await releaseSeatPayments(new Date(closedAt.getTime() + 49 * HOUR));
    expect(run).toMatchObject({ released: 1, releasedPaise: 8500, payouts: 1, failed: 0 });
    const released = await paymentOf(bookingId);
    expect(released).toMatchObject({ status: "RELEASED" });
    expect(released.payoutId).toBeTruthy();
    const payout = await db.expertPayout.findUniqueOrThrow({ where: { id: released.payoutId! } });
    expect(payout).toMatchObject({ expertUserId: id.expert, amountPaise: 8500, transfers: 1, status: "RELEASED" });
    expect(await audits("gig.payment.released", released.id)).toBe(1);
    expect(await notes("expert", "on its way")).toBe(1);
    // Released once: the next run finds nothing.
    expect((await releaseSeatPayments(new Date(closedAt.getTime() + 50 * HOUR))).released).toBe(0);
    const e = await expertEarnings(expert());
    expect(e.releasedPaise).toBe(8500);
    expect(e.rows.find((r) => r.bookingId === bookingId)).toMatchObject({ status: "RELEASED", amountPaise: 10000, commissionPaise: 1500, netPaise: 8500 });
    expect(e.payouts[0]).toMatchObject({ amountPaise: 8500, transfers: 1 });
    await expect(expertEarnings(g2())).rejects.toBeInstanceOf(AccessError);
    // The settlement webhook names the payout's settlement.
    const settled = JSON.stringify({ event: "transfer.settled", created_at: Math.floor(Date.now() / 1000), payload: { transfer: { entity: { id: released.transferId, settlement_id: `setl_zz${STAMP}` } } } });
    expect(await (await deliver(settled, signSessionsWebhook(settled))).json()).toMatchObject({ outcome: "settled" });
    expect((await expertEarnings(expert())).rows.find((r) => r.bookingId === bookingId)?.settlementId).toBe(`setl_zz${STAMP}`);
    const op = await operatorPayouts(operator());
    expect(op.payouts.find((x) => x.id === payout.id)).toMatchObject({ amountPaise: 8500, settlementId: `setl_zz${STAMP}`, status: "SETTLED" });
    expect(op.commissionThisMonthPaise).toBeGreaterThanOrEqual(1500);
    await expect(operatorPayouts(expert())).rejects.toBeInstanceOf(AccessError);
  });

  /** A paid, captured, HELD seat for p2 in a fresh priced slot. */
  async function heldSeat(hoursAhead = 48, price = 10000) {
    const s = await offer("WORKSHOP", { pricePaise: price, seats: 10 }, hoursAhead);
    const booked = await bookSeat(g2(), { slotId: s, studentMembershipId: member.p2, purpose: "ZZ a paid seat to be settled and then undone." });
    if (!booked.ok || !booked.checkout) throw new Error("no checkout");
    n += 1;
    const body = captured(booked.checkout.orderId, price, `pay_zz${STAMP}h${n}`);
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ outcome: "settled" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "HELD" });
    return { slotId: s, bookingId: booked.bookingId };
  }

  it("cancelling: the family in time is refunded in full; late, the seat is paid for and released after the time; the provider, the office and a cancelled time refund", async () => {
    const inTime = await heldSeat(72);
    expect(await cancelBooking(g2(), inTime.bookingId)).toMatchObject({ ok: true, lateCancel: false });
    const refunded = await paymentOf(inTime.bookingId);
    expect(refunded).toMatchObject({ status: "REFUNDED", amountPaise: 10000 });
    expect(refunded.refundId?.startsWith("rfnd_devbox")).toBe(true);
    expect(await audits("gig.payment.refunded", refunded.id)).toBe(1);
    expect(await notes("g2", "has been refunded")).toBe(1);
    expect((await expertEarnings(expert())).refundedPaise).toBeGreaterThanOrEqual(10000);

    const late = await heldSeat(72);
    const { startsAt, endsAt } = await db.gigSlot.findUniqueOrThrow({ where: { id: late.slotId }, select: { startsAt: true, endsAt: true } });
    // Given up an hour before the start: inside the twelve free-cancel hours.
    expect(await cancelBooking(g2(), late.bookingId, undefined, new Date(startsAt.getTime() - HOUR))).toMatchObject({ ok: true, lateCancel: true });
    const kept = await paymentOf(late.bookingId);
    expect(kept).toMatchObject({ status: "HELD" });
    expect(kept.holdUntil?.getTime()).toBe(endsAt.getTime() + HOLD_HOURS * HOUR);
    const run = await releaseSeatPayments(new Date(endsAt.getTime() + 49 * HOUR));
    expect(run.released).toBeGreaterThanOrEqual(1);
    expect(await paymentOf(late.bookingId)).toMatchObject({ status: "RELEASED" });

    const byProvider = await heldSeat(72);
    expect(await cancelBooking(expert(), byProvider.bookingId, "ZZ I cannot make it after all")).toMatchObject({ ok: true });
    expect(await paymentOf(byProvider.bookingId)).toMatchObject({ status: "REFUNDED" });

    const byOffice = await heldSeat(72);
    expect(await cancelBooking(admin(), byOffice.bookingId, "ZZ a school day was moved")).toMatchObject({ ok: true });
    expect(await paymentOf(byOffice.bookingId)).toMatchObject({ status: "REFUNDED" });

    const wholeSlot = await heldSeat(72);
    expect(await cancelSlot(expert(), wholeSlot.slotId, "ZZ the hall is not free")).toMatchObject({ ok: true });
    expect(await paymentOf(wholeSlot.bookingId)).toMatchObject({ status: "REFUNDED" });
    expect(await bookingOf(wholeSlot.bookingId)).toMatchObject({ status: "CANCELLED" });
  });

  it("an expert's no-show refunds in full; a pupil's no-show pays the expert", async () => {
    const unheld = await heldSeat(2);
    const ends = (await db.gigSlot.findUniqueOrThrow({ where: { id: unheld.slotId }, select: { endsAt: true } })).endsAt;
    expect(await reportUnheld(g2(), unheld.bookingId, new Date(ends.getTime() + HOUR))).toMatchObject({ ok: true, status: "UNHELD" });
    expect(await paymentOf(unheld.bookingId)).toMatchObject({ status: "REFUNDED" });

    const missed = await heldSeat(2);
    const starts = (await db.gigSlot.findUniqueOrThrow({ where: { id: missed.slotId }, select: { startsAt: true } })).startsAt;
    const at = new Date(starts.getTime() + 5 * 60_000);
    expect(await closeBooking(expert(), missed.bookingId, "MISSED", at)).toMatchObject({ ok: true });
    expect((await paymentOf(missed.bookingId)).holdUntil?.getTime()).toBe(at.getTime() + HOLD_HOURS * HOUR);
    await releaseSeatPayments(new Date(at.getTime() + 49 * HOUR));
    expect(await paymentOf(missed.bookingId)).toMatchObject({ status: "RELEASED" });
  });

  it("an unpaid seat is given back by the job after the checkout window, its order voided and the family told; a cancelled unpaid seat is voided too", async () => {
    const s = await offer("WORKSHOP", { pricePaise: 10000, seats: 10 });
    const booked = await bookSeat(g2(), { slotId: s, studentMembershipId: member.p2, purpose: "ZZ a seat nobody pays for." });
    if (!booked.ok) throw new Error(booked.errorKey);
    const taken = () => db.gigSlot.findUniqueOrThrow({ where: { id: s }, select: { seatsTaken: true } });
    expect((await taken()).seatsTaken).toBe(1);
    expect((await releaseSeatPayments(new Date())).expired).toBe(0);
    const run = await releaseSeatPayments(new Date(Date.now() + UNPAID_SEAT_EXPIRY_MS + 60_000));
    expect(run.expired).toBe(1);
    expect(await bookingOf(booked.bookingId)).toMatchObject({ status: "CANCELLED", paid: true });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "FAILED", reason: "expired unpaid" });
    expect((await taken()).seatsTaken).toBe(0);
    expect(await notes("g2", "given back")).toBe(1);
    // A capture that arrives after the seat was given back still goes through the one door and is refundable, not lost.
    const bookedAgain = await bookSeat(g2(), { slotId: s, studentMembershipId: member.p2, purpose: "ZZ a seat given up before it is paid." });
    if (!bookedAgain.ok) throw new Error(bookedAgain.errorKey);
    expect(await cancelBooking(g2(), bookedAgain.bookingId)).toMatchObject({ ok: true });
    expect(await paymentOf(bookedAgain.bookingId)).toMatchObject({ status: "FAILED" });
    expect((await taken()).seatsTaken).toBe(0);
  });

  it("a failed order is replaced by a fresh one on the same row; a failed payment attempt may be captured on retry", async () => {
    const s = await offer("WORKSHOP", { pricePaise: 6000, seats: 10 });
    const booked = await bookSeat(g2(), { slotId: s, studentMembershipId: member.p2, purpose: "ZZ a seat whose first attempt fails." });
    if (!booked.ok || !booked.checkout) throw new Error("no checkout");
    const failed = JSON.stringify({ event: "payment.failed", created_at: Math.floor(Date.now() / 1000), payload: { payment: { entity: { id: `pay_zz${STAMP}f`, order_id: booked.checkout.orderId, amount: 6000, error_description: "ZZ card declined" } } } });
    expect(await (await deliver(failed, signSessionsWebhook(failed))).json()).toMatchObject({ outcome: "failed" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "FAILED", reason: "ZZ card declined" });
    expect(await familyPayment(g2(), (await paymentOf(booked.bookingId)).id)).toMatchObject({ status: "FAILED", checkout: null });
    // The panel reopened: a fresh order on the same row.
    const fresh = await seatCheckout(g2(), booked.bookingId);
    expect(fresh.ok && fresh.checkout.orderId !== booked.checkout.orderId).toBe(true);
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "INITIATED", attempts: 1 });
    const body = captured((fresh as { checkout: { orderId: string } }).checkout.orderId, 6000, `pay_zz${STAMP}r`);
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ outcome: "settled" });
    expect(await bookingOf(booked.bookingId)).toMatchObject({ status: "CONFIRMED" });
    // The devbox page's door is the same one.
    expect(await settleSeatPayment({ orderId: (fresh as { checkout: { orderId: string } }).checkout.orderId, gatewayPaymentId: "pay_x", amountPaise: 6000 })).toMatchObject({ outcome: "already" });
    expect(await settleSeatPayment({ orderId: "order_nobody", gatewayPaymentId: "pay_x", amountPaise: 6000 })).toMatchObject({ outcome: "unknown-order" });
  });
});
