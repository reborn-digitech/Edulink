import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { coverCandidates } from "@/lib/leave";
import { addDaysToKey, todayKey, weekdayOfKey } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";

/**
 * The cover picker's advice: with an applicant teaching Monday period 1, a
 * colleague who is busy at exactly that time ranks below one who is free —
 * whatever the alphabet says. Disposable ZZ fixtures; deletion asserted.
 */

const db = new PrismaClient();
const APPLICANT_EMAIL = "zz.applicant.cover@riverside.test";
const BUSY_EMAIL = "zz.aabusy.cover@riverside.test"; // alphabetically FIRST on purpose
const FREE_EMAIL = "zz.zzfree.cover@riverside.test"; // alphabetically LAST on purpose
const ADMIN_EMAIL = "zz.admin.cover@riverside.test";

let schoolId: string;
let admin: ActiveContext;
let applicantMembershipId: string;
let busyMembershipId: string;
let freeMembershipId: string;
let periodId: string;
let classAId: string;
let classBId: string;
let mondayKey: string;

beforeAll(async () => {
  const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = school.id;

  const [applicantUser, busyUser, freeUser, adminUser] = await Promise.all([
    db.user.create({ data: { email: APPLICANT_EMAIL, name: "ZZ Cover Applicant", prefs: "{}" } }),
    db.user.create({ data: { email: BUSY_EMAIL, name: "ZZ Aabusy Teacher", prefs: "{}" } }),
    db.user.create({ data: { email: FREE_EMAIL, name: "ZZ Zzfree Teacher", prefs: "{}" } }),
    db.user.create({ data: { email: ADMIN_EMAIL, name: "ZZ Cover Admin", prefs: "{}" } }),
  ]);

  const [applicant, busy, free, adminMembership] = await Promise.all([
    db.membership.create({ data: { userId: applicantUser.id, schoolId, role: "TEACHER", status: "ACTIVE" } }),
    db.membership.create({ data: { userId: busyUser.id, schoolId, role: "TEACHER", status: "ACTIVE" } }),
    db.membership.create({ data: { userId: freeUser.id, schoolId, role: "TEACHER", status: "ACTIVE" } }),
    db.membership.create({ data: { userId: adminUser.id, schoolId, role: "ADMIN", status: "ACTIVE" } }),
  ]);
  applicantMembershipId = applicant.id;
  busyMembershipId = busy.id;
  freeMembershipId = free.id;

  const period = await db.timetablePeriod.create({
    data: { schoolId, name: "ZZ Cover P1", startMinute: 540, endMinute: 585, position: 90 },
  });
  periodId = period.id;

  const classA = await db.class.create({
    data: { schoolId, name: "ZZ Cover 5A", gradeLevel: "5", joinCode: "ZZCOVER01A" },
  });
  const classB = await db.class.create({
    data: { schoolId, name: "ZZ Cover 5B", gradeLevel: "5", joinCode: "ZZCOVER01B" },
  });
  classAId = classA.id;
  classBId = classB.id;

  // Next Monday, so the leave window contains exactly one weekday-1.
  let key = todayKey(school.timezone);
  while (weekdayOfKey(key) !== 1) key = addDaysToKey(key, 1);
  mondayKey = key;

  // Applicant teaches 5A on Monday P1; the busy colleague teaches 5B at the
  // very same bell; the free colleague teaches nothing at all.
  await db.timetableSlot.create({
    data: { schoolId, classId: classA.id, periodId, weekday: 1, subject: "Maths", teacherMembershipId: applicant.id },
  });
  await db.timetableSlot.create({
    data: { schoolId, classId: classB.id, periodId, weekday: 1, subject: "Science", teacherMembershipId: busy.id },
  });

  admin = {
    sessionId: "test-session",
    membershipId: adminMembership.id,
    schoolId,
    role: "ADMIN",
    user: {
      id: adminUser.id,
      name: "ZZ Cover Admin",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
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
  await db.timetableSlot.deleteMany({ where: { classId: { in: [classAId, classBId] } } });
  await db.timetablePeriod.deleteMany({ where: { id: periodId } });
  await db.class.deleteMany({ where: { id: { in: [classAId, classBId] } } });
  for (const email of [APPLICANT_EMAIL, BUSY_EMAIL, FREE_EMAIL, ADMIN_EMAIL]) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await db.membership.deleteMany({ where: { userId: user.id } });
      await db.user.delete({ where: { id: user.id } });
    }
  }
  expect(await db.class.count({ where: { id: { in: [classAId, classBId] } } })).toBe(0);
  expect(
    await db.user.count({
      where: { email: { in: [APPLICANT_EMAIL, BUSY_EMAIL, FREE_EMAIL, ADMIN_EMAIL] } },
    }),
  ).toBe(0);
  await db.$disconnect();
});

describe("cover suggestions", () => {
  it("ranks the free colleague above the busy one, whatever the alphabet says", async () => {
    const { lessonCount, candidates } = await coverCandidates(
      admin,
      applicantMembershipId,
      mondayKey,
      mondayKey,
    );
    expect(lessonCount).toBe(1);

    const free = candidates.find((c) => c.membershipId === freeMembershipId);
    const busy = candidates.find((c) => c.membershipId === busyMembershipId);
    expect(free?.clashes).toBe(0);
    expect(busy?.clashes).toBe(1);
    expect(candidates.indexOf(free!)).toBeLessThan(candidates.indexOf(busy!));
    // The applicant is never offered as their own cover.
    expect(candidates.find((c) => c.membershipId === applicantMembershipId)).toBeUndefined();
  });

  it("a window missing the lesson's weekday needs nobody", async () => {
    // The day after Monday holds no lessons for this applicant.
    const tuesday = addDaysToKey(mondayKey, 1);
    const { lessonCount } = await coverCandidates(admin, applicantMembershipId, tuesday, tuesday);
    expect(lessonCount).toBe(0);
  });
});
