import "server-only";
import { readerIsFixture } from "./fixtures";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { AccessError } from "./tenancy";
import { forSchool } from "./tenant-context";
import { currentAcademicYear } from "./academic-year";
import { isHttpsUrl } from "./app-admin";
import { gigSettings, monthKey, type GigResult, type GigSettingsView } from "./gig-questions";
import { HOLD_HOURS, UNPAID_SEAT_EXPIRY_MS, markCaptured, openCheckout, paymentSettings, paymentsOn, payoutAccountOf, refundSeatPayment, releaseDue, rupees, scheduleRelease, type PaymentSettings, type PayoutAccountView, type ReleaseRun, type SeatCheckout } from "./gig-payments";
import type { ActiveContext } from "./session";

/**
 * Gigs, the free tier: one-to-one sessions and workshops (decision 0004).
 *
 * A PROVIDER offers a time. An expert offers one-to-ones and workshops to
 * every school's pupils; a teacher offers one-to-one guidance to their own
 * school's pupils, once the school has switched that on. The session is held
 * on the provider's own meeting link; the platform books it, asks the
 * guardian, tells the school, records how it went and takes the rating.
 *
 * A PUPIL HAS A FREE ALLOWANCE in a school year (two one-to-ones and two
 * workshop seats, the operator's dials). A seat asked for counts against it
 * from the moment it is asked; it stops counting when it is given up in good
 * time, declined by the guardian, cancelled by the provider or the school, or
 * not held by the provider. The allowance is used first; past it a workshop
 * seat with a price is bought by a guardian (PAID SEATS, below), and a
 * one-to-one is never for sale.
 *
 * PAID SEATS (decision 0004, amended 2026-10-02). Mentoring is the condition
 * of charging, not the thing charged for: a one-to-one never carries a price,
 * and an expert may price a workshop seat only while they are KYC verified,
 * have a payout account the gateway will pay, keep an open free one-to-one
 * offer in the coming thirty days, and have given the period's free
 * one-to-ones (`paidGate`). A pupil's own ask on a paid seat waits for a
 * guardian's consent and then their payment; a guardian's own booking waits
 * for payment alone (PENDING_PAYMENT, the seat held, given back after half an
 * hour unpaid). The money is gig-payments.ts's: held until delivered plus
 * 48 hours, refunded in full when the family cancels in time, when anybody
 * else cancels, or when the expert does not hold it; a pupil's no-show and a
 * late cancellation pay the expert.
 *
 * A MINOR DOES NOT BOOK ALONE. A pupil's own ask waits for a guardian; a
 * guardian's booking for their child is confirmed at once. The meeting link
 * is shown to the pupil and their guardians only while the seat is confirmed,
 * and the school's office reads every booking of its pupils and may cancel one.
 *
 * WHO WRITES WHERE. A booking is the pupil's school's row. A pupil, a
 * guardian, a teacher and the office are bound to that school already. An
 * expert has no school: they read their own bookings by their own user id
 * (SELF_READABLE in scripts/gen-rls.ts), and what they write to one the
 * server writes under the school's binding (`forSchool`) after this file has
 * found the booking to be theirs. A slot is no school's row (NO_SCHOOL_POLICY)
 * and is guarded here.
 *
 * `seatsTaken` on a slot is a stored count with one writer, this file: a seat
 * is claimed in the booking's own transaction, and released by a guarded
 * decrement straight after the one conditional update that cancels the
 * booking, so a release lost to a crash leaves a seat held and never sold twice.
 */
export const SESSION_KINDS = ["ONE_TO_ONE", "WORKSHOP"] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];
export const BOOKING_STATUSES = ["PENDING_CONSENT", "PENDING_PAYMENT", "CONFIRMED", "CANCELLED", "DELIVERED", "MISSED", "UNHELD"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const ONE_TO_ONE_MINUTES = 30;
const LIVE: BookingStatus[] = ["PENDING_CONSENT", "PENDING_PAYMENT", "CONFIRMED"];
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** An open free one-to-one offer counts within this many days ahead. */
export const MENTORING_OFFER_DAYS = 30;

class Refusal extends Error {
  constructor(readonly errorKey: TranslationKey, readonly vars?: Record<string, string | number>) {
    super(errorKey);
  }
}
const refused = (error: unknown): GigResult<never> | null => (error instanceof Refusal ? { ok: false, errorKey: error.errorKey, vars: error.vars } : null);

/* -------------------------------------------------------------------------- */
/* Who is who                                                                  */
/* -------------------------------------------------------------------------- */

/** ALUMNUS (4 Oct 2026): a college's alumnus mentor, whose free one-to-ones are written by src/lib/placement-alumni.ts and held to the college like a teacher's. */
type Provider = { userId: string; kind: "EXPERT" | "TEACHER" | "ALUMNUS"; schoolId: string | null; timeZone?: string };

/** An expert on the list, or a teacher whose school has switched guidance on. Null for a teacher whose school has not. */
async function providerOrOff(ctx: ActiveContext): Promise<Provider | null> {
  if (ctx.role === "EXPERT") {
    const profile = await db.expertProfile.findUnique({ where: { userId: ctx.user.id }, select: { publishedAt: true, timezone: true } });
    if (!profile?.publishedAt) throw new AccessError("access.notAnExpert");
    return { userId: ctx.user.id, kind: "EXPERT", schoolId: null, timeZone: profile.timezone };
  }
  if (ctx.role === "TEACHER" && ctx.schoolId && ctx.membershipId) {
    const school = await db.school.findUnique({ where: { id: ctx.schoolId }, select: { teacherGuidanceOn: true, timezone: true } });
    return school?.teacherGuidanceOn ? { userId: ctx.user.id, kind: "TEACHER", schoolId: ctx.schoolId, timeZone: school.timezone } : null;
  }
  throw new AccessError("access.wrongRoleForThisAction");
}
async function provider(ctx: ActiveContext): Promise<Provider> {
  const p = await providerOrOff(ctx);
  if (!p) throw new AccessError("gigs.refuseGuidanceOff");
  return p;
}
/**
 * Whoever may HAVE offered a time: an expert or a teacher, by their role alone. What was offered while
 * a school's switch was on, or while an expert was on the list, is still theirs to mark and to cancel.
 */
function offerer(ctx: ActiveContext): Provider {
  if (ctx.role === "EXPERT") return { userId: ctx.user.id, kind: "EXPERT", schoolId: null };
  if (ctx.role === "TEACHER" && ctx.schoolId) return { userId: ctx.user.id, kind: "TEACHER", schoolId: ctx.schoolId };
  // An alumnus mentor marks and cancels what they offered (placement-alumni.ts writes the slot, never priced).
  if (ctx.role === "ALUMNUS" && ctx.schoolId) return { userId: ctx.user.id, kind: "ALUMNUS", schoolId: ctx.schoolId };
  throw new AccessError("access.wrongRoleForThisAction");
}

type Child = { membershipId: string; schoolId: string; userId: string; name: string; isMinor: boolean; schoolName: string; timeZone: string };

const CHILD_SELECT = { id: true, schoolId: true, userId: true, role: true, status: true, leftAt: true, user: { select: { name: true, preferredName: true, isMinor: true } }, school: { select: { name: true, timezone: true } } } as const;
type ChildRow = { id: string; schoolId: string; userId: string; role: string; status: string; leftAt: Date | null; user: { name: string; preferredName: string | null; isMinor: boolean }; school: { name: string; timezone: string } };
const asChild = (m: ChildRow): Child => ({ membershipId: m.id, schoolId: m.schoolId, userId: m.userId, name: m.user.preferredName ?? m.user.name, isMinor: m.user.isMinor, schoolName: m.school.name, timeZone: m.school.timezone });
const onRoll = (m: ChildRow) => m.role === "STUDENT" && m.status === "ACTIVE" && m.leftAt === null;

/** The pupils a family session is about: the pupil themself, or every child a guardian has on a roll. */
async function children(ctx: ActiveContext): Promise<Child[]> {
  if (ctx.role === "STUDENT" && ctx.membershipId) {
    const m = await db.membership.findUnique({ where: { id: ctx.membershipId }, select: CHILD_SELECT });
    return m && onRoll(m) ? [asChild(m)] : [];
  }
  if (ctx.role === "PARENT") {
    const links = await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { student: { select: CHILD_SELECT } } });
    return links.map((l) => l.student).filter(onRoll).map(asChild);
  }
  throw new AccessError("access.wrongRoleForThisAction");
}
/** The one pupil an act is for. A guardian names the child; one that is not theirs is not found. */
async function child(ctx: ActiveContext, studentMembershipId?: string | null): Promise<Child> {
  const all = await children(ctx);
  const one = ctx.role === "STUDENT" ? all[0] : studentMembershipId ? all.find((c) => c.membershipId === studentMembershipId) : all[0];
  if (!one) throw new AccessError("gigs.noSuchChild", "NOT_FOUND");
  return one;
}

/* -------------------------------------------------------------------------- */
/* The allowance                                                               */
/* -------------------------------------------------------------------------- */

export type Allowance = Record<SessionKind, { allowed: number; used: number; left: number }>;

type BookingReader = Pick<typeof db, "gigBooking">;
/**
 * What counts against a pupil's allowance in the school year: a seat asked for
 * or confirmed, a session delivered, one the pupil missed, and one given up
 * too late. With no current year on the school's books, the last twelve months.
 */
async function usedBy(client: BookingReader, c: Child, yearId: string | null): Promise<Record<SessionKind, number>> {
  const rows = await client.gigBooking.groupBy({
    by: ["kind"],
    where: {
      schoolId: c.schoolId,
      studentMembershipId: c.membershipId,
      ...(yearId ? { academicYearId: yearId } : { createdAt: { gte: new Date(Date.now() - 365 * 24 * HOUR) } }),
      // A paid seat draws on no allowance.
      paid: false,
      OR: [{ status: { in: ["PENDING_CONSENT", "CONFIRMED", "DELIVERED", "MISSED"] } }, { status: "CANCELLED", lateCancel: true }],
    },
    _count: { _all: true },
  });
  const of = (kind: SessionKind) => rows.find((r) => r.kind === kind)?._count._all ?? 0;
  return { ONE_TO_ONE: of("ONE_TO_ONE"), WORKSHOP: of("WORKSHOP") };
}
const allowed = (settings: GigSettingsView): Record<SessionKind, number> => ({ ONE_TO_ONE: settings.pupilFreeOneToOnes, WORKSHOP: settings.pupilFreeWorkshops });
async function allowanceOf(c: Child, settings: GigSettingsView): Promise<Allowance> {
  const year = await currentAcademicYear(c.schoolId);
  const used = await usedBy(db, c, year?.id ?? null);
  const cap = allowed(settings);
  const row = (kind: SessionKind) => ({ allowed: cap[kind], used: used[kind], left: Math.max(0, cap[kind] - used[kind]) });
  return { ONE_TO_ONE: row("ONE_TO_ONE"), WORKSHOP: row("WORKSHOP") };
}

/* -------------------------------------------------------------------------- */
/* The provider's side                                                         */
/* -------------------------------------------------------------------------- */

export type SlotInput = { kind: SessionKind; title: string; startsAt: string; minutes?: number; meetingUrl: string; seats?: number; /** A workshop seat's price past a pupil's allowance; refused on a one-to-one and behind the paid gate. */ pricePaise?: number };

/* -------------------------------------------------------------------------- */
/* Free duty (decision 0004)                                                   */
/* -------------------------------------------------------------------------- */

export type FreeDuty = {
  /** Free one-to-ones still owed in this period. */
  oneToOnes: number;
  /** Free workshops still owed in this period. */
  workshops: number;
  period: { month: string; quarter: string };
  stage: { oneToOnes: "START" | "ONGOING"; workshops: "START" | "ONGOING" };
  asked: { startOneToOnes: number; startWorkshops: number; monthlyOneToOnes: number; quarterlyWorkshops: number };
  dutyDone: boolean;
};

/** "2026-Q4" for a month key, in the same clock the month key is read in. */
export const quarterKey = (month: string): string => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
};

/**
 * What an expert still owes free before a price may be asked (decision 0004):
 * the first `expertStartOneToOnes` one-to-ones and `expertStartWorkshops`
 * workshops free, and after those `expertMonthlyOneToOnes` a month and
 * `expertQuarterlyWorkshops` a quarter. Counted from sessions DELIVERED — a
 * seat asked for or missed owes nothing either way — a workshop once however
 * many seats it held, by the clock the gig month is read in (monthKey).
 *
 * This is the gate the paid path will use and the only place the rule lives:
 * `offerSlot` refuses a price while anything here is owed, and the expert's
 * home reads it as "2 free one-to-ones left this month".
 */
export async function freeDutyRemaining(expertUserId: string, now: Date = new Date()): Promise<FreeDuty> {
  const settings = await gigSettings();
  const delivered = await db.gigBooking.findMany({ where: { providerUserId: expertUserId, status: "DELIVERED" }, select: { kind: true, slotId: true, slot: { select: { startsAt: true } } } });
  const month = monthKey(now);
  const quarter = quarterKey(month);
  const ones = delivered.filter((d) => d.kind === "ONE_TO_ONE");
  const workshops = new Map(delivered.filter((d) => d.kind === "WORKSHOP").map((d) => [d.slotId, d.slot.startsAt] as const));
  const oneStage = ones.length < settings.expertStartOneToOnes ? "START" : "ONGOING";
  const workshopStage = workshops.size < settings.expertStartWorkshops ? "START" : "ONGOING";
  const oneToOnes = oneStage === "START" ? settings.expertStartOneToOnes - ones.length : Math.max(0, settings.expertMonthlyOneToOnes - ones.filter((d) => monthKey(d.slot.startsAt) === month).length);
  const owedWorkshops = workshopStage === "START" ? settings.expertStartWorkshops - workshops.size : Math.max(0, settings.expertQuarterlyWorkshops - [...workshops.values()].filter((at) => quarterKey(monthKey(at)) === quarter).length);
  return {
    oneToOnes,
    workshops: owedWorkshops,
    period: { month, quarter },
    stage: { oneToOnes: oneStage, workshops: workshopStage },
    asked: { startOneToOnes: settings.expertStartOneToOnes, startWorkshops: settings.expertStartWorkshops, monthlyOneToOnes: settings.expertMonthlyOneToOnes, quarterlyWorkshops: settings.expertQuarterlyWorkshops },
    dutyDone: oneToOnes === 0 && owedWorkshops === 0,
  };
}

/* -------------------------------------------------------------------------- */
/* The paid gate (decision 0004, amended 2026-10-02)                            */
/* -------------------------------------------------------------------------- */

export type PaidGate = {
  /** The operator's switch, and a gateway to speak to. */
  paymentsOn: boolean;
  kycVerified: boolean;
  payoutActive: boolean;
  /** A free one-to-one — a GigSlot or an ExpertSlot window — offered in the coming thirty days. */
  mentoringOffer: boolean;
  /** The period's free one-to-ones given (freeDutyRemaining). */
  dutyDone: boolean;
  oneToOnesOwed: number;
  canCharge: boolean;
  seatPriceMinPaise: number;
  seatPriceMaxPaise: number;
  commissionPercent: number;
};

/**
 * Whether an expert may put a price on a workshop seat, and why not. The
 * four conditions in the order they are shown: identity checked, payee
 * details for the company to pay (active, not suspended), an open free
 * one-to-one offer, and the period's free one-to-ones given. The free workshop quota stays something the expert is
 * asked for and shown, not a gate: mentoring is the price of charging.
 */
export async function paidGate(expertUserId: string, now: Date = new Date(), settings?: PaymentSettings): Promise<PaidGate> {
  const pay = settings ?? (await paymentSettings());
  const on = pay.paymentsEnabled && pay.transport !== "off";
  const [profile, payout, duty, gigOffer, expertOffer] = await Promise.all([
    db.expertProfile.findUnique({ where: { userId: expertUserId }, select: { kycStatus: true } }),
    payoutAccountOf(expertUserId),
    freeDutyRemaining(expertUserId, now),
    db.gigSlot.count({ where: { providerUserId: expertUserId, kind: "ONE_TO_ONE", pricePaise: 0, cancelledAt: null, startsAt: { gt: now, lte: new Date(now.getTime() + MENTORING_OFFER_DAYS * DAY) } } }),
    db.expertSlot.count({ where: { expert: { userId: expertUserId }, cancelledAt: null, bookedAt: null, startsAt: { gt: now, lte: new Date(now.getTime() + MENTORING_OFFER_DAYS * DAY) } } }),
  ]);
  const gate = { paymentsOn: on, kycVerified: profile?.kycStatus === "VERIFIED", payoutActive: payout.status === "ACTIVE", mentoringOffer: gigOffer + expertOffer > 0, dutyDone: duty.oneToOnes === 0, oneToOnesOwed: duty.oneToOnes };
  return { ...gate, canCharge: gate.paymentsOn && gate.kycVerified && gate.payoutActive && gate.mentoringOffer && gate.dutyDone, seatPriceMinPaise: pay.seatPriceMinPaise, seatPriceMaxPaise: pay.seatPriceMaxPaise, commissionPercent: pay.commissionPercent };
}

/** The expert's "Get paid" card: the payee details the company pays (the sealed account never among them), and the four conditions. */
export async function expertPayoutStanding(ctx: ActiveContext, now: Date = new Date()): Promise<{ payout: PayoutAccountView; gate: PaidGate }> {
  if (ctx.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const payout = await payoutAccountOf(ctx.user.id);
  return { payout, gate: await paidGate(ctx.user.id, now) };
}

/** A provider offers a time. */
export async function offerSlot(ctx: ActiveContext, input: SlotInput, now: Date = new Date()): Promise<GigResult<{ slotId: string }>> {
  const me = await provider(ctx);
  const settings = await gigSettings();
  if (me.kind === "TEACHER" && input.kind !== "ONE_TO_ONE") return { ok: false, errorKey: "gigs.refuseTeacherWorkshop" };
  const pricePaise = Math.round(input.pricePaise ?? 0);
  if (pricePaise < 0) return { ok: false, errorKey: "gigs.refusePrice", vars: { min: "", max: "" } };
  if (pricePaise > 0) {
    // THE PAID GATE, in the order the decisions stack: a one-to-one is never priced and a teacher's
    // guidance is always free (0004 as amended); an expert prices a workshop seat only through the
    // four conditions of paidGate, each refused by name; and the price must lie in the band.
    if (input.kind === "ONE_TO_ONE") return { ok: false, errorKey: "gigs.refuseOneToOnePriced" };
    if (me.kind !== "EXPERT") return { ok: false, errorKey: "gigs.refuseTeacherPaid" };
    const gate = await paidGate(me.userId, now);
    if (!gate.paymentsOn) return { ok: false, errorKey: "gigs.refusePaymentsOff" };
    if (!gate.kycVerified) return { ok: false, errorKey: "gigs.refuseNeedKyc" };
    if (!gate.payoutActive) return { ok: false, errorKey: "gigs.refuseNeedPayout" };
    if (!gate.mentoringOffer) return { ok: false, errorKey: "gigs.refuseNeedMentoring", vars: { days: MENTORING_OFFER_DAYS } };
    if (!gate.dutyDone) return { ok: false, errorKey: "gigs.freeDutyFirst", vars: { count: gate.oneToOnesOwed } };
    if (pricePaise < gate.seatPriceMinPaise || pricePaise > gate.seatPriceMaxPaise) return { ok: false, errorKey: "gigs.refusePrice", vars: { min: rupees(gate.seatPriceMinPaise), max: rupees(gate.seatPriceMaxPaise) } };
  }
  const title = input.title.trim();
  if (title.length < 5 || title.length > 120) return { ok: false, errorKey: "gigs.refuseSlotTitle" };
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, errorKey: "gigs.refuseSlotTime" };
  if (startsAt.getTime() < now.getTime() + HOUR) return { ok: false, errorKey: "gigs.refuseSlotTooSoon" };
  if (startsAt.getTime() > now.getTime() + 120 * 24 * HOUR) return { ok: false, errorKey: "gigs.refuseSlotTooFar" };
  const minutes = input.kind === "ONE_TO_ONE" ? ONE_TO_ONE_MINUTES : Math.round(input.minutes ?? 60);
  if (minutes < 30 || minutes > 180) return { ok: false, errorKey: "gigs.refuseSlotLength" };
  const seats = input.kind === "ONE_TO_ONE" ? 1 : Math.round(input.seats ?? settings.workshopMaxSeats);
  if (seats < (input.kind === "ONE_TO_ONE" ? 1 : 2) || seats > settings.workshopMaxSeats) return { ok: false, errorKey: "gigs.refuseSeats", vars: { count: settings.workshopMaxSeats } };
  const meetingUrl = input.meetingUrl.trim();
  if (meetingUrl.length > 500 || !isHttpsUrl(meetingUrl)) return { ok: false, errorKey: "gigs.refuseMeetingUrl" };
  const endsAt = new Date(startsAt.getTime() + minutes * 60_000);
  const clash = await db.gigSlot.findFirst({ where: { providerUserId: me.userId, cancelledAt: null, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }, select: { id: true } });
  if (clash) return { ok: false, errorKey: "gigs.refuseSlotOverlap" };
  const slot = await db.gigSlot.create({ data: { providerUserId: me.userId, providerKind: me.kind, teacherSchoolId: me.schoolId, kind: input.kind, title, startsAt, endsAt, meetingUrl, seats, pricePaise }, select: { id: true } });
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "gig.slot.offer", targetType: "GigSlot", targetId: slot.id, meta: { kind: input.kind, seats, pricePaise } });
  return { ok: true, slotId: slot.id };
}

type BookingRow = { id: string; schoolId: string; slotId: string; studentMembershipId: string; providerUserId: string; kind: string; status: string; purpose: string; lateCancel: boolean; paid: boolean; rating: number | null; feedback: string | null; createdAt: Date };
const BOOKING_SELECT = { id: true, schoolId: true, slotId: true, studentMembershipId: true, providerUserId: true, kind: true, status: true, purpose: true, lateCancel: true, paid: true, rating: true, feedback: true, createdAt: true } as const;

/** The pupils behind a provider's bookings, read school by school under each school's binding. */
async function pupilNames(bookings: BookingRow[]): Promise<Map<string, { name: string; schoolName: string; userId: string }>> {
  const out = new Map<string, { name: string; schoolName: string; userId: string }>();
  for (const schoolId of new Set(bookings.map((b) => b.schoolId))) {
    const ids = bookings.filter((b) => b.schoolId === schoolId).map((b) => b.studentMembershipId);
    const rows = await forSchool(schoolId, () => db.membership.findMany({ where: { id: { in: ids }, schoolId }, select: { id: true, userId: true, user: { select: { name: true, preferredName: true } }, school: { select: { name: true } } } }));
    for (const r of rows) out.set(r.id, { name: r.user.preferredName ?? r.user.name, schoolName: r.school.name, userId: r.userId });
  }
  return out;
}

export type ProviderSlot = {
  id: string;
  kind: SessionKind;
  title: string;
  startsAt: string;
  endsAt: string;
  meetingUrl: string;
  seats: number;
  seatsTaken: number;
  /** A workshop seat's price past a pupil's allowance; 0 is free. */
  pricePaise: number;
  cancelled: boolean;
  /** It has begun, so its seats can be marked. */
  started: boolean;
  bookings: { id: string; pupilName: string; schoolName: string; purpose: string; status: BookingStatus; paid: boolean; rating: number | null; feedback: string | null }[];
};
export type Duty = { deliveredOneToOnes: number; heldWorkshops: number; oneToOnesThisMonth: number; workshopsThisQuarter: number; startOneToOnes: number; startWorkshops: number; monthlyOneToOnes: number; quarterlyWorkshops: number };
export type ProviderView = { enabled: boolean; kind: "EXPERT" | "TEACHER"; /** The clock the times are read in: the expert's own, or the teacher's school's. */ timeZone: string; duty: Duty | null; /** An expert's standing to charge, condition by condition; null for a teacher. */ gate: PaidGate | null; slots: ProviderSlot[] };

const quarterStart = (at: Date) => new Date(Date.UTC(at.getUTCFullYear(), Math.floor(at.getUTCMonth() / 3) * 3, 1));

/** A provider's offered times, who has a seat in each, and what they have given free against what is asked. */
export async function mySlots(ctx: ActiveContext, now: Date = new Date()): Promise<ProviderView> {
  const me = await providerOrOff(ctx);
  if (!me) return { enabled: false, kind: "TEACHER", timeZone: "Asia/Kolkata", duty: null, gate: null, slots: [] };
  const settings = await gigSettings();
  const slots = await db.gigSlot.findMany({ where: { providerUserId: me.userId, startsAt: { gte: new Date(now.getTime() - 60 * 24 * HOUR) } }, orderBy: { startsAt: "asc" }, take: 300 });
  const bookings: BookingRow[] = slots.length ? await db.gigBooking.findMany({ where: { providerUserId: me.userId, slotId: { in: slots.map((s) => s.id) }, status: { not: "CANCELLED" } }, orderBy: { createdAt: "asc" }, select: BOOKING_SELECT }) : [];
  const names = await pupilNames(bookings);
  const delivered = await db.gigBooking.findMany({ where: { providerUserId: me.userId, status: "DELIVERED" }, select: { kind: true, slotId: true, slot: { select: { startsAt: true } } } });
  const month = monthKey(now);
  const workshops = new Map(delivered.filter((d) => d.kind === "WORKSHOP").map((d) => [d.slotId, d.slot.startsAt] as const));
  const duty: Duty = {
    deliveredOneToOnes: delivered.filter((d) => d.kind === "ONE_TO_ONE").length,
    heldWorkshops: workshops.size,
    oneToOnesThisMonth: delivered.filter((d) => d.kind === "ONE_TO_ONE" && monthKey(d.slot.startsAt) === month).length,
    workshopsThisQuarter: [...workshops.values()].filter((at) => at >= quarterStart(now)).length,
    startOneToOnes: me.kind === "EXPERT" ? settings.expertStartOneToOnes : 0,
    startWorkshops: me.kind === "EXPERT" ? settings.expertStartWorkshops : 0,
    monthlyOneToOnes: me.kind === "EXPERT" ? settings.expertMonthlyOneToOnes : settings.teacherMonthlyGuidance,
    quarterlyWorkshops: me.kind === "EXPERT" ? settings.expertQuarterlyWorkshops : 0,
  };
  return {
    enabled: true,
    // providerOrOff answers an expert or a teacher; an alumnus mentor's times are placement-alumni.ts's.
    kind: me.kind === "EXPERT" ? "EXPERT" : "TEACHER",
    timeZone: me.timeZone ?? "Asia/Kolkata",
    duty,
    gate: me.kind === "EXPERT" ? await paidGate(me.userId, now) : null,
    slots: slots.map((s) => ({
      id: s.id,
      kind: s.kind as SessionKind,
      title: s.title,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      meetingUrl: s.meetingUrl,
      seats: s.seats,
      seatsTaken: s.seatsTaken,
      pricePaise: s.pricePaise,
      cancelled: s.cancelledAt !== null,
      started: s.startsAt <= now,
      bookings: bookings
        .filter((b) => b.slotId === s.id)
        .map((b) => ({ id: b.id, pupilName: names.get(b.studentMembershipId)?.name ?? "", schoolName: names.get(b.studentMembershipId)?.schoolName ?? "", purpose: b.purpose, status: b.status as BookingStatus, paid: b.paid, rating: b.rating, feedback: b.feedback })),
    })),
  };
}

/** Tells a pupil and their guardians, under the pupil's school's binding. */
async function tellFamily(booking: { schoolId: string; studentMembershipId: string }, pupilUserId: string | null, build: () => { titleKey: TranslationKey; titleVars?: Record<string, string | number>; body?: string; url: string; kind: "EXPERT" | "SYSTEM" }): Promise<void> {
  await forSchool(booking.schoolId, async () => {
    const note = build();
    if (pupilUserId) await notify({ userId: pupilUserId, schoolId: booking.schoolId, ...note });
    await notifyGuardians(booking.studentMembershipId, () => ({ schoolId: booking.schoolId, ...note }));
  }).catch((error) => console.error("[gig-sessions] family notice failed", error));
}
const noteKind = (providerKind: string): "EXPERT" | "SYSTEM" => (providerKind === "EXPERT" ? "EXPERT" : "SYSTEM");

/** The provider takes a time back. Every seat in it is cancelled, none counted against a pupil, and each family is told. */
export async function cancelSlot(ctx: ActiveContext, slotId: string, reason: string): Promise<GigResult> {
  const me = offerer(ctx);
  const slot = await db.gigSlot.findFirst({ where: { id: slotId, providerUserId: me.userId } });
  if (!slot) throw new AccessError("gigs.noSuchSlot", "NOT_FOUND");
  if (slot.cancelledAt) return { ok: true };
  const why = reason.trim().slice(0, 300);
  if (why.length < 5) return { ok: false, errorKey: "gigs.needReason" };
  if (slot.startsAt <= new Date()) return { ok: false, errorKey: "gigs.refuseStarted" };
  const taken = await db.gigSlot.updateMany({ where: { id: slot.id, cancelledAt: null }, data: { cancelledAt: new Date(), cancelReason: why, seatsTaken: 0 } });
  if (taken.count === 0) return { ok: true };
  const live: BookingRow[] = await db.gigBooking.findMany({ where: { providerUserId: me.userId, slotId: slot.id, status: { in: LIVE } }, select: BOOKING_SELECT });
  const names = await pupilNames(live);
  for (const b of live) {
    await forSchool(b.schoolId, () => db.gigBooking.updateMany({ where: { id: b.id, schoolId: b.schoolId, status: { in: LIVE } }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelledByUserId: me.userId, cancelReason: why, lateCancel: false } }));
    await forSchool(b.schoolId, () => audit({ schoolId: b.schoolId, actorUserId: me.userId, action: "gig.booking.cancel", targetType: "GigBooking", targetId: b.id, meta: { by: "provider", slotCancelled: true } }));
    await tellFamily(b, names.get(b.studentMembershipId)?.userId ?? null, () => ({ kind: noteKind(slot.providerKind), titleKey: "gigs.notifSlotCancelled", titleVars: { title: slot.title }, body: why, url: "/sessions" }));
    if (b.paid) await refundPaidSeat(b, names.get(b.studentMembershipId)?.userId ?? null, `provider-cancelled-slot: ${why}`, me.userId);
  }
  await audit({ schoolId: me.schoolId, actorUserId: me.userId, action: "gig.slot.cancel", targetType: "GigSlot", targetId: slot.id, meta: { seats: live.length } });
  return { ok: true };
}

/** After it has begun, the provider says how a seat went: held, or the pupil did not come. */
export async function closeBooking(ctx: ActiveContext, bookingId: string, outcome: "DELIVERED" | "MISSED", now: Date = new Date()): Promise<GigResult> {
  const me = offerer(ctx);
  const b = await db.gigBooking.findFirst({ where: { id: bookingId, providerUserId: me.userId }, select: { ...BOOKING_SELECT, slot: { select: { title: true, startsAt: true, providerKind: true } } } });
  if (!b) throw new AccessError("gigs.noSuchBooking", "NOT_FOUND");
  if (b.status === outcome) return { ok: true };
  if (b.status !== "CONFIRMED") return { ok: false, errorKey: "gigs.refuseNotConfirmed" };
  if (b.slot.startsAt > now) return { ok: false, errorKey: "gigs.refuseNotYet" };
  const changed = await forSchool(b.schoolId, () => db.gigBooking.updateMany({ where: { id: b.id, schoolId: b.schoolId, status: "CONFIRMED" }, data: { status: outcome, closedAt: now } }));
  if (changed.count === 0) return { ok: false, errorKey: "gigs.refuseNotConfirmed" };
  await forSchool(b.schoolId, () => audit({ schoolId: b.schoolId, actorUserId: me.userId, action: outcome === "DELIVERED" ? "gig.booking.delivered" : "gig.booking.missed", targetType: "GigBooking", targetId: b.id }));
  // Held or missed, a paid seat pays the expert once the hold has run: delivered plus 48 hours, and a
  // pupil's no-show the same (decision 0004).
  if (b.paid) await scheduleRelease(b.id, new Date(now.getTime() + HOLD_HOURS * HOUR), outcome);
  if (outcome === "DELIVERED") {
    const names = await pupilNames([b]);
    await tellFamily(b, names.get(b.studentMembershipId)?.userId ?? null, () => ({ kind: noteKind(b.slot.providerKind), titleKey: "gigs.notifDelivered", titleVars: { title: b.slot.title }, url: "/sessions" }));
  }
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* The family's side                                                           */
/* -------------------------------------------------------------------------- */

export type OpenSlot = { id: string; kind: SessionKind; title: string; startsAt: string; endsAt: string; seatsLeft: number; providerName: string; providerKind: "EXPERT" | "TEACHER" | "ALUMNUS"; providerHeadline: string | null; /** What a seat costs past the pupil's allowance; 0 is free. */ pricePaise: number; /** This pupil still has a free seat of this kind, so the price is not asked. */ freeSeat: boolean };

/** The times a pupil could take a seat in: published experts' and their own school's teachers', not begun, not full, not already theirs. */
async function openFor(c: Child, now: Date, allowance: Allowance): Promise<OpenSlot[]> {
  const slots = await db.gigSlot.findMany({
    where: { cancelledAt: null, startsAt: { gt: now }, OR: [{ providerKind: "EXPERT" }, { providerKind: { in: ["TEACHER", "ALUMNUS"] }, teacherSchoolId: c.schoolId }], ...(await readerIsFixture(c.schoolId) ? {} : { provider: { isTestFixture: false } }) },
    orderBy: { startsAt: "asc" },
    take: 300,
    select: { id: true, kind: true, title: true, startsAt: true, endsAt: true, seats: true, seatsTaken: true, pricePaise: true, providerKind: true, providerUserId: true, provider: { select: { name: true, expertProfile: { select: { headline: true, publishedAt: true } } } } },
  });
  const mine = new Set((await db.gigBooking.findMany({ where: { schoolId: c.schoolId, studentMembershipId: c.membershipId, status: { in: LIVE } }, select: { slotId: true } })).map((b) => b.slotId));
  return slots
    .filter((s) => s.seatsTaken < s.seats && !mine.has(s.id) && (s.providerKind !== "EXPERT" || Boolean(s.provider.expertProfile?.publishedAt)) && s.providerUserId !== c.userId)
    .map((s) => ({ id: s.id, kind: s.kind as SessionKind, title: s.title, startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), seatsLeft: s.seats - s.seatsTaken, providerName: s.provider.name, providerKind: s.providerKind as "EXPERT" | "TEACHER" | "ALUMNUS", providerHeadline: s.providerKind === "EXPERT" ? (s.provider.expertProfile?.headline ?? null) : null, pricePaise: s.pricePaise, freeSeat: allowance[s.kind as SessionKind].left > 0 }));
}

export type FamilyBooking = {
  id: string;
  kind: SessionKind;
  title: string;
  startsAt: string;
  endsAt: string;
  providerName: string;
  providerKind: "EXPERT" | "TEACHER" | "ALUMNUS";
  purpose: string;
  status: BookingStatus;
  /** The provider's room, only while the seat is confirmed and the session is not long over. */
  meetingUrl: string | null;
  lateCancel: boolean;
  rating: number | null;
  /** A seat bought past the allowance, what the slot asks a seat, and where its money stands. */
  paid: boolean;
  pricePaise: number;
  payment: { paymentId: string; status: string; amountPaise: number; refundedAt: string | null } | null;
  canConsent: boolean;
  /** A guardian may pay for it now (PENDING_PAYMENT, not begun). */
  canPay: boolean;
  canCancel: boolean;
  canRate: boolean;
  canReportUnheld: boolean;
};
export type FamilyChild = { id: string; name: string; schoolName: string; /** The school's clock, which the times are read in. */ timeZone: string; allowance: Allowance; bookings: FamilyBooking[]; open: OpenSlot[] };

/** Everything a pupil, or a guardian for each of their children, sees of sessions: the allowance, their seats, and what is open. */
export async function familySessions(ctx: ActiveContext, now: Date = new Date()): Promise<{ children: FamilyChild[]; /** A confirmed seat given up inside this many hours of the start still counts. */ freeCancelHours: number; /** The operator's switch: a priced seat past the allowance can be bought. */ paymentsOn: boolean }> {
  const all = await children(ctx);
  const settings = await gigSettings();
  const out: FamilyChild[] = [];
  for (const c of all) {
    const rows = await db.gigBooking.findMany({
      where: { schoolId: c.schoolId, studentMembershipId: c.membershipId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { ...BOOKING_SELECT, slot: { select: { title: true, startsAt: true, endsAt: true, meetingUrl: true, providerKind: true, pricePaise: true, provider: { select: { name: true } } } }, payment: { select: { id: true, status: true, amountPaise: true, refundedAt: true } } },
    });
    const allowance = await allowanceOf(c, settings);
    out.push({
      id: c.membershipId,
      name: c.name,
      schoolName: c.schoolName,
      timeZone: c.timeZone,
      allowance,
      open: await openFor(c, now, allowance),
      bookings: rows.map((b) => {
        const status = b.status as BookingStatus;
        const begun = b.slot.startsAt <= now;
        const over = b.slot.endsAt <= now;
        return {
          id: b.id,
          kind: b.kind as SessionKind,
          title: b.slot.title,
          startsAt: b.slot.startsAt.toISOString(),
          endsAt: b.slot.endsAt.toISOString(),
          providerName: b.slot.provider.name,
          providerKind: b.slot.providerKind as "EXPERT" | "TEACHER" | "ALUMNUS",
          purpose: b.purpose,
          status,
          meetingUrl: status === "CONFIRMED" && now.getTime() < b.slot.endsAt.getTime() + 2 * HOUR ? b.slot.meetingUrl : null,
          lateCancel: b.lateCancel,
          rating: b.rating,
          paid: b.paid,
          pricePaise: b.slot.pricePaise,
          payment: b.payment ? { paymentId: b.payment.id, status: b.payment.status, amountPaise: b.payment.amountPaise, refundedAt: b.payment.refundedAt?.toISOString() ?? null } : null,
          canConsent: ctx.role === "PARENT" && status === "PENDING_CONSENT" && !begun,
          canPay: ctx.role === "PARENT" && status === "PENDING_PAYMENT" && !begun,
          canCancel: LIVE.includes(status) && !begun,
          canRate: status === "DELIVERED" && b.rating === null,
          canReportUnheld: status === "CONFIRMED" && over,
        };
      }),
    });
  }
  return { children: out, freeCancelHours: settings.freeCancelHours, paymentsOn: await paymentsOn() };
}

async function tellProvider(schoolId: string, slot: { providerUserId: string; providerKind: string; title: string }, titleKey: TranslationKey, vars: Record<string, string | number>, body?: string): Promise<void> {
  await forSchool(schoolId, () => notify({ userId: slot.providerUserId, schoolId, kind: noteKind(slot.providerKind), titleKey, titleVars: { title: slot.title, ...vars }, body, url: slot.providerKind === "EXPERT" ? "/expert/sessions" : slot.providerKind === "ALUMNUS" ? "/alumni/college" : "/teacher/guidance" })).catch((error) => console.error("[gig-sessions] provider notice failed", error));
}
/** The office is told when an outside adult is to meet one of its pupils. */
async function tellOffice(c: Child, slot: { title: string; providerKind: string }, providerName: string): Promise<void> {
  if (slot.providerKind !== "EXPERT") return;
  const office = await db.membership.findMany({ where: { schoolId: c.schoolId, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { userId: true } });
  await Promise.all(office.map((m) => notify({ userId: m.userId, schoolId: c.schoolId, kind: "EXPERT", titleKey: "gigs.notifOffice", titleVars: { name: c.name, provider: providerName }, body: slot.title, url: "/admin/sessions" }).catch((error) => console.error("[gig-sessions] office notice failed", error))));
}

/**
 * A pupil asks for a seat, or a guardian takes one for their child.
 *
 * ONE TRANSACTION under a lock on the pupil's own membership row: the
 * allowance is counted, the seat is claimed by a conditional update that
 * cannot take a slot past its seats, and the booking is written, together or
 * not at all. Two asks at once for the same pupil go one after the other; two
 * pupils after the last seat, one gets it.
 */
export async function bookSeat(ctx: ActiveContext, input: { slotId: string; studentMembershipId?: string | null; purpose: string }, now: Date = new Date()): Promise<GigResult<{ bookingId: string; status: BookingStatus; /** A paid seat a guardian took: the order to pay, now. */ checkout: SeatCheckout | null }>> {
  const c = await child(ctx, input.studentMembershipId);
  const purpose = input.purpose.trim().slice(0, 500);
  if (purpose.length < 10) return { ok: false, errorKey: "gigs.needPurpose" };
  const slot = await db.gigSlot.findUnique({ where: { id: input.slotId }, select: { id: true, kind: true, title: true, startsAt: true, cancelledAt: true, pricePaise: true, providerKind: true, providerUserId: true, teacherSchoolId: true, provider: { select: { name: true, expertProfile: { select: { publishedAt: true } } } } } });
  const open = slot && !slot.cancelledAt && slot.providerUserId !== c.userId && (slot.providerKind === "TEACHER" || slot.providerKind === "ALUMNUS" ? slot.teacherSchoolId === c.schoolId : Boolean(slot.provider.expertProfile?.publishedAt));
  if (!slot || !open) throw new AccessError("gigs.noSuchSlot", "NOT_FOUND");
  if (slot.startsAt <= now) return { ok: false, errorKey: "gigs.refuseStarted" };
  const settings = await gigSettings();
  const year = await currentAcademicYear(c.schoolId);
  const kind = slot.kind as SessionKind;
  // A guardian's own booking is their consent; a pupil who is of age needs nobody's.
  const confirmed = ctx.role === "PARENT" || !c.isMinor;
  // The paid path is open only to a priced workshop seat past the allowance, with the switch on: the
  // one-to-one never has a price (offerSlot), and the switch is read here as well as at the order.
  const payable = slot.pricePaise > 0 && kind === "WORKSHOP" && (await paymentsOn());

  let made: { id: string; status: BookingStatus; fresh: boolean; paid: boolean };
  try {
    made = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      await tx.$queryRaw`SELECT "id" FROM "Membership" WHERE "id" = ${c.membershipId} FOR UPDATE`;
      const existing = await tx.gigBooking.findUnique({ where: { slotId_studentMembershipId: { slotId: slot.id, studentMembershipId: c.membershipId } }, select: { id: true, status: true, paid: true } });
      if (existing && LIVE.includes(existing.status as BookingStatus)) return { id: existing.id, status: existing.status as BookingStatus, fresh: false, paid: existing.paid };
      if (existing && existing.status !== "CANCELLED") throw new Refusal("gigs.refuseAlreadyHeld");
      const used = await usedBy(tx, c, year?.id ?? null);
      // THE FREE ALLOWANCE FIRST. Past it, a priced seat is bought by a guardian; a free seat, or any
      // seat with payments off, is refused as before.
      const free = used[kind] < allowed(settings)[kind];
      if (!free && !payable) throw new Refusal(kind === "ONE_TO_ONE" ? "gigs.refuseAllowanceOneToOne" : slot.pricePaise > 0 ? "gigs.refusePaymentsOff" : "gigs.refuseAllowanceWorkshop", { count: allowed(settings)[kind] });
      const paid = !free;
      const claimed = await tx.$executeRaw`UPDATE "GigSlot" SET "seatsTaken" = "seatsTaken" + 1, "updatedAt" = NOW() WHERE "id" = ${slot.id} AND "seatsTaken" < "seats" AND "cancelledAt" IS NULL`;
      if (claimed === 0) throw new Refusal("gigs.refuseFull");
      // A paid seat: a pupil's ask waits for a guardian's consent and then their payment; a guardian's
      // own waits for payment alone.
      const status: BookingStatus = paid ? (ctx.role === "PARENT" ? "PENDING_PAYMENT" : "PENDING_CONSENT") : confirmed ? "CONFIRMED" : "PENDING_CONSENT";
      const data = { status, purpose, paid, bookedByUserId: ctx.user.id, academicYearId: year?.id ?? null, consentAt: status === "CONFIRMED" ? now : null, consentUserId: ctx.role === "PARENT" ? ctx.user.id : null, cancelledAt: null, cancelledByUserId: null, cancelReason: null, lateCancel: false, closedAt: null, remindedAt: null };
      // A seat once given up is the same row taken again: one pupil, one row in a slot.
      const row = existing
        ? await tx.gigBooking.update({ where: { id: existing.id }, data, select: { id: true } })
        : await tx.gigBooking.create({ data: { ...data, schoolId: c.schoolId, slotId: slot.id, studentMembershipId: c.membershipId, providerUserId: slot.providerUserId, kind }, select: { id: true } });
      return { id: row.id, status, fresh: true, paid };
    });
  } catch (error) {
    const no = refused(error);
    if (no) return no;
    throw error;
  }
  if (!made.fresh) return { ok: true, bookingId: made.id, status: made.status, checkout: made.status === "PENDING_PAYMENT" ? await checkoutOrNull(ctx, { id: made.id, slotId: slot.id, schoolId: c.schoolId, providerUserId: slot.providerUserId, title: slot.title, pricePaise: slot.pricePaise }, c) : null };

  await audit({ schoolId: c.schoolId, actorUserId: ctx.user.id, action: made.status === "CONFIRMED" ? "gig.booking.confirm" : "gig.booking.ask", targetType: "GigBooking", targetId: made.id, meta: { kind, paid: made.paid } });
  if (made.status === "CONFIRMED") {
    await tellProvider(c.schoolId, slot, "gigs.notifBooked", { name: c.name });
    await tellOffice(c, slot, slot.provider.name);
  } else if (made.status === "PENDING_CONSENT") {
    await notifyGuardians(c.membershipId, (name) => ({ schoolId: c.schoolId, kind: noteKind(slot.providerKind), titleKey: made.paid ? "gigs.notifConsentPaid" : "gigs.notifConsent", titleVars: { name, provider: slot.provider.name, amount: rupees(slot.pricePaise) }, body: slot.title, url: "/sessions" })).catch((error) => console.error("[bookSeat] notice failed", error));
  }
  const checkout = made.status === "PENDING_PAYMENT" ? await checkoutOrNull(ctx, { id: made.id, slotId: slot.id, schoolId: c.schoolId, providerUserId: slot.providerUserId, title: slot.title, pricePaise: slot.pricePaise }, c) : null;
  return { ok: true, bookingId: made.id, status: made.status, checkout };
}

type PayableSeat = { id: string; slotId: string; schoolId: string; providerUserId: string; title: string; pricePaise: number };

/** The order for a seat waiting for payment; a gateway that refuses leaves the seat waiting and the result null, for the family to try again. */
async function checkoutOrNull(ctx: ActiveContext, b: PayableSeat, c: Child): Promise<SeatCheckout | null> {
  const result = await openCheckout({ bookingId: b.id, slotId: b.slotId, schoolId: b.schoolId, payerUserId: ctx.user.id, expertUserId: b.providerUserId, amountPaise: b.pricePaise, title: b.title, pupilName: c.name, payerName: ctx.user.name, payerEmail: ctx.user.email ?? null });
  return result.ok ? result.checkout : null;
}

/**
 * A guardian opens, or reopens, the checkout for a seat waiting for their
 * payment — the panel was closed, or the gateway was down at booking. The
 * same order comes back while it stands; a failed one is replaced.
 */
export async function seatCheckout(ctx: ActiveContext, bookingId: string): Promise<GigResult<{ checkout: SeatCheckout }>> {
  if (ctx.role !== "PARENT") throw new AccessError("access.onlyAGuardianCanAgreeToThis");
  const { b, c } = await familyBooking(ctx, bookingId);
  if (b.status !== "PENDING_PAYMENT") return { ok: false, errorKey: "gigs.refuseNotWaitingPayment" };
  if (b.slot.cancelledAt || b.slot.startsAt <= new Date()) return { ok: false, errorKey: "gigs.refuseStarted" };
  return openCheckout({ bookingId: b.id, slotId: b.slotId, schoolId: b.schoolId, payerUserId: ctx.user.id, expertUserId: b.providerUserId, amountPaise: b.slot.pricePaise, title: b.slot.title, pupilName: c.name, payerName: ctx.user.name, payerEmail: ctx.user.email ?? null });
}

/**
 * THE MONEY ARRIVED: the one door for the webhook, the checkout's own
 * confirm and the devbox page. gig-payments.ts settles the row and confirms
 * the booking; here the provider, the office and the family are told, as
 * they are for a free seat confirmed.
 */
export async function settleSeatPayment(input: { orderId: string; gatewayPaymentId: string; amountPaise: number }, now: Date = new Date()): Promise<{ outcome: string; bookingId: string | null }> {
  const result = await markCaptured(input, now);
  if (result.outcome !== "settled" || !result.booking || !result.payment) return { outcome: result.outcome, bookingId: result.booking?.id ?? null };
  const booking = result.booking;
  const loaded = await forSchool(booking.schoolId, () => db.gigBooking.findFirst({ where: { id: booking.id, schoolId: booking.schoolId }, select: { ...BOOKING_SELECT, slot: { select: { title: true, providerKind: true, providerUserId: true, provider: { select: { name: true } } } }, student: { select: CHILD_SELECT } } }));
  if (!loaded) return { outcome: result.outcome, bookingId: booking.id };
  const c = asChild(loaded.student);
  await tellFamily(loaded, c.userId, () => ({ kind: noteKind(loaded.slot.providerKind), titleKey: "gigs.notifSeatPaid", titleVars: { title: loaded.slot.title, amount: rupees(result.payment!.amountPaise) }, url: "/sessions" }));
  await tellProvider(booking.schoolId, loaded.slot, "gigs.notifBooked", { name: c.name });
  await tellOffice(c, loaded.slot, loaded.slot.provider.name);
  return { outcome: result.outcome, bookingId: booking.id };
}

type Loaded = BookingRow & { slot: { id: string; title: string; startsAt: Date; endsAt: Date; providerKind: string; providerUserId: string; cancelledAt: Date | null; pricePaise: number; provider: { name: string } }; student: ChildRow };
const LOADED = { ...BOOKING_SELECT, slot: { select: { id: true, title: true, startsAt: true, endsAt: true, providerKind: true, providerUserId: true, cancelledAt: true, pricePaise: true, provider: { select: { name: true } } } }, student: { select: CHILD_SELECT } } as const;

/** A booking of one of this family's own pupils; anybody else's is not found. */
async function familyBooking(ctx: ActiveContext, bookingId: string): Promise<{ b: Loaded; c: Child }> {
  const mine = await children(ctx);
  const b = mine.length ? await db.gigBooking.findFirst({ where: { id: bookingId, studentMembershipId: { in: mine.map((c) => c.membershipId) } }, select: LOADED }) : null;
  if (!b) throw new AccessError("gigs.noSuchBooking", "NOT_FOUND");
  return { b, c: mine.find((c) => c.membershipId === b.studentMembershipId)! };
}
const releaseSeat = (slotId: string) => db.$executeRaw`UPDATE "GigSlot" SET "seatsTaken" = "seatsTaken" - 1, "updatedAt" = NOW() WHERE "id" = ${slotId} AND "seatsTaken" > 0`;

/** A guardian says yes or no to their child's ask. */
export async function consentToBooking(ctx: ActiveContext, bookingId: string, approve: boolean, now: Date = new Date()): Promise<GigResult<{ status: BookingStatus; /** A paid seat agreed to: the order the guardian pays now. */ checkout: SeatCheckout | null }>> {
  if (ctx.role !== "PARENT") throw new AccessError("access.onlyAGuardianCanAgreeToThis");
  const { b, c } = await familyBooking(ctx, bookingId);
  if (approve && b.status === "CONFIRMED") return { ok: true, status: "CONFIRMED", checkout: null };
  if (approve && b.status === "PENDING_PAYMENT") return { ok: true, status: "PENDING_PAYMENT", checkout: await checkoutOrNull(ctx, { ...b, title: b.slot.title, pricePaise: b.slot.pricePaise }, c) };
  if (!approve && b.status === "CANCELLED") return { ok: true, status: "CANCELLED", checkout: null };
  if (b.status !== "PENDING_CONSENT") return { ok: false, errorKey: "gigs.refuseNotWaiting" };
  if (approve && (b.slot.cancelledAt || b.slot.startsAt <= now)) return { ok: false, errorKey: "gigs.refuseStarted" };
  // A paid seat agreed to is not yet confirmed: the guardian's payment confirms it (settleSeatPayment).
  const paidNext = approve && b.paid;
  if (paidNext && !(await paymentsOn())) return { ok: false, errorKey: "gigs.refusePaymentsOff" };
  const data = approve ? { status: paidNext ? "PENDING_PAYMENT" : "CONFIRMED", consentAt: now, consentUserId: ctx.user.id } : { status: "CANCELLED", cancelledAt: now, cancelledByUserId: ctx.user.id, cancelReason: null, lateCancel: false };
  const changed = await db.gigBooking.updateMany({ where: { id: b.id, schoolId: b.schoolId, status: "PENDING_CONSENT" }, data });
  if (changed.count === 0) return { ok: false, errorKey: "gigs.refuseNotWaiting" };
  if (!approve) await releaseSeat(b.slotId);
  await audit({ schoolId: b.schoolId, actorUserId: ctx.user.id, action: approve ? "gig.booking.consent" : "gig.booking.decline", targetType: "GigBooking", targetId: b.id, meta: { paid: b.paid } });
  await notify({ userId: c.userId, schoolId: b.schoolId, kind: noteKind(b.slot.providerKind), titleKey: approve ? (paidNext ? "gigs.notifConsentedPaid" : "gigs.notifConfirmed") : "gigs.notifDeclined", titleVars: { title: b.slot.title }, url: "/sessions" }).catch((error) => console.error("[consentToBooking] notice failed", error));
  if (approve && !paidNext) {
    await tellProvider(b.schoolId, b.slot, "gigs.notifBooked", { name: c.name });
    await tellOffice(c, b.slot, b.slot.provider.name);
  }
  const status: BookingStatus = approve ? (paidNext ? "PENDING_PAYMENT" : "CONFIRMED") : "CANCELLED";
  return { ok: true, status, checkout: paidNext ? await checkoutOrNull(ctx, { ...b, title: b.slot.title, pricePaise: b.slot.pricePaise }, c) : null };
}

/** A paid seat's money back to the family, and the family told how much; the reason is kept on the payment row. */
async function refundPaidSeat(b: { id: string; schoolId: string; studentMembershipId: string; slotId: string }, pupilUserId: string | null, reason: string, actorUserId: string | null): Promise<void> {
  const outcome = await refundSeatPayment(b.id, reason, actorUserId);
  if (outcome !== "refunded" && outcome !== "pending") return;
  const p = await db.sessionPayment.findUnique({ where: { bookingId: b.id }, select: { amountPaise: true, slot: { select: { title: true, providerKind: true } } } });
  if (!p) return;
  await tellFamily(b, pupilUserId, () => ({ kind: noteKind(p.slot.providerKind), titleKey: outcome === "refunded" ? "gigs.notifRefunded" : "gigs.notifRefundWaiting", titleVars: { title: p.slot.title, amount: rupees(p.amountPaise) }, url: "/sessions" }));
}

/**
 * A seat is given up: by the pupil or a guardian, by the provider, or by the
 * pupil's school's office. Given up by the family inside the free-cancel
 * window, a confirmed seat still counts against the allowance; cancelled by
 * anybody else it never does.
 */
export async function cancelBooking(ctx: ActiveContext, bookingId: string, reason?: string, now: Date = new Date()): Promise<GigResult<{ status: BookingStatus; lateCancel: boolean }>> {
  const why = (reason ?? "").trim().slice(0, 300);
  let b: Loaded | null;
  let by: "family" | "provider" | "office";
  if (ctx.role === "STUDENT" || ctx.role === "PARENT") {
    b = (await familyBooking(ctx, bookingId)).b;
    by = "family";
  } else if ((ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") && ctx.schoolId) {
    b = await db.gigBooking.findFirst({ where: { id: bookingId, schoolId: ctx.schoolId }, select: LOADED });
    by = "office";
  } else if (ctx.role === "EXPERT" || ctx.role === "TEACHER") {
    const found = await db.gigBooking.findFirst({ where: { id: bookingId, providerUserId: ctx.user.id }, select: { schoolId: true } });
    b = found ? await forSchool(found.schoolId, () => db.gigBooking.findFirst({ where: { id: bookingId, providerUserId: ctx.user.id }, select: LOADED })) : null;
    by = "provider";
  } else throw new AccessError("access.wrongRoleForThisAction");
  if (!b) throw new AccessError("gigs.noSuchBooking", "NOT_FOUND");
  if (b.status === "CANCELLED") return { ok: true, status: "CANCELLED", lateCancel: b.lateCancel };
  if (!LIVE.includes(b.status as BookingStatus)) return { ok: false, errorKey: "gigs.refuseNotLive" };
  if (b.slot.startsAt <= now) return { ok: false, errorKey: "gigs.refuseStarted" };
  if (by !== "family" && why.length < 5) return { ok: false, errorKey: "gigs.needReason" };
  const settings = await gigSettings();
  const lateCancel = by === "family" && b.status === "CONFIRMED" && b.slot.startsAt.getTime() - now.getTime() < settings.freeCancelHours * HOUR;
  const booking = b;
  const changed = await forSchool(booking.schoolId, () => db.gigBooking.updateMany({ where: { id: booking.id, schoolId: booking.schoolId, status: { in: LIVE } }, data: { status: "CANCELLED", cancelledAt: now, cancelledByUserId: ctx.user.id, cancelReason: why || null, lateCancel } }));
  if (changed.count === 0) return { ok: true, status: "CANCELLED", lateCancel: false };
  await releaseSeat(booking.slotId);
  await forSchool(booking.schoolId, () => audit({ schoolId: booking.schoolId, actorUserId: ctx.user.id, action: "gig.booking.cancel", targetType: "GigBooking", targetId: booking.id, meta: { by, lateCancel, paid: booking.paid } }));
  if (by !== "family") await tellFamily(booking, booking.student.userId, () => ({ kind: noteKind(booking.slot.providerKind), titleKey: "gigs.notifCancelled", titleVars: { title: booking.slot.title }, body: why, url: "/sessions" }));
  if (by !== "provider" && booking.status === "CONFIRMED") await tellProvider(booking.schoolId, booking.slot, "gigs.notifSeatGivenUp", { name: asChild(booking.student).name });
  if (booking.paid) {
    // The family in good time, the provider or the office: the whole price back. The family late: the
    // seat is paid for as a no-show would be, and the expert is paid once the time has passed.
    if (lateCancel) await scheduleRelease(booking.id, new Date(booking.slot.endsAt.getTime() + HOLD_HOURS * HOUR), "LATE_CANCEL");
    else await refundPaidSeat(booking, booking.student.userId, `${by} cancelled${why ? `: ${why}` : ""}`, ctx.user.id);
  }
  return { ok: true, status: "CANCELLED", lateCancel };
}

/** After it should have ended, the family says the provider did not hold it. It stops counting against the pupil. */
export async function reportUnheld(ctx: ActiveContext, bookingId: string, now: Date = new Date()): Promise<GigResult<{ status: BookingStatus }>> {
  const { b, c } = await familyBooking(ctx, bookingId);
  if (b.status === "UNHELD") return { ok: true, status: "UNHELD" };
  if (b.status !== "CONFIRMED") return { ok: false, errorKey: "gigs.refuseNotConfirmed" };
  if (b.slot.endsAt > now) return { ok: false, errorKey: "gigs.refuseNotYet" };
  const changed = await db.gigBooking.updateMany({ where: { id: b.id, schoolId: b.schoolId, status: "CONFIRMED" }, data: { status: "UNHELD", closedAt: now } });
  if (changed.count === 0) return { ok: false, errorKey: "gigs.refuseNotConfirmed" };
  await audit({ schoolId: b.schoolId, actorUserId: ctx.user.id, action: "gig.booking.unheld", targetType: "GigBooking", targetId: b.id, meta: { paid: b.paid } });
  await tellProvider(b.schoolId, b.slot, "gigs.notifUnheld", { name: c.name });
  // An expert's no-show is refunded in full (decision 0004).
  if (b.paid) await refundPaidSeat(b, c.userId, "the provider did not hold the session", ctx.user.id);
  return { ok: true, status: "UNHELD" };
}

/** After a session was held, the family rates it, once. */
export async function rateBooking(ctx: ActiveContext, bookingId: string, input: { rating: number; feedback?: string }, now: Date = new Date()): Promise<GigResult> {
  const { b } = await familyBooking(ctx, bookingId);
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) return { ok: false, errorKey: "gigs.refuseRating" };
  if (b.status !== "DELIVERED") return { ok: false, errorKey: "gigs.refuseNotDelivered" };
  const changed = await db.gigBooking.updateMany({ where: { id: b.id, schoolId: b.schoolId, status: "DELIVERED", rating: null }, data: { rating: input.rating, feedback: (input.feedback ?? "").trim().slice(0, 500) || null, ratedAt: now } });
  if (changed.count === 0) return { ok: false, errorKey: "gigs.refuseRated" };
  await audit({ schoolId: b.schoolId, actorUserId: ctx.user.id, action: "gig.booking.rate", targetType: "GigBooking", targetId: b.id, meta: { rating: input.rating } });
  return { ok: true };
}

/**
 * The job (gigs:remind, hourly): a confirmed seat in a session that starts
 * within a day is told to the pupil and their guardians once, and its provider
 * is told once for the slot. The row is claimed before anybody is told, so two
 * runs at once remind a family once.
 */
export async function remindSessions(now: Date = new Date()): Promise<{ reminded: number; perSchool: Record<string, { reminded: number }> }> {
  const due = await db.gigBooking.findMany({
    where: { status: "CONFIRMED", remindedAt: null, slot: { cancelledAt: null, startsAt: { gt: now, lte: new Date(now.getTime() + 24 * HOUR) } } },
    orderBy: { createdAt: "asc" },
    take: 500,
    select: { id: true, schoolId: true, studentMembershipId: true, slotId: true, student: { select: { userId: true } }, slot: { select: { title: true, providerUserId: true, providerKind: true } } },
  });
  const perSchool: Record<string, { reminded: number }> = {};
  let reminded = 0;
  for (const b of due) {
    // The provider is told when the first seat of their slot is reminded, and not again for the seats after it.
    const first = (await db.gigBooking.count({ where: { slotId: b.slotId, remindedAt: { not: null } } })) === 0;
    const claimed = await forSchool(b.schoolId, () => db.gigBooking.updateMany({ where: { id: b.id, schoolId: b.schoolId, status: "CONFIRMED", remindedAt: null }, data: { remindedAt: now } }));
    if (claimed.count === 0) continue;
    await tellFamily(b, b.student.userId, () => ({ kind: noteKind(b.slot.providerKind), titleKey: "gigs.notifRemind", titleVars: { title: b.slot.title }, url: "/sessions" }));
    if (first) await tellProvider(b.schoolId, b.slot, "gigs.notifRemind", {});
    reminded += 1;
    (perSchool[b.schoolId] ??= { reminded: 0 }).reminded += 1;
  }
  return { reminded, perSchool };
}

/**
 * The job (gigs:release, hourly): a seat waiting for payment past the
 * checkout window is given back — the booking cancelled, the seat released,
 * the order voided, the family told — and then the money half runs
 * (gig-payments.ts releaseDue: holds that have ended become DUE in the
 * expert's open payout for the company to pay, refunds that failed are tried
 * again). A seat whose money arrived in the meantime is confirmed by the
 * capture and is not here.
 */
export async function releaseSeatPayments(now: Date = new Date()): Promise<{ expired: number } & ReleaseRun> {
  const stale = await db.gigBooking.findMany({
    where: { status: "PENDING_PAYMENT", updatedAt: { lt: new Date(now.getTime() - UNPAID_SEAT_EXPIRY_MS) } },
    take: 200,
    select: { id: true, schoolId: true, studentMembershipId: true, slotId: true, student: { select: { userId: true } }, slot: { select: { title: true, providerKind: true } } },
  });
  let expired = 0;
  for (const b of stale) {
    const changed = await forSchool(b.schoolId, () => db.gigBooking.updateMany({ where: { id: b.id, schoolId: b.schoolId, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED", cancelledAt: now, cancelledByUserId: null, cancelReason: "unpaid", lateCancel: false } }));
    if (changed.count === 0) continue;
    await releaseSeat(b.slotId);
    await refundSeatPayment(b.id, "expired unpaid", null, now);
    await forSchool(b.schoolId, () => audit({ schoolId: b.schoolId, actorUserId: null, action: "gig.payment.expired", targetType: "GigBooking", targetId: b.id }));
    await tellFamily(b, b.student.userId, () => ({ kind: noteKind(b.slot.providerKind), titleKey: "gigs.notifPayExpired", titleVars: { title: b.slot.title }, url: "/sessions" }));
    expired += 1;
  }
  return { expired, ...(await releaseDue(now)) };
}

/* -------------------------------------------------------------------------- */
/* The school's office                                                         */
/* -------------------------------------------------------------------------- */

export type SchoolBooking = { id: string; pupilName: string; kind: SessionKind; title: string; startsAt: string; providerName: string; providerKind: "EXPERT" | "TEACHER" | "ALUMNUS"; status: BookingStatus; purpose: string; /** Bought past the allowance; the amount is the family's and the expert's, not the office's. */ paid: boolean; canCancel: boolean };

/** The office reads every session of its pupils, without the meeting link, and whether its teachers may offer guidance. */
export async function schoolSessions(ctx: ActiveContext, now: Date = new Date()): Promise<{ guidanceOn: boolean; canSwitch: boolean; timeZone: string; bookings: SchoolBooking[] }> {
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { teacherGuidanceOn: true, timezone: true } });
  const rows = await db.gigBooking.findMany({
    where: { schoolId: ctx.schoolId },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, kind: true, status: true, purpose: true, paid: true, student: { select: { user: { select: { name: true, preferredName: true } } } }, slot: { select: { title: true, startsAt: true, providerKind: true, provider: { select: { name: true } } } } },
  });
  return {
    guidanceOn: school.teacherGuidanceOn,
    canSwitch: ctx.role === "ADMIN" || ctx.role === "PRINCIPAL",
    timeZone: school.timezone,
    bookings: rows.map((b) => ({ id: b.id, pupilName: b.student.user.preferredName ?? b.student.user.name, kind: b.kind as SessionKind, title: b.slot.title, startsAt: b.slot.startsAt.toISOString(), providerName: b.slot.provider.name, providerKind: b.slot.providerKind as "EXPERT" | "TEACHER" | "ALUMNUS", status: b.status as BookingStatus, purpose: b.purpose, paid: b.paid, canCancel: LIVE.includes(b.status as BookingStatus) && b.slot.startsAt > now })),
  };
}

/** The school lets its teachers offer free guidance to its own pupils, or stops. Stopping cancels nothing already booked. */
export async function setTeacherGuidance(ctx: ActiveContext, on: boolean): Promise<GigResult<{ guidanceOn: boolean }>> {
  // The office and the head both run the school: the head once read the switch and could not turn it, which read as a broken checkbox (the owner, 2026-10-01).
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
  await db.school.update({ where: { id: ctx.schoolId }, data: { teacherGuidanceOn: on } });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: on ? "gig.guidance.on" : "gig.guidance.off", targetType: "School", targetId: ctx.schoolId });
  return { ok: true, guidanceOn: on };
}

/* -------------------------------------------------------------------------- */
/* The operator                                                                */
/* -------------------------------------------------------------------------- */

export type SessionCounts = { upcomingSlots: number; upcomingSeats: number; seatsTaken: number };

/**
 * What is on offer across every school: counts of the slots, which are no
 * school's rows. The bookings are their schools' and the operator's binding
 * does not open them, so how sessions went is not the operator's to count here.
 */
export async function sessionCounts(ctx: ActiveContext, now: Date = new Date()): Promise<SessionCounts> {
  if (!ctx.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  const upcoming = await db.gigSlot.aggregate({ where: { cancelledAt: null, startsAt: { gt: now } }, _count: { _all: true }, _sum: { seats: true, seatsTaken: true } });
  return { upcomingSlots: upcoming._count._all, upcomingSeats: upcoming._sum.seats ?? 0, seatsTaken: upcoming._sum.seatsTaken ?? 0 };
}
