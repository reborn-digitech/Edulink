import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { notify } from "./notify";
import { readJsonArray } from "./json";
import type { ActiveContext } from "./session";

/**
 * The expert marketplace, and the bookings that come out of it.
 *
 * THE ACCESS RULE, ONCE, HERE. An expert has no Membership and no school. What
 * they can see is decided in `tenant-request.ts`, which turns their CONFIRMED
 * bookings into `app.school_ids` — so every ordinary policy already protects
 * every school from every expert who has not been booked, and no table needed a
 * bespoke rule. Cancel the booking and the access is gone on the next query,
 * because the set is recomputed per request rather than granted.
 *
 * WHAT IS SHARED AND WHAT IS NOT. Profiles and slots are a global catalogue, so
 * every school sees the same marketplace — the same argument as the practice
 * bank and for the same reason: scoped per school, the first school to look
 * would be the only one able to book. Bookings and their messages carry a
 * schoolId and are scoped normally, so a school cannot see who else booked whom.
 *
 * A SLOT SAYS THAT IT IS TAKEN AND NEVER BY WHOM. `bookedAt` lives on the slot,
 * which everyone can read; the booking, which names the school, does not. That
 * split is deliberate — availability is public, custom is not.
 */

const INVITE_TTL_DAYS = 14;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* -------------------------------------------------------------------------- */
/* Invitations                                                                 */
/* -------------------------------------------------------------------------- */

export type ExpertInviteResult = { token: string; expiresAt: Date };

/**
 * Creates an expert invitation and returns the ONE copy of its token.
 *
 * Only the hash is stored, exactly like `Invite`. `schoolId` may be null, and
 * that is the app owner's route: `npm run expert:invite` writes a row naming no
 * school. There is no super-admin web role for it to live in, and running a
 * script needs the database, which is the authorisation.
 */
export async function createExpertInvite(input: {
  schoolId: string | null;
  invitedByMembershipId: string | null;
  actorUserId: string | null;
  email?: string | null;
  name?: string | null;
}): Promise<ExpertInviteResult> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

  await db.expertInvite.create({
    data: {
      schoolId: input.schoolId,
      tokenHash: hashToken(token),
      email: input.email?.trim() || null,
      name: input.name?.trim() || null,
      invitedByMembershipId: input.invitedByMembershipId,
      expiresAt,
    },
  });

  await audit({
    schoolId: input.schoolId,
    actorUserId: input.actorUserId,
    action: "expert.invite",
    targetType: "ExpertInvite",
    meta: { email: input.email ?? null, byOwner: input.schoolId === null },
  });

  return { token, expiresAt };
}

/** From a school. Admin or teacher, because either may need an expert. */
export async function inviteExpert(
  session: ActiveContext,
  input: { email?: string; name?: string },
): Promise<ExpertInviteResult> {
  if ((session.role !== "ADMIN" && session.role !== "TEACHER") || !session.schoolId) {
    throw new AccessError("Only a teacher or an admin can invite an expert");
  }
  return createExpertInvite({
    schoolId: session.schoolId,
    invitedByMembershipId: session.membershipId,
    actorUserId: session.user.id,
    email: input.email,
    name: input.name,
  });
}

export type InviteState =
  | { ok: true; inviteId: string; name: string | null; email: string | null }
  | { ok: false; reason: "unknown" | "expired" | "used" | "revoked" };

/**
 * Looks up an invitation by its token.
 *
 * The refusals are deliberately DISTINGUISHED here and deliberately NOT at the
 * page — an expired link and a forged one must read identically to whoever is
 * holding it, the same rule the pupil invite flow follows, but the caller still
 * needs to know which happened in order to audit it.
 */
export async function readExpertInvite(token: string): Promise<InviteState> {
  const invite = await db.expertInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      name: true,
      email: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
    },
  });
  if (!invite) return { ok: false, reason: "unknown" };
  if (invite.revokedAt) return { ok: false, reason: "revoked" };
  if (invite.acceptedAt) return { ok: false, reason: "used" };
  if (invite.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, inviteId: invite.id, name: invite.name, email: invite.email };
}

/**
 * Turns an accepted invitation into an expert profile.
 *
 * UNPUBLISHED ON PURPOSE. Accepting a link makes somebody an expert account, not
 * a listed expert: `publishedAt` stays null until a person curates them, and
 * `requireExpert` sends an unpublished profile to a holding page. An invite link
 * that leaked therefore buys nothing more than an account nobody can book.
 *
 * Single-use, by the same token: the invite is marked accepted in the SAME
 * transaction that creates the profile, so a link raced twice creates one
 * profile.
 */
export async function acceptExpertInvite(
  token: string,
  userId: string,
  profile: { headline: string; bio?: string; organisation?: string },
): Promise<{ expertProfileId: string }> {
  const headline = profile.headline.trim();
  if (headline.length < 3) throw new AccessError("Say what you do, in a few words");

  return db.$transaction(async (tx) => {
    const invite = await tx.expertInvite.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, acceptedAt: true, revokedAt: true, expiresAt: true, schoolId: true },
    });
    if (!invite || invite.revokedAt || invite.acceptedAt) {
      throw new AccessError("That invitation cannot be used", "NOT_FOUND");
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      throw new AccessError("That invitation has expired", "NOT_FOUND");
    }

    const existing = await tx.expertProfile.findUnique({ where: { userId }, select: { id: true } });
    const created =
      existing ??
      (await tx.expertProfile.create({
        data: {
          userId,
          headline,
          bio: profile.bio?.trim() ?? "",
          organisation: profile.organisation?.trim() || null,
        },
        select: { id: true },
      }));

    await tx.expertInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date(), acceptedUserId: userId },
    });

    return { expertProfileId: created.id };
  });
}

/* -------------------------------------------------------------------------- */
/* The marketplace                                                             */
/* -------------------------------------------------------------------------- */

export type MarketplaceExpert = {
  id: string;
  name: string;
  headline: string;
  bio: string;
  organisation: string | null;
  specialisms: string[];
  verified: boolean;
  openSlots: { id: string; startsAt: Date; endsAt: Date; note: string | null }[];
};

/**
 * Published experts and their free slots.
 *
 * PAST SLOTS ARE DROPPED, not shown greyed out. A marketplace whose first screen
 * is full of last month's availability reads as abandoned, and the school cannot
 * act on any of it.
 */
export async function listMarketplace(
  session: ActiveContext,
  opts: { specialism?: string } = {},
): Promise<MarketplaceExpert[]> {
  if (!session.schoolId) return [];

  const experts = await db.expertProfile.findMany({
    where: { publishedAt: { not: null } },
    include: {
      user: { select: { name: true, preferredName: true } },
      slots: {
        where: { bookedAt: null, cancelledAt: null, startsAt: { gt: new Date() } },
        orderBy: { startsAt: "asc" },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  return experts
    .map((expert) => ({
      id: expert.id,
      name: expert.user.preferredName ?? expert.user.name,
      headline: expert.headline,
      bio: expert.bio,
      organisation: expert.organisation,
      specialisms: readJsonArray<string>(expert.specialisms),
      verified: expert.verifiedAt !== null,
      openSlots: expert.slots.map((slot) => ({
        id: slot.id,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        note: slot.note,
      })),
    }))
    .filter((expert) =>
      opts.specialism ? expert.specialisms.includes(opts.specialism) : true,
    );
}

/* -------------------------------------------------------------------------- */
/* Booking                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Books a slot for this school.
 *
 * THE RACE IS THE WHOLE FUNCTION. Two schools looking at the same free slot is
 * the ordinary case in a shared marketplace, and "check then write" would let
 * both through. So the claim is a CONDITIONAL UPDATE — `updateMany` with
 * `bookedAt: null` in the WHERE — and the loser sees zero rows affected and is
 * told the slot went. The unique constraint on `ExpertBooking.slotId` is the
 * second line of defence, in the database, where it cannot be forgotten.
 */
export async function bookSlot(
  session: ActiveContext,
  slotId: string,
  topic: string,
): Promise<{ bookingId: string }> {
  if ((session.role !== "ADMIN" && session.role !== "TEACHER") || !session.schoolId) {
    throw new AccessError("Only a teacher or an admin can book an expert");
  }
  const cleanTopic = topic.trim();
  if (cleanTopic.length < 3) throw new AccessError("Say what you would like to discuss");

  const slot = await db.expertSlot.findUnique({
    where: { id: slotId },
    select: {
      id: true,
      startsAt: true,
      cancelledAt: true,
      bookedAt: true,
      expertProfileId: true,
      expert: { select: { publishedAt: true, userId: true, user: { select: { name: true } } } },
    },
  });
  if (!slot || !slot.expert.publishedAt) throw new AccessError("No such slot", "NOT_FOUND");
  if (slot.cancelledAt) throw new AccessError("That time is no longer offered");
  if (slot.startsAt.getTime() < Date.now()) throw new AccessError("That time has already passed");

  // Claim it. Zero rows means somebody else got there first.
  const claimed = await db.expertSlot.updateMany({
    where: { id: slotId, bookedAt: null, cancelledAt: null },
    data: { bookedAt: new Date() },
  });
  if (claimed.count === 0) throw new AccessError("Somebody booked that time just now");

  try {
    const booking = await db.expertBooking.create({
      data: {
        schoolId: session.schoolId,
        expertProfileId: slot.expertProfileId,
        expertUserId: slot.expert.userId,
        slotId,
        bookedByMembershipId: session.membershipId,
        topic: cleanTopic,
        status: "CONFIRMED",
      },
      select: { id: true },
    });

    // The link that proves it moved: without this the expert is booked and has
    // no way of knowing.
    await notify({
      userId: slot.expert.userId,
      schoolId: session.schoolId,
      kind: "EXPERT",
      title: "A school has booked you",
      body: cleanTopic,
      url: `/expert/bookings/${booking.id}`,
    });

    await audit({
      schoolId: session.schoolId,
      actorUserId: session.user.id,
      action: "expert.book",
      targetType: "ExpertBooking",
      targetId: booking.id,
      meta: { slotId, expert: slot.expert.user.name },
    });

    return { bookingId: booking.id };
  } catch (error) {
    // Put the slot back rather than leaving it claimed by a booking that does
    // not exist — otherwise a failed write silently removes a slot for everyone.
    await db.expertSlot.updateMany({ where: { id: slotId }, data: { bookedAt: null } });
    throw error;
  }
}

/** Cancels a booking and frees the slot. Either side may do it. */
export async function cancelBooking(session: ActiveContext, bookingId: string): Promise<void> {
  const booking = await db.expertBooking.findFirst({
    where: { id: bookingId },
    select: { id: true, slotId: true, schoolId: true, expert: { select: { userId: true } } },
  });
  if (!booking) throw new AccessError("Booking not found", "NOT_FOUND");

  const isSchoolStaff =
    (session.role === "ADMIN" || session.role === "TEACHER") &&
    session.schoolId === booking.schoolId;
  const isTheExpert = session.role === "EXPERT" && session.user.id === booking.expert.userId;
  if (!isSchoolStaff && !isTheExpert) throw new AccessError("Not your booking to cancel");

  await db.expertBooking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  await db.expertSlot.updateMany({ where: { id: booking.slotId }, data: { bookedAt: null } });

  await audit({
    schoolId: booking.schoolId,
    actorUserId: session.user.id,
    action: "expert.cancel",
    targetType: "ExpertBooking",
    targetId: bookingId,
    meta: { by: isTheExpert ? "expert" : "school" },
  });
}

/* -------------------------------------------------------------------------- */
/* Bookings and their chat                                                     */
/* -------------------------------------------------------------------------- */

export type BookingSummary = {
  id: string;
  topic: string;
  status: string;
  startsAt: Date;
  endsAt: Date;
  expertName: string;
  schoolName: string;
  unread: number;
};

/**
 * The bookings on one side of the relationship.
 *
 * ONE FUNCTION FOR BOTH SIDES, because the tenant does the work: a school's
 * session is scoped to that school, and an expert's is scoped to exactly the
 * schools that booked them. The WHERE clause below therefore does not need a
 * branch on role for SECURITY — only for which relationship to name.
 */
export async function listBookings(session: ActiveContext): Promise<BookingSummary[]> {
  const isExpert = session.role === "EXPERT";
  if (!isExpert && !session.schoolId) return [];

  const bookings = await db.expertBooking.findMany({
    where: isExpert
      ? { expert: { userId: session.user.id } }
      : { schoolId: session.schoolId! },
    include: {
      slot: { select: { startsAt: true, endsAt: true } },
      school: { select: { name: true } },
      expert: { include: { user: { select: { name: true, preferredName: true } } } },
      messages: { select: { authorUserId: true, readBy: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return bookings.map((booking) => ({
    id: booking.id,
    topic: booking.topic,
    status: booking.status,
    startsAt: booking.slot.startsAt,
    endsAt: booking.slot.endsAt,
    expertName: booking.expert.user.preferredName ?? booking.expert.user.name,
    schoolName: booking.school.name,
    unread: booking.messages.filter(
      (m) =>
        m.authorUserId !== session.user.id &&
        !readJsonArray<string>(m.readBy).includes(session.user.id),
    ).length,
  }));
}

/**
 * One booking, with its messages, for whoever is entitled to it.
 *
 * `assertBookingAccess` is the security of this function and of `postMessage`
 * below: it re-resolves the booking against the SESSION rather than trusting the
 * id in the URL. For a school that is the tenant predicate; for an expert it is
 * an equality on their own user id, so one expert cannot read another expert's
 * booking even at the same school.
 */
async function assertBookingAccess(session: ActiveContext, bookingId: string) {
  const booking = await db.expertBooking.findFirst({
    where: {
      id: bookingId,
      ...(session.role === "EXPERT"
        ? { expert: { userId: session.user.id } }
        : { schoolId: session.schoolId ?? "__none__" }),
    },
    include: {
      slot: { select: { startsAt: true, endsAt: true, note: true } },
      school: { select: { name: true } },
      expert: { include: { user: { select: { name: true, preferredName: true } } } },
    },
  });
  if (!booking) throw new AccessError("Booking not found", "NOT_FOUND");
  return booking;
}

export async function getBooking(session: ActiveContext, bookingId: string) {
  const booking = await assertBookingAccess(session, bookingId);

  const messages = await db.expertMessage.findMany({
    where: { bookingId },
    include: { author: { select: { id: true, name: true, preferredName: true, avatarKey: true } } },
    orderBy: { createdAt: "asc" },
  });

  return {
    id: booking.id,
    topic: booking.topic,
    status: booking.status,
    startsAt: booking.slot.startsAt,
    endsAt: booking.slot.endsAt,
    note: booking.slot.note,
    schoolName: booking.school.name,
    expertName: booking.expert.user.preferredName ?? booking.expert.user.name,
    messages: messages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      authorName: message.author.preferredName ?? message.author.name,
      authorAvatar: message.author.avatarKey,
      mine: message.author.id === session.user.id,
    })),
  };
}

/** Adds a message to a booking. Both sides are adults, so there is no gate. */
export async function postMessage(
  session: ActiveContext,
  bookingId: string,
  body: string,
): Promise<void> {
  const clean = body.trim();
  if (!clean) throw new AccessError("Write something first");
  if (clean.length > 5000) throw new AccessError("That message is too long");

  const booking = await assertBookingAccess(session, bookingId);
  if (booking.status === "CANCELLED") {
    throw new AccessError("This booking was cancelled");
  }

  await db.expertMessage.create({
    data: {
      // Taken from the BOOKING, never from the session: for an expert the
      // session carries several schools and picking the wrong one would file
      // the message under a school that is not party to this conversation.
      schoolId: booking.schoolId,
      bookingId,
      authorUserId: session.user.id,
      body: clean,
      readBy: JSON.stringify([session.user.id]),
    },
  });

  const recipient =
    session.role === "EXPERT" ? booking.bookedByMembershipId : null;
  if (session.role === "EXPERT") {
    // Tell the school. A booking with no booker (the member left) is not an
    // error — the thread is still readable by everyone else at that school.
    if (recipient) {
      const booker = await db.membership.findUnique({
        where: { id: recipient },
        select: { userId: true },
      });
      if (booker) {
        await notify({
          userId: booker.userId,
          schoolId: booking.schoolId,
          kind: "EXPERT",
          title: `${booking.expert.user.name} replied`,
          body: clean.slice(0, 120),
          url: `/experts/bookings/${bookingId}`,
        });
      }
    }
  } else {
    await notify({
      userId: booking.expert.userId,
      schoolId: booking.schoolId,
      kind: "EXPERT",
      title: `${booking.school.name} sent a message`,
      body: clean.slice(0, 120),
      url: `/expert/bookings/${bookingId}`,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* An expert's own availability                                                */
/* -------------------------------------------------------------------------- */

export async function listOwnSlots(session: ActiveContext) {
  if (session.role !== "EXPERT") throw new AccessError("Not an expert");
  return db.expertSlot.findMany({
    where: { expert: { userId: session.user.id }, cancelledAt: null },
    orderBy: { startsAt: "asc" },
    include: { booking: { select: { id: true, topic: true, school: { select: { name: true } } } } },
  });
}

/** Offers a new window. Rejects the past and anything back-to-front. */
export async function addSlot(
  session: ActiveContext,
  input: { startsAt: Date; endsAt: Date; note?: string },
): Promise<void> {
  if (session.role !== "EXPERT") throw new AccessError("Not an expert");

  const profile = await db.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) throw new AccessError("No expert profile", "NOT_FOUND");

  if (Number.isNaN(input.startsAt.getTime()) || Number.isNaN(input.endsAt.getTime())) {
    throw new AccessError("Those dates are not dates");
  }
  if (input.endsAt <= input.startsAt) throw new AccessError("It has to end after it starts");
  if (input.startsAt.getTime() < Date.now()) throw new AccessError("That time is in the past");

  // Overlap is refused rather than allowed and sorted out later: a school that
  // books two overlapping slots has booked the same hour twice, and the expert
  // finds out on the day.
  const clash = await db.expertSlot.findFirst({
    where: {
      expertProfileId: profile.id,
      cancelledAt: null,
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
    },
    select: { id: true },
  });
  if (clash) throw new AccessError("That overlaps a time you already offer");

  await db.expertSlot.create({
    data: {
      expertProfileId: profile.id,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      note: input.note?.trim() || null,
    },
  });
}

/** Withdraws an unbooked slot. A booked one has to be cancelled instead. */
export async function removeSlot(session: ActiveContext, slotId: string): Promise<void> {
  if (session.role !== "EXPERT") throw new AccessError("Not an expert");

  const slot = await db.expertSlot.findFirst({
    where: { id: slotId, expert: { userId: session.user.id } },
    select: { id: true, bookedAt: true },
  });
  if (!slot) throw new AccessError("No such slot", "NOT_FOUND");
  if (slot.bookedAt) throw new AccessError("A school has booked that time — cancel the booking");

  await db.expertSlot.update({ where: { id: slotId }, data: { cancelledAt: new Date() } });
}
