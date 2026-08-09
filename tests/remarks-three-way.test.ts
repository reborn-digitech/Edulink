import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createThread,
  getThread,
  listThreads,
  replyToThread,
  teachersForStudent,
} from "@/lib/remarks";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * One room, three people: a teacher, the pupil, and the pupil's guardians.
 *
 * WHY ONE ROOM AND NOT THREE CHANNELS. The obvious build is teacher↔parent,
 * teacher↔pupil and parent↔pupil, and it is wrong twice. It splits one
 * conversation into three places where the same thing gets said differently,
 * and — the reason that matters — a teacher↔pupil channel with nobody else in
 * it is exactly the shape safeguarding policy exists to prevent.
 *
 * A RemarkThread was ALREADY keyed on (student, teacher) and already readable
 * by that child's guardians. The room was the right shape and the child was
 * standing outside it. So this is mostly about letting them in, and about the
 * two people who could not previously open the door at all.
 *
 * THE TESTS THAT MATTER are the ones about who may open a room with whom. Each
 * of the three starters proves a different thing, and none of them can name a
 * pair they have nothing to do with.
 */

const db = new PrismaClient();

const SUFFIX = "@zzchat.test";
const SLUG = "zz-chat-school";

let schoolId: string;
let classId: string;
let otherClassId: string;

let teacher: ActiveContext;
let otherTeacher: ActiveContext;
let pupil: ActiveContext;
let classmate: ActiveContext;
let parent: ActiveContext;
let strangerParent: ActiveContext;

let teacherMembershipId: string;
let otherTeacherMembershipId: string;
let pupilMembershipId: string;
let classmateMembershipId: string;

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
}

async function member(email: string, name: string, role: string) {
  const user = await db.user.upsert({
    where: { email },
    create: { email, name, preferredName: name.split(" ")[0], prefs: "{}" },
    update: {},
  });
  const membership = await db.membership.upsert({
    where: { userId_schoolId_role: { userId: user.id, schoolId, role } },
    create: { userId: user.id, schoolId, role, status: "ACTIVE" },
    update: { status: "ACTIVE", leftAt: null },
  });
  return { userId: user.id, membershipId: membership.id };
}

beforeAll(async () => {
  const school = await db.school.upsert({
    where: { slug: SLUG },
    create: { name: "ZZ Chat School", slug: SLUG, code: "ZZCHAT", contactEmail: `o${SUFFIX}` },
    update: {},
  });
  schoolId = school.id;

  classId = (
    await db.class.upsert({
      where: { joinCode: "ZZZ-CHAT-A" },
      create: { schoolId, name: "ZZ Chat 5A", subject: "Maths", joinCode: "ZZZ-CHAT-A" },
      update: {},
    })
  ).id;
  otherClassId = (
    await db.class.upsert({
      where: { joinCode: "ZZZ-CHAT-B" },
      create: { schoolId, name: "ZZ Chat 6B", joinCode: "ZZZ-CHAT-B" },
      update: {},
    })
  ).id;

  const t = await member(`teacher${SUFFIX}`, "Tomas Teacher", "TEACHER");
  const t2 = await member(`teacher2${SUFFIX}`, "Other Teacher", "TEACHER");
  const p = await member(`pupil${SUFFIX}`, "Asha Pupil", "STUDENT");
  const c = await member(`classmate${SUFFIX}`, "Ben Classmate", "STUDENT");
  teacherMembershipId = t.membershipId;
  otherTeacherMembershipId = t2.membershipId;
  pupilMembershipId = p.membershipId;
  classmateMembershipId = c.membershipId;

  // Tomas teaches 5A; the other teacher teaches 6B. Asha and Ben are both in 5A.
  await db.classTeacher.upsert({
    where: { classId_teacherMembershipId: { classId, teacherMembershipId } },
    create: { classId, schoolId, teacherMembershipId, role: "LEAD" },
    update: {},
  });
  await db.classTeacher.upsert({
    where: {
      classId_teacherMembershipId: {
        classId: otherClassId,
        teacherMembershipId: otherTeacherMembershipId,
      },
    },
    create: {
      classId: otherClassId,
      schoolId,
      teacherMembershipId: otherTeacherMembershipId,
      role: "LEAD",
    },
    update: {},
  });
  for (const studentMembershipId of [pupilMembershipId, classmateMembershipId]) {
    await db.enrollment.upsert({
      where: { classId_studentMembershipId: { classId, studentMembershipId } },
      create: { classId, schoolId, studentMembershipId, status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });
  }

  const parentUser = await db.user.upsert({
    where: { email: `parent${SUFFIX}` },
    create: { email: `parent${SUFFIX}`, name: "Ravi Parent", prefs: "{}" },
    update: {},
  });
  await db.guardianship.upsert({
    where: {
      parentUserId_studentMembershipId: {
        parentUserId: parentUser.id,
        studentMembershipId: pupilMembershipId,
      },
    },
    create: {
      parentUserId: parentUser.id,
      studentMembershipId: pupilMembershipId,
      studentSchoolId: schoolId,
      relation: "PARENT",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });

  const strangerUser = await db.user.upsert({
    where: { email: `stranger${SUFFIX}` },
    create: { email: `stranger${SUFFIX}`, name: "Not Their Parent", prefs: "{}" },
    update: {},
  });
  await db.guardianship.upsert({
    where: {
      parentUserId_studentMembershipId: {
        parentUserId: strangerUser.id,
        studentMembershipId: classmateMembershipId,
      },
    },
    create: {
      parentUserId: strangerUser.id,
      studentMembershipId: classmateMembershipId,
      studentSchoolId: schoolId,
      relation: "PARENT",
      status: "ACTIVE",
    },
    update: { status: "ACTIVE" },
  });

  teacher = ctx({ userId: t.userId, membershipId: t.membershipId, schoolId, role: "TEACHER" });
  otherTeacher = ctx({
    userId: t2.userId,
    membershipId: t2.membershipId,
    schoolId,
    role: "TEACHER",
  });
  pupil = ctx({ userId: p.userId, membershipId: p.membershipId, schoolId, role: "STUDENT" });
  classmate = ctx({ userId: c.userId, membershipId: c.membershipId, schoolId, role: "STUDENT" });
  parent = ctx({ userId: parentUser.id, schoolId, role: "PARENT" });
  strangerParent = ctx({ userId: strangerUser.id, schoolId, role: "PARENT" });
});

afterEach(async () => {
  await db.remarkThread.deleteMany({ where: { schoolId } });
  await db.notification.deleteMany({ where: { schoolId } });
});

afterAll(async () => {
  await db.remarkThread.deleteMany({ where: { schoolId } });
  await db.school.deleteMany({ where: { slug: SLUG } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });
  await db.$disconnect();
});

const BODY = "Could we talk about this week's homework?";

/* -------------------------------------------------------------------------- */

describe("⚠ who can open a room, and with whom", () => {
  it("a teacher opens one about a pupil they teach", async () => {
    const { threadId } = await createThread(teacher, {
      studentMembershipId: pupilMembershipId,
      subject: "Homework",
      body: BODY,
    });
    const thread = await getThread(teacher, threadId);
    expect(thread.student.membershipId).toBe(pupilMembershipId);
    expect(thread.teacher.membershipId).toBe(teacherMembershipId);
  });

  it("⚠ a PUPIL opens one with a teacher who teaches them", async () => {
    // A child had no way to reach their teacher at all before this.
    const { threadId } = await createThread(pupil, {
      teacherMembershipId,
      subject: "I am stuck",
      body: BODY,
    });
    const thread = await getThread(pupil, threadId);
    expect(thread.teacher.membershipId).toBe(teacherMembershipId);
    expect(thread.student.membershipId).toBe(pupilMembershipId);
  });

  it("⚠ a GUARDIAN opens one with their child's teacher", async () => {
    // A parent with a question previously had to wait to be messaged first.
    const { threadId } = await createThread(parent, {
      studentMembershipId: pupilMembershipId,
      teacherMembershipId,
      subject: "Absence next week",
      body: BODY,
    });
    const thread = await getThread(parent, threadId);
    expect(thread.student.membershipId).toBe(pupilMembershipId);
  });

  it("⚠ a pupil cannot open one with a teacher who does not teach them", async () => {
    await expect(
      createThread(pupil, {
        teacherMembershipId: otherTeacherMembershipId,
        subject: "Hello",
        body: BODY,
      }),
    ).rejects.toBeInstanceOf(AccessError);
    expect(await db.remarkThread.count({ where: { schoolId } })).toBe(0);
  });

  it("⚠ a guardian cannot open one about a child who is not theirs", async () => {
    await expect(
      createThread(strangerParent, {
        studentMembershipId: pupilMembershipId,
        teacherMembershipId,
        subject: "Hello",
        body: BODY,
      }),
    ).rejects.toBeInstanceOf(AccessError);
    expect(await db.remarkThread.count({ where: { schoolId } })).toBe(0);
  });

  it("⚠ a guardian cannot pair their own child with a teacher who does not teach them", async () => {
    // Both halves of the parent's claim are checked, not just the first.
    await expect(
      createThread(parent, {
        studentMembershipId: pupilMembershipId,
        teacherMembershipId: otherTeacherMembershipId,
        subject: "Hello",
        body: BODY,
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ a teacher cannot open one about a pupil they do not teach", async () => {
    await expect(
      createThread(otherTeacher, {
        studentMembershipId: pupilMembershipId,
        subject: "Hello",
        body: BODY,
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});

describe("⚠ the room holds all three, whoever opened it", () => {
  it("⚠ the pupil can read a thread their teacher started about them", async () => {
    const { threadId } = await createThread(teacher, {
      studentMembershipId: pupilMembershipId,
      subject: "Homework",
      body: BODY,
    });

    // THE CHANGE THIS FEATURE IS. The room was already keyed on this child and
    // already readable by their guardians; the child was the one participant
    // standing outside their own conversation.
    const asPupil = await getThread(pupil, threadId);
    expect(asPupil.messages).toHaveLength(1);

    const asParent = await getThread(parent, threadId);
    expect(asParent.messages).toHaveLength(1);
  });

  it("⚠ a classmate cannot read it, and neither can another family", async () => {
    const { threadId } = await createThread(teacher, {
      studentMembershipId: pupilMembershipId,
      subject: "Homework",
      body: BODY,
    });

    await expect(getThread(classmate, threadId)).rejects.toBeInstanceOf(AccessError);
    await expect(getThread(strangerParent, threadId)).rejects.toBeInstanceOf(AccessError);
    await expect(getThread(otherTeacher, threadId)).rejects.toBeInstanceOf(AccessError);
  });

  it("⚠ all three can reply, and it is the same thread", async () => {
    const { threadId } = await createThread(pupil, {
      teacherMembershipId,
      subject: "I am stuck",
      body: BODY,
    });
    await replyToThread(teacher, { threadId, body: "Come and find me at break." });
    await replyToThread(parent, { threadId, body: "Thank you." });

    const thread = await getThread(pupil, threadId);
    expect(thread.messages).toHaveLength(3);
    expect(thread.messages.map((m) => m.authorName)).toEqual(["Asha", "Tomas", "Ravi Parent"]);
  });

  it("shows the pupil their own threads and nobody else's", async () => {
    await createThread(teacher, {
      studentMembershipId: pupilMembershipId,
      subject: "Homework",
      body: BODY,
    });
    await createThread(teacher, {
      studentMembershipId: classmateMembershipId,
      subject: "Something else",
      body: BODY,
    });

    const mine = await listThreads(pupil);
    expect(mine.map((t) => t.subject)).toEqual(["Homework"]);
    // The teacher owns both.
    expect((await listThreads(teacher)).length).toBe(2);
  });
});

describe("⚠ everybody in the room is told", () => {
  it("⚠ a pupil's message reaches the teacher AND the guardians", async () => {
    const { threadId } = await createThread(pupil, {
      teacherMembershipId,
      subject: "I am stuck",
      body: BODY,
    });

    const notified = await db.notification.findMany({
      where: { schoolId, kind: "REMARK" },
      select: { userId: true },
    });
    const ids = notified.map((n) => n.userId).sort();
    expect(ids).toEqual([teacher.user.id, parent.user.id].sort());
    // Never the author.
    expect(ids).not.toContain(pupil.user.id);
    expect(threadId).toBeTruthy();
  });

  it("⚠ a teacher's message reaches the PUPIL as well as the guardians", async () => {
    /**
     * THE BUG THE OLD CODE WOULD HAVE GROWN. `replyToThread` notified "the
     * other side", which assumed two of them — the teacher and the guardians —
     * so the one person the message was actually for got nothing.
     */
    await createThread(teacher, {
      studentMembershipId: pupilMembershipId,
      subject: "Homework",
      body: BODY,
    });

    const ids = (
      await db.notification.findMany({ where: { schoolId, kind: "REMARK" }, select: { userId: true } })
    )
      .map((n) => n.userId)
      .sort();
    expect(ids).toEqual([pupil.user.id, parent.user.id].sort());
  });

  it("⚠ a guardian's reply reaches the teacher and the pupil", async () => {
    const { threadId } = await createThread(teacher, {
      studentMembershipId: pupilMembershipId,
      subject: "Homework",
      body: BODY,
    });
    await db.notification.deleteMany({ where: { schoolId } });

    await replyToThread(parent, { threadId, body: "Thank you." });

    const ids = (
      await db.notification.findMany({ where: { schoolId, kind: "REMARK" }, select: { userId: true } })
    )
      .map((n) => n.userId)
      .sort();
    expect(ids).toEqual([teacher.user.id, pupil.user.id].sort());
  });
});

describe("the teacher chooser a pupil sees", () => {
  it("⚠ lists only teachers who actually teach them", async () => {
    const teachers = await teachersForStudent(schoolId, pupilMembershipId);
    expect(teachers.map((t) => t.membershipId)).toEqual([teacherMembershipId]);
    expect(teachers[0]!.classes).toEqual(["ZZ Chat 5A · Maths"]);
    expect(teachers[0]!.lead).toBe(true);
  });

  it("⚠ shows a teacher once even when they take two of your classes", async () => {
    // Somebody who takes you for two subjects is one person to talk to, and
    // showing them twice makes the chooser look broken.
    await db.enrollment.upsert({
      where: {
        classId_studentMembershipId: {
          classId: otherClassId,
          studentMembershipId: pupilMembershipId,
        },
      },
      create: {
        classId: otherClassId,
        schoolId,
        studentMembershipId: pupilMembershipId,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE" },
    });
    await db.classTeacher.upsert({
      where: {
        classId_teacherMembershipId: { classId: otherClassId, teacherMembershipId },
      },
      create: { classId: otherClassId, schoolId, teacherMembershipId, role: "ASSISTANT" },
      update: {},
    });

    try {
      const teachers = await teachersForStudent(schoolId, pupilMembershipId);
      const tomas = teachers.filter((t) => t.membershipId === teacherMembershipId);
      expect(tomas).toHaveLength(1);
      expect(tomas[0]!.classes.sort()).toEqual(["ZZ Chat 5A · Maths", "ZZ Chat 6B"]);
      // LEAD anywhere still sorts them to the top — that is the person a family
      // asks for first.
      expect(tomas[0]!.lead).toBe(true);
    } finally {
      await db.classTeacher.deleteMany({
        where: { classId: otherClassId, teacherMembershipId },
      });
      await db.enrollment.deleteMany({
        where: { classId: otherClassId, studentMembershipId: pupilMembershipId },
      });
    }
  });
});
