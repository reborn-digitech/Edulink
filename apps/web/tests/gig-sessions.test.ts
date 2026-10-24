import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { gigSettings } from "@/lib/gig-questions";
import { bookSeat, cancelBooking, cancelSlot, closeBooking, consentToBooking, familySessions, mySlots, offerSlot, rateBooking, remindSessions, reportUnheld, schoolSessions, sessionCounts, setTeacherGuidance } from "@/lib/gig-sessions";
import type { ActiveContext } from "@/lib/session";

/**
 * Gigs, the free tier: one-to-one sessions and workshops (decision 0004).
 * A teacher offers nothing until the school switches guidance on, and then
 * only one-to-ones to the school's own pupils; an expert off the list offers
 * nothing. A pupil's own ask waits for a guardian and a guardian's booking
 * does not; the meeting link is shown only while a seat is confirmed. A pupil
 * has so many free seats a year, counted under a lock; a slot never goes past
 * its seats; a seat given up in time is given back and one given up late is
 * not. The provider says how it went, the family rates it once, and the
 * office reads and may cancel every session of its own pupils and no other's.
 *
 * The suite runs as the database's owner, so it proves the rules and not the
 * row policies: those are rls:verify's and the browser tests'.
 */
const db = new PrismaClient();
const STAMP = Date.now();
const HOUR = 3_600_000;
let saved: Awaited<ReturnType<typeof gigSettings>>;
const school = { a: "", b: "" };
const id: Record<string, string> = {};
const member: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], schoolId: string | null, flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId, role, user: { id: id[key]!, name: key, preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const expert = () => ctx("expert", "EXPERT", null);
const hidden = () => ctx("hidden", "EXPERT", null);
const teacher = () => ctx("teacher", "TEACHER", school.a);
const admin = () => ctx("admin", "ADMIN", school.a);
const adminB = () => ctx("adminB", "ADMIN", school.b);
const p1 = () => ctx("p1", "STUDENT", school.a);
const p2 = () => ctx("p2", "STUDENT", school.a);
const q = () => ctx("q", "STUDENT", school.b);
const g1 = () => ctx("g1", "PARENT", null);
const g2 = () => ctx("g2", "PARENT", null);
const gq = () => ctx("gq", "PARENT", null);

let n = 0;
/** A slot `hoursAhead` from now, each an hour and a half after the last so that none overlaps. */
const slot = (kind: "ONE_TO_ONE" | "WORKSHOP", hoursAhead = 48, over: Record<string, unknown> = {}) => {
  n += 1;
  return { kind, title: `ZZ session ${STAMP}-${n}`, startsAt: new Date(Date.now() + hoursAhead * HOUR + n * 90 * 60_000).toISOString(), meetingUrl: `https://meet.jit.si/zz-${STAMP}-${n}`, ...over };
};
const offer = async (who: ActiveContext, kind: "ONE_TO_ONE" | "WORKSHOP", hoursAhead = 48, over: Record<string, unknown> = {}) => {
  const result = await offerSlot(who, slot(kind, hoursAhead, over));
  if (!result.ok) throw new Error(`offer refused: ${result.errorKey}`);
  return result.slotId;
};
const mine = async (who: ActiveContext, childKey: string) => (await familySessions(who)).children.find((c) => c.id === member[childKey])!;
const notes = (userKey: string, needle: string) => db.notification.count({ where: { userId: id[userKey], title: { contains: needle } } });

beforeAll(async () => {
  saved = await gigSettings();
  await db.gigSettings.update({ where: { id: "gigs" }, data: { pupilFreeOneToOnes: 2, pupilFreeWorkshops: 2, freeCancelHours: 12, workshopMaxSeats: 30, expertStartOneToOnes: 10, expertStartWorkshops: 2, expertMonthlyOneToOnes: 2, expertQuarterlyWorkshops: 1, teacherMonthlyGuidance: 2 } });
  for (const k of ["a", "b"] as const) {
    const s = await db.school.create({ data: { name: `ZZ Session School ${k.toUpperCase()} ${STAMP}`, slug: `zz-sess-${k}-${STAMP}`, code: `ZZS${k}${String(STAMP).slice(-6)}`, contactEmail: `zz-sess-${k}-${STAMP}@test.invalid` }, select: { id: true } });
    school[k] = s.id;
    await db.academicYear.create({ data: { schoolId: s.id, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
  }
  const person = async (key: string, role: string | null, schoolId: string | null, flags: Record<string, unknown> = {}) => {
    const user = await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-sess-${key}-${STAMP}@test.invalid`, ...flags }, select: { id: true } });
    id[key] = user.id;
    if (role && schoolId) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  await person("expert", null, null);
  await person("hidden", null, null);
  await db.expertProfile.create({ data: { userId: id.expert!, headline: "ZZ Marine biologist", offering: "BOTH", publishedAt: new Date() } });
  await db.expertProfile.create({ data: { userId: id.hidden!, headline: "ZZ Not yet listed", offering: "BOTH" } });
  await person("teacher", "TEACHER", school.a);
  await person("admin", "ADMIN", school.a);
  await person("adminB", "ADMIN", school.b);
  await person("operator", null, null, { isSuperuser: true });
  for (const [pupil, guardian, s] of [["p1", "g1", school.a], ["p2", "g2", school.a], ["q", "gq", school.b]] as const) {
    await person(pupil, "STUDENT", s, { isMinor: true });
    await person(guardian, null, null);
    await db.guardianship.create({ data: { parentUserId: id[guardian]!, studentMembershipId: member[pupil]!, studentSchoolId: s, status: "ACTIVE" } });
  }
});

afterAll(async () => {
  const users = Object.values(id);
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: users } } }).catch(() => {});
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { id: { in: [school.a, school.b] } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: saved });
  await db.$disconnect();
});

describe("sessions and workshops", () => {
  it("a teacher offers nothing until the school switches guidance on, and then one-to-ones only; an expert off the list offers nothing", async () => {
    expect(await mySlots(teacher())).toMatchObject({ enabled: false, slots: [] });
    await expect(offerSlot(teacher(), slot("ONE_TO_ONE"))).rejects.toMatchObject({ key: "gigs.refuseGuidanceOff" });
    await expect(setTeacherGuidance(teacher(), true)).rejects.toBeInstanceOf(AccessError);
    await expect(setTeacherGuidance(ctx("p1", "STUDENT", school.a), true)).rejects.toBeInstanceOf(AccessError);
    expect(await setTeacherGuidance(admin(), true)).toMatchObject({ ok: true, guidanceOn: true });
    expect(await offerSlot(teacher(), slot("WORKSHOP"))).toMatchObject({ ok: false, errorKey: "gigs.refuseTeacherWorkshop" });
    await expect(offerSlot(hidden(), slot("ONE_TO_ONE"))).rejects.toBeInstanceOf(AccessError);
    for (const who of [admin(), p1(), g1()]) await expect(offerSlot(who, slot("ONE_TO_ONE"))).rejects.toBeInstanceOf(AccessError);

    const refused = async (over: Record<string, unknown>, kind: "ONE_TO_ONE" | "WORKSHOP" = "WORKSHOP") => {
      const result = await offerSlot(expert(), slot(kind, 48, over));
      return result.ok ? "offered" : result.errorKey;
    };
    expect(await refused({ title: "no" })).toBe("gigs.refuseSlotTitle");
    expect(await refused({ startsAt: "not a date" })).toBe("gigs.refuseSlotTime");
    expect(await refused({ startsAt: new Date(Date.now() + 10 * 60_000).toISOString() })).toBe("gigs.refuseSlotTooSoon");
    expect(await refused({ startsAt: new Date(Date.now() + 200 * 24 * HOUR).toISOString() })).toBe("gigs.refuseSlotTooFar");
    expect(await refused({ minutes: 10 })).toBe("gigs.refuseSlotLength");
    expect(await refused({ seats: 1 })).toBe("gigs.refuseSeats");
    expect(await refused({ seats: 31 })).toBe("gigs.refuseSeats");
    expect(await refused({ meetingUrl: "http://meet.jit.si/plain" })).toBe("seats.refuseMeetingLink");
    expect(await refused({ meetingUrl: "https://meet.example.test/zz" })).toBe("seats.refuseMeetingLink");
    // A one-to-one is thirty minutes and one seat whatever is asked; a second time over the first is refused.
    const first = slot("ONE_TO_ONE", 200, { minutes: 90, seats: 9 });
    const made = await offerSlot(expert(), first);
    expect(made.ok).toBe(true);
    const row = await db.gigSlot.findUniqueOrThrow({ where: { id: made.ok ? made.slotId : "" } });
    expect(row.seats).toBe(1);
    expect(row.endsAt.getTime() - row.startsAt.getTime()).toBe(30 * 60_000);
    expect(await offerSlot(expert(), { ...first, title: "ZZ the same half hour again" })).toMatchObject({ ok: false, errorKey: "gigs.refuseSlotOverlap" });
    await cancelSlot(expert(), row.id, "ZZ test tidy");
  });

  it("an expert's time is open to every school's pupils and a teacher's to their own school's alone; nobody is shown the link", async () => {
    const byExpert = await offer(expert(), "ONE_TO_ONE", 300);
    const byTeacher = await offer(teacher(), "ONE_TO_ONE", 300);
    const seenBy = async (who: ActiveContext, key: string) => (await mine(who, key)).open.map((s) => s.id);
    expect(await seenBy(p1(), "p1")).toEqual(expect.arrayContaining([byExpert, byTeacher]));
    expect(await seenBy(g1(), "p1")).toEqual(expect.arrayContaining([byExpert, byTeacher]));
    const other = await seenBy(q(), "q");
    expect(other).toContain(byExpert);
    expect(other).not.toContain(byTeacher);
    expect(JSON.stringify((await mine(p1(), "p1")).open)).not.toContain("meet.jit.si");
    // Asked for by name, the other school's teacher's time is not found.
    await expect(bookSeat(q(), { slotId: byTeacher, purpose: "ZZ I want help with fractions" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(bookSeat(gq(), { slotId: byTeacher, studentMembershipId: member.q, purpose: "ZZ I want help with fractions" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    // A guardian cannot book for a child who is not theirs.
    await expect(bookSeat(g2(), { slotId: byExpert, studentMembershipId: member.p1, purpose: "ZZ I want help with fractions" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    for (const who of [admin(), teacher(), expert()]) await expect(bookSeat(who, { slotId: byExpert, purpose: "ZZ I want help with fractions" })).rejects.toBeInstanceOf(AccessError);
    await cancelSlot(expert(), byExpert, "ZZ test tidy");
    await cancelSlot(teacher(), byTeacher, "ZZ test tidy");
  });

  it("a test-fixture expert's time hidden from a real school's pupil is not bookable by its id either; a fixture school's pupil sees and books it (QA-50)", async () => {
    await db.user.update({ where: { id: id.expert! }, data: { isTestFixture: true } });
    try {
      const slotId = await offer(expert(), "WORKSHOP", 320);
      expect((await mine(p1(), "p1")).open.map((s) => s.id)).not.toContain(slotId);
      expect((await mine(g1(), "p1")).open.map((s) => s.id)).not.toContain(slotId);
      await expect(bookSeat(p1(), { slotId, purpose: "ZZ A workshop I was never shown" })).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(bookSeat(g1(), { slotId, studentMembershipId: member.p1, purpose: "ZZ A workshop I was never shown" })).rejects.toMatchObject({ code: "NOT_FOUND" });
      expect(await db.gigBooking.count({ where: { slotId } })).toBe(0);
      // A pupil of a fixture school of their own (made here, so no other test's allowance or notices move).
      const fixtureSchool = await db.school.create({ data: { name: `ZZ Session Fixture ${STAMP}`, slug: `zz-sess-f-${STAMP}`, code: `ZZSf${String(STAMP).slice(-6)}`, contactEmail: `zz-sess-f-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } });
      try {
        await db.academicYear.create({ data: { schoolId: fixtureSchool.id, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
        id.f = (await db.user.create({ data: { name: `ZZ f ${STAMP}`, email: `zz-sess-f-${STAMP}@test.invalid`, isMinor: false }, select: { id: true } })).id;
        member.f = (await db.membership.create({ data: { userId: id.f, schoolId: fixtureSchool.id, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
        const f = ctx("f", "STUDENT", fixtureSchool.id);
        expect((await mine(f, "f")).open.map((s) => s.id)).toContain(slotId);
        expect(await bookSeat(f, { slotId, purpose: "ZZ A fixture workshop for f" })).toMatchObject({ ok: true, status: "CONFIRMED" });
        await cancelSlot(expert(), slotId, "ZZ test tidy");
      } finally {
        await db.notification.deleteMany({ where: { schoolId: fixtureSchool.id } });
        await db.auditLog.deleteMany({ where: { schoolId: fixtureSchool.id } }).catch(() => {});
        await db.gigBooking.deleteMany({ where: { schoolId: fixtureSchool.id } });
        await db.school.delete({ where: { id: fixtureSchool.id } });
      }
    } finally {
      await db.user.update({ where: { id: id.expert! }, data: { isTestFixture: false } });
    }
  });

  it("a pupil's own ask waits for a guardian, holds the seat, and shows the link only once it is confirmed", async () => {
    const slotId = await offer(expert(), "ONE_TO_ONE", 400);
    expect(await bookSeat(p1(), { slotId, purpose: "short" })).toMatchObject({ ok: false, errorKey: "gigs.needPurpose" });
    const asked = await bookSeat(p1(), { slotId, purpose: "ZZ I want to know about tide pools" });
    expect(asked).toMatchObject({ ok: true, status: "PENDING_CONSENT" });
    const bookingId = asked.ok ? asked.bookingId : "";
    // Asked twice is asked once.
    expect(await bookSeat(p1(), { slotId, purpose: "ZZ I want to know about tide pools" })).toMatchObject({ ok: true, bookingId, status: "PENDING_CONSENT" });
    expect((await db.gigSlot.findUniqueOrThrow({ where: { id: slotId } })).seatsTaken).toBe(1);
    // The seat is held: the one-seat time is full for the next pupil and gone from what is open.
    expect(await bookSeat(p2(), { slotId, purpose: "ZZ I want to know about tide pools" })).toMatchObject({ ok: false, errorKey: "gigs.refuseFull" });
    expect((await mine(p2(), "p2")).open.map((s) => s.id)).not.toContain(slotId);
    // The guardian is asked; the expert and the office are told nothing yet; nobody is shown the link.
    expect(await notes("g1", `ZZ p1 ${STAMP} asks for a session`)).toBe(1);
    expect(await db.notification.count({ where: { userId: { in: [id.expert!, id.admin!] } } })).toBe(0);
    let seat = (await mine(p1(), "p1")).bookings.find((b) => b.id === bookingId)!;
    expect(seat).toMatchObject({ status: "PENDING_CONSENT", meetingUrl: null, canConsent: false, canCancel: true });
    expect((await mine(g1(), "p1")).bookings.find((b) => b.id === bookingId)).toMatchObject({ canConsent: true, meetingUrl: null });
    expect((await mySlots(expert())).slots.find((s) => s.id === slotId)!.bookings[0]).toMatchObject({ status: "PENDING_CONSENT", schoolName: `ZZ Session School A ${STAMP}` });

    // Only a guardian of this pupil answers.
    await expect(consentToBooking(p1(), bookingId, true)).rejects.toBeInstanceOf(AccessError);
    await expect(consentToBooking(g2(), bookingId, true)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(cancelBooking(g2(), bookingId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(cancelBooking(p2(), bookingId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await consentToBooking(g1(), bookingId, true)).toMatchObject({ ok: true, status: "CONFIRMED" });
    expect(await consentToBooking(g1(), bookingId, true)).toMatchObject({ ok: true, status: "CONFIRMED" });
    seat = (await mine(p1(), "p1")).bookings.find((b) => b.id === bookingId)!;
    expect(seat.status).toBe("CONFIRMED");
    expect(seat.meetingUrl).toContain("https://meet.jit.si/");
    // Now the expert is told, and the office, an outside adult being about to meet its pupil.
    expect(await db.notification.count({ where: { userId: id.expert!, title: { contains: "has a seat in" } } })).toBe(1);
    expect(await db.notification.count({ where: { userId: id.admin!, title: { contains: "is to meet" } } })).toBe(1);
    expect(await db.notification.count({ where: { userId: id.adminB! } })).toBe(0);
  });

  it("a guardian's own booking is confirmed at once; a guardian's no gives the seat back", async () => {
    const slotId = await offer(teacher(), "ONE_TO_ONE", 500);
    expect(await bookSeat(g2(), { slotId, studentMembershipId: member.p2, purpose: "ZZ Help with long division please" })).toMatchObject({ ok: true, status: "CONFIRMED" });
    // A teacher's own pupil: the office is not told, the teacher is.
    expect(await db.notification.count({ where: { userId: id.admin!, title: { contains: `ZZ p2 ${STAMP} is to meet` } } })).toBe(0);
    expect(await db.notification.count({ where: { userId: id.teacher!, title: { contains: "has a seat in" } } })).toBe(1);

    const second = await offer(expert(), "ONE_TO_ONE", 510);
    const asked = await bookSeat(p2(), { slotId: second, purpose: "ZZ I want to ask about whales" });
    const bookingId = asked.ok ? asked.bookingId : "";
    expect(await consentToBooking(g2(), bookingId, false)).toMatchObject({ ok: true, status: "CANCELLED" });
    expect((await db.gigSlot.findUniqueOrThrow({ where: { id: second } })).seatsTaken).toBe(0);
    expect(await consentToBooking(g2(), bookingId, true)).toMatchObject({ ok: false, errorKey: "gigs.refuseNotWaiting" });
    // Declined, it does not count: p2 has used one of two.
    expect((await mine(p2(), "p2")).allowance.ONE_TO_ONE).toEqual({ allowed: 2, used: 1, left: 1 });
  });

  it("a pupil has two free one-to-ones a year: a third is refused, one given up in time is given back, one given up late is not, and two asks at once for the last are one", async () => {
    // p1 holds one confirmed seat from above. A second, booked by the guardian.
    const second = await offer(expert(), "ONE_TO_ONE", 600);
    const taken = await bookSeat(g1(), { slotId: second, studentMembershipId: member.p1, purpose: "ZZ More about tide pools please" });
    expect(taken).toMatchObject({ ok: true, status: "CONFIRMED" });
    expect((await mine(p1(), "p1")).allowance.ONE_TO_ONE).toEqual({ allowed: 2, used: 2, left: 0 });
    const third = await offer(expert(), "ONE_TO_ONE", 610);
    expect(await bookSeat(p1(), { slotId: third, purpose: "ZZ And once more about tide pools" })).toMatchObject({ ok: false, errorKey: "gigs.refuseAllowanceOneToOne", vars: { count: 2 } });
    expect((await db.gigSlot.findUniqueOrThrow({ where: { id: third } })).seatsTaken).toBe(0);
    // A workshop seat is another allowance.
    const workshop = await offer(expert(), "WORKSHOP", 620, { seats: 5 });
    expect(await bookSeat(g1(), { slotId: workshop, studentMembershipId: member.p1, purpose: "ZZ A workshop about the sea shore" })).toMatchObject({ ok: true, status: "CONFIRMED" });

    // Given up weeks ahead: given back, the seat free again, the expert told.
    const gone = await cancelBooking(p1(), taken.ok ? taken.bookingId : "");
    expect(gone).toMatchObject({ ok: true, status: "CANCELLED", lateCancel: false });
    expect((await db.gigSlot.findUniqueOrThrow({ where: { id: second } })).seatsTaken).toBe(0);
    expect((await mine(p1(), "p1")).allowance.ONE_TO_ONE.left).toBe(1);
    expect(await db.notification.count({ where: { userId: id.expert!, title: { contains: "gave up the seat" } } })).toBe(1);
    // Two asks at once for the one seat left in the allowance: one is taken.
    const both = await Promise.all([bookSeat(g1(), { slotId: second, studentMembershipId: member.p1, purpose: "ZZ More about tide pools please" }), bookSeat(g1(), { slotId: third, studentMembershipId: member.p1, purpose: "ZZ And once more about tide pools" })]);
    expect(both.filter((r) => r.ok)).toHaveLength(1);
    expect(both.find((r) => !r.ok)).toMatchObject({ errorKey: "gigs.refuseAllowanceOneToOne" });
    expect((await mine(p1(), "p1")).allowance.ONE_TO_ONE.left).toBe(0);
    // Given up four hours before the start: still counted, and said so.
    const kept = both.find((r) => r.ok)!;
    const keptRow = await db.gigBooking.findUniqueOrThrow({ where: { id: kept.ok ? kept.bookingId : "" }, select: { id: true, slot: { select: { startsAt: true } } } });
    const late = await cancelBooking(g1(), keptRow.id, undefined, new Date(keptRow.slot.startsAt.getTime() - 4 * HOUR));
    expect(late).toMatchObject({ ok: true, status: "CANCELLED", lateCancel: true });
    expect((await mine(p1(), "p1")).allowance.ONE_TO_ONE).toEqual({ allowed: 2, used: 2, left: 0 });
    // Given up after it has begun: refused.
    const running = await db.gigBooking.findFirstOrThrow({ where: { studentMembershipId: member.p1, status: "CONFIRMED", kind: "ONE_TO_ONE" }, select: { id: true, slot: { select: { startsAt: true } } } });
    expect(await cancelBooking(p1(), running.id, undefined, new Date(running.slot.startsAt.getTime() + 60_000))).toMatchObject({ ok: false, errorKey: "gigs.refuseStarted" });
  });

  it("a workshop never goes past its seats: three pupils after two seats, two get them", async () => {
    const slotId = await offer(expert(), "WORKSHOP", 700, { seats: 2 });
    const results = await Promise.all([
      bookSeat(g1(), { slotId, studentMembershipId: member.p1, purpose: "ZZ The second workshop for p1" }),
      bookSeat(g2(), { slotId, studentMembershipId: member.p2, purpose: "ZZ A workshop for p2 please" }),
      bookSeat(gq(), { slotId, studentMembershipId: member.q, purpose: "ZZ A workshop for q please" }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(2);
    expect(results.find((r) => !r.ok)).toMatchObject({ errorKey: "gigs.refuseFull" });
    const row = await db.gigSlot.findUniqueOrThrow({ where: { id: slotId }, select: { seatsTaken: true, _count: { select: { bookings: { where: { status: "CONFIRMED" } } } } } });
    expect(row.seatsTaken).toBe(2);
    expect(row._count.bookings).toBe(2);
  });

  it("the provider says how it went, only their own and only once it has begun; the family rates it once; one not held is the family's to say and is not counted", async () => {
    const slotId = await offer(teacher(), "ONE_TO_ONE", 800);
    const taken = await bookSeat(gq(), { slotId, studentMembershipId: member.q, purpose: "ZZ never reaches here" }).catch((e) => e);
    expect(taken).toBeInstanceOf(AccessError);
    const booked = await bookSeat(g2(), { slotId, studentMembershipId: member.p2, purpose: "ZZ Fractions before the unit test" });
    const bookingId = booked.ok ? booked.bookingId : "";
    expect(booked).toMatchObject({ ok: true, status: "CONFIRMED" });
    const starts = (await db.gigSlot.findUniqueOrThrow({ where: { id: slotId } })).startsAt;
    const during = new Date(starts.getTime() + 10 * 60_000);
    const after = new Date(starts.getTime() + 2 * HOUR);
    expect(await closeBooking(teacher(), bookingId, "DELIVERED")).toMatchObject({ ok: false, errorKey: "gigs.refuseNotYet" });
    await expect(closeBooking(expert(), bookingId, "DELIVERED", during)).rejects.toMatchObject({ code: "NOT_FOUND" });
    for (const who of [admin(), p2(), g2()]) await expect(closeBooking(who, bookingId, "DELIVERED", during)).rejects.toBeInstanceOf(AccessError);
    expect(await rateBooking(g2(), bookingId, { rating: 5 })).toMatchObject({ ok: false, errorKey: "gigs.refuseNotDelivered" });
    expect(await closeBooking(teacher(), bookingId, "DELIVERED", during)).toEqual({ ok: true });
    expect(await closeBooking(teacher(), bookingId, "DELIVERED", during)).toEqual({ ok: true });
    expect(await closeBooking(teacher(), bookingId, "MISSED", during)).toMatchObject({ ok: false, errorKey: "gigs.refuseNotConfirmed" });
    expect(await notes("g2", "How was")).toBe(1);
    // Rated by the family, once, and the rating reaches the provider.
    await expect(rateBooking(g1(), bookingId, { rating: 5 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await rateBooking(g2(), bookingId, { rating: 9 })).toMatchObject({ ok: false, errorKey: "gigs.refuseRating" });
    expect(await rateBooking(g2(), bookingId, { rating: 4, feedback: "ZZ Clear and patient." })).toEqual({ ok: true });
    expect(await rateBooking(p2(), bookingId, { rating: 1 })).toMatchObject({ ok: false, errorKey: "gigs.refuseRated" });
    const mineNow = await mySlots(teacher(), after);
    expect(mineNow.slots.find((s) => s.id === slotId)!.bookings[0]).toMatchObject({ status: "DELIVERED", rating: 4, feedback: "ZZ Clear and patient." });
    expect(mineNow.duty).toMatchObject({ deliveredOneToOnes: 1, monthlyOneToOnes: 2, startOneToOnes: 0 });
    // Held, it counts: p2 has used both (this one and the teacher's earlier one).
    expect((await mine(p2(), "p2")).allowance.ONE_TO_ONE).toEqual({ allowed: 2, used: 2, left: 0 });

    // The earlier one: the family says it was not held, only after it should have ended, and it stops counting.
    const earlier = await db.gigBooking.findFirstOrThrow({ where: { studentMembershipId: member.p2, status: "CONFIRMED", kind: "ONE_TO_ONE" }, select: { id: true, slot: { select: { endsAt: true } } } });
    expect(await reportUnheld(g2(), earlier.id)).toMatchObject({ ok: false, errorKey: "gigs.refuseNotYet" });
    await expect(reportUnheld(g1(), earlier.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await reportUnheld(p2(), earlier.id, new Date(earlier.slot.endsAt.getTime() + 60_000))).toMatchObject({ ok: true, status: "UNHELD" });
    expect((await mine(p2(), "p2")).allowance.ONE_TO_ONE).toEqual({ allowed: 2, used: 1, left: 1 });
    expect(await db.notification.count({ where: { userId: id.teacher!, title: { contains: "was not held" } } })).toBe(1);
  });

  it("a provider who cancels a time cancels every seat in it, costs no pupil anything, and tells each family", async () => {
    const slotId = await offer(expert(), "WORKSHOP", 900, { seats: 5 });
    await bookSeat(g2(), { slotId, studentMembershipId: member.p2, purpose: "ZZ A workshop for p2 again" });
    await bookSeat(q(), { slotId, purpose: "ZZ A workshop for q, asked by q" });
    const before = (await mine(p2(), "p2")).allowance.WORKSHOP.used;
    await expect(cancelSlot(teacher(), slotId, "ZZ not mine to cancel")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await cancelSlot(expert(), slotId, "no")).toMatchObject({ ok: false, errorKey: "gigs.needReason" });
    expect(await cancelSlot(expert(), slotId, "ZZ I am unwell that day")).toEqual({ ok: true });
    expect(await cancelSlot(expert(), slotId, "ZZ I am unwell that day")).toEqual({ ok: true });
    const rows = await db.gigBooking.findMany({ where: { slotId }, select: { status: true, lateCancel: true, cancelReason: true } });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.status === "CANCELLED" && !r.lateCancel && r.cancelReason === "ZZ I am unwell that day")).toBe(true);
    expect((await db.gigSlot.findUniqueOrThrow({ where: { id: slotId } })).seatsTaken).toBe(0);
    expect((await mine(p2(), "p2")).allowance.WORKSHOP.used).toBe(before - 1);
    expect(await notes("g2", "was cancelled by the provider")).toBe(1);
    expect(await notes("q", "was cancelled by the provider")).toBe(1);
    expect(await notes("gq", "was cancelled by the provider")).toBe(1);
    expect(await bookSeat(g2(), { slotId, studentMembershipId: member.p2, purpose: "ZZ A workshop for p2 again" }).catch((e) => e)).toBeInstanceOf(AccessError);
  });

  it("the office reads every session of its own pupils, without the link, and may cancel one with a reason; another school's office cannot", async () => {
    for (const who of [teacher(), p1(), g1(), expert()]) await expect(schoolSessions(who)).rejects.toBeInstanceOf(AccessError);
    const view = await schoolSessions(admin());
    expect(view.guidanceOn).toBe(true);
    expect(view.bookings.length).toBeGreaterThan(3);
    expect(view.bookings.every((b) => b.pupilName.startsWith("ZZ p1") || b.pupilName.startsWith("ZZ p2"))).toBe(true);
    expect(JSON.stringify(view)).not.toContain("meet.jit.si");
    const slotId = await offer(expert(), "WORKSHOP", 1000, { seats: 3 });
    const booked = await bookSeat(q(), { slotId, purpose: "ZZ A workshop q's office will cancel" });
    const bookingId = booked.ok ? booked.bookingId : "";
    await expect(cancelBooking(admin(), bookingId, "ZZ not our pupil")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await cancelBooking(adminB(), bookingId)).toMatchObject({ ok: false, errorKey: "gigs.needReason" });
    expect(await cancelBooking(adminB(), bookingId, "ZZ The school trip is that day")).toMatchObject({ ok: true, status: "CANCELLED", lateCancel: false });
    expect(await notes("gq", "the seat was cancelled")).toBe(1);
    // The expert cancels a seat of their own, with a reason, and no other provider's.
    const again = await bookSeat(gq(), { slotId, studentMembershipId: member.q, purpose: "ZZ Booked again by the guardian" });
    await expect(cancelBooking(teacher(), again.ok ? again.bookingId : "", "ZZ not my seat")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await cancelBooking(expert(), again.ok ? again.bookingId : "", "ZZ Too young for this one")).toMatchObject({ ok: true, status: "CANCELLED" });
    // Guidance switched off: nothing booked is cancelled, the teacher offers no more, and still marks what was booked.
    expect(await setTeacherGuidance(admin(), false)).toMatchObject({ ok: true, guidanceOn: false });
    await expect(offerSlot(teacher(), slot("ONE_TO_ONE"))).rejects.toMatchObject({ key: "gigs.refuseGuidanceOff" });
    expect(await db.gigBooking.count({ where: { providerUserId: id.teacher!, status: "DELIVERED" } })).toBe(1);
  });

  it("a confirmed seat in a session that starts within a day is reminded once: the pupil, their guardian, and the provider once for the slot", async () => {
    const slotId = await offer(expert(), "WORKSHOP", 1100, { seats: 3 });
    await bookSeat(gq(), { slotId, studentMembershipId: member.q, purpose: "ZZ A workshop to be reminded of" });
    const waiting = await bookSeat(p2(), { slotId, purpose: "ZZ p2 asks and nobody has agreed yet" });
    expect(waiting).toMatchObject({ ok: true, status: "PENDING_CONSENT" });
    const starts = (await db.gigSlot.findUniqueOrThrow({ where: { id: slotId } })).startsAt;
    // Two days before: nobody is reminded of this one.
    await remindSessions(new Date(starts.getTime() - 48 * HOUR));
    expect(await notes("gq", "starts within a day")).toBe(0);
    // Six hours before: the family and the expert, once; the seat no guardian agreed to is not reminded.
    const eve = new Date(starts.getTime() - 6 * HOUR);
    const run = await remindSessions(eve);
    expect(run.perSchool[school.b]).toEqual({ reminded: 1 });
    expect(await notes("q", "starts within a day")).toBe(1);
    expect(await notes("gq", "starts within a day")).toBe(1);
    expect(await notes("expert", "starts within a day")).toBe(1);
    expect(await notes("g2", "starts within a day")).toBe(0);
    // Agreed to after the first run: the family is reminded at the next, the expert not again.
    await consentToBooking(g2(), waiting.ok ? waiting.bookingId : "", true, eve);
    const again = await remindSessions(new Date(eve.getTime() + HOUR));
    expect(again.perSchool[school.a]).toEqual({ reminded: 1 });
    expect(again.perSchool[school.b]).toBeUndefined();
    expect(await notes("g2", "starts within a day")).toBe(1);
    expect(await notes("expert", "starts within a day")).toBe(1);
    expect((await remindSessions(new Date(eve.getTime() + 2 * HOUR))).reminded).toBe(0);
  });

  it("the operator counts what is on offer and nobody else does", async () => {
    for (const who of [admin(), teacher(), expert(), p1()]) await expect(sessionCounts(who)).rejects.toBeInstanceOf(AccessError);
    const counts = await sessionCounts(ctx("operator", null, null, { isSuperuser: true }));
    expect(counts.upcomingSlots).toBeGreaterThan(0);
    expect(counts.seatsTaken).toBeLessThanOrEqual(counts.upcomingSeats);
    // The stored count of every slot this suite made is the number of its seats not cancelled: a seat that was held, missed or not held stays taken.
    const slots = await db.gigSlot.findMany({ where: { providerUserId: { in: [id.expert!, id.teacher!] } }, select: { seatsTaken: true, _count: { select: { bookings: { where: { status: { not: "CANCELLED" } } } } } } });
    expect(slots.filter((s) => s.seatsTaken !== s._count.bookings)).toEqual([]);
  });
});
