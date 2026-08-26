import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { EXPERT_OFFERINGS, type ExpertOffering } from "./constants";
import { notify } from "./notify";
import { readJsonArray, writeJson } from "./json";
import { forJoinCode } from "./tenant-context";
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
    throw new AccessError("access.onlyATeacherOrAnAdminCan2");
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
  /**
   * ⚠ `forJoinCode`, AND WITHOUT IT EVERY EXPERT INVITATION LINK WAS DEAD.
   *
   * `ExpertInvite_readable` opens exactly one row: the one whose `tokenHash`
   * equals `app.join_code`. Nothing else can, and nothing else should — an
   * invitation is read by somebody with no session, no school and no
   * membership, so holding the token IS the authorisation. This function read
   * the table without binding it, Postgres correctly returned nothing, and the
   * page said "That invitation cannot be used" to every valid link ever sent.
   *
   * The pupil invite page has always done this right — `/invite/[token]` wraps
   * its lookup the same way. This one was written from the same idea and missed
   * the one line that makes it work. Found by walking the page in a browser
   * after translating it, which is the whole argument for walking it.
   */
  const invite = await forJoinCode(hashToken(token), () =>
    db.expertInvite.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        name: true,
        email: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
      },
    }),
  );
  if (!invite) return { ok: false, reason: "unknown" };
  if (invite.revokedAt) return { ok: false, reason: "revoked" };
  if (invite.acceptedAt) return { ok: false, reason: "used" };
  if (invite.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  return { ok: true, inviteId: invite.id, name: invite.name, email: invite.email };
}

/** The delegates `acceptExpertInvite` touches, and only those. */
type AcceptTx = {
  expertInvite: {
    findUnique(args: unknown): Promise<{
      id: string;
      acceptedAt: Date | null;
      revokedAt: Date | null;
      expiresAt: Date;
      schoolId: string;
    } | null>;
    update(args: unknown): Promise<unknown>;
  };
  expertProfile: {
    findUnique(args: unknown): Promise<{ id: string } | null>;
    create(args: unknown): Promise<{ id: string }>;
  };
};

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
  if (headline.length < 3) throw new AccessError("access.sayWhatYouDoInAFew");

  /**
   * `$tenantTransaction`, not `db.$transaction`. See db.ts and the note in
   * leave.ts: on this extended client BOTH `db.$transaction` forms re-issue
   * each statement in its own transaction to bind the tenant, so the outer one
   * holds nothing together. Here that would mean a profile created and the
   * invitation left unaccepted — the exact double-spend the comment above
   * claims this transaction prevents.
   *
   * ⚠ AND INSIDE `forJoinCode`, for the reason spelt out on `readExpertInvite`
   * — this transaction reads the same invitation row, so without the code bound
   * it found nothing and refused an invitation it had just been handed. The
   * wrapper goes OUTSIDE: `$tenantTransaction` asks the resolver what to bind
   * before it opens, so the override has to be in scope by then.
   */
  return forJoinCode(hashToken(token), () =>
    db.$tenantTransaction(async (txUnknown: unknown) => {
      const tx = txUnknown as AcceptTx;
      const invite = await tx.expertInvite.findUnique({
        where: { tokenHash: hashToken(token) },
        select: { id: true, acceptedAt: true, revokedAt: true, expiresAt: true, schoolId: true },
      });
      if (!invite || invite.revokedAt || invite.acceptedAt) {
        throw new AccessError("access.thatInvitationCannotBeUsed", "NOT_FOUND");
      }
      if (invite.expiresAt.getTime() < Date.now()) {
        throw new AccessError("access.thatInvitationHasExpired", "NOT_FOUND");
      }

      const existing = await tx.expertProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
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
    }),
  );
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
  /** What they agreed to do, so a school is not offered a button that refuses. */
  offering: ExpertOffering;
  mentorCapacity: number | null;
  mentoringOpen: boolean;
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
      offering: expert.offering as ExpertOffering,
      mentorCapacity: expert.mentorCapacity,
      /**
       * WHETHER THEY CAN STILL TAKE ONE. Shown so a school does not compose a
       * request to somebody who is full and meet the refusal afterwards — the
       * cap is enforced in `mentoring.ts` either way, and a page that hides it
       * turns an honest limit into a dead end.
       */
      mentoringOpen:
        expert.offering !== "SESSIONS" &&
        (expert.mentorCapacity === null || expert.activeMentorships < expert.mentorCapacity),
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
    throw new AccessError("access.onlyATeacherOrAnAdminCan");
  }
  const cleanTopic = topic.trim();
  if (cleanTopic.length < 3) throw new AccessError("access.sayWhatYouWouldLikeToDiscuss");

  const slot = await db.expertSlot.findUnique({
    where: { id: slotId },
    select: {
      id: true,
      startsAt: true,
      cancelledAt: true,
      bookedAt: true,
      expertProfileId: true,
      expert: {
        select: { publishedAt: true, offering: true, userId: true, user: { select: { name: true } } },
      },
    },
  });
  if (!slot || !slot.expert.publishedAt) throw new AccessError("access.noSuchSlot", "NOT_FOUND");
  // WHAT THEY AGREED TO DO, checked rather than assumed. An expert offering
  // mentoring only may still have slots — mentors and mentees arrange times —
  // and those are not a school's to book for a workshop.
  if (slot.expert.offering === "MENTORING") {
    throw new AccessError("access.thisExpertIsOfferingMentoringRatherThan", "NOT_FOUND");
  }
  if (slot.cancelledAt) throw new AccessError("access.thatTimeIsNoLongerOffered");
  if (slot.startsAt.getTime() < Date.now()) throw new AccessError("access.thatTimeHasAlreadyPassed");

  // Claim it. Zero rows means somebody else got there first.
  const claimed = await db.expertSlot.updateMany({
    where: { id: slotId, bookedAt: null, cancelledAt: null },
    data: { bookedAt: new Date() },
  });
  if (claimed.count === 0) throw new AccessError("access.somebodyBookedThatTimeJustNow");

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
      titleKey: "notifTitle.schoolBookedYou",
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
    select: {
      id: true,
      status: true,
      schoolId: true,
      expert: { select: { userId: true } },
      slot: {
        select: { id: true, expertProfileId: true, startsAt: true, endsAt: true, note: true },
      },
    },
  });
  if (!booking) throw new AccessError("access.bookingNotFound", "NOT_FOUND");

  const isSchoolStaff =
    (session.role === "ADMIN" || session.role === "TEACHER") &&
    session.schoolId === booking.schoolId;
  const isTheExpert = session.role === "EXPERT" && session.user.id === booking.expert.userId;
  if (!isSchoolStaff && !isTheExpert) throw new AccessError("access.notYourBookingToCancel");

  // Idempotent. Two people pressing cancel, or one pressing twice, must not
  // mint two replacement hours below.
  if (booking.status === "CANCELLED") return;

  await db.expertBooking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  /**
   * ⚠ THE HOUR COMES BACK AS A NEW SLOT, and clearing `bookedAt` on the old one
   * — which is what this used to do — did not work.
   *
   * `ExpertBooking.slotId` is UNIQUE, and a cancelled booking still holds that
   * row. So freeing the slot put the time back in the marketplace looking
   * perfectly bookable, and the next school to press Book met
   * `Unique constraint failed on the fields: (slotId)` — a slot advertised and
   * un-bookable. Nobody had hit it because until the cancel button existed
   * nothing could free a slot this way; adding the button is what made it
   * reachable, and a test that books, cancels, and books again is what caught
   * it before it shipped.
   *
   * So the consumed row is retired rather than freed — `cancelledAt` keeps it
   * out of `listMarketplace` and out of `bookSlot` — and an identical, unbooked
   * slot takes its place. The expert offered that time and has not withdrawn
   * it; what changed is only which row represents it.
   *
   * NOT a schema change. The alternative is dropping the unique constraint and
   * replacing it with a partial index on "not cancelled", which is the tidier
   * data model and a migration this does not need: one live booking per slot is
   * still exactly true, because a retired slot can never be booked again.
   */
  await db.expertSlot.update({
    where: { id: booking.slot.id },
    data: { cancelledAt: new Date(), bookedAt: null },
  });
  await db.expertSlot.create({
    data: {
      expertProfileId: booking.slot.expertProfileId,
      startsAt: booking.slot.startsAt,
      endsAt: booking.slot.endsAt,
      note: booking.slot.note,
    },
  });

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
  /**
   * STAFF OR THE EXPERT, the same rule as `assertBookingAccess` — and it is
   * here rather than left to the two pages that call it for the reason the
   * `/record` bug taught: a gate that lives somewhere else is not a gate this
   * function has. Both callers happen to be role-gated today; the third one
   * somebody adds will not be, and this returning a school's whole booking list
   * to a pupil is the kind of thing that then looks like it was always allowed.
   */
  const isStaff = session.role === "ADMIN" || session.role === "TEACHER";
  if (!isExpert && !isStaff) return [];
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
 * `assertBookingAccess` is the security of `getBooking` and of `postMessage`
 * below: it re-resolves the booking against the SESSION rather than trusting the
 * id in the URL. For an expert that is an equality on their own user id, so one
 * expert cannot read another's booking even at the same school.
 *
 * ⚠ FOR A SCHOOL IT IS STAFF OF THAT SCHOOL — NOT MERELY A MEMBER OF IT, and
 * the difference was a safeguarding hole. The predicate used to be the tenant
 * one alone, so "may read this booking" meant "belongs to this school": a
 * PUPIL, or a guardian, could open `/experts/bookings/<id>` and read the whole
 * staff↔expert conversation, and `postMessage` shares this gate, so they could
 * write in it too. `postMessage`'s own comment said "both sides are adults,
 * so there is no gate" — true of the expert, false of the school.
 *
 * It was never reachable by browsing: `/experts` turns away everyone but staff,
 * nothing lists booking ids to a child, and an id is a cuid. It was a wrong
 * boundary rather than an open door. But an unsupervised channel between a child
 * and an adult from outside the school is the exact thing `mentoring.ts` spends
 * consent, guardian visibility and staff-only pairing to prevent, and this
 * offered one for free.
 *
 * ADMIN OR TEACHER, matching `bookSlot` and `cancelBooking` exactly — one
 * definition of "staff" in this file rather than three that can drift. A
 * PRINCIPAL is deliberately NOT included: they cannot book, cannot cancel, and
 * `/experts` is not in their navigation, so adding them here would be widening
 * access under cover of a security fix. If a principal should see these, that
 * is a decision to make on its own.
 *
 * REFUSED WITH THE SAME `NOT_FOUND` AS AN ID THAT NEVER EXISTED. A pupil must
 * not learn that a booking exists, which is the same reasoning the mentoring
 * thread and the report pages already use.
 */
async function assertBookingAccess(session: ActiveContext, bookingId: string) {
  const isExpert = session.role === "EXPERT";
  const isStaff = session.role === "ADMIN" || session.role === "TEACHER";

  // Checked before the query, so a pupil's request never becomes a lookup.
  if (!isExpert && !isStaff) throw new AccessError("access.bookingNotFound", "NOT_FOUND");

  const booking = await db.expertBooking.findFirst({
    where: {
      id: bookingId,
      ...(isExpert
        ? { expert: { userId: session.user.id } }
        : { schoolId: session.schoolId ?? "__none__" }),
    },
    include: {
      slot: { select: { startsAt: true, endsAt: true, note: true } },
      school: { select: { name: true } },
      expert: { include: { user: { select: { name: true, preferredName: true } } } },
    },
  });
  if (!booking) throw new AccessError("access.bookingNotFound", "NOT_FOUND");
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

/**
 * Adds a message to a booking.
 *
 * ⚠ THIS USED TO SAY "both sides are adults, so there is no gate", and that was
 * half right in the way that matters. The expert is an adult; the school side
 * was whoever `assertBookingAccess` let through, which was every member of the
 * school — including its pupils. The gate is that function, and it now means
 * staff or the expert. The comment is kept as a note rather than deleted
 * because the sentence was the reason nobody looked.
 */
export async function postMessage(
  session: ActiveContext,
  bookingId: string,
  body: string,
): Promise<void> {
  const clean = body.trim();
  if (!clean) throw new AccessError("access.writeSomethingFirst");
  if (clean.length > 5000) throw new AccessError("access.thatMessageIsTooLong");

  const booking = await assertBookingAccess(session, bookingId);
  if (booking.status === "CANCELLED") {
    throw new AccessError("access.thisBookingWasCancelled");
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
          titleKey: "notifTitle.personReplied",
          titleVars: { name: booking.expert.user.name },
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
      titleKey: "notifTitle.schoolSentMessage",
      titleVars: { school: booking.school.name },
      body: clean.slice(0, 120),
      url: `/expert/bookings/${bookingId}`,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* An expert's own availability                                                */
/* -------------------------------------------------------------------------- */

export async function listOwnSlots(session: ActiveContext) {
  if (session.role !== "EXPERT") throw new AccessError("access.notAnExpert");
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
  if (session.role !== "EXPERT") throw new AccessError("access.notAnExpert");

  const profile = await db.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");

  if (Number.isNaN(input.startsAt.getTime()) || Number.isNaN(input.endsAt.getTime())) {
    throw new AccessError("access.thoseDatesAreNotDates");
  }
  if (input.endsAt <= input.startsAt) throw new AccessError("access.itHasToEndAfterItStarts");
  if (input.startsAt.getTime() < Date.now()) throw new AccessError("access.thatTimeIsInThePast");

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
  if (clash) throw new AccessError("access.thatOverlapsATimeYouAlreadyOffer");

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
  if (session.role !== "EXPERT") throw new AccessError("access.notAnExpert");

  const slot = await db.expertSlot.findFirst({
    where: { id: slotId, expert: { userId: session.user.id } },
    select: { id: true, bookedAt: true },
  });
  if (!slot) throw new AccessError("access.noSuchSlot", "NOT_FOUND");
  if (slot.bookedAt) throw new AccessError("access.aSchoolHasBookedThatTimeCancel");

  await db.expertSlot.update({ where: { id: slotId }, data: { cancelledAt: new Date() } });
}

/* -------------------------------------------------------------------------- */
/* The expert's own profile                                                    */
/* -------------------------------------------------------------------------- */

export type OwnProfile = {
  headline: string;
  bio: string;
  organisation: string | null;
  specialisms: string[];
  timezone: string;
  offering: ExpertOffering;
  mentorCapacity: number | null;
  published: boolean;
  verified: boolean;
};

/**
 * What the expert wrote about themselves.
 *
 * This existed in the nav and the command palette for a long time with nothing
 * behind it — `/expert/profile` was a 404 in two places an expert is most likely
 * to tap. What made it survive is that the sweep only visits URLs somebody
 * thought to list; a link is now checked against the routes that exist.
 */
/**
 * What the work has added up to — the expert's own numbers, from rows their
 * self clauses already open: their bookings (`expertUserId`), their profile,
 * their slots. Counts only; the schools' names stay behind their fences.
 */
export async function ownImpact(session: ActiveContext): Promise<{
  sessionsDone: number;
  sessionsBooked: number;
  schoolsServed: number;
  activeMentorships: number;
  mentorCapacity: number | null;
  upcomingSlots: number;
}> {
  if (session.role !== "EXPERT") throw new AccessError("access.notAnExpert");
  const profile = await db.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, activeMentorships: true, mentorCapacity: true },
  });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");

  const bookings = await db.expertBooking.findMany({
    where: { expertUserId: session.user.id, status: { in: ["CONFIRMED", "COMPLETED"] } },
    select: { schoolId: true, status: true },
  });
  const upcomingSlots = await db.expertSlot.count({
    where: {
      expertProfileId: profile.id,
      startsAt: { gt: new Date() },
      cancelledAt: null,
      bookedAt: null,
    },
  });
  return {
    sessionsDone: bookings.filter((b) => b.status === "COMPLETED").length,
    sessionsBooked: bookings.filter((b) => b.status === "CONFIRMED").length,
    schoolsServed: new Set(bookings.map((b) => b.schoolId)).size,
    activeMentorships: profile.activeMentorships,
    mentorCapacity: profile.mentorCapacity,
    upcomingSlots,
  };
}

export async function getOwnProfile(session: ActiveContext): Promise<OwnProfile> {
  if (session.role !== "EXPERT") throw new AccessError("access.notAnExpert");

  const profile = await db.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      headline: true,
      bio: true,
      organisation: true,
      specialisms: true,
      timezone: true,
      offering: true,
      mentorCapacity: true,
      publishedAt: true,
      verifiedAt: true,
    },
  });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");

  return {
    headline: profile.headline,
    bio: profile.bio,
    organisation: profile.organisation,
    specialisms: readJsonArray<string>(profile.specialisms),
    timezone: profile.timezone,
    offering: profile.offering as ExpertOffering,
    mentorCapacity: profile.mentorCapacity,
    published: profile.publishedAt !== null,
    verified: profile.verifiedAt !== null,
  };
}

export type ProfileInput = {
  headline: string;
  bio: string;
  organisation?: string | null;
  specialisms: string[];
  timezone: string;
  offering: ExpertOffering;
  /** Only meaningful when they mentor at all; ignored otherwise. */
  mentorCapacity?: number | null;
};

const MAX_SPECIALISMS = 12;

/**
 * The expert edits their own words. NOT their standing.
 *
 * `publishedAt` and `verifiedAt` are absent from this function on purpose. They
 * are the two fields that decide whether schools see this person at all and
 * whether they are shown as checked, and an editor that let their subject set
 * them would make the whole curation step decorative. They are set by whoever
 * runs the server.
 *
 * Everything is trimmed and bounded here rather than in the form, because the
 * form is not the only thing that can call this.
 */
export async function updateOwnProfile(
  session: ActiveContext,
  input: ProfileInput,
): Promise<void> {
  if (session.role !== "EXPERT") throw new AccessError("access.notAnExpert");

  const profile = await db.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) throw new AccessError("access.noExpertProfile", "NOT_FOUND");

  const headline = input.headline.trim();
  if (headline.length < 3) throw new AccessError("access.giveYourselfAHeadline");
  if (headline.length > 120) throw new AccessError("access.thatHeadlineIsTooLong");

  const bio = input.bio.trim();
  if (bio.length > 4000) throw new AccessError("access.thatDescriptionIsTooLong");

  // Empty strings dropped, duplicates dropped, order kept. A specialism list
  // with three blanks in it is what an unbounded tag input produces on the
  // first mis-tap, and it lands on a page schools browse.
  const seen = new Set<string>();
  const specialisms: string[] = [];
  for (const raw of input.specialisms) {
    const value = raw.trim().slice(0, 60);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    specialisms.push(value);
    if (specialisms.length === MAX_SPECIALISMS) break;
  }

  const timezone = input.timezone.trim() || "UTC";
  // Rejected rather than silently corrected: a slot written against a timezone
  // nobody can resolve is a meeting at an unknown hour.
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone });
  } catch {
    throw new AccessError("access.thatIsNotATimezoneThisServer");
  }

  /**
   * WHAT THEY ARE OFFERING, validated against the list rather than trusted.
   *
   * This is the one field on this form that changes what other people may DO to
   * them — a school cannot book a session with somebody offering mentoring
   * only, and cannot pair a child with somebody offering sessions only. So an
   * unrecognised value is refused rather than defaulted: silently falling back
   * to BOTH would widen the commitment of whoever sent it.
   */
  if (!EXPERT_OFFERINGS.includes(input.offering)) {
    throw new AccessError("access.sayWhetherYouAreOfferingSessionsMentoring");
  }

  /**
   * The cap, which only means anything if they mentor at all.
   *
   * Nulled when they are not mentoring, so a person who switches to sessions
   * only does not leave a stale number behind for somebody to read as consent.
   */
  const mentors = input.offering !== "SESSIONS";
  let mentorCapacity: number | null = null;
  if (mentors && input.mentorCapacity !== null && input.mentorCapacity !== undefined) {
    const capacity = Math.floor(input.mentorCapacity);
    if (!Number.isFinite(capacity) || capacity < 1) {
      throw new AccessError("access.howManyChildrenWillYouMentorAt");
    }
    // A ceiling, because the number is a promise to children. Somebody typing
    // 500 has misunderstood what they are agreeing to, and the honest response
    // is to say so rather than to record it.
    if (capacity > 50) throw new AccessError("access.thatIsMoreChildrenThanOnePerson");
    mentorCapacity = capacity;
  }

  await db.expertProfile.update({
    where: { id: profile.id },
    data: {
      headline,
      bio,
      organisation: input.organisation?.trim() || null,
      specialisms: writeJson(specialisms),
      timezone,
      offering: input.offering,
      mentorCapacity,
    },
  });

  // No schoolId: an expert belongs to no school, and this row would otherwise
  // land in the history of whichever school happened to be in context.
  await audit({
    actorUserId: session.user.id,
    action: "expert.profile.update",
    targetType: "ExpertProfile",
    targetId: profile.id,
    meta: { specialisms: specialisms.length },
  });
}
