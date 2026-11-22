import "server-only";
import { Prisma } from "@prisma/client";
import { collegeTierOf, freeMonthsImplied, isCollegeKind, isRealDateKey, nextRenewalOnPayment, partnerMonth, planSuitsKind, premiumBilling, premiumTerms, renewalFrom, renewalOverAYear, statusByRenewal, subscriptionTerms, tierMonthPaise, type InstitutionKind, type PartTerms, type PaymentAnswer, type PaymentBody, type PremiumPlan } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import {
  SUBSCRIPTION_STATUSES,
  type OperatorContactBody,
  type OperatorDashboard,
  type OperatorDashboardQuery,
  type OperatorOnboardBody,
  type OperatorPartnerBody,
  type OperatorPartnerUpdateBody,
  type OperatorSubscriptionBody,
  type SubscriptionStatus,
} from "@edulink/contracts";
import { db } from "./db";
import { audit, type AuditTx } from "./audit";
import { billedYear, columnsOf, newestPupils, readOffer, readSchoolTerms } from "./school-terms";
import { assertSuperuser, createSchool, inviteAdmin, sendAdminInviteMail, type AdminInviteMail, type SchoolDetails } from "./superuser";
import { assignPlan, createPlan, monthKeyFor } from "./plans";
import { activePlans } from "./person-plans";
import { addDaysToKey, isValidTimeZone, safeTimeZone, todayKey } from "./dates";
import { messageCapOf } from "./message-cap";
import { notify } from "./notify";
import { translator } from "./i18n/dictionary";
import { sendHealthDigestEmail } from "./email";
import type { ActiveContext } from "./session";

/**
 * The operator's commercial record of each school, and the dashboard that
 * reads it: when a subscription started and falls due, where it stands,
 * who to call at the school, which partner brought it in and for what
 * share — and the guided onboarding that writes all of that in one go.
 *
 * NOTHING HERE MOVES MONEY (decision 0003). The platform records what a
 * school owes and when, as dates the operator types after the fact — an
 * invoice sent, a payment seen on the bank statement — and what a partner
 * is owed, computed on read from the plan's recorded price and never
 * stored. There is no gateway, no balance and no payout: the dashboard is
 * a ledger of promises kept on paper elsewhere.
 *
 * DATES ARE DAYS. A due date is a calendar day the operator and the school
 * agreed, not an instant, so it is kept at UTC midnight and compared by
 * day key: "due on the 5th" is the 5th in every zone.
 *
 * EVERY CHANGE IS AN AUDIT ROW WITH A REASON. There is no SubscriptionNote
 * table; the operator's own log (schoolId NULL) is the history, and a
 * status change also lands in the school's Safety Centre the way a plan
 * change does — the school is entitled to know its standing changed.
 */

/* -------------------------------------------------------------------------- */
/* Pure arithmetic, tested on its own                                          */
/* -------------------------------------------------------------------------- */

const DAY_MS = 86_400_000;

/** The client a step writes through: the module's `db`, or the onboarding transaction's client (fees-payments.ts spells it the same way). */
type Tx = typeof db;

/** The moves the list allows; null (never recorded) may move to anything, and a status may stay. */
export const SUBSCRIPTION_MOVES: Record<SubscriptionStatus, readonly SubscriptionStatus[]> = {
  TRIAL: ["ACTIVE", "SUSPENDED", "ENDED"],
  ACTIVE: ["DUE", "SUSPENDED", "ENDED"],
  DUE: ["ACTIVE", "SUSPENDED", "ENDED"],
  SUSPENDED: ["ACTIVE", "TRIAL", "ENDED"],
  ENDED: ["TRIAL", "ACTIVE"],
};

export function canMoveSubscription(from: SubscriptionStatus | null, to: SubscriptionStatus): boolean {
  if (from === null || from === to) return true;
  return SUBSCRIPTION_MOVES[from].includes(to);
}

/**
 * The correction of a mistaken onboarding (rule 5, the coordinator's C1 of 21 November 2026), beside the list and not in
 * it: TRIAL to DUE and DUE to TRIAL, which the list refuses, are allowed while nothing is recorded as paid, and only to
 * the status the renewal as it will stand calls for (statusByRenewal), so the date and the status move together.
 */
function isRenewalCorrection(from: SubscriptionStatus | null, to: SubscriptionStatus): boolean {
  return (from === "TRIAL" && to === "DUE") || (from === "DUE" && to === "TRIAL");
}

export function isSubscriptionStatus(value: string | null | undefined): value is SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(value ?? "");
}

/** A day key as the instant the column holds: that day's UTC midnight. */
export function dayToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** The column's instant as a day key; null stays null. */
export function dateToDay(value: Date | null | undefined): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/** Whole days from today (UTC) to a due date: negative once it has passed, 0 on the day. */
export function daysToDue(dueAt: Date | null | undefined, now: Date): number | null {
  if (!dueAt) return null;
  const today = dayToDate(now.toISOString().slice(0, 10)).getTime();
  const due = dayToDate(dueAt.toISOString().slice(0, 10)).getTime();
  return Math.round((due - today) / DAY_MS);
}

export type DueTone = "past" | "soon" | "later" | "none";

/** How a due date reads on the dashboard: red past it, amber within thirty days; a stopped or ended clock has no tone. */
export function dueTone(days: number | null, status: SubscriptionStatus | null): DueTone {
  if (days === null || status === "ENDED" || status === "SUSPENDED") return "none";
  if (days < 0) return "past";
  if (days <= 30) return "soon";
  return "later";
}

/** A partner's share of one school's month: tenths of a percent of the month its share is taken of (partnerMonth), rounded to the paisa. No figure: nothing. */
export function commissionOwedPaise(percentTenths: number, priceMonthlyPaise: number | null | undefined): number {
  if (!priceMonthlyPaise || percentTenths <= 0) return 0;
  return Math.round((priceMonthlyPaise * percentTenths) / 1000);
}

/** Is this subscription one that a due date still means something for? */
function clockRunning(status: string | null): boolean {
  return status !== "ENDED" && status !== "SUSPENDED";
}

/* -------------------------------------------------------------------------- */
/* One school's record                                                         */
/* -------------------------------------------------------------------------- */

export type Refusal = { ok: false; errorKey: TranslationKey };

const SUBSCRIPTION_SELECT = {
  id: true,
  name: true,
  removedAt: true,
  subscriptionStatus: true,
  subscriptionStartsAt: true,
  subscriptionDueAt: true,
  subscriptionInvoicedAt: true,
  subscriptionInvoiceRef: true,
  subscriptionPaidAt: true,
  subscriptionPaidRef: true,
  pocName: true,
  pocRole: true,
  pocPhone: true,
  pocEmail: true,
  commissionPartnerId: true,
  commissionPartner: { select: { id: true, name: true, percentTenths: true } },
} as const;

type SchoolRecord = {
  subscriptionStatus: string | null;
  subscriptionStartsAt: Date | null;
  subscriptionDueAt: Date | null;
  subscriptionInvoicedAt: Date | null;
  subscriptionInvoiceRef: string | null;
  subscriptionPaidAt: Date | null;
  subscriptionPaidRef: string | null;
  pocName: string | null;
  pocRole: string | null;
  pocPhone: string | null;
  pocEmail: string | null;
  commissionPartner: { id: string; name: string; percentTenths: number } | null;
};

/** The three views the contract describes, from the School row's columns. */
export function subscriptionViews(s: SchoolRecord, now: Date = new Date()) {
  const status = isSubscriptionStatus(s.subscriptionStatus) ? s.subscriptionStatus : null;
  const days = daysToDue(s.subscriptionDueAt, now);
  return {
    subscription: {
      status,
      startsAt: dateToDay(s.subscriptionStartsAt),
      dueAt: dateToDay(s.subscriptionDueAt),
      daysToDue: days,
      invoicedAt: dateToDay(s.subscriptionInvoicedAt),
      invoiceRef: s.subscriptionInvoiceRef,
      paidAt: dateToDay(s.subscriptionPaidAt),
      paidRef: s.subscriptionPaidRef,
    },
    dueTone: dueTone(days, status),
    contact: { name: s.pocName, role: s.pocRole, phone: s.pocPhone, email: s.pocEmail },
    commission: s.commissionPartner ? { partnerId: s.commissionPartner.id, partnerName: s.commissionPartner.name, percentTenths: s.commissionPartner.percentTenths } : null,
  };
}

/** One school's commercial record, for its page; null when there is no such school. */
export async function schoolSubscription(session: ActiveContext, schoolId: string, now: Date = new Date()) {
  assertSuperuser(session);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: SUBSCRIPTION_SELECT });
  return school ? subscriptionViews(school, now) : null;
}

const text = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/** A write that met another hand's commit since its read: refused by name, nothing written (the review's B-1). */
class SubscriptionChangedMeanwhile extends Error {}

/**
 * Changes the subscription: only the fields sent change; a status must be
 * a move the list allows; the due date must follow the start; the partner
 * must exist. Audited twice with the reason — the operator's own row, and
 * one in the school's Safety Centre that names the status and the due date
 * and not the invoice references, which are the operator's bookkeeping.
 * Compared and set on the standing as read (status, start, renewal, paid-at;
 * the review of 21 November 2026, B-1): a payment or another correction
 * committed since the read is never written over, and C1's "nothing recorded
 * as paid" holds of the row as written; the miss is refused by name.
 */
export async function setSubscription(session: ActiveContext, schoolId: string, input: OperatorSubscriptionBody, now: Date = new Date()): Promise<{ ok: true } | Refusal> {
  assertSuperuser(session);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { ...SUBSCRIPTION_SELECT, timezone: true } });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };
  const reason = input.reason.trim();
  if (!reason) return { ok: false, errorKey: "root.subscriptionReasonRequired" };

  const current = isSubscriptionStatus(school.subscriptionStatus) ? school.subscriptionStatus : null;
  const data: Record<string, unknown> = {};
  const changes: Record<string, unknown> = {};

  if (input.status !== undefined && input.status !== current) {
    if (!canMoveSubscription(current, input.status) && !isRenewalCorrection(current, input.status)) return { ok: false, errorKey: "root.subscriptionMoveRefused" };
    data.subscriptionStatus = input.status;
    changes.status = input.status;
  }
  const dates = [
    ["startsAt", "subscriptionStartsAt"],
    ["dueAt", "subscriptionDueAt"],
    ["invoicedAt", "subscriptionInvoicedAt"],
    ["paidAt", "subscriptionPaidAt"],
  ] as const;
  // TA-593: the contract's day is a pattern, which lets 2026-13-01 through; a day not on the calendar is refused by
  // name here, before anything is written, rather than meeting toISOString as a RangeError and a 500.
  for (const [field] of dates) {
    const value = input[field];
    if (typeof value === "string" && !isRealDateKey(value)) return { ok: false, errorKey: "root.subscriptionDayNotReal" };
  }
  for (const [field, column] of dates) {
    const value = input[field];
    if (value === undefined) continue;
    const next = value === null ? null : dayToDate(value);
    if (dateToDay(next) === dateToDay(school[column])) continue;
    data[column] = next;
    changes[field] = value;
  }
  const refs = [
    ["invoiceRef", "subscriptionInvoiceRef"],
    ["paidRef", "subscriptionPaidRef"],
  ] as const;
  for (const [field, column] of refs) {
    const value = input[field];
    if (value === undefined) continue;
    const next = text(value);
    if (next === school[column]) continue;
    data[column] = next;
    changes[field] = next;
  }
  const startsAt = "subscriptionStartsAt" in data ? (data.subscriptionStartsAt as Date | null) : school.subscriptionStartsAt;
  const dueAt = "subscriptionDueAt" in data ? (data.subscriptionDueAt as Date | null) : school.subscriptionDueAt;
  // A renewal on the start day is allowed (decision 0010 rule 5: onboarding with no free months renews, due, on its first day); before it, never.
  if (startsAt && dueAt && dueAt.getTime() < startsAt.getTime()) return { ok: false, errorKey: "root.subscriptionDatesOrder" };
  // C1: a move the list refuses gets this far only as TRIAL <-> DUE; it stands while nothing is recorded as paid, before
  // this write or by it (C1a), and only to the status the renewal as it will stand calls for, by onboarding's reckoning,
  // on the school's own day (C1b).
  if (changes.status !== undefined && !canMoveSubscription(current, changes.status as SubscriptionStatus)) {
    const paidAt = "subscriptionPaidAt" in data ? (data.subscriptionPaidAt as Date | null) : school.subscriptionPaidAt;
    const calledFor = dueAt ? statusByRenewal(dateToDay(startsAt), dateToDay(dueAt)!, todayKey(safeTimeZone(school.timezone), now)) : null;
    if (school.subscriptionPaidAt || paidAt || calledFor !== changes.status) return { ok: false, errorKey: "root.subscriptionMoveRefused" };
  }

  if (input.commissionPartnerId !== undefined && input.commissionPartnerId !== (school.commissionPartner?.id ?? null)) {
    if (input.commissionPartnerId !== null) {
      const partner = await db.commissionPartner.findUnique({ where: { id: input.commissionPartnerId }, select: { id: true } });
      if (!partner) return { ok: false, errorKey: "root.noSuchPartner" };
    }
    data.commissionPartnerId = input.commissionPartnerId;
    changes.commissionPartnerId = input.commissionPartnerId;
  }

  if (Object.keys(data).length === 0) return { ok: true };
  // The school's own record names its standing, not the operator's references.
  const forSchool: Record<string, unknown> = { reason };
  if (changes.status !== undefined) forSchool.status = changes.status;
  if (changes.dueAt !== undefined) forSchool.dueAt = changes.dueAt;
  if (changes.startsAt !== undefined) forSchool.startsAt = changes.startsAt;
  // The record and both audit rows in one transaction (rule 14): a correction moves the date and the status together in
  // one audited write (C1), and an audit row that cannot be written takes the change back with it.
  try {
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      const written = await tx.school.updateMany({
        where: {
          id: schoolId,
          removedAt: null,
          subscriptionStatus: school.subscriptionStatus,
          subscriptionStartsAt: school.subscriptionStartsAt,
          subscriptionDueAt: school.subscriptionDueAt,
          subscriptionPaidAt: school.subscriptionPaidAt,
        },
        data,
      });
      if (written.count === 0) throw new SubscriptionChangedMeanwhile();
      await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.school.subscription", targetType: "School", targetId: schoolId, meta: { schoolId, name: school.name, ...changes, reason } }, tx as unknown as AuditTx);
      if (Object.keys(forSchool).length > 1) {
        await audit({ schoolId, actorUserId: session.user.id, action: "superuser.school.subscription", targetType: "School", targetId: schoolId, meta: forSchool }, tx as unknown as AuditTx);
      }
    });
  } catch (error) {
    if (error instanceof SubscriptionChangedMeanwhile) return { ok: false, errorKey: "root.subscriptionChangedMeanwhile" };
    throw error;
  }
  return { ok: true };
}

/**
 * RECORD A PAYMENT (decision 0010 rule 5). The renewal (subscriptionDueAt) is the day the next unpaid year starts; a
 * payment moves it twelve months on, once, from the renewal on record, whether paid early or late, in the free period or
 * paid up (with no record, the year starts on the day paid), and makes the school ACTIVE with the day and reference
 * paid. Refused while SUSPENDED or ENDED: recording is resumed first. Compared and set against the standing as read; the
 * same payment sent twice is refused by name. An amount unlike the bill (today's prices, the newest count) needs
 * `acceptDifference`. Recorded, never collected (decision 0003). A preview writes nothing.
 */
export async function recordPayment(session: ActiveContext, schoolId: string, input: PaymentBody, now: Date = new Date()): Promise<PaymentAnswer | Refusal> {
  assertSuperuser(session);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, removedAt: true, subscriptionStatus: true, subscriptionDueAt: true } });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };
  const status = isSubscriptionStatus(school.subscriptionStatus) ? school.subscriptionStatus : null;
  const dueDay = dateToDay(school.subscriptionDueAt);
  if (status === "SUSPENDED" || status === "ENDED") return { ok: false, errorKey: "root.paymentStatusFirst" };
  if (input.fromStatus !== status || input.fromDueAt !== dueDay) return missedPayment(input, status, dueDay);
  const next = nextRenewalOnPayment({ status, dueDay, paidOnDay: input.paidOn });
  if (!next.ok) return { ok: false, errorKey: next.errorKey };
  const terms = await readSchoolTerms(session, schoolId, now);
  if ("ok" in terms) return terms;
  const billPaise = terms.bill?.totalPaise ?? null;
  const differencePaise = billPaise === null ? null : input.amountPaise - billPaise;
  if (differencePaise !== null && differencePaise !== 0 && !input.acceptDifference) return { ok: false, errorKey: "root.paymentDiffers" };
  const answer: PaymentAnswer = { preview: Boolean(input.preview), renewalBefore: dueDay, renewalAfter: next.renewalDay, statusAfter: "ACTIVE", billPaise, differencePaise };
  if (input.preview) return answer;
  const ref = text(input.ref ?? null);
  const moved = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const written = await tx.school.updateMany({
      where: { id: schoolId, removedAt: null, subscriptionStatus: school.subscriptionStatus, subscriptionDueAt: school.subscriptionDueAt },
      data: { subscriptionStatus: "ACTIVE", subscriptionDueAt: dayToDate(next.renewalDay), subscriptionPaidAt: dayToDate(input.paidOn), subscriptionPaidRef: ref },
    });
    if (written.count !== 1) return false;
    const meta = { kind: "payment", paidOn: input.paidOn, ref, amountPaise: input.amountPaise, billPaise, differencePaise, statusBefore: status, renewalBefore: dueDay, renewalAfter: next.renewalDay };
    await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.school.subscription", targetType: "School", targetId: schoolId, meta: { schoolId, name: school.name, ...meta } }, tx as unknown as AuditTx);
    // The school's own record names its standing, not the operator's references or amounts.
    await audit({ schoolId, actorUserId: session.user.id, action: "superuser.school.subscription", targetType: "School", targetId: schoolId, meta: { status: "ACTIVE", dueAt: next.renewalDay } }, tx as unknown as AuditTx);
    return true;
  });
  if (!moved) {
    // The standing moved between the read and the write, as when the same payment is sent twice at once: read it again,
    // and name the payment already recorded when that is what moved it.
    const after = await db.school.findUnique({ where: { id: schoolId }, select: { subscriptionStatus: true, subscriptionDueAt: true } });
    return missedPayment(input, isSubscriptionStatus(after?.subscriptionStatus) ? (after!.subscriptionStatus as SubscriptionStatus) : null, dateToDay(after?.subscriptionDueAt));
  }
  return answer;
}

/** The partner's month as partnerMonth reads it: what it is reckoned on, and whether it earns, and why not. */
export type PartnerReading = { monthPaise: number | null; earns: boolean; renewalReached: boolean; unpriced: boolean; freeByAgreement: boolean };

/**
 * The partner's month for one school, today and once its terms are first set (the coordinating session's C2b: the terms
 * sheet's preview says what happens to it, in the operator's own screen only, never in the school's log or notice). Today's
 * reading is listPartners' for a school whose terms are not set (a tier's twelfth of this month's roll, else the plan's old
 * price); once set, partnerMonth on the subscription as the preview reads it and the school's newest count. None where the
 * school has no partner, or its terms were set before, or the save would not set them.
 */
export async function partnerPreview(
  session: ActiveContext,
  schoolId: string,
  after: { termsSet: boolean; subscriptionFigure: { basePaise: number; discountBps: number; paysPaise: number; source: "OURS" | "OWN_DISCOUNT" | "OWN_PRICE"; tierCode: string | null } | null; pupils: number | null },
  now: Date = new Date(),
): Promise<{ partner: string; today: PartnerReading; once: PartnerReading } | null> {
  assertSuperuser(session);
  const s = await db.school.findUnique({
    where: { id: schoolId },
    select: { timezone: true, subscriptionStatus: true, subscriptionDueAt: true, termsSetAt: true, plan: { select: { code: true, priceMonthlyPaise: true } }, commissionPartner: { select: { name: true } } },
  });
  if (!s || !s.commissionPartner || s.termsSetAt !== null || !after.termsSet) return null;
  const status = isSubscriptionStatus(s.subscriptionStatus) ? s.subscriptionStatus : null;
  const renewalDay = dateToDay(s.subscriptionDueAt);
  const todayDay = todayKey(safeTimeZone(s.timezone), now);
  let oldMonthPaise: number | null = s.plan?.priceMonthlyPaise ?? null;
  if (collegeTierOf(s.plan?.code)) {
    const roll = await db.usageSample.findFirst({ where: { schoolId, month: monthKeyFor("UTC") }, select: { pupils: true } });
    oldMonthPaise = tierMonthPaise(s.plan?.code, roll?.pupils ?? 0) || null;
  }
  const figure = after.subscriptionFigure;
  const tier = figure ? (collegeTierOf(figure.tierCode)?.code ?? null) : null;
  const today = partnerMonth({ termsSet: false, status, renewalDay, todayDay, subscription: null, pupils: null, oldMonthPaise });
  const once = partnerMonth({ termsSet: true, status, renewalDay, todayDay, subscription: figure ? { ...figure, tierCode: tier } : null, pupils: after.pupils, oldMonthPaise: null });
  return { partner: s.commissionPartner.name, today, once };
}

/** A payment whose standing as read is not the school's: the same payment already recorded, by name, or a change to look at again. */
function missedPayment(input: PaymentBody, status: SubscriptionStatus | null, dueDay: string | null): Refusal {
  const would = nextRenewalOnPayment({ status: input.fromStatus, dueDay: input.fromDueAt, paidOnDay: input.paidOn });
  if (would.ok && status === "ACTIVE" && dueDay === would.renewalDay) return { ok: false, errorKey: "root.paymentAlreadyRecorded" };
  return { ok: false, errorKey: "root.paymentChangedMeanwhile" };
}

/** The point of contact: four free-text fields, audited in the operator's own log. */
export async function setContact(session: ActiveContext, schoolId: string, input: OperatorContactBody): Promise<{ ok: true } | Refusal> {
  assertSuperuser(session);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { id: true, name: true, removedAt: true, pocName: true, pocRole: true, pocPhone: true, pocEmail: true } });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };
  if (input.email !== undefined && input.email !== null && input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return { ok: false, errorKey: "root.emailLooksWrong" };
  }
  const data: Record<string, string | null> = {};
  const pairs = [
    ["name", "pocName"],
    ["role", "pocRole"],
    ["phone", "pocPhone"],
    ["email", "pocEmail"],
  ] as const;
  for (const [field, column] of pairs) {
    if (input[field] === undefined) continue;
    const next = text(input[field]);
    if (next !== school[column]) data[column] = next;
  }
  if (Object.keys(data).length === 0) return { ok: true };
  await db.school.update({ where: { id: schoolId }, data });
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.school.contact", targetType: "School", targetId: schoolId, meta: { schoolId, name: school.name, ...data } });
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Partners                                                                    */
/* -------------------------------------------------------------------------- */

const PARTNER_SELECT = { id: true, name: true, phone: true, email: true, percentTenths: true, notes: true, createdAt: true } as const;

function checkPartner(input: Partial<OperatorPartnerBody>): Refusal | null {
  if (input.name !== undefined && !input.name.trim()) return { ok: false, errorKey: "root.partnerNameRequired" };
  if (input.percentTenths !== undefined && (!Number.isInteger(input.percentTenths) || input.percentTenths < 0 || input.percentTenths > 1000)) return { ok: false, errorKey: "root.partnerPercentInvalid" };
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return { ok: false, errorKey: "root.emailLooksWrong" };
  return null;
}

/** `client` is the module's `db`, or the onboarding transaction's client when the partner is made inline there. */
export async function createPartner(session: ActiveContext, input: OperatorPartnerBody, client: Tx = db): Promise<{ ok: true; partnerId: string } | Refusal> {
  assertSuperuser(session);
  const problem = checkPartner(input);
  if (problem) return problem;
  const partner = await client.commissionPartner.create({
    data: { name: input.name.trim(), phone: text(input.phone), email: text(input.email)?.toLowerCase() ?? null, percentTenths: input.percentTenths, notes: input.notes?.trim() ?? "" },
    select: { id: true },
  });
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.partner.create", targetType: "CommissionPartner", targetId: partner.id, meta: { name: input.name.trim(), percentTenths: input.percentTenths } }, client === db ? undefined : client);
  return { ok: true, partnerId: partner.id };
}

export async function updatePartner(session: ActiveContext, partnerId: string, input: OperatorPartnerUpdateBody): Promise<{ ok: true } | Refusal> {
  assertSuperuser(session);
  const existing = await db.commissionPartner.findUnique({ where: { id: partnerId }, select: PARTNER_SELECT });
  if (!existing) return { ok: false, errorKey: "root.noSuchPartner" };
  const problem = checkPartner(input);
  if (problem) return problem;
  const data: Record<string, unknown> = {};
  if (input.name !== undefined && input.name.trim() !== existing.name) data.name = input.name.trim();
  if (input.phone !== undefined && text(input.phone) !== existing.phone) data.phone = text(input.phone);
  if (input.email !== undefined && (text(input.email)?.toLowerCase() ?? null) !== existing.email) data.email = text(input.email)?.toLowerCase() ?? null;
  if (input.percentTenths !== undefined && input.percentTenths !== existing.percentTenths) data.percentTenths = input.percentTenths;
  if (input.notes !== undefined && input.notes.trim() !== existing.notes) data.notes = input.notes.trim();
  if (Object.keys(data).length === 0) return { ok: true };
  await db.commissionPartner.update({ where: { id: partnerId }, data });
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.partner.update", targetType: "CommissionPartner", targetId: partnerId, meta: { ...data } });
  return { ok: true };
}

export type PartnerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  percentTenths: number;
  notes: string;
  createdAt: Date;
  /**
   * The partner's live schools. `priceMonthlyPaise` is the month the share is taken of (partnerMonth): terms set, the
   * subscription month; terms not set, the plan's old monthly price or a tier's month (today's reading); null, no figure. Only
   * an ACTIVE school earns or is in a list (decision 6; C4, C4c, C4d, C4e): `earns` adds to the figure, `unpriced` has no price
   * to take a share of, `renewalReached` has its renewal day come with no payment recorded, `freeByAgreement` is at ₹0.
   */
  schools: { id: string; name: string; subscriptionStatus: SubscriptionStatus | null; planName: string | null; priceMonthlyPaise: number | null; termsSet: boolean; earns: boolean; unpriced: boolean; renewalReached: boolean; freeByAgreement: boolean }[];
  owedThisMonthPaise: number;
  /** The partner's ACTIVE schools with no price to take a share of: the owed figure cannot count them, and the card says so; named in `unpricedSchoolsNamed`. ₹0 with terms set is free by agreement, not unpriced. */
  unpricedSchools: number;
  unpricedSchoolsNamed: { id: string; name: string }[];
  /** The partner's ACTIVE schools with terms set whose renewal day has come, on their own day, with no payment recorded: nothing until paid (C4 point 2). */
  renewalReachedSchools: { id: string; name: string; dueDay: string }[];
};

/**
 * Every partner with their live schools and what each is owed this month, computed here and stored nowhere (decision
 * 0010 decision 6; the owner's Q5, "Paid-up subscription only"). A school whose terms are set gives its partner their
 * percent of its subscription month, what it pays a student a year after any discount × its newest count ÷ 12, every
 * kind, while ACTIVE and before its renewal day on its own day; premium is never shared; a school in its free months,
 * with a year owed, paused or ended gives nothing. A school whose terms are not set keeps today's reading: the plan's old
 * monthly price, or a college tier's twelfth of this month's count, while ACTIVE whatever the date; that branch is the only
 * place a plan's old price is still read for money (rule 16). The day is the school's own (C1b, C1c); `now` for the suites.
 */
export async function listPartners(session: ActiveContext, now: Date = new Date()): Promise<PartnerRow[]> {
  assertSuperuser(session);
  const partners = await db.commissionPartner.findMany({
    orderBy: { name: "asc" },
    select: {
      ...PARTNER_SELECT,
      schools: {
        where: { removedAt: null },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          kind: true,
          timezone: true,
          subscriptionStatus: true,
          subscriptionDueAt: true,
          termsSetAt: true,
          subscriptionPricePaise: true,
          subscriptionDiscountBps: true,
          plan: { select: { code: true, name: true, priceMonthlyPaise: true } },
        },
      },
    },
  });
  const all = partners.flatMap((p) => p.schools);
  // Terms not set, a college tier (4 Oct 2026): a twelfth of the tier times this month's roll from the nightly sample.
  const tiered = all.filter((s) => s.termsSetAt === null && collegeTierOf(s.plan?.code)).map((s) => s.id);
  const roll = tiered.length ? new Map((await db.usageSample.findMany({ where: { schoolId: { in: tiered }, month: monthKeyFor("UTC") }, select: { schoolId: true, pupils: true } })).map((u) => [u.schoolId, u.pupils])) : new Map<string, number>();
  // Terms set: our offer as it stands and each school's newest count (UsageSample, never members).
  const termsSet = all.filter((s) => s.termsSetAt !== null).map((s) => s.id);
  const [offer, newest] = termsSet.length ? await Promise.all([readOffer(), newestPupils(termsSet)]) : [null, new Map<string, number>()];
  return partners.map((p) => {
    const schools = p.schools.map((s) => {
      const status = isSubscriptionStatus(s.subscriptionStatus) ? s.subscriptionStatus : null;
      const set = s.termsSetAt !== null;
      // Terms not set: today's reading exactly (C4d point 3): a tier's month of this month's roll, none without one; a plan's old price.
      const oldMonthPaise = set ? null : collegeTierOf(s.plan?.code) ? tierMonthPaise(s.plan?.code, roll.get(s.id) ?? 0) || null : (s.plan?.priceMonthlyPaise ?? null);
      const month = partnerMonth({
        termsSet: set,
        status,
        renewalDay: dateToDay(s.subscriptionDueAt),
        todayDay: todayKey(safeTimeZone(s.timezone), now),
        subscription:
          set && offer
            ? subscriptionTerms({ kind: s.kind, planCode: s.plan?.code ?? null, own: { pricePaise: s.subscriptionPricePaise, discountBps: s.subscriptionDiscountBps } }, { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps })
            : null,
        pupils: set ? (newest.get(s.id) ?? null) : null,
        oldMonthPaise,
      });
      return {
        id: s.id,
        name: s.name,
        subscriptionStatus: status,
        planName: s.plan?.name ?? null,
        priceMonthlyPaise: month.monthPaise,
        termsSet: set,
        earns: month.earns,
        unpriced: month.unpriced,
        renewalReached: month.renewalReached,
        freeByAgreement: month.freeByAgreement,
        dueDay: dateToDay(s.subscriptionDueAt),
      };
    });
    const owedThisMonthPaise = schools.filter((s) => s.earns).reduce((sum, s) => sum + commissionOwedPaise(p.percentTenths, s.priceMonthlyPaise), 0);
    const unpriced = schools.filter((s) => s.unpriced);
    const renewalReachedSchools = schools.filter((s) => s.renewalReached).map((s) => ({ id: s.id, name: s.name, dueDay: s.dueDay! }));
    return {
      id: p.id,
      name: p.name,
      phone: p.phone,
      email: p.email,
      percentTenths: p.percentTenths,
      notes: p.notes,
      createdAt: p.createdAt,
      schools: schools.map((s) => ({ id: s.id, name: s.name, subscriptionStatus: s.subscriptionStatus, planName: s.planName, priceMonthlyPaise: s.priceMonthlyPaise, termsSet: s.termsSet, earns: s.earns, unpriced: s.unpriced, renewalReached: s.renewalReached, freeByAgreement: s.freeByAgreement })),
      owedThisMonthPaise,
      unpricedSchools: unpriced.length,
      unpricedSchoolsNamed: unpriced.map((s) => ({ id: s.id, name: s.name })),
      renewalReachedSchools,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* The dashboard                                                               */
/* -------------------------------------------------------------------------- */

export type DashboardState = OperatorDashboardQuery["state"] | "noadmin" | "unverified" | "test";

export type DashboardOpts = {
  q?: string;
  state?: DashboardState;
  planId?: string;
  partnerId?: string;
  /** Only these schools (a test's own); the tiles still count every real school. */
  schoolIds?: string[];
  now?: Date;
};

export type DashboardRow = OperatorDashboard["rows"][number] & { createdAt: Date; gradeLow: string | null; gradeHigh: string | null; code: string; isTestFixture: boolean };

export type Dashboard = Omit<OperatorDashboard, "rows"> & { rows: DashboardRow[]; counts: Record<Exclude<DashboardState, "all">, number> & { all: number } };

/**
 * The whole page in one read: the tiles over every real live school, the
 * table narrowed by the query, the partners and what each is owed. Reads
 * the School rows (superuser-readable by policy), this month's UsageSample
 * rows, the pending admin invitations, and the Session table's last-seen
 * instant per school — a whole-server table that holds no school data
 * beyond the instant — for "last activity". The school-bound audit rows
 * stay unreadable to the operator, as they should.
 */
export async function operatorDashboard(session: ActiveContext, opts: DashboardOpts = {}): Promise<Dashboard> {
  assertSuperuser(session);
  const now = opts.now ?? new Date();
  const month = monthKeyFor("UTC", now);
  const q = opts.q?.trim().toLowerCase();
  const state: DashboardState = opts.state ?? "live";

  const [schools, samples, invites, seen, partners] = await Promise.all([
    db.school.findMany({
      where: opts.schoolIds ? { id: { in: opts.schoolIds } } : {},
      orderBy: { name: "asc" },
      select: {
        ...SUBSCRIPTION_SELECT,
        city: true,
        kind: true,
        code: true,
        gradeLow: true,
        gradeHigh: true,
        createdAt: true,
        verifiedAt: true,
        isTestFixture: true,
        msgMonthlyCap: true,
        premiumStudents: true,
        premiumTeachers: true,
        plan: { select: { id: true, code: true, name: true, priceMonthlyPaise: true, messageCap: true, storageCapMb: true } },
      },
    }),
    db.usageSample.findMany({ where: { month }, select: { schoolId: true, pupils: true, messages: true, storageMb: true } }),
    db.invite.groupBy({ by: ["schoolId"], where: { role: "ADMIN", status: "PENDING", expiresAt: { gt: now } }, _count: true }),
    db.session.groupBy({ by: ["activeSchoolId"], where: { activeSchoolId: { not: null } }, _max: { lastSeenAt: true } }),
    listPartners(session, now),
  ]);
  const sampleOf = new Map(samples.map((s) => [s.schoolId, s]));
  const pendingOf = new Map(invites.map((i) => [i.schoolId, i._count]));
  const seenOf = new Map(seen.map((s) => [s.activeSchoolId as string, s._max.lastSeenAt]));

  const rows: DashboardRow[] = schools.map((s) => {
    const views = subscriptionViews(s, now);
    const sample = sampleOf.get(s.id);
    return {
      id: s.id,
      name: s.name,
      city: s.city,
      kind: s.kind as InstitutionKind,
      code: s.code,
      gradeLow: s.gradeLow,
      gradeHigh: s.gradeHigh,
      createdAt: s.createdAt,
      isTestFixture: s.isTestFixture,
      removedAt: s.removedAt ? s.removedAt.toISOString() : null,
      verifiedAt: s.verifiedAt ? s.verifiedAt.toISOString() : null,
      pendingAdminInvites: pendingOf.get(s.id) ?? 0,
      plan: s.plan ? { id: s.plan.id, code: s.plan.code, name: s.plan.name, priceMonthlyPaise: s.plan.priceMonthlyPaise } : null,
      pupils: sample?.pupils ?? null,
      subscription: views.subscription,
      dueTone: views.dueTone,
      commission: views.commission,
      contact: views.contact,
      lastActivityAt: seenOf.get(s.id)?.toISOString() ?? null,
      premium: { students: s.premiumStudents, teachers: s.premiumTeachers },
    };
  });

  // The tiles and the chips' counts: real schools (the fixtures have their own chip), live unless the chip says otherwise.
  const real = rows.filter((r) => !r.isTestFixture);
  const live = real.filter((r) => !r.removedAt);
  const is = {
    live: (r: DashboardRow) => !r.removedAt && !r.isTestFixture,
    trial: (r: DashboardRow) => is.live(r) && r.subscription.status === "TRIAL",
    soon: (r: DashboardRow) => is.live(r) && r.dueTone === "soon",
    due: (r: DashboardRow) => is.live(r) && r.dueTone === "past",
    suspended: (r: DashboardRow) => is.live(r) && r.subscription.status === "SUSPENDED",
    noadmin: (r: DashboardRow) => is.live(r) && r.pendingAdminInvites > 0,
    unverified: (r: DashboardRow) => is.live(r) && !r.verifiedAt,
    removed: (r: DashboardRow) => Boolean(r.removedAt) && !r.isTestFixture,
    test: (r: DashboardRow) => r.isTestFixture,
  } as const;
  const counts = {
    live: live.length,
    trial: real.filter(is.trial).length,
    soon: real.filter(is.soon).length,
    due: real.filter(is.due).length,
    suspended: real.filter(is.suspended).length,
    noadmin: real.filter(is.noadmin).length,
    unverified: real.filter(is.unverified).length,
    removed: real.filter(is.removed).length,
    test: rows.filter(is.test).length,
    all: rows.length,
  };

  let narrowed = state === "all" ? rows : rows.filter(is[state]);
  if (opts.planId) narrowed = narrowed.filter((r) => r.plan?.id === opts.planId);
  if (opts.partnerId) narrowed = narrowed.filter((r) => r.commission?.partnerId === opts.partnerId);
  if (q) narrowed = narrowed.filter((r) => r.name.toLowerCase().includes(q) || (r.city ?? "").toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || (r.contact.name ?? "").toLowerCase().includes(q));
  // Due first — past, then soon, then the rest — and by name within.
  const rank: Record<DueTone, number> = { past: 0, soon: 1, later: 2, none: 3 };
  narrowed.sort((a, b) => rank[a.dueTone] - rank[b.dueTone] || (a.subscription.daysToDue ?? 0) - (b.subscription.daysToDue ?? 0) || a.name.localeCompare(b.name));

  // This month against the caps, over the live schools: a school's text cap is its plan's or its own; storage only a plan caps.
  let messages = 0;
  let storageMb = 0;
  let messageCap = 0;
  let storageCapMb = 0;
  let anyStorageCap = false;
  let pupils = 0;
  for (const s of schools) {
    if (s.removedAt || s.isTestFixture) continue;
    const sample = sampleOf.get(s.id);
    messages += sample?.messages ?? 0;
    storageMb += sample?.storageMb ?? 0;
    pupils += sample?.pupils ?? 0;
    messageCap += messageCapOf(s);
    if (s.plan?.storageCapMb !== null && s.plan?.storageCapMb !== undefined) {
      storageCapMb += s.plan.storageCapMb;
      anyStorageCap = true;
    }
  }

  // Overdue jobs, read the way /root/jobs reads them; imported late because jobs.ts imports this file for the daily reminder.
  const { jobStatuses } = await import("./jobs");
  const jobsOverdue = (await jobStatuses(now)).filter((j) => j.overdue).length;

  const partnerTiles = partners.map((p) => ({ id: p.id, name: p.name, percentTenths: p.percentTenths, schools: p.schools.length, owedThisMonthPaise: p.owedThisMonthPaise, unpricedSchools: p.unpricedSchools, renewalReachedSchools: p.renewalReachedSchools.length }));
  const plans = await db.plan.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, code: true, name: true } });

  const dueSoon = live
    .filter((r) => r.subscription.daysToDue !== null && r.subscription.daysToDue <= 7 && clockRunning(r.subscription.status))
    .sort((a, b) => (a.subscription.daysToDue ?? 0) - (b.subscription.daysToDue ?? 0))
    .map((r) => ({ id: r.id, name: r.name, dueAt: r.subscription.dueAt as string, daysToDue: r.subscription.daysToDue as number, status: r.subscription.status }));

  return {
    month,
    tiles: {
      live: live.length,
      trial: counts.trial,
      dueSoon: counts.soon,
      pastDue: counts.due,
      suspended: counts.suspended,
      pupils,
      messages,
      messageCap: live.length ? messageCap : null,
      storageMb,
      storageCapMb: anyStorageCap ? storageCapMb : null,
      jobsOverdue,
      owedThisMonthPaise: partnerTiles.reduce((sum, p) => sum + p.owedThisMonthPaise, 0),
      billedYearPaise: (await billedYear(session, now)).billedYearPaise,
    },
    partners: partnerTiles,
    plans,
    rows: narrowed,
    dueSoon,
    counts,
  };
}

/* -------------------------------------------------------------------------- */
/* Onboarding: one call                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The new onboarding path's dates (§2.5; rule 5; C1c), one reckoning for onboardSchool and its preview, so the form's summary
 * and the school made can never disagree: the renewal is the typed day, else the start plus the free months; before the start
 * it is refused; the status is the one the dates call for (statusByRenewal: DUE on the start day or on or before today,
 * TRIAL otherwise). `asks` names the ticks the renewal needs, which onboardSchool refuses without and the form shows: more
 * than a year on, and on or before today with the start before today (a school that starts today with no free months is
 * simply owed from its first day and needs none). `impliedMonths`, for a typed renewal, is the whole free months it gives,
 * said back (freeMonthsImplied); null where the free months set it. Pure; days are the school's own.
 */
export function onboardingDates(input: { startsAt: string; dueAt?: string | null; freeMonths: number; today: string }):
  | { ok: true; startsAt: string; dueAt: string; status: "TRIAL" | "DUE"; impliedMonths: number | null; asks: { overAYear: boolean; dueNow: boolean } }
  | { ok: false; errorKey: "root.renewalBeforeStart" } {
  const dueAt = input.dueAt ?? renewalFrom(input.startsAt, input.freeMonths);
  // The renewal may be the start day (owed from the first day), so the refusal says "before the start" (the review of phase 6).
  if (dueAt < input.startsAt) return { ok: false, errorKey: "root.renewalBeforeStart" };
  return {
    ok: true,
    startsAt: input.startsAt,
    dueAt,
    status: statusByRenewal(input.startsAt, dueAt, input.today),
    // Said back only where the typed day is a whole number of months on (nought on the start day itself); a part month is
    // left to the date (C7.3; the second review's B1: "1 month free" for a month and a fortnight).
    impliedMonths: input.dueAt ? wholeMonths(input.startsAt, dueAt) : null,
    asks: { overAYear: renewalOverAYear(input.startsAt, dueAt), dueNow: dueAt <= input.today && input.startsAt < input.today },
  };
}

/** The free months a typed renewal gives, when it is a whole number of months from the start; null otherwise. */
function wholeMonths(startDay: string, renewalDay: string): number | null {
  const months = freeMonthsImplied(startDay, renewalDay);
  return months !== null && renewalFrom(startDay, months) === renewalDay ? months : null;
}

/** What onboarding's new path will set for the terms, reckoned and written nowhere: the form's summary reads it (§2.5). */
export type OnboardingPreview = {
  startsOn: string;
  renewsOn: string;
  status: "TRIAL" | "DUE";
  impliedMonths: number | null;
  asks: { overAYear: boolean; dueNow: boolean };
  subscription: PartTerms | null;
  premium: PartTerms;
  premiumBilled: boolean;
  premiumWaitsFor: PremiumPlan[];
};
/** The fields of the form a preview's refusal is shown under ("errors under their fields", §2.5). */
export type OnboardingField = "startsAt" | "dueAt" | "subscription" | "premium" | "tier" | "timezone";
export type OnboardingPreviewInput = Pick<OperatorOnboardBody, "kind" | "timezone" | "startsAt" | "dueAt" | "subscription" | "premium" | "freeMonths" | "tier">;

/**
 * Onboarding's preview (§2.5; phase 6): what the new path will set for the terms of a school with these fields, reckoned as
 * onboardSchool reckons it and writing nothing (no row, no audit). The same refusals of the terms, each named with the field
 * it is shown under, and the same dates (onboardingDates), offer (readOffer), figures (subscriptionTerms and premiumTerms, a
 * college on its tier) and billing (premiumBilling with the plans asked for, the terms being set by this path: C3). Always the
 * new path: the form always sends its terms. The ticks are not refused here but named in `asks`, for the form to show. It
 * writes no school and no audit row; reading the plans asked for (activePlans) may create the plan rows that are missing, as
 * every reader of the plans does.
 */
export async function previewOnboarding(session: ActiveContext, input: OnboardingPreviewInput, now: Date = new Date()): Promise<{ ok: true; preview: OnboardingPreview } | { ok: false; errorKey: TranslationKey; field: OnboardingField }> {
  assertSuperuser(session);
  const college = isCollegeKind(input.kind);
  if (input.tier && !college) return { ok: false, errorKey: "operatorCollege.refuseTierNotCollege", field: "tier" };
  if (input.tier && !planSuitsKind(input.tier, input.kind)) return { ok: false, errorKey: "operatorCollege.refuseTierKind", field: "tier" };
  if (input.startsAt && !isRealDateKey(input.startsAt)) return { ok: false, errorKey: "root.subscriptionDayNotReal", field: "startsAt" };
  if (input.dueAt && !isRealDateKey(input.dueAt)) return { ok: false, errorKey: "root.subscriptionDayNotReal", field: "dueAt" };
  if (college && input.subscription?.mode === "OWN_PRICE") return { ok: false, errorKey: "root.termsOwnPriceAtCollege", field: "subscription" };
  if (college && input.premium?.teachers) return { ok: false, errorKey: "root.termsTeachersAtCollege", field: "premium" };
  // A timezone that is no zone is refused here, under its field, where createSchool would refuse it only at the save, and the
  // summary must not be reckoned on Asia/Kolkata meanwhile (C7.2; the second review's W-2).
  if (input.timezone && !isValidTimeZone(input.timezone)) return { ok: false, errorKey: "refusal.timezoneUnknown", field: "timezone" };
  const today = todayKey(safeTimeZone(input.timezone), now);
  const [offer, asked] = await Promise.all([readOffer(), activePlans()]);
  const dates = onboardingDates({ startsAt: input.startsAt ?? today, dueAt: input.dueAt, freeMonths: input.freeMonths ?? offer.freeMonths, today });
  if (!dates.ok) return { ok: false, errorKey: dates.errorKey, field: "dueAt" };
  const own = columnsOf(input.subscription ?? { mode: "OURS" });
  const ownPremium = columnsOf(input.premium?.terms ?? { mode: "OURS" });
  const students = input.premium?.students ?? false;
  const teachers = input.premium?.teachers ?? false;
  const billing = premiumBilling({ termsSet: true, students, teachers }, asked);
  return {
    ok: true,
    preview: {
      startsOn: dates.startsAt,
      renewsOn: dates.dueAt,
      status: dates.status,
      impliedMonths: dates.impliedMonths,
      asks: dates.asks,
      subscription: subscriptionTerms({ kind: input.kind, planCode: input.tier ?? null, own: { pricePaise: own.price, discountBps: own.discount } }, { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps }),
      premium: premiumTerms({ pricePaise: ownPremium.price, discountBps: ownPremium.discount }, { pricePaise: offer.premiumPricePaise, discountBps: offer.premiumDiscountBps }),
      premiumBilled: billing.billed,
      premiumWaitsFor: billing.waitsFor,
    },
  };
}

export type OnboardResult = { ok: true; schoolId: string; code: string; slug: string; partnerId: string | null; mailSent: boolean } | Refusal;

/**
 * THE LOOK BEFORE A SECOND SEND (C7 point 8, as C7a point 1 settles it): whether the school an onboarding request that went
 * unanswered would have made is there. That school is one made since the form was opened (`since`, the moment its page was
 * served, by the server's clock), not removed, whose name is the name the request carried (trimmed, case aside, as
 * createSchool stores it) and for which an invitation of the first administrator was made at the address the request
 * carried (trimmed and lower-cased, as inviteAdmin stores it), whatever has become of that invitation since. Onboarding
 * makes the school and that invitation in one transaction, so every school the lost request made is found so. The
 * operator's own question; it writes nothing.
 */
export async function lookForOnboarded(session: ActiveContext, input: { since: string; name: string; adminEmail: string }): Promise<{ ok: true; found: { id: string; name: string } | null }> {
  assertSuperuser(session);
  const since = new Date(input.since);
  const name = input.name.trim();
  const email = input.adminEmail.trim().toLowerCase();
  if (Number.isNaN(since.getTime()) || !name || !email) return { ok: true, found: null };
  const schools = await db.school.findMany({ where: { createdAt: { gte: since }, removedAt: null, name: { equals: name, mode: "insensitive" } }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } });
  if (schools.length === 0) return { ok: true, found: null };
  // Invite is readable to the operator across schools, as listSchools reads it.
  const invited = await db.invite.findFirst({ where: { schoolId: { in: schools.map((s) => s.id) }, role: "ADMIN", email }, select: { schoolId: true }, orderBy: { createdAt: "asc" } });
  return { ok: true, found: invited ? (schools.find((s) => s.id === invited.schoolId) ?? null) : null };
}

/**
 * The guided flow's one door: makes the school through createSchool, puts
 * it on the plan through assignPlan, records the subscription, the point
 * of contact and the partner (made inline if asked), and invites the first
 * administrator through inviteAdmin — the same three functions the
 * separate pages call, so nothing is written twice over.
 *
 * ONE TRANSACTION. The three functions take the transaction's client as
 * their last parameter and write their audit rows through it, so the
 * school, its slug, its record, the inline partner, the plan, the
 * invitation and every audit row commit together or not at all: a refused
 * step inside — a taken slug met at the index, a plan or partner gone
 * between the check and the write, an invitation already waiting — rolls
 * the lot back by throwing `Refused`, which is caught at the door and
 * handed back as the step's own errorKey. What can be refused is still
 * checked BEFORE the transaction opens, so the ordinary refusal costs no
 * transaction at all. The operator creates a school that has no tenant
 * yet, so the transaction is `$tenantTransaction` under the operator's
 * own session — it binds the superuser key and no school, which is what
 * every policy these writes meet asks for (createSchool's own path runs
 * each statement the same way, one per query) — and NOT a bare
 * `db.$transaction`, which on this extended client is not atomic
 * (leave.ts has the demonstration).
 *
 * THE MAIL IS SENT AFTER THE COMMIT. A mail cannot be rolled back, so
 * inviteAdmin hands it back unsent and it goes once the transaction has
 * committed. If the transport refuses it then, the school exists with its
 * pending invitation and the operator resends it from the school's page
 * (resendAdminInvite); the result says `mailSent: false` and the failure is
 * logged, rather than a 500 for a school that was made.
 *
 * A given slug is used exactly; a taken one is refused rather than
 * numbered, because the operator typed it on purpose.
 */
export async function onboardSchool(session: ActiveContext, input: OperatorOnboardBody, now: Date = new Date()): Promise<OnboardResult> {
  assertSuperuser(session);

  const slug = input.slug?.trim().toLowerCase() || null;
  if (slug && (await db.school.findUnique({ where: { slug }, select: { id: true } }))) return { ok: false, errorKey: "root.slugTaken" };
  const adminEmail = input.adminEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) return { ok: false, errorKey: "root.emailLooksWrong" };
  const own = session.user.email?.trim().toLowerCase();
  if (own && own === adminEmail) return { ok: false, errorKey: "root.didNotWork" };
  if (input.planId && !(await db.plan.findUnique({ where: { id: input.planId }, select: { id: true } }))) return { ok: false, errorKey: "root.noSuchPlan" };
  // A college's tier (§2.5; phase 6): a college only, one that suits its kind (TA-488), and never beside a plan.
  if (input.tier && !isCollegeKind(input.kind)) return { ok: false, errorKey: "operatorCollege.refuseTierNotCollege" };
  if (input.tier && !planSuitsKind(input.tier, input.kind)) return { ok: false, errorKey: "operatorCollege.refuseTierKind" };
  if (input.tier && input.planId) return { ok: false, errorKey: "root.tierOrPlan" };
  if (input.commission && "partnerId" in input.commission && !(await db.commissionPartner.findUnique({ where: { id: input.commission.partnerId }, select: { id: true } }))) {
    return { ok: false, errorKey: "root.noSuchPartner" };
  }
  if (input.commission && "newPartner" in input.commission) {
    const problem = checkPartner(input.commission.newPartner);
    if (problem) return problem;
  }
  // TA-593: a typed day that is not on the calendar is refused by name, not thrown as a 500 by the date arithmetic.
  if ((input.startsAt && !isRealDateKey(input.startsAt)) || (input.dueAt && !isRealDateKey(input.dueAt))) return { ok: false, errorKey: "root.subscriptionDayNotReal" };
  // The terms at onboarding (decision 0010, 21 November 2026): any of them makes this the new path, where the renewal is
  // the start plus the free months (or the typed day), the school is DUE when that is the start day or on or before
  // today and TRIAL otherwise, and its terms are set. With none of them, today's rule exactly: terms not set, premium off.
  const withTerms = input.subscription !== undefined || input.premium !== undefined || input.freeMonths !== undefined;
  // C1b: the new path reckons the school's own day; the old one keeps the UTC day its callers and suites know.
  const today = withTerms ? todayKey(safeTimeZone(input.timezone), now) : todayKey("UTC", now);
  const startsAt = input.startsAt ?? today;
  let dueAt: string;
  let status: SubscriptionStatus;
  if (withTerms) {
    if (isCollegeKind(input.kind) && input.subscription?.mode === "OWN_PRICE") return { ok: false, errorKey: "root.termsOwnPriceAtCollege" };
    if (isCollegeKind(input.kind) && input.premium?.teachers) return { ok: false, errorKey: "root.termsTeachersAtCollege" };
    const dates = onboardingDates({ startsAt, dueAt: input.dueAt, freeMonths: input.dueAt ? 0 : (input.freeMonths ?? (await readOffer()).freeMonths), today });
    if (!dates.ok) return { ok: false, errorKey: dates.errorKey };
    if (dates.asks.overAYear && !input.acceptOverAYear) return { ok: false, errorKey: "root.renewalOverAYear" };
    if (dates.asks.dueNow && !input.acceptDueNow) return { ok: false, errorKey: "root.renewalBeforeToday" };
    dueAt = dates.dueAt;
    status = dates.status;
  } else {
    dueAt = input.dueAt ?? addDaysToKey(startsAt, input.trial ? 30 : 365);
    if (dayToDate(dueAt).getTime() <= dayToDate(startsAt).getTime()) return { ok: false, errorKey: "root.subscriptionDatesOrder" };
    status = input.trial ? "TRIAL" : "ACTIVE";
  }
  const ownSubscription = columnsOf(input.subscription ?? { mode: "OURS" });
  const ownPremium = columnsOf(input.premium?.terms ?? { mode: "OURS" });
  if (input.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contact.email.trim())) return { ok: false, errorKey: "root.emailLooksWrong" };
  // A college's two references from the guided flow (4 Oct 2026): kept for a college only, the AISHE code as AISHE issues it.
  const college = isCollegeKind(input.kind);
  const aisheCode = college ? text(input.aisheCode) : null;
  if (aisheCode && !/^[CSU]-\d{3,7}$/.test(aisheCode)) return { ok: false, errorKey: "college.profileCheck" };

  const details: SchoolDetails = {
    name: input.name,
    contactEmail: input.contactEmail,
    timezone: input.timezone,
    city: input.city ?? null,
    region: input.region ?? null,
    country: input.country ?? null,
    gradeLow: input.gradeLow ?? null,
    gradeHigh: input.gradeHigh ?? null,
    kind: input.kind ?? "SCHOOL",
    // A college's streams (5 Oct 2026), chosen beside the kind: createSchool refuses a college with none and applies their preset's modules.
    streams: input.streams ?? [],
  };

  /** A step's refusal, thrown to roll the transaction back and caught at the door. */
  class Refused extends Error {
    constructor(readonly refusal: Refusal) {
      super(refusal.errorKey);
    }
  }
  type Made = { schoolId: string; code: string; slug: string; partnerId: string | null; mail: AdminInviteMail | null };

  let made: Made | null = null;
  // TA-172: a taken slug aborts the transaction it is met in, so the next number is tried in a fresh transaction, as
  // registration does (school-signup.ts): createSchool makes one attempt inside a caller's transaction. A slug the
  // operator typed is made exactly as typed, and the index refuses it as taken if two operators race for it.
  // The name's own counter numbers the web address; a retry after two onboardings raced for a tier's plan does not move it,
  // since the first attempt was rolled back and its address is still free (the second review's A1).
  let nameAttempt = 0;
  for (let attempt = 0; attempt < 6 && !made; attempt++) {
    try {
      made = await db.$tenantTransaction(async (raw) => {
        const tx = raw as Tx;
        const created = await createSchool(session, details, tx, { slug: slug ?? undefined, attempt: nameAttempt });
        if (!created.ok) throw new Refused(created);
        const schoolId = created.schoolId;

        let partnerId: string | null = null;
        if (input.commission && "partnerId" in input.commission) partnerId = input.commission.partnerId;
        if (input.commission && "newPartner" in input.commission) {
          const partner = await createPartner(session, input.commission.newPartner, tx);
          if (!partner.ok) throw new Refused(partner);
          partnerId = partner.partnerId;
        }
        await tx.school.update({
          where: { id: schoolId },
          data: {
            board: input.board ?? null,
            subscriptionStatus: status,
            subscriptionStartsAt: dayToDate(startsAt),
            subscriptionDueAt: dayToDate(dueAt),
            pocName: text(input.contact?.name),
            pocRole: text(input.contact?.role),
            pocPhone: text(input.contact?.phone),
            pocEmail: text(input.contact?.email),
            commissionPartnerId: partnerId,
            ...(college ? { affiliatingUniversity: text(input.affiliatingUniversity), aisheCode } : {}),
            ...(withTerms
              ? {
                  subscriptionPricePaise: ownSubscription.price,
                  subscriptionDiscountBps: ownSubscription.discount,
                  premiumStudents: input.premium?.students ?? false,
                  premiumTeachers: input.premium?.teachers ?? false,
                  premiumPricePaise: ownPremium.price,
                  premiumDiscountBps: ownPremium.discount,
                  termsSetAt: now,
                }
              : {}),
          },
        });
        // A college's tier: its plan found by the tier's code, or made here, in this transaction, when there is none, so a refusal
        // later in the onboarding leaves no plan behind (§2.5; phase 6). Its name is the record's, in English as the console's.
        let planId = input.planId ?? null;
        if (input.tier) {
          const found = await tx.plan.findUnique({ where: { code: input.tier }, select: { id: true } });
          if (found) planId = found.id;
          else {
            const made = await createPlan(session, { code: input.tier, name: translator("en")(input.tier === "college-affiliated" ? "operatorCollege.tierAffiliated" : "operatorCollege.tierAutonomous") }, tx as unknown as typeof db);
            // Another onboarding made the tier's plan a moment ago (committed since the read above): that one is used.
            const again = !made.ok && made.errorKey === "root.planCodeTaken" ? await tx.plan.findUnique({ where: { code: input.tier }, select: { id: true } }) : null;
            if (!made.ok && !again) throw new Refused({ ok: false, errorKey: made.errorKey ?? "root.didNotWork" });
            planId = again?.id ?? (made.ok ? (made.planId ?? null) : null);
          }
        }
        if (planId) {
          const assigned = await assignPlan(session, schoolId, planId, tx);
          if (!assigned.ok) throw new Refused({ ok: false, errorKey: assigned.errorKey ?? "root.didNotWork" });
        }
        const invited = await inviteAdmin(session, schoolId, { email: adminEmail, name: input.adminName || null, role: "ADMIN", mail: "after-commit" }, tx);
        if (!invited.ok) throw new Refused({ ok: false, errorKey: invited.errorKey ?? "root.didNotWork" });

        const row = await tx.school.findUniqueOrThrow({ where: { id: schoolId }, select: { slug: true } });
        await audit(
          {
            schoolId: null,
            actorUserId: session.user.id,
            action: "superuser.school.onboard",
            targetType: "School",
            targetId: schoolId,
            meta: { schoolId, name: input.name.trim(), slug: row.slug, planId, tier: input.tier ?? null, status, startsAt, dueAt, partnerId, adminEmail, terms: withTerms ? { subscription: input.subscription ?? { mode: "OURS" }, premium: input.premium ?? null, freeMonths: input.freeMonths ?? null } : null },
          },
          tx,
        );
        return { schoolId, code: created.code, slug: row.slug, partnerId, mail: invited.mail ?? null };
      });
    } catch (error) {
      if (error instanceof Refused && error.refusal.errorKey === "root.nameCollides" && attempt < 5) {
        nameAttempt += 1;
        continue;
      }
      // Two onboardings that both found no plan for a tier and both made one: the second's insert aborts its transaction on
      // the code's unique index, and the next attempt finds the first's plan (the review of phase 6, 8).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && String(error.meta?.target ?? "").includes("code") && input.tier && attempt < 5) continue;
      if (error instanceof Refused) return error.refusal;
      throw error;
    }
  }
  if (!made) return { ok: false, errorKey: "root.nameCollides" };

  // Committed. The mail goes now; a transport failure leaves the school standing with its invitation pending, to be resent.
  let mailSent = false;
  if (made.mail) {
    try {
      await sendAdminInviteMail(made.mail);
      mailSent = true;
    } catch (error) {
      console.error("[subscriptions] onboarding invitation mail failed; the invitation is pending and can be resent", made.schoolId, error instanceof Error ? error.message : error);
    }
  }
  return { ok: true, schoolId: made.schoolId, code: made.code, slug: made.slug, partnerId: made.partnerId, mailSent };
}

/* -------------------------------------------------------------------------- */
/* The daily reminder                                                          */
/* -------------------------------------------------------------------------- */

/** How long one reminder about a school holds before the next: a week, so a school three weeks overdue is mentioned three times, not twenty-one. */
export const SUBSCRIPTION_REMIND_REPEAT_MS = 7 * DAY_MS;
/** How far ahead the reminder looks. */
export const SUBSCRIPTION_REMIND_DAYS = 7;

export type RemindOutcome = { due: number; reminded: number; muted: number; operators: number; emailed: number };

/**
 * Tells every operator, in the app and by mail, about each live school
 * whose subscription falls due within seven days or has passed, at most
 * once per school per week. Runs inside accounts:tidy, the daily job. The
 * once-a-week memory is the operator's own log: a superuser.subscription.remind
 * row per school per reminder, nothing stored on the school. A scope
 * narrows to a test's own schools; the fixtures are never reminded about.
 */
export async function remindSubscriptions(now: Date = new Date(), scope: { schoolIds?: string[]; operatorIds?: string[] } = {}): Promise<RemindOutcome> {
  const horizon = dayToDate(addDaysToKey(todayKey("UTC", now), SUBSCRIPTION_REMIND_DAYS));
  const schools = await db.school.findMany({
    where: {
      removedAt: null,
      isTestFixture: false,
      subscriptionDueAt: { lte: horizon },
      ...(scope.schoolIds ? { id: { in: scope.schoolIds } } : {}),
    },
    select: { id: true, name: true, subscriptionDueAt: true, subscriptionStatus: true },
    orderBy: { subscriptionDueAt: "asc" },
  });
  const due = schools.filter((s) => clockRunning(s.subscriptionStatus));
  const out: RemindOutcome = { due: due.length, reminded: 0, muted: 0, operators: 0, emailed: 0 };
  if (due.length === 0) return out;

  let operators: { id: string; email: string | null }[] | null = null;
  const loadOperators = async () => {
    if (operators) return operators;
    operators = scope.operatorIds
      ? await db.user.findMany({ where: { id: { in: scope.operatorIds }, disabledAt: null }, select: { id: true, email: true } })
      : await db.user.findMany({ where: { isSuperuser: true, disabledAt: null }, select: { id: true, email: true } });
    out.operators = operators.length;
    return operators;
  };

  for (const school of due) {
    const last = await db.auditLog.findFirst({
      where: { action: "superuser.subscription.remind", targetId: school.id, createdAt: { gte: new Date(now.getTime() - SUBSCRIPTION_REMIND_REPEAT_MS) } },
      select: { id: true },
    });
    if (last) {
      out.muted++;
      continue;
    }
    const days = daysToDue(school.subscriptionDueAt, now) ?? 0;
    const dueDay = dateToDay(school.subscriptionDueAt) ?? "";
    const past = days < 0;
    const vars = { school: school.name, due: dueDay, days: Math.abs(days) };
    const ops = await loadOperators();
    let emailed = 0;
    for (const op of ops) {
      await notify({
        userId: op.id,
        schoolId: null,
        kind: "SYSTEM",
        titleKey: past ? "notifTitle.subscriptionPastDue" : "notifTitle.subscriptionDue",
        titleVars: vars,
        bodyKey: past ? "notifBody.subscriptionPastDue" : "notifBody.subscriptionDue",
        bodyVars: vars,
        url: `/root/${school.id}`,
        meta: { event: "subscription.due", schoolId: school.id },
      }).catch((error) => console.error("[accounts:tidy] subscription notify", error instanceof Error ? error.message : error));
      if (op.email) {
        const tEn = translator("en");
        const subject = `Shalaghar: ${tEn(past ? "notifTitle.subscriptionPastDue" : "notifTitle.subscriptionDue", vars)}`;
        const body = tEn(past ? "notifBody.subscriptionPastDue" : "notifBody.subscriptionDue", vars);
        const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        try {
          await sendHealthDigestEmail(op.email, subject, body, `<p>${esc(body)}</p>`, "en");
          emailed++;
        } catch (error) {
          console.error("[accounts:tidy] subscription mail", error instanceof Error ? error.message : error);
        }
      }
    }
    out.emailed += emailed;
    await audit({ schoolId: null, actorUserId: null, action: "superuser.subscription.remind", targetType: "School", targetId: school.id, meta: { schoolId: school.id, name: school.name, dueAt: dueDay, daysToDue: days, operators: ops.length, emailed } });
    out.reminded++;
  }
  return out;
}
