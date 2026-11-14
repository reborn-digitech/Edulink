import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { gigBookingStatusSchema, gigDisputeDecideBodySchema, gigDisputeDecidedSchema, gigDisputesSchema, gigFamilySessionsSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { ENDPOINTS } from "@/lib/api-catalog";
import { closeBooking, decideDispute, familySessions, mySlots, operatorDisputes, releaseSeatPayments, reportUnheld } from "@/lib/gig-sessions";
import { HOLD_HOURS, retrySeatPayment } from "@/lib/gig-payments";
import type { ActiveContext } from "@/lib/session";

/**
 * TA-122, the owner's decision of 14 November 2026 (option 1): the family may dispute a marked seat and the operator
 * decides. From the session's end until the 48-hour hold runs out (on a free seat, 48 hours from the mark) the family
 * may say "not held" on a seat marked held or pupil-did-not-come; the seat is DISPUTED, the pay-out waits (the hourly
 * release, the operator's retry and the company-collects path leave it alone), and the operator either refunds the
 * family in full (the seat becomes UNHELD: off the pupil's allowance and off the expert's free duty) or lets the
 * pay-out go (the provider's mark stands again). Both sides are told at each step, and a "pupil did not come" mark is
 * told to the family with the time until which it may object.
 *
 * As the database's owner, on a stamped ZZ school of its own whose slots and seats are written straight into the
 * past, so the times are the test's and not the clock's; every row it makes is removed afterwards.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
const ZONE = "Asia/Kolkata";
let schoolId = "";
let yearId = "";
let switchedOn = false;
const id: Record<string, string> = {};
const member: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], school: string | null, flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-122-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const operator = () => ctx("operator", null, null, { isSuperuser: true });
const guardian = () => ctx("g", "PARENT", null);

let n = 0;
/** A confirmed seat for the pupil in a slot of the expert's that began `hoursAgo` hours ago and lasted half an hour. */
async function seat(hoursAgo: number, pricePaise = 0) {
  n += 1;
  const startsAt = new Date(Date.now() - hoursAgo * HOUR - n * 60_000);
  const endsAt = new Date(startsAt.getTime() + 30 * 60_000);
  const slot = await db.gigSlot.create({ data: { providerUserId: id.expert!, providerKind: "EXPERT", kind: "ONE_TO_ONE", title: `ZZ dispute ${STAMP}-${n}`, startsAt, endsAt, meetingUrl: `https://meet.jit.si/zz-122-${STAMP}-${n}`, seats: 1, seatsTaken: 1, pricePaise }, select: { id: true } });
  const booking = await db.gigBooking.create({ data: { schoolId, slotId: slot.id, studentMembershipId: member.p!, providerUserId: id.expert!, kind: "ONE_TO_ONE", bookedByUserId: id.g!, purpose: "ZZ help with a chapter of physics.", status: "CONFIRMED", academicYearId: yearId, consentAt: startsAt, consentUserId: id.g!, paid: pricePaise > 0 }, select: { id: true } });
  return { slotId: slot.id, bookingId: booking.id, startsAt, endsAt };
}
/** The pupil's row of the family's list, and one booking of it. */
const child = async () => (await familySessions(guardian())).children.find((c) => c.id === member.p)!;
const listed = async (bookingId: string) => (await child()).bookings.find((b) => b.id === bookingId)!;
const statusOf = async (bookingId: string) => (await db.gigBooking.findUniqueOrThrow({ where: { id: bookingId }, select: { status: true } })).status;
const notes = (userKey: string, needle: string) => db.notification.count({ where: { userId: id[userKey], title: { contains: needle } } });
const audits = (action: string, targetId: string) => db.auditLog.count({ where: { action, targetId } });
const deliveredOneToOnes = async () => (await mySlots(expert())).duty!.deliveredOneToOnes;

beforeAll(async () => {
  const s = await db.school.create({ data: { name: `ZZ Dispute School ${STAMP}`, slug: `zz-122-${STAMP}`, code: `ZZD${String(STAMP).slice(-6)}`, contactEmail: `zz-122-${STAMP}@test.invalid`, timezone: ZONE }, select: { id: true } });
  schoolId = s.id;
  yearId = (await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    const user = await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-122-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } });
    id[key] = user.id;
    if (role) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null);
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ Physicist", offering: "BOTH", publishedAt: new Date() } });
  await person("operator", null, { isSuperuser: true });
  await person("p", "STUDENT", { isMinor: true });
  await person("g", null);
  await db.guardianship.create({ data: { parentUserId: id.g!, studentMembershipId: member.p!, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  // The paid case switches payments on for one run of the job when they were off; put it back even if that case failed.
  if (switchedOn) await db.gigSettings.updateMany({ where: { id: "gigs", paymentsEnabled: true }, data: { paymentsEnabled: false } });
  const users = Object.values(id);
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: { in: users } }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("TA-122: the family disputes a marked seat and the operator decides", () => {
  it("TA-122: a mark made at the start no longer shuts the family's 'not held': after the end and within 48 hours of the mark it is a dispute, both sides are told, and a second press changes nothing", async () => {
    const s = await seat(4);
    const markedAt = new Date(s.startsAt.getTime() + 60_000);
    expect(await closeBooking(expert(), s.bookingId, "DELIVERED", markedAt)).toMatchObject({ ok: true });
    const until = new Date(markedAt.getTime() + HOLD_HOURS * HOUR);
    // The family's list offers the report, with the time it may be made until.
    expect(await listed(s.bookingId)).toMatchObject({ status: "DELIVERED", canReportUnheld: true, disputeUntil: until.toISOString() });
    // Not before the session's end.
    expect(await reportUnheld(guardian(), s.bookingId, new Date(s.startsAt.getTime() + 5 * 60_000))).toMatchObject({ ok: false, errorKey: "gigs.refuseNotYet" });
    expect(await reportUnheld(guardian(), s.bookingId, new Date(s.endsAt.getTime() + 30 * 60_000))).toMatchObject({ ok: true, status: "DISPUTED" });
    expect(await statusOf(s.bookingId)).toBe("DISPUTED");
    const row = await db.auditLog.findFirstOrThrow({ where: { action: "gig.booking.disputed", targetId: s.bookingId }, select: { schoolId: true, actorUserId: true, meta: true } });
    expect(row).toMatchObject({ schoolId, actorUserId: id.g });
    expect(JSON.parse(row.meta)).toMatchObject({ mark: "DELIVERED", paid: false });
    expect(await notes("expert", "the operator")).toBeGreaterThanOrEqual(1);
    expect(await notes("g", "the operator")).toBeGreaterThanOrEqual(1);
    // Pressed again: the same answer, nothing written twice.
    expect(await reportUnheld(guardian(), s.bookingId, new Date(s.endsAt.getTime() + 40 * 60_000))).toMatchObject({ ok: true, status: "DISPUTED" });
    expect(await audits("gig.booking.disputed", s.bookingId)).toBe(1);
    // The provider cannot mark it over again while it is disputed.
    expect(await closeBooking(expert(), s.bookingId, "MISSED", new Date())).toMatchObject({ ok: false });
    // The new state is in the contract list, and the family's list with it parses.
    expect(gigBookingStatusSchema.parse("DISPUTED")).toBe("DISPUTED");
    const family = await familySessions(guardian());
    const parsed = gigFamilySessionsSchema.parse(JSON.parse(JSON.stringify(family)));
    expect(parsed.children.find((c) => c.id === member.p)!.bookings.find((b) => b.id === s.bookingId)).toMatchObject({ status: "DISPUTED", canReportUnheld: false, disputeUntil: null });

    // Past the 48 hours from the mark, the mark stands.
    const late = await seat(60);
    const lateMark = new Date(late.startsAt.getTime() + 60_000);
    expect(await closeBooking(expert(), late.bookingId, "MISSED", lateMark)).toMatchObject({ ok: true });
    expect(await reportUnheld(guardian(), late.bookingId, new Date(lateMark.getTime() + (HOLD_HOURS + 1) * HOUR))).toMatchObject({ ok: false, errorKey: "gigs.refuseDisputeClosed" });
    expect(await statusOf(late.bookingId)).toBe("MISSED");
    expect(await listed(late.bookingId)).toMatchObject({ canReportUnheld: false, disputeUntil: null });
  }, 60_000);

  it("TA-122: a 'pupil did not come' mark is told to the family with the time until which it may object", async () => {
    const s = await seat(3);
    const markedAt = new Date(s.startsAt.getTime() + 2 * 60_000);
    const before = await notes("g", "did not come");
    expect(await closeBooking(expert(), s.bookingId, "MISSED", markedAt)).toMatchObject({ ok: true });
    expect(await notes("g", "did not come")).toBe(before + 1);
    expect(await notes("p", "did not come")).toBeGreaterThanOrEqual(1);
    const until = new Date(markedAt.getTime() + HOLD_HOURS * HOUR);
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(until);
    const told = await db.notification.findFirstOrThrow({ where: { userId: id.g, title: { contains: "did not come" } }, orderBy: { createdAt: "desc" }, select: { title: true } });
    expect(told.title).toContain(time);
  }, 60_000);

  it("TA-122: while disputed a free seat still counts against the pupil's allowance and not toward the expert's free duty; upheld by the operator it counts against neither, and both sides are told", async () => {
    const s = await seat(5);
    const usedConfirmed = (await child()).allowance.ONE_TO_ONE.used;
    const dutyBefore = await deliveredOneToOnes();
    expect(await closeBooking(expert(), s.bookingId, "DELIVERED", new Date(s.startsAt.getTime() + 60_000))).toMatchObject({ ok: true });
    expect(await deliveredOneToOnes()).toBe(dutyBefore + 1);
    expect(await reportUnheld(guardian(), s.bookingId, new Date(s.endsAt.getTime() + HOUR))).toMatchObject({ ok: true, status: "DISPUTED" });
    expect((await child()).allowance.ONE_TO_ONE.used).toBe(usedConfirmed);
    expect(await deliveredOneToOnes()).toBe(dutyBefore);

    // Only the operator reads and decides disputes.
    await expect(operatorDisputes(expert())).rejects.toBeInstanceOf(AccessError);
    await expect(decideDispute(guardian(), s.bookingId, "REFUND")).rejects.toBeInstanceOf(AccessError);
    const open = await operatorDisputes(operator());
    expect(gigDisputesSchema.parse(JSON.parse(JSON.stringify(open)))).toBeTruthy();
    expect(open.disputes.find((d) => d.bookingId === s.bookingId)).toMatchObject({ mark: "DELIVERED", paid: false, title: `ZZ dispute ${STAMP}-${n}`, schoolName: `ZZ Dispute School ${STAMP}` });

    const decided = await decideDispute(operator(), s.bookingId, "REFUND");
    expect(decided).toMatchObject({ ok: true, status: "UNHELD" });
    expect(gigDisputeDecidedSchema.parse(JSON.parse(JSON.stringify({ status: (decided as { status: string }).status })))).toBeTruthy();
    expect(await statusOf(s.bookingId)).toBe("UNHELD");
    expect(await audits("gig.booking.disputeUpheld", s.bookingId)).toBe(1);
    expect((await child()).allowance.ONE_TO_ONE.used).toBe(usedConfirmed - 1);
    expect(await deliveredOneToOnes()).toBe(dutyBefore);
    expect(await notes("expert", "The operator found")).toBe(1);
    expect(await notes("expert", "not held")).toBeGreaterThanOrEqual(2);
    expect(await notes("g", "agreed")).toBeGreaterThanOrEqual(1);
    expect((await operatorDisputes(operator())).disputes.some((d) => d.bookingId === s.bookingId)).toBe(false);
    // Decided once: a second decision finds nothing to decide.
    await expect(decideDispute(operator(), s.bookingId, "RELEASE")).rejects.toMatchObject({ code: "NOT_FOUND" });
  }, 60_000);

  it("TA-122: the operator lets the pay-out go: the provider's mark stands again, both sides are told, and the family may not dispute it a second time", async () => {
    const s = await seat(6);
    expect(await closeBooking(expert(), s.bookingId, "MISSED", new Date(s.startsAt.getTime() + 60_000))).toMatchObject({ ok: true });
    expect(await reportUnheld(guardian(), s.bookingId, new Date(s.endsAt.getTime() + HOUR))).toMatchObject({ ok: true, status: "DISPUTED" });
    expect((await operatorDisputes(operator())).disputes.find((d) => d.bookingId === s.bookingId)).toMatchObject({ mark: "MISSED" });
    expect(gigDisputeDecideBodySchema.safeParse({ decision: "RELEASE" }).success).toBe(true);
    expect(gigDisputeDecideBodySchema.safeParse({ decision: "SPLIT" }).success).toBe(false);
    expect(await decideDispute(operator(), s.bookingId, "RELEASE")).toMatchObject({ ok: true, status: "MISSED" });
    expect(await statusOf(s.bookingId)).toBe("MISSED");
    expect(await audits("gig.booking.disputeRejected", s.bookingId)).toBe(1);
    expect(await notes("g", "stands")).toBeGreaterThanOrEqual(1);
    expect(await notes("expert", "stands")).toBeGreaterThanOrEqual(1);
    expect(await reportUnheld(guardian(), s.bookingId, new Date(s.endsAt.getTime() + 2 * HOUR))).toMatchObject({ ok: false, errorKey: "gigs.refuseDisputeDecided" });
    expect(await listed(s.bookingId)).toMatchObject({ status: "MISSED", canReportUnheld: false, disputeUntil: null });
  }, 60_000);

  it("TA-122: on a paid seat the pay-out waits while disputed (the hourly release and the operator's retry leave it alone), and upheld the family is refunded in full", async () => {
    const payment = async (bookingId: string, slotId: string, k: string) =>
      db.sessionPayment.create({ data: { bookingId, slotId, payerUserId: id.g!, expertUserId: id.expert!, amountPaise: 10000, commissionPaise: 2000, gstPaise: 360, netPaise: 7640, orderId: `order_zz122${STAMP}${k}`, paymentId: `pay_zz122${STAMP}${k}`, status: "HELD", path: "COMPANY", paidAt: new Date(Date.now() - 70 * HOUR) }, select: { id: true } });
    // Both began 60 hours ago and were marked a minute in: their holds ran out twelve hours ago.
    const disputed = await seat(60, 10000);
    const control = await seat(60, 10000);
    const disputedPay = await payment(disputed.bookingId, disputed.slotId, "d");
    await payment(control.bookingId, control.slotId, "c");
    for (const x of [disputed, control]) expect(await closeBooking(expert(), x.bookingId, "DELIVERED", new Date(x.startsAt.getTime() + 60_000))).toMatchObject({ ok: true });
    expect(await reportUnheld(guardian(), disputed.bookingId, new Date(disputed.endsAt.getTime() + HOUR))).toMatchObject({ ok: true, status: "DISPUTED" });
    expect(await db.sessionPayment.findUniqueOrThrow({ where: { id: disputedPay.id }, select: { status: true, holdUntil: true } })).toMatchObject({ status: "HELD", holdUntil: null });
    expect((await operatorDisputes(operator())).disputes.find((d) => d.bookingId === disputed.bookingId)).toMatchObject({ paid: true, amountPaise: 10000, paymentStatus: "HELD" });

    const settings = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { paymentsEnabled: true } });
    if (!settings.paymentsEnabled) {
      await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: true } });
      switchedOn = true;
    }
    try {
      // The hourly run, now: the seat not disputed is due to the expert; the disputed one stays held.
      await releaseSeatPayments(new Date());
      expect((await db.sessionPayment.findUniqueOrThrow({ where: { bookingId: control.bookingId }, select: { status: true } })).status).toBe("DUE");
      expect((await db.sessionPayment.findUniqueOrThrow({ where: { id: disputedPay.id }, select: { status: true } })).status).toBe("HELD");
      // A release waiting at the gateway is not tried on a disputed seat either.
      await db.sessionPayment.update({ where: { id: disputedPay.id }, data: { pendingAction: "RELEASE", transferId: `trf_zz122${STAMP}` } });
      expect(await retrySeatPayment(operator(), disputedPay.id)).toMatchObject({ ok: false, errorKey: "gigs.refuseDisputed" });
      expect((await db.sessionPayment.findUniqueOrThrow({ where: { id: disputedPay.id }, select: { status: true } })).status).toBe("HELD");
      await db.sessionPayment.update({ where: { id: disputedPay.id }, data: { pendingAction: null, transferId: null } });
    } finally {
      if (switchedOn) await db.gigSettings.updateMany({ where: { id: "gigs", paymentsEnabled: true }, data: { paymentsEnabled: false } });
      switchedOn = false;
    }

    expect(await decideDispute(operator(), disputed.bookingId, "REFUND")).toMatchObject({ ok: true, status: "UNHELD" });
    expect(await db.sessionPayment.findUniqueOrThrow({ where: { id: disputedPay.id }, select: { status: true, amountPaise: true, netPaise: true } })).toMatchObject({ status: "REFUNDED", amountPaise: 10000, netPaise: 0 });
    expect(await notes("g", "refunded")).toBeGreaterThanOrEqual(1);
  }, 60_000);

  it("TA-122: the operator's two doors are in the catalog, for the operator alone", () => {
    const list = ENDPOINTS.find((e) => e.method === "GET" && e.path === "/api/v1/operator/gigs/disputes");
    const decide = ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/operator/gigs/disputes/{bookingId}/decide");
    expect(list).toMatchObject({ access: "operator", response: gigDisputesSchema });
    expect(decide).toMatchObject({ access: "operator", request: gigDisputeDecideBodySchema, response: gigDisputeDecidedSchema });
  });
});
