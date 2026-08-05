import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { bookSlot, getBooking, postMessage, listBookings, cancelBooking } from "@/lib/experts";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";
import type { Role } from "@/lib/constants";

/**
 * ⚠ WHO MAY READ A SCHOOL'S CONVERSATION WITH AN OUTSIDE EXPERT.
 *
 * `assertBookingAccess` used to match on `schoolId` alone, so "may read this
 * booking" meant "belongs to this school" — and a PUPIL belongs to their
 * school. A child could open `/experts/bookings/<id>`, read the whole
 * staff↔expert conversation, and post into it, because `postMessage` shares
 * that gate. `postMessage`'s own comment said "both sides are adults, so there
 * is no gate": true of the expert, false of the school.
 *
 * It was never reachable by browsing — `/experts` turns away everyone but
 * staff, nothing lists booking ids to a child, and an id is a cuid. A wrong
 * boundary rather than an open door. But an unsupervised channel between a
 * child and an adult from outside the school is precisely what `mentoring.ts`
 * spends consent, guardian visibility and staff-only pairing to prevent.
 *
 * BOOKING HAD NO TEST FILE AT ALL. `bookSlot` appeared twice inside the
 * curation tests as a fixture step and `cancelBooking` was tested nowhere,
 * which is the other half of how this stood.
 */

const db = new PrismaClient();

const SUFFIX = "@zzbooking.test";
const made: string[] = [];

let schoolAId: string;
let schoolBId: string;
let expertUserId: string;
let profileId: string;

let admin: ActiveContext;
let teacher: ActiveContext;
let principal: ActiveContext;
let pupil: ActiveContext;
let guardian: ActiveContext;
let expert: ActiveContext;
let otherExpert: ActiveContext;
let otherAdmin: ActiveContext;

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

async function mkUser(email: string): Promise<string> {
  const user = await db.user.create({ data: { email, name: "Booking Test", prefs: "{}" } });
  made.push(user.id);
  return user.id;
}

async function mkMember(schoolId: string, role: Role, label: string): Promise<ActiveContext> {
  const userId = await mkUser(`${label}${SUFFIX}`);
  const membership = await db.membership.create({
    data: { userId, schoolId, role, status: "ACTIVE" },
  });
  return ctx({ userId, membershipId: membership.id, schoolId, role });
}

/** A fresh, bookable slot each time, so no test depends on another's leftovers. */
async function freshSlot(): Promise<string> {
  const startsAt = new Date(Date.now() + 30 * 86_400_000);
  const slot = await db.expertSlot.create({
    data: { expertProfileId: profileId, startsAt, endsAt: new Date(startsAt.getTime() + 3_600_000) },
  });
  return slot.id;
}

async function aBooking(): Promise<string> {
  const { bookingId } = await bookSlot(admin, await freshSlot(), "A talk about bridges");
  return bookingId;
}

beforeAll(async () => {
  const a = await db.school.create({
    data: { name: "ZZ Booking A", slug: `zz-booking-a-${Date.now()}`, code: `ZZBKA${Date.now() % 1000}`, contactEmail: `a${SUFFIX}` },
  });
  const b = await db.school.create({
    data: { name: "ZZ Booking B", slug: `zz-booking-b-${Date.now()}`, code: `ZZBKB${Date.now() % 1000}`, contactEmail: `b${SUFFIX}` },
  });
  schoolAId = a.id;
  schoolBId = b.id;

  admin = await mkMember(schoolAId, "ADMIN", "admin");
  teacher = await mkMember(schoolAId, "TEACHER", "teacher");
  principal = await mkMember(schoolAId, "PRINCIPAL", "principal");
  pupil = await mkMember(schoolAId, "STUDENT", "pupil");
  otherAdmin = await mkMember(schoolBId, "ADMIN", "other-admin");

  // A guardian is a Guardianship rather than a Membership, but their session
  // still carries the school — which is exactly what the old predicate matched.
  const guardianUserId = await mkUser(`guardian${SUFFIX}`);
  guardian = ctx({ userId: guardianUserId, schoolId: schoolAId, role: "PARENT" });

  expertUserId = await mkUser(`expert${SUFFIX}`);
  const profile = await db.expertProfile.create({
    data: { userId: expertUserId, headline: "Bridges", offering: "SESSIONS", publishedAt: new Date() },
  });
  profileId = profile.id;
  expert = ctx({ userId: expertUserId, role: "EXPERT" });

  const otherExpertUserId = await mkUser(`other-expert${SUFFIX}`);
  await db.expertProfile.create({
    data: { userId: otherExpertUserId, headline: "Something else", offering: "SESSIONS", publishedAt: new Date() },
  });
  otherExpert = ctx({ userId: otherExpertUserId, role: "EXPERT" });
});

beforeEach(async () => {
  await db.expertMessage.deleteMany({ where: { booking: { expertUserId } } });
  await db.expertBooking.deleteMany({ where: { expertUserId } });
  await db.expertSlot.deleteMany({ where: { expertProfileId: profileId } });
});

afterAll(async () => {
  await db.expertMessage.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
  await db.expertBooking.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
  await db.expertSlot.deleteMany({ where: { expert: { userId: { in: made } } } });
  await db.expertProfile.deleteMany({ where: { userId: { in: made } } });
  await db.notification.deleteMany({ where: { userId: { in: made } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: made } } });
  await db.membership.deleteMany({ where: { schoolId: { in: [schoolAId, schoolBId] } } });
  await db.user.deleteMany({ where: { id: { in: made } } });
  await db.school.deleteMany({ where: { id: { in: [schoolAId, schoolBId] } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("who may read a booking", () => {
  it("the staff who could have made it", async () => {
    // The happy path FIRST — otherwise every refusal below could be a fixture
    // that never worked, and a test that refuses for the wrong reason proves
    // nothing.
    const id = await aBooking();
    expect((await getBooking(admin, id)).topic).toBe("A talk about bridges");
    expect((await getBooking(teacher, id)).topic).toBe("A talk about bridges");
  });

  it("and the expert it is with", async () => {
    const id = await aBooking();
    expect((await getBooking(expert, id)).topic).toBe("A talk about bridges");
  });

  it("⚠ NOT a pupil at that school", async () => {
    /**
     * THE BUG. A child could read their school's whole conversation with an
     * adult from outside it.
     */
    const id = await aBooking();
    await expect(getBooking(pupil, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ NOT a guardian at that school", async () => {
    const id = await aBooking();
    await expect(getBooking(guardian, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ …and it is refused as NOT_FOUND, not as 'not yours'", async () => {
    // The route turns AccessError into notFound(), so a pupil must not be able
    // to tell a booking that exists from an id that never did.
    const id = await aBooking();
    const refusal = await getBooking(pupil, id).catch((error) => error);
    expect(refusal).toBeInstanceOf(AccessError);
    expect((refusal as AccessError).code).toBe("NOT_FOUND");

    const nonsense = await getBooking(admin, "no-such-booking-id").catch((error) => error);
    expect((nonsense as AccessError).code).toBe("NOT_FOUND");
  });

  it("not a principal either — deliberately, and recorded as a decision", async () => {
    // A principal cannot book and cannot cancel, and /experts is not in their
    // navigation. Including them here would be widening access under cover of a
    // security fix. If they should see these, that is its own change.
    const id = await aBooking();
    await expect(getBooking(principal, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("not another school's admin", async () => {
    const id = await aBooking();
    await expect(getBooking(otherAdmin, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ not a different expert", async () => {
    const id = await aBooking();
    await expect(getBooking(otherExpert, id)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("who may write in one", () => {
  /**
   * `postMessage` shares `assertBookingAccess`, so these fail for the same
   * reason the reads do. Asserted separately anyway: the two are one gate today
   * and a future change that splits them must not quietly let a child write.
   */
  it("staff and the expert can", async () => {
    const id = await aBooking();
    await expect(postMessage(admin, id, "Thirty children, Year 6")).resolves.toBeUndefined();
    await expect(postMessage(expert, id, "Looking forward to it")).resolves.toBeUndefined();
    expect((await getBooking(admin, id)).messages).toHaveLength(2);
  });

  it("⚠ a pupil cannot — and nothing is written when it refuses", async () => {
    // The throw is not the only guarantee worth having: a gate that threw AFTER
    // writing the row would pass a rejects assertion and still have put a
    // child's message in front of an outside adult.
    const id = await aBooking();
    await expect(postMessage(pupil, id, "hello")).rejects.toBeInstanceOf(AccessError);
    await expect(postMessage(guardian, id, "hello")).rejects.toBeInstanceOf(AccessError);
    expect(await db.expertMessage.count({ where: { bookingId: id } })).toBe(0);
  });
});

describe("the list of a school's bookings", () => {
  it("shows staff their school's, and the expert their own", async () => {
    const id = await aBooking();
    expect((await listBookings(admin)).map((b) => b.id)).toContain(id);
    expect((await listBookings(teacher)).map((b) => b.id)).toContain(id);
    expect((await listBookings(expert)).map((b) => b.id)).toContain(id);
  });

  it("⚠ shows a pupil or a guardian nothing at all", async () => {
    // Both callers are role-gated pages today. The check is in the library
    // because a gate that lives somewhere else is not a gate this function has.
    await aBooking();
    expect(await listBookings(pupil)).toEqual([]);
    expect(await listBookings(guardian)).toEqual([]);
    expect(await listBookings(principal)).toEqual([]);
  });

  it("does not show one school another's", async () => {
    await aBooking();
    expect(await listBookings(otherAdmin)).toEqual([]);
  });
});

describe("cancelling, which had no test at all", () => {
  it("either side may, and the slot goes back", async () => {
    const slotId = await freshSlot();
    const { bookingId } = await bookSlot(admin, slotId, "A talk about bridges");
    expect((await db.expertSlot.findUniqueOrThrow({ where: { id: slotId } })).bookedAt).not.toBeNull();

    await cancelBooking(expert, bookingId);

    expect((await db.expertBooking.findUniqueOrThrow({ where: { id: bookingId } })).status).toBe("CANCELLED");
    // ⚠ THE SLOT IS FREED, which is what makes cancelling worth anything: a
    // cancellation that consumed the hour forever would be a deletion.
    expect((await db.expertSlot.findUniqueOrThrow({ where: { id: slotId } })).bookedAt).toBeNull();
  });

  it("⚠ a pupil cannot cancel their school's booking", async () => {
    const id = await aBooking();
    await expect(cancelBooking(pupil, id)).rejects.toBeInstanceOf(AccessError);
    expect((await db.expertBooking.findUniqueOrThrow({ where: { id } })).status).toBe("CONFIRMED");
  });

  it("nor another school, nor another expert", async () => {
    const id = await aBooking();
    await expect(cancelBooking(otherAdmin, id)).rejects.toBeInstanceOf(AccessError);
    await expect(cancelBooking(otherExpert, id)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ and the freed hour can actually be booked again", async () => {
    /**
     * THE POINT OF FREEING IT. Cancelling clears `ExpertSlot.bookedAt`, so the
     * marketplace offers the hour again — verified by eye. That is worth
     * nothing if the next school to press Book meets an error, and
     * `ExpertBooking.slotId` is UNIQUE, so the cancelled booking still holds
     * the row for that slot.
     *
     * Asserted end to end rather than by reading the schema: book, cancel, book
     * again as the same school.
     */
    const slotId = await freshSlot();
    const original = await db.expertSlot.findUniqueOrThrow({ where: { id: slotId } });
    const first = await bookSlot(admin, slotId, "The first school");
    await cancelBooking(admin, first.bookingId);

    /**
     * Found the way the MARKETPLACE finds it — an unbooked, uncancelled slot at
     * that time — rather than by reusing the old id. The hour is what is being
     * offered again; which row carries it is an implementation detail, and a
     * test that asserted the id would have been asserting the bug.
     */
    const offered = await db.expertSlot.findFirstOrThrow({
      where: {
        expertProfileId: original.expertProfileId,
        startsAt: original.startsAt,
        bookedAt: null,
        cancelledAt: null,
      },
    });
    expect(offered.id).not.toBe(slotId);

    const second = await bookSlot(teacher, offered.id, "The second school");
    expect(second.bookingId).not.toBe(first.bookingId);

    // The consumed row is retired, not left looking bookable.
    expect((await db.expertSlot.findUniqueOrThrow({ where: { id: slotId } })).cancelledAt)
      .not.toBeNull();

    // And the older one is still on record as cancelled — re-booking must not
    // resurrect or overwrite it.
    expect((await db.expertBooking.findUniqueOrThrow({ where: { id: first.bookingId } })).status)
      .toBe("CANCELLED");
  });

  it("⚠ cancelling twice does not mint two replacement hours", async () => {
    // Two people pressing the button, or one pressing it twice on a slow
    // connection, is the ordinary case rather than an attack — and it would
    // otherwise duplicate the expert's availability every time.
    const slotId = await freshSlot();
    const original = await db.expertSlot.findUniqueOrThrow({ where: { id: slotId } });
    const { bookingId } = await bookSlot(admin, slotId, "Cancelled twice");

    await cancelBooking(admin, bookingId);
    await cancelBooking(expert, bookingId);

    const offered = await db.expertSlot.findMany({
      where: {
        expertProfileId: original.expertProfileId,
        startsAt: original.startsAt,
        bookedAt: null,
        cancelledAt: null,
      },
    });
    expect(offered).toHaveLength(1);
  });

  it("⚠ a cancelled booking cannot be written in", async () => {
    const id = await aBooking();
    await cancelBooking(admin, id);
    await expect(postMessage(admin, id, "still here?")).rejects.toBeInstanceOf(AccessError);
  });
});
