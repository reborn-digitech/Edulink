import "server-only";
import { createHash } from "node:crypto";
import { normaliseLocale } from "@edulink/i18n";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { forSchool, forUser } from "./tenant-context";
import { gigSettings, monthKey, type GigResult } from "./gig-questions";
import { createCompanyOrder, createLinkedAccount, createSeatOrder, createStakeholder, fetchRouteProduct, GigGatewayError, paymentRefundedAtGateway, platformAccount, refundSeat, releaseTransfer, requestRouteProduct, ROUTE_STATUSES, routeStatusOf, setRouteBank, stateNameOf, transferFromPayment, transfersOf, transport, verifySeatCheckout, webhookSecret, type RouteProduct, type RouteRequirement, type RouteStatus } from "./gig-gateway";
import type { GigGatewayTransport } from "./gig-gateway-env";
import { open, seal, sealingAvailable } from "./secret-box";
import { openPan, writePan } from "./pan";
import { readJson } from "./json";
import type { ActiveContext } from "./session";

/**
 * Paid workshop seats: the money side (decision 0004, third amendment of
 * 2 October 2026 — RAZORPAY ROUTE, THE EXPERT'S SHARE ON HOLD).
 *
 * WHAT THIS FILE OWNS. The money rows — an expert's linked account and the
 * details it is made from (ExpertPayoutAccount), a guardian's payment for one
 * seat with the three figures frozen at capture (SessionPayment), one
 * expert's seats settled together (ExpertPayout), and the GST tax invoice for
 * the commission on each (GigInvoice) — every call to the gateway
 * (gig-gateway.ts), and the one audit row for every change of a payment's
 * state. Who may book, consent, cancel and mark a seat, and who is told,
 * stay in gig-sessions.ts, which calls down here when a seat is paid.
 *
 * THE GATEWAY HOLDS THE EXPERT'S SHARE. Every new seat's order carries a
 * transfer of the net (gross − commission − GST on the commission) to the
 * expert's Route linked account, on hold with no end date. At capture the
 * row freezes the three figures and takes the family's receipt number; it is
 * HELD once the transfer is known. When the session is delivered (or missed)
 * plus HOLD_HOURS, the hourly job takes the hold off — RELEASED, the gateway
 * settles the expert's bank on the next working day — and gathers the run's
 * released seats into one payout per expert with its invoice. A refund is
 * the gateway's refund of the whole gross with the transfer reversed; a
 * refunded seat carries no commission or GST. An expert may sell a seat
 * only while their linked account is ACTIVATED at the gateway with the bank
 * details saved here, so paid seats stay off — every session free — until
 * the operator turns them on, which needs Route working (`routeReadiness`).
 * Decision 0003 is untouched: a school's fees never come near any of this,
 * and tests/fees-invariants.test.ts says so.
 *
 * THE COMPANY-COLLECTS ROWS (the second amendment's path COMPANY: HELD → DUE
 * → PAID_OUT by the operator's recorded transfer) stay readable, and an OPEN
 * payout of theirs can still be recorded. Since 17 October 2026 (seats,
 * decision 0006) a TEACHER's priced guidance takes that path too: a teacher
 * has no linked account at the gateway, so the company collects the seat on a
 * plain order and the operator pays the teacher's UPI id (GigPayee) by hand,
 * with the invoice for the commission; an expert's seat is always ROUTE.
 *
 * ONE DOOR FOR A CAPTURE: `markCaptured`, used by the webhook, the checkout's
 * own confirm and the devbox page alike, so a payment settles once and the
 * rest are told "already". The amount is compared with the order the server
 * itself made; a mismatch is refused and audited.
 *
 * NUMBERS IN SERIES. Receipts (SGR/26-27/000001) and commission invoices
 * (SGC/26-27/000001), sixteen characters at most (TA-525), are numbered per financial year under a lock on the
 * GigSettings row, inside the transaction that writes the numbered row —
 * never reused, never a gap on a failed write (the certificates' rule).
 *
 * THE SEALED VALUES. The bank account number and the PAN are sealed by
 * secret-box under `gig:payee:<expertUserId>` (the PAN with `:pan`) and are
 * NEVER returned by any read: the views carry the last four of each. They
 * are opened only to be sent to the gateway when the linked account is made.
 *
 * THE KILL SWITCH. GigSettings.paymentsEnabled, read by every door here and
 * in gig-sessions.ts through `paymentsOn()`: off, and no price is stored, no
 * order is made, no hold is released. A refund still goes through, so
 * turning it off strands nobody's money.
 */
export const SESSION_PAYMENT_STATUSES = ["INITIATED", "PAID", "HELD", "RELEASED", "DUE", "PAID_OUT", "REFUNDED", "FAILED"] as const;
export type SessionPaymentStatus = (typeof SESSION_PAYMENT_STATUSES)[number];
export type PayoutStatus = "NONE" | "ACTIVE" | "SUSPENDED";

export const HOLD_HOURS = 48;
/** An unpaid seat is given back after this long (gig-sessions.ts expireUnpaidSeats). */
export const UNPAID_SEAT_EXPIRY_MS = 30 * 60_000;
const HOUR = 3_600_000;
const SETTINGS_ID = "gigs";
const ZONE = process.env.TZ || "Asia/Kolkata";

const UTR = /^[A-Za-z0-9]{12,22}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const BANK_ACCOUNT = /^\d{9,18}$/;
/** A personal PAN: five letters, the fourth P for a person, four digits, a check letter. */
const PAN = /^[A-Z]{3}P[A-Z]\d{4}[A-Z]$/;
const POSTAL_CODE = /^[1-9]\d{5}$/;
/** An Indian mobile, ten digits, as the gateway takes a linked account's phone. */
const MOBILE = /^[6-9]\d{9}$/;
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

/**
 * The operator turns paid seats on or off. On is refused until Route is
 * proven on the company's account (routeReadiness: a gateway, the webhook's
 * secret, the company's invoice details, one linked account activated); off
 * is always allowed — every session is free again, holds stay, refunds go.
 */
export async function setPaymentsEnabled(ctx: ActiveContext, on: boolean): Promise<GigResult<{ paymentsEnabled: boolean }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  await gigSettings();
  const before = await db.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: { paymentsEnabled: true } });
  if (on && !before.paymentsEnabled && !(await routeReadiness()).ready) return { ok: false, errorKey: "gigs.refuseRouteNotReady" };
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
 * tax invoice's reader makes. The prefix is one or two capital letters, so
 * every number fits sixteen characters (TA-525); the SAC is free text within
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
  if (!INVOICE_PREFIX.test(invoicePrefix)) return { ok: false, errorKey: "gigs.refuseInvoicePrefixFit" };
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

/*
 * TA-525, decision 0006 as amended by the owner on 14 November 2026: every number the company issues — the pass
 * invoice (P), the commission invoice (C) and the family's seat receipt (R, numbered by the same nextInSeries) — is
 * <prefix of one or two letters><series letter>/<the financial year as 26-27>/<six-digit serial>, e.g.
 * SGP/26-27/000001: sixteen characters at most, of letters, digits, hyphen and slash (rule 46(b) of the CGST Rules,
 * 2017). The six-digit serial is the assistant's choice; the accountant confirms the shape before the first live
 * invoice.
 */
/** The operator's prefix: one or two capital letters, so that a number fits sixteen characters at six digits of serial. */
export const INVOICE_PREFIX = /^[A-Z]{1,2}$/;
const INVOICE_NUMBER_MAX = 16;
const INVOICE_NUMBER_CHARS = /^[A-Z0-9/-]+$/;

/** A number that would break the shape (a prefix saved before the rule, a serial past 999,999) is never issued. */
export class InvoiceNumberRefused extends Error {
  constructor(readonly number: string) {
    // The message is the number alone: the class's name says why (over INVOICE_NUMBER_MAX, or a character outside the set).
    super(number);
    this.name = "InvoiceNumberRefused";
  }
}

/** The financial year's series of one kind: "SGP/26-27". */
export function invoiceSeriesOf(prefix: string, letter: "P" | "C" | "R", at: Date): string {
  return `${prefix}${letter}/${financialYearOf(at).slice(2)}`;
}

/** The number at a serial of a series, refused (InvoiceNumberRefused) unless it keeps the shape's two rules. */
export function invoiceNumberOf(series: string, serial: number): string {
  const number = `${series}/${String(serial).padStart(6, "0")}`;
  if (number.length > INVOICE_NUMBER_MAX || !INVOICE_NUMBER_CHARS.test(number)) throw new InvoiceNumberRefused(number);
  return number;
}

/* -------------------------------------------------------------------------- */
/* The expert's payee details and their linked account                         */
/* -------------------------------------------------------------------------- */

export type RouteView = {
  /** The gateway's activation status of the expert's Route product; NONE before the first link. */
  status: RouteStatus;
  /** What the gateway still asks for, as it last said. */
  requirements: RouteRequirement[];
  /** A linked account exists at the gateway. */
  linked: boolean;
  /** The bank details saved here differ from those the gateway holds: send them again. */
  needsResend: boolean;
  /** Everything a link needs is saved and KYC is verified. */
  readyToLink: boolean;
  /** Name, PAN and address are with the gateway and can no longer be changed here. */
  locked: boolean;
  checkedAt: string | null;
  error: string | null;
};
export type PayoutAccountView = {
  status: PayoutStatus;
  payeeName: string | null;
  upiId: string | null;
  /** The last four digits of the sealed account; the number itself is never returned. */
  bankLast4: string | null;
  ifsc: string | null;
  /** The last four of the sealed PAN. */
  panLast4: string | null;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  gstStateCode: string | null;
  gstin: string | null;
  note: string | null;
  kycVerified: boolean;
  transport: GigGatewayTransport;
  route: RouteView;
};

const PAYEE_SELECT = { status: true, payeeName: true, upiId: true, bankLast4: true, bankAccountEnc: true, ifsc: true, gstStateCode: true, gstin: true, note: true, panEnc: true, panLast4: true, addressLine: true, city: true, postalCode: true, phone: true, linkedAccountId: true, stakeholderId: true, routeProductId: true, routeStatus: true, routeRequirements: true, routeSubmittedKey: true, routeCheckedAt: true, routeError: true } as const;
type PayeeRow = { status: string; payeeName: string | null; upiId: string | null; bankLast4: string | null; bankAccountEnc: string | null; ifsc: string | null; gstStateCode: string | null; gstin: string | null; note: string | null; panEnc: string | null; panLast4: string | null; addressLine: string | null; city: string | null; postalCode: string | null; phone: string | null; linkedAccountId: string | null; stakeholderId: string | null; routeProductId: string | null; routeStatus: string; routeRequirements: string; routeSubmittedKey: string | null; routeCheckedAt: Date | null; routeError: string | null };

/** The company-collects test of a payee (the second amendment): a name, a state, and a UPI id or a bank account. Kept for recording an OPEN payout of that path. */
const payeeComplete = (row: Pick<PayeeRow, "payeeName" | "gstStateCode" | "upiId" | "bankAccountEnc" | "ifsc"> | null): boolean => Boolean(row?.payeeName && row.gstStateCode && (row.upiId || (row.bankAccountEnc && row.ifsc)));
/** What a linked account is made from: the name (at least four letters, as the gateway asks), the bank, the PAN, the address and a phone. */
const linkComplete = (row: PayeeRow | null): boolean => Boolean(row && row.payeeName && row.payeeName.length >= 4 && row.bankAccountEnc && row.ifsc && row.panEnc && row.addressLine && row.city && row.postalCode && row.phone && row.gstStateCode);
/** A digest of the bank details sent to the gateway: the sealed number's last four, the IFSC and the name, never the number. */
const bankKeyOf = (row: Pick<PayeeRow, "bankAccountEnc" | "ifsc" | "payeeName">): string | null => (row.bankAccountEnc && row.ifsc && row.payeeName ? createHash("sha256").update(`${row.bankAccountEnc}|${row.ifsc}|${row.payeeName}`).digest("hex").slice(0, 32) : null);
const asRouteStatus = (raw: string): RouteStatus => ((ROUTE_STATUSES as readonly string[]).includes(raw) ? (raw as RouteStatus) : "NONE");

function routeViewOf(row: PayeeRow | null, kycVerified: boolean): RouteView {
  const status = row ? asRouteStatus(row.routeStatus) : "NONE";
  const needsResend = Boolean(row?.routeProductId && row.routeSubmittedKey && row.routeSubmittedKey !== bankKeyOf(row));
  return { status, requirements: row ? readJson<RouteRequirement[]>(row.routeRequirements, []) : [], linked: Boolean(row?.linkedAccountId), needsResend, readyToLink: linkComplete(row) && kycVerified, locked: Boolean(row?.linkedAccountId), checkedAt: row?.routeCheckedAt?.toISOString() ?? null, error: row?.routeError ?? null };
}

/**
 * Where the expert is paid, as it stands: SUSPENDED by the operator stays
 * so; otherwise ACTIVE exactly when the papers are VERIFIED today
 * (expert-kyc.ts is the one truth), the gateway has ACTIVATED the Route
 * product and holds the bank details saved here; NONE until then. Read fresh
 * each time, so a KYC verified after the link makes the account active
 * without another step.
 */
export async function payoutAccountOf(expertUserId: string): Promise<PayoutAccountView> {
  const [row, profile] = await Promise.all([db.expertPayoutAccount.findUnique({ where: { expertUserId }, select: PAYEE_SELECT }), db.expertProfile.findUnique({ where: { userId: expertUserId }, select: { kycStatus: true } })]);
  const kycVerified = profile?.kycStatus === "VERIFIED";
  const route = routeViewOf(row, kycVerified);
  const status: PayoutStatus = row?.status === "SUSPENDED" ? "SUSPENDED" : kycVerified && route.status === "ACTIVATED" && route.linked && !route.needsResend ? "ACTIVE" : "NONE";
  return { status, payeeName: row?.payeeName ?? null, upiId: row?.upiId ?? null, bankLast4: row?.bankLast4 ?? null, ifsc: row?.ifsc ?? null, panLast4: row?.panLast4 ?? null, addressLine: row?.addressLine ?? null, city: row?.city ?? null, postalCode: row?.postalCode ?? null, phone: row?.phone ?? null, gstStateCode: row?.gstStateCode ?? null, gstin: row?.gstin ?? null, note: row?.note ?? null, kycVerified, transport: transport(), route };
}

export type PayeeInput = { payeeName: string; bankAccount?: string | null; ifsc?: string | null; pan?: string | null; addressLine: string; city: string; postalCode: string; phone: string; gstStateCode: string; gstin?: string | null };

/**
 * The expert types what their linked account is made from: the name on
 * their PAN and bank, the bank account with its IFSC (sealed, its last four
 * kept), the PAN (sealed the same way), an address, a mobile number, the GST
 * state they are in and a GSTIN if they have one. A blank bank account or
 * PAN keeps the one already saved. Saving does not need KYC — the details
 * can be typed first — but the link waits for it. Once the linked account
 * exists, the name, PAN and address are the gateway's and are refused here
 * (the operator asks the gateway); a new bank account is allowed and must be
 * sent again before a seat can be sold. A suspension is the operator's to
 * lift; a save under one changes the details and not the standing.
 */
export async function savePayee(ctx: ActiveContext, input: PayeeInput): Promise<GigResult<{ payout: PayoutAccountView }>> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const profile = await db.expertProfile.findUnique({ where: { userId: ctx.user.id }, select: { id: true } });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");
  const current = await db.expertPayoutAccount.findUnique({ where: { expertUserId: ctx.user.id }, select: PAYEE_SELECT });
  const payeeName = input.payeeName.trim().replace(/\s+/g, " ");
  const bankAccount = input.bankAccount?.replace(/\s+/g, "") || null;
  const ifsc = input.ifsc?.trim().toUpperCase() || null;
  const pan = input.pan?.replace(/\s+/g, "").toUpperCase() || null;
  const addressLine = input.addressLine.trim().replace(/\s+/g, " ");
  const city = input.city.trim().replace(/\s+/g, " ");
  const postalCode = input.postalCode.trim();
  const phone = input.phone.replace(/[\s-]+/g, "").replace(/^(\+91|0)/, "");
  const gstStateCode = input.gstStateCode.trim();
  const gstin = input.gstin?.trim().toUpperCase() || null;
  if (payeeName.length < 4 || payeeName.length > 80) return { ok: false, errorKey: "gigs.refusePayeeName" };
  if (!bankAccount && !current?.bankAccountEnc) return { ok: false, errorKey: "gigs.refuseBankAccount" };
  if (bankAccount && !BANK_ACCOUNT.test(bankAccount)) return { ok: false, errorKey: "gigs.refuseBankAccount" };
  if (bankAccount && (!ifsc || !IFSC.test(ifsc))) return { ok: false, errorKey: "gigs.refuseIfsc" };
  if (!bankAccount && ifsc && !IFSC.test(ifsc)) return { ok: false, errorKey: "gigs.refuseIfsc" };
  if (!pan && !current?.panEnc) return { ok: false, errorKey: "gigs.refusePan" };
  if (pan && !PAN.test(pan)) return { ok: false, errorKey: "gigs.refusePan" };
  if (addressLine.length < 4 || addressLine.length > 100) return { ok: false, errorKey: "gigs.refuseAddress" };
  if (city.length < 2 || city.length > 60) return { ok: false, errorKey: "gigs.refuseCity" };
  if (!POSTAL_CODE.test(postalCode)) return { ok: false, errorKey: "gigs.refusePostalCode" };
  if (!MOBILE.test(phone)) return { ok: false, errorKey: "gigs.refuseMobile" };
  if (!GST_STATE_CODE.test(gstStateCode) || !stateNameOf(gstStateCode)) return { ok: false, errorKey: "gigs.refuseStateCode" };
  if (gstin && !GSTIN.test(gstin)) return { ok: false, errorKey: "gigs.refuseGstin" };
  if (gstin && gstin.slice(0, 2) !== gstStateCode) return { ok: false, errorKey: "gigs.refuseGstinState" };
  if ((bankAccount || pan) && !sealingAvailable()) return { ok: false, errorKey: "gigs.refuseSealingOff" };
  // What the gateway already holds for the linked account is not changed from here.
  if (current?.linkedAccountId) {
    const panChanged = Boolean(pan && current.panEnc && openPan({ kind: "EXPERT", userId: ctx.user.id }, "PAYEE", current.panEnc) !== pan);
    if (payeeName !== current.payeeName || panChanged || addressLine !== current.addressLine || city !== current.city || postalCode !== current.postalCode || gstStateCode !== current.gstStateCode) return { ok: false, errorKey: "gigs.refuseRouteLocked" };
  }
  const bank = bankAccount ? { bankAccountEnc: seal(bankAccount, `gig:payee:${ctx.user.id}`), bankLast4: bankAccount.slice(-4), ifsc } : ifsc ? { ifsc } : {};
  const data = { payeeName, ...bank, addressLine, city, postalCode, phone, gstStateCode, gstin };
  const status = current?.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
  await db.expertPayoutAccount.upsert({ where: { expertUserId: ctx.user.id }, create: { expertUserId: ctx.user.id, ...data, status }, update: { ...data, status } });
  // The one writer of a PAN (G4-14).
  if (pan) await writePan({ kind: "EXPERT", userId: ctx.user.id }, pan);
  // Neither the account number, the PAN nor the phone goes to the log: it is read by more people than the payer.
  await audit({ actorUserId: ctx.user.id, action: "gig.payee.save", targetType: "ExpertPayoutAccount", targetId: ctx.user.id, meta: { bank: Boolean(bankAccount), pan: Boolean(pan), gstStateCode, gstin: Boolean(gstin) } });
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

export type LinkOutcome = "activated" | "pending" | "needs-clarification" | "refused";

/**
 * Makes, resumes or brings up to date the expert's linked account: the four
 * gateway steps, each skipped when its id is already stored, then the bank
 * details sent again when they changed, or the status fetched when nothing
 * did. Refused by name before a call when KYC is not verified, a detail is
 * missing or the gateway is off; a gateway refusal is stored on the row for
 * the expert and the operator to read, and the next press resumes from the
 * step that failed. The sealed values are opened here only, to be sent.
 */
export async function linkExpert(expertUserId: string, actorUserId: string | null, now: Date = new Date()): Promise<GigResult<{ outcome: LinkOutcome; payout: PayoutAccountView }>> {
  if (transport() === "off") return { ok: false, errorKey: "gigs.refuseGatewayOff" };
  const [row, user, profile] = await Promise.all([db.expertPayoutAccount.findUnique({ where: { expertUserId }, select: PAYEE_SELECT }), db.user.findUnique({ where: { id: expertUserId }, select: { email: true } }), db.expertProfile.findUnique({ where: { userId: expertUserId }, select: { kycStatus: true } })]);
  if (profile?.kycStatus !== "VERIFIED") return { ok: false, errorKey: "gigs.refuseNeedKyc" };
  if (!row || !linkComplete(row)) return { ok: false, errorKey: "gigs.refuseLinkDetails" };
  if (!user?.email) return { ok: false, errorKey: "gigs.refuseLinkEmail" };
  if (row.status === "SUSPENDED") return { ok: false, errorKey: "gigs.refusePayeeSuspended" };
  const step = async <T>(name: string, run: () => Promise<T>): Promise<T> => {
    try {
      return await run();
    } catch (error) {
      const message = (error instanceof GigGatewayError ? error.message : "gateway error").slice(0, 300);
      await db.expertPayoutAccount.update({ where: { expertUserId }, data: { routeError: message, routeCheckedAt: now } });
      await audit({ actorUserId, action: "gig.route.refused", targetType: "ExpertPayoutAccount", targetId: expertUserId, meta: { step: name, error: message } });
      throw new LinkRefused(message);
    }
  };
  try {
    let accountId = row.linkedAccountId;
    if (!accountId) {
      const made = await step("account", () => createLinkedAccount({ reference: `shalaghar-expert-${expertUserId}`, email: user.email!, phone: row.phone!, name: row.payeeName!, addressLine: row.addressLine!, city: row.city!, postalCode: row.postalCode!, gstStateCode: row.gstStateCode! }));
      accountId = made.accountId;
      await db.expertPayoutAccount.update({ where: { expertUserId }, data: { linkedAccountId: accountId, routeStatus: "REQUESTED", routeError: null } });
      await audit({ actorUserId, action: "gig.route.account", targetType: "ExpertPayoutAccount", targetId: expertUserId, meta: { linkedAccountId: accountId } });
    }
    if (!row.stakeholderId) {
      const pan = openPan({ kind: "EXPERT", userId: expertUserId }, "PAYEE", row.panEnc)!;
      const made = await step("stakeholder", () => createStakeholder(accountId!, { name: row.payeeName!, email: user.email!, pan }));
      await db.expertPayoutAccount.update({ where: { expertUserId }, data: { stakeholderId: made.stakeholderId, routeError: null } });
    }
    let productId = row.routeProductId;
    let product: RouteProduct | null = null;
    if (!productId) {
      product = await step("product", () => requestRouteProduct(accountId!));
      productId = product.productId;
      await db.expertPayoutAccount.update({ where: { expertUserId }, data: { routeProductId: productId, routeStatus: product.status, routeRequirements: JSON.stringify(product.requirements), routeError: null } });
    }
    const key = bankKeyOf(row);
    if (row.routeSubmittedKey !== key) {
      const accountNumber = open(row.bankAccountEnc!, `gig:payee:${expertUserId}`);
      product = await step("bank", () => setRouteBank(accountId!, productId!, { accountNumber, ifsc: row.ifsc!, beneficiaryName: row.payeeName! }));
      await db.expertPayoutAccount.update({ where: { expertUserId }, data: { routeSubmittedKey: key } });
    } else {
      product = await step("status", () => fetchRouteProduct(accountId!, productId!));
    }
    const before = asRouteStatus(row.routeStatus);
    await db.expertPayoutAccount.update({ where: { expertUserId }, data: { routeStatus: product.status, routeRequirements: JSON.stringify(product.requirements), routeCheckedAt: now, routeError: null } });
    if (product.status !== before) await audit({ actorUserId, action: "gig.route.status", targetType: "ExpertPayoutAccount", targetId: expertUserId, meta: { from: before, to: product.status, requirements: product.requirements.length } });
    if (product.status === "ACTIVATED" && before !== "ACTIVATED") {
      await forUser(expertUserId, () => notify({ userId: expertUserId, schoolId: null, kind: "EXPERT", titleKey: "gigs.notifRouteActive", url: "/expert/profile" })).catch((error) => console.error("[gig-payments] route notice failed", error));
    }
    const outcome: LinkOutcome = product.status === "ACTIVATED" ? "activated" : product.status === "NEEDS_CLARIFICATION" ? "needs-clarification" : "pending";
    return { ok: true, outcome, payout: await payoutAccountOf(expertUserId) };
  } catch (error) {
    if (error instanceof LinkRefused) return { ok: false, errorKey: "gigs.refuseRouteGateway", vars: { reason: error.message } };
    throw error;
  }
}

class LinkRefused extends Error {}

/** The expert presses "Link with Razorpay" (or "Check again", or "Send the new bank details"). */
export async function linkMyAccount(ctx: ActiveContext, now: Date = new Date()): Promise<GigResult<{ outcome: LinkOutcome; payout: PayoutAccountView }>> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  return linkExpert(ctx.user.id, ctx.user.id, now);
}

export type LinkAllRun = { tried: number; activated: number; pending: number; refused: number };

/**
 * The operator links every expert who is ready and not yet activated, and
 * asks after every review still open; the job does the second half hourly.
 * Each expert is one linkExpert, so one refusal does not stop the rest.
 */
export async function linkReadyExperts(actorUserId: string | null, now: Date = new Date(), only: "ALL" | "PENDING" = "ALL"): Promise<LinkAllRun> {
  const run: LinkAllRun = { tried: 0, activated: 0, pending: 0, refused: 0 };
  if (transport() === "off") return run;
  const rows = await db.expertPayoutAccount.findMany({ where: { status: { not: "SUSPENDED" }, ...(only === "PENDING" ? { linkedAccountId: { not: null }, routeStatus: { in: ["REQUESTED", "UNDER_REVIEW", "NEEDS_CLARIFICATION"] } } : { NOT: { routeStatus: "ACTIVATED", routeSubmittedKey: { not: null } } }) }, select: { expertUserId: true, ...PAYEE_SELECT }, take: 200 });
  for (const r of rows) {
    if (only === "ALL" && r.routeStatus === "ACTIVATED" && r.routeSubmittedKey === bankKeyOf(r)) continue;
    if (!linkComplete(r)) continue;
    run.tried += 1;
    const result = await linkExpert(r.expertUserId, actorUserId, now);
    if (!result.ok) run.refused += 1;
    else if (result.outcome === "activated") run.activated += 1;
    else run.pending += 1;
  }
  return run;
}

/** The operator's bulk button. */
export async function linkAllExperts(ctx: ActiveContext, now: Date = new Date()): Promise<GigResult<{ run: LinkAllRun }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  if (transport() === "off") return { ok: false, errorKey: "gigs.refuseGatewayOff" };
  const run = await linkReadyExperts(ctx.user.id, now);
  await audit({ actorUserId: ctx.user.id, action: "gig.route.linkAll", targetType: "GigSettings", targetId: SETTINGS_ID, meta: run });
  return { ok: true, run };
}

export type RouteReadiness = {
  /** A gateway key on this server (devbox counts, on a laptop). */
  gatewaySet: boolean;
  /** The sessions webhook's secret. */
  webhookSet: boolean;
  /** The company's legal name, GSTIN and state, without which no invoice can be issued at release. */
  companySet: boolean;
  /** Experts whose linked account the gateway has activated — at least one proves Route works on the company's account. */
  activated: number;
  /** Linked and under the gateway's review. */
  inReview: number;
  /** The gateway asks something more of them. */
  needsAttention: number;
  /** Ready to link and not yet linked. */
  readyToLink: number;
  /** Every condition met: the switch may be turned on. */
  ready: boolean;
};

/**
 * Whether paid seats can be turned on: a gateway, the webhook's secret, the
 * company's invoice details, and at least one linked account the gateway
 * has activated — which only happens on an account Razorpay has approved
 * for Route, so it is the proof no other call gives.
 */
export async function routeReadiness(): Promise<RouteReadiness> {
  const mode = transport();
  const [company, rows, kycVerified] = await Promise.all([companyDetails(), db.expertPayoutAccount.findMany({ where: { status: { not: "SUSPENDED" } }, select: { expertUserId: true, ...PAYEE_SELECT }, take: 2000 }), db.expertProfile.findMany({ where: { kycStatus: "VERIFIED" }, select: { userId: true }, take: 5000 })]);
  const verified = new Set(kycVerified.map((p) => p.userId));
  let activated = 0;
  let inReview = 0;
  let needsAttention = 0;
  let readyToLink = 0;
  for (const r of rows) {
    const status = asRouteStatus(r.routeStatus);
    if (status === "ACTIVATED" && r.linkedAccountId) activated += 1;
    else if (status === "NEEDS_CLARIFICATION" || r.routeError) needsAttention += 1;
    else if (r.linkedAccountId) inReview += 1;
    else if (linkComplete(r) && verified.has(r.expertUserId)) readyToLink += 1;
  }
  const gatewaySet = mode !== "off";
  const webhookSet = Boolean(webhookSecret());
  const companySet = company.missing.length === 0;
  return { gatewaySet, webhookSet, companySet, activated, inReview, needsAttention, readyToLink, ready: gatewaySet && webhookSet && companySet && activated > 0 };
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

type PaymentRow = { id: string; bookingId: string; slotId: string; payerUserId: string; expertUserId: string; amountPaise: number; commissionPaise: number; gstPaise: number; netPaise: number; receiptNumber: string | null; orderId: string; paymentId: string | null; refundId: string | null; status: string; path: string; transferId: string | null; paidAt: Date | null; holdUntil: Date | null; dueAt: Date | null; releasedAt: Date | null; paidOutAt: Date | null; refundedAt: Date | null; pendingAction: string | null; attempts: number; lastError: string | null; payoutId: string | null; reason: string | null; createdAt: Date };
const PAYMENT_SELECT = { id: true, bookingId: true, slotId: true, payerUserId: true, expertUserId: true, amountPaise: true, commissionPaise: true, gstPaise: true, netPaise: true, receiptNumber: true, orderId: true, paymentId: true, refundId: true, status: true, path: true, transferId: true, paidAt: true, holdUntil: true, dueAt: true, releasedAt: true, paidOutAt: true, refundedAt: true, pendingAction: true, attempts: true, lastError: true, payoutId: true, reason: true, createdAt: true } as const;

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
export function figuresOf(amountPaise: number, s: { commissionPercent: number; gstPercent: number }): { commissionPaise: number; gstPaise: number; netPaise: number } {
  const commissionPaise = commissionOf(amountPaise, s.commissionPercent);
  const gstPaise = gstOf(commissionPaise, s.gstPercent);
  return { commissionPaise, gstPaise, netPaise: amountPaise - commissionPaise - gstPaise };
}

/**
 * An order for one seat, made once per booking, carrying the transfer of the
 * net to the expert's linked account on hold: a payment still INITIATED is
 * handed back as it stands (the panel was closed and reopened); a FAILED one
 * is tried again on its own order (TA-188), a fresh one made only when it has
 * none. Refused with the reason when
 * payments are off, the expert's linked account is not active, or the
 * gateway is down — the seat stays PENDING_PAYMENT for another try until it
 * expires. A teacher's seat (seats, 17 Oct 2026) is a plain order on the
 * company's account with no transfer — the company-collects path — refused
 * while the teacher has saved no UPI id for the company to pay.
 */
export async function openCheckout(input: { bookingId: string; slotId: string; schoolId: string; payerUserId: string; expertUserId: string; amountPaise: number; title: string; pupilName: string; payerName: string; payerEmail: string | null }): Promise<GigResult<{ checkout: SeatCheckout }>> {
  const about = { title: input.title, pupilName: input.pupilName, payerName: input.payerName, payerEmail: input.payerEmail };
  const existing = await db.sessionPayment.findUnique({ where: { bookingId: input.bookingId }, select: PAYMENT_SELECT });
  // An order whose id is still the placeholder is being made, or its making died: never handed out as a checkout (TA-241).
  if (existing && existing.status === "INITIATED") return existing.orderId.startsWith("pending_") ? { ok: false, errorKey: "gigs.refuseGatewayDown" } : { ok: true, checkout: checkoutOf(existing, about) };
  if (existing && existing.status !== "FAILED") return { ok: false, errorKey: "gigs.refuseAlreadyPaid" };
  if (!(await paymentsOn())) return { ok: false, errorKey: "gigs.refusePaymentsOff" };
  const provider = await db.gigSlot.findUnique({ where: { id: input.slotId }, select: { providerKind: true } });
  const path: "ROUTE" | "COMPANY" = provider?.providerKind === "TEACHER" ? "COMPANY" : "ROUTE";
  let linkedAccountId: string | null = null;
  if (path === "COMPANY") {
    if (!(await db.gigPayee.findUnique({ where: { userId: input.expertUserId }, select: { upiId: true } }))?.upiId) return { ok: false, errorKey: "gigs.refuseExpertNoPayout" };
  } else {
    const payout = await payoutAccountOf(input.expertUserId);
    const linked = await db.expertPayoutAccount.findUnique({ where: { expertUserId: input.expertUserId }, select: { linkedAccountId: true } });
    if (payout.status !== "ACTIVE" || !linked?.linkedAccountId) return { ok: false, errorKey: "gigs.refuseExpertNoPayout" };
    linkedAccountId = linked.linkedAccountId;
  }
  const settings = await paymentSettings();
  const figures = figuresOf(input.amountPaise, settings);
  if (figures.netPaise < 1) return { ok: false, errorKey: "gigs.refusePrice" };
  // A FAILED row is claimed from FAILED alone, so a capture that landed since it was read is never written over (TA-241).
  const reopen = { status: "INITIATED", payerUserId: input.payerUserId, reason: null, lastError: null, pendingAction: null, attempts: (existing?.attempts ?? 0) + 1 };
  // TA-188: a failed attempt is tried again ON THE SAME ORDER while the order still says what is owed (the gateway takes
  // another attempt on an order until it is paid), so a late capture of the first attempt still finds this row; a fresh
  // order only when there is none yet or the price or the path moved.
  if (existing && !existing.orderId.startsWith("pending_") && existing.amountPaise === input.amountPaise && existing.path === path) {
    const reopened = await db.sessionPayment.updateMany({ where: { id: existing.id, status: "FAILED" }, data: reopen });
    if (reopened.count === 0) return { ok: false, errorKey: "gigs.refuseAlreadyPaid" };
    const again = await db.sessionPayment.findUniqueOrThrow({ where: { id: existing.id }, select: PAYMENT_SELECT });
    await forSchool(input.schoolId, () => audit({ schoolId: input.schoolId, actorUserId: input.payerUserId, action: "gig.payment.start", targetType: "SessionPayment", targetId: again.id, meta: { bookingId: input.bookingId, amountPaise: again.amountPaise, commissionPaise: again.commissionPaise, gstPaise: again.gstPaise, netPaise: again.netPaise, orderId: again.orderId, again: true } }));
    return { ok: true, checkout: checkoutOf(again, about) };
  }
  // The row first, so the order's receipt carries our id; the order id is written once the gateway answers.
  let row: PaymentRow;
  if (existing) {
    const reopened = await db.sessionPayment.updateMany({ where: { id: existing.id, status: "FAILED" }, data: { ...reopen, path, transferId: null, amountPaise: input.amountPaise, ...figures } });
    if (reopened.count === 0) return { ok: false, errorKey: "gigs.refuseAlreadyPaid" };
    row = await db.sessionPayment.findUniqueOrThrow({ where: { id: existing.id }, select: PAYMENT_SELECT });
  } else {
    row = await db.sessionPayment.create({ data: { bookingId: input.bookingId, slotId: input.slotId, payerUserId: input.payerUserId, expertUserId: input.expertUserId, amountPaise: input.amountPaise, ...figures, path, orderId: `pending_${input.bookingId}`, status: "INITIATED" }, select: PAYMENT_SELECT });
  }
  let orderId: string;
  try {
    const notes = { shalaghar_session_payment: row.id, seat: input.title.slice(0, 60) };
    // ROUTE: the net is what the gateway holds for the expert; the commission and its GST stay with the company.
    // COMPANY (a teacher's seat): the whole price to the company's account, the teacher paid by hand after the hold.
    const order = linkedAccountId ? await createSeatOrder({ amountPaise: input.amountPaise, expertSharePaise: figures.netPaise, linkedAccountId, receipt: row.id, notes }) : await createCompanyOrder({ amountPaise: input.amountPaise, receipt: row.id, notes });
    orderId = order.orderId;
  } catch (error) {
    const reason = error instanceof GigGatewayError ? error.message : "gateway error";
    await db.sessionPayment.updateMany({ where: { id: row.id, status: "INITIATED" }, data: { status: "FAILED", reason } });
    return { ok: false, errorKey: "gigs.refuseGatewayDown" };
  }
  // Still INITIATED: a capture of the order this row held before has not landed meanwhile (TA-241).
  const written = await db.sessionPayment.updateMany({ where: { id: row.id, status: "INITIATED" }, data: { orderId } });
  if (written.count === 0) return { ok: false, errorKey: "gigs.refuseAlreadyPaid" };
  const made = await db.sessionPayment.findUniqueOrThrow({ where: { id: row.id }, select: PAYMENT_SELECT });
  await forSchool(input.schoolId, () => audit({ schoolId: input.schoolId, actorUserId: input.payerUserId, action: "gig.payment.start", targetType: "SessionPayment", targetId: made.id, meta: { bookingId: input.bookingId, amountPaise: input.amountPaise, ...figures, orderId } }));
  return { ok: true, checkout: checkoutOf(made, about) };
}

/** "given-back": the money arrived for a seat already given back (expired unpaid, cancelled); it is refunded, never confirmed (TA-184). */
export type CaptureOutcome = "settled" | "already" | "unknown-order" | "amount-mismatch" | "not-settleable" | "given-back";

type PaymentBooking = { id: string; schoolId: string; studentMembershipId: string; slotId: string; providerUserId: string; status: string };

/**
 * The booking a payment is for (TA-183). SessionPayment carries no school, and GigBooking is readable only by its own
 * school or by its provider, so the sessions webhook, the job and the operator — none of them with the pupil's school
 * bound — read it as its provider: the payment's expert IS the booking's provider (openCheckout writes one from the
 * other), so the read opens exactly that one row and no school. Never a nested read through the payment.
 */
function bookingOfPayment(p: { bookingId: string; expertUserId: string }): Promise<PaymentBooking | null> {
  return forUser(p.expertUserId, () => db.gigBooking.findFirst({ where: { id: p.bookingId, providerUserId: p.expertUserId }, select: { id: true, schoolId: true, studentMembershipId: true, slotId: true, providerUserId: true, status: true } }));
}

/**
 * The next number in a receipt or invoice series, under a lock on the settings row that the caller's transaction then
 * holds to its end; refused (InvoiceNumberRefused, the transaction rolled back) over sixteen characters or outside
 * letters, digits, hyphen and slash (TA-525).
 */
async function nextInSeries(tx: typeof db, kind: "RECEIPT" | "INVOICE", series: string): Promise<{ serial: number; number: string }> {
  await tx.$queryRaw`SELECT "id" FROM "GigSettings" WHERE "id" = ${SETTINGS_ID} FOR UPDATE`;
  const last =
    kind === "INVOICE"
      ? (await tx.gigInvoice.findFirst({ where: { series }, orderBy: { serial: "desc" }, select: { serial: true } }))?.serial
      : (await tx.sessionPayment.findFirst({ where: { receiptNumber: { startsWith: `${series}/` } }, orderBy: { receiptSerial: "desc" }, select: { receiptSerial: true } }))?.receiptSerial;
  const serial = (last ?? 0) + 1;
  return { serial, number: invoiceNumberOf(series, serial) };
}

/**
 * THE ONE DOOR A CAPTURE COMES THROUGH. INITIATED (or FAILED: a signed
 * capture after a failed attempt on the same order is the retry going
 * through) → PAID with the family's receipt number taken, the booking
 * PENDING_PAYMENT → CONFIRMED, all in one transaction under the school's
 * binding; then the row is HELD once the gateway's transfer is known. The
 * three figures stay those the order was made with, since the transfer in
 * the order already carries the net. Who is told is gig-sessions.ts's
 * (settleSeatPayment), which wraps this.
 */
export async function markCaptured(input: { orderId: string; gatewayPaymentId: string; amountPaise: number }, now: Date = new Date()): Promise<{ outcome: CaptureOutcome; payment: PaymentRow | null; booking: { id: string; schoolId: string; studentMembershipId: string; slotId: string; providerUserId: string } | null; refund?: RefundOutcome }> {
  const p = await db.sessionPayment.findUnique({ where: { orderId: input.orderId }, select: PAYMENT_SELECT });
  if (!p) return { outcome: "unknown-order", payment: null, booking: null };
  const found = await bookingOfPayment(p);
  if (!found) return { outcome: "not-settleable", payment: p, booking: null };
  const booking = { id: found.id, schoolId: found.schoolId, studentMembershipId: found.studentMembershipId, slotId: found.slotId, providerUserId: found.providerUserId };
  if (p.status === "PAID" || p.status === "HELD" || p.status === "RELEASED" || p.status === "DUE" || p.status === "PAID_OUT" || p.status === "REFUNDED") return { outcome: "already", payment: p, booking };
  if (p.status !== "INITIATED" && p.status !== "FAILED") return { outcome: "not-settleable", payment: p, booking };
  if (p.amountPaise !== input.amountPaise) {
    await forSchool(booking.schoolId, () => audit({ schoolId: booking.schoolId, action: "gig.payment.mismatch", targetType: "SessionPayment", targetId: p.id, meta: { expected: p.amountPaise, got: input.amountPaise, gatewayPaymentId: input.gatewayPaymentId } }));
    return { outcome: "amount-mismatch", payment: p, booking };
  }
  const settings = await db.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: { commissionPercent: true, gstPercent: true, invoicePrefix: true } });
  // A ROUTE order already carries the net in its transfer: the figures it was made with stand.
  const figures = p.path === "ROUTE" ? { commissionPaise: p.commissionPaise, gstPaise: p.gstPaise, netPaise: p.netPaise } : figuresOf(p.amountPaise, settings);
  const series = invoiceSeriesOf(settings.invoicePrefix, "R", now);
  const settled = await forSchool(booking.schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const receipt = await nextInSeries(tx, "RECEIPT", series);
      const claimed = await tx.sessionPayment.updateMany({ where: { id: p.id, status: { in: ["INITIATED", "FAILED"] } }, data: { status: "PAID", paymentId: input.gatewayPaymentId, paidAt: now, ...figures, receiptNumber: receipt.number, receiptSerial: receipt.serial, reason: null, lastError: null } });
      if (claimed.count === 0) return null;
      // A seat the family gave up, or that expired, before the money arrived is still paid for: the row is
      // PAID, the booking is left as it stands, and the money goes back below (TA-184).
      const confirmed = await tx.gigBooking.updateMany({ where: { id: booking.id, schoolId: booking.schoolId, status: "PENDING_PAYMENT" }, data: { status: "CONFIRMED", consentAt: now, consentUserId: p.payerUserId } });
      return { ...receipt, confirmed: confirmed.count > 0 };
    }),
  );
  if (!settled) return { outcome: "already", payment: p, booking };
  await forSchool(booking.schoolId, () => audit({ schoolId: booking.schoolId, actorUserId: p.payerUserId, action: "gig.payment.paid", targetType: "SessionPayment", targetId: p.id, meta: { bookingId: booking.id, amountPaise: p.amountPaise, ...figures, receiptNumber: settled.number, gatewayPaymentId: input.gatewayPaymentId } }));
  if (!settled.confirmed) {
    // TA-184: the seat was given back (expired unpaid, cancelled) before the money came; nothing is confirmed and
    // nobody is told it is, the whole price is refunded now — or waits as a refund for the job and the operator.
    const refund = await refundSeatPayment(booking.id, "paid after the seat was given back", null, now);
    const after = (await db.sessionPayment.findUnique({ where: { id: p.id }, select: PAYMENT_SELECT })) ?? p;
    return { outcome: "given-back", payment: after, booking, refund };
  }
  await holdPayment(p.id);
  const after = (await db.sessionPayment.findUnique({ where: { id: p.id }, select: PAYMENT_SELECT })) ?? p;
  return { outcome: "settled", payment: after, booking };
}

/**
 * A PAID row is HELD for the expert: the net waits for the session to be
 * delivered. A ROUTE row is held once the gateway's transfer to the linked
 * account is known — read from the payment's transfers when the webhook has
 * not named it; until the gateway has made it, the row stays PAID and the
 * job asks again. A transfer that failed is waiting (pendingAction TRANSFER)
 * for the operator's retry, which makes it again from the payment.
 */
export async function holdPayment(paymentRowId: string): Promise<boolean> {
  const p = await db.sessionPayment.findUnique({ where: { id: paymentRowId }, select: PAYMENT_SELECT });
  if (!p || p.status !== "PAID") return false;
  let transferId = p.transferId;
  if (p.path === "ROUTE" && !transferId) {
    if (!p.paymentId) return false;
    const linked = await db.expertPayoutAccount.findUnique({ where: { expertUserId: p.expertUserId }, select: { linkedAccountId: true } });
    try {
      const transfers = await transfersOf(p.paymentId, { linkedAccountId: linked?.linkedAccountId ?? "", amountPaise: p.netPaise });
      const t = transfers.find((x) => x.status !== "failed" && x.status !== "reversed");
      if (!t) return false;
      transferId = t.transferId;
    } catch (error) {
      await db.sessionPayment.update({ where: { id: p.id }, data: { lastError: (error instanceof Error ? error.message : "gateway error").slice(0, 300) } });
      return false;
    }
  }
  const changed = await db.sessionPayment.updateMany({ where: { id: p.id, status: "PAID" }, data: { status: "HELD", transferId, lastError: null, ...(p.pendingAction === "TRANSFER" ? { pendingAction: null } : {}) } });
  if (changed.count === 0) return false;
  await audit({ actorUserId: null, action: "gig.payment.held", targetType: "SessionPayment", targetId: p.id, meta: { netPaise: p.netPaise, transferId } });
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
  // The payer alone: a guardian, or a pupil of eighteen or more who bought their own seat (seats, 17 Oct 2026).
  if (ctx.role !== "PARENT" && ctx.role !== "STUDENT") throw new AccessError("access.wrongRoleForThisAction");
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
 * the gateway with the held transfer reversed (ROUTE), or from the company's
 * balance (COMPANY); one still INITIATED is voided (no money moved); one
 * already RELEASED, DUE or PAID_OUT is the expert's and past refunding here. A gateway that cannot be reached leaves the row with
 * pendingAction REFUND, which releaseDue and the operator's retry take up.
 * No commission or GST stands on a refunded seat: the figures are zeroed
 * with the net, so no statement counts them.
 *
 * EVERY WRITE IS A CLAIM ON THE STATUS IT READ (TA-241): the void only from
 * INITIATED, so a capture landing meanwhile is read again and refunded rather
 * than written over; the refund claims the row REFUNDED before the gateway is
 * asked, so the job's retry and the operator's never refund twice, and a
 * refusal puts the row back as it was, waiting. A refusal whose refund the
 * gateway in fact made (the answer lost) is read back from the payment and
 * recorded as made (TA-258).
 */
export async function refundSeatPayment(bookingId: string, reason: string, actorUserId: string | null, now: Date = new Date()): Promise<RefundOutcome> {
  const why = reason.slice(0, 200);
  for (let round = 0; round < 3; round += 1) {
    const p = await db.sessionPayment.findUnique({ where: { bookingId }, select: PAYMENT_SELECT });
    if (!p) return "nothing";
    if (p.status === "INITIATED") {
      const voided = await db.sessionPayment.updateMany({ where: { id: p.id, status: "INITIATED" }, data: { status: "FAILED", reason: why } });
      if (voided.count === 0) continue;
      await auditSeat(p, { actorUserId, action: "gig.payment.void", targetType: "SessionPayment", targetId: p.id, meta: { reason: why } });
      return "voided";
    }
    if (p.status !== "PAID" && p.status !== "HELD") return "nothing";
    if (!p.paymentId) return "nothing";
    const claimed = await db.sessionPayment.updateMany({ where: { id: p.id, status: p.status }, data: { status: "REFUNDED", refundedAt: now, reason: why, pendingAction: null, lastError: null, holdUntil: null, commissionPaise: 0, gstPaise: 0, netPaise: 0 } });
    if (claimed.count === 0) continue;
    let refundId: string | null = null;
    let failure: string | null = null;
    try {
      refundId = (await refundSeat(p.paymentId, p.amountPaise, { shalaghar_session_payment: p.id, reason: why.slice(0, 60) }, p.path === "ROUTE")).refundId;
    } catch (error) {
      failure = (error instanceof Error ? error.message : "gateway error").slice(0, 300);
    }
    if (failure !== null && !(await paymentRefundedAtGateway(p.paymentId, p.amountPaise))) {
      await db.sessionPayment.updateMany({ where: { id: p.id, status: "REFUNDED", refundId: null }, data: { status: p.status, refundedAt: null, holdUntil: p.holdUntil, commissionPaise: p.commissionPaise, gstPaise: p.gstPaise, netPaise: p.netPaise, pendingAction: "REFUND", reason: why, lastError: failure, attempts: p.attempts + 1 } });
      await auditSeat(p, { actorUserId, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "REFUND", error: failure } });
      return "pending";
    }
    // The refund is made: its id is written on its own, so a failed write never undoes it.
    if (refundId) await db.sessionPayment.updateMany({ where: { id: p.id, status: "REFUNDED" }, data: { refundId } }).catch((error) => console.error("[gig-payments] refund id not written", error));
    await auditSeat(p, { actorUserId, action: "gig.payment.refunded", targetType: "SessionPayment", targetId: p.id, meta: { amountPaise: p.amountPaise, refundId, reason: why, ...(failure !== null ? { readBack: true } : {}) } });
    return "refunded";
  }
  return "nothing";
}

/** An audit row for a seat's payment under the pupil's school, found through the booking as its provider reads it (TA-183). */
async function auditSeat(p: { bookingId: string; expertUserId: string }, entry: { actorUserId: string | null; action: string; targetType: string; targetId: string; meta: Record<string, unknown> }): Promise<void> {
  const schoolId = (await bookingOfPayment(p))?.schoolId ?? null;
  if (schoolId) await forSchool(schoolId, () => audit({ schoolId, ...entry }));
  else await audit({ schoolId: null, ...entry });
}

export type ReleaseRun = { released: number; releasedPaise: number; invoiced: number; due: number; duePaise: number; refunded: number; held: number; failed: number; payoutsOpened: number; linksChecked: number; dueTo: { expertUserId: string; netPaise: number; payoutId: string; opened: boolean }[] };

/**
 * The job's money half (gigs:release, hourly). First what is owed to the
 * family and to the gateway's bookkeeping: a PAID row whose transfer is now
 * known is held; a refund that could not be made is tried again. Then, with
 * the switch on: every ROUTE seat whose hold has ended has its transfer's
 * hold taken off at the gateway — RELEASED, the gateway settles the expert —
 * and the run's released seats become one RELEASED payout per expert with
 * its invoice, the expert told once; a release the gateway refused waits
 * (pendingAction RELEASE) for the next run or the operator. The company-
 * collects rows of the second amendment still become DUE into the expert's
 * OPEN payout, as they did. Linked accounts under the gateway's review are
 * asked after. Nothing is released while the switch is off — refunds still
 * go, since that is the family's money.
 */
export async function releaseDue(now: Date = new Date()): Promise<ReleaseRun> {
  const run: ReleaseRun = { released: 0, releasedPaise: 0, invoiced: 0, due: 0, duePaise: 0, refunded: 0, held: 0, failed: 0, payoutsOpened: 0, linksChecked: 0, dueTo: [] };
  const on = await paymentsOn();

  for (const p of await db.sessionPayment.findMany({ where: { status: "PAID", paymentId: { not: null } }, select: { id: true }, take: 200 })) {
    if (await holdPayment(p.id)) run.held += 1;
  }
  for (const p of await db.sessionPayment.findMany({ where: { pendingAction: "REFUND", status: { in: ["PAID", "HELD"] } }, select: { bookingId: true, reason: true }, take: 200 })) {
    const outcome = await refundSeatPayment(p.bookingId, p.reason ?? "refund", null, now);
    if (outcome === "refunded") run.refunded += 1;
    else run.failed += 1;
  }
  run.linksChecked = (await linkReadyExperts(null, now, "PENDING")).tried;
  if (!on) return run;

  // ROUTE: the hold comes off at the gateway, seat by seat — never for an expert the operator has stopped paying
  // (suspendPayee, TA-187): their seats stay HELD until the stop is lifted, and a refund still goes.
  const stopped = (await db.expertPayoutAccount.findMany({ where: { status: "SUSPENDED" }, select: { expertUserId: true } })).map((a) => a.expertUserId);
  // TA-122: a seat the family disputes waits for the operator: its hold was taken off (holdUntil null) in the same
  // transaction as the dispute, so neither this path nor the company-collects one below finds it. The booking is not
  // asked here: a read of it through the payment is the nested read TA-183 forbids, and it would match nothing under
  // the job's binding.
  for (const p of await db.sessionPayment.findMany({ where: { path: "ROUTE", status: "HELD", transferId: { not: null }, holdUntil: { not: null, lte: now }, OR: [{ pendingAction: null }, { pendingAction: { not: "REFUND" } }], ...(stopped.length ? { expertUserId: { notIn: stopped } } : {}) }, orderBy: { holdUntil: "asc" }, select: PAYMENT_SELECT, take: 500 })) {
    try {
      await releaseTransfer(p.transferId!);
    } catch (error) {
      const message = (error instanceof Error ? error.message : "gateway error").slice(0, 300);
      await db.sessionPayment.updateMany({ where: { id: p.id, status: "HELD" }, data: { pendingAction: "RELEASE", lastError: message, attempts: p.attempts + 1 } });
      await audit({ actorUserId: null, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "RELEASE", error: message } });
      run.failed += 1;
      continue;
    }
    const changed = await db.sessionPayment.updateMany({ where: { id: p.id, status: "HELD" }, data: { status: "RELEASED", releasedAt: now, pendingAction: null, lastError: null } });
    if (changed.count === 0) continue;
    await audit({ actorUserId: null, action: "gig.payment.released", targetType: "SessionPayment", targetId: p.id, meta: { transferId: p.transferId, netPaise: p.netPaise } });
    run.released += 1;
    run.releasedPaise += p.netPaise;
  }
  // ROUTE: the released seats not yet in a payout — this run's, and any an earlier run could not invoice.
  const company = await companyDetails();
  // A prefix saved before the sixteen-character rule would have every invoice refused (TA-525): the seats wait, as
  // with details missing, and the rest of the run goes on.
  if (company.missing.length === 0 && INVOICE_PREFIX.test(company.invoicePrefix)) {
    const released = await db.sessionPayment.findMany({ where: { path: "ROUTE", status: "RELEASED", payoutId: null }, orderBy: { releasedAt: "asc" }, select: { id: true, expertUserId: true }, take: 1000 });
    const experts = [...new Set(released.map((p) => p.expertUserId))];
    for (const expertUserId of experts) {
      const made = await settleReleased(
        expertUserId,
        released.filter((p) => p.expertUserId === expertUserId).map((p) => p.id),
        company,
        now,
      );
      if (!made) continue;
      run.invoiced += 1;
      run.payoutsOpened += 1;
      run.dueTo.push({ expertUserId, netPaise: made.netPaise, payoutId: made.payoutId, opened: true });
    }
  }

  // COMPANY (the second amendment's rows): the hold run, DUE into the expert's one OPEN payout.
  const due = await db.sessionPayment.findMany({ where: { path: "COMPANY", status: "HELD", holdUntil: { not: null, lte: now } }, orderBy: { holdUntil: "asc" }, select: PAYMENT_SELECT, take: 500 });
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
      // A teacher's guidance seats (seats, 17 Oct 2026) are counted on their guidance page; an expert's on the earnings page.
      const teacher = (await db.gigSlot.findUnique({ where: { id: rows[0]!.slotId }, select: { providerKind: true } }))?.providerKind === "TEACHER";
      await forUser(expertUserId, () => notify({ userId: expertUserId, schoolId: null, kind: teacher ? "SYSTEM" : "EXPERT", titleKey: "gigs.notifDue", titleVars: { amount: rupees(result.sum), count: result.count }, url: teacher ? "/teacher/guidance" : "/expert/earnings", meta: { payoutId: result.payoutId } })).catch((error) => console.error("[gig-payments] due notice failed", error));
      run.payoutsOpened += 1;
    }
    run.due += result.count;
    run.duePaise += result.sum;
    run.dueTo.push({ expertUserId, netPaise: result.sum, payoutId: result.payoutId, opened: result.opened });
  }
  return run;
}

/**
 * One expert's released ROUTE seats become one RELEASED payout with its tax
 * invoice, in one transaction under the settings-row lock: the seats are
 * claimed by `payoutId IS NULL`, so a second run takes none of them twice.
 * The expert is told what the gateway is settling to their bank.
 */
async function settleReleased(expertUserId: string, paymentIds: string[], company: CompanyDetails, now: Date): Promise<{ payoutId: string; netPaise: number; invoiceNumber: string } | null> {
  const [payee, expert] = await Promise.all([db.expertPayoutAccount.findUnique({ where: { expertUserId }, select: { payeeName: true, gstin: true, gstStateCode: true } }), db.user.findUnique({ where: { id: expertUserId }, select: { name: true, prefs: true } })]);
  if (!expert) return null;
  const locale = normaliseLocale(readJson<{ locale?: string }>(expert.prefs, {}).locale);
  const seller: InvoiceParty = { name: company.legalName!, gstin: company.gstin, address: company.address, stateCode: company.stateCode };
  const buyer: InvoiceParty = { name: payee?.payeeName ?? expert.name, gstin: payee?.gstin ?? null, address: null, stateCode: payee?.gstStateCode ?? null };
  const made = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.$queryRaw`SELECT "id" FROM "GigSettings" WHERE "id" = ${SETTINGS_ID} FOR UPDATE`;
    const payments = await tx.sessionPayment.findMany({ where: { id: { in: paymentIds }, status: "RELEASED", payoutId: null }, orderBy: { releasedAt: "asc" }, select: { id: true, amountPaise: true, commissionPaise: true, gstPaise: true, netPaise: true, slot: { select: { title: true, startsAt: true } } } });
    if (payments.length === 0) return null;
    const netPaise = payments.reduce((a, p) => a + p.netPaise, 0);
    const payout = await tx.expertPayout.create({ data: { expertUserId, netPaise, paymentsCount: payments.length, status: "RELEASED", paidAt: now }, select: { id: true } });
    const claimed = await tx.sessionPayment.updateMany({ where: { id: { in: payments.map((p) => p.id) }, status: "RELEASED", payoutId: null }, data: { payoutId: payout.id } });
    if (claimed.count !== payments.length) throw new Error("gig-payments: a released seat was claimed twice");
    const invoice = await writeInvoice(tx, { payoutId: payout.id, expertUserId, payments, issuedAt: now, company, seller, buyer, locale });
    return { payoutId: payout.id, netPaise, count: payments.length, invoice };
  });
  if (!made) return null;
  await audit({ actorUserId: null, action: "gig.payout.released", targetType: "ExpertPayout", targetId: made.payoutId, meta: { expertUserId, netPaise: made.netPaise, paymentsCount: made.count, invoiceNumber: made.invoice.number } });
  await audit({ actorUserId: null, action: "gig.invoice.issue", targetType: "GigInvoice", targetId: made.invoice.id, meta: { number: made.invoice.number, expertUserId, totalPaise: made.invoice.totalPaise, payoutId: made.payoutId } });
  await forUser(expertUserId, () => notify({ userId: expertUserId, schoolId: null, kind: "EXPERT", titleKey: "gigs.notifReleased", titleVars: { amount: rupees(made.netPaise), count: made.count }, url: "/expert/earnings", meta: { payoutId: made.payoutId, invoiceId: made.invoice.id } })).catch((error) => console.error("[gig-payments] release notice failed", error));
  return { payoutId: made.payoutId, netPaise: made.netPaise, invoiceNumber: made.invoice.number };
}

/**
 * The operator tries the waiting gateway call now, instead of at the next
 * run: a refund; a release (the hold taken off, then invoiced with the next
 * run's payout); a failed transfer made again from the payment, on hold; and
 * a PAID row that never became HELD is held.
 */
export async function retrySeatPayment(ctx: ActiveContext, paymentRowId: string, now: Date = new Date()): Promise<GigResult<{ outcome: string }>> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const p = await db.sessionPayment.findUnique({ where: { id: paymentRowId }, select: PAYMENT_SELECT });
  if (!p) throw new AccessError("gigs.noSuchPayment", "NOT_FOUND");
  await audit({ actorUserId: ctx.user.id, action: "gig.payment.retry", targetType: "SessionPayment", targetId: p.id, meta: { action: p.pendingAction, status: p.status } });
  if (p.pendingAction === "REFUND") return { ok: true, outcome: await refundSeatPayment(p.bookingId, p.reason ?? "refund", ctx.user.id, now) };
  // TA-122: a seat the family disputes is left alone until the operator decides it (a waiting refund still goes).
  if ((await bookingOfPayment(p))?.status === "DISPUTED") return { ok: false, errorKey: "gigs.refuseDisputed" };
  if (p.pendingAction === "RELEASE" && p.status === "HELD" && p.transferId) {
    if (!(await paymentsOn())) return { ok: false, errorKey: "gigs.refusePaymentsOff" };
    // Payments to this expert are stopped (TA-187): the hold stays until the operator lifts the stop.
    if ((await db.expertPayoutAccount.findUnique({ where: { expertUserId: p.expertUserId }, select: { status: true } }))?.status === "SUSPENDED") return { ok: false, errorKey: "gigs.refuseExpertStopped" };
    try {
      await releaseTransfer(p.transferId);
    } catch (error) {
      const message = (error instanceof Error ? error.message : "gateway error").slice(0, 300);
      await db.sessionPayment.update({ where: { id: p.id }, data: { lastError: message, attempts: p.attempts + 1 } });
      return { ok: true, outcome: "waiting" };
    }
    await db.sessionPayment.updateMany({ where: { id: p.id, status: "HELD" }, data: { status: "RELEASED", releasedAt: now, pendingAction: null, lastError: null } });
    await audit({ actorUserId: ctx.user.id, action: "gig.payment.released", targetType: "SessionPayment", targetId: p.id, meta: { transferId: p.transferId, netPaise: p.netPaise } });
    return { ok: true, outcome: "released" };
  }
  if (p.pendingAction === "TRANSFER" && p.status === "PAID" && p.paymentId) {
    const linked = await db.expertPayoutAccount.findUnique({ where: { expertUserId: p.expertUserId }, select: { linkedAccountId: true } });
    if (!linked?.linkedAccountId) return { ok: false, errorKey: "gigs.refuseExpertNoPayout" };
    try {
      const t = await transferFromPayment(p.paymentId, { linkedAccountId: linked.linkedAccountId, amountPaise: p.netPaise, notes: { shalaghar_session_payment: p.id } });
      await db.sessionPayment.updateMany({ where: { id: p.id, status: "PAID" }, data: { status: "HELD", transferId: t.transferId, pendingAction: null, lastError: null } });
      await audit({ actorUserId: ctx.user.id, action: "gig.payment.held", targetType: "SessionPayment", targetId: p.id, meta: { netPaise: p.netPaise, transferId: t.transferId, remade: true } });
      return { ok: true, outcome: "held" };
    } catch (error) {
      const message = (error instanceof Error ? error.message : "gateway error").slice(0, 300);
      await db.sessionPayment.update({ where: { id: p.id }, data: { lastError: message, attempts: p.attempts + 1 } });
      return { ok: true, outcome: "waiting" };
    }
  }
  if (p.status === "PAID") return { ok: true, outcome: (await holdPayment(p.id)) ? "held" : "waiting" };
  return { ok: false, errorKey: "gigs.refuseNothingToRetry" };
}

/* -------------------------------------------------------------------------- */
/* Invoices, and the company-collects payouts of the second amendment           */
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

type InvoicedPayment = { id: string; amountPaise: number; commissionPaise: number; gstPaise: number; slot: { title: string; startsAt: Date } };

/**
 * The tax invoice for the commission on one payout's seats, inside the
 * caller's transaction: the next number of the financial year's series
 * (under the settings-row lock nextInSeries takes), the taxable value and
 * the GST split CGST+SGST when the expert's state is the company's and IGST
 * otherwise, both parties and every line frozen.
 */
async function writeInvoice(tx: typeof db, input: { payoutId: string; expertUserId: string; payments: InvoicedPayment[]; issuedAt: Date; company: CompanyDetails; seller: InvoiceParty; buyer: InvoiceParty; locale: string }): Promise<{ id: string; number: string; totalPaise: number }> {
  const lines: InvoiceLine[] = input.payments.map((p) => ({ paymentId: p.id, title: p.slot.title, date: p.slot.startsAt.toISOString().slice(0, 10), grossPaise: p.amountPaise, commissionPaise: p.commissionPaise, gstPaise: p.gstPaise }));
  const taxableValuePaise = lines.reduce((a, l) => a + l.commissionPaise, 0);
  const gst = lines.reduce((a, l) => a + l.gstPaise, 0);
  const sameState = input.buyer.stateCode === input.seller.stateCode;
  const cgstPaise = sameState ? Math.floor(gst / 2) : 0;
  const sgstPaise = sameState ? gst - cgstPaise : 0;
  const igstPaise = sameState ? 0 : gst;
  const series = invoiceSeriesOf(input.company.invoicePrefix, "C", input.issuedAt);
  const number = await nextInSeries(tx, "INVOICE", series);
  return tx.gigInvoice.create({ data: { number: number.number, series, serial: number.serial, payoutId: input.payoutId, expertUserId: input.expertUserId, issuedAt: input.issuedAt, locale: input.locale, taxableValuePaise, cgstPaise, sgstPaise, igstPaise, totalPaise: taxableValuePaise + gst, sacCode: input.company.sacCode, sellerJson: JSON.stringify(input.seller), buyerJson: JSON.stringify(input.buyer), linesJson: JSON.stringify(lines) }, select: { id: true, number: true, totalPaise: true } });
}

class Refusal extends Error {
  constructor(readonly errorKey: "gigs.refuseNothingDue" | "gigs.refusePayoutPaid") {
    super(errorKey);
  }
}

export type PayoutRecordInput = { reference: string; paidAt?: string | null; note?: string | null };

/**
 * THE SECOND AMENDMENT'S PATH, kept for the OPEN payouts it left: the
 * operator has paid an expert from the company's bank and records the
 * transfer's reference. No ROUTE seat comes here — the gateway pays those. Refused by name until the company's legal name,
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
  const expertPayee = await db.expertPayoutAccount.findUnique({ where: { expertUserId: payout.expertUserId }, select: PAYEE_SELECT });
  // A teacher's guidance seats (seats, 17 Oct 2026) are paid to the UPI id they keep for questions (GigPayee): no GSTIN, no state on file.
  const teacherPayee = expertPayee ? null : await db.gigPayee.findUnique({ where: { userId: payout.expertUserId }, select: { upiId: true, payeeName: true } });
  const payee = expertPayee && payeeComplete(expertPayee) ? { payeeName: expertPayee.payeeName, gstin: expertPayee.gstin, gstStateCode: expertPayee.gstStateCode } : teacherPayee?.upiId ? { payeeName: teacherPayee.payeeName, gstin: null, gstStateCode: null } : null;
  if (!payee) return { ok: false, errorKey: "gigs.refuseNoPayee" };
  if (await db.expertPayout.findUnique({ where: { reference }, select: { id: true } })) return { ok: false, errorKey: "gigs.refuseUtrUsed" };
  const locale = normaliseLocale(readJson<{ locale?: string }>(payout.expert.prefs, {}).locale);
  const seller: InvoiceParty = { name: company.legalName!, gstin: company.gstin, address: company.address, stateCode: company.stateCode };
  // A payee with no state on record (a teacher's UPI id): no address, so the place of supply is the company's own
  // state and the tax CGST+SGST — the pass invoice's rule (pass-orders.ts writePassInvoice, decision 0006), one rule
  // for both (TA-191).
  const buyer: InvoiceParty = { name: payee.payeeName ?? payout.expert.name, gstin: payee.gstin, address: null, stateCode: payee.gstStateCode ?? company.stateCode };

  let made: { payout: { id: string; netPaise: number; paymentsCount: number; reference: string }; invoice: { id: string; number: string; totalPaise: number } };
  try {
    made = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "SessionPayment" WHERE "payoutId" = ${payout.id} AND "status" = 'DUE' ORDER BY "id" FOR UPDATE`;
      if (rows.length === 0) throw new Refusal("gigs.refuseNothingDue");
      const payments = await tx.sessionPayment.findMany({ where: { id: { in: rows.map((r) => r.id) } }, orderBy: { dueAt: "asc" }, select: { id: true, amountPaise: true, commissionPaise: true, gstPaise: true, netPaise: true, slot: { select: { title: true, startsAt: true } } } });
      const netPaise = payments.reduce((a, p) => a + p.netPaise, 0);
      const claimed = await tx.expertPayout.updateMany({ where: { id: payout.id, status: "OPEN" }, data: { status: "PAID", reference, paidAt, paidByUserId: ctx.user.id, note: (input.note ?? "").trim().slice(0, 300) || null, netPaise, paymentsCount: payments.length } });
      if (claimed.count === 0) throw new Refusal("gigs.refusePayoutPaid");
      await tx.sessionPayment.updateMany({ where: { id: { in: payments.map((p) => p.id) } }, data: { status: "PAID_OUT", paidOutAt: paidAt } });
      // The invoice carries the day it is issued, never the day typed for the transfer (TA-450): a typed day in a
      // closed year, or before invoices already issued, cannot put a number out of its series' order.
      const invoice = await writeInvoice(tx, { payoutId: payout.id, expertUserId: payout.expertUserId, payments, issuedAt: now, company, seller, buyer, locale });
      return { payout: { id: payout.id, netPaise, paymentsCount: payments.length, reference }, invoice };
    });
  } catch (error) {
    if (error instanceof Refusal) return { ok: false, errorKey: error.errorKey };
    // TA-525: a prefix saved before the sixteen-character rule (or a series past 999,999) issues nothing; said by name.
    if (error instanceof InvoiceNumberRefused) return { ok: false, errorKey: "gigs.refuseInvoiceNumber" };
    // Two records with one reference at the same moment: the second meets the unique index.
    if ((error as { code?: string }).code === "P2002") return { ok: false, errorKey: "gigs.refuseUtrUsed" };
    throw error;
  }
  await audit({ actorUserId: ctx.user.id, action: "gig.payout.paid", targetType: "ExpertPayout", targetId: payout.id, meta: { expertUserId: payout.expertUserId, netPaise: made.payout.netPaise, paymentsCount: made.payout.paymentsCount, reference, invoiceNumber: made.invoice.number } });
  await audit({ actorUserId: ctx.user.id, action: "gig.invoice.issue", targetType: "GigInvoice", targetId: made.invoice.id, meta: { number: made.invoice.number, expertUserId: payout.expertUserId, totalPaise: made.invoice.totalPaise, payoutId: payout.id } });
  await forUser(payout.expertUserId, () => notify({ userId: payout.expertUserId, schoolId: null, kind: teacherPayee ? "SYSTEM" : "EXPERT", titleKey: "gigs.notifPaidOut", titleVars: { amount: rupees(made.payout.netPaise), count: made.payout.paymentsCount, reference }, url: teacherPayee ? "/teacher/guidance" : "/expert/earnings", meta: { payoutId: payout.id, invoiceId: made.invoice.id } })).catch((error) => console.error("[gig-payments] payout notice failed", error));
  return { ok: true, ...made };
}

/* -------------------------------------------------------------------------- */
/* What the gateway's webhook says afterwards                                   */
/* -------------------------------------------------------------------------- */

/**
 * transfer.processed: the gateway names the transfer it made from a payment;
 * a PAID ROUTE row learns it and is held. Already known, nothing changes.
 */
/** A transfer's `source` is the payment it was made from, or the order that carried it. */
const bySource = (source: string) => (source.startsWith("order_") ? { orderId: source } : { paymentId: source });

export async function markTransferProcessed(input: { transferId: string; source: string }): Promise<boolean> {
  const p = await db.sessionPayment.findFirst({ where: { ...bySource(input.source), path: "ROUTE" }, select: { id: true, status: true, transferId: true } });
  if (!p || p.transferId) return false;
  await db.sessionPayment.update({ where: { id: p.id }, data: { transferId: input.transferId } });
  if (p.status === "PAID") await holdPayment(p.id);
  return true;
}

/**
 * transfer.failed: the gateway could not make the expert's held transfer, so
 * the net sits in the company's account. The row stays PAID with
 * pendingAction TRANSFER for the operator's retry, which makes it again
 * from the payment; the operator's page lists it.
 */
export async function markTransferFailed(input: { source: string; reason: string }): Promise<boolean> {
  const p = await db.sessionPayment.findFirst({ where: { ...bySource(input.source), path: "ROUTE", status: { in: ["PAID", "HELD"] } }, select: { id: true, attempts: true } });
  if (!p) return false;
  // Only while it is still PAID or HELD: a refund or a release claimed since the read is not undone (TA-241).
  const changed = await db.sessionPayment.updateMany({ where: { id: p.id, status: { in: ["PAID", "HELD"] } }, data: { status: "PAID", transferId: null, pendingAction: "TRANSFER", lastError: input.reason.slice(0, 300), attempts: p.attempts + 1 } });
  if (changed.count === 0) return false;
  await audit({ actorUserId: null, action: "gig.payment.retryWaiting", targetType: "SessionPayment", targetId: p.id, meta: { action: "TRANSFER", error: input.reason.slice(0, 300), via: "webhook" } });
  return true;
}

/**
 * product.route.*: the gateway's review of a linked account moved. The row
 * takes the status and what is still asked for; the expert is told once
 * when it is activated. An account this server never made is ignored.
 */
export async function markRouteProduct(input: { accountId: string; productId: string; status: string; requirements: { field_reference?: string; reason_code?: string }[] }, now: Date = new Date()): Promise<boolean> {
  const row = await db.expertPayoutAccount.findUnique({ where: { linkedAccountId: input.accountId }, select: { expertUserId: true, routeStatus: true, routeProductId: true } });
  if (!row) return false;
  const status = routeStatusOf(input.status);
  const requirements: RouteRequirement[] = input.requirements.map((r) => ({ field: String(r.field_reference ?? "").slice(0, 120), reason: String(r.reason_code ?? "").slice(0, 60) })).slice(0, 20);
  await db.expertPayoutAccount.update({ where: { expertUserId: row.expertUserId }, data: { routeStatus: status, routeRequirements: JSON.stringify(requirements), routeCheckedAt: now, ...(row.routeProductId ? {} : { routeProductId: input.productId }) } });
  if (status !== row.routeStatus) await audit({ actorUserId: null, action: "gig.route.status", targetType: "ExpertPayoutAccount", targetId: row.expertUserId, meta: { from: row.routeStatus, to: status, requirements: requirements.length, via: "webhook" } });
  if (status === "ACTIVATED" && row.routeStatus !== "ACTIVATED") {
    await forUser(row.expertUserId, () => notify({ userId: row.expertUserId, schoolId: null, kind: "EXPERT", titleKey: "gigs.notifRouteActive", url: "/expert/profile" })).catch((error) => console.error("[gig-payments] route notice failed", error));
  }
  return true;
}

/** refund.failed: the money never left; the row goes back to waiting for a refund with the figures it had. */
export async function markSeatRefundFailed(refundId: string, reason: string): Promise<boolean> {
  const p = await db.sessionPayment.findFirst({ where: { refundId, status: "REFUNDED" }, select: { id: true, attempts: true, amountPaise: true } });
  if (!p) return false;
  const settings = await db.gigSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID }, select: { commissionPercent: true, gstPercent: true } });
  // Only the refund the event names, still REFUNDED (TA-241): a second event, or a refund made again since, is not undone.
  const changed = await db.sessionPayment.updateMany({ where: { id: p.id, status: "REFUNDED", refundId }, data: { status: "HELD", refundedAt: null, refundId: null, pendingAction: "REFUND", lastError: reason.slice(0, 300), attempts: p.attempts + 1, ...figuresOf(p.amountPaise, settings) } });
  if (changed.count === 0) return false;
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

export type EarningRow = { paymentId: string; bookingId: string; title: string; startsAt: string; schoolName: string; amountPaise: number; commissionPaise: number; gstPaise: number; netPaise: number; status: SessionPaymentStatus; holdUntil: string | null; dueAt: string | null; releasedAt: string | null; paidOutAt: string | null; refundedAt: string | null; payoutId: string | null; reason: string | null };
export type EarningPayout = { id: string; netPaise: number; paymentsCount: number; status: string; reference: string | null; paidAt: string | null; createdAt: string; invoiceId: string | null; invoiceNumber: string | null };
export type EarningInvoice = { id: string; number: string; issuedAt: string; taxableValuePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; totalPaise: number; payoutId: string };
export type Earnings = { heldPaise: number; /** Released to the gateway, which settles it to the expert's bank. */ releasedPaise: number; duePaise: number; paidOutPaise: number; refundedPaise: number; commissionPercent: number; gstPercent: number; rows: EarningRow[]; payouts: EarningPayout[]; invoices: EarningInvoice[] };

const earningStatuses = (status: string): SessionPaymentStatus => (SESSION_PAYMENT_STATUSES.includes(status as SessionPaymentStatus) ? (status as SessionPaymentStatus) : "FAILED");

/** What the expert has on hold, is owed, was paid and was refunded, seat by seat with the three figures, payout by payout, and the invoices. No pupil's name: the school's is enough on a statement. */
export async function expertEarnings(ctx: ActiveContext): Promise<Earnings> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const [settings, rows, payouts, invoices] = await Promise.all([paymentSettings(), db.sessionPayment.findMany({ where: { expertUserId: ctx.user.id, status: { not: "INITIATED" } }, orderBy: { createdAt: "desc" }, take: 300, select: { ...PAYMENT_SELECT, slot: { select: { title: true, startsAt: true } }, booking: { select: { schoolId: true } } } }), db.expertPayout.findMany({ where: { expertUserId: ctx.user.id }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, netPaise: true, paymentsCount: true, status: true, reference: true, paidAt: true, createdAt: true, invoice: { select: { id: true, number: true } } } }), db.gigInvoice.findMany({ where: { expertUserId: ctx.user.id }, orderBy: { issuedAt: "desc" }, take: 100, select: { id: true, number: true, issuedAt: true, taxableValuePaise: true, cgstPaise: true, sgstPaise: true, igstPaise: true, totalPaise: true, payoutId: true } })]);
  const sumNet = (statuses: string[]) => rows.filter((p) => statuses.includes(p.status)).reduce((a, p) => a + p.netPaise, 0);
  // The pupils' schools' names, school by school under each school's binding (pupilNames' way in gig-sessions.ts): a
  // School row is not readable to an expert through a booking, so one nested read failed the whole page (TA-186).
  const schoolNames = new Map<string, string>();
  for (const schoolId of new Set(rows.map((p) => p.booking.schoolId))) {
    const school = await forSchool(schoolId, () => db.school.findUnique({ where: { id: schoolId }, select: { name: true } }));
    schoolNames.set(schoolId, school?.name ?? "");
  }
  return {
    heldPaise: sumNet(["PAID", "HELD"]),
    releasedPaise: sumNet(["RELEASED"]),
    duePaise: sumNet(["DUE"]),
    paidOutPaise: sumNet(["PAID_OUT"]),
    refundedPaise: rows.filter((p) => p.status === "REFUNDED").reduce((a, p) => a + p.amountPaise, 0),
    commissionPercent: settings.commissionPercent,
    gstPercent: settings.gstPercent,
    rows: rows.map((p) => ({ paymentId: p.id, bookingId: p.bookingId, title: p.slot.title, startsAt: p.slot.startsAt.toISOString(), schoolName: schoolNames.get(p.booking.schoolId) ?? "", amountPaise: p.amountPaise, commissionPaise: p.commissionPaise, gstPaise: p.gstPaise, netPaise: p.netPaise, status: earningStatuses(p.status), holdUntil: p.holdUntil?.toISOString() ?? null, dueAt: p.dueAt?.toISOString() ?? null, releasedAt: p.releasedAt?.toISOString() ?? null, paidOutAt: p.paidOutAt?.toISOString() ?? null, refundedAt: p.refundedAt?.toISOString() ?? null, payoutId: p.payoutId, reason: p.reason })),
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

/**
 * One invoice: the person it is addressed to reads their own whatever role they are signed in as (an expert, or a
 * teacher paid for guidance seats: TA-189), the operator any; anybody else's is not found.
 */
export async function invoiceView(ctx: ActiveContext, invoiceId: string): Promise<InvoiceView> {
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
export type RouteAccountRow = { expertUserId: string; expertName: string; status: RouteStatus; linked: boolean; needsResend: boolean; readyToLink: boolean; kycVerified: boolean; suspended: boolean; requirements: RouteRequirement[]; error: string | null; checkedAt: string | null };
export type PayoutsView = {
  paymentsEnabled: boolean;
  transport: GigGatewayTransport;
  /** Whether paid seats may be turned on, and why not. */
  route: RouteReadiness;
  /** Every expert who has saved payee details, with where their linked account stands. */
  routeAccounts: RouteAccountRow[];
  /** Released to the gateway this month, which settles it to the experts' banks. */
  releasedThisMonthPaise: number;
  month: string;
  commissionThisMonthPaise: number;
  gstThisMonthPaise: number;
  heldPaise: number;
  duePaise: number;
  paidOutThisMonthPaise: number;
  refundedThisMonthPaise: number;
  company: CompanyDetails;
  failures: { paymentId: string; expertName: string; amountPaise: number; action: "REFUND" | "HOLD" | "RELEASE" | "TRANSFER"; lastError: string | null; attempts: number; since: string }[];
  /** OPEN payouts, oldest first: what the company is to pay now, with where to pay it. */
  toPay: { id: string; expertUserId: string; expertName: string; payee: PayoutPayee; netPaise: number; paymentsCount: number; createdAt: string }[];
  /** Settled payouts, newest first — RELEASED by the gateway (no reference) or PAID by the company's recorded transfer — with the invoice. */
  paid: { id: string; expertUserId: string; expertName: string; status: "PAID" | "RELEASED"; netPaise: number; paymentsCount: number; reference: string | null; paidAt: string | null; invoiceId: string | null; invoiceNumber: string | null; note: string | null }[];
};

/** The operator's side: the switch, the company's details, the month's commission and GST, what is held and due, what failed and waits, what is to pay now and what was paid. */
export async function operatorPayouts(ctx: ActiveContext, now: Date = new Date()): Promise<PayoutsView> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const [settings, company, route] = await Promise.all([paymentSettings(), companyDetails(), routeReadiness()]);
  const month = monthKey(now);
  const monthStart = new Date(`${month}-01T00:00:00+05:30`);
  const [captured, held, released, paidOut, refunded, failures, open, paid, accounts] = await Promise.all([
    db.sessionPayment.aggregate({ where: { status: { in: ["PAID", "HELD", "RELEASED", "DUE", "PAID_OUT"] }, paidAt: { gte: monthStart } }, _sum: { commissionPaise: true, gstPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: { in: ["PAID", "HELD"] } }, _sum: { netPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: "RELEASED", releasedAt: { gte: monthStart } }, _sum: { netPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: "PAID_OUT", paidOutAt: { gte: monthStart } }, _sum: { netPaise: true } }),
    db.sessionPayment.aggregate({ where: { status: "REFUNDED", refundedAt: { gte: monthStart } }, _sum: { amountPaise: true } }),
    db.sessionPayment.findMany({ where: { OR: [{ pendingAction: { not: null } }, { status: "PAID", paidAt: { lt: new Date(now.getTime() - HOUR) } }] }, orderBy: { createdAt: "asc" }, take: 100, select: { ...PAYMENT_SELECT, expert: { select: { name: true } } } }),
    db.expertPayout.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "asc" }, take: 200, select: { id: true, expertUserId: true, netPaise: true, paymentsCount: true, createdAt: true, expert: { select: { name: true, payoutAccount: { select: { payeeName: true, upiId: true, bankLast4: true, ifsc: true, gstStateCode: true, gstin: true, status: true } }, expertProfile: { select: { kycStatus: true } }, gigPayee: { select: { upiId: true, payeeName: true } } } } } }),
    db.expertPayout.findMany({ where: { status: { in: ["PAID", "RELEASED"] } }, orderBy: { paidAt: "desc" }, take: 100, select: { id: true, expertUserId: true, status: true, netPaise: true, paymentsCount: true, reference: true, paidAt: true, note: true, expert: { select: { name: true } }, invoice: { select: { id: true, number: true } } } }),
    db.expertPayoutAccount.findMany({ orderBy: { updatedAt: "desc" }, take: 300, select: { expertUserId: true, ...PAYEE_SELECT, expert: { select: { name: true, expertProfile: { select: { kycStatus: true } } } } } }),
  ]);
  const standing = (a: { payeeName: string | null; upiId: string | null; bankLast4: string | null; ifsc: string | null; gstStateCode: string | null; gstin: string | null; status: string } | null, kyc: string | undefined): PayoutPayee => {
    const complete = Boolean(a?.payeeName && a.gstStateCode && (a.upiId || (a.bankLast4 && a.ifsc)));
    const status: PayoutStatus = a?.status === "SUSPENDED" ? "SUSPENDED" : complete && kyc === "VERIFIED" ? "ACTIVE" : "NONE";
    return { payeeName: a?.payeeName ?? null, upiId: a?.upiId ?? null, bankLast4: a?.bankLast4 ?? null, ifsc: a?.ifsc ?? null, gstStateCode: a?.gstStateCode ?? null, gstin: a?.gstin ?? null, status };
  };
  return {
    paymentsEnabled: settings.paymentsEnabled,
    transport: settings.transport,
    route,
    routeAccounts: accounts.map((a) => {
      const kycVerified = a.expert.expertProfile?.kycStatus === "VERIFIED";
      const r = routeViewOf(a, kycVerified);
      return { expertUserId: a.expertUserId, expertName: a.expert.name, status: r.status, linked: r.linked, needsResend: r.needsResend, readyToLink: r.readyToLink, kycVerified, suspended: a.status === "SUSPENDED", requirements: r.requirements, error: r.error, checkedAt: r.checkedAt };
    }),
    releasedThisMonthPaise: released._sum.netPaise ?? 0,
    month,
    commissionThisMonthPaise: captured._sum.commissionPaise ?? 0,
    gstThisMonthPaise: captured._sum.gstPaise ?? 0,
    heldPaise: held._sum.netPaise ?? 0,
    duePaise: open.reduce((a, p) => a + p.netPaise, 0),
    paidOutThisMonthPaise: paidOut._sum.netPaise ?? 0,
    refundedThisMonthPaise: refunded._sum.amountPaise ?? 0,
    company,
    failures: failures.map((p) => ({ paymentId: p.id, expertName: p.expert.name, amountPaise: p.pendingAction === "REFUND" ? p.amountPaise : p.netPaise, action: p.pendingAction === "REFUND" || p.pendingAction === "RELEASE" || p.pendingAction === "TRANSFER" ? p.pendingAction : ("HOLD" as const), lastError: p.lastError, attempts: p.attempts, since: p.createdAt.toISOString() })),
    // A teacher's guidance seats (seats, 17 Oct 2026) are paid to the UPI id the teacher keeps for questions.
    toPay: open.map((x) => ({ id: x.id, expertUserId: x.expertUserId, expertName: x.expert.name, payee: !x.expert.payoutAccount && x.expert.gigPayee ? { payeeName: x.expert.gigPayee.payeeName, upiId: x.expert.gigPayee.upiId, bankLast4: null, ifsc: null, gstStateCode: null, gstin: null, status: "ACTIVE" as const } : standing(x.expert.payoutAccount, x.expert.expertProfile?.kycStatus), netPaise: x.netPaise, paymentsCount: x.paymentsCount, createdAt: x.createdAt.toISOString() })),
    paid: paid.map((x) => ({ id: x.id, expertUserId: x.expertUserId, expertName: x.expert.name, status: x.status === "RELEASED" ? ("RELEASED" as const) : ("PAID" as const), netPaise: x.netPaise, paymentsCount: x.paymentsCount, reference: x.reference, paidAt: x.paidAt?.toISOString() ?? null, invoiceId: x.invoice?.id ?? null, invoiceNumber: x.invoice?.number ?? null, note: x.note })),
  };
}

/** ₹1,250 for a notice, the same output as the i18n helper, server-side. */
export function rupees(paise: number): string {
  const r = paise / 100;
  return `₹${new Intl.NumberFormat("en-IN", { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 }).format(r)}`;
}
