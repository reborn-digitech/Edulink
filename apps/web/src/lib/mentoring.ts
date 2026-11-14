import "server-only";
import { db } from "./db";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { audit } from "./audit";
import { AccessError, assertStudentAccess } from "./tenancy";
import { EVERY_GUARDIAN, notify, notifyGuardians } from "./notify";
import { asTheSchool } from "./expert-binding";
import { readJsonArray } from "./json";
import { studentsForTeacher } from "./remarks";
import type { ActiveContext } from "./session";
import { forSchool } from "./tenant-context";
import { ownerRoleProblem, readRoleFlags } from "./db-role-check";

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
  studentMembershipId: string;
  studentName: string;
  expertName: string;
  schoolName: string;
  awaitingConsent: boolean;
  unread: number;
};

/** Thrown inside a claim's transaction to roll the claimed place back when the thread it was for has moved (TA-125). */
class PlaceNotTaken extends Error {
  constructor(readonly threadId: string) {
    super("place not taken");
  }
}

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
  // The office reads every thread at the school. A TEACHER reads the threads
  // of pupils they teach — the same narrowing `pairingOptions` applies to
  // whom they may pair, because reading a child's conversation with an
  // outside adult is at least as sensitive as arranging it.
  const isOffice =
    (session.role === "ADMIN" || session.role === "PRINCIPAL") && session.schoolId === thread.schoolId;
  const isTeacherOfPupil =
    session.role === "TEACHER" &&
    session.schoolId === thread.schoolId &&
    session.membershipId !== null &&
    (await studentsForTeacher(thread.schoolId, session.membershipId)).some(
      (pupil) => pupil.membershipId === thread.studentMembershipId,
    );
  const isStaff = isOffice || isTeacherOfPupil;

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
  } else if (session.role === "TEACHER" && session.schoolId && session.membershipId) {
    const mine = await studentsForTeacher(session.schoolId, session.membershipId);
    where = { schoolId: session.schoolId, studentMembershipId: { in: mine.map((p) => p.membershipId) } };
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
    studentMembershipId: thread.studentMembershipId,
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
    where: { id: input.expertProfileId, publishedAt: { not: null }, disabledAt: null },
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


  // The same door every other teacher path uses: a membership id from
  // another school does not resolve, and a TEACHER reaches only a pupil in a
  // class they teach — any teacher pairing any child in the school with an
  // outsider was a safeguarding hole, not a convenience.
  if (!session.membershipId) throw new AccessError("access.onlyATeacherOrAnAdminCan4");
  const student = await assertStudentAccess({ schoolId: session.schoolId, membershipId: session.membershipId, role: session.role }, input.studentMembershipId);

  const existing = await db.mentorThread.findUnique({
    where: {
      expertProfileId_studentMembershipId: {
        expertProfileId: expert.id,
        studentMembershipId: student.id,
      },
    },
    select: { id: true, status: true },
  });
  // A live or pending pairing is simply found again. A CLOSED one is the
  // pair's history, not its present: pairing them again revives the row —
  // the unique key allows only one — as a fresh request for consent, claims a
  // place, and asks the guardian, exactly as a first pairing would.
  // TA-582: but a pupil's own ask (REQUESTED) is the office's to decide (decideMentorRequest), which claims the place
  // and asks the guardians; answering it with its id as though paired would leave it waiting with nobody asked.
  if (existing?.status === "REQUESTED") throw new AccessError("mentoring.askWaitingOffice");
  if (existing && existing.status !== "CLOSED") return { threadId: existing.id };

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
  // TA-125: the claim and the thread's write are one transaction, the revival conditional on the thread still being
  // CLOSED, so a lost race (a second pairing reviving the same row, a new pair the unique key refuses) gives the
  // place back with the rollback rather than leaving the count one too high for good.
  const schoolId = session.schoolId;
  const createdBy = session.membershipId;
  let thread: { id: string };
  try {
    thread = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const claimed =
        expert.mentorCapacity !== null
          ? await tx.expertProfile.updateMany({ where: { id: expert.id, activeMentorships: { lt: expert.mentorCapacity } }, data: { activeMentorships: { increment: 1 } } })
          : await tx.expertProfile.updateMany({ where: { id: expert.id }, data: { activeMentorships: { increment: 1 } } });
      if (claimed.count === 0) throw new AccessError("access.atMentorCapacity", "FORBIDDEN", { name: expert.user.name });
      if (existing) {
        const revived = await tx.mentorThread.updateMany({
          where: { id: existing.id, status: "CLOSED" },
          data: { createdByMembershipId: createdBy, purpose, status: "PENDING_CONSENT", closedAt: null, parentConsentAt: null, parentConsentUserId: null },
        });
        if (revived.count === 0) throw new PlaceNotTaken(existing.id);
        return { id: existing.id };
      }
      return tx.mentorThread.create({
        data: { schoolId, expertProfileId: expert.id, expertUserId: expert.userId, studentMembershipId: student.id, createdByMembershipId: createdBy, purpose, status: "PENDING_CONSENT" },
        select: { id: true },
      });
    });
  } catch (error) {
    // Somebody revived or created the pair a moment before: found again, as above, and no place kept.
    if (error instanceof PlaceNotTaken) return { threadId: error.threadId };
    if ((error as { code?: string }).code === "P2002") {
      const now = await db.mentorThread.findUnique({ where: { expertProfileId_studentMembershipId: { expertProfileId: expert.id, studentMembershipId: student.id } }, select: { id: true } });
      if (now) return { threadId: now.id };
    }
    throw error;
  }

  // The link that proves it moved. Without this a guardian is never asked and
  // the mentorship sits pending forever, which reads as broken.
  await notifyGuardians(student.id, (childName) => ({
    schoolId: session.schoolId,
    kind: "EXPERT",
    titleKey: "notifTitle.mentorSuggested",
    titleVars: { name: childName },
    bodyKey: "notifBody.mentorNeedsConsent",
    bodyVars: { name: expert.user.name, purpose, child: childName },
    url: `/mentoring/${thread.id}`,
    // A mentorship waits on a guardian's yes whoever the pupil is (consentToMentorship): asked, not merely told (TA-262).
  }), EVERY_GUARDIAN);

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
  // ONLY A THREAD THE SCHOOL HAS APPROVED waits on a guardian (TA-006): a pupil's ask is REQUESTED until the office
  // decides it, and a guardian's yes before then would skip the school's decision and the place it claims on the
  // expert's count. Both apps hide the button; this is the rule, not the button.
  if (thread.status !== "PENDING_CONSENT") throw new AccessError("mentoring.notApprovedYet");

  // TWO ADULTS STILL DECIDE (rule 2 above; TA-119): the guardian who agrees is not the adult who paired the pupil
  // or let the ask through. A class teacher holding the school's stand-in guardianship for a pupil with no family
  // on the app, who paired that pupil, would otherwise be both, and the mentorship ACTIVE on one person's word.
  const arranged = await db.mentorThread.findUnique({ where: { id: threadId }, select: { createdByMembershipId: true, decidedByMembershipId: true } });
  const arrangers = [arranged?.createdByMembershipId, arranged?.decidedByMembershipId].filter((id): id is string => Boolean(id));
  if (arrangers.length > 0 && (await db.membership.count({ where: { id: { in: arrangers }, userId: session.user.id } })) > 0) {
    throw new AccessError("mentoring.refuseSameAdult");
  }

  // Conditional on the status read above, so a decline or a close landing in between is not overwritten.
  const moved = await db.mentorThread.updateMany({
    where: { id: threadId, status: "PENDING_CONSENT" },
    data: {
      status: "ACTIVE",
      parentConsentAt: new Date(),
      parentConsentUserId: session.user.id,
    },
  });
  if (moved.count === 0) {
    const now = await db.mentorThread.findUnique({ where: { id: threadId }, select: { status: true } });
    if (now?.status === "ACTIVE") return;
    throw new AccessError(now?.status === "CLOSED" ? "access.thisMentorshipHasEnded" : "mentoring.notApprovedYet");
  }

  await notify({
    userId: thread.expertUserId,
    schoolId: thread.schoolId,
    kind: "EXPERT",
    titleKey: "notifTitle.mentorshipApproved",
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
  // The claim is in the WHERE: two closers at once must release one place. And the WHERE names the status the
  // place is decided from (TA-125): a close that read REQUESTED while the office's approval claimed a place and
  // moved the thread on closes nothing, reads the thread again, and gives the place it now holds back.
  /**
   * The place goes back. A cap that only ever counts up silently retires an
   * expert the moment their third pupil moves on, and nothing tells them why
   * schools stopped asking.
   *
   * TA-532: and it goes back IN THE SAME TRANSACTION as the status change, with the audit row (closeHoldingPlace).
   * Given back in a second write, a nightly recount landing between the two counted the thread closed and then saw
   * the place taken off again, leaving the count one low until the next night.
   */
  let status = thread.status;
  for (let round = 0; ; round += 1) {
    const from = status;
    const closed = await db.$tenantTransaction((raw) =>
      closeHoldingPlace(raw as typeof db, { id: threadId, schoolId: thread.schoolId, expertProfileId: thread.expertProfileId }, from, new Date(), {
        actorUserId: session.user.id,
        by: isStaff ? "school" : "guardian",
      }),
    );
    if (closed) return;
    const now = await db.mentorThread.findUnique({ where: { id: threadId }, select: { status: true } });
    if (!now || now.status === "CLOSED" || round >= 3) return;
    status = now.status;
  }
}

/** The statuses in which a mentorship holds one of the expert's mentee places (TA-532): approved, or agreed to. */
const HOLDS_A_PLACE = ["PENDING_CONSENT", "ACTIVE"];

/**
 * Closes one mentorship from the status it was read in and, when that status held a place, gives the place back, with
 * the audit row: one transaction, on the caller's transaction client (TA-532). Conditional on the status, so two
 * closers at once release one place. Answers whether this call closed it.
 *
 * Floored at zero rather than decremented blindly: this counter is denormalised, and the one thing worse than a
 * drifting count is a negative one that reads as infinite capacity. The decrement takes the expert's row lock, which
 * the recount (recountMentorPlaces) takes before it counts, so a recount either waits for this close or counts the
 * thread still open and the decrement then lands on its total.
 */
async function closeHoldingPlace(
  tx: typeof db,
  thread: { id: string; schoolId: string; expertProfileId: string },
  from: string,
  at: Date,
  who: { actorUserId: string | null; by: "school" | "guardian" | "leaving" },
): Promise<boolean> {
  const closed = await tx.mentorThread.updateMany({
    where: { id: thread.id, status: from },
    data: { status: "CLOSED", closedAt: at },
  });
  if (closed.count === 0) return false;
  if (HOLDS_A_PLACE.includes(from)) {
    await tx.expertProfile.updateMany({
      where: { id: thread.expertProfileId, activeMentorships: { gt: 0 } },
      data: { activeMentorships: { decrement: 1 } },
    });
  }
  await audit(
    {
      schoolId: thread.schoolId,
      actorUserId: who.actorUserId,
      action: "mentorship.close",
      targetType: "MentorThread",
      targetId: thread.id,
      meta: { by: who.by },
    },
    tx,
  );
  return true;
}

/**
 * A LEAVER'S MENTORSHIPS END (TA-532, the owner's decision of 14 November 2026). The school that approved a
 * mentorship no longer oversees a pupil who has left it, and until now nothing ended one: the thread stayed open, held
 * the expert's place, and the outside expert could still write to the child (postMentorMessage checks the thread's
 * status alone). For the nightly accounts:tidy job: every mentorship not yet CLOSED whose pupil's membership has a
 * leaving day on or before `now` is closed, its place given back in the same transaction (closeHoldingPlace, audited
 * as mentorship.close by "leaving", with no actor), and the expert and the pupil's guardians are told by a notice. A
 * pupil's own ask still waiting on the office (REQUESTED) is closed too, telling nobody: neither the expert nor the
 * guardians were ever told of it. A leaving dated ahead waits for its day. Honours the job's scope (the schools, or
 * the pupils' own user ids). Repeatable: a second run finds nothing.
 */
export async function endLeaversMentorships(
  now: Date = new Date(),
  scope: { schoolIds?: string[]; userIds?: string[] } = {},
): Promise<{ ended: number; perSchool: Record<string, { mentorshipsEnded: number }> }> {
  const open = await db.mentorThread.findMany({
    where: { status: { not: "CLOSED" }, ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}) },
    select: { id: true, schoolId: true, expertProfileId: true, expertUserId: true, studentMembershipId: true, status: true },
  });
  const perSchool: Record<string, { mentorshipsEnded: number }> = {};
  if (open.length === 0) return { ended: 0, perSchool };
  const leavers = new Map(
    (
      await db.membership.findMany({
        where: { id: { in: [...new Set(open.map((t) => t.studentMembershipId))] }, leftAt: { lte: now }, ...(scope.userIds ? { userId: { in: scope.userIds } } : {}) },
        select: { id: true, user: { select: { name: true, preferredName: true } }, school: { select: { name: true } } },
      })
    ).map((m) => [m.id, m] as const),
  );
  let ended = 0;
  for (const thread of open) {
    const leaver = leavers.get(thread.studentMembershipId);
    if (!leaver) continue;
    const closed = await forSchool(thread.schoolId, () =>
      db.$tenantTransaction((raw) => closeHoldingPlace(raw as typeof db, thread, thread.status, now, { actorUserId: null, by: "leaving" })),
    );
    if (!closed) continue;
    ended += 1;
    (perSchool[thread.schoolId] ??= { mentorshipsEnded: 0 }).mentorshipsEnded += 1;
    if (thread.status === "REQUESTED") continue;
    const child = leaver.user.preferredName ?? leaver.user.name;
    const schoolName = leaver.school.name;
    // A notice that fails does not reopen the mentorship: the close and its audit row are already written.
    // An expert whose mentorship still waited for the guardian's yes was never shown the child or the school (the row
    // policies open them on an ACTIVE thread alone, and listMentorships says "A pupil"), so their notice names neither.
    // No expert is linked to the thread, which answers them 404 once it is closed: their own list instead.
    const consented = thread.status === "ACTIVE";
    await forSchool(thread.schoolId, async () => {
      await notify({
        userId: thread.expertUserId,
        schoolId: thread.schoolId,
        kind: "EXPERT",
        titleKey: "mentoring.leaverEndedTitle",
        bodyKey: consented ? "mentoring.leaverEndedExpert" : "mentoring.leaverEndedExpertPending",
        bodyVars: consented ? { child, school: schoolName } : {},
        url: "/mentoring",
      });
      await notifyGuardians(thread.studentMembershipId, (childName) => ({
        schoolId: thread.schoolId,
        kind: "EXPERT",
        titleKey: "mentoring.leaverEndedTitle",
        bodyKey: "mentoring.leaverEndedGuardian",
        bodyVars: { child: childName, school: schoolName },
        url: `/mentoring/${thread.id}`,
        // The guardians agreed to the mentorship and read every message of it, whoever the pupil is (TA-262).
      }), EVERY_GUARDIAN);
    }).catch((error) => console.error("[endLeaversMentorships] notice failed", error));
  }
  return { ended, perSchool };
}

/**
 * THE ONE RECOUNT of ExpertProfile.activeMentorships (TA-532). The count is a stored copy, kept on the expert because a
 * school cannot see another school's mentorships (createMentorship's note), and until now only an explicit close gave
 * a place back: a pupil removed outright, or a school erased, took its threads by cascade and the place was never
 * returned, so an expert could read as full to every school. This sets each expert's count from the mentorships that
 * hold a place (PENDING_CONSENT or ACTIVE) across every school, locking the expert's row (FOR UPDATE) before it counts,
 * so a claim or a close in flight either finishes first or lands on the new total. An approved mentorship still
 * waiting for a guardian's yes keeps its place, as it does today.
 *
 * Run by accounts:tidy each night, never on a run narrowed to chosen schools, and by the demo and sweep scripts for the
 * expert they give a mentorship (`only`, which narrows the experts, never the schools counted). It must see every
 * school's rows, so it refuses a connection the row policies hold, where every count would read nought.
 */
export async function recountMentorPlaces(only: { expertProfileIds?: string[] } = {}): Promise<{ experts: number; corrected: number }> {
  const problem = ownerRoleProblem(await readRoleFlags(db));
  if (problem) throw new Error(`recountMentorPlaces counts every school's mentorships and runs as the owner only. ${problem}`);
  const experts = await db.expertProfile.findMany({
    where: only.expertProfileIds ? { id: { in: only.expertProfileIds } } : {},
    select: { id: true },
    orderBy: { id: "asc" },
  });
  let corrected = 0;
  for (const { id } of experts) {
    const changed = await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const locked = await tx.$queryRaw<{ activeMentorships: number }[]>`SELECT "activeMentorships" FROM "ExpertProfile" WHERE "id" = ${id} FOR UPDATE`;
      if (!locked[0]) return false;
      const holding = await tx.mentorThread.count({ where: { expertProfileId: id, status: { in: HOLDS_A_PLACE } } });
      if (locked[0].activeMentorships === holding) return false;
      await tx.expertProfile.update({ where: { id }, data: { activeMentorships: holding } });
      return true;
    });
    if (changed) corrected += 1;
  }
  return { experts: experts.length, corrected };
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
    studentMembershipId: thread.studentMembershipId,
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
    // The pupil and their guardians are told under the school's binding: an
    // expert's own session is bound to no school and may write nobody a notice.
    await asTheSchool(session, thread.schoolId, async () => {
      await notify({
        userId: student.user.id,
        schoolId: thread.schoolId,
        kind: "EXPERT",
        titleKey: "notifTitle.personSentYouMessage",
        titleVars: { name: expert.user.name },
        body: clean.slice(0, 120),
        url: `/mentoring/${threadId}`,
      });
      await notifyGuardians(thread.studentMembershipId, (childName) => ({
        schoolId: thread.schoolId,
        kind: "EXPERT",
        titleKey: "notifTitle.personMessagedChild",
        titleVars: { name: expert.user.name, child: childName },
        bodyKey: "notifBody.readWholeConversation",
        url: `/mentoring/${threadId}`,
        // The guardians read every message of a mentorship they agreed to (getMentorship), whoever the pupil is (TA-262).
      }), EVERY_GUARDIAN);
    });
  } else {
    await notify({
      userId: thread.expertUserId,
      schoolId: thread.schoolId,
      kind: "EXPERT",
      titleKey: "notifTitle.personReplied",
      titleVars: { name: student.user.name },
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
      where: { publishedAt: { not: null }, disabledAt: null },
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
          // On roll only — a graduate is not a mentee.
          where: { schoolId: session.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
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
    where: { id: input.expertProfileId, publishedAt: { not: null }, disabledAt: null },
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
        titleKey: "notifTitle.childAskedMentor",
        titleVars: { name: childName },
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
    // TA-125: conditional on the ask still waiting, so a decline crossing an approval cannot close a thread that
    // already holds a place (and was asked of the guardians) without giving the place back.
    const declined = await db.mentorThread.updateMany({
      where: { id: thread.id, schoolId: session.schoolId, status: "REQUESTED" },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        decidedByMembershipId: session.membershipId,
        decidedAt: new Date(),
        declineReason: reason || null,
      },
    });
    if (declined.count === 0) return { ok: false, errorKey: "mentoring.noLongerWaiting" };

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
        titleKey: "notifTitle.mentorRequestAnswered",
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
  //
  // TA-125: and the claim and the move to PENDING_CONSENT are ONE transaction, the move conditional on the ask
  // still waiting. Two approvals pressed together (the admin and the principal, the web and the phone) both read
  // REQUESTED above; the second now waits on the first's row lock, moves nothing, and its claim is rolled back,
  // so the expert's count rises once.
  const schoolId = session.schoolId;
  const decidedBy = session.membershipId;
  const capacity = thread.expert.mentorCapacity;
  const outcome = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const moved = await tx.mentorThread.updateMany({
      where: { id: thread.id, schoolId, status: "REQUESTED" },
      data: { status: "PENDING_CONSENT", decidedByMembershipId: decidedBy, decidedAt: new Date() },
    });
    if (moved.count === 0) return "gone" as const;
    const claimed =
      capacity !== null
        ? await tx.expertProfile.updateMany({ where: { id: thread.expertProfileId, activeMentorships: { lt: capacity } }, data: { activeMentorships: { increment: 1 } } })
        : await tx.expertProfile.updateMany({ where: { id: thread.expertProfileId }, data: { activeMentorships: { increment: 1 } } });
    if (claimed.count === 0) throw new PlaceNotTaken(thread.id);
    return "approved" as const;
  }).catch((error: unknown) => {
    if (error instanceof PlaceNotTaken) return "full" as const;
    throw error;
  });
  if (outcome === "gone") return { ok: false, errorKey: "mentoring.noLongerWaiting" };
  if (outcome === "full") {
    return {
      ok: false,
      errorKey: "mentoring.filledUp",
      errorVars: { name: thread.expert.user.name },
    };
  }

  // NOW the guardians are asked — the first time this becomes their business.
  await notifyGuardians(thread.studentMembershipId, (childName) => ({
    schoolId: session.schoolId!,
    kind: "EXPERT",
    titleKey: "notifTitle.childAskedMentorAgreed",
    titleVars: { name: childName },
    bodyKey: "notifBody.mentorNeedsConsent",
    bodyVars: { name: thread.expert.user.name, purpose: thread.purpose, child: childName },
    url: `/mentoring/${thread.id}`,
    // As at the office's pairing: the guardian's yes is what the thread waits on (TA-262).
  }), EVERY_GUARDIAN);

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
    where: { publishedAt: { not: null }, disabledAt: null, offering: { not: "SESSIONS" } },
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
