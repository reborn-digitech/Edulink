import "server-only";
import { db } from "./db";
import { readJsonArray, writeJson } from "./json";
import { publish, channel } from "./realtime";
import { notify, notifyGuardians } from "./notify";
import { audit } from "./audit";
import { AccessError, assertRemarkAccess, assertStudentAccess } from "./tenancy";
import type { ActiveContext } from "./session";

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
  } else if (role === "ADMIN" && schoolId) {
    where = { schoolId };
  } else {
    // Parent: only threads about children they actively guard.
    const links = await db.guardianship.findMany({
      where: { parentUserId: user.id, status: "ACTIVE" },
      select: { studentMembershipId: true },
    });
    if (links.length === 0) return [];
    where = { studentMembershipId: { in: links.map((l) => l.studentMembershipId) } };
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

export async function createThread(
  session: ActiveContext,
  input: { studentMembershipId: string; subject: string; body: string },
): Promise<{ threadId: string }> {
  const { role, schoolId, membershipId } = session;
  if (role !== "TEACHER" || !schoolId || !membershipId) {
    throw new AccessError("Only a teacher can start a thread about a student.");
  }

  // Re-checks that this teacher actually teaches this student, not merely that
  // they share a school. (§6)
  await assertStudentAccess({ schoolId, membershipId, role }, input.studentMembershipId);

  // `$tenantTransaction`, not `db.$transaction`: the per-query extension does
  // not reach inside an interactive transaction, so the callback's client sets
  // no `app.school_ids` and every INSERT below is refused by the policy. This
  // form sets it once at the top and keeps the whole thing atomic.
  const thread = await db.$tenantTransaction(async (rawTx) => {
    const tx = rawTx as typeof db;
    const created = await tx.remarkThread.create({
      data: {
        schoolId,
        studentMembershipId: input.studentMembershipId,
        teacherMembershipId: membershipId,
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

  publish([channel.school(schoolId), channel.student(input.studentMembershipId)], {
    type: "remark.message",
    threadId: thread.id,
  });

  await notifyGuardians(input.studentMembershipId, (childName) => ({
    kind: "REMARK",
    schoolId,
    title: `New message about ${childName}`,
    body: input.subject,
    url: `/remarks/${thread.id}`,
  }));

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
  if (thread.closedAt) throw new AccessError("This conversation is closed.");

  const message = await db.remarkMessage.create({
    data: {
      threadId: thread.id,
      schoolId: thread.schoolId,
      authorUserId: session.user.id,
      body: input.body,
      readBy: writeJson([session.user.id]),
    },
  });

  await db.remarkThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: message.createdAt },
  });

  publish([channel.school(thread.schoolId), channel.student(thread.studentMembershipId)], {
    type: "remark.message",
    threadId: thread.id,
  });

  // Notify the other side, never the author. A teacher replying should not
  // ping themselves, and a parent replying should reach the teacher who owns
  // the thread rather than every guardian.
  const teacher = await db.membership.findUnique({
    where: { id: thread.teacherMembershipId },
    select: { userId: true },
  });

  if (teacher && teacher.userId !== session.user.id) {
    await notify({
      userId: teacher.userId,
      schoolId: thread.schoolId,
      kind: "REMARK",
      title: "New reply from a parent",
      body: thread.subject,
      url: `/remarks/${thread.id}`,
    });
  }

  const guardians = await db.guardianship.findMany({
    where: { studentMembershipId: thread.studentMembershipId, status: "ACTIVE" },
    select: { parentUserId: true },
  });

  await Promise.all(
    guardians
      .filter((g) => g.parentUserId !== session.user.id)
      .map((g) =>
        notify({
          userId: g.parentUserId,
          schoolId: thread.schoolId,
          kind: "REMARK",
          title: "New message from your child's teacher",
          body: thread.subject,
          url: `/remarks/${thread.id}`,
        }),
      ),
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
          class: { teachers: { some: { teacherMembershipId: membershipId } } },
        },
      },
    },
    include: {
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: { select: { name: true } } },
      },
      guardianships: { where: { status: "ACTIVE" }, select: { id: true } },
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
