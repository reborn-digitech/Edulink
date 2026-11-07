import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLATFORM_FEATURES } from "@edulink/contracts";
import { AccessError, FeatureOffError, PlanRequiredError } from "@/lib/access-error";
import { gigSettings } from "@/lib/gig-questions";
import { bookSeat, closeBooking, consentToBooking, familySessions, joinLink, mayJoin, mySlots, offerSlot, releaseSeatPayments, remindJoins, schoolSessions, seatCheckout, settleSeatPayment, JOIN_REMIND_MINUTES } from "@/lib/gig-sessions";
import { confirmSeatCheckout, recordPayout, HOLD_HOURS } from "@/lib/gig-payments";
import { signSeatCheckout } from "@/lib/gig-gateway";
import { isMeetingLink, meetingServiceOf } from "@/lib/meeting-links";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { JOBS } from "@/lib/jobs";
import { matchesCron } from "@/lib/job-scheduler";
import { ENDPOINTS } from "@/lib/api-catalog";
import type { ActiveContext } from "@/lib/session";

/**
 * SEATS (17 October 2026; decision 0006 amending 0004): every session may be sold per seat. A one-to-one and a
 * teacher's guidance may be priced within the operator's band, refused outside it and behind each provider's gate; the
 * free allowance is spent on times priced 0 alone; a pupil under eighteen asks a guardian, who pays, and a pupil of
 * eighteen or more pays for their own seat; the meeting link is a Meet, Zoom, Teams or Jitsi room, shown to the
 * provider always and to a seat holder once confirmed and, when priced, paid, through the family's list and the join
 * door alike; a teacher's seat goes the company-collects way to a payout by hand; offering asks the plan and the
 * platform switch; and the thirty-minute reminder tells each family once. Under the devbox gateway, as the database's
 * owner, so the rules and not the policies.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
const PREFIX = `ZS${String(STAMP).slice(-6)}`;
let saved: Awaited<ReturnType<typeof gigSettings>>;
let savedRow: Record<string, unknown> = {};
let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], school: string | null, flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-seats-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const teacher = () => ctx("teacher", "TEACHER", schoolId);
const admin = () => ctx("admin", "ADMIN", schoolId);
const operator = () => ctx("operator", null, null, { isSuperuser: true });
const p1 = () => ctx("p1", "STUDENT", schoolId);
const p2 = () => ctx("p2", "STUDENT", schoolId);
const adult = () => ctx("adult", "STUDENT", schoolId);
const g1 = () => ctx("g1", "PARENT", null);
const g2 = () => ctx("g2", "PARENT", null);

let n = 0;
const slot = (kind: "ONE_TO_ONE" | "WORKSHOP", over: Record<string, unknown> = {}, hoursAhead = 48) => {
  n += 1;
  return { kind, title: `ZZ seats ${STAMP}-${n}`, startsAt: new Date(Date.now() + hoursAhead * HOUR + n * 4 * HOUR).toISOString(), meetingUrl: `https://meet.jit.si/zz-seats-${STAMP}-${n}`, ...over };
};
const offered = async (who: ActiveContext, kind: "ONE_TO_ONE" | "WORKSHOP", over: Record<string, unknown> = {}) => {
  const r = await offerSlot(who, slot(kind, over));
  if (!r.ok) throw new Error(`offer refused: ${r.errorKey}`);
  return r.slotId;
};
const purpose = "ZZ What the pupil wants from this half hour.";
const refusalKey = async (work: Promise<unknown>) => {
  try {
    await work;
    return "let through";
  } catch (error) {
    return error instanceof AccessError ? `${error.code}:${error.key}` : String(error);
  }
};
const booked = async (who: ActiveContext, slotId: string, pupil: string) => {
  const r = await bookSeat(who, { slotId, studentMembershipId: member[pupil], purpose });
  if (!r.ok) throw new Error(`booking refused: ${r.errorKey}`);
  return r;
};
const childOf = async (who: ActiveContext, pupil: string) => (await familySessions(who)).children.find((c) => c.id === member[pupil])!;
const bookingIn = async (who: ActiveContext, pupil: string, bookingId: string) => (await childOf(who, pupil)).bookings.find((b) => b.id === bookingId)!;

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests([]);
  saved = await gigSettings();
  savedRow = (await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" }, select: { paymentsEnabled: true, companyLegalName: true, companyGstin: true, companyAddress: true, companyStateCode: true, invoiceSacCode: true, invoicePrefix: true, gstPercent: true, commissionPercent: true, seatPriceMinPaise: true, seatPriceMaxPaise: true } })) as Record<string, unknown>;
  // ₹50–300 a seat, 20 % (decision 0008) and 18 % GST; no free duty owed, so an expert's gate is read from KYC, the account and a mentoring offer.
  await db.gigSettings.update({ where: { id: "gigs" }, data: { pupilFreeOneToOnes: 2, pupilFreeWorkshops: 2, freeCancelHours: 12, workshopMaxSeats: 30, expertStartOneToOnes: 0, expertStartWorkshops: 0, expertMonthlyOneToOnes: 0, expertQuarterlyWorkshops: 0, paymentsEnabled: true, seatPriceMinPaise: 5000, seatPriceMaxPaise: 30000, commissionPercent: 20, gstPercent: 18, companyLegalName: "ZZ Shalaghar Seats Test Private Limited", companyGstin: "27AAACZ1234A1Z5", companyAddress: "ZZ 1 Test Road, Pune", companyStateCode: "27", invoicePrefix: PREFIX } });
  schoolId = (await db.school.create({ data: { name: `ZZ Seats School ${STAMP}`, slug: `zz-seats-${STAMP}`, code: `ZZS${String(STAMP).slice(-6)}`, contactEmail: `zz-seats-${STAMP}@test.invalid`, teacherGuidanceOn: true }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-seats-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } })).id;
    if (role) member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null);
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ Bridge engineer", offering: "BOTH", publishedAt: new Date(), kycStatus: "VERIFIED", verifiedAt: new Date() } });
  // A Route linked account the devbox gateway has activated, as the fixture's: the expert may sell a seat.
  await db.expertPayoutAccount.create({ data: { expertUserId: id.expert!, payeeName: "ZZ Meenakshi Rao", addressLine: "ZZ 12 Shaniwar Peth", city: "Pune", postalCode: "411030", phone: "9800000001", gstStateCode: "27", status: "ACTIVE", linkedAccountId: `acc_zzseats${String(STAMP).slice(-8)}`, stakeholderId: "sth_zzseats", routeProductId: "acc_prd_zzseats", routeStatus: "ACTIVATED", routeRequirements: "[]", routeCheckedAt: new Date() } });
  await person("teacher", "TEACHER");
  await person("admin", "ADMIN");
  await person("operator", null, { isSuperuser: true });
  await person("adult", "STUDENT", { isMinor: false });
  for (const [pupil, guardian] of [["p1", "g1"], ["p2", "g2"]] as const) {
    await person(pupil, "STUDENT", { isMinor: true });
    await person(guardian, null);
    await db.guardianship.create({ data: { parentUserId: id[guardian]!, studentMembershipId: member[pupil]!, studentSchoolId: schoolId, status: "ACTIVE" } });
  }
});

afterAll(async () => {
  setActivePlansForTests([]);
  setFeaturesForTests([...PLATFORM_FEATURES]);
  const users = Object.values(id);
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
  await db.entitlement.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId }, { targetId: { in: users } }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: { ...saved, ...savedRow } });
  await db.$disconnect();
});

describe("the meeting link", () => {
  it("is a Meet, Zoom, Teams or Jitsi room on https, and nothing else", () => {
    expect(meetingServiceOf("https://meet.google.com/abc-defg-hij")).toBe("MEET");
    expect(meetingServiceOf("https://us02web.zoom.us/j/123456789?pwd=x")).toBe("ZOOM");
    expect(meetingServiceOf("https://zoom.us/j/1")).toBe("ZOOM");
    expect(meetingServiceOf("https://teams.microsoft.com/l/meetup-join/19%3a")).toBe("TEAMS");
    expect(meetingServiceOf("https://teams.live.com/meet/9")).toBe("TEAMS");
    expect(meetingServiceOf("https://meet.jit.si/ZZRoom")).toBe("JITSI");
    for (const bad of ["http://meet.google.com/abc", "https://meet.google.com.example.in/abc", "https://evilzoom.us/j/1", "https://user:pw@meet.jit.si/x", "https://meet.jit.si:8443/x", "https://example.com/meet", "meet.google.com/abc", "https://meet.google.com/a b", ""]) expect(isMeetingLink(bad), bad).toBe(false);
  });
});

describe("pricing a time", () => {
  it("an expert may price a one-to-one, like a workshop seat, within the band; outside it is refused", async () => {
    // The expert's mentoring offer, the fourth condition: a free one-to-one in the coming thirty days.
    await offered(expert(), "ONE_TO_ONE");
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", { pricePaise: 20000 }))).toMatchObject({ ok: true });
    expect(await offerSlot(expert(), slot("WORKSHOP", { pricePaise: 10000, seats: 10 }))).toMatchObject({ ok: true });
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", { pricePaise: 40000 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePrice" });
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", { pricePaise: 1000 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePrice" });
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", { meetingUrl: "https://example.com/room" }))).toMatchObject({ ok: false, errorKey: "seats.refuseMeetingLink" });
  });

  it("a teacher may price guidance once a UPI id is saved, within the band, and not while payments are off", async () => {
    expect(await offerSlot(teacher(), slot("ONE_TO_ONE", { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "seats.refuseTeacherPayee" });
    expect((await mySlots(teacher())).teacherGate).toMatchObject({ paymentsOn: true, payeeSaved: false, canCharge: false });
    await db.gigPayee.create({ data: { userId: id.teacher!, upiId: "zz.seats@zzbank", payeeName: "ZZ Sunita Kale" } });
    expect(await offerSlot(teacher(), slot("ONE_TO_ONE", { pricePaise: 40000 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePrice" });
    expect(await offerSlot(teacher(), slot("ONE_TO_ONE", { pricePaise: 10000 }))).toMatchObject({ ok: true });
    expect(await offerSlot(teacher(), slot("WORKSHOP", { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refuseTeacherWorkshop" });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: false } });
    expect(await offerSlot(teacher(), slot("ONE_TO_ONE", { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePaymentsOff" });
    expect(await offerSlot(expert(), slot("ONE_TO_ONE", { pricePaise: 10000 }))).toMatchObject({ ok: false, errorKey: "gigs.refusePaymentsOff" });
    await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: true } });
    expect((await mySlots(teacher())).teacherGate).toMatchObject({ paymentsOn: true, payeeSaved: true, canCharge: true });
  });
});

describe("who may offer", () => {
  it("an expert needs the EXPERT plan and a teacher the TEACHER plan while each is asked for, and the platform switch stands above both", async () => {
    setActivePlansForTests(["EXPERT", "TEACHER"]);
    try {
      await expect(offerSlot(expert(), slot("ONE_TO_ONE"))).rejects.toBeInstanceOf(PlanRequiredError);
      await expect(offerSlot(teacher(), slot("ONE_TO_ONE"))).rejects.toBeInstanceOf(PlanRequiredError);
      const year = { validFrom: new Date(Date.now() - HOUR), validTo: new Date(Date.now() + 365 * 24 * HOUR), source: "GRANT" };
      await db.entitlement.create({ data: { userId: id.expert!, feature: "EXPERT_SESSIONS", planCode: "EXPERT", ...year } });
      await db.entitlement.create({ data: { userId: id.teacher!, feature: "TEACHER_SESSIONS", planCode: "TEACHER", ...year } });
      expect(await offerSlot(expert(), slot("ONE_TO_ONE"))).toMatchObject({ ok: true });
      expect(await offerSlot(teacher(), slot("ONE_TO_ONE"))).toMatchObject({ ok: true });
      setFeaturesForTests(PLATFORM_FEATURES.filter((f) => f !== "EXPERT_SESSIONS" && f !== "TEACHER_SESSIONS"));
      await expect(offerSlot(expert(), slot("ONE_TO_ONE"))).rejects.toBeInstanceOf(FeatureOffError);
      await expect(offerSlot(teacher(), slot("ONE_TO_ONE"))).rejects.toBeInstanceOf(FeatureOffError);
    } finally {
      setFeaturesForTests([...PLATFORM_FEATURES]);
      setActivePlansForTests([]);
    }
  });
});

describe("the free allowance, on times priced 0 alone", () => {
  it("a priced time is bought though the allowance is untouched; a free time takes from the allowance and is refused past it", async () => {
    const before = (await childOf(g2(), "p2")).allowance.ONE_TO_ONE;
    expect(before).toMatchObject({ allowed: 2, used: 0, left: 2 });
    const priced = await offered(expert(), "ONE_TO_ONE", { pricePaise: 20000 });
    const open = (await childOf(g2(), "p2")).open.find((s) => s.id === priced)!;
    expect(open).toMatchObject({ pricePaise: 20000, freeSeat: false });
    const seat = await booked(g2(), priced, "p2");
    expect(seat).toMatchObject({ status: "PENDING_PAYMENT", checkout: { amountPaise: 20000 } });
    expect((await db.gigBooking.findUniqueOrThrow({ where: { id: seat.bookingId } })).paid).toBe(true);
    expect((await childOf(g2(), "p2")).allowance.ONE_TO_ONE).toMatchObject({ used: 0, left: 2 });
    for (let i = 0; i < 2; i += 1) expect(await booked(g2(), await offered(expert(), "ONE_TO_ONE"), "p2")).toMatchObject({ status: "CONFIRMED", checkout: null });
    expect((await childOf(g2(), "p2")).allowance.ONE_TO_ONE).toMatchObject({ used: 2, left: 0 });
    expect(await bookSeat(g2(), { slotId: await offered(expert(), "ONE_TO_ONE"), studentMembershipId: member.p2, purpose })).toMatchObject({ ok: false, errorKey: "gigs.refuseAllowanceOneToOne" });
    // …and a priced time is still sold past it.
    expect(await booked(g2(), await offered(expert(), "ONE_TO_ONE", { pricePaise: 15000 }), "p2")).toMatchObject({ status: "PENDING_PAYMENT" });
  });
});

describe("who buys", () => {
  it("a pupil under eighteen asks and never pays; the guardian agrees and pays; the pupil is refused the checkout", async () => {
    const priced = await offered(expert(), "ONE_TO_ONE", { pricePaise: 20000 });
    const child = await childOf(p1(), "p1");
    expect(child.selfPays).toBe(false);
    const ask = await booked(p1(), priced, "p1");
    expect(ask).toMatchObject({ status: "PENDING_CONSENT", checkout: null });
    expect(await bookingIn(p1(), "p1", ask.bookingId)).toMatchObject({ canPay: false, canJoin: false, meetingUrl: null });
    expect(await db.notification.count({ where: { userId: id.g1 } })).toBeGreaterThan(0);
    const agreed = await consentToBooking(g1(), ask.bookingId, true);
    expect(agreed).toMatchObject({ ok: true, status: "PENDING_PAYMENT" });
    const payment = await db.sessionPayment.findUniqueOrThrow({ where: { bookingId: ask.bookingId } });
    expect(payment).toMatchObject({ payerUserId: id.g1, path: "ROUTE", status: "INITIATED" });
    expect(await refusalKey(seatCheckout(p1(), ask.bookingId))).toBe("FORBIDDEN:seats.askYourParent");
    expect(await seatCheckout(g1(), ask.bookingId)).toMatchObject({ ok: true, checkout: { paymentId: payment.id } });
    expect(await bookingIn(g1(), "p1", ask.bookingId)).toMatchObject({ canPay: true });
  });

  it("a pupil of eighteen or more books and pays for their own seat, and confirms their own checkout", async () => {
    const priced = await offered(expert(), "ONE_TO_ONE", { pricePaise: 20000 });
    expect((await childOf(adult(), "adult")).selfPays).toBe(true);
    const seat = await booked(adult(), priced, "adult");
    expect(seat).toMatchObject({ status: "PENDING_PAYMENT", checkout: { amountPaise: 20000, payerName: "ZZ adult" } });
    expect(await bookingIn(adult(), "adult", seat.bookingId)).toMatchObject({ canPay: true, canJoin: false });
    const p = await db.sessionPayment.findUniqueOrThrow({ where: { bookingId: seat.bookingId } });
    expect(p.payerUserId).toBe(id.adult);
    const gatewayPaymentId = `pay_zzseats${STAMP}a`;
    const confirmed = await confirmSeatCheckout(adult(), { paymentId: p.id, gatewayPaymentId, signature: signSeatCheckout(p.orderId, gatewayPaymentId) });
    expect(confirmed).toEqual({ orderId: p.orderId, amountPaise: 20000 });
    expect(await settleSeatPayment({ ...confirmed, gatewayPaymentId })).toMatchObject({ outcome: "settled" });
    expect(await bookingIn(adult(), "adult", seat.bookingId)).toMatchObject({ status: "CONFIRMED", canJoin: true });
    // Another person's payment is not theirs to confirm.
    expect(await refusalKey(confirmSeatCheckout(p1(), { paymentId: p.id, gatewayPaymentId, signature: "x" }))).toBe("NOT_FOUND:gigs.noSuchPayment");
  });
});

describe("the link, by who asks", () => {
  it("the provider always; a confirmed free holder; a paid holder only once paid; another family, the office and the listing never", async () => {
    const free = await offered(expert(), "ONE_TO_ONE");
    const room = (await db.gigSlot.findUniqueOrThrow({ where: { id: free } })).meetingUrl;
    // In the list of open times, never.
    expect(JSON.stringify((await childOf(g1(), "p1")).open)).not.toContain(room);
    const seat = await booked(g1(), free, "p1");
    expect(seat.status).toBe("CONFIRMED");
    expect(await joinLink(expert(), seat.bookingId)).toMatchObject({ meetingUrl: room, as: "PROVIDER" });
    expect(await joinLink(g1(), seat.bookingId)).toMatchObject({ meetingUrl: room, as: "SEAT" });
    expect(await joinLink(p1(), seat.bookingId)).toMatchObject({ meetingUrl: room, as: "SEAT" });
    expect(await bookingIn(p1(), "p1", seat.bookingId)).toMatchObject({ canJoin: true, meetingUrl: room });
    expect(await refusalKey(joinLink(g2(), seat.bookingId))).toBe("NOT_FOUND:gigs.noSuchBooking");
    expect(await refusalKey(joinLink(p2(), seat.bookingId))).toBe("NOT_FOUND:gigs.noSuchBooking");
    expect(await refusalKey(joinLink(teacher(), seat.bookingId))).toBe("NOT_FOUND:gigs.noSuchBooking");
    expect(await refusalKey(joinLink(admin(), seat.bookingId))).toBe("FORBIDDEN:access.wrongRoleForThisAction");
    expect(JSON.stringify(await schoolSessions(admin()))).not.toContain(room);

    const priced = await offered(expert(), "ONE_TO_ONE", { pricePaise: 20000 });
    const pricedRoom = (await db.gigSlot.findUniqueOrThrow({ where: { id: priced } })).meetingUrl;
    const paid = await booked(g1(), priced, "p1");
    expect(paid.status).toBe("PENDING_PAYMENT");
    expect(await bookingIn(g1(), "p1", paid.bookingId)).toMatchObject({ canJoin: false, meetingUrl: null });
    expect(await refusalKey(joinLink(g1(), paid.bookingId))).toBe("FORBIDDEN:seats.joinAfterPayment");
    expect(await joinLink(expert(), paid.bookingId)).toMatchObject({ meetingUrl: pricedRoom, as: "PROVIDER" });
    expect(await settleSeatPayment({ orderId: paid.checkout!.orderId, gatewayPaymentId: `pay_zzseats${STAMP}l`, amountPaise: 20000 })).toMatchObject({ outcome: "settled" });
    expect(await db.sessionPayment.findUniqueOrThrow({ where: { bookingId: paid.bookingId } })).toMatchObject({ status: "HELD", path: "ROUTE" });
    expect(await joinLink(g1(), paid.bookingId)).toMatchObject({ meetingUrl: pricedRoom, as: "SEAT" });
    expect(await bookingIn(p1(), "p1", paid.bookingId)).toMatchObject({ canJoin: true, meetingUrl: pricedRoom });
    // The one rule, read alone.
    expect(mayJoin({ status: "CONFIRMED", paid: true, payment: { status: "INITIATED" } })).toBe(false);
    expect(mayJoin({ status: "CONFIRMED", paid: true, payment: null })).toBe(false);
    expect(mayJoin({ status: "PENDING_CONSENT", paid: false, payment: null })).toBe(false);
    expect(mayJoin({ status: "CONFIRMED", paid: false, payment: null })).toBe(true);
  });
});

describe("a teacher's sold seat", () => {
  it("is collected by the company, held, due after the session, paid by hand to the teacher's UPI id with the invoice, and counted on the guidance page", async () => {
    const priced = await offered(teacher(), "ONE_TO_ONE", { pricePaise: 10000 });
    const seat = await booked(g2(), priced, "p2");
    expect(seat).toMatchObject({ status: "PENDING_PAYMENT", checkout: { amountPaise: 10000 } });
    expect(await db.sessionPayment.findUniqueOrThrow({ where: { bookingId: seat.bookingId } })).toMatchObject({ path: "COMPANY", status: "INITIATED", transferId: null });
    expect(await settleSeatPayment({ orderId: seat.checkout!.orderId, gatewayPaymentId: `pay_zzseats${STAMP}t`, amountPaise: 10000 })).toMatchObject({ outcome: "settled" });
    const held = await db.sessionPayment.findUniqueOrThrow({ where: { bookingId: seat.bookingId } });
    expect(held).toMatchObject({ status: "HELD", path: "COMPANY", commissionPaise: 2000, gstPaise: 360, netPaise: 7640 });
    expect((await mySlots(teacher())).earnings).toMatchObject({ heldPaise: 7640, seats: 1 });
    const startsAt = (await db.gigSlot.findUniqueOrThrow({ where: { id: priced } })).startsAt;
    const closedAt = new Date(startsAt.getTime() + 10 * 60_000);
    expect(await closeBooking(teacher(), seat.bookingId, "DELIVERED", closedAt)).toMatchObject({ ok: true });
    // A sold seat is not a free duty given.
    expect((await mySlots(teacher(), closedAt)).duty?.deliveredOneToOnes).toBe(0);
    await releaseSeatPayments(new Date(closedAt.getTime() + (HOLD_HOURS + 1) * HOUR));
    const due = await db.sessionPayment.findUniqueOrThrow({ where: { bookingId: seat.bookingId } });
    expect(due).toMatchObject({ status: "DUE" });
    expect((await mySlots(teacher())).earnings).toMatchObject({ heldPaise: 0, duePaise: 7640 });
    const paid = await recordPayout(operator(), due.payoutId!, { reference: `ZZSEATS${String(STAMP).slice(-8)}` });
    expect(paid).toMatchObject({ ok: true, payout: { netPaise: 7640, paymentsCount: 1 } });
    const invoice = await db.gigInvoice.findFirstOrThrow({ where: { payoutId: due.payoutId! } });
    expect(JSON.parse(invoice.buyerJson)).toMatchObject({ name: "ZZ Sunita Kale", gstin: null });
    expect(invoice).toMatchObject({ taxableValuePaise: 2000, totalPaise: 2360 });
    expect((await mySlots(teacher())).earnings).toMatchObject({ duePaise: 0, paidPaise: 7640 });
  });
});

describe("the thirty-minute reminder", () => {
  it("runs every five minutes off the busy minutes, and tells a joinable seat's family once and its provider once, never an unpaid seat", async () => {
    expect(JOBS["sessions:remind"]).toMatchObject({ schedule: "2-57/5 * * * *", describeKey: "root.jobDescSessionsRemind" });
    expect(matchesCron("2-57/5 * * * *", new Date("2026-10-17T10:07:00Z"))).toBe(true);
    expect(matchesCron("2-57/5 * * * *", new Date("2026-10-17T10:05:00Z"))).toBe(false);
    // Far ahead, so the run meets nobody's real session: a slot made straight in the table, as offerSlot refuses one so soon.
    const now = new Date(Date.now() + 400 * 24 * HOUR);
    const startsAt = new Date(now.getTime() + 20 * 60_000);
    const make = async (title: string) => (await db.gigSlot.create({ data: { providerUserId: id.expert!, providerKind: "EXPERT", kind: "WORKSHOP", title, startsAt, endsAt: new Date(startsAt.getTime() + HOUR), meetingUrl: "https://meet.jit.si/zz-remind", seats: 5, seatsTaken: 2, pricePaise: 0 }, select: { id: true } })).id;
    const workshop = await make(`ZZ seats remind ${STAMP}`);
    const later = await db.gigSlot.create({ data: { providerUserId: id.expert!, providerKind: "EXPERT", kind: "ONE_TO_ONE", title: `ZZ seats later ${STAMP}`, startsAt: new Date(now.getTime() + 2 * HOUR), endsAt: new Date(now.getTime() + 2.5 * HOUR), meetingUrl: "https://meet.jit.si/zz-later", seats: 1, seatsTaken: 1 }, select: { id: true } });
    const row = (slotId: string, pupil: string, by: string, over: Record<string, unknown> = {}) => db.gigBooking.create({ data: { schoolId, slotId, studentMembershipId: member[pupil]!, providerUserId: id.expert!, kind: "WORKSHOP", status: "CONFIRMED", bookedByUserId: id[by]!, purpose, consentAt: new Date(), consentUserId: id[by]!, ...over }, select: { id: true } });
    const one = await row(workshop, "p1", "g1");
    const unpaid = await row(workshop, "p2", "g2", { paid: true });
    await db.sessionPayment.create({ data: { bookingId: unpaid.id, slotId: workshop, payerUserId: id.g2!, expertUserId: id.expert!, amountPaise: 10000, commissionPaise: 2000, orderId: `order_zzseats${STAMP}r`, status: "INITIATED" } });
    const notYet = await row(later.id, "adult", "adult", { kind: "ONE_TO_ONE" });
    const told = (userId: string) => db.notification.count({ where: { userId, titleVars: { contains: `seats remind ${STAMP}` } } });
    const before = { g1: await told(id.g1!), p1: await told(id.p1!), expert: await told(id.expert!), g2: await told(id.g2!) };

    const first = await remindJoins(now);
    expect(first).toMatchObject({ reminded: 1, providers: 1 });
    const second = await remindJoins(new Date(now.getTime() + 5 * 60_000));
    expect(second).toMatchObject({ reminded: 0, providers: 0 });
    expect(await told(id.g1!)).toBe(before.g1 + 1);
    expect(await told(id.p1!)).toBe(before.p1 + 1);
    expect(await told(id.expert!)).toBe(before.expert + 1);
    expect(await told(id.g2!)).toBe(before.g2);
    expect((await db.gigBooking.findUniqueOrThrow({ where: { id: one.id } })).joinRemindedAt).not.toBeNull();
    expect((await db.gigBooking.findUniqueOrThrow({ where: { id: unpaid.id } })).joinRemindedAt).toBeNull();
    expect((await db.gigBooking.findUniqueOrThrow({ where: { id: notYet.id } })).joinRemindedAt).toBeNull();
    const notice = await db.notification.findFirstOrThrow({ where: { userId: id.g1!, titleVars: { contains: `seats remind ${STAMP}` } } });
    expect(notice).toMatchObject({ url: `/sessions/${one.id}/join`, body: "" });
    expect(JSON.parse(notice.titleVars)).toMatchObject({ minutes: JOIN_REMIND_MINUTES });
  });
});

describe("the doors", () => {
  it("the join door is in the catalog for the family and the provider, never the office, and the paid doors open to a pupil of eighteen or more and to both session features", () => {
    const door = (method: string, path: string) => ENDPOINTS.find((e) => e.method === method && e.path === path)!;
    expect(door("GET", "/api/v1/gigs/sessions/{bookingId}/join")).toMatchObject({ access: ["STUDENT", "PARENT", "EXPERT", "TEACHER"], feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"] });
    for (const path of ["/api/v1/gigs/sessions/{bookingId}/checkout", "/api/v1/gigs/payments/{paymentId}/confirm"]) expect(door("POST", path)).toMatchObject({ access: ["PARENT", "STUDENT"], feature: ["EXPERT_SESSIONS", "TEACHER_SESSIONS"] });
  });
});
