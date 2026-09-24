import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { arrangeCover } from "./register-duty";
import { dateKeyRange, weekdayOfKey } from "./dates";
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
import { STAFF_ROLES } from "./staff-records";
import { readJsonArray } from "./json";
import { formatDateKey } from "./dates";

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
    throw new AccessError("access.onlyTeachingStaffCanApplyForLeave");
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
      titleKey: "notifTitle.leaveWaiting",
      bodyKey: "notifBody.leaveAskedFrom",
      bodyVars: { name: applicantName, from: input.fromDateKey },
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
export type CoverAssignment = {
  classId: string;
  subject: string;
  coverMembershipId: string;
};

export async function decideLeave(
  ctx: ActiveContext,
  leaveId: string,
  decision: "APPROVED" | "DECLINED",
  opts: {
    note?: string;
    coverMembershipId?: string | null;
    /**
     * Per-(class, subject) substitutes — the combinations. One teacher out may
     * be three teachers in: the mathematician takes 7A's Maths, a second takes
     * 9B's, the historian takes History. Falls back to the single
     * `coverMembershipId` (and then the applicant's nomination) when absent,
     * which is also what every existing caller and test still exercises.
     */
    coverAssignments?: CoverAssignment[];
  } = {},
): Promise<LeaveResult & { coversCreated?: number }> {
  if ((ctx.role !== "PRINCIPAL" && ctx.role !== "ADMIN") || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("access.onlyThePrincipalOrAnAdminCan");
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

  // THE CLAIM IS IN THE WHERE. Two people deciding at once — a double press,
  // or the admin and the principal on the same afternoon — both passed the
  // status read above; only one of them may write, and the other is told it
  // was already decided rather than arranging a second full set of cover.
  const claimed = await db.leaveRequest.updateMany({
    where: { id: request.id, schoolId: ctx.schoolId, status: "PENDING" },
    data: {
      status: decision,
      decidedByMembershipId: ctx.membershipId,
      decidedAt: new Date(),
      decisionNote: opts.note?.trim().slice(0, 1000) || null,
    },
  });
  if (claimed.count === 0) return { ok: false, errorKey: "leaveKind.alreadyDecided" };

  let coversCreated = 0;
  // Who is now covering what, told once each with the whole list — the
  // head covering ten classes read ten separate notices for one approval.
  const coveredBy = new Map<string, string[]>();
  const remember = (membershipId: string, classId: string) => {
    const list = coveredBy.get(membershipId) ?? [];
    list.push(classId);
    coveredBy.set(membershipId, list);
  };

  if (decision === "APPROVED") {
    // Whoever the DECIDER chose, falling back to the applicant's suggestion.
    // The nomination is advice; this is the decision.
    const coverId = opts.coverMembershipId ?? request.nominatedCoverMembershipId;

    /* The per-(class, subject) combinations, validated to be this school's own
     * active staff before any of them grants register duty. A cover row is per
     * class, so two subjects of one class going to the same person collapse to
     * one row, and going to two people become two rows — both may mark, which
     * is the direction AttendanceCover errs in by design. */
    const assignments = (opts.coverAssignments ?? []).filter(
      (a) => a.classId && a.coverMembershipId && a.coverMembershipId !== request.teacherMembershipId,
    );

    if (assignments.length > 0) {
      const staffIds = [...new Set(assignments.map((a) => a.coverMembershipId))];
      const staff = await db.membership.findMany({
        where: {
          id: { in: staffIds },
          schoolId: ctx.schoolId,
          // Anybody on the staff, the same set the nominee picker and
          // `arrangeCover` accept — an admin standing in was silently dropped
          // here and the class then counted as covered.
          role: { in: [...STAFF_ROLES] },
          status: "ACTIVE",
          leftAt: null,
        },
        select: { id: true },
      });
      const valid = new Set(staff.map((s) => s.id));

      const pairs = new Set<string>();
      for (const a of assignments) {
        if (!valid.has(a.coverMembershipId)) continue;
        pairs.add(`${a.classId}|${a.coverMembershipId}`);
      }

      for (const pair of pairs) {
        const [classId, coveringMembershipId] = pair.split("|") as [string, string];
        const result = await arrangeCover(
          ctx,
          {
            classId,
            coveringMembershipId,
            fromDateKey: request.fromDateKey,
            toDateKey: request.toDateKey,
            reason: "Approved leave",
          },
          { leaveRequestId: request.id, notify: false },
        );
        if (result.ok) {
          coversCreated++;
          remember(coveringMembershipId, classId);
        }
      }

      /* Registers the assignments did not reach: a form class this person
       * marks but is not timetabled to teach has no (class, subject) group,
       * and its register still needs a hand. It falls to the single fallback
       * cover if one was named, else to the most-assigned substitute — the
       * person already carrying most of this absence. */
      const registerOnly = await db.classTeacher.findMany({
        where: {
          schoolId: ctx.schoolId,
          teacherMembershipId: request.teacherMembershipId,
          canTakeAttendance: true,
          class: { archivedAt: null },
        },
        select: { classId: true },
      });
      // Covered means a cover row was actually asked for: an assignment whose
      // substitute failed validation must not hide its class from the fallback.
      const covered = new Set([...pairs].map((pair) => pair.split("|")[0]!));
      const uncoveredRegisters = registerOnly.filter((r) => !covered.has(r.classId));
      if (uncoveredRegisters.length > 0) {
        const counts = new Map<string, number>();
        for (const a of assignments) {
          if (!valid.has(a.coverMembershipId)) continue;
          counts.set(a.coverMembershipId, (counts.get(a.coverMembershipId) ?? 0) + 1);
        }
        const busiest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
        const registerCover = coverId && coverId !== request.teacherMembershipId ? coverId : busiest;
        if (registerCover) {
          for (const row of uncoveredRegisters) {
            const result = await arrangeCover(
              ctx,
              {
                classId: row.classId,
                coveringMembershipId: registerCover,
                fromDateKey: request.fromDateKey,
                toDateKey: request.toDateKey,
                reason: "Approved leave",
              },
              { leaveRequestId: request.id, notify: false },
            );
            if (result.ok) {
              coversCreated++;
              remember(registerCover, row.classId);
            }
          }
        }
      }
    } else if (coverId) {
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
          { leaveRequestId: request.id, notify: false },
        );
        if (result.ok) {
          coversCreated++;
          remember(coverId, classId);
        }
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

  if (coveredBy.size > 0) {
    const ids = [...new Set([...coveredBy.values()].flat())];
    const [classes, people] = await Promise.all([
      db.class.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
      db.membership.findMany({ where: { id: { in: [...coveredBy.keys()] } }, select: { id: true, userId: true } }),
    ]);
    const nameOf = new Map(classes.map((c) => [c.id, c.name]));
    const applicantName = request.teacher.user.preferredName ?? request.teacher.user.name;
    await Promise.all(
      people.map((person) => {
        const names = (coveredBy.get(person.id) ?? []).map((id) => nameOf.get(id) ?? id).sort();
        return notify({
          userId: person.userId,
          schoolId: ctx.schoolId!,
          kind: "SYSTEM",
          titleKey: names.length === 1 ? "notifTitle.nowMarking" : "notifTitle.nowMarkingMany",
          titleVars: names.length === 1 ? { class: names[0]! } : { count: names.length },
          bodyKey: "notifBody.coverForLeave",
          bodyVars: { name: applicantName, from: formatDateKey(request.fromDateKey), to: formatDateKey(request.toDateKey), classes: names.join(", ") },
          url: "/teacher/attendance",
          urgent: true,
        });
      }),
    );
  }

  await notify({
    userId: request.teacher.userId,
    schoolId: ctx.schoolId,
    kind: "SYSTEM",
    titleKey: decision === "APPROVED" ? "notifTitle.leaveApproved" : "notifTitle.leaveDeclined",
    ...(decision === "APPROVED"
      ? coversCreated > 0
        ? { bodyKey: "notifBody.leaveApprovedCover" as const, bodyVars: { from: formatDateKey(request.fromDateKey), to: formatDateKey(request.toDateKey), count: coversCreated } }
        : { bodyKey: "notifBody.leaveApprovedDates" as const, bodyVars: { from: formatDateKey(request.fromDateKey), to: formatDateKey(request.toDateKey) } }
      : opts.note?.trim()
        ? { body: opts.note.trim() }
        : { bodyKey: "notifBody.leaveDeclinedOffice" as const }),
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
  substitution: { deleteMany(args: unknown): Promise<unknown> };
};

/**
 * The applicant withdraws it.
 *
 * Allowed AFTER approval as well as before, because plans change and a teacher
 * who comes in anyway should not leave a phantom absence on the calendar. The
 * cover this request caused is withdrawn with it — and only that cover, which is
 * what `leaveRequestId` is for — and so are the substitution board's rows for
 * the applicant's lessons on the leave's days, which exist only because the
 * board listed them as away: two cover models, one absence, and the absence
 * is gone.
 */
export async function cancelLeave(ctx: ActiveContext, leaveId: string): Promise<LeaveResult> {
  if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.noActiveSchoolSelected");

  const request = await db.leaveRequest.findFirst({
    where: { id: leaveId, schoolId: ctx.schoolId },
    select: { id: true, status: true, teacherMembershipId: true, fromDateKey: true, toDateKey: true },
  });
  if (!request) return { ok: false, errorKey: "leaveKind.notInSchool" };

  const isOwner = request.teacherMembershipId === ctx.membershipId;
  const isStaffLead = ctx.role === "PRINCIPAL" || ctx.role === "ADMIN";
  if (!isOwner && !isStaffLead) {
    throw new AccessError("access.thatIsNotYourLeaveRequest");
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
  // And the lessons the board handed to somebody on those days. Only the
  // applicant's own, only inside the leave: a Substitution the register's
  // ABSENT put there for a colleague is somebody else's absence.
  const substitutionsWhere = {
    schoolId: ctx.schoolId,
    absentMembershipId: request.teacherMembershipId,
    dateKey: { gte: request.fromDateKey, lte: request.toDateKey },
  };
  const releasingLessons =
    request.status === "APPROVED"
      ? await db.substitution.findMany({
          where: substitutionsWhere,
          select: {
            dateKey: true,
            slotId: true,
            substitute: { select: { userId: true } },
            absent: { select: { user: { select: { name: true, preferredName: true } } } },
            slot: { select: { subject: true, class: { select: { name: true } }, period: { select: { name: true } } } },
          },
        })
      : [];

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
    if (releasingLessons.length > 0) await t.substitution.deleteMany({ where: substitutionsWhere });
  });

  for (const cover of releasing) {
    await notify({
      userId: cover.covering.userId,
      schoolId: ctx.schoolId,
      kind: "SYSTEM",
      titleKey: "notifTitle.noLongerMarking",
      titleVars: { class: cover.class.name },
      bodyKey: "notifBody.coverLeaveCancelled",
      bodyVars: { from: cover.fromDateKey },
      url: "/teacher/attendance",
      urgent: true,
    });
  }
  for (const row of releasingLessons) {
    const vars = {
      subject: row.slot.subject,
      className: row.slot.class.name,
      period: row.slot.period.name,
      date: row.dateKey,
      name: row.absent.user.preferredName ?? row.absent.user.name,
    };
    await notify({
      userId: row.substitute.userId,
      schoolId: ctx.schoolId,
      kind: "SYSTEM",
      titleKey: "notifTitle.coverReleased",
      titleVars: vars,
      bodyKey: "notifTitle.coverReleasedBody",
      bodyVars: vars,
      url: "/teacher",
      meta: { slotId: row.slotId, dateKey: row.dateKey },
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
    throw new AccessError("access.onlyThePrincipalOrAnAdminCan2");
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
    throw new AccessError("access.staffLeaveIsNotShownOutsideThe");
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

/* -------------------------------------------------------------------------- */
/* Who could actually cover                                                    */
/* -------------------------------------------------------------------------- */

export type CoverCandidate = {
  membershipId: string;
  name: string;
  /** Of the absent teacher's lessons in the window, how many this person is
   * already teaching through. Zero means genuinely free for all of them. */
  clashes: number;
  /** Their own weekly teaching load, the tiebreak between two free people. */
  load: number;
  /** Whether their subject list includes the group's subject. Always false on
   * the ungrouped list, where there is no one subject to match. */
  teachesSubject: boolean;
};

/**
 * One (class, subject) slice of the absent teacher's week. The unit of
 * replacement: a teacher taking Maths to 7A and English to 9B is two groups,
 * and each can go to a different substitute — as can two classes of the same
 * subject. The combinations are the decider's to make; this only ranks them.
 */
export type CoverGroup = {
  classId: string;
  className: string;
  subject: string;
  /** Distinct (weekday, period) lessons of this group inside the window. */
  lessonCount: number;
  /** Ranked for THIS group: teaches the subject first, then free-ness, then load. */
  candidates: CoverCandidate[];
};

export type CoverSuggestions = {
  /** Distinct (weekday, period) lessons of the applicant's inside the window. */
  lessonCount: number;
  candidates: CoverCandidate[];
  groups: CoverGroup[];
};

/**
 * Rank the staff room by who is actually free for the absent teacher's
 * lessons. The picker used to be an alphabet; the timetable knows better —
 * a candidate already teaching 7B through three of the four lessons is a
 * worse answer than one who is free for all of them, whatever the alphabet
 * says. Advice, not a decision: every member of staff stays choosable.
 */
export async function coverCandidates(
  ctx: ActiveContext,
  applicantMembershipId: string,
  fromDateKey: string,
  toDateKey: string,
): Promise<CoverSuggestions> {
  if ((ctx.role !== "PRINCIPAL" && ctx.role !== "ADMIN") || !ctx.schoolId) {
    throw new AccessError("access.onlyThePrincipalOrAnAdminCan");
  }

  // The weekdays this leave actually touches — a Monday-only absence needs
  // nobody free on Thursday. Capped: past a fortnight every weekday is in.
  const weekdays = new Set(dateKeyRange(fromDateKey, toDateKey, 14).map(weekdayOfKey));

  const [applicantSlots, staff, allSlots] = await Promise.all([
    db.timetableSlot.findMany({
      where: {
        schoolId: ctx.schoolId,
        teacherMembershipId: applicantMembershipId,
        class: { archivedAt: null },
      },
      select: {
        weekday: true,
        periodId: true,
        classId: true,
        subject: true,
        class: { select: { name: true } },
      },
    }),
    db.membership.findMany({
      where: {
        schoolId: ctx.schoolId,
        role: { in: ["TEACHER", "PRINCIPAL"] },
        status: "ACTIVE",
        leftAt: null,
        id: { not: applicantMembershipId },
      },
      select: {
        id: true,
        subjects: true,
        user: { select: { name: true, preferredName: true } },
      },
      take: 500,
    }),
    db.timetableSlot.findMany({
      where: {
        schoolId: ctx.schoolId,
        teacherMembershipId: { not: null },
        class: { archivedAt: null },
      },
      select: { teacherMembershipId: true, weekday: true, periodId: true },
    }),
  ]);

  const inWindow = applicantSlots.filter((slot) => weekdays.has(slot.weekday));
  const needed = new Set(inWindow.map((slot) => `${slot.weekday}:${slot.periodId}`));

  const clashesBy = new Map<string, Set<string>>();
  const loadBy = new Map<string, number>();
  for (const slot of allSlots) {
    const who = slot.teacherMembershipId!;
    loadBy.set(who, (loadBy.get(who) ?? 0) + 1);
    const key = `${slot.weekday}:${slot.periodId}`;
    if (needed.has(key)) {
      const set = clashesBy.get(who) ?? new Set<string>();
      set.add(key);
      clashesBy.set(who, set);
    }
  }

  /* What each member of staff says they teach, lower-cased once. The list is
   * the one chosen at signup and kept by the office — see setTeacherSubjects. */
  const subjectsBy = new Map<string, Set<string>>();
  for (const person of staff) {
    const list = readJsonArray<string>(person.subjects);
    subjectsBy.set(person.id, new Set(list.map((s) => s.toLowerCase())));
  }

  const rank = (a: CoverCandidate, b: CoverCandidate) =>
    Number(b.teachesSubject) - Number(a.teachesSubject) ||
    a.clashes - b.clashes ||
    a.load - b.load ||
    a.name.localeCompare(b.name);

  const candidates = staff
    .map((person) => ({
      membershipId: person.id,
      name: person.user.preferredName ?? person.user.name,
      clashes: clashesBy.get(person.id)?.size ?? 0,
      load: loadBy.get(person.id) ?? 0,
      teachesSubject: false,
    }))
    .sort((a, b) => a.clashes - b.clashes || a.load - b.load || a.name.localeCompare(b.name));

  /* THE GROUPS: the absent teacher's week sliced by (class, subject) — the
   * unit a replacement is actually chosen for. Each group re-ranks the same
   * staff room with the subject known: somebody who teaches Maths outranks
   * somebody merely free, because "the substitute has to teach the subject"
   * is the rule this feature exists to enforce — while the merely-free stay
   * listed, because a school with one mathematician still needs a Monday
   * answered. Clashes here are against the GROUP's own periods only: being
   * busy during somebody's English lesson is no mark against covering their
   * Maths. */
  const groupMap = new Map<string, { classId: string; className: string; subject: string; keys: Set<string> }>();
  for (const slot of inWindow) {
    const key = `${slot.classId}|${slot.subject.toLowerCase()}`;
    const group = groupMap.get(key) ?? {
      classId: slot.classId,
      className: slot.class.name,
      subject: slot.subject,
      keys: new Set<string>(),
    };
    group.keys.add(`${slot.weekday}:${slot.periodId}`);
    groupMap.set(key, group);
  }

  const groupClashes = (person: string, keys: Set<string>) => {
    let n = 0;
    for (const key of clashesBy.get(person) ?? []) if (keys.has(key)) n++;
    return n;
  };

  const groups: CoverGroup[] = [...groupMap.values()]
    .map((group) => ({
      classId: group.classId,
      className: group.className,
      subject: group.subject,
      lessonCount: group.keys.size,
      candidates: staff
        .map((person) => ({
          membershipId: person.id,
          name: person.user.preferredName ?? person.user.name,
          clashes: groupClashes(person.id, group.keys),
          load: loadBy.get(person.id) ?? 0,
          teachesSubject: subjectsBy.get(person.id)?.has(group.subject.toLowerCase()) ?? false,
        }))
        .sort(rank),
    }))
    .sort((a, b) => a.className.localeCompare(b.className) || a.subject.localeCompare(b.subject));

  return { lessonCount: needed.size, candidates, groups };
}
