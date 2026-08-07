import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  publishSlots,
  teacherSlots,
  cancelSlot,
  openSlotsFor,
  bookSlot,
  myBookings,
  cancelBooking,
} from "@/lib/meetings";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * Parent–teacher meetings end to end: the run publishes, only the family of a
 * taught child sees it, one slot takes one booking, cancelling frees it, and
 * both directions notify. Disposable ZZ fixtures; deletion asserted.
 */

const db = new PrismaClient();
const TEACHER_EMAIL = "zz.teacher.ptm@riverside.test";
const PUPIL_EMAIL = "zz.pupil.ptm@riverside.test";
const PARENT_EMAIL = "zz.parent.ptm@riverside.test";
const STRANGER_EMAIL = "zz.stranger.ptm@riverside.test";

let schoolId: string;
let classId: string;
let teacher: ActiveContext;
let teacherUserId: string;
let pupilMembershipId: string;
let parentUserId: string;
let strangerUserId: string;

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;

  const [teacherUser, pupilUser, parentUser, strangerUser] = await Promise.all([
    db.user.create({ data: { email: TEACHER_EMAIL, name: "ZZ PTM Teacher", prefs: "{}" } }),
    db.user.create({ data: { email: PUPIL_EMAIL, name: "ZZ PTM Pupil", prefs: "{}" } }),
    db.user.create({ data: { email: PARENT_EMAIL, name: "ZZ PTM Parent", prefs: "{}" } }),
    db.user.create({ data: { email: STRANGER_EMAIL, name: "ZZ PTM Stranger", prefs: "{}" } }),
  ]);
  teacherUserId = teacherUser.id;
  parentUserId = parentUser.id;
  strangerUserId = strangerUser.id;

  const teacherMembership = await db.membership.create({
    data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" },
  });
  const pupilMembership = await db.membership.create({
    data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE" },
  });
  pupilMembershipId = pupilMembership.id;

  const klass = await db.class.create({
    data: { schoolId, name: "ZZ PTM Class", gradeLevel: "6", joinCode: "ZZPTM00001" },
  });
  classId = klass.id;
  await db.classTeacher.create({
    data: { classId, schoolId, teacherMembershipId: teacherMembership.id },
  });
  await db.enrollment.create({
    data: { classId, schoolId, studentMembershipId: pupilMembership.id },
  });
  await db.guardianship.create({
    data: { parentUserId: parentUser.id, studentMembershipId: pupilMembership.id, studentSchoolId: schoolId },
  });

  teacher = {
    sessionId: "test-session",
    membershipId: teacherMembership.id,
    schoolId,
    role: "TEACHER",
    user: {
      id: teacherUser.id,
      name: "ZZ PTM Teacher",
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
});

afterAll(async () => {
  await db.meetingBooking.deleteMany({ where: { parentUserId } });
  await db.meetingSlot.deleteMany({ where: { teacher: { userId: teacherUserId } } });
  await db.notification.deleteMany({ where: { userId: { in: [teacherUserId, parentUserId] } } });
  await db.guardianship.deleteMany({ where: { parentUserId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.classTeacher.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  for (const email of [TEACHER_EMAIL, PUPIL_EMAIL, PARENT_EMAIL, STRANGER_EMAIL]) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  expect(await db.class.count({ where: { id: classId } })).toBe(0);
  expect(
    await db.user.count({
      where: { email: { in: [TEACHER_EMAIL, PUPIL_EMAIL, PARENT_EMAIL, STRANGER_EMAIL] } },
    }),
  ).toBe(0);
  await db.$disconnect();
});

describe("parent–teacher meetings", () => {
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);

  it("publishes a run, idempotently", async () => {
    const first = await publishSlots(teacher, { startsAt: start, durationMinutes: 15, count: 3 });
    expect(first.created).toBe(3);
    // The double-submitted form creates nothing new.
    const again = await publishSlots(teacher, { startsAt: start, durationMinutes: 15, count: 3 });
    expect(again.created).toBe(0);
    expect(await teacherSlots(teacher)).toHaveLength(3);
  });

  it("only the taught child's family sees the open times", async () => {
    expect(await openSlotsFor(parentUserId)).toHaveLength(3);
    expect(await openSlotsFor(strangerUserId)).toHaveLength(0);
  });

  it("one slot takes one booking, and the teacher is told", async () => {
    const open = await openSlotsFor(parentUserId);
    await bookSlot(parentUserId, open[0]!.id, pupilMembershipId, "About reading");

    expect(await openSlotsFor(parentUserId)).toHaveLength(2);
    const mine = await myBookings(parentUserId);
    expect(mine).toHaveLength(1);
    expect(mine[0]!.childName).toBe("ZZ PTM Pupil");

    const slots = await teacherSlots(teacher);
    const booked = slots.find((s) => s.booking !== null);
    expect(booked?.booking?.note).toBe("About reading");

    expect(
      await db.notification.count({ where: { userId: teacherUserId, title: "Meeting booked" } }),
    ).toBe(1);

    // The slot is taken; a second claim is refused, and a stranger's forged
    // form never got this far anyway.
    await expect(bookSlot(parentUserId, open[0]!.id, pupilMembershipId)).rejects.toThrow(AccessError);
    await expect(bookSlot(strangerUserId, open[1]!.id, pupilMembershipId)).rejects.toThrow(AccessError);
  });

  it("cancelling the booking frees the slot and tells the teacher", async () => {
    const mine = await myBookings(parentUserId);
    await cancelBooking(parentUserId, mine[0]!.bookingId);
    expect(await myBookings(parentUserId)).toHaveLength(0);
    expect(await openSlotsFor(parentUserId)).toHaveLength(3);
    expect(
      await db.notification.count({ where: { userId: teacherUserId, title: "Meeting cancelled" } }),
    ).toBe(1);
  });

  it("cancelling a booked slot tells the family", async () => {
    const open = await openSlotsFor(parentUserId);
    await bookSlot(parentUserId, open[0]!.id, pupilMembershipId);
    await cancelSlot(teacher, open[0]!.id);
    expect(
      await db.notification.count({ where: { userId: parentUserId, title: "Meeting cancelled" } }),
    ).toBe(1);
    expect(await openSlotsFor(parentUserId)).toHaveLength(2); // the cancelled one is gone
  });
});
