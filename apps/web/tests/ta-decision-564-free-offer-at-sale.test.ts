import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { PLATFORM_FEATURES, gigPaidGateSchema } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { bookSeat, consentToBooking, paidGate, seatCheckout } from "@/lib/gig-sessions";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { ENDPOINTS } from "@/lib/api-catalog";
import { PaidGateList } from "@/components/gigs/paid-gate";
import type { ActiveContext } from "@/lib/session";

// The server component is rendered here with the classic JSX runtime, which reads React from the global scope.
(globalThis as { React?: typeof React }).React = React;

/**
 * TA-564, the owner's decision of 14 November 2026 (the coordinating session's recommendation, option 1): mentoring is
 * the price of charging at the moment of sale as well as of pricing. A family's booking of an expert's priced time, and
 * a guardian's yes to a pupil's ask for one, are refused while the expert keeps no free one-to-one open in the coming
 * thirty days; never at payment, so a seat already booked or paid stands. A free one-to-one already booked still counts
 * as the offer until it happens, the mentoring window included. A refused yes cancels the ask, gives the seat back and
 * tells the family why; the expert alone is told, once a lapse, at the first refused booking, and their checklist says
 * their priced times are off sale. Teachers' priced times are untouched.
 *
 * As the database's owner (tests/setup.ts), on a stamped ZZ school of its own whose slots are written straight in, so
 * the gate's other conditions do not stand in the way; every row it makes is removed afterwards. Paid seats are switched
 * on for the run when they were off, and put back.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 24 * 3_600_000;
let schoolId = "";
let switchedOn = false;
const id: Record<string, string> = {};
const member: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], school: string | null, minor = false): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-564-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: minor, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const guardian = (key: string) => ctx(key, "PARENT", null);
const purpose = "ZZ What the pupil wants from this priced time.";

let n = 0;
/** A time of the provider's, written straight in: priced or free, `days` ahead. */
async function slot(provider: string, over: { kind?: "ONE_TO_ONE" | "WORKSHOP"; pricePaise?: number; days?: number; providerKind?: "EXPERT" | "TEACHER"; seats?: number } = {}) {
  n += 1;
  const startsAt = new Date(Date.now() + (over.days ?? 5) * DAY + n * 60_000);
  const kind = over.kind ?? "WORKSHOP";
  const teacher = over.providerKind === "TEACHER";
  return (
    await db.gigSlot.create({
      data: { providerUserId: id[provider]!, providerKind: over.providerKind ?? "EXPERT", teacherSchoolId: teacher ? schoolId : null, kind, title: `ZZ 564 ${STAMP}-${n}`, startsAt, endsAt: new Date(startsAt.getTime() + (kind === "ONE_TO_ONE" ? 30 : 60) * 60_000), meetingUrl: `https://meet.jit.si/zz-564-${STAMP}-${n}`, seats: over.seats ?? (kind === "ONE_TO_ONE" ? 1 : 10), pricePaise: over.pricePaise ?? 0 },
      select: { id: true },
    })
  ).id;
}
const freeOneToOne = (provider: string, days = 3) => slot(provider, { kind: "ONE_TO_ONE", pricePaise: 0, days });
const pricedWorkshop = (provider: string) => slot(provider, { kind: "WORKSHOP", pricePaise: 10000 });
const told = (key: string, titleKey: string) => db.notification.count({ where: { userId: id[key], titleKey } });
const seatsTaken = async (slotId: string) => (await db.gigSlot.findUniqueOrThrow({ where: { id: slotId }, select: { seatsTaken: true } })).seatsTaken;

beforeAll(async () => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
  const settings = await db.gigSettings.findUnique({ where: { id: "gigs" }, select: { paymentsEnabled: true } });
  if (settings && !settings.paymentsEnabled) {
    await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: true } });
    switchedOn = true;
  }
  schoolId = (await db.school.create({ data: { name: `ZZ Free Offer School ${STAMP}`, slug: `zz-564-${STAMP}`, code: `ZZF${String(STAMP).slice(-6)}`, contactEmail: `zz-564-${STAMP}@test.invalid`, teacherGuidanceOn: true }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-564-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } })).id;
    if (role) member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  for (const key of ["expertA", "expertB", "expertC"]) {
    await person(key, null);
    id[`${key}Profile`] = (await db.expertProfile.create({ data: { userId: id[key]!, headline: `ZZ 564 ${key}`, offering: "BOTH", publishedAt: new Date(), kycStatus: "VERIFIED", verifiedAt: new Date() }, select: { id: true } })).id;
  }
  await person("teacher", "TEACHER");
  for (const [pupil, parent] of [["p1", "g1"], ["p2", "g2"], ["p3", "g3"]] as const) {
    await person(pupil, "STUDENT", { isMinor: true });
    await person(parent, null);
    await db.guardianship.create({ data: { parentUserId: id[parent]!, studentMembershipId: member[pupil]!, studentSchoolId: schoolId, status: "ACTIVE" } });
  }
});

afterAll(async () => {
  setFeaturesForTests(null);
  if (switchedOn) await db.gigSettings.updateMany({ where: { id: "gigs", paymentsEnabled: true }, data: { paymentsEnabled: false } });
  const users = Object.entries(id).filter(([k]) => !k.endsWith("Profile")).map(([, v]) => v);
  await db.sessionPayment.deleteMany({ where: { OR: [{ payerUserId: { in: users } }, { expertUserId: { in: users } }] } }).catch(() => {});
  await db.gigBooking.deleteMany({ where: { schoolId } });
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: { in: users } }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("TA-564: an expert's priced times sell only while a free one-to-one is on offer", () => {
  it("TA-564: a guardian's booking of a priced time is refused with the family's own sentence while the expert keeps no free one-to-one open; nothing is taken, the expert alone is told once a lapse, and their checklist says the times are off sale", async () => {
    const priced = await pricedWorkshop("expertA");
    const refused = await bookSeat(guardian("g1"), { slotId: priced, studentMembershipId: member.p1, purpose });
    expect(refused).toMatchObject({ ok: false, errorKey: "gigs.refuseNoFreeOffer" });
    expect(await db.gigBooking.count({ where: { slotId: priced } })).toBe(0);
    expect(await seatsTaken(priced)).toBe(0);
    expect(await told("expertA", "gigs.notifSalesStopped")).toBe(1);
    // The family is not told by notice: the refusal is their answer.
    expect(await told("g1", "gigs.notifSalesStopped")).toBe(0);
    // A second refused booking in the same lapse tells the expert nothing more.
    expect(await bookSeat(guardian("g2"), { slotId: priced, studentMembershipId: member.p2, purpose })).toMatchObject({ ok: false, errorKey: "gigs.refuseNoFreeOffer" });
    expect(await told("expertA", "gigs.notifSalesStopped")).toBe(1);
    // The checklist: the offer unticked, and a line saying the priced times are off sale.
    const lapsed = await paidGate(id.expertA!);
    expect(lapsed).toMatchObject({ mentoringOffer: false, pricedOffSale: 1 });
    expect(gigPaidGateSchema.parse(lapsed)).toMatchObject({ pricedOffSale: 1 });
    const OFF_SALE = en.gigs.gatePricedOffSale;
    expect(renderToStaticMarkup(await PaidGateList({ gate: lapsed }))).toContain(OFF_SALE);

    // A free one-to-one offered again reopens sales at once.
    const free = await freeOneToOne("expertA");
    const reopened = await paidGate(id.expertA!);
    expect(reopened).toMatchObject({ mentoringOffer: true, pricedOffSale: 0 });
    expect(renderToStaticMarkup(await PaidGateList({ gate: reopened }))).not.toContain(OFF_SALE);
    const bought = await bookSeat(guardian("g1"), { slotId: priced, studentMembershipId: member.p1, purpose });
    expect(bought).toMatchObject({ ok: true, status: "PENDING_PAYMENT" });
    const bookingId = (bought as { bookingId: string }).bookingId;

    // Withdrawn, sales stop again with no grace, and this new lapse is told to the expert again.
    await db.gigSlot.update({ where: { id: free }, data: { cancelledAt: new Date(), cancelReason: "ZZ withdrawn" } });
    expect(await bookSeat(guardian("g2"), { slotId: priced, studentMembershipId: member.p2, purpose })).toMatchObject({ ok: false, errorKey: "gigs.refuseNoFreeOffer" });
    expect(await told("expertA", "gigs.notifSalesStopped")).toBe(2);

    // Never at payment: the seat booked while the offer stood is the family's to pay, and pressing Book again answers it.
    expect(await bookSeat(guardian("g1"), { slotId: priced, studentMembershipId: member.p1, purpose })).toMatchObject({ ok: true, bookingId, status: "PENDING_PAYMENT" });
    const checkout = await seatCheckout(guardian("g1"), bookingId);
    expect(checkout).not.toMatchObject({ errorKey: "gigs.refuseNoFreeOffer" });
    expect((await db.gigBooking.findUniqueOrThrow({ where: { id: bookingId }, select: { status: true } })).status).toBe("PENDING_PAYMENT");
  }, 60_000);

  it("TA-564: a free one-to-one already booked still counts as the offer until it happens, the mentoring window included", async () => {
    // Expert B's only free offer is a mentoring window a school has booked.
    await db.expertSlot.create({ data: { expertProfileId: id.expertBProfile!, startsAt: new Date(Date.now() + 4 * DAY), endsAt: new Date(Date.now() + 4 * DAY + 3_600_000), bookedAt: new Date() } });
    expect(await paidGate(id.expertB!)).toMatchObject({ mentoringOffer: true, pricedOffSale: 0 });
    const priced = await pricedWorkshop("expertB");
    expect(await bookSeat(guardian("g1"), { slotId: priced, studentMembershipId: member.p1, purpose })).toMatchObject({ ok: true, status: "PENDING_PAYMENT" });
    expect(await told("expertB", "gigs.notifSalesStopped")).toBe(0);
  }, 60_000);

  it("TA-564: a guardian's yes to a pupil's ask for a priced time after the offer lapsed cancels the ask, gives the seat back and tells the family why; the expert is told", async () => {
    const free = await freeOneToOne("expertC");
    const priced = await pricedWorkshop("expertC");
    const asked = await bookSeat(ctx("p3", "STUDENT", schoolId, true), { slotId: priced, purpose });
    expect(asked).toMatchObject({ ok: true, status: "PENDING_CONSENT" });
    const bookingId = (asked as { bookingId: string }).bookingId;
    expect(await seatsTaken(priced)).toBe(1);

    await db.gigSlot.update({ where: { id: free }, data: { cancelledAt: new Date(), cancelReason: "ZZ withdrawn" } });
    expect(await consentToBooking(guardian("g3"), bookingId, true)).toMatchObject({ ok: false, errorKey: "gigs.refuseNoFreeOffer" });
    expect(await db.gigBooking.findUniqueOrThrow({ where: { id: bookingId }, select: { status: true, lateCancel: true, cancelledAt: true } })).toMatchObject({ status: "CANCELLED", lateCancel: false, cancelledAt: expect.any(Date) });
    expect(await seatsTaken(priced)).toBe(0);
    const row = await db.auditLog.findFirstOrThrow({ where: { action: "gig.booking.cancel", targetId: bookingId }, select: { schoolId: true, actorUserId: true, meta: true } });
    expect(row).toMatchObject({ schoolId, actorUserId: id.g3 });
    expect(JSON.parse(row.meta)).toMatchObject({ by: "noFreeOffer", lateCancel: false });
    expect(await told("p3", "gigs.notifAskStoppedNoOffer")).toBe(1);
    expect(await told("g3", "gigs.notifAskStoppedNoOffer")).toBe(1);
    expect(await told("expertC", "gigs.notifSalesStopped")).toBe(1);
    // Pressed again, it is no longer waiting.
    expect(await consentToBooking(guardian("g3"), bookingId, true)).toMatchObject({ ok: false, errorKey: "gigs.refuseNotWaiting" });
  }, 60_000);

  it("TA-564: a teacher's priced guidance is untouched: it sells with no free one-to-one of theirs on offer", async () => {
    const priced = await slot("teacher", { kind: "ONE_TO_ONE", pricePaise: 10000, providerKind: "TEACHER" });
    expect(await bookSeat(guardian("g2"), { slotId: priced, studentMembershipId: member.p2, purpose })).toMatchObject({ ok: true, status: "PENDING_PAYMENT" });
    expect(await told("teacher", "gigs.notifSalesStopped")).toBe(0);
  }, 60_000);

  it("TA-564: the family's refusal and notice and the expert's notice and checklist line are said in English, Hindi and Marathi; 'A one-to-one is never sold' is gone; the doors say the rule", () => {
    const g = (d: unknown) => (d as { gigs: Record<string, string> }).gigs;
    for (const key of ["refuseNoFreeOffer", "notifAskStoppedNoOffer", "notifSalesStopped", "gatePricedOffSale"]) {
      for (const [name, d] of [["en", en], ["hi", hi], ["mr", mr]] as const) expect(g(d)[key], `${name} gigs.${key}`).toBeTruthy();
    }
    expect(g(hi).refuseNoFreeOffer).toMatch(/।$/);
    expect(g(mr).refuseNoFreeOffer).toMatch(/\.$/);
    expect(g(en).refuseAllowanceOneToOne).not.toMatch(/never sold/);
    expect(g(hi).refuseAllowanceOneToOne).not.toContain("कभी बेचा नहीं");
    expect(g(mr).refuseAllowanceOneToOne).not.toContain("कधीही विकले");
    const door = (method: string, path: string) => ENDPOINTS.find((e) => e.method === method && e.path === path)!;
    expect(door("POST", "/api/v1/gigs/sessions/book").summary).toMatch(/free one-to-one/);
    expect(door("POST", "/api/v1/gigs/sessions/{bookingId}/consent").summary).toMatch(/free one-to-one/);
  });
});
