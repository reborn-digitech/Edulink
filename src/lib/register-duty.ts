import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import type { ActiveContext } from "./session";

/**
 * Who may take a class's register today.
 *
 * ONE FUNCTION, ASKED BY EVERYTHING. Before this, "may I mark this register?"
 * was answered by `assertClassAccess` — which really answers a different
 * question, "is this class mine at all?" — and the two are not the same. A
 * visiting music teacher attached to six classes is legitimately theirs and
 * should be marking none of their registers. Leaving one question to stand in
 * for the other is how a permission ends up meaning whatever the last caller
 * needed it to mean.
 *
 * The order below IS the policy, and each rule earns its place:
 *
 *   1. An ADMIN, always. Not a convenience: it is the last failsafe. If a class
 *      teacher is ill, their cover is ill, and nobody set anything up, the
 *      register still has to be taken this morning — and the person who can fix
 *      the underlying mess is the same person who can mark it.
 *
 *   2. Anyone covering, on a date inside their cover. Covers ADD; see the model.
 *
 *   3. A class teacher whose `canTakeAttendance` is on.
 *
 * A PRINCIPAL is deliberately absent. They read the school and decide who may be
 * away; marking a register is the one thing they are not for, and adding them
 * "because they are senior" is exactly how a role stops meaning anything.
 */

export type DutyReason = "ADMIN" | "COVER" | "CLASS_TEACHER" | "NONE";

export type RegisterDuty = {
  may: boolean;
  reason: DutyReason;
  /** Populated when a cover is what granted it — the UI says so out loud. */
  coverUntil?: string;
};

/** Everyone who may mark this class's register on this date. */
export async function registerTakersFor(
  schoolId: string,
  classId: string,
  dateKey: string,
): Promise<{ classTeachers: string[]; covering: string[] }> {
  const [teachers, covers] = await Promise.all([
    db.classTeacher.findMany({
      where: { schoolId, classId, canTakeAttendance: true },
      select: { teacherMembershipId: true },
    }),
    db.attendanceCover.findMany({
      // String comparison, and it is exact rather than lucky: YYYY-MM-DD sorts
      // lexicographically in the same order it sorts chronologically, which is
      // the whole reason this codebase stores date keys in that shape.
      where: { schoolId, classId, fromDateKey: { lte: dateKey }, toDateKey: { gte: dateKey } },
      select: { coveringMembershipId: true },
    }),
  ]);

  return {
    classTeachers: teachers.map((t) => t.teacherMembershipId),
    covering: covers.map((c) => c.coveringMembershipId),
  };
}

/** May THIS person mark THIS register on THIS date, and on what grounds. */
export async function registerDuty(
  ctx: Pick<ActiveContext, "role" | "schoolId" | "membershipId">,
  classId: string,
  dateKey: string,
): Promise<RegisterDuty> {
  if (!ctx.schoolId || !ctx.membershipId) return { may: false, reason: "NONE" };

  // The class must be in this school before anything else is asked. Without
  // this, a guessed class id from another school would be answered on its
  // merits rather than refused — and the answer might be yes.
  const klass = await db.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId },
    select: { id: true },
  });
  if (!klass) return { may: false, reason: "NONE" };

  if (ctx.role === "ADMIN") return { may: true, reason: "ADMIN" };

  const cover = await db.attendanceCover.findFirst({
    where: {
      schoolId: ctx.schoolId,
      classId,
      coveringMembershipId: ctx.membershipId,
      fromDateKey: { lte: dateKey },
      toDateKey: { gte: dateKey },
    },
    select: { toDateKey: true },
    orderBy: { toDateKey: "desc" },
  });
  if (cover) return { may: true, reason: "COVER", coverUntil: cover.toDateKey };

  if (ctx.role === "TEACHER") {
    const assigned = await db.classTeacher.findFirst({
      where: {
        schoolId: ctx.schoolId,
        classId,
        teacherMembershipId: ctx.membershipId,
        canTakeAttendance: true,
      },
      select: { id: true },
    });
    if (assigned) return { may: true, reason: "CLASS_TEACHER" };
  }

  return { may: false, reason: "NONE" };
}

/** Throwing variant, for the write path. */
export async function assertMayTakeRegister(
  ctx: Pick<ActiveContext, "role" | "schoolId" | "membershipId">,
  classId: string,
  dateKey: string,
): Promise<RegisterDuty> {
  const duty = await registerDuty(ctx, classId, dateKey);
  if (!duty.may) {
    throw new AccessError(
      "You are not down to take this register. Ask an admin to assign it or arrange cover.",
    );
  }
  return duty;
}

/** Every class this person may mark today — the register page's own list. */
export async function classesIMayTake(
  ctx: Pick<ActiveContext, "role" | "schoolId" | "membershipId">,
  dateKey: string,
): Promise<string[]> {
  if (!ctx.schoolId || !ctx.membershipId) return [];

  if (ctx.role === "ADMIN") {
    const all = await db.class.findMany({
      where: { schoolId: ctx.schoolId, archivedAt: null },
      select: { id: true },
    });
    return all.map((c) => c.id);
  }

  const [assigned, covering] = await Promise.all([
    db.classTeacher.findMany({
      where: {
        schoolId: ctx.schoolId,
        teacherMembershipId: ctx.membershipId,
        canTakeAttendance: true,
        class: { archivedAt: null },
      },
      select: { classId: true },
    }),
    db.attendanceCover.findMany({
      where: {
        schoolId: ctx.schoolId,
        coveringMembershipId: ctx.membershipId,
        fromDateKey: { lte: dateKey },
        toDateKey: { gte: dateKey },
        class: { archivedAt: null },
      },
      select: { classId: true },
    }),
  ]);

  return [...new Set([...assigned.map((a) => a.classId), ...covering.map((c) => c.classId)])];
}

/* -------------------------------------------------------------------------- */
/* Admin controls                                                              */
/* -------------------------------------------------------------------------- */

/** Turns a class teacher's register duty on or off. */
export async function setAttendanceRight(
  ctx: ActiveContext,
  classTeacherId: string,
  canTake: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("Only an admin can change who takes a register");
  }

  const row = await db.classTeacher.findFirst({
    where: { id: classTeacherId, schoolId: ctx.schoolId },
    select: { id: true, classId: true, teacherMembershipId: true },
  });
  if (!row) return { ok: false, error: "That teacher is not on this class." };

  // Withdrawing the last one would leave a class whose register only an admin
  // can mark. Allowed, because a school genuinely may not have decided yet — but
  // said out loud rather than discovered on a Monday morning.
  await db.classTeacher.update({
    where: { id: row.id },
    data: { canTakeAttendance: canTake },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: canTake ? "class.attendance.grant" : "class.attendance.revoke",
    targetType: "Class",
    targetId: row.classId,
    meta: { classTeacherId, teacherMembershipId: row.teacherMembershipId },
  });

  return { ok: true };
}

export type CoverInput = {
  classId: string;
  coveringMembershipId: string;
  fromDateKey: string;
  toDateKey: string;
  reason?: string | null;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Arranges cover for a class over a range of days. */
export async function arrangeCover(
  ctx: ActiveContext,
  input: CoverInput,
  opts: { leaveRequestId?: string | null } = {},
): Promise<{ ok: boolean; error?: string; coverId?: string }> {
  // A principal may arrange cover as part of approving leave; an admin may
  // arrange it at any time. A teacher may not hand their own register to
  // somebody else — that is a staffing decision, not a personal one.
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) {
    throw new AccessError("Only an admin or the principal can arrange cover");
  }

  if (!DATE_KEY.test(input.fromDateKey) || !DATE_KEY.test(input.toDateKey)) {
    return { ok: false, error: "Give both dates as YYYY-MM-DD." };
  }
  if (input.toDateKey < input.fromDateKey) {
    return { ok: false, error: "The last day cannot be before the first." };
  }

  const klass = await db.class.findFirst({
    where: { id: input.classId, schoolId: ctx.schoolId },
    select: { id: true, name: true },
  });
  if (!klass) return { ok: false, error: "That class is not in this school." };

  // The person covering must be staff HERE. Checked against the school rather
  // than trusted from the form, like every other id that arrives in a request.
  const covering = await db.membership.findFirst({
    where: {
      id: input.coveringMembershipId,
      schoolId: ctx.schoolId,
      status: "ACTIVE",
      role: { in: ["TEACHER", "ADMIN", "PRINCIPAL"] },
    },
    select: { id: true },
  });
  if (!covering) return { ok: false, error: "That person is not active staff at this school." };

  const cover = await db.attendanceCover.create({
    data: {
      schoolId: ctx.schoolId,
      classId: input.classId,
      coveringMembershipId: input.coveringMembershipId,
      fromDateKey: input.fromDateKey,
      toDateKey: input.toDateKey,
      reason: input.reason?.trim() || null,
      createdByMembershipId: ctx.membershipId,
      leaveRequestId: opts.leaveRequestId ?? null,
    },
    select: { id: true },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "attendance.cover.create",
    targetType: "Class",
    targetId: input.classId,
    meta: {
      coverId: cover.id,
      coveringMembershipId: input.coveringMembershipId,
      from: input.fromDateKey,
      to: input.toDateKey,
    },
  });

  return { ok: true, coverId: cover.id };
}

export async function cancelCover(
  ctx: ActiveContext,
  coverId: string,
): Promise<{ ok: boolean; error?: string }> {
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") || !ctx.schoolId) {
    throw new AccessError("Only an admin or the principal can cancel cover");
  }

  const result = await db.attendanceCover.deleteMany({
    where: { id: coverId, schoolId: ctx.schoolId },
  });
  if (result.count === 0) return { ok: false, error: "That cover no longer exists." };

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "attendance.cover.cancel",
    targetType: "AttendanceCover",
    targetId: coverId,
  });
  return { ok: true };
}

/** Cover arranged for a class, or for the whole school, from a date onwards. */
export async function listCovers(
  ctx: ActiveContext,
  opts: { classId?: string; fromDateKey?: string } = {},
) {
  if (!ctx.schoolId) return [];
  if (ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL") {
    throw new AccessError("Only an admin or the principal can see the cover list");
  }

  return db.attendanceCover.findMany({
    where: {
      schoolId: ctx.schoolId,
      ...(opts.classId ? { classId: opts.classId } : {}),
      ...(opts.fromDateKey ? { toDateKey: { gte: opts.fromDateKey } } : {}),
    },
    orderBy: [{ fromDateKey: "asc" }],
    select: {
      id: true,
      classId: true,
      fromDateKey: true,
      toDateKey: true,
      reason: true,
      leaveRequestId: true,
      class: { select: { name: true, section: true, gradeLevel: true } },
      covering: {
        select: {
          id: true,
          user: { select: { name: true, preferredName: true } },
        },
      },
    },
    take: 200,
  });
}
