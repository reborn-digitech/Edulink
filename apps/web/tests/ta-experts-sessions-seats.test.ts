/**
 * Sessions and seats (src/lib/gig-sessions.ts): the Medium and Low findings of the experts-sessions batch of the
 * testing analysis of 13 November 2026 that live in one-to-ones, workshops and series, each held by a case that fails
 * while the defect stands.
 *
 *   TA-116  Taking a cancelled seat again rewrote the row with lateCancel false: a late give-up stopped counting, and
 *           a seat whose money came (held, refunded) was taken again with no order to pay.
 *   TA-118  cancelSeries took a reason of three letters that every cancelSlot refused (five), and still marked the
 *           series cancelled with every session open.
 *   TA-119  The school's stand-in guardian who provides the session could book a pupil into it or agree to their ask.
 *   TA-120  The provider read a pupil's name, school and typed purpose on a seat no guardian had agreed to.
 *   TA-121  An ask nobody answered stayed PENDING_CONSENT for good, using the pupil's free allowance.
 *   TA-123  A closed expert's and a suspended teacher's times stayed open, agreeable, joinable and reminded.
 *   TA-190  A paid seat given up late stayed held for the provider after the provider cancelled the session.
 *   TA-414  Two identical offers at once both passed the overlap read and wrote two slots (and two series).
 *
 * As the database's owner, as tests/gig-sessions.test.ts: the rules, not the policies. One scratch ZZ school of this
 * suite's own (the stamp in every name), its people, slots and bookings, removed afterwards; the operator's gig
 * settings are read, never written.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { GigSeriesRule } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { translator } from "@/lib/i18n/dictionary";
import { calendarFeed } from "@/lib/expert-kyc";
import { bookSlot } from "@/lib/experts";
import { bookSeat, cancelSeries, cancelSlot, consentToBooking, familySessions, joinLink, lapseUnansweredAsks, mySlots, offerSeries, offerSlot, remindJoins } from "@/lib/gig-sessions";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const ids: Record<string, string> = {};
let schoolId = "";
let yearId = "";

const ctx = (key: string, role: ActiveContext["role"], school: string | null): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const pupil = () => ctx("pupil", "STUDENT", schoolId);
const guardian = () => ctx("guardian", "PARENT", null);
const orphan = () => ctx("orphan", "STUDENT", schoolId);
/** The class teacher in the school's stand-in context for the pupil with no family on the app. */
const standIn = () => ctx("standIn", "PARENT", null);
const admin = () => ctx("admin", "ADMIN", schoolId);

let n = 0;
/** A slot written straight to the table, `hoursAhead` from now and an hour and a half after the last. */
async function slotOf(providerKey: string, over: { kind?: "ONE_TO_ONE" | "WORKSHOP"; providerKind?: "EXPERT" | "TEACHER"; startsAt?: Date; pricePaise?: number; seats?: number } = {}): Promise<{ id: string; startsAt: Date; endsAt: Date }> {
  n += 1;
  const startsAt = over.startsAt ?? new Date(Date.now() + 72 * HOUR + n * 90 * 60_000);
  const kind = over.kind ?? "WORKSHOP";
  const endsAt = new Date(startsAt.getTime() + 60 * 60_000);
  const providerKind = over.providerKind ?? "EXPERT";
  const row = await db.gigSlot.create({ data: { providerUserId: id[providerKey]!, providerKind, teacherSchoolId: providerKind === "TEACHER" ? schoolId : null, kind, title: `ZZ TA es slot ${STAMP}-${n}`, startsAt, endsAt, meetingUrl: `https://meet.jit.si/zz-taes-${STAMP}-${n}`, seats: over.seats ?? (kind === "ONE_TO_ONE" ? 1 : 10), pricePaise: over.pricePaise ?? 0 }, select: { id: true } });
  return { id: row.id, startsAt, endsAt };
}
/** A booking written straight to the table. */
async function bookingOf(slotId: string, pupilKey: string, data: { status: string; kind?: string; providerKey?: string; lateCancel?: boolean; paid?: boolean }): Promise<string> {
  const row = await db.gigBooking.create({ data: { schoolId, slotId, studentMembershipId: member[pupilKey]!, providerUserId: id[data.providerKey ?? "expert"]!, kind: data.kind ?? "WORKSHOP", bookedByUserId: id[pupilKey]!, purpose: "ZZ I would like to learn about rock pools.", status: data.status, academicYearId: yearId, lateCancel: data.lateCancel ?? false, paid: data.paid ?? false, ...(data.status === "CANCELLED" ? { cancelledAt: new Date() } : {}) }, select: { id: true } });
  if (data.status !== "CANCELLED") await db.gigSlot.update({ where: { id: slotId }, data: { seatsTaken: { increment: 1 } } });
  return row.id;
}
const workshopsUsed = async (who: ActiveContext, pupilKey = "pupil") => (await familySessions(who)).children.find((c) => c.id === member[pupilKey])!.allowance.WORKSHOP.used;
const refusal = async (p: Promise<unknown>) => {
  try {
    const r = (await p) as { ok?: boolean; errorKey?: string; status?: string };
    return r.ok === false ? r.errorKey : `ok:${r.status ?? ""}`;
  } catch (error) {
    if (error instanceof AccessError) return `${error.code}:${error.key}`;
    throw error;
  }
};

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ TA es School ${STAMP}`, slug: `zz-taes-${STAMP}`, code: `ZZTAES${String(STAMP).slice(-6)}`, contactEmail: `zz-taes-${STAMP}@test.invalid`, teacherGuidanceOn: true, isTestFixture: true }, select: { id: true } })).id;
  yearId = (await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ TA es ${key} ${STAMP}`, email: `zz-taes-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...flags }, select: { id: true } })).id;
    if (role) member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null);
  await person("closer", null);
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ TA es marine biologist", offering: "BOTH", publishedAt: new Date() } });
  ids.closerProfile = (await db.expertProfile.create({ data: { userId: id.closer!, headline: "ZZ TA es expert to be closed", offering: "BOTH", publishedAt: new Date() }, select: { id: true } })).id;
  await person("admin", "ADMIN");
  await person("teacher", "TEACHER");
  await person("standIn", "TEACHER");
  await person("pupil", "STUDENT", { isMinor: true });
  await person("orphan", "STUDENT", { isMinor: true });
  await person("guardian", null);
  await db.guardianship.create({ data: { parentUserId: id.guardian!, studentMembershipId: member.pupil!, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });
  // Two more pupils, each with a guardian, so no case runs into another case's use of the free allowance.
  for (const k of ["2", "3"]) {
    await person(`pupil${k}`, "STUDENT", { isMinor: true });
    await person(`guardian${k}`, null);
    await db.guardianship.create({ data: { parentUserId: id[`guardian${k}`]!, studentMembershipId: member[`pupil${k}`]!, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });
  }
  // The pupil with no family on the app: the class teacher holds the school's stand-in guardianship (standin-guardian.ts).
  await db.guardianship.create({ data: { parentUserId: id.standIn!, studentMembershipId: member.orphan!, studentSchoolId: schoolId, relation: "SCHOOL", status: "ACTIVE" } });
}, 120_000);

afterAll(async () => {
  const users = Object.values(id);
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.gigSeries.deleteMany({ where: { providerUserId: { in: users } } }).catch(() => {});
  await db.expertSlot.deleteMany({ where: { expert: { userId: { in: users } } } }).catch(() => {});
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId }] } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
}, 120_000);

describe("sessions and seats: the experts-sessions batch", () => {
  it("TA-120: a seat no guardian has agreed to is shown to the provider with no name, school or words of the child's, and the calendar feed neither counts nor places it", async () => {
    const slot = await slotOf("expert");
    const asked = await bookSeat(pupil(), { slotId: slot.id, purpose: "ZZ I worry about my exams and want to talk." });
    expect(asked).toMatchObject({ ok: true, status: "PENDING_CONSENT" });
    const seat = () => mySlots(expert()).then((v) => v.slots.find((s) => s.id === slot.id)!.bookings[0]!);
    expect(await seat()).toMatchObject({ status: "PENDING_CONSENT", pupilName: "", schoolName: "", purpose: "" });
    const token = `zz-taes-feed-${STAMP}`;
    await db.expertProfile.update({ where: { userId: id.expert! }, data: { calendarToken: token } });
    const feed = (await calendarFeed(token, translator("en"))) ?? "";
    expect(feed).not.toContain(`ZZ TA es School ${STAMP}`);
    // Once a guardian agrees, the provider is told who is coming.
    expect(await consentToBooking(guardian(), (asked as { bookingId: string }).bookingId, true)).toMatchObject({ ok: true, status: "CONFIRMED" });
    expect(await seat()).toMatchObject({ status: "CONFIRMED", pupilName: `ZZ TA es pupil ${STAMP}`, schoolName: `ZZ TA es School ${STAMP}`, purpose: "ZZ I worry about my exams and want to talk." });
    expect((await calendarFeed(token, translator("en"))) ?? "").toContain(`ZZ TA es School ${STAMP}`);
  });

  it("TA-116: a seat given up late cannot be taken again, so it still counts; a seat whose money was refunded cannot be taken again with no order; a seat given up in time can", async () => {
    const late = await slotOf("expert");
    await bookingOf(late.id, "pupil2", { status: "CANCELLED", lateCancel: true });
    const before = await workshopsUsed(ctx("pupil2", "STUDENT", schoolId), "pupil2");
    expect(await refusal(bookSeat(ctx("pupil2", "STUDENT", schoolId), { slotId: late.id, purpose: "ZZ I would like that seat back please." }))).toBe("gigs.refuseRetake");
    expect(await db.gigBooking.findFirstOrThrow({ where: { slotId: late.id }, select: { status: true, lateCancel: true } })).toEqual({ status: "CANCELLED", lateCancel: true });
    expect(await workshopsUsed(ctx("pupil2", "STUDENT", schoolId), "pupil2")).toBe(before);

    const priced = await slotOf("expert", { pricePaise: 10000 });
    const refunded = await bookingOf(priced.id, "pupil", { status: "CANCELLED", paid: true });
    await db.sessionPayment.create({ data: { bookingId: refunded, slotId: priced.id, payerUserId: id.guardian!, expertUserId: id.expert!, amountPaise: 10000, commissionPaise: 0, gstPaise: 0, netPaise: 0, orderId: `order_zztaes${STAMP}r`, paymentId: `pay_zztaes${STAMP}r`, status: "REFUNDED", path: "COMPANY", refundedAt: new Date() } });
    expect(await refusal(bookSeat(guardian(), { slotId: priced.id, studentMembershipId: member.pupil, purpose: "ZZ booking the paid seat again." }))).toBe("gigs.refuseRetake");

    const inTime = await slotOf("expert");
    await bookingOf(inTime.id, "pupil2", { status: "CANCELLED" });
    expect(await refusal(bookSeat(ctx("guardian2", "PARENT", null), { slotId: inTime.id, studentMembershipId: member.pupil2, purpose: "ZZ taking the seat again, in good time." }))).toBe("ok:CONFIRMED");
  });

  it("TA-190: the provider cancelling a session refunds a paid seat the family gave up late, which is no longer held for the provider", async () => {
    const slot = await slotOf("expert", { pricePaise: 10000 });
    const b = await bookingOf(slot.id, "pupil", { status: "CANCELLED", lateCancel: true, paid: true });
    await db.sessionPayment.create({ data: { bookingId: b, slotId: slot.id, payerUserId: id.guardian!, expertUserId: id.expert!, amountPaise: 10000, commissionPaise: 2000, gstPaise: 360, netPaise: 7640, orderId: `order_zztaes${STAMP}l`, paymentId: `pay_zztaes${STAMP}l`, status: "HELD", path: "COMPANY", paidAt: new Date(), holdUntil: new Date(slot.endsAt.getTime() + 48 * HOUR) } });
    expect(await cancelSlot(expert(), slot.id, "ZZ the expert is unwell")).toEqual({ ok: true });
    const p = await db.sessionPayment.findUniqueOrThrow({ where: { bookingId: b }, select: { status: true, pendingAction: true } });
    // Refunded at once, or waiting as a refund for the job and the operator: never left held for release.
    expect(p.status === "REFUNDED" || p.pendingAction === "REFUND").toBe(true);
  });

  it("TA-121: an ask no guardian answered before the session began lapses: CANCELLED with no late mark, the seat given back, the allowance freed", async () => {
    const slot = await slotOf("expert", { startsAt: new Date(Date.now() - HOUR) });
    const before = await workshopsUsed(pupil());
    const b = await bookingOf(slot.id, "pupil", { status: "PENDING_CONSENT" });
    expect(await workshopsUsed(pupil())).toBe(before + 1);
    expect(await lapseUnansweredAsks(new Date(), { schoolIds: [schoolId] })).toEqual({ lapsed: 1 });
    expect(await db.gigBooking.findUniqueOrThrow({ where: { id: b }, select: { status: true, lateCancel: true } })).toEqual({ status: "CANCELLED", lateCancel: false });
    expect((await db.gigSlot.findUniqueOrThrow({ where: { id: slot.id }, select: { seatsTaken: true } })).seatsTaken).toBe(0);
    expect(await workshopsUsed(pupil())).toBe(before);
    // A clock moved ahead lapses nothing whose session is still to come.
    const ahead = await slotOf("expert");
    const waiting = await bookingOf(ahead.id, "pupil", { status: "PENDING_CONSENT" });
    expect(await lapseUnansweredAsks(new Date(ahead.startsAt.getTime() + HOUR), { schoolIds: [schoolId] })).toEqual({ lapsed: 0 });
    expect((await db.gigBooking.findUniqueOrThrow({ where: { id: waiting }, select: { status: true } })).status).toBe("PENDING_CONSENT");
  });

  it("TA-123: once the operator closes an expert, a waiting ask cannot be agreed to, a confirmed seat is neither joinable nor reminded, and the expert's window cannot be booked by id", async () => {
    const asked = await slotOf("closer");
    const ask = await bookSeat(ctx("pupil3", "STUDENT", schoolId), { slotId: asked.id, purpose: "ZZ an ask the guardian answers late." });
    expect(ask).toMatchObject({ ok: true, status: "PENDING_CONSENT" });
    const soon = await slotOf("closer", { startsAt: new Date(Date.now() + 20 * 60_000) });
    const confirmed = await bookingOf(soon.id, "pupil3", { status: "CONFIRMED", providerKey: "closer" });
    const window = await db.expertSlot.create({ data: { expertProfileId: ids.closerProfile!, startsAt: new Date(Date.now() + 96 * HOUR), endsAt: new Date(Date.now() + 97 * HOUR) }, select: { id: true } });
    await db.expertProfile.update({ where: { id: ids.closerProfile! }, data: { disabledAt: new Date() } });

    expect(await refusal(consentToBooking(ctx("guardian3", "PARENT", null), (ask as { bookingId: string }).bookingId, true))).toBe("gigs.refuseProviderGone");
    expect(await refusal(joinLink(ctx("guardian3", "PARENT", null), confirmed))).toBe("FORBIDDEN:gigs.refuseProviderGone");
    await remindJoins(new Date());
    expect(await db.gigBooking.findUniqueOrThrow({ where: { id: confirmed }, select: { joinRemindedAt: true } })).toEqual({ joinRemindedAt: null });
    expect(await db.notification.count({ where: { userId: { in: [id.guardian3!, id.pupil3!] }, titleKey: "seats.notifJoinSoon" } })).toBe(0);
    expect(await refusal(bookSlot(admin(), window.id, "ZZ a consultation"))).toBe("NOT_FOUND:access.noSuchSlot");
  });

  it("TA-123: a suspended teacher's time leaves the pupils' open list and cannot be booked", async () => {
    const slot = await slotOf("teacher", { kind: "ONE_TO_ONE", providerKind: "TEACHER" });
    const open = async () => (await familySessions(guardian())).children.find((c) => c.id === member.pupil)!.open.map((s) => s.id);
    expect(await open()).toContain(slot.id);
    await db.membership.update({ where: { id: member.teacher! }, data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: "ZZ TA es" } });
    expect(await open()).not.toContain(slot.id);
    expect(await refusal(bookSeat(guardian(), { slotId: slot.id, studentMembershipId: member.pupil, purpose: "ZZ guidance with the suspended teacher." }))).toBe("NOT_FOUND:gigs.noSuchSlot");
  });

  it("TA-123: the family's sessions list hands out no room and no join for a confirmed seat of a closed expert or a suspended teacher, while a standing provider's seat keeps them", async () => {
    // Providers of this case's own, so the order of the cases above does not matter.
    const make = async (key: string) => (id[key] = (await db.user.create({ data: { name: `ZZ TA es ${key} ${STAMP}`, email: `zz-taes-${key}-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id);
    await make("listCloser");
    await make("listTeacher");
    const closedProfile = (await db.expertProfile.create({ data: { userId: id.listCloser!, headline: "ZZ TA es expert closed while booked", offering: "BOTH", publishedAt: new Date() }, select: { id: true } })).id;
    const teacherPost = (await db.membership.create({ data: { userId: id.listTeacher!, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
    const soon = (h: number) => new Date(Date.now() + h * 60_000);
    const standing = await bookingOf((await slotOf("expert", { startsAt: soon(25) })).id, "pupil3", { status: "CONFIRMED" });
    const closed = await bookingOf((await slotOf("listCloser", { startsAt: soon(30) })).id, "pupil3", { status: "CONFIRMED", providerKey: "listCloser" });
    const taught = await bookingOf((await slotOf("listTeacher", { kind: "ONE_TO_ONE", providerKind: "TEACHER", startsAt: soon(35) })).id, "pupil3", { status: "CONFIRMED", kind: "ONE_TO_ONE", providerKey: "listTeacher" });
    const seats = async () => new Map((await familySessions(ctx("guardian3", "PARENT", null))).children.find((c) => c.id === member.pupil3)!.bookings.map((b) => [b.id, { canJoin: b.canJoin, meetingUrl: b.meetingUrl }]));
    const before = await seats();
    expect(before.get(closed)!.canJoin).toBe(true);
    expect(before.get(taught)!.canJoin).toBe(true);

    await db.expertProfile.update({ where: { id: closedProfile }, data: { disabledAt: new Date() } });
    await db.membership.update({ where: { id: teacherPost }, data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: "ZZ TA es" } });
    const after = await seats();
    expect(after.get(closed)).toEqual({ canJoin: false, meetingUrl: null });
    expect(after.get(taught)).toEqual({ canJoin: false, meetingUrl: null });
    expect(after.get(standing)!.canJoin).toBe(true);
    expect(after.get(standing)!.meetingUrl).toMatch(/^https:\/\/meet\.jit\.si\/zz-taes-/);
  });

  it("TA-119: the stand-in guardian who provides the session can neither book the pupil into it nor agree to the pupil's ask", async () => {
    const own = await slotOf("standIn", { kind: "ONE_TO_ONE", providerKind: "TEACHER" });
    expect(await refusal(bookSeat(standIn(), { slotId: own.id, studentMembershipId: member.orphan, purpose: "ZZ the stand-in books their own time." }))).toBe("gigs.refuseOwnSession");
    expect(await db.gigBooking.count({ where: { slotId: own.id } })).toBe(0);
    const other = await slotOf("standIn", { kind: "ONE_TO_ONE", providerKind: "TEACHER" });
    const ask = await bookSeat(orphan(), { slotId: other.id, purpose: "ZZ the pupil asks for the teacher's time." });
    expect(ask).toMatchObject({ ok: true, status: "PENDING_CONSENT" });
    expect(await refusal(consentToBooking(standIn(), (ask as { bookingId: string }).bookingId, true))).toBe("gigs.refuseOwnSession");
    expect((await db.gigBooking.findUniqueOrThrow({ where: { id: (ask as { bookingId: string }).bookingId }, select: { status: true } })).status).toBe("PENDING_CONSENT");
  });

  it("TA-118: a series cancelled with a reason every session would refuse is refused whole; five letters cancel every session and only then mark the series", async () => {
    const day = (k: number) => new Date(Date.now() + (200 + k * 24) * HOUR).toISOString();
    const rule = { mode: "DATES", startsAt: [day(1), day(2), day(3)] } as GigSeriesRule;
    const made = await offerSeries(expert(), { kind: "WORKSHOP", title: `ZZ TA es series ${STAMP}`, meetingUrl: `https://meet.jit.si/zz-taes-series-${STAMP}`, minutes: 60, seats: 5, rule });
    if (!made.ok) throw new Error(made.errorKey);
    expect(await cancelSeries(expert(), made.seriesId, "sick")).toEqual({ ok: false, errorKey: "gigs.needReason" });
    expect((await db.gigSeries.findUniqueOrThrow({ where: { id: made.seriesId }, select: { cancelledAt: true } })).cancelledAt).toBeNull();
    expect(await db.gigSlot.count({ where: { seriesId: made.seriesId, cancelledAt: null } })).toBe(3);
    expect(await cancelSeries(expert(), made.seriesId, "ZZ unwell")).toEqual({ ok: true, cancelled: 3 });
    expect((await db.gigSeries.findUniqueOrThrow({ where: { id: made.seriesId }, select: { cancelledAt: true } })).cancelledAt).not.toBeNull();
  });

  it("TA-414: the same offer sent twice at once makes one slot, and the same series sent twice makes one series", async () => {
    const startsAt = new Date(Date.now() + 400 * HOUR).toISOString();
    const offer = { kind: "WORKSHOP" as const, title: `ZZ TA es twice ${STAMP}`, startsAt, minutes: 60, seats: 5, meetingUrl: `https://meet.jit.si/zz-taes-twice-${STAMP}` };
    const both = await Promise.all([offerSlot(expert(), offer), offerSlot(expert(), offer)]);
    expect(both.filter((r) => r.ok)).toHaveLength(1);
    expect(both.filter((r) => !r.ok).map((r) => (r.ok ? "" : r.errorKey))).toEqual(["gigs.refuseSlotOverlap"]);
    expect(await db.gigSlot.count({ where: { providerUserId: id.expert!, title: offer.title, cancelledAt: null } })).toBe(1);

    const day = (k: number) => new Date(Date.now() + (600 + k * 24) * HOUR).toISOString();
    const series = { kind: "WORKSHOP" as const, title: `ZZ TA es series twice ${STAMP}`, meetingUrl: `https://meet.jit.si/zz-taes-st-${STAMP}`, minutes: 60, seats: 5, rule: { mode: "DATES", startsAt: [day(1), day(2)] } as GigSeriesRule };
    const twice = await Promise.all([offerSeries(expert(), series), offerSeries(expert(), series)]);
    expect(twice.filter((r) => r.ok)).toHaveLength(1);
    expect(await db.gigSeries.count({ where: { providerUserId: id.expert!, title: series.title } })).toBe(1);
  });
});
