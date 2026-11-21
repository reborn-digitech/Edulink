import "server-only";
import type { Prisma } from "@prisma/client";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import {
  OFFER_START,
  SUBSCRIPTION_STATUSES,
  adminDutiesHeld,
  billFor,
  isCollegeKind,
  offerChangeEntrySchema,
  premiumTerms,
  renewalReached,
  subscriptionTerms,
  termsState,
  type BulkAnswer,
  type OfficeSubscription,
  type BulkBody,
  type OfferBody,
  type OfferChange,
  type PartTerms,
  type PartTermsBody,
  type SchoolOfferAnswer,
  type SchoolTerms,
  type SubscriptionStatus,
  type SubscriptionsAnswer,
  type SubscriptionsQuery,
  type TermsBody,
  type TermsChange,
} from "@edulink/contracts";
import { db } from "./db";
import { audit, type AuditTx } from "./audit";
import { assertSuperuser } from "./superuser";
import { forTenant } from "./tenant-context";
import { addDaysToKey, safeTimeZone, todayKey } from "./dates";
import type { ActiveContext } from "./session";

/**
 * THE SCHOOL'S TERMS (decision 0010 parts 1 to 3; the brief of 21 November 2026, version 3). The one writer of our offer
 * (SchoolOffer), each school's premium switches, its own terms for the two parts, its note and `termsSetAt`. Two
 * separately priced things, as the owner said: the school's Shalaghar subscription and the premium add-on, each a price
 * a student a year, our figure for all schools or the school's own discount or own price. What a school pays, its
 * bill and its state are worked out on read (packages/contracts v1/school-offer.ts); nothing derived is stored.
 *
 * The operator alone writes here (assertSuperuser). Each write is one transaction, compared and set against what the
 * form read, with its audit rows inside it: the operator's log (no school) and, for a school's terms, the school's own
 * log, which its safety centre shows. The office and the head are told, best-effort, after the write: when premium goes
 * on or off or the terms are set or moved; never about a note, and never a school whose terms are not set about a
 * price. RECORDED, never collected (decision 0003). Nothing here opens or closes a door: premium's cover on the plan
 * lock comes with the gate (phase 4), the read-only pause with the lock (phase 12).
 */

export type Refusal = { ok: false; errorKey: TranslationKey };
const refusal = (errorKey: TranslationKey): Refusal => ({ ok: false, errorKey });

/** Our offer as it stands: the saved row, or the owner's starting values before the first save. */
export type Offer = {
  subscriptionPricePaise: number;
  subscriptionDiscountBps: number;
  premiumPricePaise: number;
  premiumDiscountBps: number;
  freeMonths: number;
  studentsByDefault: boolean;
  teachersByDefault: boolean;
  updatedAt: Date | null;
  updatedByUserId: string | null;
  starting: boolean;
};

export async function readOffer(): Promise<Offer> {
  const row = await db.schoolOffer.findUnique({ where: { id: "offer" } });
  if (row) return { ...row, starting: false };
  return { ...OFFER_START, updatedAt: null, updatedByUserId: null, starting: true };
}

function offerView(offer: Offer): OfferChange["offer"] {
  return {
    subscription: { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps },
    premium: { pricePaise: offer.premiumPricePaise, discountBps: offer.premiumDiscountBps },
    freeMonths: offer.freeMonths,
    studentsByDefault: offer.studentsByDefault,
    teachersByDefault: offer.teachersByDefault,
    updatedAt: offer.updatedAt?.toISOString() ?? null,
    starting: offer.starting,
  };
}

const TERMS_SELECT = {
  id: true,
  name: true,
  kind: true,
  timezone: true,
  removedAt: true,
  isTestFixture: true,
  subscriptionStatus: true,
  subscriptionStartsAt: true,
  subscriptionDueAt: true,
  subscriptionPaidAt: true,
  subscriptionPricePaise: true,
  subscriptionDiscountBps: true,
  premiumStudents: true,
  premiumTeachers: true,
  premiumPricePaise: true,
  premiumDiscountBps: true,
  termsNote: true,
  termsSetAt: true,
  recordingClosedAt: true,
  plan: { select: { code: true } },
} satisfies Prisma.SchoolSelect;
type TermsRow = Prisma.SchoolGetPayload<{ select: typeof TERMS_SELECT }>;

const dayOf = (value: Date | null | undefined) => (value ? value.toISOString().slice(0, 10) : null);
const statusOf = (value: string | null): SubscriptionStatus | null => ((SUBSCRIPTION_STATUSES as readonly string[]).includes(value ?? "") ? (value as SubscriptionStatus) : null);

/** A part's own terms as the chip the forms show. */
export function chipOf(pricePaise: number | null, discountBps: number | null): PartTermsBody {
  if (pricePaise !== null) return { mode: "OWN_PRICE", pricePaise };
  if (discountBps !== null) return { mode: "OWN_DISCOUNT", discountBps };
  return { mode: "OURS" };
}
/** A chip as the two columns of its part: an own price, an own discount, or neither (ours). */
export function columnsOf(chip: PartTermsBody): { price: number | null; discount: number | null } {
  if (chip.mode === "OWN_PRICE") return { price: chip.pricePaise, discount: null };
  if (chip.mode === "OWN_DISCOUNT") return { price: null, discount: chip.discountBps };
  return { price: null, discount: null };
}
function sameChip(a: PartTermsBody, b: PartTermsBody): boolean {
  const x = columnsOf(a);
  const y = columnsOf(b);
  return x.price === y.price && x.discount === y.discount;
}

type Figures = { subscription: PartTerms | null; premium: PartTerms };
function figuresOf(row: Pick<TermsRow, "kind" | "plan" | "subscriptionPricePaise" | "subscriptionDiscountBps" | "premiumPricePaise" | "premiumDiscountBps">, offer: Offer): Figures {
  return {
    subscription: subscriptionTerms(
      { kind: row.kind, planCode: row.plan?.code ?? null, own: { pricePaise: row.subscriptionPricePaise, discountBps: row.subscriptionDiscountBps } },
      { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps },
    ),
    premium: premiumTerms({ pricePaise: row.premiumPricePaise, discountBps: row.premiumDiscountBps }, { pricePaise: offer.premiumPricePaise, discountBps: offer.premiumDiscountBps }),
  };
}

/** The newest count of pupils for each school (UsageSample, never members: a look inside writes no member). */
export async function newestPupils(schoolIds: string[]): Promise<Map<string, number>> {
  if (schoolIds.length === 0) return new Map();
  const rows = await db.usageSample.findMany({
    where: { schoolId: { in: schoolIds } },
    orderBy: [{ schoolId: "asc" }, { month: "desc" }, { computedAt: "desc" }],
    distinct: ["schoolId"],
    select: { schoolId: true, pupils: true },
  });
  return new Map(rows.map((r) => [r.schoolId, r.pupils]));
}

function viewOf(row: TermsRow, offer: Offer, pupils: number | null, now: Date): SchoolTerms {
  const { subscription, premium } = figuresOf(row, offer);
  const zone = safeTimeZone(row.timezone);
  const status = statusOf(row.subscriptionStatus);
  const renewsOn = dayOf(row.subscriptionDueAt);
  const termsSet = row.termsSetAt !== null;
  const state = termsState({
    status,
    dueDay: renewsOn,
    todayDay: todayKey(zone, now),
    termsSet,
    recordingClosedDay: row.recordingClosedAt ? todayKey(zone, row.recordingClosedAt) : null,
    kind: row.kind,
    planCode: row.plan?.code ?? null,
  });
  return {
    schoolId: row.id,
    name: row.name,
    kind: row.kind ?? null,
    planCode: row.plan?.code ?? null,
    termsSet,
    termsSetAt: row.termsSetAt?.toISOString() ?? null,
    subscription: chipOf(row.subscriptionPricePaise, row.subscriptionDiscountBps),
    subscriptionFigure: subscription,
    premiumStudents: row.premiumStudents,
    premiumTeachers: row.premiumTeachers,
    premium: chipOf(row.premiumPricePaise, row.premiumDiscountBps),
    premiumFigure: premium,
    note: row.termsNote ?? null,
    status,
    startsOn: dayOf(row.subscriptionStartsAt),
    renewsOn,
    paidOn: dayOf(row.subscriptionPaidAt),
    state: state.state,
    stateDay: state.day,
    noTierChosen: state.noTierChosen,
    pupils,
    bill: billFor({ pupils, termsSet, renewalDay: renewsOn, subscription, premium, premiumOn: row.premiumStudents || row.premiumTeachers }),
  };
}

/** A school's terms and standing, for the operator. */
export async function readSchoolTerms(session: ActiveContext, schoolId: string, now: Date = new Date()): Promise<SchoolTerms | Refusal> {
  assertSuperuser(session);
  const row = await db.school.findUnique({ where: { id: schoolId }, select: TERMS_SELECT });
  if (!row) return refusal("root.noSuchSchool");
  const [offer, pupils] = await Promise.all([readOffer(), newestPupils([schoolId])]);
  return viewOf(row, offer, pupils.get(schoolId) ?? null, now);
}

/** Thrown inside a write's transaction when the row moved since it was read; answered as the matching refusal. */
class ChangedMeanwhile extends Error {
  constructor(readonly errorKey: TranslationKey) {
    super(errorKey);
  }
}

/** The office and the head of each school, told in the app; best-effort, so a notice that fails never undoes the write. */
async function tellOffices(session: ActiveContext, schools: { id: string; name: string }[]): Promise<number> {
  let told = 0;
  try {
    const { notify } = await import("./notify");
    for (const school of schools) {
      await forTenant({ schoolIds: [school.id], userId: session.user.id, joinCode: null, isSuperuser: true }, async () => {
        const office = await db.membership.findMany({
          where: { schoolId: school.id, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null },
          select: { userId: true, role: true, dutiesJson: true },
        });
        const head = office.some((m) => m.role === "PRINCIPAL");
        const reads = new Set(office.filter((m) => m.role === "PRINCIPAL" || adminDutiesHeld(m.dutiesJson, head).includes("HEAD_PAGES")).map((m) => m.userId));
        for (const member of [...new Map(office.map((m) => [m.userId, m])).values()]) {
          await notify({
            userId: member.userId,
            schoolId: school.id,
            kind: "SYSTEM",
            titleKey: "notifTitle.schoolTermsChanged",
            titleVars: { school: school.name },
            bodyKey: "notifBody.schoolTermsChanged",
            bodyVars: { school: school.name },
            url: reads.has(member.userId) ? "/admin/safety" : "/admin/settings",
            meta: { event: "school.terms" },
          });
          told += 1;
        }
      });
    }
  } catch (error) {
    console.error("[school-terms] notice failed", error instanceof Error ? error.message : error);
  }
  return told;
}

/**
 * How many of the schools' office and head a notice would reach (a preview's count). Read with those schools bound, as
 * tellOffices reads them: Membership has no policy for the operator, so the app role would count none unbound.
 */
async function officeCount(session: ActiveContext, schoolIds: string[]): Promise<number> {
  if (schoolIds.length === 0) return 0;
  const rows = await forTenant({ schoolIds, userId: session.user.id, joinCode: null, isSuperuser: true }, () =>
    db.membership.findMany({ where: { schoolId: { in: schoolIds }, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { schoolId: true, userId: true } }),
  );
  return new Set(rows.map((r) => `${r.schoolId}:${r.userId}`)).size;
}

/**
 * Change a school's terms: either part's own terms (any save of a part's terms sets the school's terms, even one that
 * keeps the chip it had), premium's switches, the note. Compared and set against the terms as read. A college has no
 * own subscription price and no teachers' premium (college teachers hold no plan). A preview writes nothing.
 */
export async function setSchoolTerms(session: ActiveContext, schoolId: string, body: TermsBody, now: Date = new Date()): Promise<TermsChange | Refusal> {
  assertSuperuser(session);
  const row = await db.school.findUnique({ where: { id: schoolId }, select: TERMS_SELECT });
  if (!row) return refusal("root.noSuchSchool");
  if (row.removedAt) return refusal("root.schoolWasRemoved");
  const asRead = {
    termsSetAt: row.termsSetAt?.toISOString() ?? null,
    premiumStudents: row.premiumStudents,
    premiumTeachers: row.premiumTeachers,
    subscription: chipOf(row.subscriptionPricePaise, row.subscriptionDiscountBps),
    premium: chipOf(row.premiumPricePaise, row.premiumDiscountBps),
  };
  const expect = body.expect;
  if (expect.termsSetAt !== asRead.termsSetAt || expect.premiumStudents !== asRead.premiumStudents || expect.premiumTeachers !== asRead.premiumTeachers || !sameChip(expect.subscription, asRead.subscription) || !sameChip(expect.premium, asRead.premium)) {
    return refusal("root.termsChangedMeanwhile");
  }
  const college = isCollegeKind(row.kind);
  if (college && body.subscription?.mode === "OWN_PRICE") return refusal("root.termsOwnPriceAtCollege");
  if (college && body.premium?.teachers === true) return refusal("root.termsTeachersAtCollege");

  const data: Prisma.SchoolUncheckedUpdateManyInput = {};
  const changes: Record<string, unknown> = {};
  const termsSaved = body.subscription !== undefined || body.premium?.terms !== undefined;
  if (body.subscription) {
    const c = columnsOf(body.subscription);
    if (!sameChip(body.subscription, asRead.subscription)) changes.subscription = { before: asRead.subscription, after: body.subscription };
    data.subscriptionPricePaise = c.price;
    data.subscriptionDiscountBps = c.discount;
  }
  if (body.premium?.terms) {
    const c = columnsOf(body.premium.terms);
    if (!sameChip(body.premium.terms, asRead.premium)) changes.premium = { before: asRead.premium, after: body.premium.terms };
    data.premiumPricePaise = c.price;
    data.premiumDiscountBps = c.discount;
  }
  const switched: Record<string, boolean> = {};
  if (body.premium?.students !== undefined && body.premium.students !== row.premiumStudents) switched.premiumStudents = data.premiumStudents = body.premium.students;
  if (body.premium?.teachers !== undefined && body.premium.teachers !== row.premiumTeachers) switched.premiumTeachers = data.premiumTeachers = body.premium.teachers;
  const note = body.note === undefined ? undefined : body.note?.trim() || null;
  const noteChanged = note !== undefined && note !== (row.termsNote ?? null);
  if (noteChanged) data.termsNote = note;
  // A terms save changes something when it sets the school's terms for the first time (even keeping the chip it had) or
  // moves a part; one that keeps what was there writes nothing, records nothing in the school's log and tells nobody.
  const firstSet = termsSaved && row.termsSetAt === null;
  const termsMoved = Object.keys(changes).length > 0;
  const schoolSees = firstSet || termsMoved;
  if (schoolSees) data.termsSetAt = now;

  const after: TermsRow = { ...row, ...(data as Partial<TermsRow>) };
  const [offer, pupils] = await Promise.all([readOffer(), newestPupils([schoolId])]);
  const changed = schoolSees || Object.keys(switched).length > 0 || noteChanged;
  const tells = schoolSees || Object.keys(switched).length > 0;
  if (!changed) return { preview: Boolean(body.preview), terms: viewOf(row, offer, pupils.get(schoolId) ?? null, now), changed: false, told: 0 };
  if (body.preview) return { preview: true, terms: viewOf(after, offer, pupils.get(schoolId) ?? null, now), changed: true, told: tells ? await officeCount(session, [schoolId]) : 0 };

  try {
    await db.$tenantTransaction(async (tx: unknown) => {
      const t = tx as typeof db;
      const moved = await t.school.updateMany({
        where: {
          id: schoolId,
          removedAt: null,
          termsSetAt: row.termsSetAt,
          premiumStudents: row.premiumStudents,
          premiumTeachers: row.premiumTeachers,
          subscriptionPricePaise: row.subscriptionPricePaise,
          subscriptionDiscountBps: row.subscriptionDiscountBps,
          premiumPricePaise: row.premiumPricePaise,
          premiumDiscountBps: row.premiumDiscountBps,
        },
        data,
      });
      if (moved.count !== 1) throw new ChangedMeanwhile("root.termsChangedMeanwhile");
      const reason = body.reason?.trim() || null;
      // The school's own log (decision 17) reads the parts that moved, that its terms were set, and the reason when one
      // was typed: never the note, which is the operator's own.
      const forSchool = reason ? { reason } : {};
      if (schoolSees || noteChanged) {
        await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.school.terms", targetType: "School", targetId: schoolId, meta: { schoolId, name: row.name, ...changes, termsSet: firstSet, noteChanged, reason } }, tx as AuditTx);
        if (schoolSees) await audit({ schoolId, actorUserId: session.user.id, action: "superuser.school.terms", targetType: "School", targetId: schoolId, meta: { ...changes, ...(firstSet ? { termsSet: true } : {}), ...forSchool } }, tx as AuditTx);
      }
      if (Object.keys(switched).length > 0) {
        await audit({ schoolId: null, actorUserId: session.user.id, action: "superuser.school.premium", targetType: "School", targetId: schoolId, meta: { schoolId, name: row.name, ...switched, reason } }, tx as AuditTx);
        await audit({ schoolId, actorUserId: session.user.id, action: "superuser.school.premium", targetType: "School", targetId: schoolId, meta: { ...switched, ...forSchool } }, tx as AuditTx);
      }
    });
  } catch (error) {
    if (error instanceof ChangedMeanwhile) return refusal(error.errorKey);
    throw error;
  }
  const told = tells ? await tellOffices(session, [{ id: row.id, name: row.name }]) : 0;
  const fresh = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: TERMS_SELECT });
  return { preview: false, terms: viewOf(fresh, offer, pupils.get(schoolId) ?? null, now), changed: true, told };
}

/**
 * Change our offer: both parts, the free months, the onboarding ticks. Compared and set against the offer as read (no
 * row: null). Every school whose terms are set and that follows our price or has its own discount moves at once; a
 * school with its own price, and one whose terms are not set, does not. Premium moves only a school with a switch on.
 * The answer names each move, the year's difference at the newest count, and how many schools are told. A preview
 * writes nothing.
 */
export async function updateOffer(session: ActiveContext, body: OfferBody, now: Date = new Date(), scope?: { schoolIds: string[] }): Promise<OfferChange | Refusal> {
  assertSuperuser(session);
  const current = await readOffer();
  if ((current.updatedAt?.toISOString() ?? null) !== body.expect.updatedAt) return refusal("root.offerChangedMeanwhile");
  const next: Offer = {
    subscriptionPricePaise: body.subscription.pricePaise,
    subscriptionDiscountBps: body.subscription.discountBps,
    premiumPricePaise: body.premium.pricePaise,
    premiumDiscountBps: body.premium.discountBps,
    freeMonths: body.freeMonths,
    studentsByDefault: body.studentsByDefault,
    teachersByDefault: body.teachersByDefault,
    updatedAt: now,
    updatedByUserId: session.user.id,
    starting: false,
  };
  // The suites' scope keeps the moves and the notices to their own schools; the door never passes one.
  const schools = await db.school.findMany({ where: { removedAt: null, ...(scope ? { id: { in: scope.schoolIds } } : {}) }, select: TERMS_SELECT, orderBy: { name: "asc" } });
  const pupils = await newestPupils(schools.map((s) => s.id));
  const moves: OfferChange["moves"] = [];
  const told = new Map<string, string>();
  let ownPrice = 0;
  let notSet = 0;
  let yearDeltaPaise = 0;
  for (const school of schools) {
    if (!school.termsSetAt) {
      notSet += 1;
      continue;
    }
    const before = figuresOf(school, current);
    const after = figuresOf(school, next);
    const count = pupils.get(school.id) ?? 0;
    // The year's difference counts what the totals count (rule 8: real schools, Trial, Active or Due, recording open), so
    // it agrees with the year billed beside it; a school that left is listed but not told about a price (rule 10).
    const status = statusOf(school.subscriptionStatus);
    const counted = !school.isTestFixture && (status === "TRIAL" || status === "ACTIVE" || status === "DUE") && school.recordingClosedAt === null;
    const tellable = status !== "ENDED";
    if (before.subscription && after.subscription && before.subscription.paysPaise !== after.subscription.paysPaise) {
      moves.push({ schoolId: school.id, name: school.name, part: "SUBSCRIPTION", beforePaise: before.subscription.paysPaise, afterPaise: after.subscription.paysPaise, source: after.subscription.source });
      if (counted) yearDeltaPaise += (after.subscription.paysPaise - before.subscription.paysPaise) * count;
      if (tellable) told.set(school.id, school.name);
    } else if (school.subscriptionPricePaise !== null) ownPrice += 1;
    if ((school.premiumStudents || school.premiumTeachers) && before.premium.paysPaise !== after.premium.paysPaise) {
      moves.push({ schoolId: school.id, name: school.name, part: "PREMIUM", beforePaise: before.premium.paysPaise, afterPaise: after.premium.paysPaise, source: after.premium.source });
      if (counted) yearDeltaPaise += (after.premium.paysPaise - before.premium.paysPaise) * count;
      if (tellable) told.set(school.id, school.name);
    }
  }
  const unchanged = { ownPrice, notSet };
  if (body.preview) return { preview: true, offer: offerView(next), moves, unchanged, yearDeltaPaise, told: await officeCount(session, [...told.keys()]) };

  let saved: Offer;
  try {
    saved = await db.$tenantTransaction(async (tx: unknown) => {
      const t = tx as typeof db;
      const values = {
        subscriptionPricePaise: next.subscriptionPricePaise,
        subscriptionDiscountBps: next.subscriptionDiscountBps,
        premiumPricePaise: next.premiumPricePaise,
        premiumDiscountBps: next.premiumDiscountBps,
        freeMonths: next.freeMonths,
        studentsByDefault: next.studentsByDefault,
        teachersByDefault: next.teachersByDefault,
        updatedByUserId: session.user.id,
      };
      // Compared and set in the write itself, so two saves made against the same offer cannot both land: the second's
      // update meets the first's new updatedAt, or its create meets the first's row, and is refused by name.
      let written: Awaited<ReturnType<typeof t.schoolOffer.findUniqueOrThrow>>;
      if (body.expect.updatedAt === null) {
        try {
          written = await t.schoolOffer.create({ data: { id: "offer", ...values } });
        } catch (error) {
          if ((error as { code?: string }).code === "P2002") throw new ChangedMeanwhile("root.offerChangedMeanwhile");
          throw error;
        }
      } else {
        const moved = await t.schoolOffer.updateMany({ where: { id: "offer", updatedAt: new Date(body.expect.updatedAt) }, data: { ...values, updatedAt: new Date() } });
        if (moved.count !== 1) throw new ChangedMeanwhile("root.offerChangedMeanwhile");
        written = await t.schoolOffer.findUniqueOrThrow({ where: { id: "offer" } });
      }
      await audit(
        { schoolId: null, actorUserId: session.user.id, action: "operator.offer.update", targetType: "SchoolOffer", targetId: "offer", meta: { before: offerView(current), after: offerView({ ...next, updatedAt: written.updatedAt }), moved: told.size, yearDeltaPaise, reason: body.reason.trim() } },
        tx as AuditTx,
      );
      return { ...written, starting: false };
    });
  } catch (error) {
    if (error instanceof ChangedMeanwhile) return refusal(error.errorKey);
    throw error;
  }
  const toldPeople = await tellOffices(session, [...told].map(([id, name]) => ({ id, name })));
  return { preview: false, offer: offerView(saved), moves, unchanged, yearDeltaPaise, told: toldPeople };
}

/** The live schools that count toward the year billed: real, terms set, running (Trial, Active, Due), recording open, with a count and a figure. */
function totalsOf(views: { view: SchoolTerms; fixture: boolean; closed: boolean }[]): SchoolOfferAnswer["totals"] {
  const totals = { billedYearPaise: 0, countedSchools: 0, notCounted: { notSet: 0, noTier: 0, noCount: 0, notRunning: 0 } };
  for (const { view, fixture, closed } of views) {
    if (fixture) continue;
    if (!view.termsSet) totals.notCounted.notSet += 1;
    else if (!view.status || view.status === "SUSPENDED" || view.status === "ENDED" || closed) totals.notCounted.notRunning += 1;
    else if (!view.subscriptionFigure) totals.notCounted.noTier += 1;
    else if (view.pupils === null || !view.bill) totals.notCounted.noCount += 1;
    else {
      totals.billedYearPaise += view.bill.totalPaise;
      totals.countedSchools += 1;
    }
  }
  return totals;
}

/** Our offer, how the live schools stand against it, and the year billed. */
export async function readOfferAnswer(session: ActiveContext, now: Date = new Date()): Promise<SchoolOfferAnswer> {
  assertSuperuser(session);
  const [offer, schools] = await Promise.all([readOffer(), db.school.findMany({ where: { removedAt: null }, select: TERMS_SELECT })]);
  const pupils = await newestPupils(schools.map((s) => s.id));
  const views = schools.map((s) => ({ view: viewOf(s, offer, pupils.get(s.id) ?? null, now), fixture: s.isTestFixture, closed: s.recordingClosedAt !== null }));
  const groups = { follow: 0, ownDiscount: 0, ownPrice: 0, colleges: 0, notSet: 0, premiumOn: 0 };
  for (const { view, fixture } of views) {
    if (fixture) continue;
    if (view.premiumStudents || view.premiumTeachers) groups.premiumOn += 1;
    if (!view.termsSet) groups.notSet += 1;
    else if (isCollegeKind(view.kind)) groups.colleges += 1;
    else if (view.subscription.mode === "OWN_PRICE") groups.ownPrice += 1;
    else if (view.subscription.mode === "OWN_DISCOUNT") groups.ownDiscount += 1;
    else groups.follow += 1;
  }
  return { offer: offerView(offer), groups, totals: totalsOf(views), recent: await recentOfferChanges() };
}

/** The last ten changes of our offer, newest first, from the operator's own log (§5): when, why, before and after. */
async function recentOfferChanges(): Promise<SchoolOfferAnswer["recent"]> {
  const rows = await db.auditLog.findMany({ where: { action: "operator.offer.update", schoolId: null }, orderBy: { createdAt: "desc" }, take: 10, select: { createdAt: true, meta: true } });
  const recent: SchoolOfferAnswer["recent"] = [];
  for (const row of rows) {
    const entry = offerChangeEntrySchema.safeParse({ ...(JSON.parse(row.meta) as Record<string, unknown>), at: row.createdAt.toISOString() });
    if (entry.success) recent.push(entry.data);
  }
  return recent;
}

/** The Schools tab: every school not removed, with its terms and state, narrowed by the filters; the totals count real schools only. */
export async function listSubscriptions(session: ActiveContext, query: SubscriptionsQuery, now: Date = new Date()): Promise<SubscriptionsAnswer> {
  assertSuperuser(session);
  const q = query.q?.trim().toLowerCase() ?? "";
  const [offer, schools] = await Promise.all([readOffer(), db.school.findMany({ where: { removedAt: null }, select: TERMS_SELECT, orderBy: { name: "asc" } })]);
  const pupils = await newestPupils(schools.map((s) => s.id));
  const all = schools.map((s) => ({ view: viewOf(s, offer, pupils.get(s.id) ?? null, now), fixture: s.isTestFixture, closed: s.recordingClosedAt !== null, zone: safeTimeZone(s.timezone) }));
  const keep = all.filter(({ view, closed, zone }) => {
    if (q && !view.name.toLowerCase().includes(q)) return false;
    const premiumOn = view.premiumStudents || view.premiumTeachers;
    if (query.premium === "on" && !premiumOn) return false;
    if (query.premium === "off" && premiumOn) return false;
    if (query.terms === "notset" && view.termsSet) return false;
    if (query.terms === "ours" && (!view.termsSet || view.subscription.mode !== "OURS")) return false;
    if (query.terms === "own" && (!view.termsSet || view.subscription.mode === "OURS")) return false;
    const today = todayKey(zone, now);
    if (query.renewal === "passed" && !renewalReached(view.renewsOn, today)) return false;
    // Both ends on the school's own day (C1c): not yet reached, and no later than thirty days on from it.
    if (query.renewal === "30" && (view.renewsOn === null || renewalReached(view.renewsOn, today) || view.renewsOn > addDaysToKey(today, 30))) return false;
    if (query.recording === "paused" && !closed) return false;
    if (query.recording === "open" && closed) return false;
    return true;
  });
  // A row carries no note (it is the operator's own "why") and its bill as one figure.
  const rows = keep.map(({ view }) => {
    const row: Partial<SchoolTerms> = { ...view };
    delete row.note;
    delete row.bill;
    return { ...(row as Omit<SchoolTerms, "note" | "bill">), billedYearPaise: view.bill?.totalPaise ?? null };
  });
  return { rows, totals: totalsOf(all) };
}

/**
 * One change over many schools (1 to 100): a premium switch on or off, or our prices for both parts ("Put on our
 * prices", which sets each school's terms). Never a pause. A school already so is left as it is and counted; a
 * college's teachers' premium does not apply and is left. Every school must exist and not be removed, or nothing is
 * done. One transaction, an audit pair a school changed; the changed schools' offices are told.
 */
export async function bulkTerms(session: ActiveContext, body: BulkBody, now: Date = new Date()): Promise<BulkAnswer | Refusal> {
  assertSuperuser(session);
  const ids = [...new Set(body.schoolIds)];
  const schools = await db.school.findMany({ where: { id: { in: ids } }, select: TERMS_SELECT, orderBy: { name: "asc" } });
  if (schools.length !== ids.length || schools.some((s) => s.removedAt)) return refusal("root.bulkSchoolMissing");
  const plans: { school: TermsRow; data: Prisma.SchoolUncheckedUpdateManyInput; action: "superuser.school.premium" | "superuser.school.terms"; meta: Record<string, unknown> }[] = [];
  for (const school of schools) {
    const college = isCollegeKind(school.kind);
    switch (body.action) {
      case "STUDENTS_ON":
      case "STUDENTS_OFF": {
        const on = body.action === "STUDENTS_ON";
        if (school.premiumStudents !== on) plans.push({ school, data: { premiumStudents: on }, action: "superuser.school.premium", meta: { premiumStudents: on } });
        break;
      }
      case "TEACHERS_ON":
      case "TEACHERS_OFF": {
        const on = body.action === "TEACHERS_ON";
        if (!(college && on) && school.premiumTeachers !== on) plans.push({ school, data: { premiumTeachers: on }, action: "superuser.school.premium", meta: { premiumTeachers: on } });
        break;
      }
      case "OUR_PRICES": {
        const already = school.termsSetAt !== null && school.subscriptionPricePaise === null && school.subscriptionDiscountBps === null && school.premiumPricePaise === null && school.premiumDiscountBps === null;
        if (!already) {
          plans.push({
            school,
            data: { subscriptionPricePaise: null, subscriptionDiscountBps: null, premiumPricePaise: null, premiumDiscountBps: null, termsSetAt: now },
            action: "superuser.school.terms",
            meta: { subscription: { before: chipOf(school.subscriptionPricePaise, school.subscriptionDiscountBps), after: { mode: "OURS" } }, premium: { before: chipOf(school.premiumPricePaise, school.premiumDiscountBps), after: { mode: "OURS" } }, termsSet: true },
          });
        }
        break;
      }
    }
  }
  const changed = plans.map((p) => ({ schoolId: p.school.id, name: p.school.name }));
  const unchanged = schools.length - plans.length;
  if (body.preview || plans.length === 0) return { preview: Boolean(body.preview), changed, unchanged, told: body.preview ? await officeCount(session, changed.map((c) => c.schoolId)) : 0 };
  const reason = body.reason?.trim() || null;
  try {
    await db.$tenantTransaction(async (tx: unknown) => {
      const t = tx as typeof db;
      for (const { school, data, action, meta } of plans) {
        const moved = await t.school.updateMany({
          where: {
            id: school.id,
            removedAt: null,
            termsSetAt: school.termsSetAt,
            premiumStudents: school.premiumStudents,
            premiumTeachers: school.premiumTeachers,
            subscriptionPricePaise: school.subscriptionPricePaise,
            subscriptionDiscountBps: school.subscriptionDiscountBps,
            premiumPricePaise: school.premiumPricePaise,
            premiumDiscountBps: school.premiumDiscountBps,
          },
          data,
        });
        if (moved.count !== 1) throw new ChangedMeanwhile("root.termsChangedMeanwhile");
        await audit({ schoolId: null, actorUserId: session.user.id, action, targetType: "School", targetId: school.id, meta: { schoolId: school.id, name: school.name, ...meta, bulk: body.action, reason } }, tx as AuditTx);
        await audit({ schoolId: school.id, actorUserId: session.user.id, action, targetType: "School", targetId: school.id, meta: { ...meta, reason } }, tx as AuditTx);
      }
    });
  } catch (error) {
    if (error instanceof ChangedMeanwhile) return refusal(error.errorKey);
    throw error;
  }
  const told = await tellOffices(session, changed.map((c) => ({ id: c.schoolId, name: c.name })));
  return { preview: false, changed, unchanged, told };
}

/**
 * The school's own read-only card (GET /api/v1/office/subscription), for its office and head: both parts as they
 * stand, free until, renews on, and whether recording is paused. Terms not set: no figure (the brief's "not recorded
 * yet"). Read through the school's own row, inside its fence.
 */
export async function officeSubscription(ctx: ActiveContext, now: Date = new Date()): Promise<OfficeSubscription> {
  if (!ctx.schoolId) throw new Error("officeSubscription: no school in the session");
  const [row, offer] = await Promise.all([db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: TERMS_SELECT }), readOffer()]);
  const view = viewOf(row, offer, null, now);
  return {
    termsSet: view.termsSet,
    subscriptionFigure: view.termsSet ? view.subscriptionFigure : null,
    // Terms not set: no figure for either part, "not recorded yet" (§2.6), though premium may be on.
    premium: { students: view.premiumStudents, teachers: view.premiumTeachers, figure: view.termsSet ? view.premiumFigure : null },
    freeUntil: view.status === "TRIAL" ? view.renewsOn : null,
    renewsOn: view.renewsOn,
    state: view.state,
    recording: { paused: row.recordingClosedAt !== null, since: row.recordingClosedAt?.toISOString() ?? null },
  };
}
