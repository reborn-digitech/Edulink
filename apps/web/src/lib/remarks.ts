import "server-only";
import type { TranslationKey } from "./i18n/dictionary";
import { db } from "./db";
import { readJsonArray, writeJson } from "./json";
import { publish, channel } from "./realtime";
import { notify } from "./notify";
import { audit } from "./audit";
import { AccessError, assertRemarkAccess, assertStudentAccess, taughtClassWhere } from "./tenancy";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import { assertParentMaySee, parentMaySee, studentsGuardiansMaySee } from "./student-consent";

/**
 * Private teacher ↔ guardian threads about one student.
 *
 * Visibility is deliberately narrow: the teacher who owns the thread, admins of
 * that school, and the student's active guardians. Notably NOT other teachers
 * at the same school, and NOT the student themselves — a note saying "seemed
 * withdrawn today, worth a chat" is written on the understanding the child will
 * not read it.
 */

export type ThreadSummary = {
  id: string;
  subject: string;
  studentMembershipId: string;
  teacherMembershipId: string;
  studentName: string;
  studentAvatar: string | null;
  teacherName: string;
  teacherAvatar: string | null;
  lastMessageAt: Date;
  preview: string;
  unread: boolean;
  messageCount: number;
};

/** Threads the caller may see, newest activity first. */
export async function listThreads(session: ActiveContext): Promise<ThreadSummary[]> {
  const { role, schoolId, membershipId, user } = session;

  let where;
  if (role === "TEACHER" && schoolId && membershipId) {
    where = { schoolId, teacherMembershipId: membershipId };
  } else if ((role === "ADMIN" || role === "PRINCIPAL") && schoolId) {
    // The principal reads what the office reads. Left to the parent branch,
    // a principal was shown "your child's teachers" and a New message button
    // that could not work.
    where = { schoolId };
  } else if (role === "STUDENT" && schoolId && membershipId) {
    // Their own conversations, and only those. A pupil is one participant in a
    // room that also holds their teacher and their guardians.
    where = { schoolId, studentMembershipId: membershipId };
  } else {
    // Parent: only threads about children they actively guard.
    const links = await db.guardianship.findMany({
      where: { parentUserId: user.id, status: "ACTIVE" },
      select: { studentMembershipId: true },
    });
    // An adult college student's threads are theirs until they grant MESSAGES, as opening one is (TA-211).
    const open = await studentsGuardiansMaySee(links.map((l) => l.studentMembershipId), "MESSAGES");
    if (open.length === 0) return [];
    where = { studentMembershipId: { in: open } };
  }

  const threads = await db.remarkThread.findMany({
    where,
    include: {
      student: { include: { user: { select: { name: true, preferredName: true, avatarKey: true } } } },
      teacher: { include: { user: { select: { name: true, preferredName: true, avatarKey: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  return threads.map((thread) => {
    const latest = thread.messages[0];
    return {
      id: thread.id,
      subject: thread.subject,
      studentMembershipId: thread.studentMembershipId,
      teacherMembershipId: thread.teacherMembershipId,
      studentName: thread.student.user.preferredName ?? thread.student.user.name,
      studentAvatar: thread.student.user.avatarKey,
      teacherName: thread.teacher.user.preferredName ?? thread.teacher.user.name,
      teacherAvatar: thread.teacher.user.avatarKey,
      lastMessageAt: thread.lastMessageAt,
      preview: latest ? latest.body.slice(0, 140) : "",
      // Unread = there is a message the viewer has not been recorded against
      // and did not write themselves.
      unread: Boolean(
        latest &&
          latest.authorUserId !== user.id &&
          !readJsonArray<string>(latest.readBy).includes(user.id),
      ),
      messageCount: thread._count.messages,
    };
  });
}

export async function getThread(session: ActiveContext, threadId: string) {
  const thread = await assertRemarkAccess(session, threadId);

  const messages = await db.remarkMessage.findMany({
    where: { threadId },
    include: { author: { select: { id: true, name: true, preferredName: true, avatarKey: true } } },
    orderBy: { createdAt: "asc" },
  });

  // A message author is a user; a profile is a membership. One lookup at the
  // thread's school, so each name in the room can be a door (a guardian,
  // who has no membership, stays a name).
  const authorIds = [...new Set(messages.map((m) => m.author.id))];
  const memberships = await db.membership.findMany({
    where: { schoolId: thread.schoolId, userId: { in: authorIds }, status: "ACTIVE", leftAt: null },
    select: { id: true, userId: true },
  });
  const membershipByUser = new Map(memberships.map((m) => [m.userId, m.id]));

  return {
    id: thread.id,
    subject: thread.subject,
    schoolId: thread.schoolId,
    closedAt: thread.closedAt,
    student: {
      membershipId: thread.studentMembershipId,
      name: thread.student.user.preferredName ?? thread.student.user.name,
      fullName: thread.student.user.name,
      avatarKey: thread.student.user.avatarKey,
    },
    teacher: {
      membershipId: thread.teacherMembershipId,
      name: thread.teacher.user.name,
      avatarKey: thread.teacher.user.avatarKey,
    },
    messages: messages.map((message) => {
      const readBy = readJsonArray<string>(message.readBy);
      return {
        id: message.id,
        body: message.body,
        createdAt: message.createdAt,
        authorId: message.author.id,
        authorMembershipId: membershipByUser.get(message.author.id) ?? null,
        authorName: message.author.preferredName ?? message.author.name,
        authorAvatar: message.author.avatarKey,
        mine: message.author.id === session.user.id,
        readBy,
        // The author is recorded in readBy the moment they send, so a naive
        // `readBy.length > 0` shows "Read" against your own message instantly —
        // telling a parent the teacher has seen a message nobody has opened.
        readByOthers: readBy.some((id) => id !== message.author.id),
      };
    }),
  };
}

/**
 * Records that the viewer has seen everything currently in the thread.
 *
 * Stored as a userId list per message rather than a per-thread "lastReadAt"
 * because two guardians may read at different times and each needs their own
 * state — a single timestamp would let one parent's read mark the thread read
 * for the other.
 */
export async function markThreadRead(session: ActiveContext, threadId: string): Promise<void> {
  await assertRemarkAccess(session, threadId);

  const messages = await db.remarkMessage.findMany({
    where: { threadId },
    select: { id: true, readBy: true, authorUserId: true },
  });

  const updates = messages
    .filter(
      (message) =>
        message.authorUserId !== session.user.id &&
        !readJsonArray<string>(message.readBy).includes(session.user.id),
    )
    .map((message) =>
      db.remarkMessage.update({
        where: { id: message.id },
        data: {
          readBy: writeJson([...readJsonArray<string>(message.readBy), session.user.id]),
        },
      }),
    );

  if (updates.length > 0) await Promise.all(updates);
}

/**
 * Does this teacher teach this pupil?
 *
 * ONE JOIN, ASKED FROM BOTH ENDS. `assertStudentAccess` asks it for a teacher
 * naming a pupil; a pupil naming a teacher and a guardian naming their child's
 * teacher need the same answer, and writing it three times is how the third
 * copy ends up meaning "share a school".
 *
 * Shared classes, ACTIVE on both sides. A teacher who has left the class and a
 * pupil who has left the roll are both correctly no longer connected — which is
 * what stops a conversation being opened with somebody's last-year teacher.
 *
 * TEACHES BY THE SAME LINE FROM BOTH ENDS (TA-389): a school's TEACHER who
 * takes the class only on the timetable passes the teacher's own check
 * (taughtClassWhere), so the pupil and the guardian reach them by it too.
 */
async function teacherTeaches(
  schoolId: string,
  teacherMembershipId: string,
  studentMembershipId: string,
): Promise<boolean> {
  const teacher = await db.membership.findFirst({ where: { id: teacherMembershipId, schoolId }, select: { role: true } });
  if (!teacher) return false;
  const shared = await db.enrollment.count({
    where: {
      schoolId,
      studentMembershipId,
      status: "ACTIVE",
      class: taughtClassWhere(teacher.role as Role, teacherMembershipId),
    },
  });
  return shared > 0;
}

/**
 * Tells everybody in the room except whoever just spoke.
 *
 * THE ROOM IS THREE-SIDED NOW, so "notify the other side" no longer means
 * anything — a message from a parent has two other sides, and a message from a
 * child has two more. Working the participants out from the thread rather than
 * from the author's role is what stops the pupil being the one nobody tells,
 * which is precisely the bug the old two-branch version would have grown.
 */
async function notifyParticipants(
  thread: {
    schoolId: string;
    studentMembershipId: string;
    teacherMembershipId: string;
    threadId: string;
  },
  authorUserId: string,
  subject: string,
): Promise<void> {
  const [teacher, student, guardians] = await Promise.all([
    db.membership.findUnique({
      where: { id: thread.teacherMembershipId },
      select: { userId: true },
    }),
    db.membership.findUnique({
      where: { id: thread.studentMembershipId },
      select: { userId: true, user: { select: { name: true, preferredName: true } } },
    }),
    db.guardianship.findMany({
      where: { studentMembershipId: thread.studentMembershipId, status: "ACTIVE" },
      select: { parentUserId: true },
    }),
  ]);

  const childName = student?.user.preferredName ?? student?.user.name ?? "your child";
  const url = `/remarks/${thread.threadId}`;

  const targets: { userId: string; titleKey: TranslationKey; titleVars?: Record<string, string> }[] = [];
  if (teacher) targets.push({ userId: teacher.userId, titleKey: "notifTitle.newMessageAbout", titleVars: { name: childName } });
  // The child is told in the second person; everybody else is told about them.
  if (student) targets.push({ userId: student.userId, titleKey: "notifTitle.newMessageFromSchool" });
  // The guardians only while an adult college student lets them see messages (TA-211).
  const guardiansMay = guardians.length > 0 && (await parentMaySee(thread.studentMembershipId, "MESSAGES"));
  for (const guardian of guardiansMay ? guardians : []) {
    targets.push({ userId: guardian.parentUserId, titleKey: "notifTitle.newMessageAbout", titleVars: { name: childName } });
  }

  await Promise.all(
    targets
      .filter((target) => target.userId !== authorUserId)
      .map((target) =>
        notify({
          userId: target.userId,
          schoolId: thread.schoolId,
          kind: "REMARK",
          titleKey: target.titleKey,
          titleVars: target.titleVars,
          body: subject,
          url,
        }),
      ),
  );
}

/**
 * Starts a conversation between a teacher, a pupil and that pupil's guardians.
 *
 * THREE PEOPLE CAN OPEN THE SAME ROOM, and until now only one could. A teacher
 * could start a thread; a parent with a question had no way to ask it, and a
 * child had no way to reach their teacher at all. The thread that results is
 * identical whoever opened it — same participants, same visibility — because
 * who happened to speak first is not a property worth modelling.
 *
 * ONE THREAD PER PAIR IS NOT ENFORCED, deliberately. A subject line is how a
 * school separates "missed homework" from "hospital appointment", and collapsing
 * every exchange with one teacher into a single unbounded scroll is how the
 * second one gets lost under the first.
 *
 * EACH STARTER PROVES A DIFFERENT THING, and that is the whole of the guard
 * below: a teacher proves they teach this child, a guardian proves they are
 * this child's guardian, and a pupil proves the teacher teaches them. None of
 * the three can name a pair they have nothing to do with.
 */
export async function createThread(
  session: ActiveContext,
  input: { studentMembershipId?: string; teacherMembershipId?: string; subject: string; body: string },
): Promise<{ threadId: string }> {
  const { role } = session;
  // A guardian's session carries no school — the child's membership does.
  // Every other role names one or is refused.
  let schoolId = session.schoolId;
  if (!schoolId && role !== "PARENT") throw new AccessError("access.noSchoolInContext");

  let studentMembershipId: string;
  let teacherMembershipId: string;

  if (role === "TEACHER" && session.membershipId && schoolId) {
    if (!input.studentMembershipId) throw new AccessError("access.chooseAPupil");
    // Re-checks that this teacher actually teaches this student, not merely that
    // they share a school. (§6)
    await assertStudentAccess(
      { schoolId, membershipId: session.membershipId, role },
      input.studentMembershipId,
    );
    studentMembershipId = input.studentMembershipId;
    teacherMembershipId = session.membershipId;
  } else if (role === "STUDENT" && session.membershipId && schoolId) {
    if (!input.teacherMembershipId) throw new AccessError("access.chooseATeacher");
    // The pupil proves the teacher teaches them, by the same join the teacher's
    // own check runs in the other direction.
    const teaches = await teacherTeaches(schoolId, input.teacherMembershipId, session.membershipId);
    if (!teaches) throw new AccessError("access.thatTeacherDoesNotTeachYou", "NOT_FOUND");
    studentMembershipId = session.membershipId;
    teacherMembershipId = input.teacherMembershipId;
  } else if (role === "PARENT") {
    if (!input.studentMembershipId || !input.teacherMembershipId) {
      throw new AccessError("access.chooseYourChildAndATeacher");
    }
    const guardian = await db.guardianship.findFirst({
      where: {
        parentUserId: session.user.id,
        studentMembershipId: input.studentMembershipId,
        status: "ACTIVE",
      },
      select: { id: true, studentSchoolId: true },
    });
    if (!guardian) throw new AccessError("access.thatIsNotYourChild", "NOT_FOUND");
    // An adult at a college decides whether their guardian is in the room (MESSAGES), here as on the thread's own
    // read (assertRemarkAccess): a guardian kept out could otherwise open a thread they would then be refused, its
    // first message telling the student and the teacher (owner's item 14, 1 Nov 2026). 403 consent.refuseNotGranted,
    // as every family door answers a grant that is off.
    await assertParentMaySee(input.studentMembershipId, "MESSAGES");
    schoolId = guardian.studentSchoolId;
    const teaches = await teacherTeaches(
      schoolId,
      input.teacherMembershipId,
      input.studentMembershipId,
    );
    if (!teaches) throw new AccessError("access.thatTeacherDoesNotTeachYourChild", "NOT_FOUND");
    studentMembershipId = input.studentMembershipId;
    teacherMembershipId = input.teacherMembershipId;
  } else {
    throw new AccessError("access.onlyATeacherAPupilOrTheir");
  }
  if (!schoolId) throw new AccessError("access.noSchoolInContext");
  const threadSchoolId: string = schoolId;

  // `$tenantTransaction`, not `db.$transaction`: the per-query extension does
  // not reach inside an interactive transaction, so the callback's client sets
  // no `app.school_ids` and every INSERT below is refused by the policy. This
  // form sets it once at the top and keeps the whole thing atomic.
  const thread = await db.$tenantTransaction(async (rawTx) => {
    const tx = rawTx as typeof db;
    const created = await tx.remarkThread.create({
      data: {
        schoolId: threadSchoolId,
        studentMembershipId,
        teacherMembershipId,
        subject: input.subject,
      },
    });

    await tx.remarkMessage.create({
      data: {
        threadId: created.id,
        // From the thread, not the session — the denormalised column is only
        // worth having if it provably equals its parent's.
        schoolId: created.schoolId,
        authorUserId: session.user.id,
        body: input.body,
        readBy: writeJson([session.user.id]),
      },
    });

    return created;
  });

  publish([channel.school(schoolId), channel.student(studentMembershipId), channel.staff(teacherMembershipId)], {
    type: "remark.message",
    threadId: thread.id,
  });

  // Everybody in the room except whoever just spoke.
  await notifyParticipants(
    { schoolId, studentMembershipId, teacherMembershipId, threadId: thread.id },
    session.user.id,
    input.subject,
  );

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "remark.create",
    targetType: "RemarkThread",
    targetId: thread.id,
  });

  return { threadId: thread.id };
}

export async function replyToThread(
  session: ActiveContext,
  input: { threadId: string; body: string },
): Promise<{ messageId: string }> {
  const thread = await assertRemarkAccess(session, input.threadId);
  if (thread.closedAt) throw new AccessError("access.thisConversationIsClosed");

  const message = await db.remarkMessage.create({
    data: {
      threadId: thread.id,
      schoolId: thread.schoolId,
      authorUserId: session.user.id,
      body: input.body,
      readBy: writeJson([session.user.id]),
    },
  });

  // Forward only (TA-559): of two replies landing together, the older one's update may commit second, and
  // an unconditional write would leave the thread sorted on the older message until the next reply.
  await db.remarkThread.updateMany({
    where: { id: thread.id, lastMessageAt: { lt: message.createdAt } },
    data: { lastMessageAt: message.createdAt },
  });

  publish([channel.school(thread.schoolId), channel.student(thread.studentMembershipId), channel.staff(thread.teacherMembershipId)], {
    type: "remark.message",
    threadId: thread.id,
  });

  /**
   * EVERYBODY IN THE ROOM EXCEPT THE AUTHOR.
   *
   * This used to notify "the other side", which assumed two of them — the
   * teacher, and the guardians — and hard-coded the titles to match ("New reply
   * from a parent", "New message from your child's teacher"). Both were wrong
   * the moment the pupil joined their own conversation: a child's message told
   * the guardians it came from a teacher, and nothing at all reached the child.
   *
   * Working the recipients out from the THREAD rather than from the author's
   * role is what stops that class of bug returning the next time somebody is
   * added to the room.
   */
  await notifyParticipants(
    {
      schoolId: thread.schoolId,
      studentMembershipId: thread.studentMembershipId,
      teacherMembershipId: thread.teacherMembershipId,
      threadId: thread.id,
    },
    session.user.id,
    thread.subject,
  );

  return { messageId: message.id };
}

/** Students a teacher may start a thread about. */
export async function studentsForTeacher(schoolId: string, membershipId: string) {
  const students = await db.membership.findMany({
    where: {
      schoolId,
      role: "STUDENT",
      status: "ACTIVE",
      enrollments: {
        some: {
          status: "ACTIVE",
          // The pupils of the classes this teacher teaches, the timetable's included: the same line
          // assertStudentAccess draws when the thread is opened (owner's item 1, 27 Oct 2026).
          class: taughtClassWhere("TEACHER", membershipId),
        },
      },
    },
    include: {
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { select: { name: true } } },
      },
      // The family's own: the school's stand-in (relation SCHOOL) is the class teacher or an admin, not
      // somebody a message to the family reaches, so it does not hide the warning (TA-391).
      guardianships: { where: { status: "ACTIVE", relation: { not: "SCHOOL" } }, select: { id: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return students.map((student) => ({
    membershipId: student.id,
    name: student.user.preferredName ?? student.user.name,
    fullName: student.user.name,
    avatarKey: student.user.avatarKey,
    className: student.enrollments[0]?.class.name ?? "",
    // Surfaced so a teacher knows a message will reach nobody before writing it.
    guardianCount: student.guardianships.length,
  }));
}

/**
 * Teachers a pupil — or their guardian — may start a conversation with.
 *
 * The mirror of `studentsForTeacher`, and it has to exist for the same reason
 * that one does: a chooser built from "everybody at the school" would let a
 * child message a teacher who has never taught them, and the guard in
 * `createThread` would then refuse it after they had typed the message.
 *
 * ONE ROW PER TEACHER, with the classes they teach this child rolled up.
 * Somebody who takes them for two subjects is one person to talk to, and
 * showing them twice makes a chooser look broken.
 */
export async function teachersForStudent(schoolId: string, studentMembershipId: string) {
  const enrolments = await db.enrollment.findMany({
    where: { schoolId, studentMembershipId, status: "ACTIVE" },
    select: {
      class: {
        select: {
          name: true,
          subject: true,
          teachers: {
            select: {
              teacherMembershipId: true,
              role: true,
              teacher: {
                select: {
                  title: true,
                  user: { select: { name: true, preferredName: true, avatarKey: true } },
                },
              },
            },
          },
          // A school's TEACHER who takes the class on the timetable teaches its pupils too (TA-389), as
          // teacherTeaches and the teacher's own side (taughtClassWhere) say; a college's faculty do not.
          timetableSlots: {
            where: { teacherMembershipId: { not: null }, teacher: { role: "TEACHER" } },
            select: {
              subject: true,
              teacherMembershipId: true,
              teacher: {
                select: {
                  title: true,
                  user: { select: { name: true, preferredName: true, avatarKey: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const byTeacher = new Map<
    string,
    { membershipId: string; name: string; title: string | null; avatarKey: string | null; classes: string[]; lead: boolean }
  >();

  for (const enrolment of enrolments) {
    for (const link of enrolment.class.teachers) {
      const existing = byTeacher.get(link.teacherMembershipId);
      const className = enrolment.class.subject
        ? `${enrolment.class.name} · ${enrolment.class.subject}`
        : enrolment.class.name;
      if (existing) {
        if (!existing.classes.includes(className)) existing.classes.push(className);
        // LEAD wins if any of their classes makes them the class teacher — that
        // is the person a family asks for first, and it should sort to the top.
        existing.lead = existing.lead || link.role === "LEAD";
        continue;
      }
      byTeacher.set(link.teacherMembershipId, {
        membershipId: link.teacherMembershipId,
        name: link.teacher.user.preferredName ?? link.teacher.user.name,
        title: link.teacher.title,
        avatarKey: link.teacher.user.avatarKey,
        classes: [className],
        lead: link.role === "LEAD",
      });
    }
    for (const slot of enrolment.class.timetableSlots) {
      if (!slot.teacherMembershipId || !slot.teacher) continue;
      const className = `${enrolment.class.name} · ${slot.subject.trim()}`;
      const existing = byTeacher.get(slot.teacherMembershipId);
      if (existing) {
        // One of the class's own keeps the class's label; another subject of the timetable is one more line.
        const ownOfClass = enrolment.class.teachers.some((link) => link.teacherMembershipId === slot.teacherMembershipId);
        if (!ownOfClass && !existing.classes.includes(className)) existing.classes.push(className);
        continue;
      }
      byTeacher.set(slot.teacherMembershipId, {
        membershipId: slot.teacherMembershipId,
        name: slot.teacher.user.preferredName ?? slot.teacher.user.name,
        title: slot.teacher.title,
        avatarKey: slot.teacher.user.avatarKey,
        classes: [className],
        lead: false,
      });
    }
  }

  return [...byTeacher.values()].sort(
    (a, b) => Number(b.lead) - Number(a.lead) || a.name.localeCompare(b.name),
  );
}
