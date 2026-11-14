import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { headPageHolders } from "./duties";
import { AccessError } from "./tenancy";
import { arrangeCover, REGISTER_COVER_ROLES } from "./register-duty";
import { addDaysToKey, dateKeyRange, isDateKey, todayKey, weekdayOfKey } from "./dates";
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
import { readJsonArray } from "./json";
// Dates in a notice are said in each reader's language (B-15, 5 Oct 2026).
import { noticeDate } from "./notice-dates";

export { LEAVE_KINDS, LEAVE_KIND_LABEL_KEY, LEAVE_STATUSES, LEAVE_STATUS_KEY } from "./leave-kinds";
export type { LeaveKind, LeaveStatus, LeaveRow } from "./leave-kinds";

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

/**
 * Who may ask to be away: the staff who are not the office (an ADMIN decides
 * leave rather than asking for it here). The college's six joined on 4 October
 * 2026 — faculty and the HOD stand in for each other as teachers do, so they are
 * also COVER_ROLES; the exam cell, IQAC, placement and accounts desks are not.
 */
export const LEAVE_APPLICANT_ROLES = ["TEACHER", "PRINCIPAL", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const;
/** Who may be named to cover a colleague's absence (the picker, the nominee check, the suggestions). */
export const COVER_ROLES = ["TEACHER", "PRINCIPAL", "FACULTY", "HOD"] as const;

/** A member of staff asks to be away. */
export async function applyForLeave(
  ctx: ActiveContext,
  input: ApplyInput,
): Promise<LeaveResult> {
  // A principal may apply too — they are staff, and somebody has to be able to
  // approve it. The approval side refuses self-approval separately. A driver,
  // the library's desk and a warden are staff too (3 Oct 2026); their pages
  // come with their modules.
  // The college's six staff roles (4 Oct 2026) apply from /account/leave and the phone.
  if (!ctx.role || !(LEAVE_APPLICANT_ROLES as readonly string[]).includes(ctx.role) || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("access.onlyTeachingStaffCanApplyForLeave");
  }

  // A real day, not only its shape (TA-033): "2026-11-00" passed the pattern, was stored PENDING, and the desk's
  // cover search and balance then threw on it for the whole school.
  if (typeof input.fromDateKey !== "string" || typeof input.toDateKey !== "string" || !isDateKey(input.fromDateKey) || !isDateKey(input.toDateKey)) {
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

  // Everyone who can decide it: the head, and each admin the head has given the head's pages (owner-batch-item9). A
  // school with no principal falls back to its admins, so a request cannot sit unread because a post is vacant.
  const deciders = await headPageHolders(ctx.schoolId);
  const applicantName = ctx.user.preferredName ?? ctx.user.name;
  for (const userId of deciders) {
    await notify({
      userId,
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
  // Compared by PERSON as well as by membership (TA-030): one person holds a membership per role, so a head who
  // also teaches applied as the teacher and decided as the principal past a membership-only check.
  if (request.teacherMembershipId === ctx.membershipId || request.teacher.userId === ctx.user.id) {
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
          // The set `arrangeCover` writes a row for (REGISTER_COVER_ROLES) — an
          // admin standing in was silently dropped here and the class then
          // counted as covered, and so, until the owner's item 14 (1 Nov 2026),
          // was a FACULTY or HOD member, whom STAFF_ROLES let through and
          // `arrangeCover` refused.
          role: { in: [...REGISTER_COVER_ROLES] },
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

      // Covered means a cover row was WRITTEN for the class: a substitute
      // `arrangeCover` refused (a class of another school, say) must not hide
      // the class from the fallback below, nor count in the answer.
      const covered = new Set<string>();
      const writtenPairs = new Set<string>();
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
          covered.add(classId);
          writtenPairs.add(pair);
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
      const uncoveredRegisters = registerOnly.filter((r) => !covered.has(r.classId));
      if (uncoveredRegisters.length > 0) {
        // The busiest substitute, counting only the assignments whose cover row was written.
        const counts = new Map<string, number>();
        for (const a of assignments) {
          if (!writtenPairs.has(`${a.classId}|${a.coverMembershipId}`)) continue;
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
            // A class met only in a retired period is no lesson to cover (TA-283).
            period: { archivedAt: null },
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
          bodyVars: { name: applicantName, from: noticeDate(request.fromDateKey), to: noticeDate(request.toDateKey), classes: names.join(", ") },
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
        ? { bodyKey: "notifBody.leaveApprovedCover" as const, bodyVars: { from: noticeDate(request.fromDateKey), to: noticeDate(request.toDateKey), count: coversCreated } }
        : { bodyKey: "notifBody.leaveApprovedDates" as const, bodyVars: { from: noticeDate(request.fromDateKey), to: noticeDate(request.toDateKey) } }
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
  attendanceCover: { deleteMany(args: unknown): Promise<unknown>; updateMany(args: unknown): Promise<unknown> };
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
 *
 * BUT NOT ONCE IT HAS BEGUN, by the applicant (TA-001). An approved leave whose
 * first day has come in the school's zone is what the register, the staff month,
 * the leave balance and the payroll draft read; the applicant withdrawing it
 * then would pay unpaid days and erase who covered. Past days are the head's or
 * the office's to change, and even they release only the cover from today on:
 * a cover or substitution of a day already gone is the record of who did the
 * work, and stays. An approved leave withdrawn is told to the head's pages.
 */
export async function cancelLeave(ctx: ActiveContext, leaveId: string): Promise<LeaveResult> {
  if (!ctx.schoolId || !ctx.membershipId) throw new AccessError("access.noActiveSchoolSelected");

  const request = await db.leaveRequest.findFirst({
    where: { id: leaveId, schoolId: ctx.schoolId },
    select: { id: true, status: true, teacherMembershipId: true, fromDateKey: true, toDateKey: true, teacher: { select: { user: { select: { name: true, preferredName: true } } } } },
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

  // The school's today: an approved leave that has begun is not its applicant's to withdraw (TA-001), and nobody's
  // withdrawal releases the cover of a day already gone.
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  if (isOwner && request.status === "APPROVED" && request.fromDateKey <= today) {
    return { ok: false, errorKey: "leaveKind.alreadyBegun" };
  }
  const releaseFrom = request.fromDateKey > today ? request.fromDateKey : today;

  // Read the cover this request created before the transaction removes it —
  // the people named on those rows are expecting to mark a register tomorrow,
  // and they are the ones who need telling. `cancelCover` is not reused here
  // because it authorises a different act; this deletes as part of cancelling
  // the leave that created it. Only what still lies ahead: a cover wholly past is
  // kept, one that straddles today is cut to end yesterday.
  const releasing = (
    await db.attendanceCover.findMany({
      where: { leaveRequestId: request.id, schoolId: ctx.schoolId, toDateKey: { gte: today } },
      select: {
        fromDateKey: true,
        toDateKey: true,
        covering: { select: { userId: true } },
        class: { select: { name: true } },
      },
    })
  ).map((cover) => ({ ...cover, fromDateKey: cover.fromDateKey < today ? today : cover.fromDateKey }));
  // And the lessons the board handed to somebody on those days. Only the
  // applicant's own, only inside the leave, and only from today on: a
  // Substitution the register's ABSENT put there for a colleague is somebody
  // else's absence, and one of a past day is the record of a lesson taught.
  const substitutionsWhere = {
    schoolId: ctx.schoolId,
    absentMembershipId: request.teacherMembershipId,
    dateKey: { gte: releaseFrom, lte: request.toDateKey },
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
    // reasons belongs to whoever arranged it. And only from today on: a cover
    // that began before today ends yesterday, one wholly past is not touched.
    await t.attendanceCover.updateMany({
      where: { leaveRequestId: request.id, schoolId: ctx.schoolId, fromDateKey: { lt: today }, toDateKey: { gte: today } },
      data: { toDateKey: addDaysToKey(today, -1) },
    });
    await t.attendanceCover.deleteMany({
      where: { leaveRequestId: request.id, schoolId: ctx.schoolId, fromDateKey: { gte: today } },
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
      date: noticeDate(row.dateKey),
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

  // An approved leave withdrawn changes the register, the balance and the pay the office reads: the head's pages are
  // told (TA-001), all but whoever withdrew it.
  if (request.status === "APPROVED") {
    const applicant = request.teacher.user;
    for (const userId of await headPageHolders(ctx.schoolId)) {
      if (userId === ctx.user.id) continue;
      await notify({
        userId,
        schoolId: ctx.schoolId,
        kind: "SYSTEM",
        titleKey: "notifTitle.leaveWithdrawn",
        bodyKey: "notifBody.leaveWithdrawnDates",
        bodyVars: { name: applicant.preferredName ?? applicant.name, from: noticeDate(request.fromDateKey), to: noticeDate(request.toDateKey) },
        url: "/principal/leave",
      });
    }
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
  if (status) {
    const rows = await db.leaveRequest.findMany({
      where: { schoolId: ctx.schoolId, status },
      orderBy: { fromDateKey: "asc" },
      take: 300,
      ...LEAVE_INCLUDE,
    });
    return rows.map(shape);
  }
  // The queue first and whole, then the history. One list ordered by status
  // put PENDING last alphabetically and cut it at 300, so a busy school's
  // desk could disagree with the home page's count of what is waiting.
  const pending = await db.leaveRequest.findMany({
    where: { schoolId: ctx.schoolId, status: "PENDING" },
    orderBy: { fromDateKey: "asc" },
    take: 300,
    ...LEAVE_INCLUDE,
  });
  const decided = await db.leaveRequest.findMany({
    where: { schoolId: ctx.schoolId, status: { not: "PENDING" } },
    orderBy: { fromDateKey: "desc" },
    take: Math.max(0, 300 - pending.length),
    ...LEAVE_INCLUDE,
  });
  return [...pending, ...decided].map(shape);
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
      role: { in: [...COVER_ROLES, "ADMIN"] },
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

  // A stored request whose day is not a day (made before applyForLeave checked it, TA-033) has nothing to
  // suggest; answering empty keeps one bad row from taking the whole desk down.
  if (!isDateKey(fromDateKey) || !isDateKey(toDateKey)) return { lessonCount: 0, candidates: [], groups: [] };

  // The weekdays this leave actually touches — a Monday-only absence needs
  // nobody free on Thursday. Capped: past a fortnight every weekday is in.
  const weekdays = new Set(dateKeyRange(fromDateKey, toDateKey, 14).map(weekdayOfKey));

  const [applicantSlots, staff, allSlots] = await Promise.all([
    db.timetableSlot.findMany({
      where: {
        schoolId: ctx.schoolId,
        teacherMembershipId: applicantMembershipId,
        class: { archivedAt: null },
        // A retired period's lessons are not lessons to cover, nor clashes (TA-283).
        period: { archivedAt: null },
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
        role: { in: [...COVER_ROLES] },
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
        period: { archivedAt: null },
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
