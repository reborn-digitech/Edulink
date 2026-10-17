import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { gigSettings } from "@/lib/gig-questions";
import { bookSeat, cancelBooking, cancelSlot, closeBooking, consentToBooking, expertPayoutStanding, familySessions, mySlots, offerSlot, paidGate, releaseSeatPayments, reportUnheld, schoolSessions, seatCheckout, settleSeatPayment } from "@/lib/gig-sessions";
import { companyDetails, expertEarnings, expertInvoices, familyPayment, familyReceipt, financialYearOf, invoiceView, linkAllExperts, linkMyAccount, operatorInvoices, operatorPayouts, recordPayout, retrySeatPayment, routeReadiness, saveCompanyDetails, savePayee, setPaymentsEnabled, suspendPayee, HOLD_HOURS, UNPAID_SEAT_EXPIRY_MS } from "@/lib/gig-payments";
import { renderInvoicePdf, renderReceiptPdf } from "@/lib/gig-invoice-pdf";
import { ALLOWED_CALLS, signSessionsWebhook, stateNameOf, templateOf } from "@/lib/gig-gateway";
import { POST as webhook } from "@/app/api/webhooks/gateway/sessions/route";
import type { ActiveContext } from "@/lib/session";

/**
 * Paid workshop seats through Razorpay Route (decision 0004, third amendment
 * of 2 October 2026), under the devbox transport: the expert's payee details
 * (bank and PAN sealed, never in a view or the log) and the four-step link
 * to a Route linked account, resumed, re-sent on a new bank account, and
 * shut against a changed name, PAN or address; the switch refused until
 * Route is proven (a gateway, the webhook's secret, the company's details,
 * one account activated); the order carrying the expert's net as a held
 * transfer, the figures frozen with the order; the seat HELD once the
 * transfer is known; the hold taken off 48 hours after delivery — RELEASED,
 * one payout per expert per run with its invoice in series, CGST+SGST in the
 * company's state and IGST outside it, two runs at once releasing once;
 * refunds reversing the transfer; the webhook's transfer and linked-account
 * events; the company-collects rows of the second amendment still recorded
 * by hand. As the database's owner, so the rules and not the policies.
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
  return { kind, title: `ZZ paid ${STAMP}-${n}`, startsAt: new Date(Date.now() + hoursAhead * HOUR + n * 4 * HOUR).toISOString(), meetingUrl: `https://meet.jit.si/zz-pay-${STAMP}-${n}`, ...over };
};
const offer = async (kind: "ONE_TO_ONE" | "WORKSHOP", over: Record<string, unknown> = {}, hoursAhead = 48) => {
  const result = await offerSlot(expert(), slot(kind, hoursAhead, over));
  if (!result.ok) throw new Error(`offer refused: ${result.errorKey}`);
  return result.slotId;
};
const deliver = (body: string, signature: string | null) => webhook(new Request("http://localhost/api/webhooks/gateway/sessions", { method: "POST", headers: { "content-type": "application/json", ...(signature ? { "x-razorpay-signature": signature } : {}) }, body }));
const signed = async (event: Record<string, unknown>) => {
  const body = JSON.stringify({ created_at: Math.floor(Date.now() / 1000), ...event });
  return (await deliver(body, signSessionsWebhook(body))).json() as Promise<{ ok: boolean; outcome: string }>;
};
const captured = (orderId: string, amount: number, paymentId = `pay_zz${STAMP}${n}`) => JSON.stringify({ event: "payment.captured", created_at: Math.floor(Date.now() / 1000), payload: { payment: { entity: { id: paymentId, order_id: orderId, amount } } } });
const paymentOf = (bookingId: string) => db.sessionPayment.findUniqueOrThrow({ where: { bookingId } });
const bookingOf = (bookingId: string) => db.gigBooking.findUniqueOrThrow({ where: { id: bookingId }, select: { status: true, paid: true, lateCancel: true } });
const accountOf = (key: string) => db.expertPayoutAccount.findUniqueOrThrow({ where: { expertUserId: id[key]! } });
const notes = (userKey: string, needle: string) => db.notification.count({ where: { userId: id[userKey], title: { contains: needle } } });
const audits = (action: string, targetId: string) => db.auditLog.count({ where: { action, targetId } });
/** The expert reads Hindi (prefs.locale, set below so the invoice is issued in it): their notices are counted by the Hindi words. */
const expertNotes = (needle: "released" | "routeActive" | "due" | "paidOut") => notes("expert", { released: "आपके लिए जारी हुआ", routeActive: "सक्रिय कर दिया", due: "आपको देय है", paidOut: "भेज दिया गया" }[needle]);
const company = (over: Record<string, unknown> = {}) => ({ legalName: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", address: "ZZ 1 Test Road, Pune", stateCode: "27", sacCode: "998599", invoicePrefix: PREFIX, gstPercent: 18, ...over });
const details = (over: Record<string, unknown> = {}) => ({ payeeName: "ZZ Meenakshi Rao", bankAccount: "1234 5678 9012 3456", ifsc: "hdfc0001234", pan: "abcpe1234f", addressLine: "ZZ 12 Shaniwar Peth", city: "Pune", postalCode: "411030", phone: "+91 98765 43210", gstStateCode: "27", ...over });
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
  expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "HELD", path: "ROUTE" });
  return { slotId: s, bookingId: booked.bookingId, orderId: booked.checkout.orderId };
}
/** A HELD seat delivered; returns when its hold ends. */
async function deliveredSeat(price = 10000) {
  const seat = await heldSeat(48, price);
  const startsAt = (await db.gigSlot.findUniqueOrThrow({ where: { id: seat.slotId }, select: { startsAt: true } })).startsAt;
  const closedAt = new Date(startsAt.getTime() + 10 * 60_000);
  expect(await closeBooking(expert(), seat.bookingId, "DELIVERED", closedAt)).toMatchObject({ ok: true });
  return { ...seat, holdEnds: new Date(closedAt.getTime() + HOLD_HOURS * HOUR) };
}
/** A seat delivered and its hold run: RELEASED, in a payout with its invoice. */
async function releasedSeat(price = 10000) {
  const seat = await deliveredSeat(price);
  await releaseSeatPayments(new Date(seat.holdEnds.getTime() + HOUR));
  const p = await paymentOf(seat.bookingId);
  expect(p.status).toBe("RELEASED");
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
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId }, { targetId: { in: users } }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: { ...saved, paymentsEnabled: savedSwitch, ...savedCompany } });
  await db.$disconnect();
});

describe("the gateway adapter", () => {
  it("knows the gateway's ids, by the longest prefix first, and can make exactly the Route calls it lists", () => {
    expect(templateOf("/v2/accounts/acc_GLGeLkU2JUeyDZ/products/acc_prd_HEgNpywUFctQ9e")).toBe("/v2/accounts/{accountId}/products/{productId}");
    expect(templateOf("/v1/payments/pay_abc/transfers")).toBe("/v1/payments/{paymentId}/transfers");
    expect(templateOf("/v1/transfers/trf_abc")).toBe("/v1/transfers/{transferId}");
    expect(ALLOWED_CALLS.map((c) => `${c.method} ${c.path}`)).toEqual([
      "POST /v1/orders",
      "GET /v1/payments/{paymentId}",
      "GET /v1/payments/{paymentId}/transfers",
      "POST /v1/payments/{paymentId}/transfers",
      "PATCH /v1/transfers/{transferId}",
      "POST /v1/payments/{paymentId}/refund",
      "POST /v2/accounts",
      "POST /v2/accounts/{accountId}/stakeholders",
      "POST /v2/accounts/{accountId}/products",
      "PATCH /v2/accounts/{accountId}/products/{productId}",
      "GET /v2/accounts/{accountId}/products/{productId}",
    ]);
    expect(stateNameOf("27")).toBe("MAHARASHTRA");
    expect(stateNameOf("99")).toBeNull();
  });
});

describe("the expert's linked account", () => {
  it("the payee details refuse each wrong field by name; the bank account and the PAN are sealed, their last four kept, neither in any view or the log", async () => {
    await expect(savePayee(g1(), details())).rejects.toBeInstanceOf(AccessError);
    expect(await savePayee(expert(), details({ payeeName: "Om" }))).toMatchObject({ ok: false, errorKey: "gigs.refusePayeeName" });
    expect(await savePayee(expert(), details({ bankAccount: null }))).toMatchObject({ ok: false, errorKey: "gigs.refuseBankAccount" });
    expect(await savePayee(expert(), details({ bankAccount: "12" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseBankAccount" });
    expect(await savePayee(expert(), details({ ifsc: "HDFC1234" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseIfsc" });
    expect(await savePayee(expert(), details({ pan: null }))).toMatchObject({ ok: false, errorKey: "gigs.refusePan" });
    expect(await savePayee(expert(), details({ pan: "AAACZ1234A" }))).toMatchObject({ ok: false, errorKey: "gigs.refusePan" });
    expect(await savePayee(expert(), details({ addressLine: "Z" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseAddress" });
    expect(await savePayee(expert(), details({ postalCode: "011030" }))).toMatchObject({ ok: false, errorKey: "gigs.refusePostalCode" });
    expect(await savePayee(expert(), details({ phone: "12345" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseMobile" });
    expect(await savePayee(expert(), details({ gstStateCode: "99" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseStateCode" });
    expect(await savePayee(expert(), details({ gstin: "29AAAPR1234A1Z5" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseGstinState" });
    const saved = await savePayee(expert(), details());
    expect(saved).toMatchObject({ ok: true, payout: { status: "NONE", payeeName: "ZZ Meenakshi Rao", bankLast4: "3456", ifsc: "HDFC0001234", panLast4: "234F", phone: "9876543210", postalCode: "411030", gstStateCode: "27", kycVerified: false, route: { status: "NONE", linked: false, readyToLink: false, locked: false } } });
    const row = await accountOf("expert");
    expect(row.bankAccountEnc?.startsWith("v2.")).toBe(true);
    expect(row.panEnc?.startsWith("v2.")).toBe(true);
    for (const shown of [JSON.stringify(saved), JSON.stringify(await expertPayoutStanding(expert())), JSON.stringify(await operatorPayouts(operator()))]) {
      expect(shown).not.toContain("1234567890");
      expect(shown).not.toContain("ABCPE1234F");
      expect(shown).not.toContain(row.bankAccountEnc);
      expect(shown).not.toContain(row.panEnc);
    }
    const log = await db.auditLog.findFirst({ where: { action: "gig.payee.save", targetId: id.expert! }, select: { meta: true } });
    expect(log?.meta ?? "").not.toMatch(/3456|234F|9876543210/);
    // A blank bank account and PAN keep the ones saved.
    expect(await savePayee(expert(), details({ bankAccount: null, pan: null }))).toMatchObject({ ok: true, payout: { bankLast4: "3456", panLast4: "234F" } });
  });

  it("the link waits for KYC and for every detail; then four steps make an account Razorpay activates, the expert told once; pressed again it only asks", async () => {
    expect(await linkMyAccount(expert())).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedKyc" });
    expect(await linkMyAccount(expert2())).toMatchObject({ ok: false, errorKey: "gigs.refuseLinkDetails" });
    await expect(linkMyAccount(g1())).rejects.toBeInstanceOf(AccessError);
    await db.expertProfile.update({ where: { userId: id.expert! }, data: { kycStatus: "VERIFIED", verifiedAt: new Date() } });
    expect((await expertPayoutStanding(expert())).payout).toMatchObject({ status: "NONE", kycVerified: true, route: { readyToLink: true } });
    const linked = await linkMyAccount(expert());
    expect(linked).toMatchObject({ ok: true, outcome: "activated", payout: { status: "ACTIVE", route: { status: "ACTIVATED", linked: true, needsResend: false, locked: true, error: null } } });
    const row = await accountOf("expert");
    expect(row.linkedAccountId?.startsWith("acc_devbox")).toBe(true);
    expect(row.stakeholderId?.startsWith("sth_devbox")).toBe(true);
    expect(row.routeProductId?.startsWith("acc_prd_devbox")).toBe(true);
    expect(row.routeSubmittedKey).toBeTruthy();
    expect(await audits("gig.route.account", id.expert!)).toBe(1);
    expect(await expertNotes("routeActive")).toBe(1);
    // Pressed again with nothing changed: the same account, the status asked after, no second notice.
    expect(await linkMyAccount(expert())).toMatchObject({ ok: true, outcome: "activated" });
    expect((await accountOf("expert")).linkedAccountId).toBe(row.linkedAccountId);
    expect(await audits("gig.route.account", id.expert!)).toBe(1);
    expect(await expertNotes("routeActive")).toBe(1);
  });

  it("once linked, the name, PAN and address are Razorpay's; a new bank account must be sent again before a seat can be sold", async () => {
    expect(await savePayee(expert(), details({ addressLine: "ZZ 99 Elsewhere Road", bankAccount: null, pan: null }))).toMatchObject({ ok: false, errorKey: "gigs.refuseRouteLocked" });
    expect(await savePayee(expert(), details({ pan: "ABCPE9999F", bankAccount: null }))).toMatchObject({ ok: false, errorKey: "gigs.refuseRouteLocked" });
    expect(await savePayee(expert(), details({ payeeName: "ZZ Meenakshi R", bankAccount: null, pan: null }))).toMatchObject({ ok: false, errorKey: "gigs.refuseRouteLocked" });
    // The same PAN typed again is no change.
    const moved = await savePayee(expert(), details({ bankAccount: "9999 8888 7777", ifsc: "SBIN0001234", pan: "ABCPE1234F" }));
    expect(moved).toMatchObject({ ok: true, payout: { status: "NONE", bankLast4: "7777", route: { status: "ACTIVATED", needsResend: true } } });
    expect((await paidGate(id.expert!)).payoutActive).toBe(false);
    expect(await linkMyAccount(expert())).toMatchObject({ ok: true, outcome: "activated", payout: { status: "ACTIVE", route: { needsResend: false } } });
  });

  it("the operator links every ready expert at once and reads each account; a suspension stops the gate", async () => {
    await savePayee(expert2(), details({ payeeName: "ZZ Second Expert", pan: "ABCPF1234G" }));
    const run = await linkAllExperts(operator());
    expect(run).toMatchObject({ ok: true });
    expect((run as { run: { activated: number } }).run.activated).toBeGreaterThanOrEqual(1);
    expect((await accountOf("expert2")).routeStatus).toBe("ACTIVATED");
    await expect(linkAllExperts(expert())).rejects.toBeInstanceOf(AccessError);
    const op = await operatorPayouts(operator());
    expect(op.routeAccounts.find((a) => a.expertUserId === id.expert)).toMatchObject({ status: "ACTIVATED", linked: true, kycVerified: true, suspended: false });
    expect(await suspendPayee(operator(), id.expert!, { suspended: true })).toMatchObject({ ok: false, errorKey: "gigs.needReason" });
    expect(await suspendPayee(operator(), id.expert!, { suspended: true, note: "ZZ papers queried" })).toMatchObject({ ok: true, payout: { status: "SUSPENDED", note: "ZZ papers queried" } });
    expect(await linkMyAccount(expert())).toMatchObject({ ok: false, errorKey: "gigs.refusePayeeSuspended" });
    expect((await paidGate(id.expert!)).payoutActive).toBe(false);
    await expect(suspendPayee(expert(), id.expert!, { suspended: false })).rejects.toBeInstanceOf(AccessError);
    expect(await suspendPayee(operator(), id.expert!, { suspended: false })).toMatchObject({ ok: true, payout: { status: "ACTIVE", note: null } });
  });

  it("the gateway's review moves by webhook: more asked for, the gate shut; activated again, the expert told", async () => {
    const accountId = (await accountOf("expert")).linkedAccountId!;
    const productId = (await accountOf("expert")).routeProductId!;
    const product = (status: string, requirements: unknown[] = []) => ({ event: `product.route.${status}`, id: `evt_zz${STAMP}${status}`, account_id: accountId, payload: { merchant_product: { entity: { id: productId, merchant_id: accountId, activation_status: status }, data: { requirements } } } });
    expect(await signed(product("needs_clarification", [{ field_reference: "settlements.ifsc_code", reason_code: "needs_clarification" }]))).toMatchObject({ ok: true, outcome: "route-status" });
    expect((await expertPayoutStanding(expert())).payout).toMatchObject({ status: "NONE", route: { status: "NEEDS_CLARIFICATION", requirements: [{ field: "settlements.ifsc_code", reason: "needs_clarification" }] } });
    expect(await signed(product("activated"))).toMatchObject({ outcome: "route-status" });
    expect((await expertPayoutStanding(expert())).payout).toMatchObject({ status: "ACTIVE", route: { status: "ACTIVATED", requirements: [] } });
    expect(await expertNotes("routeActive")).toBe(2);
    expect(await signed({ ...product("activated"), id: `evt_zz${STAMP}stranger`, account_id: "acc_nobody", payload: { merchant_product: { entity: { id: "acc_prd_nobody", merchant_id: "acc_nobody", activation_status: "activated" } } } })).toMatchObject({ outcome: "ignored" });
  });
});

describe("the paid gate and the switch", () => {
  it("a one-to-one is priced behind the same gate as a workshop seat (decision 0006), a teacher behind theirs, and each remaining condition refuses by name until it is met", async () => {
    // Since 17 Oct 2026 (seats) a one-to-one may carry a price: the expert's gate is asked of it as of a workshop seat,
    // and a teacher's guidance asks the teacher's own (a UPI id saved; tests/seats.test.ts has the rest).
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedMentoring" });
    expect(await offerSlot(teacher(), slot("ONE_TO_ONE", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "seats.refuseTeacherPayee" });
    // An open free one-to-one in the coming thirty days.
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedMentoring" });
    expect((await expertPayoutStanding(expert())).gate).toMatchObject({ paymentsOn: true, kycVerified: true, payoutActive: true, mentoringOffer: false, dutyDone: true, canCharge: false });
    await offer("ONE_TO_ONE", {}, 40 * 24);
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseNeedMentoring" });
    await offer("ONE_TO_ONE");
    expect((await paidGate(id.expert!)).mentoringOffer).toBe(true);
    // The period's free one-to-ones given.
    await db.gigSettings.update({ where: { id: "gigs" }, data: { expertStartOneToOnes: 1 } });
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.freeDutyFirst", vars: { count: 1 } });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { expertStartOneToOnes: 0 } });
    // The band.
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 4900 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePrice" });
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 30100 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePrice" });
    const priced = await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }));
    expect(priced.ok).toBe(true);
    const view = await mySlots(expert());
    expect(view.gate).toMatchObject({ canCharge: true, seatPriceMinPaise: 5000, seatPriceMaxPaise: 30000, commissionPercent: 15 });
    expect(view.slots.find((s) => s.id === (priced as { slotId: string }).slotId)?.pricePaise).toBe(10000);
  });

  it("off, every session is free; on is refused until Route is proven, the company's details last; the operator's alone", async () => {
    await setPaymentsEnabled(operator(), false);
    await expect(setPaymentsEnabled(expert(), true)).rejects.toBeInstanceOf(AccessError);
    expect(await offerSlot(expert(), slot("WORKSHOP", 48, { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePaymentsOff" });
    expect((await paidGate(id.expert!)).paymentsOn).toBe(false);
    expect((await familySessions(g1())).paymentsOn).toBe(false);
    // The gateway (devbox), the webhook's secret and an activated account are there; the company is not.
    expect(await routeReadiness()).toMatchObject({ gatewaySet: true, webhookSet: true, companySet: false, ready: false });
    expect((await routeReadiness()).activated).toBeGreaterThanOrEqual(2);
    expect(await setPaymentsEnabled(operator(), true)).toMatchObject({ ok: false, errorKey: "gigs.refuseRouteNotReady" });
    expect((await operatorPayouts(operator())).paymentsEnabled).toBe(false);
    // The company's details: checked for shape, the GSTIN's state must be the state code.
    await expect(saveCompanyDetails(expert(), company())).rejects.toBeInstanceOf(AccessError);
    expect(await saveCompanyDetails(operator(), company({ gstin: "nope" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseGstin" });
    expect(await saveCompanyDetails(operator(), company({ stateCode: "29" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseGstinState" });
    expect(await saveCompanyDetails(operator(), company({ invoicePrefix: "bad prefix" }))).toMatchObject({ ok: false, errorKey: "gigs.refuseInvoicePrefix" });
    expect(await saveCompanyDetails(operator(), company())).toMatchObject({ ok: true, company: { legalName: "ZZ Shalaghar Test Private Limited", missing: [] } });
    expect((await companyDetails()).missing).toEqual([]);
    expect((await operatorPayouts(operator())).route).toMatchObject({ ready: true });
    expect(await setPaymentsEnabled(operator(), true)).toMatchObject({ ok: true, paymentsEnabled: true });
    expect(await db.auditLog.count({ where: { action: { in: ["gig.payments.on", "gig.payments.off"] }, actorUserId: id.operator } })).toBe(2);
  });
});

describe("a paid seat, from the order to Razorpay's release", () => {
  let paidSlot = "";
  let bookingId = "";
  let orderId = "";

  it("a priced seat is bought whatever is left of the allowance (seats, 17 Oct 2026); a guardian's booking waits for payment with an order carrying the expert's net, and a pupil's ask waits for consent and then payment", async () => {
    paidSlot = await offer("WORKSHOP", { pricePaise: 10000, seats: 10 });
    // The allowance is for free times alone: p1 has both free workshop seats left, and the priced seat is still bought.
    const bought = await bookSeat(g1(), { slotId: paidSlot, studentMembershipId: member.p1, purpose: "ZZ the first workshop of the year, priced." });
    expect(bought).toMatchObject({ ok: true, status: "PENDING_PAYMENT" });
    expect(await bookingOf((bought as { bookingId: string }).bookingId)).toMatchObject({ paid: true });
    expect((await familySessions(g1())).children[0]!.allowance.WORKSHOP.used).toBe(0);
    // Given up before it is paid, so the job's count of unpaid seats below is this file's own.
    expect(await cancelBooking(g1(), (bought as { bookingId: string }).bookingId)).toMatchObject({ ok: true });
    await useAllowance("p2", g2());
    const booked = await bookSeat(g2(), { slotId: paidSlot, studentMembershipId: member.p2, purpose: "ZZ a third workshop, past the two free ones." });
    expect(booked).toMatchObject({ ok: true, status: "PENDING_PAYMENT" });
    const checkout = (booked as { checkout: { paymentId: string; orderId: string; amountPaise: number; transport: string } }).checkout;
    expect(checkout).toMatchObject({ amountPaise: 10000, transport: "devbox" });
    expect(checkout.orderId.startsWith("order_devbox")).toBe(true);
    bookingId = (booked as { bookingId: string }).bookingId;
    orderId = checkout.orderId;
    expect(await bookingOf(bookingId)).toMatchObject({ status: "PENDING_PAYMENT", paid: true });
    expect(await paymentOf(bookingId)).toMatchObject({ status: "INITIATED", path: "ROUTE", transferId: null, amountPaise: 10000, commissionPaise: 1500, gstPaise: 270, netPaise: 8230, receiptNumber: null, payerUserId: id.g2, expertUserId: id.expert });
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
    await expect(familyReceipt(g1(), (await paymentOf((asked as { bookingId: string }).bookingId)).id)).rejects.toMatchObject({ key: "gigs.noReceiptYet" });
    // An expert whose account is not active cannot be bought from: the order is refused.
    await db.expertPayoutAccount.update({ where: { expertUserId: id.expert! }, data: { routeStatus: "UNDER_REVIEW" } });
    const blocked = await offer("WORKSHOP", { pricePaise: 5000 }).catch((e: Error) => e.message);
    expect(blocked).toBe("offer refused: gigs.refuseNeedPayout");
    await db.expertPayoutAccount.update({ where: { expertUserId: id.expert! }, data: { routeStatus: "ACTIVATED" } });
  });

  it("the webhook: refused without a good signature, settles once with the order's figures and the receipt numbered, holds the seat once the transfer is known, and refuses a mismatched amount", async () => {
    const body = captured(orderId, 10000, `pay_zz${STAMP}a`);
    expect((await deliver(body, null)).status).toBe(401);
    expect((await deliver(body, "deadbeef")).status).toBe(401);
    expect((await deliver("not json", signSessionsWebhook("not json"))).status).toBe(400);
    const wrong = captured(orderId, 9999, `pay_zz${STAMP}w`);
    expect(await (await deliver(wrong, signSessionsWebhook(wrong))).json()).toMatchObject({ ok: true, outcome: "amount-mismatch" });
    expect(await bookingOf(bookingId)).toMatchObject({ status: "PENDING_PAYMENT" });
    // The dials change between the order and the capture: the order's transfer already carries the net, so its figures stand.
    await db.gigSettings.update({ where: { id: "gigs" }, data: { gstPercent: 12 } });
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ ok: true, outcome: "settled" });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { gstPercent: 18 } });
    expect(await bookingOf(bookingId)).toMatchObject({ status: "CONFIRMED", paid: true });
    const p = await paymentOf(bookingId);
    expect(p).toMatchObject({ status: "HELD", path: "ROUTE", paymentId: `pay_zz${STAMP}a`, amountPaise: 10000, commissionPaise: 1500, gstPaise: 270, netPaise: 8230, receiptSerial: 1, receiptNumber: `${PREFIX}-R/${financialYearOf(new Date())}/0001` });
    expect(p.transferId?.startsWith("trf_devbox")).toBe(true);
    expect(p.paidAt).not.toBeNull();
    expect(p.holdUntil).toBeNull();
    expect(await audits("gig.payment.paid", p.id)).toBe(1);
    expect(await audits("gig.payment.held", p.id)).toBe(1);
    expect(await notes("g2", "is confirmed")).toBe(1);
    expect(await notes("admin", "is to meet")).toBeGreaterThanOrEqual(1);
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ ok: true, outcome: "already" });
    const replay = JSON.stringify({ ...JSON.parse(body), created_at: Math.floor(Date.now() / 1000) + 5 });
    expect(await (await deliver(replay, signSessionsWebhook(replay))).json()).toMatchObject({ ok: true, outcome: "already" });
    expect(await audits("gig.payment.paid", p.id)).toBe(1);
    // The family reads it; another family does not; the receipt names the company, now its details are set.
    expect(await familyPayment(g2(), p.id)).toMatchObject({ status: "HELD", bookingStatus: "CONFIRMED", checkout: null, receiptNumber: p.receiptNumber });
    await expect(familyPayment(g1(), p.id)).rejects.toBeInstanceOf(AccessError);
    const receipt = await familyReceipt(g2(), p.id);
    expect(receipt).toMatchObject({ receiptNumber: p.receiptNumber, amountPaise: 10000, expertName: `ZZ expert ${STAMP}`, pupilName: `ZZ p2 ${STAMP}`, payerName: `ZZ g2 ${STAMP}`, collectedBy: "ZZ Shalaghar Test Private Limited", refundedAt: null });
    expect(JSON.stringify(receipt)).not.toContain("8230");
    await expect(familyReceipt(g1(), p.id)).rejects.toBeInstanceOf(AccessError);
    expect((await renderReceiptPdf(receipt, "mr")).subarray(0, 5).toString()).toBe("%PDF-");
    const other = await heldSeat();
    expect(await paymentOf(other.bookingId)).toMatchObject({ receiptSerial: 2, receiptNumber: `${PREFIX}-R/${financialYearOf(new Date())}/0002` });
  });

  it("delivered: 48 hours later the job takes the hold off — RELEASED, one payout with its invoice in series, the expert told; nothing released while the switch is off; two runs at once release once", async () => {
    const fy = financialYearOf(new Date());
    const startsAt = (await db.gigSlot.findUniqueOrThrow({ where: { id: paidSlot }, select: { startsAt: true } })).startsAt;
    const closedAt = new Date(startsAt.getTime() + 10 * 60_000);
    expect(await closeBooking(expert(), bookingId, "DELIVERED", closedAt)).toMatchObject({ ok: true });
    const held = await paymentOf(bookingId);
    expect(held.holdUntil?.getTime()).toBe(closedAt.getTime() + HOLD_HOURS * HOUR);
    expect((await releaseSeatPayments(new Date(closedAt.getTime() + HOUR))).released).toBe(0);
    await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: false } });
    expect((await releaseSeatPayments(new Date(closedAt.getTime() + 49 * HOUR))).released).toBe(0);
    expect(await paymentOf(bookingId)).toMatchObject({ status: "HELD" });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: true } });
    expect(await retrySeatPayment(operator(), held.id, new Date(closedAt.getTime() + HOUR))).toMatchObject({ ok: false, errorKey: "gigs.refuseNothingToRetry" });
    const at = new Date(closedAt.getTime() + 49 * HOUR);
    const [r1, r2] = await Promise.all([releaseSeatPayments(at), releaseSeatPayments(at)]);
    expect(r1.released + r2.released).toBe(1);
    expect(r1.invoiced + r2.invoiced).toBe(1);
    const released = await paymentOf(bookingId);
    expect(released).toMatchObject({ status: "RELEASED", pendingAction: null });
    expect(released.releasedAt?.getTime()).toBe(at.getTime());
    const payout = await db.expertPayout.findUniqueOrThrow({ where: { id: released.payoutId! }, include: { payments: true, invoice: true } });
    expect(payout).toMatchObject({ expertUserId: id.expert, status: "RELEASED", netPaise: 8230, paymentsCount: 1, reference: null });
    expect(payout.paidAt?.getTime()).toBe(at.getTime());
    expect(payout.invoice).toMatchObject({ number: `${PREFIX}/${fy}/0001`, serial: 1, taxableValuePaise: 1500, cgstPaise: 135, sgstPaise: 135, igstPaise: 0, totalPaise: 1770, sacCode: "998599", locale: "hi" });
    expect(JSON.parse(payout.invoice!.sellerJson)).toMatchObject({ name: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", stateCode: "27" });
    expect(JSON.parse(payout.invoice!.buyerJson)).toMatchObject({ name: "ZZ Meenakshi Rao", gstin: null, stateCode: "27" });
    expect(await audits("gig.payment.released", released.id)).toBe(1);
    expect(await audits("gig.payout.released", payout.id)).toBe(1);
    expect(await audits("gig.invoice.issue", payout.invoice!.id)).toBe(1);
    expect(await expertNotes("released")).toBe(1);
    // Released once: the next run finds nothing.
    expect((await releaseSeatPayments(new Date(at.getTime() + HOUR))).released).toBe(0);
    // The expert reads it all; another expert reads none of it.
    const e = await expertEarnings(expert());
    expect(e).toMatchObject({ releasedPaise: 8230, duePaise: 0, paidOutPaise: 0 });
    expect(e.rows.find((r) => r.bookingId === bookingId)).toMatchObject({ status: "RELEASED", netPaise: 8230, payoutId: payout.id });
    expect(e.payouts.find((x) => x.id === payout.id)).toMatchObject({ status: "RELEASED", reference: null, invoiceNumber: `${PREFIX}/${fy}/0001` });
    const view = await invoiceView(expert(), payout.invoice!.id);
    expect(view).toMatchObject({ payout: { reference: null, netPaise: 8230 } });
    expect((await renderInvoicePdf(view)).subarray(0, 5).toString()).toBe("%PDF-");
    await expect(invoiceView(expert2(), payout.invoice!.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(invoiceView(g2(), payout.invoice!.id)).rejects.toBeInstanceOf(AccessError);
    expect((await expertInvoices(expert2())).invoices).toHaveLength(0);
    expect((await operatorInvoices(operator())).invoices.find((i) => i.id === payout.invoice!.id)).toMatchObject({ expertName: `ZZ expert ${STAMP}` });
    const op = await operatorPayouts(operator());
    expect(op.paid.find((x) => x.id === payout.id)).toMatchObject({ status: "RELEASED", invoiceNumber: `${PREFIX}/${fy}/0001` });
    expect(op.releasedThisMonthPaise).toBeGreaterThanOrEqual(8230);
    expect(op.commissionThisMonthPaise).toBeGreaterThanOrEqual(1500);
    expect(JSON.stringify(op)).not.toContain("bankAccountEnc");
    await expect(operatorPayouts(expert())).rejects.toBeInstanceOf(AccessError);
  });

  it("each run is its own payout and invoice, 0002 then 0003; IGST when the company is in another state; the company's details changing later leaves issued invoices as they were", async () => {
    const fy = financialYearOf(new Date());
    const a = await releasedSeat();
    expect((await db.gigInvoice.findUniqueOrThrow({ where: { payoutId: a.payoutId } })).number).toBe(`${PREFIX}/${fy}/0002`);
    expect(await expertNotes("released")).toBe(2);
    expect(await saveCompanyDetails(operator(), company({ gstin: "29AAACZ1234A1Z5", stateCode: "29" }))).toMatchObject({ ok: true });
    const b = await releasedSeat();
    expect(b.payoutId).not.toBe(a.payoutId);
    expect(await db.gigInvoice.findUniqueOrThrow({ where: { payoutId: b.payoutId } })).toMatchObject({ number: `${PREFIX}/${fy}/0003`, taxableValuePaise: 1500, cgstPaise: 0, sgstPaise: 0, igstPaise: 270, totalPaise: 1770 });
    expect(await saveCompanyDetails(operator(), company({ legalName: "ZZ Renamed Limited" }))).toMatchObject({ ok: true });
    expect(JSON.parse((await db.gigInvoice.findUniqueOrThrow({ where: { payoutId: a.payoutId } })).sellerJson).name).toBe("ZZ Shalaghar Test Private Limited");
    await saveCompanyDetails(operator(), company());
  });

  it("without the company's details a release still goes and its invoice waits for them", async () => {
    const seat = await deliveredSeat();
    await db.gigSettings.update({ where: { id: "gigs" }, data: { companyGstin: null } });
    const run = await releaseSeatPayments(new Date(seat.holdEnds.getTime() + HOUR));
    expect(run).toMatchObject({ released: 1, invoiced: 0 });
    expect(await paymentOf(seat.bookingId)).toMatchObject({ status: "RELEASED", payoutId: null });
    await saveCompanyDetails(operator(), company());
    expect((await releaseSeatPayments(new Date(seat.holdEnds.getTime() + 2 * HOUR))).invoiced).toBe(1);
    expect((await paymentOf(seat.bookingId)).payoutId).toBeTruthy();
  });

  it("cancelling: the family in time is refunded with the transfer reversed and never in a payout; late, the seat is released after the time; the provider, the office and a cancelled time refund", async () => {
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

    const late = await heldSeat(72);
    const { startsAt, endsAt } = await db.gigSlot.findUniqueOrThrow({ where: { id: late.slotId }, select: { startsAt: true, endsAt: true } });
    expect(await cancelBooking(g2(), late.bookingId, undefined, new Date(startsAt.getTime() - HOUR))).toMatchObject({ ok: true, lateCancel: true });
    const kept = await paymentOf(late.bookingId);
    expect(kept).toMatchObject({ status: "HELD" });
    expect(kept.holdUntil?.getTime()).toBe(endsAt.getTime() + HOLD_HOURS * HOUR);
    expect((await releaseSeatPayments(new Date(endsAt.getTime() + 49 * HOUR))).released).toBeGreaterThanOrEqual(1);
    expect(await paymentOf(late.bookingId)).toMatchObject({ status: "RELEASED" });
    // Released is the expert's: a cancellation after it refunds nothing.
    expect(await db.sessionPayment.count({ where: { expertUserId: id.expert, status: "REFUNDED", payoutId: { not: null } } })).toBe(0);

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
    expect(await signed({ event: "payment.failed", payload: { payment: { entity: { id: `pay_zz${STAMP}f`, order_id: booked.checkout.orderId, amount: 6000, error_description: "ZZ card declined" } } } })).toMatchObject({ outcome: "failed" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "FAILED", reason: "ZZ card declined" });
    expect(await familyPayment(g2(), (await paymentOf(booked.bookingId)).id)).toMatchObject({ status: "FAILED", checkout: null });
    const fresh = await seatCheckout(g2(), booked.bookingId);
    expect(fresh.ok && fresh.checkout.orderId !== booked.checkout.orderId).toBe(true);
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "INITIATED", attempts: 1, path: "ROUTE" });
    const body = captured((fresh as { checkout: { orderId: string } }).checkout.orderId, 6000, `pay_zz${STAMP}r`);
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ outcome: "settled" });
    expect(await bookingOf(booked.bookingId)).toMatchObject({ status: "CONFIRMED" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "HELD", commissionPaise: 900, gstPaise: 162, netPaise: 4938 });
    expect(await settleSeatPayment({ orderId: (fresh as { checkout: { orderId: string } }).checkout.orderId, gatewayPaymentId: "pay_x", amountPaise: 6000 })).toMatchObject({ outcome: "already" });
    expect(await settleSeatPayment({ orderId: "order_nobody", gatewayPaymentId: "pay_x", amountPaise: 6000 })).toMatchObject({ outcome: "unknown-order" });
    expect(await cancelBooking(g2(), booked.bookingId)).toMatchObject({ ok: true });
    const refunded = await paymentOf(booked.bookingId);
    expect(refunded).toMatchObject({ status: "REFUNDED", netPaise: 0 });
    expect(await signed({ event: "refund.failed", payload: { refund: { entity: { id: refunded.refundId, error_description: "ZZ bank bounced it" } } } })).toMatchObject({ outcome: "refund-failed" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "HELD", pendingAction: "REFUND", netPaise: 4938 });
    expect((await operatorPayouts(operator())).failures.find((f) => f.paymentId === refunded.id)).toMatchObject({ action: "REFUND", amountPaise: 6000 });
    expect(await retrySeatPayment(operator(), refunded.id)).toMatchObject({ ok: true, outcome: "refunded" });
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "REFUNDED", pendingAction: null });
    // Failed again, the job tries the refund itself before anything else, and never releases a seat that waits for one.
    expect(await signed({ event: "refund.failed", id: `evt_zz${STAMP}rf2`, payload: { refund: { entity: { id: (await paymentOf(booked.bookingId)).refundId, error_description: "ZZ bounced again" } } } })).toMatchObject({ outcome: "refund-failed" });
    const run = await releaseSeatPayments(new Date(Date.now() + 2000 * HOUR));
    expect(run.refunded).toBeGreaterThanOrEqual(1);
    expect(await paymentOf(booked.bookingId)).toMatchObject({ status: "REFUNDED", pendingAction: null, releasedAt: null });
  });

  it("the transfer's own events: named by the order it came with, the seat is held; failed, it waits for the operator, who makes it again; a release the gateway refused is tried again", async () => {
    const seat = await heldSeat();
    // As if the capture's own read had not found it yet: PAID, no transfer, until the gateway names it.
    await db.sessionPayment.update({ where: { bookingId: seat.bookingId }, data: { status: "PAID", transferId: null } });
    expect(await signed({ event: "transfer.processed", payload: { transfer: { entity: { id: `trf_zz${STAMP}t`, source: seat.orderId } } } })).toMatchObject({ outcome: "transfer-known" });
    expect(await paymentOf(seat.bookingId)).toMatchObject({ status: "HELD", transferId: `trf_zz${STAMP}t` });
    const p = await paymentOf(seat.bookingId);
    expect(await signed({ event: "transfer.failed", payload: { transfer: { entity: { id: `trf_zz${STAMP}t`, source: p.paymentId, error: { description: "ZZ the linked account was closed" } } } } })).toMatchObject({ outcome: "transfer-failed" });
    expect(await paymentOf(seat.bookingId)).toMatchObject({ status: "PAID", transferId: null, pendingAction: "TRANSFER", lastError: "ZZ the linked account was closed" });
    expect((await operatorPayouts(operator())).failures.find((f) => f.paymentId === p.id)).toMatchObject({ action: "TRANSFER", amountPaise: 8230 });
    expect(await retrySeatPayment(operator(), p.id)).toMatchObject({ ok: true, outcome: "held" });
    const remade = await paymentOf(seat.bookingId);
    expect(remade).toMatchObject({ status: "HELD", pendingAction: null });
    expect(remade.transferId?.startsWith("trf_devbox")).toBe(true);
    // A release the gateway refused waits with pendingAction RELEASE; the operator's retry takes the hold off.
    await db.sessionPayment.update({ where: { id: p.id }, data: { pendingAction: "RELEASE", lastError: "ZZ gateway down", holdUntil: new Date(Date.now() - HOUR) } });
    expect(await retrySeatPayment(operator(), p.id)).toMatchObject({ ok: true, outcome: "released" });
    expect(await paymentOf(seat.bookingId)).toMatchObject({ status: "RELEASED", pendingAction: null });
    expect((await releaseSeatPayments(new Date())).invoiced).toBeGreaterThanOrEqual(1);
    expect((await paymentOf(seat.bookingId)).payoutId).toBeTruthy();
  });
});

describe("the company-collects rows of the second amendment", () => {
  it("a COMPANY seat still becomes DUE in an open payout the operator records by hand, with the next invoice; no ROUTE seat goes that way", async () => {
    const fy = financialYearOf(new Date());
    const seat = await deliveredSeat();
    await db.sessionPayment.update({ where: { bookingId: seat.bookingId }, data: { path: "COMPANY", transferId: null } });
    const run = await releaseSeatPayments(new Date(seat.holdEnds.getTime() + HOUR));
    expect(run).toMatchObject({ due: 1, duePaise: 8230 });
    const due = await paymentOf(seat.bookingId);
    expect(due).toMatchObject({ status: "DUE" });
    expect(await expertNotes("due")).toBe(1);
    const op = await operatorPayouts(operator());
    expect(op.toPay.find((x) => x.id === due.payoutId)).toMatchObject({ netPaise: 8230, paymentsCount: 1 });
    expect(await recordPayout(operator(), due.payoutId!, { reference: "short" })).toMatchObject({ ok: false, errorKey: "gigs.refuseUtr" });
    await expect(recordPayout(expert(), due.payoutId!, { reference: `ZZUTR${STAMP}A` })).rejects.toBeInstanceOf(AccessError);
    const recorded = await recordPayout(operator(), due.payoutId!, { reference: `zzutr${STAMP}a`, note: "ZZ paid by NEFT" });
    expect(recorded).toMatchObject({ ok: true, payout: { netPaise: 8230, paymentsCount: 1, reference: `ZZUTR${STAMP}A` } });
    const number = (recorded as { invoice: { number: string } }).invoice.number;
    expect(number.startsWith(`${PREFIX}/${fy}/`)).toBe(true);
    expect(await paymentOf(seat.bookingId)).toMatchObject({ status: "PAID_OUT" });
    expect(await expertNotes("paidOut")).toBe(1);
    expect(await recordPayout(operator(), due.payoutId!, { reference: `ZZUTR${STAMP}B` })).toMatchObject({ ok: false, errorKey: "gigs.refusePayoutPaid" });
    // The series holds no gap: every number from 0001 to the last is issued once.
    const series = await db.gigInvoice.findMany({ where: { series: `${PREFIX}/${fy}` }, select: { serial: true }, orderBy: { serial: "asc" } });
    expect(series.map((x) => x.serial)).toEqual(series.map((_, i) => i + 1));
    expect(await db.sessionPayment.count({ where: { expertUserId: id.expert, path: "ROUTE", status: { in: ["DUE", "PAID_OUT"] } } })).toBe(0);
  });
});
