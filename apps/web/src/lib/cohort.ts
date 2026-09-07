import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { syncStandinGuardian, syncStandinsForClass } from "./standin-guardian";
import type { ActiveContext } from "./session";

/**
 * The children in a class, and the staff responsible for it.
 *
 * UNTIL NOW A CLASS FILLED ITSELF. The only routes into an Enrollment row were a
 * child typing a join code and a child accepting an invitation — which is fine
 * for a school that runs on codes and useless for one whose admin has a list of
 * thirty names and a term starting on Monday. This is that second school.
 *
 * REMOVING A CHILD DOES NOT DELETE THE ROW. `status` goes to REMOVED and
 * `removedAt` is stamped, because the enrolment is what every attendance record
 * and every mark in that class hangs off. Deleting it would take a term of a
 * child's history with it to tidy up a list — and re-adding them later would
 * silently orphan the marks they had already earned. It is the same rule as
 * archiving a class rather than deleting it. (§10)
 */

export type CohortMember = {
  membershipId: string;
  enrollmentId: string;
  name: string;
  gradeLevel: string | null;
  studentCode: string | null;
  avatarKey: string | null;
};

export type Candidate = {
  membershipId: string;
  name: string;
  gradeLevel: string | null;
  /** Classes they are already in, so an admin does not double-enrol by accident. */
  alreadyIn: string[];
};

async function assertAdminOfClass(ctx: ActiveContext, classId: string) {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanChangeAClass");
  }
  const klass = await db.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId },
    select: { id: true, name: true, gradeLevel: true },
  });
  if (!klass) throw new AccessError("access.thatClassIsNotInThisSchool", "NOT_FOUND");
  return klass;
}

/** The children currently in this class. */
export async function listCohort(ctx: ActiveContext, classId: string): Promise<CohortMember[]> {
  if (!ctx.schoolId) return [];

  const rows = await db.enrollment.findMany({
    where: { schoolId: ctx.schoolId, classId, status: "ACTIVE" },
    select: {
      id: true,
      studentMembershipId: true,
      student: {
        select: {
          gradeLevel: true,
          studentCode: true,
          user: { select: { name: true, preferredName: true, avatarKey: true } },
        },
      },
    },
  });

  return rows
    .map((row) => ({
      membershipId: row.studentMembershipId,
      enrollmentId: row.id,
      name: row.student.user.preferredName ?? row.student.user.name,
      gradeLevel: row.student.gradeLevel,
      studentCode: row.student.studentCode,
      avatarKey: row.student.user.avatarKey,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Children in the school who could be added to this class.
 *
 * SUGGESTS BY GRADE, DOES NOT FILTER BY IT. A class tagged Grade 5 puts the
 * Grade 5 children first, because that is almost always who is wanted — but a
 * child repeating a year, or taking maths a year up, is an ordinary thing and a
 * hard filter would make them unaddable. Ordering is a hint; a filter is a rule.
 */
export async function candidatesFor(
  ctx: ActiveContext,
  classId: string,
  query = "",
): Promise<Candidate[]> {
  const klass = await assertAdminOfClass(ctx, classId);
  const trimmed = query.trim().slice(0, 80);

  const [enrolled, students] = await Promise.all([
    db.enrollment.findMany({
      where: { schoolId: ctx.schoolId!, classId, status: "ACTIVE" },
      select: { studentMembershipId: true },
    }),
    db.membership.findMany({
      where: {
        schoolId: ctx.schoolId!,
        role: "STUDENT",
        status: "ACTIVE",
        leftAt: null,
        ...(trimmed
          ? {
              user: {
                OR: [
                  { name: { contains: trimmed, mode: "insensitive" as const } },
                  { preferredName: { contains: trimmed, mode: "insensitive" as const } },
                ],
              },
            }
          : {}),
      },
      select: {
        id: true,
        gradeLevel: true,
        user: { select: { name: true, preferredName: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          select: { class: { select: { name: true } } },
        },
      },
      take: 400,
    }),
  ]);

  const already = new Set(enrolled.map((e) => e.studentMembershipId));

  return students
    .filter((s) => !already.has(s.id))
    .map((s) => ({
      membershipId: s.id,
      name: s.user.preferredName ?? s.user.name,
      gradeLevel: s.gradeLevel,
      alreadyIn: s.enrollments.map((e) => e.class.name),
    }))
    .sort((a, b) => {
      // Same grade as the class first, then alphabetical inside each group.
      const aMatch = klass.gradeLevel && a.gradeLevel === klass.gradeLevel ? 0 : 1;
      const bMatch = klass.gradeLevel && b.gradeLevel === klass.gradeLevel ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.name.localeCompare(b.name);
    });
}

/** ⚠ `errorKey`, not a sentence — translated at the boundary. */
export type EnrolResult = { ok: boolean; added: number; errorKey?: TranslationKey };

/** Adds children to a class. Idempotent, and safe to call with a mixed list. */
export async function enrolStudents(
  ctx: ActiveContext,
  classId: string,
  studentMembershipIds: string[],
): Promise<EnrolResult> {
  await assertAdminOfClass(ctx, classId);

  const ids = [...new Set(studentMembershipIds)].slice(0, 500);
  if (ids.length === 0) return { ok: false, added: 0, errorKey: "refusal.nobodySelected" };

  // Re-queried with the school AND the role in the WHERE clause, so a membership
  // id copied from anywhere — another school, or a teacher's — simply is not
  // found. The ids come from the client; the filter does not.
  const valid = await db.membership.findMany({
    where: {
      id: { in: ids },
      schoolId: ctx.schoolId!,
      role: "STUDENT",
      status: "ACTIVE",
      leftAt: null,
    },
    select: { id: true },
  });
  if (valid.length === 0) {
    return { ok: false, added: 0, errorKey: "refusal.notPupilsHere" };
  }

  let added = 0;
  for (const student of valid) {
    // Upsert rather than create: a child removed from this class last term has
    // a row already, and the unique index is on (classId, studentMembershipId).
    // Re-adding must revive that row so their old attendance still belongs to
    // an enrolment, rather than failing on the constraint.
    const result = await db.enrollment.upsert({
      where: {
        classId_studentMembershipId: { classId, studentMembershipId: student.id },
      },
      create: {
        classId,
        schoolId: ctx.schoolId!,
        studentMembershipId: student.id,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE", removedAt: null },
      select: { id: true },
    });
    if (result) added++;
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "class.cohort.add",
    targetType: "Class",
    targetId: classId,
    meta: { requested: ids.length, added },
  });

  // Joining a class can change who the right stand-in guardian is — the class
  // teacher takes over from the admin fallback. Per pupil, not per class: only
  // the children just added moved.
  for (const student of valid) {
    await syncStandinGuardian({
      schoolId: ctx.schoolId!,
      studentMembershipId: student.id,
      actorUserId: ctx.user.id,
    }).catch((error) => console.error("[enrolStudents] standin sync failed", error));
  }

  return { ok: true, added };
}

/** Takes a child off a class roll, keeping everything they did in it. */
export async function removeFromCohort(
  ctx: ActiveContext,
  classId: string,
  studentMembershipId: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  await assertAdminOfClass(ctx, classId);

  const result = await db.enrollment.updateMany({
    where: { classId, schoolId: ctx.schoolId!, studentMembershipId, status: "ACTIVE" },
    data: { status: "REMOVED", removedAt: new Date() },
  });
  if (result.count === 0) return { ok: false, errorKey: "refusal.notOnRoll" };

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "class.cohort.remove",
    targetType: "Class",
    targetId: classId,
    meta: { studentMembershipId },
  });

  // Off the roll means this class's teacher is no longer the pupil's teacher;
  // the stand-in falls to their other class's teacher or the admin fallback.
  await syncStandinGuardian({
    schoolId: ctx.schoolId!,
    studentMembershipId,
    actorUserId: ctx.user.id,
  }).catch((error) => console.error("[removeFromCohort] standin sync failed", error));

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Staff                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Puts a teacher on a class, or takes them off.
 *
 * `role` is LEAD or CO, and LEAD is what a school means by "class teacher": the
 * one who takes the register and writes the report card. There is deliberately
 * no database constraint that a class has exactly one LEAD — a job share is real,
 * and a school mid-handover genuinely has two for a fortnight. What there IS is
 * a warning on the page when a class has none, because that is the case nobody
 * intends.
 */
export async function assignTeacher(
  ctx: ActiveContext,
  classId: string,
  teacherMembershipId: string,
  // SUBJECT is the visiting-specialist shape: teaches lessons on the
  // timetable, never marks the register. Per class, deliberately — the same
  // person is often the class teacher of one class and the subject teacher of
  // three others.
  opts: { role?: "LEAD" | "CO" | "SUBJECT"; canTakeAttendance?: boolean } = {},
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  await assertAdminOfClass(ctx, classId);

  const teacher = await db.membership.findFirst({
    where: {
      id: teacherMembershipId,
      schoolId: ctx.schoolId!,
      // A principal may be a class teacher in a small school, where the head
      // teaches Class 5 on Tuesdays. An admin may not — that is an office role.
      role: { in: ["TEACHER", "PRINCIPAL"] },
      status: "ACTIVE",
      leftAt: null,
    },
    select: { id: true },
  });
  if (!teacher) return { ok: false, errorKey: "refusal.notTeachingStaff" };

  const role = opts.role ?? "LEAD";
  await db.classTeacher.upsert({
    where: { classId_teacherMembershipId: { classId, teacherMembershipId } },
    create: {
      classId,
      schoolId: ctx.schoolId!,
      teacherMembershipId,
      role,
      // A class teacher takes the register unless told otherwise; a co-teacher
      // does not, unless told otherwise. The common case for each, either way
      // overridable from the same page.
      canTakeAttendance: opts.canTakeAttendance ?? role === "LEAD",
    },
    update: {
      role,
      ...(opts.canTakeAttendance === undefined ? {} : { canTakeAttendance: opts.canTakeAttendance }),
    },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "class.teacher.assign",
    targetType: "Class",
    targetId: classId,
    meta: { teacherMembershipId, role },
  });

  // A new class teacher takes over the stand-in guardianships of the class's
  // unclaimed pupils in the same action — see standin-guardian.ts.
  await syncStandinsForClass({ schoolId: ctx.schoolId!, classId, actorUserId: ctx.user.id }).catch(
    (error) => console.error("[assignTeacher] standin sync failed", error),
  );

  return { ok: true };
}

export async function unassignTeacher(
  ctx: ActiveContext,
  classId: string,
  teacherMembershipId: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  await assertAdminOfClass(ctx, classId);

  const result = await db.classTeacher.deleteMany({
    where: { classId, schoolId: ctx.schoolId!, teacherMembershipId },
  });
  if (result.count === 0) return { ok: false, errorKey: "refusal.notOnClass" };

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "class.teacher.remove",
    targetType: "Class",
    targetId: classId,
    meta: { teacherMembershipId },
  });

  // The departing teacher's stand-in guardianships pass to whoever now holds
  // the class — the remaining LEAD or CO, or the admin fallback.
  await syncStandinsForClass({ schoolId: ctx.schoolId!, classId, actorUserId: ctx.user.id }).catch(
    (error) => console.error("[unassignTeacher] standin sync failed", error),
  );

  return { ok: true };
}
