import "server-only";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession, type ActiveContext } from "./session";
import type { Role } from "./constants";

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

export class AccessError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "AccessError";
  }
}

/* -------------------------------------------------------------------------- */
/* Session gates                                                               */
/* -------------------------------------------------------------------------- */

export async function requireUser(): Promise<ActiveContext> {
  const session = await getSession();
  if (!session) redirect("/login");
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
  if (!session) throw new AccessError("Not signed in", "UNAUTHENTICATED");
  if (!session.role || !roles.includes(session.role as R)) {
    throw new AccessError("Wrong role for this action");
  }
  if (!session.schoolId || !session.membershipId) {
    throw new AccessError("No active school selected");
  }
  return session as ActiveContext & { role: R; schoolId: string; membershipId: string };
}

function roleHome(role: Role): string {
  return { ADMIN: "/admin", TEACHER: "/teacher", STUDENT: "/student", PARENT: "/parent" }[role];
}

/* -------------------------------------------------------------------------- */
/* Resource assertions — the client supplies an id, we supply the scope        */
/* -------------------------------------------------------------------------- */

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
  const klass = await db.class.findFirst({
    where: {
      id: classId,
      schoolId: ctx.schoolId, // <- tenant boundary, always present
      ...(ctx.role === "TEACHER"
        ? { teachers: { some: { teacherMembershipId: ctx.membershipId } } }
        : {}),
    },
    include: {
      teachers: { select: { teacherMembershipId: true, role: true } },
    },
  });

  if (!klass) throw new AccessError("Class not found in your school", "NOT_FOUND");
  if (opts.write && ctx.role === "STUDENT") throw new AccessError("Students cannot edit a class");
  if (klass.archivedAt && opts.write) throw new AccessError("This class is archived");
  return klass;
}

/** A student membership the caller may read. */
export async function assertStudentAccess(
  ctx: { schoolId: string; membershipId: string; role: Role },
  studentMembershipId: string,
) {
  const student = await db.membership.findFirst({
    where: {
      id: studentMembershipId,
      schoolId: ctx.schoolId,
      role: "STUDENT",
      ...(ctx.role === "TEACHER"
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

  if (!student) throw new AccessError("Student not found in your classes", "NOT_FOUND");
  return student;
}

/** A child the signed-in parent actually guards. */
export async function assertGuardianAccess(parentUserId: string, studentMembershipId: string) {
  const link = await db.guardianship.findFirst({
    where: {
      parentUserId,
      studentMembershipId,
      status: "ACTIVE",
    },
    include: {
      student: {
        include: {
          user: { select: { id: true, name: true, preferredName: true, avatarKey: true, birthdate: true } },
          school: { select: { id: true, name: true, timezone: true, brandPrimary: true, logoPath: true } },
        },
      },
    },
  });

  if (!link) throw new AccessError("Not your child", "NOT_FOUND");
  return link;
}

export async function assertAssignmentAccess(
  ctx: { schoolId: string; membershipId: string; role: Role },
  assignmentId: string,
) {
  const assignment = await db.assignment.findFirst({
    where: {
      id: assignmentId,
      schoolId: ctx.schoolId,
      ...(ctx.role === "TEACHER"
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

  if (!assignment) throw new AccessError("Assignment not found", "NOT_FOUND");
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
  if (!thread) throw new AccessError("Thread not found", "NOT_FOUND");

  const { role, schoolId, membershipId, user } = session;

  if (role === "TEACHER" && schoolId === thread.schoolId && membershipId === thread.teacherMembershipId) {
    return thread;
  }
  if (role === "ADMIN" && schoolId === thread.schoolId) return thread;

  const guardian = await db.guardianship.findFirst({
    where: {
      parentUserId: user.id,
      studentMembershipId: thread.studentMembershipId,
      status: "ACTIVE",
    },
    select: { id: true },
  });
  if (guardian) return thread;

  throw new AccessError("Thread not found", "NOT_FOUND");
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
