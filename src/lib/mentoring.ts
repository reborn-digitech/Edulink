import "server-only";
import { db } from "./db";
import type { TranslationKey } from "@/lib/i18n/dictionary";
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
 * 2. ONLY SCHOOL STAFF MAY PAIR, and a pupil ASKING is not pairing. The expert
 *    may not choose their own mentee, and a child cannot meaningfully consent
 *    to a stranger — so a pupil's request creates a REQUESTED thread that
 *    grants nothing at all: the expert cannot see it, nobody can write in it,
 *    and it does not occupy one of the expert's mentee places. A school
 *    approves it, and only then is a guardian asked. Two adults still decide;
 *    what changed is that the child can now start the conversation about it
 *    instead of waiting to be noticed. Whoever asked and whoever decided are
 *    both recorded on the row.
 *
 * 3. PARENT CONSENT GATES THE FIRST MESSAGE. Until a guardian says yes the
 *    thread is PENDING_CONSENT and `postMentorMessage` refuses everybody,
 *    including the expert. It is also the state in which the expert has no
 *    tenant access to the school at all — `tenant-request.ts` counts only ACTIVE
 *    mentorships — so this is enforced by the database and not only by this file.
 *
 * Closing a mentorship removes the expert's access on the next request, because
 * the tenant set is recomputed per request rather than granted.
 *
 * ⚠ EVERY NOTIFICATION FROM THIS FILE LINKS TO `/mentoring/{threadId}`, AND
 * THERE IS NO ROLE-SPECIFIC VARIANT. Six of them used to point at
 * `/parent/mentoring/…`, `/expert/mentoring/…` and `/student/margdarshak/…`,
 * none of which have ever existed — so every mentoring notification this app has
 * ever sent, in the app and by push, led to a 404. Nearly 7,400 stored rows
 * carried one.
 *
 * ONE ROUTE IS RIGHT, not a compromise. `/mentoring/[threadId]` calls
 * `getMentorship`, which settles entitlement from `readerOf` — expert, child,
 * guardian, staff — so the page already renders the correct thing for each of
 * them, and every role's navigation already points at `/mentoring`. A per-role
 * URL would be four ways to reach one page, three of which somebody has to
 * remember to keep in step with the fourth.
 *
 * NOTHING INSIDE THE APP LINKED TO THESE, which is exactly why they survived:
 * `npm run sweep` follows the navigation, and a URL that exists only inside a
 * notification is one the navigation never mentions. The sweep now opens a
 * thread as each of the four readers — see `scripts/sweep.ts` — and
 * `tests/mentoring-links.test.ts` asserts that every URL this file emits is a
 * route that exists.
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
  if (!thread) throw new AccessError("access.mentorshipNotFound", "NOT_FOUND");

  /**
   * ⚠ NOT WHILE IT IS ONLY A REQUEST.
   *
   * `listMentorships` filters REQUESTED out of an expert's list; this is the
   * same rule for somebody who has the id. Without it an expert could open a
   * request by URL and learn that a named child had asked for them before any
   * school had vetted the pairing — a disclosure about a child to a stranger,
   * made by the child, which is the thing the approval step exists to prevent.
   *
   * The expert is simply not a reader of this row yet, so it is a 404 like any
   * other thread that is none of their business.
   */
  const isExpert = session.user.id === thread.expertUserId && thread.status !== "REQUESTED";
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
    throw new AccessError("access.mentorshipNotFound", "NOT_FOUND");
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
  if (!student || !expert) throw new AccessError("access.mentorshipNotFound", "NOT_FOUND");

  return { thread, student, expert, school, isExpert, isStudent, isStaff, isGuardian };
}

/** Every mentorship this person may see, whoever they are. */
export async function listMentorships(session: ActiveContext): Promise<MentorSummary[]> {
  let where;
  if (session.role === "EXPERT") {
    /**
     * ⚠ A REQUEST THE SCHOOL HAS NOT APPROVED IS INVISIBLE TO THE EXPERT.
     *
     * The sharpest consequence of letting pupils ask. Without this exclusion an
     * outside adult would learn that a named eleven-year-old had asked for them
     * — before any school had vetted the pairing, and whether or not it is ever
     * approved. That is a disclosure about a child to a stranger, made by the
     * child, which is exactly what the approval step exists to prevent.
     */
    where = { expertUserId: session.user.id, status: { not: "REQUESTED" } };
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
    throw new AccessError("access.onlyATeacherOrAnAdminCan4");
  }
  const purpose = input.purpose.trim();
  if (purpose.length < 5) throw new AccessError("access.sayWhatTheMentoringIsFor");

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
  if (!expert) throw new AccessError("access.noSuchExpert", "NOT_FOUND");

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
      "access.offersSessionsNotMentoring",
      "FORBIDDEN",
      { name: expert.user.name },
    );
  }


  // Scoped find: a membership id from another school does not resolve.
  const student = await db.membership.findFirst({
    where: { id: input.studentMembershipId, schoolId: session.schoolId, role: "STUDENT" },
    select: { id: true },
  });
  if (!student) throw new AccessError("access.noSuchPupil", "NOT_FOUND");

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
        "access.atMentorCapacity",
        "FORBIDDEN",
        { name: expert.user.name },
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
    url: `/mentoring/${thread.id}`,
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
  if (session.role !== "PARENT") throw new AccessError("access.onlyAGuardianCanAgreeToThis");

  const { thread, isGuardian } = await readerOf(session, threadId);
  if (!isGuardian) throw new AccessError("access.mentorshipNotFound", "NOT_FOUND");
  if (thread.status === "CLOSED") throw new AccessError("access.thisMentorshipHasEnded");
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
    url: `/mentoring/${threadId}`,
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
    throw new AccessError("access.onlyTheSchoolOrAGuardianCan");
  }

  // ALREADY CLOSED IS A NO-OP, and it has to be checked rather than assumed.
  // Two people ending the same mentorship — the school and the guardian, on the
  // same afternoon — would otherwise release the expert's place twice and let
  // them be given a child over their cap.
  if (thread.status === "CLOSED") return;

  /**
   * ⚠ A REQUEST NEVER TOOK A PLACE, SO CLOSING ONE MUST NOT GIVE ONE BACK.
   *
   * The place is claimed when a school APPROVES, not when a pupil asks — see
   * `decideMentorRequest`. Decrementing here for a REQUESTED thread would hand
   * the expert a place they never used, and because the counter is
   * denormalised that place comes out of somebody else's cap.
   */
  const heldAPlace = thread.status !== "REQUESTED";

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
  if (heldAPlace) {
    await db.expertProfile.updateMany({
      where: { id: thread.expertProfileId, activeMentorships: { gt: 0 } },
      data: { activeMentorships: { decrement: 1 } },
    });
  }

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
  if (!clean) throw new AccessError("access.writeSomethingFirst");
  if (clean.length > 5000) throw new AccessError("access.thatMessageIsTooLong");

  const { thread, student, expert, isExpert, isStudent } = await readerOf(session, threadId);

  if (thread.status === "REQUESTED") {
    throw new AccessError("access.nobodyCanMessageUntilYourSchoolHas");
  }
  if (thread.status === "PENDING_CONSENT") {
    throw new AccessError("access.nobodyCanMessageUntilAGuardianHas");
  }
  if (thread.status === "CLOSED") throw new AccessError("access.thisMentorshipHasEnded");
  if (!isExpert && !isStudent) {
    throw new AccessError("access.onlyTheMentorAndThePupilCan");
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
      url: `/mentoring/${threadId}`,
    });
    await notifyGuardians(thread.studentMembershipId, (childName) => ({
      schoolId: thread.schoolId,
      kind: "EXPERT",
      title: `${expert.user.name} messaged ${childName}`,
      body: "You can read the whole conversation at any time.",
      url: `/mentoring/${threadId}`,
    }));
  } else {
    await notify({
      userId: thread.expertUserId,
      schoolId: thread.schoolId,
      kind: "EXPERT",
      title: `${student.user.name} replied`,
      body: clean.slice(0, 120),
      url: `/mentoring/${threadId}`,
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

/* -------------------------------------------------------------------------- */
/* A pupil asking                                                              */
/* -------------------------------------------------------------------------- */

/**
 * How many requests a pupil may have outstanding at once.
 *
 * Small on purpose. A child who has asked three different adults to mentor them
 * and is waiting on all three has not been served by a fourth box to type in —
 * and without a cap, a bad afternoon produces forty requests a school has to
 * work through one at a time.
 */
export const MAX_OPEN_REQUESTS = 3;

/**
 * ⚠ `errorKey` AND `errorVars`, NOT A SENTENCE — the leave.ts pattern. These
 * refusals are read by whoever asked, in whatever language they read, so the
 * lib mints a key and the action boundary translates it.
 */
export type RequestResult =
  | { ok: true; threadId: string }
  | { ok: false; errorKey: TranslationKey; errorVars?: Record<string, string | number> };

/**
 * A pupil asks for a mentor.
 *
 * IT GRANTS NOTHING, and that is the whole design. The thread it creates is
 * REQUESTED: the expert cannot see it (see `listMentorships`), nobody can write
 * in it, it gives the expert no tenant access, and it does not occupy one of
 * their mentee places. It is a message to the pupil's own school, stored in the
 * shape the mentorship will take if the school and a guardian both agree.
 *
 * SO THE CHECKS HERE ARE ABOUT NOT WASTING ANYBODY'S TIME rather than about
 * safety — the safety is that approval is somebody else's. Refusing a
 * sessions-only expert or one who is full at this point means a child is told
 * now, by a machine, rather than in a week by an adult.
 */
export async function requestMentor(
  session: ActiveContext,
  input: { expertProfileId: string; purpose: string },
): Promise<RequestResult> {
  if (session.role !== "STUDENT" || !session.schoolId || !session.membershipId) {
    throw new AccessError("access.onlyAPupilCanAskForA");
  }

  const purpose = input.purpose.trim();
  if (purpose.length < 15) {
    return { ok: false, errorKey: "mentoring.sayABitMore" };
  }
  if (purpose.length > 1000) return { ok: false, errorKey: "mentoring.tooLong" };

  const expert = await db.expertProfile.findFirst({
    where: { id: input.expertProfileId, publishedAt: { not: null } },
    select: {
      id: true,
      userId: true,
      offering: true,
      mentorCapacity: true,
      activeMentorships: true,
      user: { select: { name: true } },
    },
  });
  // Unpublished and non-existent are the same answer: an uncurated profile is
  // not a person to put in front of a child, and saying which it was would let
  // somebody enumerate the ones waiting to be listed.
  if (!expert) return { ok: false, errorKey: "mentoring.mentorUnavailable" };

  if (expert.offering === "SESSIONS") {
    return { ok: false, errorKey: "mentoring.givesWorkshops", errorVars: { name: expert.user.name } };
  }
  if (expert.mentorCapacity !== null && expert.activeMentorships >= expert.mentorCapacity) {
    return { ok: false, errorKey: "mentoring.atCapacity", errorVars: { name: expert.user.name } };
  }

  const existing = await db.mentorThread.findUnique({
    where: {
      expertProfileId_studentMembershipId: {
        expertProfileId: expert.id,
        studentMembershipId: session.membershipId,
      },
    },
    select: { id: true, status: true },
  });
  if (existing) {
    // Including CLOSED, because the unique key does not care and a second ask
    // after a mentorship ended is a conversation to have with the school rather
    // than a row to create.
    return { ok: false, errorKey: "mentoring.alreadyAsked" };
  }

  const open = await db.mentorThread.count({
    where: { studentMembershipId: session.membershipId, status: "REQUESTED" },
  });
  if (open >= MAX_OPEN_REQUESTS) {
    return { ok: false, errorKey: "mentoring.openRequests", errorVars: { count: open } };
  }

  const thread = await db.mentorThread.create({
    data: {
      schoolId: session.schoolId,
      expertProfileId: expert.id,
      expertUserId: expert.userId,
      studentMembershipId: session.membershipId,
      // The pupil themselves. `createdByMembershipId` has always recorded who
      // did the pairing; for a request it records who asked, and `decidedBy`
      // below records who let it through.
      createdByMembershipId: session.membershipId,
      purpose,
      status: "REQUESTED",
    },
    select: { id: true },
  });

  /**
   * THE SCHOOL IS TOLD, and the guardians are NOT — yet.
   *
   * A request the school may decline is not something to raise with a family:
   * a child asking for help with maths should not turn into a conversation at
   * home about a stranger they will never be paired with. Guardians are asked
   * once, at the point it becomes real, by the existing consent step.
   */
  const staff = await db.membership.findMany({
    where: { schoolId: session.schoolId, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null },
    select: { userId: true },
  });
  const childName = session.user.preferredName ?? session.user.name;
  await Promise.all(
    staff.map((member) =>
      notify({
        userId: member.userId,
        schoolId: session.schoolId!,
        kind: "EXPERT",
        title: `${childName} has asked for a mentor`,
        body: purpose,
        url: `/mentoring`,
      }),
    ),
  );

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "mentorship.request",
    targetType: "MentorThread",
    targetId: thread.id,
    meta: { expert: expert.user.name },
  });

  return { ok: true, threadId: thread.id };
}

export type PendingRequest = {
  threadId: string;
  studentName: string;
  studentMembershipId: string;
  expertName: string;
  expertHeadline: string;
  expertVerified: boolean;
  purpose: string;
  askedAt: Date;
};

/** Requests waiting on this school. */
export async function listMentorRequests(session: ActiveContext): Promise<PendingRequest[]> {
  if ((session.role !== "ADMIN" && session.role !== "PRINCIPAL") || !session.schoolId) {
    throw new AccessError("access.onlySchoolStaffCanReviewMentoringRequests");
  }

  const threads = await db.mentorThread.findMany({
    where: { schoolId: session.schoolId, status: "REQUESTED" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      purpose: true,
      createdAt: true,
      studentMembershipId: true,
      student: { select: { user: { select: { name: true, preferredName: true } } } },
      expert: {
        select: {
          headline: true,
          verifiedAt: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  return threads.map((thread) => ({
    threadId: thread.id,
    studentName: thread.student.user.preferredName ?? thread.student.user.name,
    studentMembershipId: thread.studentMembershipId,
    expertName: thread.expert.user.name,
    expertHeadline: thread.expert.headline,
    expertVerified: thread.expert.verifiedAt !== null,
    purpose: thread.purpose,
    askedAt: thread.createdAt,
  }));
}

export type DecisionResult =
  | { ok: true }
  | { ok: false; errorKey: TranslationKey; errorVars?: Record<string, string | number> };

/**
 * The school decides.
 *
 * APPROVING IS WHERE THE PLACE IS CLAIMED, not where the pupil asked. A request
 * that occupied one of an expert's mentee places would let three children with
 * pending requests close an expert to a school that had approved nobody — and
 * would make declining a request quietly free up capacity, which is a strange
 * thing for a refusal to do.
 *
 * So the same conditional UPDATE `createMentorship` uses runs here, at the
 * moment the pairing becomes real. An expert who filled up while the request
 * sat in the queue is refused now, with a message, rather than silently taking
 * an extra child.
 */
export async function decideMentorRequest(
  session: ActiveContext,
  threadId: string,
  decision: { approve: boolean; reason?: string },
): Promise<DecisionResult> {
  if ((session.role !== "ADMIN" && session.role !== "PRINCIPAL") || !session.schoolId) {
    throw new AccessError("access.onlySchoolStaffCanReviewMentoringRequests");
  }

  // Scoped find: a thread id from another school does not resolve.
  const thread = await db.mentorThread.findFirst({
    where: { id: threadId, schoolId: session.schoolId, status: "REQUESTED" },
    select: {
      id: true,
      purpose: true,
      studentMembershipId: true,
      expertProfileId: true,
      expert: {
        select: { mentorCapacity: true, user: { select: { name: true } } },
      },
    },
  });
  if (!thread) return { ok: false, errorKey: "mentoring.noLongerWaiting" };

  if (!decision.approve) {
    const reason = (decision.reason ?? "").trim();
    await db.mentorThread.update({
      where: { id: thread.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        decidedByMembershipId: session.membershipId,
        decidedAt: new Date(),
        declineReason: reason || null,
      },
    });

    // The pupil is told, by the school rather than by silence. A request that
    // simply never becomes anything is the worst version of this feature.
    const student = await db.membership.findUnique({
      where: { id: thread.studentMembershipId },
      select: { userId: true },
    });
    if (student) {
      await notify({
        userId: student.userId,
        schoolId: session.schoolId,
        kind: "EXPERT",
        title: "Your school has answered your mentor request",
        body: reason || "Talk to your teacher about it.",
        url: "/mentoring",
      });
    }

    await audit({
      schoolId: session.schoolId,
      actorUserId: session.user.id,
      action: "mentorship.request.decline",
      targetType: "MentorThread",
      targetId: thread.id,
      meta: { reason: reason || null },
    });
    return { ok: true };
  }

  // Claim the place, exactly as createMentorship does, and for the same reason:
  // two schools approving an expert's last place at the same moment.
  if (thread.expert.mentorCapacity !== null) {
    const claimed = await db.expertProfile.updateMany({
      where: {
        id: thread.expertProfileId,
        activeMentorships: { lt: thread.expert.mentorCapacity },
      },
      data: { activeMentorships: { increment: 1 } },
    });
    if (claimed.count === 0) {
      return {
        ok: false,
        errorKey: "mentoring.filledUp",
        errorVars: { name: thread.expert.user.name },
      };
    }
  } else {
    await db.expertProfile.update({
      where: { id: thread.expertProfileId },
      data: { activeMentorships: { increment: 1 } },
    });
  }

  await db.mentorThread.update({
    where: { id: thread.id },
    data: {
      status: "PENDING_CONSENT",
      decidedByMembershipId: session.membershipId,
      decidedAt: new Date(),
    },
  });

  // NOW the guardians are asked — the first time this becomes their business.
  await notifyGuardians(thread.studentMembershipId, (childName) => ({
    schoolId: session.schoolId!,
    kind: "EXPERT",
    title: `${childName} has asked for a mentor, and the school agrees`,
    body: `${thread.expert.user.name} — ${thread.purpose}. They cannot message ${childName} until you agree.`,
    url: `/mentoring/${thread.id}`,
  }));

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "mentorship.request.approve",
    targetType: "MentorThread",
    targetId: thread.id,
    meta: { expert: thread.expert.user.name },
  });

  return { ok: true };
}

export type RequestableExpert = {
  id: string;
  name: string;
  headline: string;
  bio: string;
  specialisms: string[];
  verified: boolean;
};

/**
 * Mentors a pupil may ask for.
 *
 * NARROWER THAN THE STAFF CHOOSER, and the narrowing is the point. `pairingOptions`
 * lists every published expert because a member of staff choosing one is
 * expected to read a profile and use judgement. A child is offered only people
 * who are actually available to mentor — published, offering it at all, and not
 * already at the cap they agreed to — so the list is the set of asks that could
 * succeed rather than a catalogue of adults.
 */
export async function requestableExperts(session: ActiveContext): Promise<RequestableExpert[]> {
  if (session.role !== "STUDENT" || !session.membershipId) return [];

  const experts = await db.expertProfile.findMany({
    where: { publishedAt: { not: null }, offering: { not: "SESSIONS" } },
    select: {
      id: true,
      headline: true,
      bio: true,
      specialisms: true,
      verifiedAt: true,
      mentorCapacity: true,
      activeMentorships: true,
      user: { select: { name: true, preferredName: true } },
    },
    orderBy: [{ verifiedAt: "desc" }, { publishedAt: "desc" }],
  });

  // Anybody this pupil has already asked, in any state — the unique key would
  // refuse a second row anyway, and offering somebody a button that returns
  // "you have already asked this mentor" is worse than not offering it.
  const alreadyAsked = await db.mentorThread.findMany({
    where: { studentMembershipId: session.membershipId },
    select: { expertProfileId: true },
  });
  const asked = new Set(alreadyAsked.map((t) => t.expertProfileId));

  return experts
    .filter((e) => !asked.has(e.id))
    .filter((e) => e.mentorCapacity === null || e.activeMentorships < e.mentorCapacity)
    .map((e) => ({
      id: e.id,
      name: e.user.preferredName ?? e.user.name,
      headline: e.headline,
      bio: e.bio,
      specialisms: readJsonArray<string>(e.specialisms),
      verified: e.verifiedAt !== null,
    }));
}
