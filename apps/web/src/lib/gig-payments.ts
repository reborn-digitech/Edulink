import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { forSchool, forUser } from "./tenant-context";
import { gigSettings, monthKey, type GigResult } from "./gig-questions";
import { createLinkedAccount, createSeatOrder, fetchLinkedAccount, GigGatewayError, platformAccount, refundSeat, releaseTransfer, transport, transfersOf, verifySeatCheckout } from "./gig-gateway";
import type { GigGatewayTransport } from "./gig-gateway-env";
import type { ActiveContext } from "./session";

/**
 * Paid workshop seats: the money side (decision 0004, amended 2026-10-02).
 *
 * WHAT THIS FILE OWNS. The three money rows — an expert's linked account at
 * the company's gateway (ExpertPayoutAccount), a guardian's payment for one
 * seat with the transfer held for the expert (SessionPayment), and the
 * transfers released to an expert in one run (ExpertPayout) — every call to
 * the gateway (gig-gateway.ts), and the one audit row for every change of a
 * payment's state. Who may book, consent, cancel and mark a seat, and who is
 * told, stay in gig-sessions.ts, which calls down here when a seat is paid.
 *
 * THE PLATFORM HOLDS NOTHING. The order is the gateway's; the transfer to
 * the expert is created by the gateway at capture, ON HOLD; `releaseDue`
 * takes the hold off when the session is delivered plus HOLD_HOURS, and
 * the gateway settles the expert from its own balance. A refund is the
 * gateway's refund of the guardian's payment with the transfer reversed.
 * What this file records is what the gateway did.
 *
 * ONE DOOR FOR A CAPTURE: `markCaptured`, used by the webhook, the checkout's
 * own confirm and the devbox page alike, so a payment settles once and the
 * rest are told "already". The amount is compared with the order the server
 * itself made; a mismatch is refused and audited.
 *
 * THE KILL SWITCH. GigSettings.paymentsEnabled, read by every door here and
 * in gig-sessions.ts through `paymentsOn()`: off, and no price is stored,
 * no order is made, no hold is released. A refund still goes through, so
 * turning it off strands nobody's money.
 */
export const SESSION_PAYMENT_STATUSES = ["INITIATED", "PAID", "HELD", "RELEASED", "REFUNDED", "FAILED"] as const;
export type SessionPaymentStatus = (typeof SESSION_PAYMENT_STATUSES)[number];
export type PayoutStatus = "NONE" | "PENDING" | "ACTIVE";

export const HOLD_HOURS = 48;
/** An unpaid seat is given back after this long (gig-sessions.ts expireUnpaidSeats). */
export const UNPAID_SEAT_EXPIRY_MS = 30 * 60_000;
const HOUR = 3_600_000;

/* -------------------------------------------------------------------------- */
/* Settings and the kill switch                                                 */
/* -------------------------------------------------------------------------- */

export type PaymentSettings = { paymentsEnabled: boolean; seatPriceMinPaise: number; seatPriceMaxPaise: number; commissionPercent: number; transport: GigGatewayTransport };

export async function paymentSettings(): Promise<PaymentSettings> {
  await gigSettings(); // makes the row the first time anybody asks
  const row = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { paymentsEnabled: true, seatPriceMinPaise: true, seatPriceMaxPaise: true, commissionPercent: true } });
  return { ...row, transport: transport() };
}

/** The one question every paid path asks first: the switch on, and a gateway there to speak to. */
export async function paymentsOn(): Promise<boolean> {
  const s = await paymentSettings();
  return s.paymentsEnabled && s.transport !== "off";
}

export async function setPaymentsEnabled(ctx: ActiveContext, on: boolean): Promise<GigResult<{ paymentsEnabled: boolean }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  await gigSettings();
  const before = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { paymentsEnabled: true } });
  if (before.paymentsEnabled !== on) {
    await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: on, updatedByUserId: ctx.user.id } });
    await audit({ schoolId: null, actorUserId: ctx.user.id, action: on ? "gig.payments.on" : "gig.payments.off", targetType: "GigSettings", targetId: "gigs" });
  }
  return { ok: true, paymentsEnabled: on };
}

export const commissionOf = (amountPaise: number, percent: number): number => Math.round((amountPaise * percent) / 100);

/* -------------------------------------------------------------------------- */
/* The expert's linked account                                                  */
/* -------------------------------------------------------------------------- */

export type PayoutAccountView = { status: PayoutStatus; linkedAccountId: string | null; onboardingUrl: string | null; note: string | null; transport: GigGatewayTransport };

const asPayoutStatus = (raw: string | undefined): PayoutStatus => (raw === "ACTIVE" || raw === "PENDING" ? raw : "NONE");

export async function payoutAccountOf(expertUserId: string): Promise<PayoutAccountView> {
  const row = await db.expertPayoutAccount.findUnique({ where: { expertUserId }, select: { status: true, linkedAccountId: true, onboardingUrl: true, note: true } });
  return { status: asPayoutStatus(row?.status), linkedAccountId: row?.linkedAccountId ?? null, onboardingUrl: row?.onboardingUrl ?? null, note: row?.note ?? null, transport: transport() };
}

/**
 * The expert links where they are paid: a linked account at the company's
 * gateway, made from their name and email. KYC VERIFIED first — the operator
 * has checked who they are before the gateway is asked to pay them. Under
 * devbox the account is active at once; with the real gateway it waits on
 * the gateway's own checks (PENDING), asked after on every read.
 */
export async function linkPayoutAccount(ctx: ActiveContext): Promise<GigResult<PayoutAccountView>> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const profile = await db.expertProfile.findUnique({ where: { userId: ctx.user.id }, select: { id: true, kycStatus: true } });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");
  if (profile.kycStatus !== "VERIFIED") return { ok: false, errorKey: "gigs.refuseNeedKyc" };
  if (transport() === "off") return { ok: false, errorKey: "gigs.refusePaymentsOff" };
  const current = await payoutAccountOf(ctx.user.id);
  if (current.status === "ACTIVE") return { ok: true, ...current };
  if (current.status === "PENDING" && current.linkedAccountId) return { ok: true, ...(await refreshPayoutAccount(ctx.user.id)) };
  let made;
  try {
    made = await createLinkedAccount({ reference: ctx.user.id, name: ctx.user.name, email: ctx.user.email ?? null });
  } catch (error) {
    console.error("[gig-payments] linked account", error instanceof Error ? error.message : error);
    return { ok: false, errorKey: "gigs.refuseGatewayDown" };
  }
  await db.expertPayoutAccount.upsert({
    where: { expertUserId: ctx.user.id },
    create: { expertUserId: ctx.user.id, linkedAccountId: made.linkedAccountId, status: made.status, onboardingUrl: made.onboardingUrl, note: null },
    update: { linkedAccountId: made.linkedAccountId, status: made.status, onboardingUrl: made.onboardingUrl, note: null },
  });
  await audit({ actorUserId: ctx.user.id, action: "gig.payout.link", targetType: "ExpertPayoutAccount", targetId: ctx.user.id, meta: { status: made.status } });
  if (made.status === "ACTIVE") await audit({ actorUserId: ctx.user.id, action: "gig.payout.active", targetType: "ExpertPayoutAccount", targetId: ctx.user.id });
  return { ok: true, ...(await payoutAccountOf(ctx.user.id)) };
}

/** A PENDING account is asked after at the gateway; ACTIVE is recorded once, with its audit row. */
export async function refreshPayoutAccount(expertUserId: string): Promise<PayoutAccountView> {
  const current = await payoutAccountOf(expertUserId);
  if (current.status !== "PENDING" || !current.linkedAccountId) return current;
  try {
    const got = await fetchLinkedAccount(current.linkedAccountId);
    if (got.status === "ACTIVE") await activatePayoutAccount(expertUserId, "gateway read");
    else if (got.onboardingUrl && got.onboardingUrl !== current.onboardingUrl) await db.expertPayoutAccount.update({ where: { expertUserId }, data: { onboardingUrl: got.onboardingUrl } });
  } catch (error) {
    console.error("[gig-payments] linked account read", error instanceof Error ? error.message : error);
  }
  return payoutAccountOf(expertUserId);
}

/** The gateway says the account may be paid (its webhook, or a read): recorded once. */
export async function activatePayoutAccount(expertUserId: string, via: string): Promise<boolean> {
  const changed = await db.expertPayoutAccount.updateMany({ where: { expertUserId, status: { not: "ACTIVE" } }, data: { status: "ACTIVE", note: null } });
  if (changed.count === 0) return false;
  await audit({ actorUserId: null, action: "gig.payout.active", targetType: "ExpertPayoutAccount", targetId: expertUserId, meta: { via } });
  return true;
}

/** The gateway refused or suspended the account: no new price may be set until it is linked again. */
export async function suspendPayoutAccount(linkedAccountId: string, note: string): Promise<boolean> {
  const row = await db.expertPayoutAccount.findFirst({ where: { linkedAccountId }, select: { expertUserId: true } });
  if (!row) return false;
  await db.expertPayoutAccount.update({ where: { expertUserId: row.expertUserId }, data: { status: "NONE", note: note.slice(0, 300) } });
  await audit({ actorUserId: null, action: "gig.payout.suspend", targetType: "ExpertPayoutAccount", targetId: row.expertUserId, meta: { note: note.slice(0, 300) } });
  return true;
}

/* -------------------------------------------------------------------------- */
/* The checkout                                                                 */
/* -------------------------------------------------------------------------- */

export type SeatCheckout = {
  paymentId: string;
  bookingId: string;
  orderId: string;
  keyId: string;
  amountPaise: number;
  currency: "INR";
  transport: GigGatewayTransport;
  title: string;
  pupilName: string;
  payerName: string;
  payerEmail: string | null;
};

type PaymentRow = { id: string; bookingId: string; slotId: string; payerUserId: string; expertUserId: string; amountPaise: number; commissionPaise: number; orderId: string; paymentId: string | null; transferId: string | null; refundId: string | null; status: string; holdUntil: Date | null; releasedAt: Date | null; refundedAt: Date | null; pendingAction: string | null; attempts: number; lastError: string | null; payoutId: string | null; reason: string | null; createdAt: Date };
const PAYMENT_SELECT = { id: true, bookingId: true, slotId: true, payerUserId: true, expertUserId: true, amountPaise: true, commissionPaise: true, orderId: true, paymentId: true, transferId: true, refundId: true, status: true, holdUntil: true, releasedAt: true, refundedAt: true, pendingAction: true, attempts: true, lastError: true, payoutId: true, reason: true, createdAt: true } as const;

const keyIdNow = (): string => {
  try {
    return platformAccount()?.keyId ?? "devbox";
  } catch {
    return "off";
  }
};

function checkoutOf(p: PaymentRow, about: { title: string; pupilName: string; payerName: string; payerEmail: string | null }): SeatCheckout {
  return { paymentId: p.id, bookingId: p.bookingId, orderId: p.orderId, keyId: keyIdNow(), amountPaise: p.amountPaise, currency: "INR", transport: transport(), ...about };
}

/**
 * An order for one seat, made once per booking: a payment still INITIATED
 * is handed back as it stands (the panel was closed and reopened); a FAILED
 * one is replaced by a fresh order on the same row. Refused with the reason
 * when payments are off, the expert can no longer be paid, or the gateway is
 * down — the seat stays PENDING_PAYMENT for another try until it expires.
 */
export async function openCheckout(input: { bookingId: string; slotId: string; schoolId: string; payerUserId: string; expertUserId: string; amountPaise: number; title: string; pupilName: string; payerName: string; payerEmail: string | null }): Promise<GigResult<{ checkout: SeatCheckout }>> {
  const about = { title: input.title, pupilName: input.pupilName, payerName: input.payerName, payerEmail: input.payerEmail };
  const existing = await db.sessionPayment.findUnique({ where: { bookingId: input.bookingId }, select: PAYMENT_SELECT });
  if (existing && existing.status === "INITIATED") return { ok: true, checkout: checkoutOf(existing, about) };
  if (existing && existing.status !== "FAILED") return { ok: false, errorKey: "gigs.refuseAlreadyPaid" };
  if (!(await paymentsOn())) return { ok: false, errorKey: "gigs.refusePaymentsOff" };
  const payout = await payoutAccountOf(input.expertUserId);
  if (payout.status !== "ACTIVE" || !payout.linkedAccountId) return { ok: false, errorKey: "gigs.refuseExpertNoPayout" };
  const settings = await paymentSettings();
  const commissionPaise = commissionOf(input.amountPaise, settings.commissionPercent);
  // The row first, so the order's receipt carries our id; the order id is written once the gateway answers.
  const row = existing
    ? await db.sessionPayment.update({ where: { id: existing.id }, data: { status: "INITIATED", amountPaise: input.amountPaise, commissionPaise, payerUserId: input.payerUserId, reason: null, lastError: null, pendingAction: null, attempts: existing.attempts + 1 }, select: PAYMENT_SELECT })
    : await db.sessionPayment.create({ data: { bookingId: input.bookingId, slotId: input.slotId, payerUserId: input.payerUserId, expertUserId: input.expertUserId, amountPaise: input.amountPaise, commissionPaise, orderId: `pending_${input.bookingId}`, status: "INITIATED" }, select: PAYMENT_SELECT });
  let orderId: string;
  try {
    const order = await createSeatOrder({ amountPaise: input.amountPaise, expertSharePaise: input.amountPaise - commissionPaise, linkedAccountId: payout.linkedAccountId, receipt: row.id, notes: { shalaghar_session_payment: row.id, seat: input.title.slice(0, 60) } });
    orderId = order.orderId;
  } catch (error) {
    const reason = error instanceof GigGatewayError ? error.message : "gateway error";
    await db.sessionPayment.update({ where: { id: row.id }, data: { status: "FAILED", reason } });
    return { ok: false, errorKey: "gigs.refuseGatewayDown" };
  }
  const made = await db.sessionPayment.update({ where: { id: row.id }, data: { orderId }, select: PAYMENT_SELECT });
  await forSchool(input.schoolId, () => audit({ schoolId: input.schoolId, actorUserId: input.payerUserId, action: "gig.payment.start", targetType: "SessionPayment", targetId: made.id, meta: { bookingId: input.bookingId, amountPaise: input.amountPaise, commissionPaise, orderId } }));
  return { ok: true, checkout: checkoutOf(made, about) };
}

export type CaptureOutcome = "settled" | "already" | "unknown-order" | "amount-mismatch" | "not-settleable";

/**
 * THE ONE DOOR A CAPTURE COMES THROUGH. INITIATED (or FAILED: a signed
 * capture after a failed attempt on the same order is the retry going
 * through) → PAID, the booking PENDING_PAYMENT → CONFIRMED in the same
 * transaction under the school's binding; then the transfer the gateway made
 * is looked up and the row is HELD. A transfer not yet visible leaves the
 * row PAID for releaseDue to attach on its next run. Who is told is
 * gig-sessions.ts's (settleSeatPayment), which wraps this.
 */
export async function markCaptured(input: { orderId: string; gatewayPaymentId: string; amountPaise: number }, now: Date = new Date()): Promise<{ outcome: CaptureOutcome; payment: PaymentRow | null; booking: { id: string; schoolId: string; studentMembershipId: string; slotId: string; providerUserId: string } | null }> {
  const p = await db.sessionPayment.findUnique({ where: { orderId: input.orderId }, select: { ...PAYMENT_SELECT, booking: { select: { id: true, schoolId: true, studentMembershipId: true, slotId: true, providerUserId: true, status: true } } } });
  if (!p) return { outcome: "unknown-order", payment: null, booking: null };
  const booking = { id: p.booking.id, schoolId: p.booking.schoolId, studentMembershipId: p.booking.studentMembershipId, slotId: p.booking.slotId, providerUserId: p.booking.providerUserId };
  if (p.status === "PAID" || p.status === "HELD" || p.status === "RELEASED" || p.status === "REFUNDED") return { outcome: "already", payment: p, booking };
  if (p.status !== "INITIATED" && p.status !== "FAILED") return { outcome: "not-settleable", payment: p, booking };
  if (p.amountPaise !== input.amountPaise) {
    await forSchool(booking.schoolId, () => audit({ schoolId: booking.schoolId, action: "gig.payment.mismatch", targetType: "SessionPayment", targetId: p.id, meta: { expected: p.amountPaise, got: input.amountPaise, gatewayPaymentId: input.gatewayPaymentId } }));
    return { outcome: "amount-mismatch", payment: p, booking };
  }
  const settled = await forSchool(booking.schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const claimed = await tx.sessionPayment.updateMany({ where: { id: p.id, status: { in: ["INITIATED", "FAILED"] } }, data: { status: "PAID", paymentId: input.gatewayPaymentId, reason: null, lastError: null } });
      if (claimed.count === 0) return false;
      // A seat the family gave up, or that expired, before the money arrived is still paid for: the row is
      // PAID and refundable (refundSeatPayment below), the booking is left as it stands for the job to refund.
      await tx.gigBooking.updateMany({ where: { id: booking.id, schoolId: booking.schoolId, status: "PENDING_PAYMENT" }, data: { status: "CONFIRMED", consentAt: now, consentUserId: p.payerUserId } });
      return true;
    }),
  );
  if (!settled) return { outcome: "already", payment: p, booking };
  await forSchool(booking.schoolId, () => audit({ schoolId: booking.schoolId, actorUserId: p.payerUserId, action: "gig.payment.paid", targetType: "SessionPayment", targetId: p.id, meta: { bookingId: booking.id, amountPaise: p.amountPaise, gatewayPaymentId: input.gatewayPaymentId } }));
  const held = await attachTransfer(p.id);
  const after = (await db.sessionPayment.findUnique({ where: { id: p.id }, select: PAYMENT_SELECT })) ?? p;
  if (!held) console.error("[gig-payments] transfer not yet visible for", p.id);
  return { outcome: "settled", payment: after, booking };
}

/** A PAID row learns the transfer the gateway made for it and becomes HELD. */
export async function attachTransfer(paymentRowId: string): Promise<boolean> {
  const p = await db.sessionPayment.findUnique({ where: { id: paymentRowId }, select: PAYMENT_SELECT });
  if (!p || p.status !== "PAID" || !p.paymentId) return false;
  try {
    const transfers = await transfersOf(p.paymentId, p.amountPaise - p.commissionPaise);
    const hit = transfers[0];
    if (!hit) return false;
    const changed = await db.sessionPayment.updateMany({ where: { id: p.id, status: "PAID" }, data: { status: "HELD", transferId: hit.transferId, lastError: null } });
    if (changed.count === 0) return false;
    await audit({ actorUserId: null, action: "gig.payment.held", targetType: "SessionPayment", targetId: p.id, meta: { transferId: hit.transferId, expertPaise: p.amountPaise - p.commissionPaise } });
    return true;
  } catch (error) {
    await db.sessionPayment.update({ where: { id: p.id }, data: { lastError: (error instanceof Error ? error.message : "gateway error").slice(0, 300) } });
    return false;
  }
}

/** The gateway says the attempt failed: an INITIATED order is FAILED and may be tried again on the same order. */
export async function markOrderFailed(orderId: string, reason: string): Promise<boolean> {
  const changed = await db.sessionPayment.updateMany({ where: { orderId, status: "INITIATED" }, data: { status: "FAILED", reason: reason.slice(0, 200) } });
  return changed.count > 0;
}

/**
 * The checkout page's own confirmation, a fallback for a slow webhook: the
 * handler signature checked under the company's key secret, then the one
 * door. Returns the capture's outcome; the caller tells the family.
 */
export async function confirmSeatCheckout(ctx: ActiveContext, input: { paymentId: string; gatewayPaymentId: string; signature: string }): Promise<{ orderId: string; amountPaise: number }> {
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const p = await db.sessionPayment.findFirst({ where: { id: input.paymentId, payerUserId: ctx.user.id }, select: { orderId: true, amountPaise: true } });
  if (!p) throw new AccessError("gigs.noSuchPayment", "NOT_FOUND");
  if (!verifySeatCheckout(p.orderId, input.gatewayPaymentId, input.signature)) throw new AccessError("gigs.refuseBadSignature");
  return { orderId: p.orderId, amountPaise: p.amountPaise };
}

/* -------------------------------------------------------------------------- */
/* Hold, release and refund                                                     */
/* -------------------------------------------------------------------------- */

/** The hold's end is set when the seat's outcome is known: delivered or missed plus HOLD_HOURS, a late cancellation the end plus HOLD_HOURS. */
export async function scheduleRelease(bookingId: string, holdUntil: Date, why: "DELIVERED" | "MISSED" | "LATE_CANCEL"): Promise<boolean> {
  const changed = await db.sessionPayment.updateMany({ where: { bookingId, status: { in: ["PAID", "HELD"] } }, data: { holdUntil } });
  if (changed.count === 0) return false;
  const p = await db.sessionPayment.findUnique({ where: { bookingId }, select: { id: true } });
  if (p) await audit({ actorUserId: null, action: "gig.payment.hold", targetType: "SessionPayment", targetId: p.id, meta: { why, holdUntil: holdUntil.toISOString() } });
  return true;
}

export type RefundOutcome = "refunded" | "pending" | "voided" | "nothing";

/**
 * The guardian's money back: a PAID or HELD payment is refunded in full at
 * the gateway with the transfer reversed; one still INITIATED is voided (no
 * money moved); one already RELEASED is past refunding here and is said so.
 * A gateway that cannot be reached leaves the row with pendingAction
 * REFUND, which releaseDue and the operator's retry take up.
 */
export async function refundSeatPayment(bookingId: string, reason: string, actorUserId: string | null, now: Date = new Date()): Promise<RefundOutcome> {
  const p = await db.sessionPayment.findUnique({ where: { bookingId }, select: { ...PAYMENT_SELECT, booking: { select: { schoolId: true } } } });
  if (!p) return "nothing";
  const why = reason.slice(0, 200);
  if (p.status === "INITIATED") {
    await db.sessionPayment.update({ where: { id: p.id }, data: { status: "FAILED", reason: why } });
    await forSchool(p.booking.schoolId, () => audit({ schoolId: p.booking.schoolId, actorUserId, action: "gig.payment.void", targetType: "SessionPayment", targetId: p.id, meta: { reason: why } }));
    return "voided";
  }
  if (p.status !== "PAID" && p.status !== "HELD") return "nothing";
  if (!p.paymentId) return "nothing";
  try {
    const refund = await refundSeat(p.paymentId, p.amountPaise, { shalaghar_session_payment: p.id, reason: why.slice(0, 60) });
    await db.sessionPayment.update({ where: { id: p.id }, data: { status: "REFUNDED", refundId: refund.refundId, refundedAt: now, reason: why, pendingAction: null, lastError: null, holdUntil: null } });
    await forSchool(p.booking.schoolId, () => audit({ schoolId: p.booking.schoolId, actorUserId, action: "gig.payment.refunded", targetType: "SessionPayment", targetId: p.id, meta: { amountPaise: p.amountPaise, refundId: refund.refundId, reason: why } }));
    return "refunded";
  } catch (error) {
    const message = (error instanceof Error ? error.message : "gateway error").slice(0, 300);
    await db.sessionPayment.update({ where: { id: p.id }, data: { pendingAction: "REFUND", reason: why, lastError: message, attempts: p.attempts + 1 } });
    await forSchool(p.booking.schoolId, () => audit({ schoolId: p.booking.schoolId, actorUserId, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "REFUND", error: message } }));
    return "pending";
  }
}

/** One payment's hold released at the gateway; on failure the row waits with pendingAction RELEASE. */
async function releaseOne(p: PaymentRow, payoutId: string | null, now: Date): Promise<boolean> {
  if (!p.transferId) return false;
  try {
    await releaseTransfer(p.transferId);
    const changed = await db.sessionPayment.updateMany({ where: { id: p.id, status: "HELD" }, data: { status: "RELEASED", releasedAt: now, pendingAction: null, lastError: null, payoutId } });
    if (changed.count === 0) return false;
    await audit({ actorUserId: null, action: "gig.payment.released", targetType: "SessionPayment", targetId: p.id, meta: { transferId: p.transferId, expertPaise: p.amountPaise - p.commissionPaise, payoutId } });
    return true;
  } catch (error) {
    const message = (error instanceof Error ? error.message : "gateway error").slice(0, 300);
    await db.sessionPayment.update({ where: { id: p.id }, data: { pendingAction: "RELEASE", lastError: message, attempts: p.attempts + 1 } });
    await audit({ actorUserId: null, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "RELEASE", error: message } });
    return false;
  }
}

export type ReleaseRun = { released: number; releasedPaise: number; refunded: number; attached: number; failed: number; payouts: number; releasedTo: { expertUserId: string; amountPaise: number; payoutId: string }[] };

/**
 * The job's money half (gigs:release, hourly): every HELD payment whose hold
 * has ended is released, grouped into one ExpertPayout per expert per run;
 * a refund that could not be made is tried again; a PAID row whose transfer
 * was not visible at capture is asked for again. Nothing is released while
 * the switch is off — refunds still go, since that is the family's money.
 */
export async function releaseDue(now: Date = new Date()): Promise<ReleaseRun> {
  const run: ReleaseRun = { released: 0, releasedPaise: 0, refunded: 0, attached: 0, failed: 0, payouts: 0, releasedTo: [] };
  const on = await paymentsOn();

  for (const p of await db.sessionPayment.findMany({ where: { status: "PAID", paymentId: { not: null } }, select: { id: true }, take: 200 })) {
    if (await attachTransfer(p.id)) run.attached += 1;
  }
  for (const p of await db.sessionPayment.findMany({ where: { pendingAction: "REFUND", status: { in: ["PAID", "HELD"] } }, select: { bookingId: true, reason: true }, take: 200 })) {
    const outcome = await refundSeatPayment(p.bookingId, p.reason ?? "refund", null, now);
    if (outcome === "refunded") run.refunded += 1;
    else run.failed += 1;
  }
  if (!on) return run;

  const due = await db.sessionPayment.findMany({ where: { status: "HELD", holdUntil: { not: null, lte: now }, transferId: { not: null } }, orderBy: { holdUntil: "asc" }, select: PAYMENT_SELECT, take: 500 });
  const byExpert = new Map<string, PaymentRow[]>();
  for (const p of due) (byExpert.get(p.expertUserId) ?? byExpert.set(p.expertUserId, []).get(p.expertUserId)!).push(p);
  for (const [expertUserId, rows] of byExpert) {
    const payout = await db.expertPayout.create({ data: { expertUserId, amountPaise: 0, transfers: 0, status: "RELEASED" }, select: { id: true } });
    let sum = 0;
    let count = 0;
    for (const p of rows) {
      if (await releaseOne(p, payout.id, now)) {
        sum += p.amountPaise - p.commissionPaise;
        count += 1;
      } else run.failed += 1;
    }
    if (count === 0) {
      await db.expertPayout.delete({ where: { id: payout.id } });
      continue;
    }
    await db.expertPayout.update({ where: { id: payout.id }, data: { amountPaise: sum, transfers: count } });
    await audit({ actorUserId: null, action: "gig.payout.released", targetType: "ExpertPayout", targetId: payout.id, meta: { expertUserId, amountPaise: sum, transfers: count } });
    await forUser(expertUserId, () => notify({ userId: expertUserId, schoolId: null, kind: "EXPERT", titleKey: "gigs.notifReleased", titleVars: { amount: rupees(sum), count }, url: "/expert/earnings", meta: { payoutId: payout.id } })).catch((error) => console.error("[gig-payments] release notice failed", error));
    run.released += count;
    run.releasedPaise += sum;
    run.payouts += 1;
    run.releasedTo.push({ expertUserId, amountPaise: sum, payoutId: payout.id });
  }
  return run;
}

/** The operator tries a waiting release or refund now, instead of at the next run. */
export async function retrySeatPayment(ctx: ActiveContext, paymentRowId: string, now: Date = new Date()): Promise<GigResult<{ outcome: string }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const p = await db.sessionPayment.findUnique({ where: { id: paymentRowId }, select: PAYMENT_SELECT });
  if (!p) throw new AccessError("gigs.noSuchPayment", "NOT_FOUND");
  await audit({ actorUserId: ctx.user.id, action: "gig.payment.retry", targetType: "SessionPayment", targetId: p.id, meta: { action: p.pendingAction, status: p.status } });
  if (p.status === "PAID") return { ok: true, outcome: (await attachTransfer(p.id)) ? "held" : "waiting" };
  if (p.pendingAction === "REFUND") return { ok: true, outcome: await refundSeatPayment(p.bookingId, p.reason ?? "refund", ctx.user.id, now) };
  if (p.status === "HELD" && p.holdUntil && p.holdUntil <= now) {
    if (!(await paymentsOn())) return { ok: false, errorKey: "gigs.refusePaymentsOff" };
    const payout = await db.expertPayout.create({ data: { expertUserId: p.expertUserId, amountPaise: p.amountPaise - p.commissionPaise, transfers: 1, status: "RELEASED" }, select: { id: true } });
    const done = await releaseOne(p, payout.id, now);
    if (!done) await db.expertPayout.delete({ where: { id: payout.id } });
    return { ok: true, outcome: done ? "released" : "failed" };
  }
  return { ok: false, errorKey: "gigs.refuseNothingToRetry" };
}

/* -------------------------------------------------------------------------- */
/* What the gateway's webhook says afterwards                                   */
/* -------------------------------------------------------------------------- */

/** transfer.settled: the gateway has paid the linked account; the payout row learns the settlement. */
export async function recordSettlement(transferId: string, settlementId: string): Promise<boolean> {
  const p = await db.sessionPayment.findFirst({ where: { transferId }, select: { id: true, payoutId: true } });
  if (!p?.payoutId) return false;
  await db.expertPayout.update({ where: { id: p.payoutId }, data: { settlementId, status: "SETTLED" } });
  return true;
}

/** transfer.failed after a release: back on hold with the release owed again, and the payout row says so. */
export async function markTransferFailed(transferId: string, reason: string): Promise<boolean> {
  const p = await db.sessionPayment.findFirst({ where: { transferId, status: "RELEASED" }, select: { id: true, payoutId: true, attempts: true } });
  if (!p) return false;
  await db.sessionPayment.update({ where: { id: p.id }, data: { status: "HELD", releasedAt: null, pendingAction: "RELEASE", lastError: reason.slice(0, 300), attempts: p.attempts + 1, payoutId: null } });
  if (p.payoutId) await db.expertPayout.update({ where: { id: p.payoutId }, data: { status: "FAILED", note: reason.slice(0, 300) } });
  await audit({ actorUserId: null, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "RELEASE", error: reason.slice(0, 300), via: "webhook" } });
  return true;
}

/** refund.failed: the money never left; the row goes back to waiting for a refund. */
export async function markSeatRefundFailed(refundId: string, reason: string): Promise<boolean> {
  const p = await db.sessionPayment.findFirst({ where: { refundId, status: "REFUNDED" }, select: { id: true, attempts: true } });
  if (!p) return false;
  await db.sessionPayment.update({ where: { id: p.id }, data: { status: "HELD", refundedAt: null, refundId: null, pendingAction: "REFUND", lastError: reason.slice(0, 300), attempts: p.attempts + 1 } });
  await audit({ actorUserId: null, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "REFUND", error: reason.slice(0, 300), via: "webhook" } });
  return true;
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export type FamilyPaymentView = { paymentId: string; bookingId: string; status: SessionPaymentStatus; amountPaise: number; bookingStatus: string; refundedAt: string | null; reason: string | null; checkout: SeatCheckout | null };

/** The payer's own payment, with the checkout while it still waits; anybody else's is not found. */
export async function familyPayment(ctx: ActiveContext, paymentRowId: string): Promise<FamilyPaymentView> {
  if (ctx.role !== "PARENT" && ctx.role !== "STUDENT") throw new AccessError("access.wrongRoleForThisAction");
  const p = await db.sessionPayment.findFirst({ where: { id: paymentRowId, payerUserId: ctx.user.id }, select: { ...PAYMENT_SELECT, booking: { select: { status: true, slot: { select: { title: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } } } });
  if (!p) throw new AccessError("gigs.noSuchPayment", "NOT_FOUND");
  const checkout = p.status === "INITIATED" ? checkoutOf(p, { title: p.booking.slot.title, pupilName: p.booking.student.user.preferredName ?? p.booking.student.user.name, payerName: ctx.user.name, payerEmail: ctx.user.email ?? null }) : null;
  return { paymentId: p.id, bookingId: p.bookingId, status: p.status as SessionPaymentStatus, amountPaise: p.amountPaise, bookingStatus: p.booking.status, refundedAt: p.refundedAt?.toISOString() ?? null, reason: p.reason, checkout };
}

export type EarningRow = { paymentId: string; bookingId: string; title: string; startsAt: string; schoolName: string; amountPaise: number; commissionPaise: number; netPaise: number; status: SessionPaymentStatus; holdUntil: string | null; releasedAt: string | null; refundedAt: string | null; settlementId: string | null; reason: string | null };
export type Earnings = { heldPaise: number; releasedPaise: number; refundedPaise: number; rows: EarningRow[]; payouts: { id: string; amountPaise: number; transfers: number; status: string; settlementId: string | null; createdAt: string }[] };

/** What the expert has earned, is owed on hold, and was refunded, seat by seat and payout by payout. No pupil's name: the school's is enough on a statement. */
export async function expertEarnings(ctx: ActiveContext): Promise<Earnings> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const rows = await db.sessionPayment.findMany({
    where: { expertUserId: ctx.user.id, status: { not: "INITIATED" } },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { ...PAYMENT_SELECT, slot: { select: { title: true, startsAt: true } }, booking: { select: { school: { select: { name: true } } } }, payout: { select: { settlementId: true } } },
  });
  const payouts = await db.expertPayout.findMany({ where: { expertUserId: ctx.user.id }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, amountPaise: true, transfers: true, status: true, settlementId: true, createdAt: true } });
  const net = (p: { amountPaise: number; commissionPaise: number }) => p.amountPaise - p.commissionPaise;
  return {
    heldPaise: rows.filter((p) => p.status === "PAID" || p.status === "HELD").reduce((a, p) => a + net(p), 0),
    releasedPaise: rows.filter((p) => p.status === "RELEASED").reduce((a, p) => a + net(p), 0),
    refundedPaise: rows.filter((p) => p.status === "REFUNDED").reduce((a, p) => a + p.amountPaise, 0),
    rows: rows.map((p) => ({ paymentId: p.id, bookingId: p.bookingId, title: p.slot.title, startsAt: p.slot.startsAt.toISOString(), schoolName: p.booking.school.name, amountPaise: p.amountPaise, commissionPaise: p.commissionPaise, netPaise: net(p), status: p.status as SessionPaymentStatus, holdUntil: p.holdUntil?.toISOString() ?? null, releasedAt: p.releasedAt?.toISOString() ?? null, refundedAt: p.refundedAt?.toISOString() ?? null, settlementId: p.payout?.settlementId ?? null, reason: p.reason })),
    payouts: payouts.map((x) => ({ ...x, createdAt: x.createdAt.toISOString() })),
  };
}

export type PayoutsView = {
  paymentsEnabled: boolean;
  transport: GigGatewayTransport;
  month: string;
  commissionThisMonthPaise: number;
  heldPaise: number;
  releasedThisMonthPaise: number;
  refundedThisMonthPaise: number;
  failures: { paymentId: string; expertName: string; amountPaise: number; action: "RELEASE" | "REFUND" | "ATTACH"; lastError: string | null; attempts: number; since: string }[];
  payouts: { id: string; expertName: string; amountPaise: number; transfers: number; status: string; settlementId: string | null; createdAt: string }[];
};

/** The operator's side: the switch, the month's commission, what is on hold, what failed and waits, and the payouts made. */
export async function operatorPayouts(ctx: ActiveContext, now: Date = new Date()): Promise<PayoutsView> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const settings = await paymentSettings();
  const month = monthKey(now);
  const monthStart = new Date(`${month}-01T00:00:00+05:30`);
  const [captured, held, released, refunded, failures, payouts] = await Promise.all([
    db.sessionPayment.aggregate({ where: { status: { in: ["PAID", "HELD", "RELEASED"] }, createdAt: { gte: monthStart } }, _sum: { commissionPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: { in: ["PAID", "HELD"] } }, _sum: { amountPaise: true, commissionPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: "RELEASED", releasedAt: { gte: monthStart } }, _sum: { amountPaise: true, commissionPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: "REFUNDED", refundedAt: { gte: monthStart } }, _sum: { amountPaise: true } }),
    db.sessionPayment.findMany({ where: { OR: [{ pendingAction: { not: null } }, { status: "PAID", createdAt: { lt: new Date(now.getTime() - HOUR) } }] }, orderBy: { createdAt: "asc" }, take: 100, select: { ...PAYMENT_SELECT, expert: { select: { name: true } } } }),
    db.expertPayout.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, amountPaise: true, transfers: true, status: true, settlementId: true, createdAt: true, expert: { select: { name: true } } } }),
  ]);
  const minus = (a: { amountPaise: number | null; commissionPaise: number | null }) => (a.amountPaise ?? 0) - (a.commissionPaise ?? 0);
  return {
    paymentsEnabled: settings.paymentsEnabled,
    transport: settings.transport,
    month,
    commissionThisMonthPaise: captured._sum.commissionPaise ?? 0,
    heldPaise: minus(held._sum),
    releasedThisMonthPaise: minus(released._sum),
    refundedThisMonthPaise: refunded._sum.amountPaise ?? 0,
    failures: failures.map((p) => ({ paymentId: p.id, expertName: p.expert.name, amountPaise: p.amountPaise - p.commissionPaise, action: (p.pendingAction === "REFUND" ? "REFUND" : p.pendingAction === "RELEASE" ? "RELEASE" : "ATTACH") as "RELEASE" | "REFUND" | "ATTACH", lastError: p.lastError, attempts: p.attempts, since: p.createdAt.toISOString() })),
    payouts: payouts.map((x) => ({ id: x.id, expertName: x.expert.name, amountPaise: x.amountPaise, transfers: x.transfers, status: x.status, settlementId: x.settlementId, createdAt: x.createdAt.toISOString() })),
  };
}

/** ₹1,250 for a notice, the same output as the i18n helper, server-side. */
export function rupees(paise: number): string {
  const r = paise / 100;
  return `₹${new Intl.NumberFormat("en-IN", { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 }).format(r)}`;
}
