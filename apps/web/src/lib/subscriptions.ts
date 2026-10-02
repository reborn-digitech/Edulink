import "server-only";
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
import { audit } from "./audit";
import { assertSuperuser, createSchool, inviteAdmin, type SchoolDetails } from "./superuser";
import { assignPlan, monthKeyFor } from "./plans";
import { addDaysToKey, todayKey } from "./dates";
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

/** A partner's share of one school's month: tenths of a percent of the plan's recorded price, rounded to the paisa. Null price, null plan: nothing. */
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

/**
 * Changes the subscription: only the fields sent change; a status must be
 * a move the list allows; the due date must follow the start; the partner
 * must exist. Audited twice with the reason — the operator's own row, and
 * one in the school's Safety Centre that names the status and the due date
 * and not the invoice references, which are the operator's bookkeeping.
 */
export async function setSubscription(session: ActiveContext, schoolId: string, input: OperatorSubscriptionBody): Promise<{ ok: true } | Refusal> {
  assertSuperuser(session);
  const school = await db.school.findUnique({ where: { id: schoolId }, select: SUBSCRIPTION_SELECT });
  if (!school) return { ok: false, errorKey: "root.noSuchSchool" };
  if (school.removedAt) return { ok: false, errorKey: "root.schoolWasRemoved" };
  const reason = input.reason.trim();
  if (!reason) return { ok: false, errorKey: "root.subscriptionReasonRequired" };

  const current = isSubscriptionStatus(school.subscriptionStatus) ? school.subscriptionStatus : null;
  const data: Record<string, unknown> = {};
  const changes: Record<string, unknown> = {};

  if (input.status !== undefined && input.status !== current) {
    if (!canMoveSubscription(current, input.status)) return { ok: false, errorKey: "root.subscriptionMoveRefused" };
    data.subscriptionStatus = input.status;
    changes.status = input.status;
  }
  const dates = [
    ["startsAt", "subscriptionStartsAt"],
    ["dueAt", "subscriptionDueAt"],
    ["invoicedAt", "subscriptionInvoicedAt"],
    ["paidAt", "subscriptionPaidAt"],
  ] as const;
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
  if (startsAt && dueAt && dueAt.getTime() <= startsAt.getTime()) return { ok: false, errorKey: "root.subscriptionDatesOrder" };

  if (input.commissionPartnerId !== undefined && input.commissionPartnerId !== (school.commissionPartner?.id ?? null)) {
    if (input.commissionPartnerId !== null) {
      const partner = await db.commissionPartner.findUnique({ where: { id: input.commissionPartnerId }, select: { id: true } });
      if (!partner) return { ok: false, errorKey: "root.noSuchPartner" };
    }
    data.commissionPartnerId = input.commissionPartnerId;
    changes.commissionPartnerId = input.commissionPartnerId;
  }

  if (Object.keys(data).length === 0) return { ok: true };
  await db.school.update({ where: { id: schoolId }, data });

  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.school.subscription", targetType: "School", targetId: schoolId, meta: { schoolId, name: school.name, ...changes, reason } });
  // The school's own record names its standing, not the operator's references.
  const forSchool: Record<string, unknown> = { reason };
  if (changes.status !== undefined) forSchool.status = changes.status;
  if (changes.dueAt !== undefined) forSchool.dueAt = changes.dueAt;
  if (changes.startsAt !== undefined) forSchool.startsAt = changes.startsAt;
  if (Object.keys(forSchool).length > 1) {
    await audit({ schoolId, actorUserId: session.user.id, action: "superuser.school.subscription", targetType: "School", targetId: schoolId, meta: forSchool });
  }
  return { ok: true };
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

export async function createPartner(session: ActiveContext, input: OperatorPartnerBody): Promise<{ ok: true; partnerId: string } | Refusal> {
  assertSuperuser(session);
  const problem = checkPartner(input);
  if (problem) return problem;
  const partner = await db.commissionPartner.create({
    data: { name: input.name.trim(), phone: text(input.phone), email: text(input.email)?.toLowerCase() ?? null, percentTenths: input.percentTenths, notes: input.notes?.trim() ?? "" },
    select: { id: true },
  });
  await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.partner.create", targetType: "CommissionPartner", targetId: partner.id, meta: { name: input.name.trim(), percentTenths: input.percentTenths } });
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
  schools: { id: string; name: string; subscriptionStatus: SubscriptionStatus | null; planName: string | null; priceMonthlyPaise: number | null }[];
  owedThisMonthPaise: number;
};

/** Every partner with their live schools and what each is owed this month — computed here, stored nowhere. */
export async function listPartners(session: ActiveContext): Promise<PartnerRow[]> {
  assertSuperuser(session);
  const partners = await db.commissionPartner.findMany({
    orderBy: { name: "asc" },
    select: {
      ...PARTNER_SELECT,
      schools: { where: { removedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, subscriptionStatus: true, plan: { select: { name: true, priceMonthlyPaise: true } } } },
    },
  });
  return partners.map((p) => {
    const schools = p.schools.map((s) => ({
      id: s.id,
      name: s.name,
      subscriptionStatus: isSubscriptionStatus(s.subscriptionStatus) ? s.subscriptionStatus : null,
      planName: s.plan?.name ?? null,
      priceMonthlyPaise: s.plan?.priceMonthlyPaise ?? null,
    }));
    const owedThisMonthPaise = schools.filter((s) => s.subscriptionStatus === "ACTIVE").reduce((sum, s) => sum + commissionOwedPaise(p.percentTenths, s.priceMonthlyPaise), 0);
    return { id: p.id, name: p.name, phone: p.phone, email: p.email, percentTenths: p.percentTenths, notes: p.notes, createdAt: p.createdAt, schools, owedThisMonthPaise };
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
        code: true,
        gradeLow: true,
        gradeHigh: true,
        createdAt: true,
        verifiedAt: true,
        isTestFixture: true,
        msgMonthlyCap: true,
        plan: { select: { id: true, code: true, name: true, priceMonthlyPaise: true, messageCap: true, storageCapMb: true } },
      },
    }),
    db.usageSample.findMany({ where: { month }, select: { schoolId: true, pupils: true, messages: true, storageMb: true } }),
    db.invite.groupBy({ by: ["schoolId"], where: { role: "ADMIN", status: "PENDING", expiresAt: { gt: now } }, _count: true }),
    db.session.groupBy({ by: ["activeSchoolId"], where: { activeSchoolId: { not: null } }, _max: { lastSeenAt: true } }),
    listPartners(session),
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
    messageCap += s.plan?.messageCap ?? s.msgMonthlyCap;
    if (s.plan?.storageCapMb !== null && s.plan?.storageCapMb !== undefined) {
      storageCapMb += s.plan.storageCapMb;
      anyStorageCap = true;
    }
  }

  // Overdue jobs, read the way /root/jobs reads them; imported late because jobs.ts imports this file for the daily reminder.
  const { jobStatuses } = await import("./jobs");
  const jobsOverdue = (await jobStatuses(now)).filter((j) => j.overdue).length;

  const partnerTiles = partners.map((p) => ({ id: p.id, name: p.name, percentTenths: p.percentTenths, schools: p.schools.length, owedThisMonthPaise: p.owedThisMonthPaise }));
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

export type OnboardResult = { ok: true; schoolId: string; code: string; slug: string; partnerId: string | null } | Refusal;

/**
 * The guided flow's one door: makes the school through createSchool, puts
 * it on the plan through assignPlan, records the subscription, the point
 * of contact and the partner (made inline if asked), and invites the first
 * administrator through inviteAdmin — the same three functions the
 * separate pages call, so nothing is written twice over.
 *
 * NOT ONE DATABASE TRANSACTION, and deliberately said: the three functions
 * it reuses each take the module's client, and threading a transaction
 * through them would mean copying them. Instead everything that can be
 * refused is checked BEFORE the first write — the slug, the plan, the
 * partner, the dates, the administrator's address — and the one write that
 * can still fail after the school exists (the invitation's mail) undoes the
 * school and the inline partner, so a refusal leaves nothing behind. A
 * given slug is used exactly; a taken one is refused rather than numbered,
 * because the operator typed it on purpose.
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
  if (input.commission && "partnerId" in input.commission && !(await db.commissionPartner.findUnique({ where: { id: input.commission.partnerId }, select: { id: true } }))) {
    return { ok: false, errorKey: "root.noSuchPartner" };
  }
  if (input.commission && "newPartner" in input.commission) {
    const problem = checkPartner(input.commission.newPartner);
    if (problem) return problem;
  }
  const today = todayKey("UTC", now);
  const startsAt = input.startsAt ?? today;
  const dueAt = input.dueAt ?? addDaysToKey(startsAt, input.trial ? 30 : 365);
  if (dayToDate(dueAt).getTime() <= dayToDate(startsAt).getTime()) return { ok: false, errorKey: "root.subscriptionDatesOrder" };
  const status: SubscriptionStatus = input.trial ? "TRIAL" : "ACTIVE";
  if (input.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contact.email.trim())) return { ok: false, errorKey: "root.emailLooksWrong" };

  const details: SchoolDetails = {
    name: input.name,
    contactEmail: input.contactEmail,
    timezone: input.timezone,
    city: input.city ?? null,
    region: input.region ?? null,
    country: input.country ?? null,
    gradeLow: input.gradeLow ?? null,
    gradeHigh: input.gradeHigh ?? null,
  };
  const made = await createSchool(session, details);
  if (!made.ok) return made;
  const schoolId = made.schoolId;

  let partnerId: string | null = null;
  let partnerMadeHere = false;
  const undo = async () => {
    await db.school.delete({ where: { id: schoolId } }).catch(() => undefined);
    if (partnerMadeHere && partnerId) await db.commissionPartner.delete({ where: { id: partnerId } }).catch(() => undefined);
  };

  try {
    if (slug) {
      try {
        await db.school.update({ where: { id: schoolId }, data: { slug } });
      } catch {
        await undo();
        return { ok: false, errorKey: "root.slugTaken" };
      }
    }
    if (input.commission && "partnerId" in input.commission) partnerId = input.commission.partnerId;
    if (input.commission && "newPartner" in input.commission) {
      const created = await createPartner(session, input.commission.newPartner);
      if (!created.ok) {
        await undo();
        return created;
      }
      partnerId = created.partnerId;
      partnerMadeHere = true;
    }
    await db.school.update({
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
      },
    });
    if (input.planId) {
      const assigned = await assignPlan(session, schoolId, input.planId);
      if (!assigned.ok) {
        await undo();
        return { ok: false, errorKey: assigned.errorKey ?? "root.didNotWork" };
      }
    }
    const invited = await inviteAdmin(session, schoolId, { email: adminEmail, name: input.adminName || null, role: "ADMIN" });
    if (!invited.ok) {
      await undo();
      return { ok: false, errorKey: invited.errorKey ?? "root.didNotWork" };
    }
  } catch (error) {
    await undo();
    throw error;
  }

  const row = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { slug: true } });
  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "superuser.school.onboard",
    targetType: "School",
    targetId: schoolId,
    meta: { schoolId, name: input.name.trim(), slug: row.slug, planId: input.planId ?? null, status, startsAt, dueAt, partnerId, adminEmail },
  });
  return { ok: true, schoolId, code: made.code, slug: row.slug, partnerId };
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
          await sendHealthDigestEmail(op.email, subject, body, `<p>${esc(body)}</p>`);
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
