import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { notify, notifyGuardians } from "./notify";
import { readJsonArray } from "./json";
import { studentsForTeacher } from "./remarks";
import type { ActiveContext } from "./session";

/**
 * Mentoring — one expert mentoring one child.
 *
 * THIS IS THE HIGHEST-RISK SURFACE IN THE APP, because it is the only one where
 * an adult from outside the school talks to a child. Three rules carry it, and
 * all three are structural rather than configurable.
 *
 * 1. THE THREAD IS NEVER PRIVATE. `readerOf` below returns the set of people who
 *    may read a mentorship, and it ALWAYS contains the child's guardians and the
 *    school's admins alongside the expert and the child. There is no flag to
 *    turn that off and no "confidential" mode to add later — a private channel
 *    between an outside adult and a child is the thing this feature must not be
 *    able to become.
 *
 * 2. ONLY SCHOOL STAFF MAY PAIR. Not the expert, who would otherwise choose
 *    their own mentee; not the child, who cannot meaningfully consent to a
 *    stranger. The staff member who did it is recorded on the row.
 *
 * 3. PARENT CONSENT GATES THE FIRST MESSAGE. Until a guardian says yes the
 *    thread is PENDING_CONSENT and `postMentorMessage` refuses everybody,
 *    including the expert. It is also the state in which the expert has no
 *    tenant access to the school at all — `tenant-request.ts` counts only ACTIVE
 *    mentorships — so this is enforced by the database and not only by this file.
 *
 * Closing a mentorship removes the expert's access on the next request, because
 * the tenant set is recomputed per request rather than granted.
 */

export type MentorSummary = {
  id: string;
  status: string;
  purpose: string;
  studentName: string;
  expertName: string;
  schoolName: string;
  awaitingConsent: boolean;
  unread: number;
};

/** Who may read a mentorship. The guardians and admins are never optional. */
async function readerOf(session: ActiveContext, threadId: string) {
  // SCALARS ONLY on the first read, and this is not a micro-optimisation.
  //
  // MentorThread is readable by an expert through `app.user_id` before any
  // school is bound — that is the bootstrap that lets their tenant set be
  // computed at all. The RELATIONS are not: School and Membership are behind the
  // tenant predicate, so a PENDING or CLOSED mentorship (neither of which grants
  // tenant access) came back with `school: null` and Prisma threw
  // "Field school is required", which surfaced as a 500. A thread somebody may
  // not fully see has to fail CLOSED as a 404, not fall over.
  const thread = await db.mentorThread.findFirst({
    where: { id: threadId },
    select: {
      id: true,
      schoolId: true,
      expertProfileId: true,
      expertUserId: true,
      studentMembershipId: true,
      purpose: true,
      status: true,
      parentConsentAt: true,
    },
  });
  if (!thread) throw new AccessError("Mentorship not found", "NOT_FOUND");

  const isExpert = session.user.id === thread.expertUserId;
  const isStudent = session.membershipId === thread.studentMembershipId;
  const isStaff =
    (session.role === "ADMIN" || session.role === "TEACHER") &&
    session.schoolId === thread.schoolId;

  // A guardian of THIS child, re-queried against the session rather than taken
  // from a route param — the same rule competitions.ts uses for consent.
  const isGuardian =
    session.role === "PARENT" &&
    (await db.guardianship.count({
      where: {
        parentUserId: session.user.id,
        studentMembershipId: thread.studentMembershipId,
        status: "ACTIVE",
      },
    })) > 0;

  if (!isExpert && !isStudent && !isStaff && !isGuardian) {
    throw new AccessError("Mentorship not found", "NOT_FOUND");
  }

  // Names, fetched separately and allowed to be null. A reader entitled to the
  // thread but not (yet) to the school still gets a usable page rather than a
  // crash — which is exactly the expert-before-consent case.
  const [student, expert, school] = await Promise.all([
    db.membership.findFirst({
      where: { id: thread.studentMembershipId },
      select: { user: { select: { id: true, name: true, preferredName: true } } },
    }),
    db.expertProfile.findFirst({
      where: { id: thread.expertProfileId },
      select: { user: { select: { id: true, name: true, preferredName: true } } },
    }),
    db.school.findFirst({ where: { id: thread.schoolId }, select: { name: true } }),
  ]);

  // Entitled to the row but unable to resolve who it is about means the tenant
  // has not been granted yet. Refuse rather than render half a page about a child.
  if (!student || !expert) throw new AccessError("Mentorship not found", "NOT_FOUND");

  return { thread, student, expert, school, isExpert, isStudent, isStaff, isGuardian };
}

/** Every mentorship this person may see, whoever they are. */
export async function listMentorships(session: ActiveContext): Promise<MentorSummary[]> {
  let where;
  if (session.role === "EXPERT") {
    where = { expertUserId: session.user.id };
  } else if (session.role === "STUDENT") {
    where = { studentMembershipId: session.membershipId ?? "__none__" };
  } else if (session.role === "PARENT") {
    const mine = await db.guardianship.findMany({
      where: { parentUserId: session.user.id, status: "ACTIVE" },
      select: { studentMembershipId: true },
    });
    where = { studentMembershipId: { in: mine.map((g) => g.studentMembershipId) } };
  } else {
    where = { schoolId: session.schoolId ?? "__none__" };
  }

  // Scalars and messages only, for the same reason readerOf takes that shape: an
  // expert holds PENDING threads whose school and pupil rows they cannot read
  // yet, and an eager include on those turns their list page into a 500.
  const threads = await db.mentorThread.findMany({
    where,
    select: {
      id: true,
      schoolId: true,
      status: true,
      purpose: true,
      expertProfileId: true,
      studentMembershipId: true,
      messages: { select: { authorUserId: true, readBy: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Resolved in bulk and allowed to come back short. A name that cannot be read
  // is shown as withheld rather than crashing the page or, worse, leaking.
  const [students, experts, schools] = await Promise.all([
    db.membership.findMany({
      where: { id: { in: threads.map((t) => t.studentMembershipId) } },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
    }),
    db.expertProfile.findMany({
      where: { id: { in: threads.map((t) => t.expertProfileId) } },
      select: { id: true, user: { select: { name: true, preferredName: true } } },
    }),
    db.school.findMany({
      where: { id: { in: threads.map((t) => t.schoolId) } },
      select: { id: true, name: true },
    }),
  ]);
  const studentBy = new Map(students.map((m) => [m.id, m.user.preferredName ?? m.user.name]));
  const expertBy = new Map(experts.map((e) => [e.id, e.user.preferredName ?? e.user.name]));
  const schoolBy = new Map(schools.map((x) => [x.id, x.name]));

  return threads.map((thread) => ({
    id: thread.id,
    status: thread.status,
    purpose: thread.purpose,
    studentName: studentBy.get(thread.studentMembershipId) ?? "A pupil",
    expertName: expertBy.get(thread.expertProfileId) ?? "A mentor",
    schoolName: schoolBy.get(thread.schoolId) ?? "A school",
    awaitingConsent: thread.status === "PENDING_CONSENT",
    unread: thread.messages.filter(
      (m) =>
        m.authorUserId !== session.user.id &&
        !readJsonArray<string>(m.readBy).includes(session.user.id),
    ).length,
  }));
}

/**
 * Pairs a child with an expert. School staff only.
 *
 * The expert must be PUBLISHED — an uncurated profile is somebody who accepted
 * an invitation and has been checked by nobody, which is not a person to put in
 * front of a child.
 */
export async function createMentorship(
  session: ActiveContext,
  input: { expertProfileId: string; studentMembershipId: string; purpose: string },
): Promise<{ threadId: string }> {
  if ((session.role !== "ADMIN" && session.role !== "TEACHER") || !session.schoolId) {
    throw new AccessError("Only a teacher or an admin can set up a mentorship");
  }
  const purpose = input.purpose.trim();
  if (purpose.length < 5) throw new AccessError("Say what the mentoring is for");

  const expert = await db.expertProfile.findFirst({
    where: { id: input.expertProfileId, publishedAt: { not: null } },
    select: {
      id: true,
      userId: true,
      offering: true,
      mentorCapacity: true,
      user: { select: { name: true } },
    },
  });
  if (!expert) throw new AccessError("No such expert", "NOT_FOUND");

  /**
   * WHAT THEY AGREED TO, enforced rather than displayed.
   *
   * An hour's workshop for a hall and a term with one eleven-year-old are
   * different commitments, and until `offering` existed every published expert
   * was silently available for both. A school pairing a child with somebody who
   * only ever offered to give a talk is not a UI mistake; it is a safeguarding
   * one, because the child is then told they have a mentor.
   */
  if (expert.offering === "SESSIONS") {
    throw new AccessError(
      `${expert.user.name} offers workshops and sessions rather than mentoring.`,
    );
  }


  // Scoped find: a membership id from another school does not resolve.
  const student = await db.membership.findFirst({
    where: { id: input.studentMembershipId, schoolId: session.schoolId, role: "STUDENT" },
    select: { id: true },
  });
  if (!student) throw new AccessError("No such pupil", "NOT_FOUND");

  const existing = await db.mentorThread.findUnique({
    where: {
      expertProfileId_studentMembershipId: {
        expertProfileId: expert.id,
        studentMembershipId: student.id,
      },
    },
    select: { id: true },
  });
  if (existing) return { threadId: existing.id };

  /**
   * CLAIM A PLACE, and this is the same shape as claiming a slot in
   * `experts.ts` for the same reason: two schools reaching for an expert's last
   * place at the same moment is the ordinary case in a shared marketplace, and
   * "count, then write" lets both through.
   *
   * So it is a CONDITIONAL UPDATE — the cap is in the WHERE — and the loser
   * sees zero rows affected. `activeMentorships` lives on ExpertProfile rather
   * than being counted from MentorThread because that table is school-scoped:
   * an admin counting it sees only their own school and would wave this expert
   * past their limit at every school after the first. See the schema note.
   */
  if (expert.mentorCapacity !== null) {
    const claimed = await db.expertProfile.updateMany({
      where: { id: expert.id, activeMentorships: { lt: expert.mentorCapacity } },
      data: { activeMentorships: { increment: 1 } },
    });
    if (claimed.count === 0) {
      throw new AccessError(
        `${expert.user.name} is already mentoring as many children as they have agreed to.`,
      );
    }
  } else {
    await db.expertProfile.update({
      where: { id: expert.id },
      data: { activeMentorships: { increment: 1 } },
    });
  }

  const thread = await db.mentorThread.create({
    data: {
      schoolId: session.schoolId,
      expertProfileId: expert.id,
      expertUserId: expert.userId,
      studentMembershipId: student.id,
      createdByMembershipId: session.membershipId,
      purpose,
      status: "PENDING_CONSENT",
    },
    select: { id: true },
  });

  // The link that proves it moved. Without this a guardian is never asked and
  // the mentorship sits pending forever, which reads as broken.
  await notifyGuardians(student.id, (childName) => ({
    schoolId: session.schoolId,
    kind: "EXPERT",
    title: `A mentor has been suggested for ${childName}`,
    body: `${expert.user.name} — ${purpose}. They cannot message ${childName} until you agree.`,
    url: `/parent/mentoring/${thread.id}`,
  }));

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "mentorship.create",
    targetType: "MentorThread",
    targetId: thread.id,
    meta: { expert: expert.user.name, purpose },
  });

  return { threadId: thread.id };
}

/** A guardian says yes. Only then does anybody get to speak. */
export async function consentToMentorship(
  session: ActiveContext,
  threadId: string,
): Promise<void> {
  if (session.role !== "PARENT") throw new AccessError("Only a guardian can agree to this");

  const { thread, isGuardian } = await readerOf(session, threadId);
  if (!isGuardian) throw new AccessError("Mentorship not found", "NOT_FOUND");
  if (thread.status === "CLOSED") throw new AccessError("This mentorship has ended");
  if (thread.status === "ACTIVE") return;

  await db.mentorThread.update({
    where: { id: threadId },
    data: {
      status: "ACTIVE",
      parentConsentAt: new Date(),
      parentConsentUserId: session.user.id,
    },
  });

  await notify({
    userId: thread.expertUserId,
    schoolId: thread.schoolId,
    kind: "EXPERT",
    title: "A mentorship has been approved",
    body: thread.purpose,
    url: `/expert/mentoring/${threadId}`,
  });

  await audit({
    schoolId: thread.schoolId,
    actorUserId: session.user.id,
    action: "mentorship.consent",
    targetType: "MentorThread",
    targetId: threadId,
  });
}

/** Ends a mentorship. Staff or the guardian — the expert cannot trap anyone. */
export async function closeMentorship(session: ActiveContext, threadId: string): Promise<void> {
  const { thread, isStaff, isGuardian } = await readerOf(session, threadId);
  if (!isStaff && !isGuardian) {
    throw new AccessError("Only the school or a guardian can end a mentorship");
  }

  // ALREADY CLOSED IS A NO-OP, and it has to be checked rather than assumed.
  // Two people ending the same mentorship — the school and the guardian, on the
  // same afternoon — would otherwise release the expert's place twice and let
  // them be given a child over their cap.
  if (thread.status === "CLOSED") return;

  await db.mentorThread.update({
    where: { id: threadId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  /**
   * The place goes back. A cap that only ever counts up silently retires an
   * expert the moment their third pupil moves on, and nothing tells them why
   * schools stopped asking.
   *
   * Floored at zero rather than decremented blindly: this counter is
   * denormalised, and the one thing worse than a drifting count is a negative
   * one that reads as infinite capacity.
   */
  await db.expertProfile.updateMany({
    where: { id: thread.expertProfileId, activeMentorships: { gt: 0 } },
    data: { activeMentorships: { decrement: 1 } },
  });

  await audit({
    schoolId: thread.schoolId,
    actorUserId: session.user.id,
    action: "mentorship.close",
    targetType: "MentorThread",
    targetId: threadId,
    meta: { by: isStaff ? "school" : "guardian" },
  });
}

export async function getMentorship(session: ActiveContext, threadId: string) {
  const { thread, student, expert, school, isExpert, isStudent, isStaff, isGuardian } =
    await readerOf(session, threadId);

  const messages = await db.mentorMessage.findMany({
    where: { threadId },
    include: { author: { select: { id: true, name: true, preferredName: true } } },
    orderBy: { createdAt: "asc" },
  });

  return {
    id: thread.id,
    status: thread.status,
    purpose: thread.purpose,
    schoolName: school?.name ?? "the school",
    studentName: student.user.preferredName ?? student.user.name,
    expertName: expert.user.preferredName ?? expert.user.name,
    awaitingConsent: thread.status === "PENDING_CONSENT",
    // Every viewer is told who else can read this, including the child. Nobody
    // should have to discover afterwards that their messages were visible.
    canPost: (isExpert || isStudent) && thread.status === "ACTIVE",
    isGuardian,
    isStaff,
    messages: messages.map((message) => ({
      id: message.id,
      body: message.body,
      createdAt: message.createdAt,
      authorName: message.author.preferredName ?? message.author.name,
      mine: message.author.id === session.user.id,
    })),
  };
}

/**
 * Posts a message. Only the expert and the child, and only once consent exists.
 *
 * Guardians and staff READ and do not write: a mentorship is a conversation
 * between two people that others can see, not a group chat. A guardian who wants
 * to say something has the ordinary remarks channel with the school.
 */
export async function postMentorMessage(
  session: ActiveContext,
  threadId: string,
  body: string,
): Promise<void> {
  const clean = body.trim();
  if (!clean) throw new AccessError("Write something first");
  if (clean.length > 5000) throw new AccessError("That message is too long");

  const { thread, student, expert, isExpert, isStudent } = await readerOf(session, threadId);

  if (thread.status === "PENDING_CONSENT") {
    throw new AccessError("Nobody can message until a guardian has agreed to this mentorship");
  }
  if (thread.status === "CLOSED") throw new AccessError("This mentorship has ended");
  if (!isExpert && !isStudent) {
    throw new AccessError("Only the mentor and the pupil can write here");
  }

  await db.mentorMessage.create({
    data: {
      // From the THREAD, never the session: an expert's session carries several
      // schools and the wrong one would misfile a child's message.
      schoolId: thread.schoolId,
      threadId,
      authorUserId: session.user.id,
      body: clean,
      readBy: JSON.stringify([session.user.id]),
    },
  });

  // The other party, plus the guardians — who are told that a conversation about
  // their child is happening, every time, rather than having to go looking.
  if (isExpert) {
    await notify({
      userId: student.user.id,
      schoolId: thread.schoolId,
      kind: "EXPERT",
      title: `${expert.user.name} sent you a message`,
      body: clean.slice(0, 120),
      url: `/student/margdarshak/${threadId}`,
    });
    await notifyGuardians(thread.studentMembershipId, (childName) => ({
      schoolId: thread.schoolId,
      kind: "EXPERT",
      title: `${expert.user.name} messaged ${childName}`,
      body: "You can read the whole conversation at any time.",
      url: `/parent/mentoring/${threadId}`,
    }));
  } else {
    await notify({
      userId: thread.expertUserId,
      schoolId: thread.schoolId,
      kind: "EXPERT",
      title: `${student.user.name} replied`,
      body: clean.slice(0, 120),
      url: `/expert/mentoring/${threadId}`,
    });
  }
}

/* -------------------------------------------------------------------------- */
/* What the pairing form needs                                                 */
/* -------------------------------------------------------------------------- */

export type PairingOptions = {
  experts: { id: string; name: string; headline: string; verified: boolean }[];
  pupils: { id: string; name: string }[];
};

/**
 * The two lists a staff member picks from.
 *
 * PUBLISHED EXPERTS ONLY, because an uncurated profile is somebody nobody has
 * checked, and the pairing form is not the place to discover that.
 *
 * A TEACHER SEES ONLY THEIR OWN PUPILS, via the same helper the remarks screen
 * uses — pairing a child with an outside adult is at least as sensitive as
 * messaging their parent, so it gets no wider a reach. An admin sees the school.
 * `createMentorship` re-checks the pupil against the school regardless, so this
 * narrowing is about not offering the wrong thing rather than about security.
 */
export async function pairingOptions(session: ActiveContext): Promise<PairingOptions> {
  if ((session.role !== "ADMIN" && session.role !== "TEACHER") || !session.schoolId) {
    return { experts: [], pupils: [] };
  }

  const [experts, pupils] = await Promise.all([
    db.expertProfile.findMany({
      where: { publishedAt: { not: null } },
      select: {
        id: true,
        headline: true,
        verifiedAt: true,
        user: { select: { name: true, preferredName: true } },
      },
      orderBy: { publishedAt: "desc" },
    }),
    session.role === "TEACHER" && session.membershipId
      ? studentsForTeacher(session.schoolId, session.membershipId)
      : db.membership.findMany({
          where: { schoolId: session.schoolId, role: "STUDENT", status: "ACTIVE" },
          include: { user: { select: { name: true, preferredName: true } } },
        }),
  ]);

  return {
    experts: experts.map((e) => ({
      id: e.id,
      name: e.user.preferredName ?? e.user.name,
      headline: e.headline,
      verified: e.verifiedAt !== null,
    })),
    // The two branches return different shapes -- studentsForTeacher already
    // flattens to { membershipId, name } -- so they are normalised here rather
    // than by making one of them pretend to be the other.
    pupils: pupils
      .map((p) =>
        "membershipId" in p
          ? { id: p.membershipId, name: p.name }
          : { id: p.id, name: p.user.preferredName ?? p.user.name },
      )
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
