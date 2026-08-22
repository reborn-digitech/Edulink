import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import type { ActiveContext } from "./session";

/**
 * Parent–teacher meetings: a teacher publishes windows, a family claims one
 * per conversation. The one-booking-per-slot rule is the database's
 * (`MeetingBooking.slotId @unique`) rather than an application check, so two
 * parents tapping the same slot at the same moment cannot both get it — the
 * loser gets a clear message, not a double-booked teacher.
 *
 * Cancelling tells the other side. A slot that silently vanishes, or a family
 * that silently isn't coming, is how a meeting day collapses.
 */

const MAX_RUN = 20;

function requireTeacher(ctx: ActiveContext): { schoolId: string; membershipId: string } {
  if ((ctx.role !== "TEACHER" && ctx.role !== "PRINCIPAL") || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("access.onlyTeachersOfferMeetings");
  }
  return { schoolId: ctx.schoolId, membershipId: ctx.membershipId };
}

/* -------------------------------------------------------------------------- */
/* The teacher's side                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Publish a run of back-to-back slots — "Friday from 3pm, six slots of
 * fifteen minutes" is how a meeting afternoon is actually planned.
 */
export async function publishSlots(
  ctx: ActiveContext,
  input: { startsAt: Date; durationMinutes: number; count: number; location?: string; note?: string },
): Promise<{ created: number }> {
  const { schoolId, membershipId } = requireTeacher(ctx);

  const duration = Math.round(input.durationMinutes);
  const count = Math.round(input.count);
  if (!Number.isFinite(duration) || duration < 5 || duration > 120) {
    throw new AccessError("access.meetingLengthOutOfRange");
  }
  if (!Number.isFinite(count) || count < 1 || count > MAX_RUN) {
    throw new AccessError("access.meetingCountOutOfRange");
  }
  if (!(input.startsAt instanceof Date) || Number.isNaN(input.startsAt.getTime())) {
    throw new AccessError("access.pickAMeetingTime");
  }
  if (input.startsAt.getTime() < Date.now()) {
    throw new AccessError("access.meetingsStartInTheFuture");
  }

  const location = input.location?.trim().slice(0, 120) || null;
  const note = input.note?.trim().slice(0, 300) || null;

  let created = 0;
  for (let i = 0; i < count; i++) {
    const startsAt = new Date(input.startsAt.getTime() + i * duration * 60_000);
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);
    // Two published runs may overlap; that is the teacher's own diary to
    // manage. What is refused is the exact duplicate, so double-submitting
    // the form does not double the afternoon.
    const exists = await db.meetingSlot.findFirst({
      where: { schoolId, teacherMembershipId: membershipId, startsAt, cancelledAt: null },
      select: { id: true },
    });
    if (exists) continue;
    await db.meetingSlot.create({
      data: { schoolId, teacherMembershipId: membershipId, startsAt, endsAt, location, note },
    });
    created += 1;
  }

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "meeting.slotPublish",
    targetType: "Membership",
    targetId: membershipId,
    meta: { count: created, from: input.startsAt.toISOString(), durationMinutes: duration },
  });

  return { created };
}

export type TeacherSlot = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  note: string | null;
  booking: { childName: string; parentName: string; note: string | null } | null;
};

/** The teacher's upcoming slots, booked or open, soonest first. */
export async function teacherSlots(ctx: ActiveContext): Promise<TeacherSlot[]> {
  const { schoolId, membershipId } = requireTeacher(ctx);
  const slots = await db.meetingSlot.findMany({
    where: {
      schoolId,
      teacherMembershipId: membershipId,
      cancelledAt: null,
      endsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    include: {
      booking: {
        include: {
          student: { select: { user: { select: { name: true, preferredName: true } } } },
          parent: { select: { name: true, preferredName: true } },
        },
      },
    },
    take: 100,
  });
  return slots.map((slot) => ({
    id: slot.id,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    location: slot.location,
    note: slot.note,
    booking:
      slot.booking && slot.booking.cancelledAt === null
        ? {
            childName: slot.booking.student.user.preferredName ?? slot.booking.student.user.name,
            parentName: slot.booking.parent.preferredName ?? slot.booking.parent.name,
            note: slot.booking.note,
          }
        : null,
  }));
}

/** Withdraw a slot. A booked family is told, by name of the teacher. */
export async function cancelSlot(ctx: ActiveContext, slotId: string): Promise<void> {
  const { schoolId, membershipId } = requireTeacher(ctx);
  const slot = await db.meetingSlot.findFirst({
    where: { id: slotId, schoolId, teacherMembershipId: membershipId, cancelledAt: null },
    include: { booking: { select: { parentUserId: true, cancelledAt: true } } },
  });
  if (!slot) throw new AccessError("access.meetingNotFound", "NOT_FOUND");

  await db.meetingSlot.update({ where: { id: slot.id }, data: { cancelledAt: new Date() } });

  if (slot.booking && slot.booking.cancelledAt === null) {
    const teacherName = ctx.user.preferredName ?? ctx.user.name;
    await notify({
      userId: slot.booking.parentUserId,
      schoolId,
      kind: "SYSTEM",
      titleKey: "notifTitle.meetingCancelled",
      bodyKey: "notifBody.teacherCancelledMeeting",
      bodyVars: { name: teacherName },
      url: "/parent/meetings",
    });
  }

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "meeting.cancel",
    targetType: "MeetingSlot",
    targetId: slot.id,
    meta: { by: "teacher", wasBooked: slot.booking !== null },
  });
}

/* -------------------------------------------------------------------------- */
/* The family's side                                                           */
/* -------------------------------------------------------------------------- */

export type OpenSlot = {
  id: string;
  teacherName: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  note: string | null;
};

export type MyBooking = {
  bookingId: string;
  teacherName: string;
  childName: string;
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  note: string | null;
};

/**
 * Open slots from the teachers who actually teach this parent's children —
 * the whole staff room's diary is nobody's business, and a meeting with a
 * teacher who has never met the child is not what this page is for.
 */
export async function openSlotsFor(parentUserId: string): Promise<OpenSlot[]> {
  const teacherIds = await relevantTeacherIds(parentUserId);
  if (teacherIds.length === 0) return [];

  const slots = await db.meetingSlot.findMany({
    where: {
      teacherMembershipId: { in: teacherIds },
      cancelledAt: null,
      startsAt: { gte: new Date() },
      OR: [{ booking: null }, { booking: { cancelledAt: { not: null } } }],
    },
    orderBy: { startsAt: "asc" },
    include: { teacher: { select: { user: { select: { name: true, preferredName: true } } } } },
    take: 100,
  });

  return slots.map((slot) => ({
    id: slot.id,
    teacherName: slot.teacher.user.preferredName ?? slot.teacher.user.name,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    location: slot.location,
    note: slot.note,
  }));
}

async function relevantTeacherIds(parentUserId: string): Promise<string[]> {
  const links = await db.guardianship.findMany({
    where: { parentUserId, status: "ACTIVE" },
    select: {
      student: {
        select: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { class: { select: { teachers: { select: { teacherMembershipId: true } } } } },
          },
        },
      },
    },
  });
  const ids = new Set<string>();
  for (const link of links) {
    for (const enrollment of link.student.enrollments) {
      for (const teacher of enrollment.class.teachers) ids.add(teacher.teacherMembershipId);
    }
  }
  return [...ids];
}

/**
 * Claim a slot for one child. The database's unique slotId is the actual
 * lock; a lost race surfaces as "somebody got there first".
 */
export async function bookSlot(
  parentUserId: string,
  slotId: string,
  studentMembershipId: string,
  note?: string,
): Promise<void> {
  // The child must be this parent's, and the slot must belong to a teacher of
  // that child — the same relevance rule the listing applies, re-checked on
  // the write path because forms can be forged.
  const guardianship = await db.guardianship.findFirst({
    where: { parentUserId, studentMembershipId, status: "ACTIVE" },
    select: { studentSchoolId: true },
  });
  if (!guardianship) throw new AccessError("access.notYourChild", "NOT_FOUND");

  const slot = await db.meetingSlot.findFirst({
    where: {
      id: slotId,
      schoolId: guardianship.studentSchoolId,
      cancelledAt: null,
      startsAt: { gte: new Date() },
      teacherMembershipId: { in: await relevantTeacherIds(parentUserId) },
    },
    include: {
      booking: { select: { id: true, cancelledAt: true } },
      teacher: { select: { userId: true } },
    },
  });
  if (!slot) throw new AccessError("access.meetingNotFound", "NOT_FOUND");

  // A cancelled booking frees its slot; clear the wreck so the unique can take.
  if (slot.booking?.cancelledAt) {
    await db.meetingBooking.delete({ where: { id: slot.booking.id } });
  } else if (slot.booking) {
    throw new AccessError("access.meetingAlreadyBooked");
  }

  const child = await db.membership.findUniqueOrThrow({
    where: { id: studentMembershipId },
    select: { user: { select: { name: true, preferredName: true } } },
  });

  try {
    await db.meetingBooking.create({
      data: {
        schoolId: guardianship.studentSchoolId,
        slotId,
        studentMembershipId,
        parentUserId,
        note: note?.trim().slice(0, 300) || null,
      },
    });
  } catch (error) {
    // The unique on slotId: somebody else claimed it between read and write.
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      throw new AccessError("access.meetingAlreadyBooked");
    }
    throw error;
  }

  const childName = child.user.preferredName ?? child.user.name;
  await notify({
    userId: slot.teacher.userId,
    schoolId: guardianship.studentSchoolId,
    kind: "SYSTEM",
    titleKey: "notifTitle.meetingBooked",
    bodyKey: "notifBody.familyBookedSlot",
    bodyVars: { name: childName },
    url: "/teacher/meetings",
  });

  await audit({
    schoolId: guardianship.studentSchoolId,
    actorUserId: parentUserId,
    action: "meeting.book",
    targetType: "MeetingSlot",
    targetId: slotId,
  });
}

/** The family's own upcoming meetings. */
export async function myBookings(parentUserId: string): Promise<MyBooking[]> {
  const bookings = await db.meetingBooking.findMany({
    where: { parentUserId, cancelledAt: null, slot: { cancelledAt: null, endsAt: { gte: new Date() } } },
    orderBy: { slot: { startsAt: "asc" } },
    include: {
      slot: {
        include: { teacher: { select: { user: { select: { name: true, preferredName: true } } } } },
      },
      student: { select: { user: { select: { name: true, preferredName: true } } } },
    },
    take: 50,
  });
  return bookings.map((booking) => ({
    bookingId: booking.id,
    teacherName: booking.slot.teacher.user.preferredName ?? booking.slot.teacher.user.name,
    childName: booking.student.user.preferredName ?? booking.student.user.name,
    startsAt: booking.slot.startsAt,
    endsAt: booking.slot.endsAt,
    location: booking.slot.location,
    note: booking.note,
  }));
}

/** The family steps back; the slot opens again and the teacher is told. */
export async function cancelBooking(parentUserId: string, bookingId: string): Promise<void> {
  const booking = await db.meetingBooking.findFirst({
    where: { id: bookingId, parentUserId, cancelledAt: null },
    include: {
      slot: { select: { id: true, schoolId: true, teacher: { select: { userId: true } } } },
      student: { select: { user: { select: { name: true, preferredName: true } } } },
    },
  });
  if (!booking) throw new AccessError("access.meetingNotFound", "NOT_FOUND");

  // Deleted, not tombstoned: the slot's unique must open for the next family,
  // and a withdrawn booking is not a record anybody needs kept.
  await db.meetingBooking.delete({ where: { id: booking.id } });

  const childName = booking.student.user.preferredName ?? booking.student.user.name;
  await notify({
    userId: booking.slot.teacher.userId,
    schoolId: booking.slot.schoolId,
    kind: "SYSTEM",
    titleKey: "notifTitle.meetingCancelled",
    bodyKey: "notifBody.familyCancelledSlot",
    bodyVars: { name: childName },
    url: "/teacher/meetings",
  });

  await audit({
    schoolId: booking.slot.schoolId,
    actorUserId: parentUserId,
    action: "meeting.cancel",
    targetType: "MeetingSlot",
    targetId: booking.slot.id,
    meta: { by: "parent" },
  });
}
