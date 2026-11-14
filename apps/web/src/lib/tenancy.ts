import "server-only";
import { ROLE_HOME } from "./constants";
import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession, type ActiveContext } from "./session";
import { isLimitedRole, isTeachingRole, type Role } from "./constants";
import { isCollegeKind, type StudentConsentGrant } from "@edulink/contracts";
import { isMinorToday, parentMaySee } from "./student-consent";

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
  // UNAUTHENTICATED, as every other door says it (campaign W-11): the phone signs out on a 401, never on a 403.
  if (!session) throw new AccessError("access.pleaseLogInAgain", "UNAUTHENTICATED");
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
    select: { id: true, publishedAt: true, disabledAt: true },
  });
  // Closed by the operator (G4-28): no expert area, as no recruiter area for a closed recruiter.
  if (!profile || profile.disabledAt) redirect("/switch");
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

/* -------------------------------------------------------------------------- */
/* Who teaches a class                                                         */
/* -------------------------------------------------------------------------- */

/*
 * TWO WAYS TO TEACH A CLASS (owner's item 1, 27 Oct 2026). A ClassTeacher row
 * (LEAD, CO or SUBJECT) makes a teacher one of the class's own: the register
 * (with canTakeAttendance), the report cards, the weights, every piece of work
 * set to it. A lesson on the timetable — one TimetableSlot naming them for
 * that class — makes a TEACHER the teacher of that subject there: they set
 * and grade their own work, move the syllabus and plan lessons in that
 * subject, and write about the pupils they teach. Exam marks drew the same
 * line first (exams.ts assertMayEnterMarks, examClassesFor).
 *
 * A college's FACULTY and HOD keep the ClassTeacher rule alone: their
 * lectures and gates are the college's own (academics), and the timetable
 * path is a school's.
 */
const classTeacherWhere = (membershipId: string) => ({ teachers: { some: { teacherMembershipId: membershipId } } });
const lessonWhere = (membershipId: string) => ({ timetableSlots: { some: { teacherMembershipId: membershipId } } });

/** A Class `where` a teaching role passes: a ClassTeacher row, or (a school's TEACHER) a lesson on the timetable. */
export function taughtClassWhere(role: Role, membershipId: string) {
  return role === "TEACHER" ? { OR: [classTeacherWhere(membershipId), lessonWhere(membershipId)] } : classTeacherWhere(membershipId);
}

/** How one teacher teaches one class: as one of its own (`formTeacher`), and the timetable's subjects they take there. */
export type ClassTeaching = { formTeacher: boolean; subjects: string[] };

const tidySubject = (s: string) => s.trim().replace(/\s+/g, " ");

/** Distinct subjects, case-insensitively, kept as first spelt. */
function distinctSubjects(subjects: string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of subjects) {
    const s = tidySubject(raw);
    if (s && !seen.has(s.toLowerCase())) seen.set(s.toLowerCase(), s);
  }
  return [...seen.values()];
}

/**
 * Every living class a teacher teaches, either way, with how. A class held
 * through a ClassTeacher row is `formTeacher` whatever the timetable says;
 * `subjects` are the timetable's for this teacher in that class, in the
 * order the week first meets them.
 */
export async function taughtClasses(schoolId: string, membershipId: string): Promise<Map<string, ClassTeaching>> {
  const [rows, slots] = await Promise.all([
    db.classTeacher.findMany({ where: { teacherMembershipId: membershipId, class: { schoolId, archivedAt: null } }, select: { classId: true } }),
    db.timetableSlot.findMany({
      where: { schoolId, teacherMembershipId: membershipId, class: { archivedAt: null } },
      select: { classId: true, subject: true },
      orderBy: [{ weekday: "asc" }, { period: { position: "asc" } }],
    }),
  ]);
  const out = new Map<string, ClassTeaching>();
  for (const row of rows) out.set(row.classId, { formTeacher: true, subjects: [] });
  const subjectsBy = new Map<string, string[]>();
  for (const slot of slots) subjectsBy.set(slot.classId, [...(subjectsBy.get(slot.classId) ?? []), slot.subject]);
  for (const [classId, subjects] of subjectsBy) {
    out.set(classId, { formTeacher: out.get(classId)?.formTeacher ?? false, subjects: distinctSubjects(subjects) });
  }
  return out;
}

/**
 * How the caller teaches one class, or null when they do not. The office
 * (and the head) reach every class whole: `formTeacher` true, no subjects of
 * their own. A FACULTY or HOD is asked the ClassTeacher question alone.
 */
export async function teachesClass(
  ctx: { schoolId: string; membershipId: string; role: Role },
  classId: string,
): Promise<ClassTeaching | null> {
  if (!isTeachingRole(ctx.role)) return { formTeacher: true, subjects: [] };
  const [row, slots] = await Promise.all([
    db.classTeacher.findFirst({ where: { classId, schoolId: ctx.schoolId, teacherMembershipId: ctx.membershipId }, select: { id: true } }),
    ctx.role === "TEACHER"
      ? db.timetableSlot.findMany({ where: { classId, schoolId: ctx.schoolId, teacherMembershipId: ctx.membershipId }, select: { subject: true }, orderBy: [{ weekday: "asc" }, { period: { position: "asc" } }] })
      : Promise.resolve([] as { subject: string }[]),
  ]);
  if (!row && slots.length === 0) return null;
  return { formTeacher: Boolean(row), subjects: distinctSubjects(slots.map((s) => s.subject)) };
}

/** Whether a subject is one of a list, as the timetable compares them: case and spacing aside. Returns the list's spelling. */
export function matchSubject(subjects: string[], subject: string): string | null {
  const wanted = tidySubject(subject).toLowerCase();
  return subjects.find((s) => tidySubject(s).toLowerCase() === wanted) ?? null;
}

/**
 * A class the caller may act on.
 *
 * Admins get any class in their school. Teachers get only classes they
 * teach — "same school" is not sufficient for taking attendance or
 * grading, and treating it as sufficient is the most tempting shortcut here.
 * A TEACHER teaches a class through a ClassTeacher row or a lesson on the
 * timetable (taughtClassWhere); `formTeacher: true` asks for the row alone,
 * for what stays the class's own teachers' (the register's boundary, the
 * grade weights, the whole-class marks sheet).
 */
export async function assertClassAccess(
  ctx: { schoolId: string; membershipId: string; role: Role },
  classId: string,
  opts: { write?: boolean; formTeacher?: boolean } = {},
) {
  refuseModuleRole(ctx.role);
  const klass = await db.class.findFirst({
    where: {
      id: classId,
      schoolId: ctx.schoolId, // <- tenant boundary, always present
      ...(isTeachingRole(ctx.role)
        ? opts.formTeacher
          ? classTeacherWhere(ctx.membershipId)
          : taughtClassWhere(ctx.role, ctx.membershipId)
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
  /**
   * `formTeacher: true` asks for a class the teacher holds a ClassTeacher row for: the pupil's health card
   * and pupil record stay with the class's own teachers and the office (owner's item 1, 27 Oct 2026).
   */
  opts: { formTeacher?: boolean } = {},
) {
  refuseModuleRole(ctx.role);
  const student = await db.membership.findFirst({
    where: {
      id: studentMembershipId,
      schoolId: ctx.schoolId,
      role: "STUDENT",
      ...(isTeachingRole(ctx.role)
        ? {
            // Only students in a class this teacher actually teaches: a
            // ClassTeacher row, or a lesson on the timetable (taughtClassWhere).
            enrollments: {
              some: {
                status: "ACTIVE",
                class: opts.formTeacher ? classTeacherWhere(ctx.membershipId) : taughtClassWhere(ctx.role, ctx.membershipId),
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
  if (isCollegeKind(link.student.school.kind) && !isMinorToday(link.student.user, link.student.school.timezone)) {
    if (!grant || !(await parentMaySee(studentMembershipId, grant))) throw new AccessError("consent.refuseNotGranted");
  }
  return link;
}

export async function assertAssignmentAccess(
  ctx: { schoolId: string; membershipId: string; role: Role },
  assignmentId: string,
) {
  refuseModuleRole(ctx.role);
  /*
   * A COLLEGE OFFERING'S WORK (R-48, 5 Oct 2026): set to a CourseOffering
   * rather than a class. Its teacher is the offering's faculty member or the
   * HOD of the department whose programme owns the course; its pupils are the
   * offering's REGISTERED students. Exactly one of the two branches matches a
   * row, since a row carries exactly one of classId and offeringId.
   */
  const assignment = await db.assignment.findFirst({
    where: {
      id: assignmentId,
      schoolId: ctx.schoolId,
      ...(isTeachingRole(ctx.role)
        ? {
            OR: [
              { class: classTeacherWhere(ctx.membershipId) },
              // A TEACHER the timetable sends to the class reaches the work THEY set there, not the
              // rest of the class's (owner's item 1, 27 Oct 2026): the form teacher's homework is not
              // the English teacher's to mark.
              ...(ctx.role === "TEACHER" ? [{ authorMembershipId: ctx.membershipId, class: lessonWhere(ctx.membershipId) }] : []),
              { offering: { facultyMembershipId: ctx.membershipId } },
              ...(ctx.role === "HOD" ? [{ offering: { course: { scheme: { programme: { department: { hodMembershipId: ctx.membershipId } } } } } }] : []),
            ],
          }
        : {}),
      ...(ctx.role === "STUDENT"
        ? {
            publishedAt: { not: null },
            OR: [
              { class: { enrollments: { some: { studentMembershipId: ctx.membershipId, status: "ACTIVE" } } } },
              { offering: { registrations: { some: { studentMembershipId: ctx.membershipId, status: "REGISTERED" } } } },
            ],
          }
        : {}),
    },
    include: { class: { select: { id: true, name: true } }, offering: { select: { id: true, course: { select: { code: true, name: true } } } } },
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

  // A college's FACULTY and HOD teach a class as a teacher does (invite/[token]/actions.ts), so a pupil or guardian may
  // open a thread with them (teachersForStudent); they read and answer it as its teacher (TA-212).
  if ((role === "TEACHER" || role === "FACULTY" || role === "HOD") && schoolId === thread.schoolId && membershipId === thread.teacherMembershipId) {
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

/**
 * Class ids a teacher teaches, for list queries: a ClassTeacher row or a
 * lesson on the timetable (taughtClasses). The pickers, the classes list, the
 * assignments list and a teacher's live channels read this.
 */
export async function teacherClassIds(schoolId: string, membershipId: string): Promise<string[]> {
  return [...(await taughtClasses(schoolId, membershipId)).keys()];
}

/**
 * The classes a teacher holds a ClassTeacher row for — their form classes.
 * What is built on registers reads this and not teacherClassIds: the Today
 * page's form classes and "registers left", whose classes a timetable-only
 * teacher may not mark.
 */
export async function formClassIds(schoolId: string, membershipId: string): Promise<string[]> {
  const rows = await db.classTeacher.findMany({
    where: { teacherMembershipId: membershipId, class: { schoolId, archivedAt: null } },
    select: { classId: true },
  });
  return rows.map((r) => r.classId);
}
