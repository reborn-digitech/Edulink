import "server-only";
import { ROLE_HOME } from "./constants";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession, type ActiveContext } from "./session";
import { isLimitedRole, isTeachingRole, type Role } from "./constants";
import { isCollegeKind, type StudentConsentGrant } from "@edulink/contracts";
import { parentMaySee } from "./student-consent";

/**
 * The authorization chokepoint.
 *
 * Rule, without exception: `schoolId` is derived from the *session*, never read
 * from a route param, form field or query string. Handlers receive the id they
 * are allowed to touch; they never assert it. That single inversion is what
 * stops the IDOR class of bug — /invoice/<id> reading anyone's invoice — which
 * passes every functional test because the happy path never tries it. (§6)
 *
 * Anything that takes a resource id from the client goes through one of the
 * assert* helpers below, each of which re-queries with the session's schoolId
 * in the WHERE clause. A row from another tenant simply does not come back.
 */

// The class lives in its own file, with nothing imported, so that the session's
// role gate (role-gate.ts, read by session.ts, which this file imports) can
// throw it without a cycle. Every import of it from here still works.
export { AccessError } from "./access-error";
import { AccessError } from "./access-error";

/* -------------------------------------------------------------------------- */
/* Session gates                                                               */
/* -------------------------------------------------------------------------- */

export async function requireUser(): Promise<ActiveContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Authenticated, for a SERVER ACTION.
 *
 * Throws where `requireUser` redirects. A redirect thrown out of an action is
 * not an error the client can render — it surfaces as a broken transition — so
 * the two gates are kept separate rather than one guessing the context.
 */
export async function requireApiUser(): Promise<ActiveContext> {
  const session = await getSession();
  if (!session) throw new AccessError("access.pleaseLogInAgain");
  return session;
}

/** Authenticated, with an active school context in one of `roles`. */
export async function requireRole<R extends Role>(
  ...roles: R[]
): Promise<ActiveContext & { role: R; schoolId: string; membershipId: string }> {
  const session = await requireUser();

  if (!session.role || !roles.includes(session.role as R)) {
    // No usable context for this area — send them to pick one rather than
    // showing a dead end. (§7 "no dead ends")
    redirect(`/switch?next=${encodeURIComponent(roles[0] ? roleHome(roles[0]) : "/")}`);
  }
  if (!session.schoolId || !session.membershipId) {
    redirect("/switch");
  }
  return session as ActiveContext & { role: R; schoolId: string; membershipId: string };
}

/**
 * Whoever runs the server. Redirects rather than 403s.
 *
 * A 404-shaped redirect, not a "forbidden": `/root` should not confirm its own
 * existence to somebody who is not meant to be there. The database refuses the
 * rows anyway — this only decides which page they see.
 */
export async function requireSuperuser(): Promise<ActiveContext> {
  const session = await requireUser();
  if (!session.user.isSuperuser) redirect("/");
  return session;
}

/**
 * The application's content team. Same shape as `requireSuperuser`, and the
 * same 404-flavoured redirect: `/appadmin` should not confirm its own existence
 * to somebody who is not meant to be there.
 *
 * The operator passes too — they appoint the content team and hold everything
 * it holds. See the note on `assertAppAdmin` in app-admin.ts; the two gates
 * must agree or a page would render whose every action then refuses.
 */
export async function requireAppAdmin(): Promise<ActiveContext> {
  const session = await requireUser();
  if (!session.user.isAppAdmin && !session.user.isSuperuser) redirect("/");
  return session;
}

/** Parents have no Membership; they are authorized through Guardianship. */
export async function requireParent(): Promise<ActiveContext> {
  const session = await requireUser();
  const hasChild = await db.guardianship.findFirst({
    where: { parentUserId: session.user.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!hasChild) redirect("/parent/link");
  return session;
}

/** Non-redirecting variant for route handlers and server actions. */
export async function requireApiRole<R extends Role>(
  ...roles: R[]
): Promise<ActiveContext & { role: R; schoolId: string; membershipId: string }> {
  const session = await getSession();
  if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
  if (!session.role || !roles.includes(session.role as R)) {
    throw new AccessError("access.wrongRoleForThisAction");
  }
  if (!session.schoolId || !session.membershipId) {
    throw new AccessError("access.noActiveSchoolSelected");
  }
  return session as ActiveContext & { role: R; schoolId: string; membershipId: string };
}

/**
 * The operator, for a ROUTE HANDLER: 401 with no session, 403 without the
 * flag — a refusal the phone can show, not the page gate's redirect home.
 * No school context is required or returned: the operator's endpoints read
 * the whole server through SUPERUSER_TABLES, never one tenant.
 */
export async function requireApiOperator(): Promise<ActiveContext> {
  const session = await getSession();
  if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
  if (!session.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  return session;
}

/** The content team, for a route handler; the operator passes too, as on `requireAppAdmin`. */
export async function requireApiAppAdmin(): Promise<ActiveContext> {
  const session = await getSession();
  if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
  if (!session.user.isAppAdmin && !session.user.isSuperuser) throw new AccessError("access.wrongRoleForThisAction");
  return session;
}

function roleHome(role: Role): string {
  return ROLE_HOME[role];
}

/**
 * An expert, who has no Membership and no school of their own.
 *
 * Same shape as `requireParent`: the role alone is not enough, because a session
 * can claim any role. What is checked is that a PUBLISHED expert profile exists
 * for this user — an unpublished one is somebody who accepted an invitation and
 * has not been curated yet, and they get no expert area at all.
 *
 * NOTE THE ABSENCE. There is no schoolId here and there must not be. An expert
 * reaches a school only through `resolveRequestTenant`, which turns their
 * CONFIRMED bookings into `app.school_ids` — so a school that has not booked
 * them is not merely hidden from the UI, it is invisible to their queries.
 */
export async function requireExpert(): Promise<ActiveContext & { expertProfileId: string }> {
  const session = await requireUser();
  if (session.role !== "EXPERT") redirect("/switch");

  const profile = await db.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, publishedAt: true },
  });
  if (!profile) redirect("/switch");
  if (!profile.publishedAt) redirect("/expert/pending");

  return { ...session, expertProfileId: profile.id };
}

/* -------------------------------------------------------------------------- */
/* Resource assertions — the client supplies an id, we supply the scope        */
/* -------------------------------------------------------------------------- */

/**
 * The three asserts below fall through to "the whole school" for any role
 * that is not a teacher or a pupil — right for the office and the head, and
 * wrong for a driver, the library's desk, a warden or an alumnus, who reach
 * no class, pupil or piece of work through them (3 Oct 2026). The session's
 * gate already keeps those roles off these doors; this is the second lock.
 *
 * A COLLEGE'S FACULTY AND HOD ARE TEACHERS HERE (4 Oct 2026): scoped to the
 * classes they are assigned, exactly as a TEACHER is, once a door names them
 * (`isTeachingRole`); the academics builder adds the HOD's department read.
 * The college's other four staff roles — the exam controller, IQAC, placement
 * and accounts — and the recruiter are refused like the module roles: none
 * of them may fall through to "the whole school".
 */
function refuseModuleRole(role: Role): void {
  if (isLimitedRole(role) && !isTeachingRole(role)) throw new AccessError("access.wrongRoleForThisAction");
}

/**
 * A class the caller may act on.
 *
 * Admins get any class in their school. Teachers get only classes they are
 * assigned to — "same school" is not sufficient for taking attendance or
 * grading, and treating it as sufficient is the most tempting shortcut here.
 */
export async function assertClassAccess(
  ctx: { schoolId: string; membershipId: string; role: Role },
  classId: string,
  opts: { write?: boolean } = {},
) {
  refuseModuleRole(ctx.role);
  const klass = await db.class.findFirst({
    where: {
      id: classId,
      schoolId: ctx.schoolId, // <- tenant boundary, always present
      ...(isTeachingRole(ctx.role)
        ? { teachers: { some: { teacherMembershipId: ctx.membershipId } } }
        : {}),
    },
    include: {
      teachers: { select: { teacherMembershipId: true, role: true } },
    },
  });

  if (!klass) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
  if (opts.write && ctx.role === "STUDENT") throw new AccessError("access.studentsCannotEditAClass");
  if (klass.archivedAt && opts.write) throw new AccessError("access.thisClassIsArchived");
  return klass;
}

/** A student membership the caller may read. */
export async function assertStudentAccess(
  ctx: { schoolId: string; membershipId: string; role: Role },
  studentMembershipId: string,
) {
  refuseModuleRole(ctx.role);
  const student = await db.membership.findFirst({
    where: {
      id: studentMembershipId,
      schoolId: ctx.schoolId,
      role: "STUDENT",
      ...(isTeachingRole(ctx.role)
        ? {
            // Only students in a class this teacher actually teaches.
            enrollments: {
              some: {
                status: "ACTIVE",
                class: { teachers: { some: { teacherMembershipId: ctx.membershipId } } },
              },
            },
          }
        : {}),
    },
    include: { user: { select: { id: true, name: true, preferredName: true, avatarKey: true } } },
  });

  if (!student) throw new AccessError("access.studentNotFoundInYourClasses", "NOT_FOUND");
  return student;
}

/**
 * A child the signed-in parent actually guards.
 *
 * AND, FOR AN ADULT AT A COLLEGE, WHAT THE CHILD HAS LET THEM SEE (4 Oct
 * 2026; src/lib/student-consent.ts). A door names the grant its page is
 * about — ATTENDANCE, RESULTS, MONEY, HOSTEL_TRANSPORT, PLACEMENT, MESSAGES —
 * and a guardian of a student who is not a minor at a COLLEGE or an
 * AUTONOMOUS_COLLEGE passes only while that grant is on. A door that names
 * none is refused for such a student outright: default-deny, so a family page
 * written before colleges existed shows an adult's guardian nothing until it
 * says which grant it is. A minor's guardian, and every guardian at a school
 * or a junior college, passes as before.
 */
export async function assertGuardianAccess(parentUserId: string, studentMembershipId: string, grant?: StudentConsentGrant) {
  const link = await db.guardianship.findFirst({
    where: {
      parentUserId,
      studentMembershipId,
      status: "ACTIVE",
    },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, preferredName: true, avatarKey: true, birthdate: true, isMinor: true } },
          school: { select: { id: true, name: true, timezone: true, brandPrimary: true, logoPath: true, kind: true } },
        },
      },
    },
  });

  if (!link) throw new AccessError("access.notYourChild", "NOT_FOUND");
  if (isCollegeKind(link.student.school.kind) && !link.student.user.isMinor) {
    if (!grant || !(await parentMaySee(studentMembershipId, grant))) throw new AccessError("consent.refuseNotGranted");
  }
  return link;
}

export async function assertAssignmentAccess(
  ctx: { schoolId: string; membershipId: string; role: Role },
  assignmentId: string,
) {
  refuseModuleRole(ctx.role);
  const assignment = await db.assignment.findFirst({
    where: {
      id: assignmentId,
      schoolId: ctx.schoolId,
      ...(isTeachingRole(ctx.role)
        ? { class: { teachers: { some: { teacherMembershipId: ctx.membershipId } } } }
        : {}),
      ...(ctx.role === "STUDENT"
        ? {
            publishedAt: { not: null },
            class: { enrollments: { some: { studentMembershipId: ctx.membershipId, status: "ACTIVE" } } },
          }
        : {}),
    },
    include: { class: { select: { id: true, name: true } } },
  });

  if (!assignment) throw new AccessError("access.assignmentNotFound", "NOT_FOUND");
  return assignment;
}

/**
 * A remark thread. Visible to the teacher who owns it, an admin of the school,
 * and the guardians of the student — nobody else, including other teachers at
 * the same school.
 */
export async function assertRemarkAccess(
  session: ActiveContext,
  threadId: string,
) {
  const thread = await db.remarkThread.findUnique({
    where: { id: threadId },
    include: {
      student: { include: { user: { select: { name: true, preferredName: true, avatarKey: true } } } },
      teacher: { include: { user: { select: { name: true, avatarKey: true } } } },
    },
  });
  if (!thread) throw new AccessError("access.threadNotFound", "NOT_FOUND");

  const { role, schoolId, membershipId, user } = session;

  if (role === "TEACHER" && schoolId === thread.schoolId && membershipId === thread.teacherMembershipId) {
    return thread;
  }
  if ((role === "ADMIN" || role === "PRINCIPAL") && schoolId === thread.schoolId) return thread;

  /**
   * THE CHILD THE THREAD IS ABOUT, who was the one participant missing from
   * their own conversation.
   *
   * A thread has always been keyed on (student, teacher) and has always been
   * readable by that child's guardians — so the room was already the right
   * shape and the child was standing outside it. Letting them in is what makes
   * this one common chat rather than a teacher talking to a parent about
   * somebody in the third person.
   *
   * AND IT IS WHY A SEPARATE TEACHER-TO-CHILD CHAT IS NOT BEING BUILT. A
   * private channel between an adult and a pupil, with nobody else in it, is
   * the shape safeguarding policy exists to prevent. Here the guardians are in
   * the room by construction and the school's admin can read it, so a message
   * to a child is never unobserved.
   */
  if (
    role === "STUDENT" &&
    schoolId === thread.schoolId &&
    membershipId === thread.studentMembershipId
  ) {
    return thread;
  }

  const guardian = await db.guardianship.findFirst({
    where: {
      parentUserId: user.id,
      studentMembershipId: thread.studentMembershipId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  // An adult at a college decides whether their guardian is in the room (MESSAGES, student-consent.ts).
  if (guardian && (await parentMaySee(thread.studentMembershipId, "MESSAGES"))) return thread;

  throw new AccessError("access.threadNotFound", "NOT_FOUND");
}

/* -------------------------------------------------------------------------- */
/* Scoped query helpers                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns filters pre-bound to the caller's school. Using these instead of
 * hand-writing `where` keeps `schoolId` from being forgotten on a hurried
 * addition six months from now.
 */
export function scope(schoolId: string) {
  return {
    school: { id: schoolId },
    where: { schoolId },
    /** Merge extra conditions while guaranteeing schoolId survives. */
    and<T extends Record<string, unknown>>(extra: T) {
      return { ...extra, schoolId } as T & { schoolId: string };
    },
  };
}

/** Class ids a teacher is assigned to, for list queries. */
export async function teacherClassIds(schoolId: string, membershipId: string): Promise<string[]> {
  const rows = await db.classTeacher.findMany({
    where: { teacherMembershipId: membershipId, class: { schoolId, archivedAt: null } },
    select: { classId: true },
  });
  return rows.map((r) => r.classId);
}
