import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { gigSettings } from "@/lib/gig-questions";
import { bookSeat, cancelBooking, cancelSlot, closeBooking, consentToBooking, expertPayoutStanding, familySessions, mySlots, offerSlot, paidGate, releaseSeatPayments, reportUnheld, schoolSessions, seatCheckout, settleSeatPayment } from "@/lib/gig-sessions";
import { companyDetails, expertEarnings, expertInvoices, familyPayment, familyReceipt, financialYearOf, invoiceView, operatorInvoices, operatorPayouts, recordPayout, retrySeatPayment, saveCompanyDetails, savePayee, setPaymentsEnabled, suspendPayee, HOLD_HOURS, UNPAID_SEAT_EXPIRY_MS } from "@/lib/gig-payments";
import { renderInvoicePdf, renderReceiptPdf } from "@/lib/gig-invoice-pdf";
import { signSessionsWebhook } from "@/lib/gig-gateway";
import { POST as webhook } from "@/app/api/webhooks/gateway/sessions/route";
import type { ActiveContext } from "@/lib/session";

/**
 * Paid workshop seats under the company-collects design (decision 0004,
 * second amendment of 2 October 2026), under the devbox transport: the paid
 * gate with payee details in place of a linked account; the capture freezing
 * the gross, the commission, the GST on it and the net, and taking the
 * family's receipt number; the hold running into DUE and one open payout per
 * expert; nothing due while the switch is off; the operator refused a payout
 * until the company's details are set, then recording it — every seat
 * PAID_OUT, the invoice numbered in series (0001, 0002; a lost race takes no
 * number), CGST+SGST in the company's state and IGST outside it; the expert
 * reading their invoice and another expert 404ing; a refunded seat never in
 * a payout; the sealed account never in any view. As the database's owner,
 * so the rules and not the policies.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
let saved: Awaited<ReturnType<typeof gigSettings>>;
let savedSwitch = false;
let savedCompany: { companyLegalName: string | null; companyGstin: string | null; companyAddress: string | null; companyStateCode: string | null; invoiceSacCode: string; invoicePrefix: string; gstPercent: number };
/** The test's own invoice series, so its numbers start at 0001 whatever the server already issued. */
const PREFIX = `ZT${String(STAMP).slice(-6)}`;
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], school: string | null, flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-pay-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const expert2 = () => ctx("expert2", "EXPERT", null);
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
/** The expert reads Hindi (prefs.locale, set below so the invoice is issued in it): their notices are counted by the Hindi words. */
const expertNotes = (needle: "due" | "paidOut") => notes("expert", needle === "due" ? "आपको देय है" : "भेज दिया गया");
const company = () => ({ legalName: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", address: "ZZ 1 Test Road, Pune", stateCode: "27", sacCode: "998599", invoicePrefix: PREFIX, gstPercent: 18 });
/** Uses up a pupil's free workshop seats so the next one is a paid one. */
async function useAllowance(pupil: string, guardian: ActiveContext) {
  const left = (await familySessions(guardian)).children.find((c) => c.id === member[pupil])!.allowance.WORKSHOP.left;
  for (let i = 0; i < left; i += 1) {
    const free = await offer("WORKSHOP");
    const r = await bookSeat(guardian, { slotId: free, studentMembershipId: member[pupil], purpose: "ZZ a free workshop seat, within the allowance." });
    if (!r.ok) throw new Error(r.errorKey);
  }
}
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
/** A HELD seat delivered and its hold run: DUE in the expert's open payout. */
async function dueSeat(price = 10000) {
  const seat = await heldSeat(48, price);
  const startsAt = (await db.gigSlot.findUniqueOrThrow({ where: { id: seat.slotId }, select: { startsAt: true } })).startsAt;
  const closedAt = new Date(startsAt.getTime() + 10 * 60_000);
  expect(await closeBooking(expert(), seat.bookingId, "DELIVERED", closedAt)).toMatchObject({ ok: true });
  await releaseSeatPayments(new Date(closedAt.getTime() + (HOLD_HOURS + 1) * HOUR));
  const p = await paymentOf(seat.bookingId);
  expect(p.status).toBe("DUE");
  return { ...seat, paymentId: p.id, payoutId: p.payoutId! };
}

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  saved = await gigSettings();
  const row = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { paymentsEnabled: true, companyLegalName: true, companyGstin: true, companyAddress: true, companyStateCode: true, invoiceSacCode: true, invoicePrefix: true, gstPercent: true } });
  savedSwitch = row.paymentsEnabled;
  savedCompany = { companyLegalName: row.companyLegalName, companyGstin: row.companyGstin, companyAddress: row.companyAddress, companyStateCode: row.companyStateCode, invoiceSacCode: row.invoiceSacCode, invoicePrefix: row.invoicePrefix, gstPercent: row.gstPercent };
  // No free duty owed, so the gate's other conditions can be read one at a time; ₹50–300 a seat, 15 % and 18 % GST on it; the company's details blank until a test sets them.
  await db.gigSettings.update({ where: { id: "gigs" }, data: { pupilFreeOneToOnes: 2, pupilFreeWorkshops: 2, freeCancelHours: 12, workshopMaxSeats: 30, expertStartOneToOnes: 0, expertStartWorkshops: 0, expertMonthlyOneToOnes: 0, expertQuarterlyWorkshops: 0, paymentsEnabled: true, seatPriceMinPaise: 5000, seatPriceMaxPaise: 30000, commissionPercent: 15, gstPercent: 18, companyLegalName: null, companyGstin: null, companyAddress: null, companyStateCode: null, invoicePrefix: PREFIX } });
  const s = await db.school.create({ data: { name: `ZZ Paid School ${STAMP}`, slug: `zz-pay-${STAMP}`, code: `ZZP${String(STAMP).slice(-6)}`, contactEmail: `zz-pay-${STAMP}@test.invalid`, teacherGuidanceOn: true }, select: { id: true } });
  schoolId = s.id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    const user = await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-pay-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } });
    id[key] = user.id;
    if (role) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null, { prefs: JSON.stringify({ locale: "hi" }) });
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ Bridge engineer", offering: "BOTH", publishedAt: new Date() } });
  await person("expert2", null);
  await db.expertProfile.create({ data: { userId: id.expert2!, headline: "ZZ Another expert", offering: "BOTH", publishedAt: new Date(), kycStatus: "VERIFIED", verifiedAt: new Date() } });
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
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: { ...saved, paymentsEnabled: savedSwitch, ...savedCompany } });
  await db.$disconnect();
});

describe("the paid gate", () => {
  it("a one-to-one is never priced, a teacher never charges, and each of the four conditions refuses by name until it is met", async () => {
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseOneToOnePriced" });
    expect(await offerSlot(teacher(), slot("ONE_TO_ONE", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseOneToOnePriced" });
    // (a) KYC first: the details can be typed before, but the account is not active until the papers are verified.
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedKyc" });
    // (b) payee details: each refusal by name, then a bank account sealed with its last four kept.
    await expect(savePayee(g1(), { payeeName: "ZZ", gstStateCode: "27" })).rejects.toBeInstanceOf(AccessError);
    expect(await savePayee(expert(), { payeeName: "Z", gstStateCode: "27", upiId: "zz@upi" })).toMatchObject({ ok: false, errorKey: "gigs.refusePayeeName" });
    expect(await savePayee(expert(), { payeeName: "ZZ Rao", gstStateCode: "27" })).toMatchObject({ ok: false, errorKey: "gigs.refusePayeeHow" });
    expect(await savePayee(expert(), { payeeName: "ZZ Rao", gstStateCode: "27", upiId: "not an id" })).toMatchObject({ ok: false, errorKey: "fees.refuseUpiId" });
    expect(await savePayee(expert(), { payeeName: "ZZ Rao", gstStateCode: "27", bankAccount: "12", ifsc: "HDFC0001234" })).toMatchObject({ ok: false, errorKey: "gigs.refuseBankAccount" });
    expect(await savePayee(expert(), { payeeName: "ZZ Rao", gstStateCode: "27", bankAccount: "123456789012", ifsc: "HDFC1234" })).toMatchObject({ ok: false, errorKey: "gigs.refuseIfsc" });
    expect(await savePayee(expert(), { payeeName: "ZZ Rao", gstStateCode: "99", upiId: "zz@upi" })).toMatchObject({ ok: false, errorKey: "gigs.refuseStateCode" });
    expect(await savePayee(expert(), { payeeName: "ZZ Rao", gstStateCode: "27", upiId: "zz@upi", gstin: "29AAAPR1234A1Z5" })).toMatchObject({ ok: false, errorKey: "gigs.refuseGstinState" });
    const savedBank = await savePayee(expert(), { payeeName: "ZZ Meenakshi Rao", gstStateCode: "27", bankAccount: "1234 5678 9012 3456", ifsc: "hdfc0001234" });
    expect(savedBank).toMatchObject({ ok: true, payout: { status: "NONE", payeeName: "ZZ Meenakshi Rao", bankLast4: "3456", ifsc: "HDFC0001234", upiId: null, gstStateCode: "27", kycVerified: false } });
    // The sealed number is in the row and in no view; the log carries neither.
    const row = await db.expertPayoutAccount.findUniqueOrThrow({ where: { expertUserId: id.expert! } });
    expect(row.bankAccountEnc?.startsWith("v2.")).toBe(true);
    expect(JSON.stringify(savedBank)).not.toContain("1234567890");
    expect(JSON.stringify(await expertPayoutStanding(expert()))).not.toContain("1234567890");
    expect(JSON.stringify(savedBank)).not.toContain(row.bankAccountEnc);
    const log = await db.auditLog.findFirst({ where: { action: "gig.payee.save", targetId: id.expert! }, select: { meta: true } });
    expect(log?.meta ?? "").not.toContain("3456");
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedKyc" });
    await db.expertProfile.update({ where: { userId: id.expert! }, data: { kycStatus: "VERIFIED", verifiedAt: new Date() } });
    // Verified: the details already typed make the account active without another save.
    expect((await expertPayoutStanding(expert())).payout).toMatchObject({ status: "ACTIVE", kycVerified: true });
    // A UPI id in place of the bank account clears the sealed number.
    expect(await savePayee(expert(), { payeeName: "ZZ Meenakshi Rao", gstStateCode: "27", upiId: "zz.meenakshi@upi" })).toMatchObject({ ok: true, payout: { status: "ACTIVE", upiId: "zz.meenakshi@upi", bankLast4: null } });
    expect((await db.expertPayoutAccount.findUniqueOrThrow({ where: { expertUserId: id.expert! } })).bankAccountEnc).toBeNull();
    // The operator may stop payments, with a reason the expert reads; lifted, it is active again.
    expect(await suspendPayee(operator(), id.expert!, { suspended: true })).toMatchObject({ ok: false, errorKey: "gigs.needReason" });
    expect(await suspendPayee(operator(), id.expert!, { suspended: true, note: "ZZ papers queried" })).toMatchObject({ ok: true, payout: { status: "SUSPENDED", note: "ZZ papers queried" } });
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedPayout" });
    await expect(suspendPayee(expert(), id.expert!, { suspended: false })).rejects.toBeInstanceOf(AccessError);
    expect(await suspendPayee(operator(), id.expert!, { suspended: false })).toMatchObject({ ok: true, payout: { status: "ACTIVE", note: null } });
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

describe("a paid seat, from the order to the company's payout", () => {
  let paidSlot = "";
  let bookingId = "";
  let orderId = "";
  let firstPayoutId = "";

  it("the free allowance is used first; past it a guardian's booking waits for payment with an order, and a pupil's ask waits for consent and then payment", async () => {
    paidSlot = await offer("WORKSHOP", { pricePaise: 10000, seats: 10 });
    const free = await bookSeat(g1(), { slotId: paidSlot, studentMembershipId: member.p1, purpose: "ZZ the first workshop of the year, free." });
    expect(free).toMatchObject({ ok: true, status: "CONFIRMED", checkout: null });
    expect(await bookingOf((free as { bookingId: string }).bookingId)).toMatchObject({ paid: false });
    await useAllowance("p2", g2());
    const booked = await bookSeat(g2(), { slotId: paidSlot, studentMembershipId: member.p2, purpose: "ZZ a third workshop, past the two free ones." });
    expect(booked).toMatchObject({ ok: true, status: "PENDING_PAYMENT" });
    const checkout = (booked as { checkout: { paymentId: string; orderId: string; amountPaise: number; transport: string } }).checkout;
    expect(checkout).toMatchObject({ amountPaise: 10000, transport: "devbox" });
    expect(checkout.orderId.startsWith("order_devbox")).toBe(true);
    bookingId = (booked as { bookingId: string }).bookingId;
    orderId = checkout.orderId;
    expect(await bookingOf(bookingId)).toMatchObject({ status: "PENDING_PAYMENT", paid: true });
    expect(await paymentOf(bookingId)).toMatchObject({ status: "INITIATED", amountPaise: 10000, commissionPaise: 1500, gstPaise: 270, netPaise: 8230, receiptNumber: null, payerUserId: id.g2, expertUserId: id.expert });
    const again = await bookSeat(g2(), { slotId: paidSlot, studentMembershipId: member.p2, purpose: "ZZ a third workshop, past the two free ones." });
    expect(again).toMatchObject({ ok: true, bookingId, status: "PENDING_PAYMENT", checkout: { orderId } });
    expect(await seatCheckout(g2(), bookingId)).toMatchObject({ ok: true, checkout: { orderId } });
    await expect(seatCheckout(g1(), bookingId)).rejects.toBeInstanceOf(AccessError);
    expect((await familySessions(g2())).children[0]!.allowance.WORKSHOP.used).toBe(2);
    expect((await schoolSessions(admin())).bookings.find((b) => b.id === bookingId)).toMatchObject({ paid: true, status: "PENDING_PAYMENT" });
    const freeSlot = await offer("WORKSHOP");
    expect(await bookSeat(g2(), { slotId: freeSlot, studentMembershipId: member.p2, purpose: "ZZ a free workshop past the allowance." })).toMatchObject({ ok: false, errorKey: "gigs.refuseAllowanceWorkshop" });
    await useAllowance("p1", g1());
    const second = await offer("WORKSHOP", { pricePaise: 5000 });
    const asked = await bookSeat(p1(), { slotId: second, purpose: "ZZ a pupil asks for a paid seat." });
    expect(asked).toMatchObject({ ok: true, status: "PENDING_CONSENT", checkout: null });
    expect(await notes("g1", "consent and payment")).toBe(1);
    const consented = await consentToBooking(g1(), (asked as { bookingId: string }).bookingId, true);
    expect(consented).toMatchObject({ ok: true, status: "PENDING_PAYMENT", checkout: { amountPaise: 5000 } });
    expect(await paymentOf((asked as { bookingId: string }).bookingId)).toMatchObject({ status: "INITIATED", payerUserId: id.g1 });
    // No receipt before the money: the family's receipt door says so.
    await expect(familyReceipt(g1(), (await paymentOf((asked as { bookingId: string }).bookingId)).id)).rejects.toMatchObject({ key: "gigs.noReceiptYet" });
  });

  it("the webhook: refused without a good signature, settles the order once with the three figures frozen and the receipt numbered, answers a redelivery 'already', and refuses a mismatched amount", async () => {
    const body = captured(orderId, 10000, `pay_zz${STAMP}a`);
    expect((await deliver(body, null)).status).toBe(401);
    expect((await deliver(body, "deadbeef")).status).toBe(401);
    expect((await deliver("not json", signSessionsWebhook("not json"))).status).toBe(400);
    const wrong = captured(orderId, 9999, `pay_zz${STAMP}w`);
    expect(await (await deliver(wrong, signSessionsWebhook(wrong))).json()).toMatchObject({ ok: true, outcome: "amount-mismatch" });
    expect(await bookingOf(bookingId)).toMatchObject({ status: "PENDING_PAYMENT" });
    // The dials change between the order and the capture: the capture's figures stand, under today's dials.
    await db.gigSettings.update({ where: { id: "gigs" }, data: { gstPercent: 12 } });
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ ok: true, outcome: "settled" });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { gstPercent: 18 } });
    expect(await bookingOf(bookingId)).toMatchObject({ status: "CONFIRMED", paid: true });
    const p = await paymentOf(bookingId);
    expect(p).toMatchObject({ status: "HELD", paymentId: `pay_zz${STAMP}a`, amountPaise: 10000, commissionPaise: 1500, gstPaise: 180, netPaise: 8320, receiptSerial: 1, receiptNumber: `${PREFIX}-R/${financialYearOf(new Date())}/0001` });
    expect(p.paidAt).not.toBeNull();
    expect(p.holdUntil).toBeNull();
    expect(await audits("gig.payment.paid", p.id)).toBe(1);
    expect(await audits("gig.payment.held", p.id)).toBe(1);
    expect(await notes("g2", "is confirmed")).toBe(1);
    expect(await notes("expert", `ZZ paid ${STAMP}`)).toBeGreaterThanOrEqual(1);
    expect(await notes("admin", "is to meet")).toBeGreaterThanOrEqual(1);
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ ok: true, outcome: "already" });
    const replay = JSON.stringify({ ...JSON.parse(body), created_at: Math.floor(Date.now() / 1000) + 5 });
    expect(await (await deliver(replay, signSessionsWebhook(replay))).json()).toMatchObject({ ok: true, outcome: "already" });
    expect(await audits("gig.payment.paid", p.id)).toBe(1);
    // The family reads it, with the receipt number; another family does not; the pupil reads the receipt for their own seat.
    expect(await familyPayment(g2(), p.id)).toMatchObject({ status: "HELD", bookingStatus: "CONFIRMED", checkout: null, receiptNumber: p.receiptNumber });
    await expect(familyPayment(g1(), p.id)).rejects.toBeInstanceOf(AccessError);
    const receipt = await familyReceipt(g2(), p.id);
    expect(receipt).toMatchObject({ receiptNumber: p.receiptNumber, amountPaise: 10000, expertName: `ZZ expert ${STAMP}`, pupilName: `ZZ p2 ${STAMP}`, payerName: `ZZ g2 ${STAMP}`, collectedBy: "Shalaghar", refundedAt: null });
    expect(JSON.stringify(receipt)).not.toContain("8320");
    await expect(familyReceipt(g1(), p.id)).rejects.toBeInstanceOf(AccessError);
    const pdf = await renderReceiptPdf(receipt, "mr");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    // The next capture takes the next number.
    const other = await heldSeat();
    expect(await paymentOf(other.bookingId)).toMatchObject({ receiptSerial: 2, receiptNumber: `${PREFIX}-R/${financialYearOf(new Date())}/0002` });
  });

  it("delivered: the hold ends 48 hours later and the job moves the net to DUE in one open payout per expert, told once; nothing is due while the switch is off", async () => {
    const startsAt = (await db.gigSlot.findUniqueOrThrow({ where: { id: paidSlot }, select: { startsAt: true } })).startsAt;
    const closedAt = new Date(startsAt.getTime() + 10 * 60_000);
    expect(await closeBooking(expert(), bookingId, "DELIVERED", closedAt)).toMatchObject({ ok: true });
    const held = await paymentOf(bookingId);
    expect(held.holdUntil?.getTime()).toBe(closedAt.getTime() + HOLD_HOURS * HOUR);
    const early = await releaseSeatPayments(new Date(closedAt.getTime() + HOUR));
    expect(early.due).toBe(0);
    expect(await paymentOf(bookingId)).toMatchObject({ status: "HELD" });
    await setPaymentsEnabled(operator(), false);
    expect((await releaseSeatPayments(new Date(closedAt.getTime() + 49 * HOUR))).due).toBe(0);
    expect(await paymentOf(bookingId)).toMatchObject({ status: "HELD" });
    await setPaymentsEnabled(operator(), true);
    expect(await retrySeatPayment(operator(), held.id, new Date(closedAt.getTime() + HOUR))).toMatchObject({ ok: false, errorKey: "gigs.refuseNothingToRetry" });
    const run = await releaseSeatPayments(new Date(closedAt.getTime() + 49 * HOUR));
    expect(run).toMatchObject({ due: 1, duePaise: 8320, payoutsOpened: 1, failed: 0 });
    const due = await paymentOf(bookingId);
    expect(due).toMatchObject({ status: "DUE" });
    expect(due.payoutId).toBeTruthy();
    firstPayoutId = due.payoutId!;
    const payout = await db.expertPayout.findUniqueOrThrow({ where: { id: firstPayoutId } });
    expect(payout).toMatchObject({ expertUserId: id.expert, netPaise: 8320, paymentsCount: 1, status: "OPEN", reference: null });
    expect(await audits("gig.payment.due", due.id)).toBe(1);
    expect(await audits("gig.payout.open", firstPayoutId)).toBe(1);
    expect(await expertNotes("due")).toBe(1);
    // Due once: the next run finds nothing; a second seat due joins the SAME open payout and the expert is not told again.
    expect((await releaseSeatPayments(new Date(closedAt.getTime() + 50 * HOUR))).due).toBe(0);
    const second = await dueSeat();
    expect(second.payoutId).toBe(firstPayoutId);
    expect(await db.expertPayout.findUniqueOrThrow({ where: { id: firstPayoutId } })).toMatchObject({ netPaise: 8320 + 8230, paymentsCount: 2, status: "OPEN" });
    expect(await expertNotes("due")).toBe(1);
    const e = await expertEarnings(expert());
    expect(e.duePaise).toBe(8320 + 8230);
    expect(e.paidOutPaise).toBe(0);
    expect(e.rows.find((r) => r.bookingId === bookingId)).toMatchObject({ status: "DUE", amountPaise: 10000, commissionPaise: 1500, gstPaise: 180, netPaise: 8320, payoutId: firstPayoutId });
    expect(e.payouts[0]).toMatchObject({ id: firstPayoutId, netPaise: 8320 + 8230, paymentsCount: 2, status: "OPEN", invoiceId: null });
    await expect(expertEarnings(g2())).rejects.toBeInstanceOf(AccessError);
    const op = await operatorPayouts(operator());
    expect(op.toPay.find((x) => x.id === firstPayoutId)).toMatchObject({ expertName: `ZZ expert ${STAMP}`, netPaise: 8320 + 8230, paymentsCount: 2, payee: { payeeName: "ZZ Meenakshi Rao", upiId: "zz.meenakshi@upi", bankLast4: null, gstStateCode: "27", status: "ACTIVE" } });
    expect(op.duePaise).toBeGreaterThanOrEqual(8320 + 8230);
    expect(op.commissionThisMonthPaise).toBeGreaterThanOrEqual(3000);
    expect(op.gstThisMonthPaise).toBeGreaterThanOrEqual(450);
    expect(op.company.missing).toEqual(["legalName", "gstin", "stateCode"]);
    expect(JSON.stringify(op)).not.toContain("bankAccountEnc");
    await expect(operatorPayouts(expert())).rejects.toBeInstanceOf(AccessError);
  });

  it("the company records the payout: refused until its details are set; then every seat PAID_OUT, the invoice numbered in series with CGST+SGST, the expert told and reading it, another expert 404ing", async () => {
    expect(await recordPayout(operator(), firstPayoutId, { reference: `ZZUTR${STAMP}A` })).toMatchObject({ ok: false, errorKey: "gigs.refuseCompanyDetails" });
    await expect(recordPayout(expert(), firstPayoutId, { reference: `ZZUTR${STAMP}A` })).rejects.toBeInstanceOf(AccessError);
    // The company's details: checked for shape, the GSTIN's state must be the state code.
    await expect(saveCompanyDetails(expert(), company())).rejects.toBeInstanceOf(AccessError);
    expect(await saveCompanyDetails(operator(), { ...company(), gstin: "nope" })).toMatchObject({ ok: false, errorKey: "gigs.refuseGstin" });
    expect(await saveCompanyDetails(operator(), { ...company(), stateCode: "29" })).toMatchObject({ ok: false, errorKey: "gigs.refuseGstinState" });
    expect(await saveCompanyDetails(operator(), { ...company(), invoicePrefix: "bad prefix" })).toMatchObject({ ok: false, errorKey: "gigs.refuseInvoicePrefix" });
    expect(await saveCompanyDetails(operator(), company())).toMatchObject({ ok: true, company: { legalName: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", stateCode: "27", invoicePrefix: PREFIX, missing: [] } });
    expect((await companyDetails()).missing).toEqual([]);
    expect(await recordPayout(operator(), firstPayoutId, { reference: "short" })).toMatchObject({ ok: false, errorKey: "gigs.refuseUtr" });
    expect(await recordPayout(operator(), firstPayoutId, { reference: `ZZUTR${STAMP}A`, paidAt: "2099-01-01T00:00:00Z" })).toMatchObject({ ok: false, errorKey: "gigs.refusePaidAt" });
    await expect(recordPayout(operator(), "nope", { reference: `ZZUTR${STAMP}A` })).rejects.toBeInstanceOf(AccessError);
    const fy = financialYearOf(new Date());
    const recorded = await recordPayout(operator(), firstPayoutId, { reference: `zzutr${STAMP}a`, note: "ZZ paid by NEFT" });
    expect(recorded).toMatchObject({ ok: true, payout: { id: firstPayoutId, netPaise: 8320 + 8230, paymentsCount: 2, reference: `ZZUTR${STAMP}A` }, invoice: { number: `${PREFIX}/${fy}/0001`, totalPaise: 3000 + 450 } });
    const payout = await db.expertPayout.findUniqueOrThrow({ where: { id: firstPayoutId }, include: { payments: true, invoice: true } });
    expect(payout).toMatchObject({ status: "PAID", reference: `ZZUTR${STAMP}A`, paidByUserId: id.operator, note: "ZZ paid by NEFT" });
    expect(payout.payments.every((p) => p.status === "PAID_OUT" && p.paidOutAt !== null)).toBe(true);
    expect(payout.payments).toHaveLength(2);
    // The invoice: the commission is the taxable value, the GST split in half in the company's own state, both parties frozen, in the expert's language.
    expect(payout.invoice).toMatchObject({ number: `${PREFIX}/${fy}/0001`, series: `${PREFIX}/${fy}`, serial: 1, taxableValuePaise: 3000, cgstPaise: 225, sgstPaise: 225, igstPaise: 0, totalPaise: 3450, sacCode: "998599", locale: "hi" });
    expect(JSON.parse(payout.invoice!.sellerJson)).toMatchObject({ name: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", stateCode: "27" });
    expect(JSON.parse(payout.invoice!.buyerJson)).toMatchObject({ name: "ZZ Meenakshi Rao", gstin: null, stateCode: "27" });
    expect(JSON.parse(payout.invoice!.linesJson)).toHaveLength(2);
    expect(await audits("gig.payout.paid", firstPayoutId)).toBe(1);
    expect(await audits("gig.invoice.issue", payout.invoice!.id)).toBe(1);
    expect(await expertNotes("paidOut")).toBe(1);
    // Recorded once: again is refused, and so is the reference on another payout.
    expect(await recordPayout(operator(), firstPayoutId, { reference: `ZZUTR${STAMP}B` })).toMatchObject({ ok: false, errorKey: "gigs.refusePayoutPaid" });
    // The expert reads it, as a view and as a PDF; the operator too; another expert does not.
    const mine = await expertInvoices(expert());
    expect(mine.invoices).toHaveLength(1);
    const view = await invoiceView(expert(), payout.invoice!.id);
    expect(view).toMatchObject({ number: `${PREFIX}/${fy}/0001`, locale: "hi", seller: { gstin: "27AAACZ1234A1Z5" }, buyer: { name: "ZZ Meenakshi Rao" }, payout: { reference: `ZZUTR${STAMP}A`, netPaise: 8320 + 8230 } });
    expect(view.lines.reduce((a, l) => a + l.commissionPaise, 0)).toBe(3000);
    await expect(invoiceView(expert2(), payout.invoice!.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(invoiceView(g2(), payout.invoice!.id)).rejects.toBeInstanceOf(AccessError);
    expect((await expertInvoices(expert2())).invoices).toHaveLength(0);
    expect(await invoiceView(operator(), payout.invoice!.id)).toMatchObject({ id: payout.invoice!.id });
    expect((await operatorInvoices(operator())).invoices.find((i) => i.id === payout.invoice!.id)).toMatchObject({ expertName: `ZZ expert ${STAMP}` });
    const pdf = await renderInvoicePdf(view);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    const e = await expertEarnings(expert());
    expect(e).toMatchObject({ duePaise: 0, paidOutPaise: 8320 + 8230 });
    expect(e.payouts[0]).toMatchObject({ status: "PAID", reference: `ZZUTR${STAMP}A`, invoiceNumber: `${PREFIX}/${fy}/0001` });
    expect(e.invoices[0]).toMatchObject({ number: `${PREFIX}/${fy}/0001`, totalPaise: 3450 });
    const op = await operatorPayouts(operator());
    expect(op.paid.find((x) => x.id === firstPayoutId)).toMatchObject({ reference: `ZZUTR${STAMP}A`, invoiceNumber: `${PREFIX}/${fy}/0001` });
    expect(op.toPay.find((x) => x.id === firstPayoutId)).toBeUndefined();
    expect(op.paidOutThisMonthPaise).toBeGreaterThanOrEqual(8320 + 8230);
  });

  it("the next payout is 0002 with IGST for an expert in another state; a lost race takes no number; the same reference twice is refused", async () => {
    const fy = financialYearOf(new Date());
    const seat = await dueSeat();
    expect(seat.payoutId).not.toBe(firstPayoutId);
    expect(await expertNotes("due")).toBe(2);
    // The expert moves state: IGST on the next invoice, and the buyer frozen as of then.
    expect(await savePayee(expert(), { payeeName: "ZZ Meenakshi Rao", gstStateCode: "29", upiId: "zz.meenakshi@upi", gstin: "29AAAPR1234A1Z5" })).toMatchObject({ ok: true });
    expect(await recordPayout(operator(), seat.payoutId, { reference: `ZZUTR${STAMP}A` })).toMatchObject({ ok: false, errorKey: "gigs.refuseUtrUsed" });
    // Two records at once with fresh references: one wins, the other is refused, and the number it read is not kept.
    const [a, b] = await Promise.all([recordPayout(operator(), seat.payoutId, { reference: `ZZUTR${STAMP}C` }), recordPayout(operator(), seat.payoutId, { reference: `ZZUTR${STAMP}D` })]);
    const results = [a, b];
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    // The loser meets the winner's commit either at the rows (nothing DUE any more) or at the payout (already PAID): refused by name, nothing written.
    expect(results.filter((r) => !r.ok && (r.errorKey === "gigs.refusePayoutPaid" || r.errorKey === "gigs.refuseNothingDue"))).toHaveLength(1);
    const won = results.find((r) => r.ok) as { invoice: { id: string; number: string } };
    expect(won.invoice.number).toBe(`${PREFIX}/${fy}/0002`);
    const inv = await invoiceView(expert(), won.invoice.id);
    expect(inv).toMatchObject({ taxableValuePaise: 1500, cgstPaise: 0, sgstPaise: 0, igstPaise: 270, totalPaise: 1770, buyer: { gstin: "29AAAPR1234A1Z5", stateCode: "29" } });
    expect(await db.gigInvoice.count({ where: { series: `${PREFIX}/${fy}` } })).toBe(2);
    // A third payout takes 0003: no gap and no reuse.
    const third = await dueSeat();
    const r3 = await recordPayout(operator(), third.payoutId, { reference: `ZZUTR${STAMP}E` });
    expect(r3).toMatchObject({ ok: true, invoice: { number: `${PREFIX}/${fy}/0003` } });
    // Suspended payee: the payout waits.
    const fourth = await dueSeat();
    await suspendPayee(operator(), id.expert!, { suspended: true, note: "ZZ a query" });
    expect((await operatorPayouts(operator())).toPay.find((x) => x.id === fourth.payoutId)?.payee.status).toBe("SUSPENDED");
    await suspendPayee(operator(), id.expert!, { suspended: false });
    expect(await recordPayout(operator(), fourth.payoutId, { reference: `ZZUTR${STAMP}F` })).toMatchObject({ ok: true, invoice: { number: `${PREFIX}/${fy}/0004` } });
    // The company's details change afterwards: the issued invoices keep theirs.
    expect(await saveCompanyDetails(operator(), { ...company(), legalName: "ZZ Renamed Limited" })).toMatchObject({ ok: true });
    expect((await invoiceView(expert(), won.invoice.id)).seller.name).toBe("ZZ Shalaghar Test Private Limited");
  });

  it("cancelling: the family in time is refunded in full and the seat never joins a payout; late, the seat is paid for and due after the time; the provider, the office and a cancelled time refund", async () => {
    const inTime = await heldSeat(72);
    expect(await cancelBooking(g2(), inTime.bookingId)).toMatchObject({ ok: true, lateCancel: false });
    const refunded = await paymentOf(inTime.bookingId);
    expect(refunded).toMatchObject({ status: "REFUNDED", amountPaise: 10000, commissionPaise: 0, gstPaise: 0, netPaise: 0, payoutId: null });
    expect(refunded.refundId?.startsWith("rfnd_devbox")).toBe(true);
    expect(await audits("gig.payment.refunded", refunded.id)).toBe(1);
    expect(await notes("g2", "has been refunded")).toBe(1);
    expect((await expertEarnings(expert())).refundedPaise).toBeGreaterThanOrEqual(10000);
    expect(await familyReceipt(g2(), refunded.id)).toMatchObject({ status: "REFUNDED", refundedPaise: 10000 });
    await releaseSeatPayments(new Date(Date.now() + 1000 * HOUR));
    expect((await paymentOf(inTime.bookingId)).payoutId).toBeNull();
    expect(await db.sessionPayment.count({ where: { expertUserId: id.expert, status: "REFUNDED", payoutId: { not: null } } })).toBe(0);

    const late = await heldSeat(72);
    const { startsAt, endsAt } = await db.gigSlot.findUniqueOrThrow({ where: { id: late.slotId }, select: { startsAt: true, endsAt: true } });
    expect(await cancelBooking(g2(), late.bookingId, undefined, new Date(startsAt.getTime() - HOUR))).toMatchObject({ ok: true, lateCancel: true });
    const kept = await paymentOf(late.bookingId);
    expect(kept).toMatchObject({ status: "HELD" });
    expect(kept.holdUntil?.getTime()).toBe(endsAt.getTime() + HOLD_HOURS * HOUR);
    const run = await releaseSeatPayments(new Date(endsAt.getTime() + 49 * HOUR));
    expect(run.due).toBeGreaterThanOrEqual(1);
    expect(await paymentOf(late.bookingId)).toMatchObject({ status: "DUE" });

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
    expect(await paymentOf(missed.bookingId)).toMatchObject({ status: "DUE" });
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
    const bookedAgain = await bookSeat(g2(), { slotId: s, studentMembershipId: member.p2, purpose: "ZZ a seat given up before it is paid." });
    if (!bookedAgain.ok) throw new Error(bookedAgain.errorKey);
    expect(await cancelBooking(g2(), bookedAgain.bookingId)).toMatchObject({ ok: true });
    expect(await paymentOf(bookedAgain.bookingId)).toMatchObject({ status: "FAILED" });
    expect((await taken()).seatsTaken).toBe(0);
  });

  it("a failed order is replaced by a fresh one on the same row; a failed payment attempt may be captured on retry; a failed refund goes back to waiting with its figures", async () => {
    const s = await offer("WORKSHOP", { pricePaise: 6000, seats: 10 });
    const booked = await bookSeat(g2(), { slotId: s, studentMembershipId: member.p2, purpose: "ZZ a seat whose first attempt fails." });
    if (!booked.ok || !booked.checkout) throw new Error("no checkout");
    const failed = JSON.stringify({ event: "payment.failed", created_at: Math.floor(Date.now() / 1000), payload: { payment: { entity: { id: `pay_zz${STAMP}f`, order_id: booked.checkout.orderId, amount: 6000, error_description: "ZZ card declined" } } } });
    expect(await (await deliver(failed, signSessionsWebhook(failed))).json()).toMatchObject({ outcome: "failed" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "FAILED", reason: "ZZ card declined" });
    expect(await familyPayment(g2(), (await paymentOf(booked.bookingId)).id)).toMatchObject({ status: "FAILED", checkout: null });
    const fresh = await seatCheckout(g2(), booked.bookingId);
    expect(fresh.ok && fresh.checkout.orderId !== booked.checkout.orderId).toBe(true);
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "INITIATED", attempts: 1 });
    const body = captured((fresh as { checkout: { orderId: string } }).checkout.orderId, 6000, `pay_zz${STAMP}r`);
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ outcome: "settled" });
    expect(await bookingOf(booked.bookingId)).toMatchObject({ status: "CONFIRMED" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "HELD", commissionPaise: 900, gstPaise: 162, netPaise: 4938 });
    expect(await settleSeatPayment({ orderId: (fresh as { checkout: { orderId: string } }).checkout.orderId, gatewayPaymentId: "pay_x", amountPaise: 6000 })).toMatchObject({ outcome: "already" });
    expect(await settleSeatPayment({ orderId: "order_nobody", gatewayPaymentId: "pay_x", amountPaise: 6000 })).toMatchObject({ outcome: "unknown-order" });
    // A refund the gateway later says failed: the money never left, the row waits with the figures it had, and the operator may try again.
    expect(await cancelBooking(g2(), booked.bookingId)).toMatchObject({ ok: true });
    const refunded = await paymentOf(booked.bookingId);
    expect(refunded).toMatchObject({ status: "REFUNDED", netPaise: 0 });
    const refundFailed = JSON.stringify({ event: "refund.failed", created_at: Math.floor(Date.now() / 1000), payload: { refund: { entity: { id: refunded.refundId, error_description: "ZZ bank bounced it" } } } });
    expect(await (await deliver(refundFailed, signSessionsWebhook(refundFailed))).json()).toMatchObject({ outcome: "refund-failed" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "HELD", pendingAction: "REFUND", netPaise: 4938 });
    expect((await operatorPayouts(operator())).failures.find((f) => f.paymentId === refunded.id)).toMatchObject({ action: "REFUND", amountPaise: 6000 });
    expect(await retrySeatPayment(operator(), refunded.id)).toMatchObject({ ok: true, outcome: "refunded" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "REFUNDED", pendingAction: null });
  });
});
