/**
 * Remark threads (src/lib/remarks.ts) and meeting slots (src/lib/meetings.ts),
 * four findings of the testing analysis of 13 November 2026.
 *
 * TA-559: a reply wrote its message and then, in a separate unconditional
 * statement, set the thread's lastMessageAt to that message's time, so of two
 * replies landing together the older one's update could commit last and leave
 * the thread sorted below threads it is newer than. Now the thread moves only
 * forward.
 *
 * TA-389: a pupil or guardian could open a thread only with a teacher holding
 * a ClassTeacher row in the pupil's class, while the teacher's own side (and
 * meetings, and reviews) also accepts a lesson on the timetable. Now
 * teacherTeaches and teachersForStudent read both, as taughtClassWhere does.
 *
 * TA-391: the school's stand-in guardianship (relation SCHOOL) counted as the
 * family in guardianCount, so the "no guardian, nobody will receive this"
 * warning never showed for a pupil whose family is not on the app. Now the
 * count is the family's own guardianships.
 *
 * TA-390: publishing a run of meeting slots was check-then-create with no key,
 * so two presses at once both created every slot. Now one publish of a
 * teacher's runs at a time, under a lock in the same transaction as its
 * check and its creates.
 *
 * One ZZ school of this suite's own, made through the owner connection and
 * removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createThread, replyToThread, studentsForTeacher, teachersForStudent } from "@/lib/remarks";
import { publishSlots } from "@/lib/meetings";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-remarks-${who}-${STAMP}@test.invalid`;
let schoolId = "";
const ids: Record<string, string> = {};

function ctx(who: string, role: ActiveContext["role"], withMembership = true): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: withMembership ? ids[`${who}M`]! : null,
    schoolId: role === "PARENT" ? null : schoolId,
    role,
    user: { id: ids[who]!, name: "Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false },
  } as ActiveContext;
}

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ TA Remarks ${STAMP}`, slug: `zz-ta-remarks-${STAMP}`, code: `ZTR${SUFFIX}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const user = async (who: string) => {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA Remarks ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  };
  const member = async (who: string, role: string) => {
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
  };
  for (const who of ["lead", "hindi", "pupil", "orphan", "parent"]) await user(who);
  await member("lead", "TEACHER");
  await member("hindi", "TEACHER");
  await member("pupil", "STUDENT");
  await member("orphan", "STUDENT");

  const klass = await db.class.create({ data: { schoolId, name: "ZZ TA 7A", joinCode: `ZTR${SUFFIX}` }, select: { id: true } });
  ids.class = klass.id;
  await db.classTeacher.create({ data: { schoolId, classId: klass.id, teacherMembershipId: ids.leadM!, role: "LEAD" } });
  // The Hindi teacher takes 7A on the timetable only: no ClassTeacher row.
  const period = await db.timetablePeriod.create({ data: { schoolId, name: "ZZ P2", startMinute: 600, endMinute: 645, kind: "LESSON", position: 2 }, select: { id: true } });
  await db.timetableSlot.create({ data: { schoolId, classId: klass.id, periodId: period.id, weekday: 2, subject: "Hindi", teacherMembershipId: ids.hindiM! } });
  for (const who of ["pupil", "orphan"]) {
    await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: ids[`${who}M`]!, status: "ACTIVE" } });
  }
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.pupilM!, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" } });
  // The orphan's family is not on the app: the class teacher stands in.
  await db.guardianship.create({ data: { parentUserId: ids.lead!, studentMembershipId: ids.orphanM!, studentSchoolId: schoolId, relation: "SCHOOL", status: "ACTIVE" } });
});

afterAll(async () => {
  const users = Object.entries(ids).filter(([k]) => ["lead", "hindi", "pupil", "orphan", "parent"].includes(k)).map(([, v]) => v);
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  if (schoolId) {
    await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
    await db.auditLog.deleteMany({ where: { schoolId } });
    await db.school.deleteMany({ where: { id: schoolId } });
  }
  await db.user.deleteMany({ where: { email: { startsWith: "zz-ta-remarks-", endsWith: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-389: a teacher on the timetable is one a family can write to", () => {
  it("TA-389: the pupil's chooser lists the timetable's teacher beside the class teacher", async () => {
    const teachers = await teachersForStudent(schoolId, ids.pupilM!);
    expect(teachers.map((t) => t.membershipId).sort()).toEqual([ids.leadM!, ids.hindiM!].sort());
    const hindi = teachers.find((t) => t.membershipId === ids.hindiM);
    expect(hindi?.lead).toBe(false);
    expect(hindi?.classes).toEqual(["ZZ TA 7A · Hindi"]);
    // The class teacher still sorts first.
    expect(teachers[0]?.membershipId).toBe(ids.leadM);
  });

  it("TA-389: the pupil can open a thread with the timetable's teacher", async () => {
    const made = await createThread(ctx("pupil", "STUDENT"), { teacherMembershipId: ids.hindiM!, subject: "ZZ Hindi homework", body: "May I hand it in on Monday?" });
    expect(made.threadId).toBeTruthy();
  });

  it("TA-389: the guardian can open a thread with the timetable's teacher", async () => {
    const made = await createThread(ctx("parent", "PARENT", false), { studentMembershipId: ids.pupilM!, teacherMembershipId: ids.hindiM!, subject: "ZZ Hindi reader", body: "Which reader should we buy?" });
    expect(made.threadId).toBeTruthy();
  });
});

describe("TA-391: the school's stand-in is not the family", () => {
  it("TA-391: a pupil whose only guardianship is the stand-in has guardianCount 0; a pupil with a parent has 1", async () => {
    const students = await studentsForTeacher(schoolId, ids.hindiM!);
    const byId = new Map(students.map((s) => [s.membershipId, s.guardianCount]));
    expect(byId.get(ids.orphanM!)).toBe(0);
    expect(byId.get(ids.pupilM!)).toBe(1);
  });
});

describe("TA-559: the thread's lastMessageAt only moves forward", () => {
  it("TA-559: a reply whose update lands after a newer message's leaves the thread on the newer time", async () => {
    const { threadId } = await createThread(ctx("lead", "TEACHER"), { studentMembershipId: ids.pupilM!, subject: "ZZ Reading at home", body: "How is the reading going?" });
    // A newer reply has already been written and moved the thread (its time a minute ahead, as if this
    // reply's own update were the one that lost the race and committed second).
    const newer = new Date(Date.now() + 60_000);
    await db.remarkMessage.create({ data: { threadId, schoolId, authorUserId: ids.parent!, body: "ZZ the newer reply", readBy: "[]", createdAt: newer } });
    await db.remarkThread.update({ where: { id: threadId }, data: { lastMessageAt: newer } });

    await replyToThread(ctx("lead", "TEACHER"), { threadId, body: "Thank you." });
    const thread = await db.remarkThread.findUniqueOrThrow({ where: { id: threadId }, select: { lastMessageAt: true } });
    const newest = await db.remarkMessage.aggregate({ where: { threadId }, _max: { createdAt: true } });
    expect(thread.lastMessageAt.toISOString()).toBe(newest._max.createdAt!.toISOString());
  });

  it("TA-559: twenty rounds of two replies at once leave lastMessageAt on the newest message", async () => {
    const { threadId } = await createThread(ctx("lead", "TEACHER"), { studentMembershipId: ids.pupilM!, subject: "ZZ Two at once", body: "Start." });
    for (let i = 0; i < 20; i++) {
      await Promise.all([
        replyToThread(ctx("lead", "TEACHER"), { threadId, body: `ZZ teacher ${i}` }),
        replyToThread(ctx("parent", "PARENT", false), { threadId, body: `ZZ parent ${i}` }),
      ]);
      const thread = await db.remarkThread.findUniqueOrThrow({ where: { id: threadId }, select: { lastMessageAt: true } });
      const newest = await db.remarkMessage.aggregate({ where: { threadId }, _max: { createdAt: true } });
      expect(thread.lastMessageAt.toISOString(), `round ${i}`).toBe(newest._max.createdAt!.toISOString());
    }
  });
});

describe("TA-390: two presses of publish make one afternoon", () => {
  it("TA-390: two identical publishes at once leave count slots, not twice that", async () => {
    const startsAt = new Date(Date.now() + 7 * 86_400_000);
    startsAt.setUTCSeconds(0, 0);
    const input = { startsAt, durationMinutes: 15, count: 6 };
    const [a, b] = await Promise.all([publishSlots(ctx("lead", "TEACHER"), input), publishSlots(ctx("lead", "TEACHER"), input)]);
    expect(a.created + b.created).toBe(6);
    expect(await db.meetingSlot.count({ where: { schoolId, teacherMembershipId: ids.leadM!, cancelledAt: null } })).toBe(6);
  });
});
