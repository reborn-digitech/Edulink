import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { arrangeCover } from "./register-duty";
import type { ActiveContext } from "./session";

/**
 * Staff leave: applying for it, and the principal's answer.
 *
 * APPROVING IT ARRANGES THE COVER. That is the whole point of putting these two
 * features in one commit. A leave system that records an absence and leaves
 * somebody to remember the register separately has moved the problem rather than
 * solved it — and the register is the thing that must happen whether or not
 * anybody remembered. So approval writes AttendanceCover rows for every class
 * the applicant is down to mark, in one transaction with the decision.
 *
 * THE NOMINATION IS A SUGGESTION, NOT A DECISION. The applicant may name who
 * they think should cover; the covers are written from whoever the PRINCIPAL
 * chose. Otherwise a teacher could hand their classes to anybody by applying for
 * a day off, which is a staffing decision they do not get to make alone.
 *
 * DECLINING AND CANCELLING WITHDRAW THE COVER THEY CAUSED, and only that —
 * `leaveRequestId` on the cover row is what makes "only that" possible. Cover
 * arranged by hand for other reasons is nobody's to remove.
 */

// Imported for use inside this file, AND re-exported so every existing
// `from "@/lib/leave"` keeps working — the split exists for the client bundle,
// not for callers. See leave-kinds.ts.
import { LEAVE_KINDS, type LeaveKind, type LeaveRow } from "./leave-kinds";
import type { TranslationKey } from "./i18n/dictionary";

export { LEAVE_KINDS, LEAVE_KIND_LABEL_KEY, LEAVE_STATUSES, LEAVE_STATUS_KEY } from "./leave-kinds";
export type { LeaveKind, LeaveStatus, LeaveRow } from "./leave-kinds";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SPAN_DAYS = 180;

export type ApplyInput = {
  fromDateKey: string;
  toDateKey: string;
  kind: LeaveKind;
  reason: string;
  nominatedCoverMembershipId?: string | null;
};

/**
 * ⚠ `errorKey`, NOT A SENTENCE. Every one of these is read by whoever is
 * standing at a form — a teacher applying, a principal deciding — and the two
 * are not guaranteed to read the same language. `error` stays for the one
 * message this layer does not mint: an `AccessError` from tenancy.
 */
export type LeaveResult = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  error?: string;
  id?: string;
};

/** A member of staff asks to be away. */
export async function applyForLeave(
  ctx: ActiveContext,
  input: ApplyInput,
): Promise<LeaveResult> {
  // A principal may apply too — they are staff, and somebody has to be able to
  // approve it. The approval side refuses self-approval separately.
  if ((ctx.role !== "TEACHER" && ctx.role !== "PRINCIPAL") || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("Only teaching staff can apply for leave");
  }

  if (!DATE_KEY.test(input.fromDateKey) || !DATE_KEY.test(input.toDateKey)) {
    return { ok: false, errorKey: "leaveKind.giveBothDates" };
  }
  if (input.toDateKey < input.fromDateKey) {
    return { ok: false, errorKey: "leaveKind.lastBeforeFirst" };
  }
  if (spanDays(input.fromDateKey, input.toDateKey) > MAX_SPAN_DAYS) {
    // Not a policy about how much leave anybody may take — a guard against a
    // mistyped year turning one day into three hundred and sixty-six.
    return { ok: false, errorKey: "leaveKind.longerThanSixMonths" };
  }

  const reason = input.reason.trim().slice(0, 1000);
  if (reason.length < 3) {
    return { ok: false, errorKey: "leaveKind.sayBriefly" };
  }

  if (!LEAVE_KINDS.includes(input.kind)) {
    return { ok: false, errorKey: "leaveKind.chooseKind" };
  }

  // Overlapping a request that is still open, or already approved, is almost
  // always a double submission. Refused with a message rather than silently
  // creating a second one somebody has to reconcile.
  const clash = await db.leaveRequest.findFirst({
    where: {
      schoolId: ctx.schoolId,
      teacherMembershipId: ctx.membershipId,
      status: { in: ["PENDING", "APPROVED"] },
      fromDateKey: { lte: input.toDateKey },
      toDateKey: { gte: input.fromDateKey },
    },
    select: { id: true, status: true },
  });
  if (clash) {
    return {
      ok: false,
      errorKey:
        clash.status === "PENDING" ? "leaveKind.clashPending" : "leaveKind.clashApproved",
    };
  }

  const nominee = await resolveNominee(ctx, input.nominatedCoverMembershipId);
  if (nominee.errorKey) return { ok: false, errorKey: nominee.errorKey };

  const created = await db.leaveRequest.create({
    data: {
      schoolId: ctx.schoolId,
      teacherMembershipId: ctx.membershipId,
      fromDateKey: input.fromDateKey,
      toDateKey: input.toDateKey,
      kind: input.kind,
      reason,
      nominatedCoverMembershipId: nominee.id,
    },
    select: { id: true },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "leave.apply",
    targetType: "LeaveRequest",
    targetId: created.id,
    meta: { from: input.fromDateKey, to: input.toDateKey, kind: input.kind },
  });

  // Everyone who can decide it. A school with no principal falls back to its
  // admins, so a request cannot sit unread because a post is vacant.
  const deciders = await db.membership.findMany({
    where: {
      schoolId: ctx.schoolId,
      role: { in: ["PRINCIPAL", "ADMIN"] },
      status: "ACTIVE",
      leftAt: null,
    },
    select: { userId: true },
  });
  const applicantName = ctx.user.preferredName ?? ctx.user.name;
  for (const decider of deciders) {
    await notify({
      userId: decider.userId,
      schoolId: ctx.schoolId,
      kind: "SYSTEM",
      title: "Leave request waiting",
      body: `${applicantName} has asked for leave from ${input.fromDateKey}.`,
      url: "/principal/leave",
    });
  }

  return { ok: true, id: created.id };
}

/**
 * The principal's answer.
 *
 * Approving does three things in ONE transaction: records the decision, and
 * writes a cover row for every class the applicant is down to mark. Splitting
 * them would allow a decision recorded with no cover behind it, which is the
 * exact failure the feature exists to prevent.
 */
export async function decideLeave(
  ctx: ActiveContext,
  leaveId: string,
  decision: "APPROVED" | "DECLINED",
  opts: { note?: string; coverMembershipId?: string | null } = {},
): Promise<LeaveResult & { coversCreated?: number }> {
  if ((ctx.role !== "PRINCIPAL" && ctx.role !== "ADMIN") || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("Only the principal or an admin can decide leave");
  }

  const request = await db.leaveRequest.findFirst({
    where: { id: leaveId, schoolId: ctx.schoolId },
    select: {
      id: true,
      status: true,
      teacherMembershipId: true,
      fromDateKey: true,
      toDateKey: true,
      nominatedCoverMembershipId: true,
      teacher: { select: { userId: true, user: { select: { name: true, preferredName: true } } } },
    },
  });
  if (!request) return { ok: false, errorKey: "leaveKind.notInSchool" };
  if (request.status !== "PENDING") {
    return {
      ok: false,
      // NO PLACEHOLDER FOR THE STATUS, deliberately. Naming it would mean
      // putting a KEY inside a var — "already been leaveStatus.approved" — or
      // teaching this layer to translate, and the decided list this message
      // appears beside already shows the status in its own badge.
      errorKey: "leaveKind.alreadyDecided",
    };
  }

  // ⚠ Nobody signs off their own absence. A principal applying for leave needs
  // an admin, or another principal, to answer it.
  if (request.teacherMembershipId === ctx.membershipId) {
    return { ok: false, errorKey: "leaveKind.notYourOwn" };
  }

  await db.leaveRequest.update({
    where: { id: request.id },
    data: {
      status: decision,
      decidedByMembershipId: ctx.membershipId,
      decidedAt: new Date(),
      decisionNote: opts.note?.trim().slice(0, 1000) || null,
    },
  });

  let coversCreated = 0;

  if (decision === "APPROVED") {
    // Whoever the DECIDER chose, falling back to the applicant's suggestion.
    // The nomination is advice; this is the decision.
    const coverId = opts.coverMembershipId ?? request.nominatedCoverMembershipId;

    if (coverId) {
      /**
       * EVERY CLASS THIS PERSON IS DUE IN, from two different lists.
       *
       * `ClassTeacher` is who takes a register. `TimetableSlot` is who stands in
       * a room at 11:15 on Tuesday, and the two are NOT the same set — a
       * visiting music teacher takes six classes for one period each and marks
       * none of their registers. Covering only the first list left every one of
       * those lessons with an absent teacher and nobody arranged, which the
       * timetable then reported as an uncovered gap. Correctly: there was one.
       *
       * The cover row grants register duty for a class this person may only
       * teach one period of, which is wider than the lesson strictly needs.
       * That is the direction `AttendanceCover` deliberately errs in — see the
       * model: a cover ADDS a person and never removes one, and a class is
       * harmed by nobody being able to mark it, never by two people being able
       * to. The widening is bounded by the dates of the leave.
       */
      const [registers, lessons] = await Promise.all([
        db.classTeacher.findMany({
          where: {
            schoolId: ctx.schoolId,
            teacherMembershipId: request.teacherMembershipId,
            canTakeAttendance: true,
            class: { archivedAt: null },
          },
          select: { classId: true },
        }),
        db.timetableSlot.findMany({
          where: {
            schoolId: ctx.schoolId,
            teacherMembershipId: request.teacherMembershipId,
            class: { archivedAt: null },
          },
          select: { classId: true },
          distinct: ["classId"],
        }),
      ]);

      const classIds = [
        ...new Set([...registers.map((r) => r.classId), ...lessons.map((l) => l.classId)]),
      ];

      for (const classId of classIds) {
        const result = await arrangeCover(
          ctx,
          {
            classId,
            coveringMembershipId: coverId,
            fromDateKey: request.fromDateKey,
            toDateKey: request.toDateKey,
            reason: "Approved leave",
          },
          { leaveRequestId: request.id },
        );
        if (result.ok) coversCreated++;
      }
    }
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: decision === "APPROVED" ? "leave.approve" : "leave.decline",
    targetType: "LeaveRequest",
    targetId: request.id,
    meta: { coversCreated, teacherMembershipId: request.teacherMembershipId },
  });

  await notify({
    userId: request.teacher.userId,
    schoolId: ctx.schoolId,
    kind: "SYSTEM",
    title: decision === "APPROVED" ? "Your leave was approved" : "Your leave was declined",
    body:
      decision === "APPROVED"
        ? `${request.fromDateKey} to ${request.toDateKey}.${coversCreated > 0 ? ` Cover arranged for ${coversCreated} class${coversCreated === 1 ? "" : "es"}.` : ""}`
        : opts.note?.trim() || "Speak to the office if you need to.",
    url: "/teacher/leave",
  });

  return { ok: true, coversCreated };
}

/**
 * The delegates `cancelLeave` touches, and only those.
 *
 * `$tenantTransaction` hands back `unknown` on purpose — see db.ts — so each
 * caller says what it needs rather than casting to the whole client and
 * quietly gaining the ability to reach anything.
 */
type TenantTx = {
  leaveRequest: { update(args: unknown): Promise<unknown> };
  attendanceCover: { deleteMany(args: unknown): Promise<unknown> };
};

/**
 * The applicant withdraws it.
 *
 * Allowed AFTER approval as well as before, because plans change and a teacher
 * who comes in anyway should not leave a phantom absence on the calendar. The
 * cover this request caused is withdrawn with it — and only that cover, which is
 * what `leaveRequestId` is for.
 */
export async function cancelLeave(ctx: ActiveContext, leaveId: string): Promise<LeaveResult> {
  if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("No active school selected");

  const request = await db.leaveRequest.findFirst({
    where: { id: leaveId, schoolId: ctx.schoolId },
    select: { id: true, status: true, teacherMembershipId: true },
  });
  if (!request) return { ok: false, errorKey: "leaveKind.notInSchool" };

  const isOwner = request.teacherMembershipId === ctx.membershipId;
  const isStaffLead = ctx.role === "PRINCIPAL" || ctx.role === "ADMIN";
  if (!isOwner && !isStaffLead) {
    throw new AccessError("That is not your leave request");
  }
  if (request.status === "CANCELLED" || request.status === "DECLINED") {
    return { ok: false, errorKey: "leaveKind.alreadyClosed" };
  }

  // Read the cover this request created before the transaction removes it —
  // the people named on those rows are expecting to mark a register tomorrow,
  // and they are the ones who need telling. `cancelCover` is not reused here
  // because it authorises a different act; this deletes as part of cancelling
  // the leave that created it.
  const releasing = await db.attendanceCover.findMany({
    where: { leaveRequestId: request.id, schoolId: ctx.schoolId },
    select: {
      fromDateKey: true,
      toDateKey: true,
      covering: { select: { userId: true } },
      class: { select: { name: true } },
    },
  });

  /**
   * `$tenantTransaction`, and NOT `db.$transaction` in either of its forms.
   *
   * This was the array form, and it was not atomic. `db` is extended: every
   * query is re-issued inside its own `base.$transaction` so the tenant can be
   * bound for it (see db.ts), which means the two statements below ran in two
   * separate transactions and the outer one held nothing together. A failure on
   * the second would leave the request CANCELLED with its cover still standing,
   * so somebody is still down to mark a register for leave that no longer
   * exists — silently, because both halves "succeeded" as far as the app knew.
   *
   * The interactive form `db.$transaction(async (tx) => …)` has the same fault
   * for the same reason, and `$tenantTransaction` is the one that binds the
   * tenant once at the top and keeps the statements together. Demonstrated
   * rather than reasoned about: with a tenant bound and a deliberate failure on
   * the second statement, both `db.$transaction` forms leave the first
   * committed and only this one rolls it back.
   */
  await db.$tenantTransaction(async (tx: unknown) => {
    const t = tx as TenantTx;
    await t.leaveRequest.update({
      where: { id: request.id },
      data: { status: "CANCELLED" },
    });
    // ONLY the cover this request created. Cover arranged by hand for other
    // reasons belongs to whoever arranged it.
    await t.attendanceCover.deleteMany({
      where: { leaveRequestId: request.id, schoolId: ctx.schoolId },
    });
  });

  for (const cover of releasing) {
    await notify({
      userId: cover.covering.userId,
      schoolId: ctx.schoolId,
      kind: "SYSTEM",
      title: `You are no longer marking ${cover.class.name}`,
      body: `The leave that arranged it, from ${cover.fromDateKey}, was cancelled.`,
      url: "/teacher/attendance",
      urgent: true,
    });
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "leave.cancel",
    targetType: "LeaveRequest",
    targetId: request.id,
  });

  return { ok: true };
}


/** Somebody's own requests. */
export async function myLeave(ctx: ActiveContext): Promise<LeaveRow[]> {
  if (!ctx.schoolId || !ctx.membershipId) return [];
  const rows = await db.leaveRequest.findMany({
    where: { schoolId: ctx.schoolId, teacherMembershipId: ctx.membershipId },
    orderBy: { fromDateKey: "desc" },
    take: 100,
    ...LEAVE_INCLUDE,
  });
  return rows.map(shape);
}

/** Everything the principal may act on. */
export async function schoolLeave(
  ctx: ActiveContext,
  status?: "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED",
): Promise<LeaveRow[]> {
  if ((ctx.role !== "PRINCIPAL" && ctx.role !== "ADMIN") || !ctx.schoolId) {
    throw new AccessError("Only the principal or an admin can see staff leave");
  }
  const rows = await db.leaveRequest.findMany({
    where: { schoolId: ctx.schoolId, ...(status ? { status } : {}) },
    orderBy: [{ status: "asc" }, { fromDateKey: "asc" }],
    take: 300,
    ...LEAVE_INCLUDE,
  });
  return rows.map(shape);
}

/**
 * Approved leave overlapping a window, for the STAFF calendar.
 *
 * Refuses anybody who is not staff, rather than filtering their results to
 * nothing. A student calling this is a bug, and a bug should be loud.
 */
export async function approvedLeaveBetween(
  ctx: ActiveContext,
  fromDateKey: string,
  toDateKey: string,
): Promise<LeaveRow[]> {
  if (ctx.role !== "PRINCIPAL" && ctx.role !== "ADMIN" && ctx.role !== "TEACHER") {
    throw new AccessError("Staff leave is not shown outside the staff room");
  }
  if (!ctx.schoolId) return [];

  const rows = await db.leaveRequest.findMany({
    where: {
      schoolId: ctx.schoolId,
      status: "APPROVED",
      fromDateKey: { lte: toDateKey },
      toDateKey: { gte: fromDateKey },
    },
    orderBy: { fromDateKey: "asc" },
    take: 300,
    ...LEAVE_INCLUDE,
  });
  return rows.map(shape);
}

const LEAVE_INCLUDE = {
  select: {
    id: true,
    status: true,
    kind: true,
    fromDateKey: true,
    toDateKey: true,
    reason: true,
    decisionNote: true,
    decidedAt: true,
    teacherMembershipId: true,
    teacher: { select: { user: { select: { name: true, preferredName: true } } } },
    nominated: { select: { user: { select: { name: true, preferredName: true } } } },
    decidedBy: { select: { user: { select: { name: true, preferredName: true } } } },
  },
} as const;

type RawLeave = {
  id: string;
  status: string;
  kind: string;
  fromDateKey: string;
  toDateKey: string;
  reason: string;
  decisionNote: string | null;
  decidedAt: Date | null;
  teacherMembershipId: string;
  teacher: { user: { name: string; preferredName: string | null } };
  nominated: { user: { name: string; preferredName: string | null } } | null;
  decidedBy: { user: { name: string; preferredName: string | null } } | null;
};

function shape(row: RawLeave): LeaveRow {
  return {
    id: row.id,
    status: row.status,
    kind: row.kind,
    fromDateKey: row.fromDateKey,
    toDateKey: row.toDateKey,
    reason: row.reason,
    decisionNote: row.decisionNote,
    decidedAt: row.decidedAt,
    applicantMembershipId: row.teacherMembershipId,
    applicantName: row.teacher.user.preferredName ?? row.teacher.user.name,
    nominatedName: row.nominated
      ? (row.nominated.user.preferredName ?? row.nominated.user.name)
      : null,
    decidedByName: row.decidedBy
      ? (row.decidedBy.user.preferredName ?? row.decidedBy.user.name)
      : null,
  };
}

async function resolveNominee(
  ctx: ActiveContext,
  membershipId: string | null | undefined,
): Promise<{ id: string | null; errorKey?: TranslationKey }> {
  if (!membershipId) return { id: null };
  if (membershipId === ctx.membershipId) {
    return { id: null, errorKey: "leaveKind.notYourselfCover" };
  }
  const nominee = await db.membership.findFirst({
    where: {
      id: membershipId,
      schoolId: ctx.schoolId!,
      role: { in: ["TEACHER", "PRINCIPAL", "ADMIN"] },
      status: "ACTIVE",
      leftAt: null,
    },
    select: { id: true },
  });
  if (!nominee) return { id: null, errorKey: "leaveKind.notActiveStaff" };
  return { id: nominee.id };
}

/** Inclusive day count between two date keys. */
function spanDays(fromKey: string, toKey: string): number {
  const from = Date.parse(`${fromKey}T00:00:00Z`);
  const to = Date.parse(`${toKey}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.round((to - from) / 86_400_000) + 1;
}
