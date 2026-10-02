import "server-only";
import { normaliseLocale } from "@edulink/i18n";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { forSchool, forUser } from "./tenant-context";
import { gigSettings, monthKey, type GigResult } from "./gig-questions";
import { createSeatOrder, GigGatewayError, platformAccount, refundSeat, transport, verifySeatCheckout } from "./gig-gateway";
import type { GigGatewayTransport } from "./gig-gateway-env";
import { open, seal, sealingAvailable } from "./secret-box";
import { readJson } from "./json";
import type { ActiveContext } from "./session";

/**
 * Paid workshop seats: the money side (decision 0004, second amendment of
 * 2 October 2026 — THE COMPANY COLLECTS).
 *
 * WHAT THIS FILE OWNS. The money rows — an expert's payee details
 * (ExpertPayoutAccount), a guardian's payment for one seat with the three
 * figures frozen at capture (SessionPayment), what the company owes an
 * expert and then paid them (ExpertPayout), and the GST tax invoice for the
 * commission on each payout (GigInvoice) — every call to the gateway
 * (gig-gateway.ts), and the one audit row for every change of a payment's
 * state. Who may book, consent, cancel and mark a seat, and who is told,
 * stay in gig-sessions.ts, which calls down here when a seat is paid.
 *
 * THE COMPANY IS THE COLLECTING PARTY. The whole seat price settles to the
 * company's own gateway account. At capture the row freezes the gross, the
 * commission (GigSettings.commissionPercent of the gross), the GST on the
 * commission (GigSettings.gstPercent of the commission) and the net, and
 * takes the family's receipt number. The net is HELD until the session is
 * delivered plus HOLD_HOURS, then DUE: the hourly job gathers DUE rows into
 * the expert's one OPEN payout. The operator pays that from the company's
 * bank and records the transfer's reference, which marks every seat in it
 * PAID_OUT and issues the invoice in the same transaction. A refund is the
 * gateway's refund of the whole gross; a refunded seat carries no commission
 * or GST and never joins a payout. Decision 0003 is untouched: a school's
 * fees never come near any of this, and tests/fees-invariants.test.ts says so.
 *
 * ONE DOOR FOR A CAPTURE: `markCaptured`, used by the webhook, the checkout's
 * own confirm and the devbox page alike, so a payment settles once and the
 * rest are told "already". The amount is compared with the order the server
 * itself made; a mismatch is refused and audited.
 *
 * NUMBERS IN SERIES. Receipts (SG-R/2026-27/0001) and invoices
 * (SG/2026-27/0001) are numbered per financial year under a lock on the
 * GigSettings row, inside the transaction that writes the numbered row —
 * never reused, never a gap on a failed write (the certificates' rule).
 *
 * THE SEALED ACCOUNT. A bank account number is sealed by secret-box under
 * the binding `gig:payee:<expertUserId>` and is NEVER returned by any read:
 * the views carry the last four digits only. The operator pays from their
 * bank app with the details the card shows them.
 *
 * THE KILL SWITCH. GigSettings.paymentsEnabled, read by every door here and
 * in gig-sessions.ts through `paymentsOn()`: off, and no price is stored, no
 * order is made, nothing moves to DUE. A refund still goes through, so
 * turning it off strands nobody's money.
 */
export const SESSION_PAYMENT_STATUSES = ["INITIATED", "PAID", "HELD", "DUE", "PAID_OUT", "REFUNDED", "FAILED"] as const;
export type SessionPaymentStatus = (typeof SESSION_PAYMENT_STATUSES)[number];
export type PayoutStatus = "NONE" | "ACTIVE" | "SUSPENDED";

export const HOLD_HOURS = 48;
/** An unpaid seat is given back after this long (gig-sessions.ts expireUnpaidSeats). */
export const UNPAID_SEAT_EXPIRY_MS = 30 * 60_000;
const HOUR = 3_600_000;
const SETTINGS_ID = "gigs";
const ZONE = process.env.TZ || "Asia/Kolkata";

const UPI_ID = /^[A-Za-z0-9.\-_]{2,256}@[A-Za-z]{2,64}$/;
const UTR = /^[A-Za-z0-9]{12,22}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const BANK_ACCOUNT = /^\d{9,18}$/;
/** A GSTIN: the state code, the PAN, an entity digit, Z, a check character. */
const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
/** The GST state codes in use: 01–38 the states and union territories, 97 other territory. */
const GST_STATE_CODE = /^(0[1-9]|[12]\d|3[0-8]|97)$/;

/* -------------------------------------------------------------------------- */
/* Settings, the company and the kill switch                                   */
/* -------------------------------------------------------------------------- */

export type CompanyDetails = { legalName: string | null; gstin: string | null; address: string | null; stateCode: string | null; sacCode: string; invoicePrefix: string; gstPercent: number; /** What a payout cannot be recorded without, by name; empty when complete. */ missing: ("legalName" | "gstin" | "stateCode")[] };
export type PaymentSettings = { paymentsEnabled: boolean; seatPriceMinPaise: number; seatPriceMaxPaise: number; commissionPercent: number; gstPercent: number; transport: GigGatewayTransport };

const COMPANY_SELECT = { companyLegalName: true, companyGstin: true, companyAddress: true, companyStateCode: true, invoiceSacCode: true, invoicePrefix: true, gstPercent: true } as const;
type CompanyRow = { companyLegalName: string | null; companyGstin: string | null; companyAddress: string | null; companyStateCode: string | null; invoiceSacCode: string; invoicePrefix: string; gstPercent: number };

function companyOf(row: CompanyRow): CompanyDetails {
  const missing: CompanyDetails["missing"] = [];
  if (!row.companyLegalName?.trim()) missing.push("legalName");
  if (!row.companyGstin?.trim()) missing.push("gstin");
  if (!row.companyStateCode?.trim()) missing.push("stateCode");
  return { legalName: row.companyLegalName, gstin: row.companyGstin, address: row.companyAddress, stateCode: row.companyStateCode, sacCode: row.invoiceSacCode, invoicePrefix: row.invoicePrefix, gstPercent: row.gstPercent, missing };
}

export async function paymentSettings(): Promise<PaymentSettings> {
  await gigSettings(); // makes the row the first time anybody asks
  const row = await db.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: { paymentsEnabled: true, seatPriceMinPaise: true, seatPriceMaxPaise: true, commissionPercent: true, gstPercent: true } });
  return { ...row, transport: transport() };
}

/** The company as the seller on its invoices, and what is still missing before a payout can be recorded. */
export async function companyDetails(): Promise<CompanyDetails> {
  await gigSettings();
  return companyOf(await db.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: COMPANY_SELECT }));
}

/** The one question every paid path asks first: the switch on, and a gateway there to speak to. */
export async function paymentsOn(): Promise<boolean> {
  const s = await paymentSettings();
  return s.paymentsEnabled && s.transport !== "off";
}

export async function setPaymentsEnabled(ctx: ActiveContext, on: boolean): Promise<GigResult<{ paymentsEnabled: boolean }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  await gigSettings();
  const before = await db.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: { paymentsEnabled: true } });
  if (before.paymentsEnabled !== on) {
    await db.gigSettings.update({ where: { id: SETTINGS_ID }, data: { paymentsEnabled: on, updatedByUserId: ctx.user.id } });
    await audit({ schoolId: null, actorUserId: ctx.user.id, action: on ? "gig.payments.on" : "gig.payments.off", targetType: "GigSettings", targetId: SETTINGS_ID });
  }
  return { ok: true, paymentsEnabled: on };
}

export type CompanyInput = { legalName: string; gstin: string; address: string; stateCode: string; sacCode: string; invoicePrefix: string; gstPercent: number };

/**
 * The operator sets who the seller is. Everything is checked for shape, and
 * the GSTIN's first two digits must be the state code — the one cross-check a
 * tax invoice's reader makes. The prefix and the SAC are free text within
 * reason; the accountant confirms the SAC (see the schema's docblock).
 */
export async function saveCompanyDetails(ctx: ActiveContext, input: CompanyInput): Promise<GigResult<{ company: CompanyDetails }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const legalName = input.legalName.trim();
  const gstin = input.gstin.trim().toUpperCase();
  const address = input.address.trim();
  const stateCode = input.stateCode.trim();
  const sacCode = input.sacCode.trim();
  const invoicePrefix = input.invoicePrefix.trim().toUpperCase();
  if (legalName.length < 2 || legalName.length > 160) return { ok: false, errorKey: "gigs.refuseCompanyName" };
  if (!GSTIN.test(gstin)) return { ok: false, errorKey: "gigs.refuseGstin" };
  if (!GST_STATE_CODE.test(stateCode)) return { ok: false, errorKey: "gigs.refuseStateCode" };
  if (gstin.slice(0, 2) !== stateCode) return { ok: false, errorKey: "gigs.refuseGstinState" };
  if (address.length > 400) return { ok: false, errorKey: "gigs.refuseCompanyAddress" };
  if (!/^\d{4,8}$/.test(sacCode)) return { ok: false, errorKey: "gigs.refuseSac" };
  if (!/^[A-Z][A-Z0-9]{0,7}$/.test(invoicePrefix)) return { ok: false, errorKey: "gigs.refuseInvoicePrefix" };
  if (!Number.isInteger(input.gstPercent) || input.gstPercent < 0 || input.gstPercent > 50) return { ok: false, errorKey: "gigs.refuseGstPercent" };
  await gigSettings();
  const row = await db.gigSettings.update({ where: { id: SETTINGS_ID }, data: { companyLegalName: legalName, companyGstin: gstin, companyAddress: address || null, companyStateCode: stateCode, invoiceSacCode: sacCode, invoicePrefix, gstPercent: input.gstPercent, updatedByUserId: ctx.user.id }, select: COMPANY_SELECT });
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "gig.company.save", targetType: "GigSettings", targetId: SETTINGS_ID, meta: { stateCode, gstPercent: input.gstPercent, sacCode, invoicePrefix } });
  return { ok: true, company: companyOf(row) };
}

export const commissionOf = (amountPaise: number, percent: number): number => Math.round((amountPaise * percent) / 100);
/** GST is on the commission alone: the seat fee is the expert's, collected on their behalf. */
export const gstOf = (commissionPaise: number, percent: number): number => Math.round((commissionPaise * percent) / 100);

/** "2026-27": April to March, by the company's calendar (Asia/Kolkata). */
export function financialYearOf(at: Date, zone = ZONE): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "numeric" }).formatToParts(at);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* The expert's payee details                                                  */
/* -------------------------------------------------------------------------- */

export type PayoutAccountView = { status: PayoutStatus; payeeName: string | null; upiId: string | null; /** The last four digits of the sealed account; the number itself is never returned. */ bankLast4: string | null; ifsc: string | null; gstStateCode: string | null; gstin: string | null; note: string | null; kycVerified: boolean; transport: GigGatewayTransport };

const PAYEE_SELECT = { status: true, payeeName: true, upiId: true, bankLast4: true, bankAccountEnc: true, ifsc: true, gstStateCode: true, gstin: true, note: true } as const;
type PayeeRow = { status: string; payeeName: string | null; upiId: string | null; bankLast4: string | null; bankAccountEnc: string | null; ifsc: string | null; gstStateCode: string | null; gstin: string | null; note: string | null };

const payeeComplete = (row: PayeeRow | null): boolean => Boolean(row?.payeeName && row.gstStateCode && (row.upiId || (row.bankAccountEnc && row.ifsc)));

/**
 * Where the expert is paid, as it stands: SUSPENDED by the operator stays
 * so; otherwise ACTIVE exactly when the details are complete AND the papers
 * are VERIFIED today (expert-kyc.ts is the one truth), NONE until then. Read
 * fresh each time, so a KYC verified after the details were typed makes
 * the account active without another save.
 */
export async function payoutAccountOf(expertUserId: string): Promise<PayoutAccountView> {
  const [row, profile] = await Promise.all([db.expertPayoutAccount.findUnique({ where: { expertUserId }, select: PAYEE_SELECT }), db.expertProfile.findUnique({ where: { userId: expertUserId }, select: { kycStatus: true } })]);
  const kycVerified = profile?.kycStatus === "VERIFIED";
  const status: PayoutStatus = row?.status === "SUSPENDED" ? "SUSPENDED" : payeeComplete(row) && kycVerified ? "ACTIVE" : "NONE";
  return { status, payeeName: row?.payeeName ?? null, upiId: row?.upiId ?? null, bankLast4: row?.bankLast4 ?? null, ifsc: row?.ifsc ?? null, gstStateCode: row?.gstStateCode ?? null, gstin: row?.gstin ?? null, note: row?.note ?? null, kycVerified, transport: transport() };
}

export type PayeeInput = { payeeName: string; upiId?: string | null; bankAccount?: string | null; ifsc?: string | null; gstStateCode: string; gstin?: string | null };

/**
 * The expert types where the company should pay them: a name, a UPI id or
 * a bank account with its IFSC (the account sealed, its last four kept),
 * the GST state they are in, and a GSTIN if they have one. Saving does not
 * need KYC — the details can be typed first — but the account is ACTIVE
 * only once the papers are verified. A suspension is the operator's to
 * lift; a save under one changes the details and not the standing.
 */
export async function savePayee(ctx: ActiveContext, input: PayeeInput): Promise<GigResult<{ payout: PayoutAccountView }>> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const profile = await db.expertProfile.findUnique({ where: { userId: ctx.user.id }, select: { id: true } });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");
  const payeeName = input.payeeName.trim();
  const upiId = input.upiId?.trim() || null;
  const bankAccount = input.bankAccount?.replace(/\s+/g, "") || null;
  const ifsc = input.ifsc?.trim().toUpperCase() || null;
  const gstStateCode = input.gstStateCode.trim();
  const gstin = input.gstin?.trim().toUpperCase() || null;
  if (payeeName.length < 2 || payeeName.length > 80) return { ok: false, errorKey: "gigs.refusePayeeName" };
  if (!upiId && !bankAccount) return { ok: false, errorKey: "gigs.refusePayeeHow" };
  if (upiId && !UPI_ID.test(upiId)) return { ok: false, errorKey: "fees.refuseUpiId" };
  if (bankAccount && !BANK_ACCOUNT.test(bankAccount)) return { ok: false, errorKey: "gigs.refuseBankAccount" };
  if (bankAccount && (!ifsc || !IFSC.test(ifsc))) return { ok: false, errorKey: "gigs.refuseIfsc" };
  if (!GST_STATE_CODE.test(gstStateCode)) return { ok: false, errorKey: "gigs.refuseStateCode" };
  if (gstin && !GSTIN.test(gstin)) return { ok: false, errorKey: "gigs.refuseGstin" };
  if (gstin && gstin.slice(0, 2) !== gstStateCode) return { ok: false, errorKey: "gigs.refuseGstinState" };
  if (bankAccount && !sealingAvailable()) return { ok: false, errorKey: "gigs.refuseSealingOff" };
  const sealed = bankAccount ? { bankAccountEnc: seal(bankAccount, `gig:payee:${ctx.user.id}`), bankLast4: bankAccount.slice(-4), ifsc } : { bankAccountEnc: null, bankLast4: null, ifsc: null };
  const data = { payeeName, upiId, ...sealed, gstStateCode, gstin };
  const current = await db.expertPayoutAccount.findUnique({ where: { expertUserId: ctx.user.id }, select: { status: true } });
  const status = current?.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
  await db.expertPayoutAccount.upsert({ where: { expertUserId: ctx.user.id }, create: { expertUserId: ctx.user.id, ...data, status }, update: { ...data, status } });
  // Neither the UPI id nor any part of the account number goes to the log: it is read by more people than the payer.
  await audit({ actorUserId: ctx.user.id, action: "gig.payee.save", targetType: "ExpertPayoutAccount", targetId: ctx.user.id, meta: { how: upiId ? "UPI" : "BANK", gstStateCode, gstin: Boolean(gstin) } });
  return { ok: true, payout: await payoutAccountOf(ctx.user.id) };
}

/** The operator stops paying an expert, with a reason they can read, or lifts the stop. */
export async function suspendPayee(ctx: ActiveContext, expertUserId: string, input: { suspended: boolean; note?: string | null }): Promise<GigResult<{ payout: PayoutAccountView }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const row = await db.expertPayoutAccount.findUnique({ where: { expertUserId }, select: { status: true } });
  if (!row) throw new AccessError("gigs.noSuchPayee", "NOT_FOUND");
  const note = (input.note ?? "").trim().slice(0, 300) || null;
  if (input.suspended && !note) return { ok: false, errorKey: "gigs.needReason" };
  await db.expertPayoutAccount.update({ where: { expertUserId }, data: { status: input.suspended ? "SUSPENDED" : "ACTIVE", note: input.suspended ? note : null } });
  await audit({ actorUserId: ctx.user.id, action: input.suspended ? "gig.payout.suspend" : "gig.payout.active", targetType: "ExpertPayoutAccount", targetId: expertUserId, meta: { note } });
  return { ok: true, payout: await payoutAccountOf(expertUserId) };
}

/** The sealed account opened for nobody but the operator's own eyes on the bank app — never put in a view. Kept for a future export; unused today. */
export function openPayeeAccount(expertUserId: string, bankAccountEnc: string): string {
  return open(bankAccountEnc, `gig:payee:${expertUserId}`);
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

type PaymentRow = { id: string; bookingId: string; slotId: string; payerUserId: string; expertUserId: string; amountPaise: number; commissionPaise: number; gstPaise: number; netPaise: number; receiptNumber: string | null; orderId: string; paymentId: string | null; refundId: string | null; status: string; paidAt: Date | null; holdUntil: Date | null; dueAt: Date | null; paidOutAt: Date | null; refundedAt: Date | null; pendingAction: string | null; attempts: number; lastError: string | null; payoutId: string | null; reason: string | null; createdAt: Date };
const PAYMENT_SELECT = { id: true, bookingId: true, slotId: true, payerUserId: true, expertUserId: true, amountPaise: true, commissionPaise: true, gstPaise: true, netPaise: true, receiptNumber: true, orderId: true, paymentId: true, refundId: true, status: true, paidAt: true, holdUntil: true, dueAt: true, paidOutAt: true, refundedAt: true, pendingAction: true, attempts: true, lastError: true, payoutId: true, reason: true, createdAt: true } as const;

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

/** The three figures from a gross under today's dials; what a capture freezes. */
function figuresOf(amountPaise: number, s: { commissionPercent: number; gstPercent: number }): { commissionPaise: number; gstPaise: number; netPaise: number } {
  const commissionPaise = commissionOf(amountPaise, s.commissionPercent);
  const gstPaise = gstOf(commissionPaise, s.gstPercent);
  return { commissionPaise, gstPaise, netPaise: amountPaise - commissionPaise - gstPaise };
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
  if (payout.status !== "ACTIVE") return { ok: false, errorKey: "gigs.refuseExpertNoPayout" };
  const settings = await paymentSettings();
  const figures = figuresOf(input.amountPaise, settings);
  // The row first, so the order's receipt carries our id; the order id is written once the gateway answers.
  const row = existing
    ? await db.sessionPayment.update({ where: { id: existing.id }, data: { status: "INITIATED", amountPaise: input.amountPaise, ...figures, payerUserId: input.payerUserId, reason: null, lastError: null, pendingAction: null, attempts: existing.attempts + 1 }, select: PAYMENT_SELECT })
    : await db.sessionPayment.create({ data: { bookingId: input.bookingId, slotId: input.slotId, payerUserId: input.payerUserId, expertUserId: input.expertUserId, amountPaise: input.amountPaise, ...figures, orderId: `pending_${input.bookingId}`, status: "INITIATED" }, select: PAYMENT_SELECT });
  let orderId: string;
  try {
    const order = await createSeatOrder({ amountPaise: input.amountPaise, receipt: row.id, notes: { shalaghar_session_payment: row.id, seat: input.title.slice(0, 60) } });
    orderId = order.orderId;
  } catch (error) {
    const reason = error instanceof GigGatewayError ? error.message : "gateway error";
    await db.sessionPayment.update({ where: { id: row.id }, data: { status: "FAILED", reason } });
    return { ok: false, errorKey: "gigs.refuseGatewayDown" };
  }
  const made = await db.sessionPayment.update({ where: { id: row.id }, data: { orderId }, select: PAYMENT_SELECT });
  await forSchool(input.schoolId, () => audit({ schoolId: input.schoolId, actorUserId: input.payerUserId, action: "gig.payment.start", targetType: "SessionPayment", targetId: made.id, meta: { bookingId: input.bookingId, amountPaise: input.amountPaise, ...figures, orderId } }));
  return { ok: true, checkout: checkoutOf(made, about) };
}

export type CaptureOutcome = "settled" | "already" | "unknown-order" | "amount-mismatch" | "not-settleable";

/** The next number in a receipt or invoice series, under a lock on the settings row that the caller's transaction then holds to its end. */
async function nextInSeries(tx: typeof db, kind: "RECEIPT" | "INVOICE", series: string): Promise<{ serial: number; number: string }> {
  await tx.$queryRaw`SELECT "id" FROM "GigSettings" WHERE "id" = ${SETTINGS_ID} FOR UPDATE`;
  const last =
    kind === "INVOICE"
      ? (await tx.gigInvoice.findFirst({ where: { series }, orderBy: { serial: "desc" }, select: { serial: true } }))?.serial
      : (await tx.sessionPayment.findFirst({ where: { receiptNumber: { startsWith: `${series}/` } }, orderBy: { receiptSerial: "desc" }, select: { receiptSerial: true } }))?.receiptSerial;
  const serial = (last ?? 0) + 1;
  return { serial, number: `${series}/${String(serial).padStart(4, "0")}` };
}

/**
 * THE ONE DOOR A CAPTURE COMES THROUGH. INITIATED (or FAILED: a signed
 * capture after a failed attempt on the same order is the retry going
 * through) → PAID with the three figures frozen under today's dials and the
 * family's receipt number taken, the booking PENDING_PAYMENT → CONFIRMED,
 * all in one transaction under the school's binding; then the row is HELD
 * for the expert. Who is told is gig-sessions.ts's (settleSeatPayment),
 * which wraps this.
 */
export async function markCaptured(input: { orderId: string; gatewayPaymentId: string; amountPaise: number }, now: Date = new Date()): Promise<{ outcome: CaptureOutcome; payment: PaymentRow | null; booking: { id: string; schoolId: string; studentMembershipId: string; slotId: string; providerUserId: string } | null }> {
  const p = await db.sessionPayment.findUnique({ where: { orderId: input.orderId }, select: { ...PAYMENT_SELECT, booking: { select: { id: true, schoolId: true, studentMembershipId: true, slotId: true, providerUserId: true, status: true } } } });
  if (!p) return { outcome: "unknown-order", payment: null, booking: null };
  const booking = { id: p.booking.id, schoolId: p.booking.schoolId, studentMembershipId: p.booking.studentMembershipId, slotId: p.booking.slotId, providerUserId: p.booking.providerUserId };
  if (p.status === "PAID" || p.status === "HELD" || p.status === "DUE" || p.status === "PAID_OUT" || p.status === "REFUNDED") return { outcome: "already", payment: p, booking };
  if (p.status !== "INITIATED" && p.status !== "FAILED") return { outcome: "not-settleable", payment: p, booking };
  if (p.amountPaise !== input.amountPaise) {
    await forSchool(booking.schoolId, () => audit({ schoolId: booking.schoolId, action: "gig.payment.mismatch", targetType: "SessionPayment", targetId: p.id, meta: { expected: p.amountPaise, got: input.amountPaise, gatewayPaymentId: input.gatewayPaymentId } }));
    return { outcome: "amount-mismatch", payment: p, booking };
  }
  const settings = await db.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: { commissionPercent: true, gstPercent: true, invoicePrefix: true } });
  const figures = figuresOf(p.amountPaise, settings);
  const series = `${settings.invoicePrefix}-R/${financialYearOf(now)}`;
  const settled = await forSchool(booking.schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const receipt = await nextInSeries(tx, "RECEIPT", series);
      const claimed = await tx.sessionPayment.updateMany({ where: { id: p.id, status: { in: ["INITIATED", "FAILED"] } }, data: { status: "PAID", paymentId: input.gatewayPaymentId, paidAt: now, ...figures, receiptNumber: receipt.number, receiptSerial: receipt.serial, reason: null, lastError: null } });
      if (claimed.count === 0) return null;
      // A seat the family gave up, or that expired, before the money arrived is still paid for: the row is
      // PAID and refundable (refundSeatPayment below), the booking is left as it stands for the job to refund.
      await tx.gigBooking.updateMany({ where: { id: booking.id, schoolId: booking.schoolId, status: "PENDING_PAYMENT" }, data: { status: "CONFIRMED", consentAt: now, consentUserId: p.payerUserId } });
      return receipt;
    }),
  );
  if (!settled) return { outcome: "already", payment: p, booking };
  await forSchool(booking.schoolId, () => audit({ schoolId: booking.schoolId, actorUserId: p.payerUserId, action: "gig.payment.paid", targetType: "SessionPayment", targetId: p.id, meta: { bookingId: booking.id, amountPaise: p.amountPaise, ...figures, receiptNumber: settled.number, gatewayPaymentId: input.gatewayPaymentId } }));
  await holdPayment(p.id);
  const after = (await db.sessionPayment.findUnique({ where: { id: p.id }, select: PAYMENT_SELECT })) ?? p;
  return { outcome: "settled", payment: after, booking };
}

/** A PAID row is HELD for the expert: the net waits for the session to be delivered. */
export async function holdPayment(paymentRowId: string): Promise<boolean> {
  const p = await db.sessionPayment.findUnique({ where: { id: paymentRowId }, select: PAYMENT_SELECT });
  if (!p || p.status !== "PAID") return false;
  const changed = await db.sessionPayment.updateMany({ where: { id: p.id, status: "PAID" }, data: { status: "HELD", lastError: null } });
  if (changed.count === 0) return false;
  await audit({ actorUserId: null, action: "gig.payment.held", targetType: "SessionPayment", targetId: p.id, meta: { netPaise: p.netPaise } });
  return true;
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
/* Hold, due, refund                                                            */
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
 * the gateway, from the company's balance; one still INITIATED is voided
 * (no money moved); one already DUE or PAID_OUT is past refunding here and
 * is said so. A gateway that cannot be reached leaves the row with
 * pendingAction REFUND, which releaseDue and the operator's retry take up.
 * No commission or GST stands on a refunded seat: the figures are zeroed
 * with the net, so no statement counts them.
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
    await db.sessionPayment.update({ where: { id: p.id }, data: { status: "REFUNDED", refundId: refund.refundId, refundedAt: now, reason: why, pendingAction: null, lastError: null, holdUntil: null, commissionPaise: 0, gstPaise: 0, netPaise: 0 } });
    await forSchool(p.booking.schoolId, () => audit({ schoolId: p.booking.schoolId, actorUserId, action: "gig.payment.refunded", targetType: "SessionPayment", targetId: p.id, meta: { amountPaise: p.amountPaise, refundId: refund.refundId, reason: why } }));
    return "refunded";
  } catch (error) {
    const message = (error instanceof Error ? error.message : "gateway error").slice(0, 300);
    await db.sessionPayment.update({ where: { id: p.id }, data: { pendingAction: "REFUND", reason: why, lastError: message, attempts: p.attempts + 1 } });
    await forSchool(p.booking.schoolId, () => audit({ schoolId: p.booking.schoolId, actorUserId, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "REFUND", error: message } }));
    return "pending";
  }
}

export type ReleaseRun = { due: number; duePaise: number; refunded: number; held: number; failed: number; payoutsOpened: number; dueTo: { expertUserId: string; netPaise: number; payoutId: string; opened: boolean }[] };

/**
 * The job's money half (gigs:release, hourly): every HELD payment whose hold
 * has ended becomes DUE and joins the expert's one OPEN payout — made now if
 * they have none, and the expert told once when it is; a refund that could
 * not be made is tried again; a PAID row that never became HELD (a crash
 * between the two writes) is held. Nothing becomes DUE while the switch is
 * off — refunds still go, since that is the family's money.
 */
export async function releaseDue(now: Date = new Date()): Promise<ReleaseRun> {
  const run: ReleaseRun = { due: 0, duePaise: 0, refunded: 0, held: 0, failed: 0, payoutsOpened: 0, dueTo: [] };
  const on = await paymentsOn();

  for (const p of await db.sessionPayment.findMany({ where: { status: "PAID", paymentId: { not: null } }, select: { id: true }, take: 200 })) {
    if (await holdPayment(p.id)) run.held += 1;
  }
  for (const p of await db.sessionPayment.findMany({ where: { pendingAction: "REFUND", status: { in: ["PAID", "HELD"] } }, select: { bookingId: true, reason: true }, take: 200 })) {
    const outcome = await refundSeatPayment(p.bookingId, p.reason ?? "refund", null, now);
    if (outcome === "refunded") run.refunded += 1;
    else run.failed += 1;
  }
  if (!on) return run;

  const due = await db.sessionPayment.findMany({ where: { status: "HELD", holdUntil: { not: null, lte: now } }, orderBy: { holdUntil: "asc" }, select: PAYMENT_SELECT, take: 500 });
  const byExpert = new Map<string, PaymentRow[]>();
  for (const p of due) (byExpert.get(p.expertUserId) ?? byExpert.set(p.expertUserId, []).get(p.expertUserId)!).push(p);
  for (const [expertUserId, rows] of byExpert) {
    const result = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      // The expert's one OPEN payout, under the settings row's lock so a second run cannot open another.
      await tx.$queryRaw`SELECT "id" FROM "GigSettings" WHERE "id" = ${SETTINGS_ID} FOR UPDATE`;
      const existing = await tx.expertPayout.findFirst({ where: { expertUserId, status: "OPEN" }, select: { id: true } });
      const payout = existing ?? (await tx.expertPayout.create({ data: { expertUserId, netPaise: 0, paymentsCount: 0, status: "OPEN" }, select: { id: true } }));
      let sum = 0;
      let count = 0;
      const ids: string[] = [];
      for (const p of rows) {
        const changed = await tx.sessionPayment.updateMany({ where: { id: p.id, status: "HELD" }, data: { status: "DUE", dueAt: now, payoutId: payout.id, pendingAction: null, lastError: null } });
        if (changed.count === 0) continue;
        sum += p.netPaise;
        count += 1;
        ids.push(p.id);
      }
      if (count === 0) {
        if (!existing) await tx.expertPayout.delete({ where: { id: payout.id } });
        return null;
      }
      await tx.expertPayout.update({ where: { id: payout.id }, data: { netPaise: { increment: sum }, paymentsCount: { increment: count } } });
      return { payoutId: payout.id, opened: !existing, sum, count, ids };
    });
    if (!result) continue;
    for (const id of result.ids) await audit({ actorUserId: null, action: "gig.payment.due", targetType: "SessionPayment", targetId: id, meta: { payoutId: result.payoutId } });
    if (result.opened) {
      await audit({ actorUserId: null, action: "gig.payout.open", targetType: "ExpertPayout", targetId: result.payoutId, meta: { expertUserId, netPaise: result.sum, paymentsCount: result.count } });
      await forUser(expertUserId, () => notify({ userId: expertUserId, schoolId: null, kind: "EXPERT", titleKey: "gigs.notifDue", titleVars: { amount: rupees(result.sum), count: result.count }, url: "/expert/earnings", meta: { payoutId: result.payoutId } })).catch((error) => console.error("[gig-payments] due notice failed", error));
      run.payoutsOpened += 1;
    }
    run.due += result.count;
    run.duePaise += result.sum;
    run.dueTo.push({ expertUserId, netPaise: result.sum, payoutId: result.payoutId, opened: result.opened });
  }
  return run;
}

/** The operator tries a waiting refund now, instead of at the next run; a PAID row that never became HELD is held. */
export async function retrySeatPayment(ctx: ActiveContext, paymentRowId: string, now: Date = new Date()): Promise<GigResult<{ outcome: string }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const p = await db.sessionPayment.findUnique({ where: { id: paymentRowId }, select: PAYMENT_SELECT });
  if (!p) throw new AccessError("gigs.noSuchPayment", "NOT_FOUND");
  await audit({ actorUserId: ctx.user.id, action: "gig.payment.retry", targetType: "SessionPayment", targetId: p.id, meta: { action: p.pendingAction, status: p.status } });
  if (p.pendingAction === "REFUND") return { ok: true, outcome: await refundSeatPayment(p.bookingId, p.reason ?? "refund", ctx.user.id, now) };
  if (p.status === "PAID") return { ok: true, outcome: (await holdPayment(p.id)) ? "held" : "waiting" };
  return { ok: false, errorKey: "gigs.refuseNothingToRetry" };
}

/* -------------------------------------------------------------------------- */
/* The company pays the expert, and invoices its commission                     */
/* -------------------------------------------------------------------------- */

export type InvoiceParty = { name: string; gstin: string | null; address: string | null; stateCode: string | null };
export type InvoiceLine = { paymentId: string; title: string; date: string; grossPaise: number; commissionPaise: number; gstPaise: number };
export type InvoiceView = { id: string; number: string; payoutId: string; expertUserId: string; issuedAt: string; locale: "en" | "hi" | "mr"; taxableValuePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; totalPaise: number; sacCode: string; seller: InvoiceParty; buyer: InvoiceParty; lines: InvoiceLine[]; /** The payout the invoice settles against: what was paid, when, by which reference. */ payout: { netPaise: number; paymentsCount: number; reference: string | null; paidAt: string | null } };

const INVOICE_SELECT = { id: true, number: true, payoutId: true, expertUserId: true, issuedAt: true, locale: true, taxableValuePaise: true, cgstPaise: true, sgstPaise: true, igstPaise: true, totalPaise: true, sacCode: true, sellerJson: true, buyerJson: true, linesJson: true, payout: { select: { netPaise: true, paymentsCount: true, reference: true, paidAt: true } } } as const;
type InvoiceRow = { id: string; number: string; payoutId: string; expertUserId: string; issuedAt: Date; locale: string; taxableValuePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; totalPaise: number; sacCode: string; sellerJson: string; buyerJson: string; linesJson: string; payout: { netPaise: number; paymentsCount: number; reference: string | null; paidAt: Date | null } };

const asInvoiceLocale = (raw: string): "en" | "hi" | "mr" => (raw === "hi" || raw === "mr" ? raw : "en");
function invoiceOf(r: InvoiceRow): InvoiceView {
  const party = (raw: string): InvoiceParty => {
    const j = readJson<Partial<InvoiceParty>>(raw, {});
    return { name: j.name ?? "", gstin: j.gstin ?? null, address: j.address ?? null, stateCode: j.stateCode ?? null };
  };
  return { id: r.id, number: r.number, payoutId: r.payoutId, expertUserId: r.expertUserId, issuedAt: r.issuedAt.toISOString(), locale: asInvoiceLocale(r.locale), taxableValuePaise: r.taxableValuePaise, cgstPaise: r.cgstPaise, sgstPaise: r.sgstPaise, igstPaise: r.igstPaise, totalPaise: r.totalPaise, sacCode: r.sacCode, seller: party(r.sellerJson), buyer: party(r.buyerJson), lines: readJson<InvoiceLine[]>(r.linesJson, []), payout: { netPaise: r.payout.netPaise, paymentsCount: r.payout.paymentsCount, reference: r.payout.reference, paidAt: r.payout.paidAt?.toISOString() ?? null } };
}

class Refusal extends Error {
  constructor(readonly errorKey: "gigs.refuseNothingDue" | "gigs.refusePayoutPaid") {
    super(errorKey);
  }
}

export type PayoutRecordInput = { reference: string; paidAt?: string | null; note?: string | null };

/**
 * The operator has paid an expert from the company's bank and records the
 * transfer's reference. Refused by name until the company's legal name,
 * GSTIN and state are set (the invoice cannot name its seller without
 * them), when the expert has no payee details, when the payout is not OPEN
 * or holds nothing, and for a reference already used. In ONE transaction:
 * the payout PAID with the reference, every payment in it PAID_OUT, and the
 * tax invoice written with the next number of the financial year's series,
 * its figures and both parties frozen, CGST+SGST or IGST by the expert's
 * state against the company's. The expert is told, and may read the PDF.
 */
export async function recordPayout(ctx: ActiveContext, payoutId: string, input: PayoutRecordInput, now: Date = new Date()): Promise<GigResult<{ payout: { id: string; netPaise: number; paymentsCount: number; reference: string }; invoice: { id: string; number: string; totalPaise: number } }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const reference = input.reference.trim().toUpperCase();
  if (!UTR.test(reference)) return { ok: false, errorKey: "gigs.refuseUtr" };
  const paidAt = input.paidAt ? new Date(input.paidAt) : now;
  if (Number.isNaN(paidAt.getTime()) || paidAt.getTime() > now.getTime() + HOUR) return { ok: false, errorKey: "gigs.refusePaidAt" };
  const company = await companyDetails();
  if (company.missing.length > 0) return { ok: false, errorKey: "gigs.refuseCompanyDetails" };
  const payout = await db.expertPayout.findUnique({ where: { id: payoutId }, select: { id: true, expertUserId: true, status: true, netPaise: true, paymentsCount: true, expert: { select: { name: true, prefs: true } } } });
  if (!payout) throw new AccessError("gigs.noSuchPayout", "NOT_FOUND");
  if (payout.status !== "OPEN") return { ok: false, errorKey: "gigs.refusePayoutPaid" };
  const payee = await db.expertPayoutAccount.findUnique({ where: { expertUserId: payout.expertUserId }, select: PAYEE_SELECT });
  if (!payeeComplete(payee) || !payee) return { ok: false, errorKey: "gigs.refuseNoPayee" };
  if (await db.expertPayout.findUnique({ where: { reference }, select: { id: true } })) return { ok: false, errorKey: "gigs.refuseUtrUsed" };
  const locale = normaliseLocale(readJson<{ locale?: string }>(payout.expert.prefs, {}).locale);
  const series = `${company.invoicePrefix}/${financialYearOf(paidAt)}`;
  const seller: InvoiceParty = { name: company.legalName!, gstin: company.gstin, address: company.address, stateCode: company.stateCode };
  const buyer: InvoiceParty = { name: payee.payeeName ?? payout.expert.name, gstin: payee.gstin, address: null, stateCode: payee.gstStateCode };
  const sameState = buyer.stateCode === seller.stateCode;

  let made: { payout: { id: string; netPaise: number; paymentsCount: number; reference: string }; invoice: { id: string; number: string; totalPaise: number } };
  try {
    made = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "SessionPayment" WHERE "payoutId" = ${payout.id} AND "status" = 'DUE' ORDER BY "id" FOR UPDATE`;
      if (rows.length === 0) throw new Refusal("gigs.refuseNothingDue");
      const payments = await tx.sessionPayment.findMany({ where: { id: { in: rows.map((r) => r.id) } }, orderBy: { dueAt: "asc" }, select: { id: true, amountPaise: true, commissionPaise: true, gstPaise: true, netPaise: true, slot: { select: { title: true, startsAt: true } } } });
      const lines: InvoiceLine[] = payments.map((p) => ({ paymentId: p.id, title: p.slot.title, date: p.slot.startsAt.toISOString().slice(0, 10), grossPaise: p.amountPaise, commissionPaise: p.commissionPaise, gstPaise: p.gstPaise }));
      const taxableValuePaise = lines.reduce((a, l) => a + l.commissionPaise, 0);
      const gst = lines.reduce((a, l) => a + l.gstPaise, 0);
      const cgstPaise = sameState ? Math.floor(gst / 2) : 0;
      const sgstPaise = sameState ? gst - cgstPaise : 0;
      const igstPaise = sameState ? 0 : gst;
      const netPaise = payments.reduce((a, p) => a + p.netPaise, 0);
      const number = await nextInSeries(tx, "INVOICE", series);
      const claimed = await tx.expertPayout.updateMany({ where: { id: payout.id, status: "OPEN" }, data: { status: "PAID", reference, paidAt, paidByUserId: ctx.user.id, note: (input.note ?? "").trim().slice(0, 300) || null, netPaise, paymentsCount: payments.length } });
      if (claimed.count === 0) throw new Refusal("gigs.refusePayoutPaid");
      await tx.sessionPayment.updateMany({ where: { id: { in: payments.map((p) => p.id) } }, data: { status: "PAID_OUT", paidOutAt: paidAt } });
      const invoice = await tx.gigInvoice.create({
        data: { number: number.number, series, serial: number.serial, payoutId: payout.id, expertUserId: payout.expertUserId, issuedAt: paidAt, locale, taxableValuePaise, cgstPaise, sgstPaise, igstPaise, totalPaise: taxableValuePaise + gst, sacCode: company.sacCode, sellerJson: JSON.stringify(seller), buyerJson: JSON.stringify(buyer), linesJson: JSON.stringify(lines) },
        select: { id: true, number: true, totalPaise: true },
      });
      return { payout: { id: payout.id, netPaise, paymentsCount: payments.length, reference }, invoice };
    });
  } catch (error) {
    if (error instanceof Refusal) return { ok: false, errorKey: error.errorKey };
    // Two records with one reference at the same moment: the second meets the unique index.
    if ((error as { code?: string }).code === "P2002") return { ok: false, errorKey: "gigs.refuseUtrUsed" };
    throw error;
  }
  await audit({ actorUserId: ctx.user.id, action: "gig.payout.paid", targetType: "ExpertPayout", targetId: payout.id, meta: { expertUserId: payout.expertUserId, netPaise: made.payout.netPaise, paymentsCount: made.payout.paymentsCount, reference, invoiceNumber: made.invoice.number } });
  await audit({ actorUserId: ctx.user.id, action: "gig.invoice.issue", targetType: "GigInvoice", targetId: made.invoice.id, meta: { number: made.invoice.number, expertUserId: payout.expertUserId, totalPaise: made.invoice.totalPaise, payoutId: payout.id } });
  await forUser(payout.expertUserId, () => notify({ userId: payout.expertUserId, schoolId: null, kind: "EXPERT", titleKey: "gigs.notifPaidOut", titleVars: { amount: rupees(made.payout.netPaise), count: made.payout.paymentsCount, reference }, url: "/expert/earnings", meta: { payoutId: payout.id, invoiceId: made.invoice.id } })).catch((error) => console.error("[gig-payments] payout notice failed", error));
  return { ok: true, ...made };
}

/* -------------------------------------------------------------------------- */
/* What the gateway's webhook says afterwards                                   */
/* -------------------------------------------------------------------------- */

/** refund.failed: the money never left; the row goes back to waiting for a refund with the figures it had. */
export async function markSeatRefundFailed(refundId: string, reason: string): Promise<boolean> {
  const p = await db.sessionPayment.findFirst({ where: { refundId, status: "REFUNDED" }, select: { id: true, attempts: true, amountPaise: true } });
  if (!p) return false;
  const settings = await db.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: { commissionPercent: true, gstPercent: true } });
  await db.sessionPayment.update({ where: { id: p.id }, data: { status: "HELD", refundedAt: null, refundId: null, pendingAction: "REFUND", lastError: reason.slice(0, 300), attempts: p.attempts + 1, ...figuresOf(p.amountPaise, settings) } });
  await audit({ actorUserId: null, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "REFUND", error: reason.slice(0, 300), via: "webhook" } });
  return true;
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export type FamilyPaymentView = { paymentId: string; bookingId: string; status: SessionPaymentStatus; amountPaise: number; receiptNumber: string | null; bookingStatus: string; refundedAt: string | null; reason: string | null; checkout: SeatCheckout | null };

/** The payer's own payment, with the checkout while it still waits; anybody else's is not found. */
export async function familyPayment(ctx: ActiveContext, paymentRowId: string): Promise<FamilyPaymentView> {
  if (ctx.role !== "PARENT" && ctx.role !== "STUDENT") throw new AccessError("access.wrongRoleForThisAction");
  const p = await db.sessionPayment.findFirst({ where: { id: paymentRowId, payerUserId: ctx.user.id }, select: { ...PAYMENT_SELECT, booking: { select: { status: true, slot: { select: { title: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } } } });
  if (!p) throw new AccessError("gigs.noSuchPayment", "NOT_FOUND");
  const checkout = p.status === "INITIATED" ? checkoutOf(p, { title: p.booking.slot.title, pupilName: p.booking.student.user.preferredName ?? p.booking.student.user.name, payerName: ctx.user.name, payerEmail: ctx.user.email ?? null }) : null;
  return { paymentId: p.id, bookingId: p.bookingId, status: p.status as SessionPaymentStatus, amountPaise: p.amountPaise, receiptNumber: p.receiptNumber, bookingStatus: p.booking.status, refundedAt: p.refundedAt?.toISOString() ?? null, reason: p.reason, checkout };
}

export type ReceiptView = { paymentId: string; receiptNumber: string; status: SessionPaymentStatus; amountPaise: number; paidAt: string; gatewayPaymentId: string | null; title: string; startsAt: string; expertName: string; pupilName: string; payerName: string; /** The collecting party, as it stands today; the product's name until the operator sets one. */ collectedBy: string; refundedAt: string | null; refundedPaise: number };

/**
 * The family's receipt for a seat the company collected for: the payer's
 * own row (a pupil reads their guardian's receipt for their own seat), once
 * it is paid; one still waiting, failed or voided has none. The gross alone:
 * the split is the company's and the expert's business, not the family's.
 */
export async function familyReceipt(ctx: ActiveContext, paymentRowId: string): Promise<ReceiptView> {
  if (ctx.role !== "PARENT" && ctx.role !== "STUDENT") throw new AccessError("access.wrongRoleForThisAction");
  const own = ctx.role === "PARENT" ? { payerUserId: ctx.user.id } : { booking: { student: { userId: ctx.user.id } } };
  const p = await db.sessionPayment.findFirst({ where: { id: paymentRowId, ...own }, select: { ...PAYMENT_SELECT, payer: { select: { name: true } }, expert: { select: { name: true } }, slot: { select: { title: true, startsAt: true } }, booking: { select: { student: { select: { user: { select: { name: true, preferredName: true } } } } } } } });
  if (!p) throw new AccessError("gigs.noSuchPayment", "NOT_FOUND");
  if (!p.receiptNumber || !p.paidAt || p.status === "INITIATED" || p.status === "FAILED") throw new AccessError("gigs.noReceiptYet");
  const company = await companyDetails();
  return { paymentId: p.id, receiptNumber: p.receiptNumber, status: p.status as SessionPaymentStatus, amountPaise: p.amountPaise, paidAt: p.paidAt.toISOString(), gatewayPaymentId: p.paymentId, title: p.slot.title, startsAt: p.slot.startsAt.toISOString(), expertName: p.expert.name, pupilName: p.booking.student.user.preferredName ?? p.booking.student.user.name, payerName: p.payer.name, collectedBy: company.legalName ?? "Shalaghar", refundedAt: p.refundedAt?.toISOString() ?? null, refundedPaise: p.status === "REFUNDED" ? p.amountPaise : 0 };
}

export type EarningRow = { paymentId: string; bookingId: string; title: string; startsAt: string; schoolName: string; amountPaise: number; commissionPaise: number; gstPaise: number; netPaise: number; status: SessionPaymentStatus; holdUntil: string | null; dueAt: string | null; paidOutAt: string | null; refundedAt: string | null; payoutId: string | null; reason: string | null };
export type EarningPayout = { id: string; netPaise: number; paymentsCount: number; status: string; reference: string | null; paidAt: string | null; createdAt: string; invoiceId: string | null; invoiceNumber: string | null };
export type EarningInvoice = { id: string; number: string; issuedAt: string; taxableValuePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; totalPaise: number; payoutId: string };
export type Earnings = { heldPaise: number; duePaise: number; paidOutPaise: number; refundedPaise: number; commissionPercent: number; gstPercent: number; rows: EarningRow[]; payouts: EarningPayout[]; invoices: EarningInvoice[] };

const earningStatuses = (status: string): SessionPaymentStatus => (SESSION_PAYMENT_STATUSES.includes(status as SessionPaymentStatus) ? (status as SessionPaymentStatus) : "FAILED");

/** What the expert has on hold, is owed, was paid and was refunded, seat by seat with the three figures, payout by payout, and the invoices. No pupil's name: the school's is enough on a statement. */
export async function expertEarnings(ctx: ActiveContext): Promise<Earnings> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const [settings, rows, payouts, invoices] = await Promise.all([
    paymentSettings(),
    db.sessionPayment.findMany({ where: { expertUserId: ctx.user.id, status: { not: "INITIATED" } }, orderBy: { createdAt: "desc" }, take: 300, select: { ...PAYMENT_SELECT, slot: { select: { title: true, startsAt: true } }, booking: { select: { school: { select: { name: true } } } } } }),
    db.expertPayout.findMany({ where: { expertUserId: ctx.user.id }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, netPaise: true, paymentsCount: true, status: true, reference: true, paidAt: true, createdAt: true, invoice: { select: { id: true, number: true } } } }),
    db.gigInvoice.findMany({ where: { expertUserId: ctx.user.id }, orderBy: { issuedAt: "desc" }, take: 100, select: { id: true, number: true, issuedAt: true, taxableValuePaise: true, cgstPaise: true, sgstPaise: true, igstPaise: true, totalPaise: true, payoutId: true } }),
  ]);
  const sumNet = (statuses: string[]) => rows.filter((p) => statuses.includes(p.status)).reduce((a, p) => a + p.netPaise, 0);
  return {
    heldPaise: sumNet(["PAID", "HELD"]),
    duePaise: sumNet(["DUE"]),
    paidOutPaise: sumNet(["PAID_OUT"]),
    refundedPaise: rows.filter((p) => p.status === "REFUNDED").reduce((a, p) => a + p.amountPaise, 0),
    commissionPercent: settings.commissionPercent,
    gstPercent: settings.gstPercent,
    rows: rows.map((p) => ({ paymentId: p.id, bookingId: p.bookingId, title: p.slot.title, startsAt: p.slot.startsAt.toISOString(), schoolName: p.booking.school.name, amountPaise: p.amountPaise, commissionPaise: p.commissionPaise, gstPaise: p.gstPaise, netPaise: p.netPaise, status: earningStatuses(p.status), holdUntil: p.holdUntil?.toISOString() ?? null, dueAt: p.dueAt?.toISOString() ?? null, paidOutAt: p.paidOutAt?.toISOString() ?? null, refundedAt: p.refundedAt?.toISOString() ?? null, payoutId: p.payoutId, reason: p.reason })),
    payouts: payouts.map((x) => ({ id: x.id, netPaise: x.netPaise, paymentsCount: x.paymentsCount, status: x.status, reference: x.reference, paidAt: x.paidAt?.toISOString() ?? null, createdAt: x.createdAt.toISOString(), invoiceId: x.invoice?.id ?? null, invoiceNumber: x.invoice?.number ?? null })),
    invoices: invoices.map((i) => ({ ...i, issuedAt: i.issuedAt.toISOString() })),
  };
}

/** The expert's own invoices, newest first. */
export async function expertInvoices(ctx: ActiveContext): Promise<{ invoices: InvoiceView[] }> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const rows = await db.gigInvoice.findMany({ where: { expertUserId: ctx.user.id }, orderBy: { issuedAt: "desc" }, take: 200, select: INVOICE_SELECT });
  return { invoices: rows.map(invoiceOf) };
}

/** One invoice: the expert it is addressed to reads their own, the operator any; anybody else's is not found. */
export async function invoiceView(ctx: ActiveContext, invoiceId: string): Promise<InvoiceView> {
  if (ctx.role !== "EXPERT" && !ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const row = await db.gigInvoice.findFirst({ where: { id: invoiceId, ...(ctx.user.isSuperuser ? {} : { expertUserId: ctx.user.id }) }, select: INVOICE_SELECT });
  if (!row) throw new AccessError("gigs.noSuchInvoice", "NOT_FOUND");
  return invoiceOf(row);
}

/** Every invoice the company has issued, newest first, with the expert's name. */
export async function operatorInvoices(ctx: ActiveContext): Promise<{ invoices: (InvoiceView & { expertName: string })[] }> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const rows = await db.gigInvoice.findMany({ orderBy: { issuedAt: "desc" }, take: 300, select: { ...INVOICE_SELECT, expert: { select: { name: true } } } });
  return { invoices: rows.map((r) => ({ ...invoiceOf(r), expertName: r.expert.name })) };
}

export type PayoutPayee = { payeeName: string | null; upiId: string | null; bankLast4: string | null; ifsc: string | null; gstStateCode: string | null; gstin: string | null; status: PayoutStatus };
export type PayoutsView = {
  paymentsEnabled: boolean;
  transport: GigGatewayTransport;
  month: string;
  commissionThisMonthPaise: number;
  gstThisMonthPaise: number;
  heldPaise: number;
  duePaise: number;
  paidOutThisMonthPaise: number;
  refundedThisMonthPaise: number;
  company: CompanyDetails;
  failures: { paymentId: string; expertName: string; amountPaise: number; action: "REFUND" | "HOLD"; lastError: string | null; attempts: number; since: string }[];
  /** OPEN payouts, oldest first: what the company is to pay now, with where to pay it. */
  toPay: { id: string; expertUserId: string; expertName: string; payee: PayoutPayee; netPaise: number; paymentsCount: number; createdAt: string }[];
  /** PAID payouts, newest first, with the reference and the invoice. */
  paid: { id: string; expertUserId: string; expertName: string; netPaise: number; paymentsCount: number; reference: string | null; paidAt: string | null; invoiceId: string | null; invoiceNumber: string | null; note: string | null }[];
};

/** The operator's side: the switch, the company's details, the month's commission and GST, what is held and due, what failed and waits, what is to pay now and what was paid. */
export async function operatorPayouts(ctx: ActiveContext, now: Date = new Date()): Promise<PayoutsView> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const [settings, company] = await Promise.all([paymentSettings(), companyDetails()]);
  const month = monthKey(now);
  const monthStart = new Date(`${month}-01T00:00:00+05:30`);
  const [captured, held, paidOut, refunded, failures, open, paid] = await Promise.all([
    db.sessionPayment.aggregate({ where: { status: { in: ["PAID", "HELD", "DUE", "PAID_OUT"] }, paidAt: { gte: monthStart } }, _sum: { commissionPaise: true, gstPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: { in: ["PAID", "HELD"] } }, _sum: { netPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: "PAID_OUT", paidOutAt: { gte: monthStart } }, _sum: { netPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: "REFUNDED", refundedAt: { gte: monthStart } }, _sum: { amountPaise: true } }),
    db.sessionPayment.findMany({ where: { OR: [{ pendingAction: { not: null } }, { status: "PAID", paidAt: { lt: new Date(now.getTime() - HOUR) } }] }, orderBy: { createdAt: "asc" }, take: 100, select: { ...PAYMENT_SELECT, expert: { select: { name: true } } } }),
    db.expertPayout.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, take: 200, select: { id: true, expertUserId: true, netPaise: true, paymentsCount: true, createdAt: true, expert: { select: { name: true, payoutAccount: { select: { payeeName: true, upiId: true, bankLast4: true, ifsc: true, gstStateCode: true, gstin: true, status: true } }, expertProfile: { select: { kycStatus: true } } } } } }),
    db.expertPayout.findMany({ where: { status: "PAID" }, orderBy: { paidAt: "desc" }, take: 100, select: { id: true, expertUserId: true, netPaise: true, paymentsCount: true, reference: true, paidAt: true, note: true, expert: { select: { name: true } }, invoice: { select: { id: true, number: true } } } }),
  ]);
  const standing = (a: { payeeName: string | null; upiId: string | null; bankLast4: string | null; ifsc: string | null; gstStateCode: string | null; gstin: string | null; status: string } | null, kyc: string | undefined): PayoutPayee => {
    const complete = Boolean(a?.payeeName && a.gstStateCode && (a.upiId || (a.bankLast4 && a.ifsc)));
    const status: PayoutStatus = a?.status === "SUSPENDED" ? "SUSPENDED" : complete && kyc === "VERIFIED" ? "ACTIVE" : "NONE";
    return { payeeName: a?.payeeName ?? null, upiId: a?.upiId ?? null, bankLast4: a?.bankLast4 ?? null, ifsc: a?.ifsc ?? null, gstStateCode: a?.gstStateCode ?? null, gstin: a?.gstin ?? null, status };
  };
  return {
    paymentsEnabled: settings.paymentsEnabled,
    transport: settings.transport,
    month,
    commissionThisMonthPaise: captured._sum.commissionPaise ?? 0,
    gstThisMonthPaise: captured._sum.gstPaise ?? 0,
    heldPaise: held._sum.netPaise ?? 0,
    duePaise: open.reduce((a, p) => a + p.netPaise, 0),
    paidOutThisMonthPaise: paidOut._sum.netPaise ?? 0,
    refundedThisMonthPaise: refunded._sum.amountPaise ?? 0,
    company,
    failures: failures.map((p) => ({ paymentId: p.id, expertName: p.expert.name, amountPaise: p.pendingAction === "REFUND" ? p.amountPaise : p.netPaise, action: (p.pendingAction === "REFUND" ? "REFUND" : "HOLD") as "REFUND" | "HOLD", lastError: p.lastError, attempts: p.attempts, since: p.createdAt.toISOString() })),
    toPay: open.map((x) => ({ id: x.id, expertUserId: x.expertUserId, expertName: x.expert.name, payee: standing(x.expert.payoutAccount, x.expert.expertProfile?.kycStatus), netPaise: x.netPaise, paymentsCount: x.paymentsCount, createdAt: x.createdAt.toISOString() })),
    paid: paid.map((x) => ({ id: x.id, expertUserId: x.expertUserId, expertName: x.expert.name, netPaise: x.netPaise, paymentsCount: x.paymentsCount, reference: x.reference, paidAt: x.paidAt?.toISOString() ?? null, invoiceId: x.invoice?.id ?? null, invoiceNumber: x.invoice?.number ?? null, note: x.note })),
  };
}

/** ₹1,250 for a notice, the same output as the i18n helper, server-side. */
export function rupees(paise: number): string {
  const r = paise / 100;
  return `₹${new Intl.NumberFormat("en-IN", { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 }).format(r)}`;
}
