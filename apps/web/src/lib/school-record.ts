import "server-only";
import { closeAlumnus, openAlumnus } from "./alumni-membership";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { forOwnSchools, forSchool } from "./tenant-context";
import { audit } from "./audit";
import { dateKeyInZone, todayKey } from "./dates";
import { notifyGuardians } from "./notify";
import { AccessError } from "./tenancy";
import type { ActiveContext } from "./session";

/**
 * A pupil leaving a school, and the certificate that goes with them.
 *
 * LEAVING IS NOT PAUSING, and keeping the two apart is most of this file.
 * `membership.ts` suspends: a statement that somebody may not sign in *for now*,
 * reversible in one click, with the expectation they come back. This is the
 * other thing — the child has gone to another school — and conflating them
 * would leave a school unable to say which of its two hundred paused pupils are
 * coming back in September.
 *
 * NOTHING IS DELETED, exactly as in `membership.ts`. The marks stay marked and
 * the registers stay taken, because a school is required to hold them long after
 * the child has gone and because a transfer is very often reversed within a
 * fortnight. What changes is `Membership.leftAt`, and that is enough: every
 * query in this codebase that resolves who somebody is filters `leftAt: null`,
 * so the moment this commits the database stops handing that school's rows to
 * that pupil. The revocation is Postgres's, not this file's — the same property
 * `npm run sweep` demonstrates for suspension.
 *
 * THE CERTIFICATE IS A DOCUMENT, NOT A QUERY, and that is forced rather than
 * chosen. Oakfield can never read a Riverside row; that boundary is the point of
 * this schema. So "their previous school" has to be something Riverside WROTE,
 * frozen at the moment of writing, carrying the school's name as it was — the
 * same argument report-cards.ts makes, and the same shape.
 *
 * AND IT IS A SUMMARY. Grade reached, the dates, days marked and days present,
 * how many report cards were issued. Not the marks. A new school that wants the
 * detail asks the family for the report cards the family already has, which is
 * how it works on paper and is the right amount of disclosure: enough to place a
 * child in the right class, not enough to precede them with a file.
 */

/**
 * The shape `$tenantTransaction` hands back, narrowed to what this file uses.
 *
 * It is typed `unknown` on purpose — see db.ts — so each caller declares the
 * delegates it actually touches rather than casting to the whole client and
 * quietly gaining the ability to reach anything.
 */
type TenantTx = {
  schoolRecord: {
    create(args: unknown): Promise<{ id: string }>;
    updateMany(args: unknown): Promise<{ count: number }>;
    findFirst(args: unknown): Promise<{ serial: string | null } | null>;
  };
  issuedCertificate: { findFirst(args: unknown): Promise<{ serial: string; number?: number } | null> };
  $queryRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
  membership: { update(args: unknown): Promise<unknown> };
  enrollment: { updateMany(args: unknown): Promise<unknown> };
  guardianship: { updateMany(args: unknown): Promise<unknown> };
};

export const LEAVING_REASONS = ["TRANSFERRED", "GRADUATED", "LEFT"] as const;
export type LeavingReason = (typeof LEAVING_REASONS)[number];

/** The one word a transfer certificate carries about conduct. */
export const CONDUCTS = ["EXCELLENT", "GOOD", "SATISFACTORY"] as const;
export type Conduct = (typeof CONDUCTS)[number];

export type DepartureInput = {
  reason: LeavingReason;
  /** Printed on the certificate; omitted, the line reads "—". */
  conduct?: Conduct | null;
  /** Where they went, if the school knows. Very often not on this server. */
  destination?: string | null;
  note?: string | null;
  /** Defaults to today. A school records a departure a week late all the time. */
  leftOn?: Date;
};

/** ⚠ `errorKey`, not a sentence — translated at the boundary (the leave.ts pattern). */
export type DepartureResult =
  | { ok: true; recordId: string }
  | { ok: false; errorKey: TranslationKey };

/**
 * The certificate as anybody reads it.
 *
 * `issuedHere` is the one field the UI needs that is not on the row: the same
 * record means "what we certified" to the school that wrote it and "where they
 * came from" to the school that has the child now, and the page says something
 * different in each case.
 */
export type SchoolRecordView = {
  id: string;
  schoolName: string;
  gradeLevel: string | null;
  joinedAt: Date;
  leftAt: Date;
  reason: LeavingReason;
  destination: string | null;
  note: string | null;
  attendanceMarked: number;
  attendancePresent: number;
  attendancePercent: number | null;
  reportCardCount: number;
  issuedHere: boolean;
};

/* -------------------------------------------------------------------------- */
/* Recording a departure                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Records that a pupil has left, and issues their certificate.
 *
 * ONE TRANSACTION, because the two halves are the same fact. A `leftAt` with no
 * certificate is a child who has vanished from the roll with nothing to show for
 * their three years; a certificate with no `leftAt` is a child certified as gone
 * who is still on tomorrow's register. Either one alone is worse than neither.
 *
 * The membership id arrives from the client and is re-queried WITH the session's
 * schoolId rather than trusted — assert, don't accept. An id from another school
 * is "not in this school", never somebody else's child.
 */
export async function recordDeparture(
  ctx: ActiveContext,
  membershipId: string,
  input: DepartureInput,
): Promise<DepartureResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanRecordAPupil");
  }
  if (!LEAVING_REASONS.includes(input.reason)) {
    return { ok: false, errorKey: "refusal.sayTransferReason" };
  }

  const schoolId = ctx.schoolId;
  const leftAt = input.leftOn ?? new Date();
  if (Number.isNaN(leftAt.getTime())) {
    return { ok: false, errorKey: "refusal.leaveDateInvalid" };
  }

  const membership = await db.membership.findFirst({
    where: { id: membershipId, schoolId },
    select: {
      id: true,
      role: true,
      status: true,
      userId: true,
      gradeLevel: true,
      joinedAt: true,
      leftAt: true,
      user: { select: { name: true, birthdate: true } },
      pupilRecord: { select: { admissionDate: true, admissionNumber: true } },
      // The class line on the certificate. ACTIVE first; failing that, the
      // most recently CLOSED one — promotion closes a graduate's enrolment
      // inside its transaction and writes the certificate after it, and a
      // battery found every graduate's "Class at leaving" blank because of it.
      enrollments: {
        orderBy: [{ status: "asc" }, { removedAt: "desc" }, { enrolledAt: "desc" }],
        select: { status: true, removedAt: true, enrolledAt: true, class: { select: { name: true, section: true } } },
      },
    },
  });
  if (!membership) return { ok: false, errorKey: "refusal.pupilNotHere" };
  if (input.conduct && !CONDUCTS.includes(input.conduct)) return { ok: false, errorKey: "refusal.sayTransferReason" };

  // PUPILS ONLY, and this is a real guard rather than a type narrowing. Staff
  // leave schools too, and when they do the school owes them a payslip and a
  // reference, not a leaving certificate describing their attendance. Recording
  // a departure for a teacher would produce a document that reads like nonsense
  // and would put their `leftAt` in a code path nothing else expects.
  if (membership.role !== "STUDENT") {
    return { ok: false, errorKey: "refusal.onlyPupilLeaves" };
  }
  if (membership.leftAt) return { ok: false, errorKey: "refusal.alreadyLeft" };

  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { name: true, timezone: true },
  });
  // Compared as days in the school's zone: leaving on the day one joined is a
  // real (if short) stay, and a leaving day typed as a date arrives at noon UTC
  // while the joining is an instant that afternoon.
  if (dateKeyInZone(leftAt, school.timezone) < dateKeyInZone(membership.joinedAt, school.timezone)) {
    // A certificate saying somebody left before they arrived is the kind of
    // thing nobody notices until a receiving school asks about it.
    return { ok: false, errorKey: "refusal.leaveBeforeJoin" };
  }
  // The leaving DAY is the instant read in the school's zone: a departure
  // recorded at 21:00 UTC is the next day in Kolkata, and that is the day
  // the certificate prints and the register stops at.
  const leftOnKey = dateKeyInZone(leftAt, school.timezone);

  /**
   * The snapshot. COUNTS, taken now, never recomputed: the whole stay up to
   * the leaving day, so a backdated departure leaves the marks after it out.
   * `stayAttendance` is the one definition; the certificate template's
   * [[record.attendance]] reads the same figure.
   */
  const [{ marked: counted, present }, reportCardCount] = await Promise.all([
    stayAttendance(schoolId, membership.id, leftOnKey, { joinedAt: membership.joinedAt, admissionDate: membership.pupilRecord?.admissionDate ?? null, timezone: school.timezone }),
    db.reportCard.count({
      where: { schoolId, studentMembershipId: membership.id, status: "PUBLISHED" },
    }),
  ]);

  const destination = input.destination?.trim().slice(0, 200) || null;
  const note = input.note?.trim().slice(0, 1000) || null;
  const lastEnrolment =
    membership.enrollments.find((e) => e.status === "ACTIVE") ??
    [...membership.enrollments].sort((a, b) => (b.removedAt ?? b.enrolledAt).getTime() - (a.removedAt ?? a.enrolledAt).getTime())[0] ??
    null;
  const klass = lastEnrolment?.class ?? null;
  const className = klass
    ? klass.section && !klass.name.toLowerCase().endsWith(klass.section.toLowerCase())
      ? `${klass.name} ${klass.section}`
      : klass.name
    : null;
  const serialYearName = (await serialYear(schoolId, leftAt)).name;

  // `$tenantTransaction`, never `$transaction`. The plain form opens a
  // transaction that nothing has bound `app.school_ids` on, so every statement
  // inside it is refused by the policy — and refused in the silent direction,
  // as zero rows rather than an error. See db.ts.
  const record = await db.$tenantTransaction(async (tx: unknown) => {
    const t = tx as TenantTx;
    // A live record from an earlier stay — one written before readmission
    // closed records — is closed, not deleted: its serial stays on the
    // register (LIFECYCLE-7). This one covers the whole stay (joinedAt is the
    // first day, the counts are cumulative).
    await closeLeavingRecord(t, schoolId, membership.id, "RERECORDED");
    // The number comes from the one TC register, under its lock (LIFECYCLE-6):
    // the TC certificate already issued for this departure lends its serial,
    // otherwise the next number of the year across both papers.
    const serial = await registerSerialFor(t, schoolId, membership.id, serialYearName);
    const created = await t.schoolRecord.create({
      data: {
        schoolId,
        studentUserId: membership.userId,
        studentMembershipId: membership.id,
        schoolName: school.name,
        gradeLevel: membership.gradeLevel,
        joinedAt: membership.joinedAt,
        leftAt,
        // The document's own lines, frozen now — a renamed class or a
        // corrected birthday later does not rewrite a certificate already
        // handed to another school.
        serial,
        studentName: membership.user.name,
        // The school's register number, never the platform's student code:
        // the certificate also prints the date of birth, and the pair is
        // what a claim asks for.
        admissionNumber: membership.pupilRecord?.admissionNumber ?? null,
        birthdate: membership.user.birthdate,
        className,
        conduct: input.conduct ?? null,
        reason: input.reason,
        destination,
        note,
        attendanceMarked: counted,
        attendancePresent: present,
        reportCardCount,
        issuedByMembershipId: ctx.membershipId,
      },
      select: { id: true },
    });

    await t.membership.update({
      where: { id: membership.id },
      data: { leftAt },
    });

    // The pupil stays connected to the school as an ALUMNUS: a second
    // membership, opened in the same transaction as the leaving (3 Oct 2026).
    await openAlumnus(t as unknown as Parameters<typeof openAlumnus>[0], membership.userId, schoolId, leftAt);

    // Their enrolments end with them, on their last day. REMOVED rather than
    // deleted, exactly as `cohort.ts` does it, so last term's marks still have
    // a class to belong to.
    await t.enrollment.updateMany({
      where: { studentMembershipId: membership.id, schoolId, status: "ACTIVE" },
      data: { status: "REMOVED", removedAt: leftAt },
    });

    // The school's stand-in guardianship (see standin-guardian.ts) ends with
    // the membership: a teacher holds guardian rights over a pupil they teach,
    // never over an alumnus. A REAL parent's guardianship is deliberately NOT
    // touched — it is what keeps the child's record reachable to the family
    // after the school is gone.
    await t.guardianship.updateMany({
      where: { studentMembershipId: membership.id, relation: "SCHOOL", status: "ACTIVE" },
      data: { status: "REVOKED" },
    });

    return created;
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "student.leave",
    targetType: "Membership",
    targetId: membership.id,
    // The reason is one of LEAVING_REASONS; the destination is free text the
    // office typed and stays on the record, not in the log the whole office reads.
    meta: { recordId: record.id, reason: input.reason, hasDestination: destination !== null },
  });

  /**
   * The family is told, and told what they now hold.
   *
   * A child disappearing from an app with no explanation is alarming, and the
   * certificate is the family's — they are the ones who hand it to the next
   * school. Deliberately NOT sent to the pupil: their access to this school ends
   * with the same transaction, so a notification carrying this school's id is
   * one they could never open.
   */
  await notifyGuardians(membership.id, (childName) => ({
    schoolId,
    kind: "SYSTEM",
    titleKey: "notifTitle.childRecordedLeaving",
    titleVars: { name: childName, school: school.name },
    bodyKey: "notifBody.recordHere",
    // The progress report, because that is the page the record is ON. Pointing
    // at /parent would have been a notification that lands one click short of
    // the thing it is about — the exact failure the last release spent a
    // commit fixing for report cards.
    url: `/reports/${membership.id}`,
  }));

  return { ok: true, recordId: record.id };
}

/* -------------------------------------------------------------------------- */
/* Scheduling a departure ahead of its day                                     */
/* -------------------------------------------------------------------------- */

/**
 * A LAST DAY IN THE FUTURE SCHEDULES; IT DOES NOT EXECUTE. The first
 * functional test typed 31/08 into the leaving panel and the pupil lost
 * access on the 23rd — the date was written on the certificate and ignored
 * by everything else. Now the office's intent is stored whole (date,
 * reason, destination, conduct), the pupil keeps every bit of access
 * through their last day, and the daily job runs the real departure the
 * MORNING AFTER it — same certificate, same roll-closing, same
 * notifications, same audit trail as if the office had pressed the button
 * that day. Cancelling before the day deletes the intent and nothing else
 * ever knows; re-scheduling corrects the one row.
 */

export type ScheduleInput = DepartureInput & { leaveOnKey: string };

export type ScheduledView = {
  membershipId: string;
  leaveOnKey: string;
  reason: LeavingReason;
  destination: string | null;
  note: string | null;
  conduct: Conduct | null;
};

export async function scheduleDeparture(
  ctx: ActiveContext,
  membershipId: string,
  input: ScheduleInput,
): Promise<{ ok: true; leaveOnKey: string } | { ok: false; errorKey: TranslationKey }> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanRecordAPupil");
  const schoolId = ctx.schoolId;
  if (!LEAVING_REASONS.includes(input.reason)) return { ok: false, errorKey: "refusal.sayTransferReason" };
  if (input.conduct && !CONDUCTS.includes(input.conduct)) return { ok: false, errorKey: "refusal.sayTransferReason" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.leaveOnKey)) return { ok: false, errorKey: "refusal.leaveDateInvalid" };

  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } });
  if (input.leaveOnKey <= todayKey(school.timezone)) {
    // Today or the past is not a schedule — the caller should record it now.
    return { ok: false, errorKey: "refusal.leaveDateNotFuture" };
  }

  const membership = await db.membership.findFirst({
    where: { id: membershipId, schoolId },
    select: { id: true, role: true, leftAt: true },
  });
  if (!membership) return { ok: false, errorKey: "refusal.pupilNotHere" };
  if (membership.role !== "STUDENT") return { ok: false, errorKey: "refusal.onlyPupilLeaves" };
  if (membership.leftAt) return { ok: false, errorKey: "refusal.alreadyLeft" };

  const data = {
    leaveOnKey: input.leaveOnKey,
    reason: input.reason,
    destination: input.destination?.trim().slice(0, 200) || null,
    note: input.note?.trim().slice(0, 1000) || null,
    conduct: input.conduct ?? null,
    scheduledByMembershipId: ctx.membershipId,
  };
  await db.scheduledDeparture.upsert({
    where: { membershipId: membership.id },
    create: { schoolId, membershipId: membership.id, ...data },
    update: data,
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "student.leave.schedule",
    targetType: "Membership",
    targetId: membership.id,
    meta: { leaveOn: input.leaveOnKey, reason: input.reason },
  });
  return { ok: true, leaveOnKey: input.leaveOnKey };
}

export async function cancelScheduledDeparture(
  ctx: ActiveContext,
  membershipId: string,
): Promise<{ ok: true } | { ok: false; errorKey: TranslationKey }> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanRecordAPupil");
  const removed = await db.scheduledDeparture.deleteMany({ where: { membershipId, schoolId: ctx.schoolId } });
  if (removed.count === 0) return { ok: false, errorKey: "refusal.nothingScheduled" };
  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "student.leave.unschedule",
    targetType: "Membership",
    targetId: membershipId,
  });
  return { ok: true };
}

/**
 * Executes every scheduled departure whose last day has PASSED in its
 * school's own timezone — the morning after, not the morning of, because a
 * child attends their last day. Runs as the daily job; each departure goes
 * through `recordDeparture` under the scheduling admin's identity (or any
 * active admin's, if they have gone), so the certificate, audit row and
 * notifications are indistinguishable from a hand-recorded one. A row whose
 * pupil already left by hand in the meantime is dropped as stale.
 */
export async function runDueDepartures(now: Date = new Date(), scope: { schoolIds?: string[] } = {}): Promise<{
  executed: number;
  skippedStale: number;
  /** Due, but nobody to act: the school has no active admin. The row STAYS and is retried nightly — and counted here, per school, so /root/jobs/schools can say which school is silently accumulating a leaver nobody executes. It used to be a console.error and nothing else. */
  stuck: number;
  perSchool: Record<string, { executed?: number; stale?: number; stuck?: number }>;
}> {
  // A test passes its own schools: with a far-future clock and no scope the
  // job once executed the demo schools' scheduled leavers (3 Oct 2026). Now
  // refused, as the retention sweep refuses one (LIFECYCLE-10): a clock more
  // than a day ahead runs only on the schools it names.
  if (!scope.schoolIds && now.getTime() - Date.now() > 86_400_000) {
    throw new Error(`departures: refusing an unscoped run with a clock ${Math.round((now.getTime() - Date.now()) / 86_400_000)} days in the future`);
  }
  const due = await db.scheduledDeparture.findMany({
    where: scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : undefined,
    include: { school: { select: { id: true, timezone: true } } },
    orderBy: { leaveOnKey: "asc" },
  });
  let executed = 0;
  let skippedStale = 0;
  let stuck = 0;
  const perSchool: Record<string, { executed?: number; stale?: number; stuck?: number }> = {};
  const add = (schoolId: string, key: "executed" | "stale" | "stuck") => {
    const row = (perSchool[schoolId] ??= {});
    row[key] = (row[key] ?? 0) + 1;
  };
  for (const row of due) {
    if (row.leaveOnKey >= todayKey(row.school.timezone, now)) continue; // not yet past
    const actorMembership =
      (row.scheduledByMembershipId
        ? await db.membership.findFirst({
            where: { id: row.scheduledByMembershipId, schoolId: row.schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null },
            select: { id: true, userId: true },
          })
        : null) ??
      (await db.membership.findFirst({
        where: { schoolId: row.schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null },
        select: { id: true, userId: true },
      }));
    if (!actorMembership) {
      console.error("[departures] no active admin to act for school", row.schoolId);
      stuck++;
      add(row.schoolId, "stuck");
      continue;
    }
    const ctx: ActiveContext = {
      sessionId: "scheduled-departure",
      membershipId: actorMembership.id,
      schoolId: row.schoolId,
      role: "ADMIN",
      user: {
        id: actorMembership.userId, name: "", preferredName: null, email: null, avatarKey: null,
        isMinor: false, isSuperuser: false, isAppAdmin: false,
        prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
      },
    };
    const result = await forSchool(row.schoolId, () =>
      recordDeparture(ctx, row.membershipId, {
        reason: row.reason as LeavingReason,
        destination: row.destination,
        note: row.note,
        conduct: (row.conduct as Conduct | null) ?? null,
        leftOn: new Date(`${row.leaveOnKey}T00:00:00.000Z`),
      }),
    ).catch((error) => {
      console.error("[departures] failed for", row.membershipId, error);
      return { ok: false as const, errorKey: "common.somethingWrong" as TranslationKey };
    });
    if (result.ok) {
      executed++;
      add(row.schoolId, "executed");
    } else {
      // Already left by hand, or otherwise unactionable: the intent is stale.
      skippedStale++;
      add(row.schoolId, "stale");
      console.error("[departures] stale schedule dropped for", row.membershipId, "errorKey" in result ? result.errorKey : "");
    }
    await db.scheduledDeparture.deleteMany({ where: { id: row.id } });
  }
  return { executed, skippedStale, stuck, perSchool };
}

/**
 * Days marked and days there over the pupil's WHOLE stay: from the earlier of
 * the day they joined and the record's admission date, to `toKey` — the
 * leaving day, or today for a pupil still on the roll. Late counts as present,
 * matching every other attendance figure in this codebase. The one definition
 * behind the leaving certificate's figure and the certificate template's
 * [[record.attendance]], so the two papers agree.
 */
export async function stayAttendance(
  schoolId: string,
  studentMembershipId: string,
  toKey: string,
  stay?: { joinedAt: Date; admissionDate: Date | null; timezone: string },
): Promise<{ marked: number; present: number; fromKey: string }> {
  let facts = stay;
  if (!facts) {
    const m = await db.membership.findUniqueOrThrow({ where: { id: studentMembershipId }, select: { joinedAt: true, pupilRecord: { select: { admissionDate: true } }, school: { select: { timezone: true } } } });
    facts = { joinedAt: m.joinedAt, admissionDate: m.pupilRecord?.admissionDate ?? null, timezone: m.school.timezone };
  }
  // joinedAt is an instant, read in the school's zone; the admission date is a date-only value stored at UTC midnight.
  const joinedKey = dateKeyInZone(facts.joinedAt, facts.timezone);
  const admittedKey = facts.admissionDate ? facts.admissionDate.toISOString().slice(0, 10) : null;
  const fromKey = admittedKey && admittedKey < joinedKey ? admittedKey : joinedKey;
  // `groupBy` in the database rather than rows into memory, the same as
  // insights.ts — a pupil with six years of registers is thousands of rows.
  const byStatus = await db.attendanceRecord.groupBy({
    by: ["status"],
    where: { schoolId, studentMembershipId, session: { dateKey: { gte: fromKey, lte: toKey } } },
    _count: { _all: true },
  });
  const marked = byStatus.reduce((sum, row) => sum + row._count._all, 0);
  const present = byStatus.filter((row) => row.status === "PRESENT" || row.status === "LATE").reduce((sum, row) => sum + row._count._all, 0);
  return { marked, present, fromKey };
}

/**
 * The year a serial is numbered under: the academic year the leaving day
 * falls in, by its name — TC/2026–27/0001, as every other paper the school
 * issues — or, for a school with no year covering that day, the calendar
 * year of the leaving day in the school's zone, the form the earliest
 * serials took. Years already issued keep their serials as they are.
 */
async function serialYear(schoolId: string, leftAt: Date): Promise<{ name: string; fromKey: string; toKey: string; timezone: string }> {
  const [school, years] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } }),
    db.academicYear.findMany({ where: { schoolId }, orderBy: { startDate: "desc" }, select: { name: true, startDate: true, endDate: true } }),
  ]);
  const leftOnKey = dateKeyInZone(leftAt, school.timezone);
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const covering = years.find((y) => day(y.startDate) <= leftOnKey && leftOnKey <= day(y.endDate));
  if (covering) return { name: covering.name, fromKey: day(covering.startDate), toKey: day(covering.endDate), timezone: school.timezone };
  const year = leftOnKey.slice(0, 4);
  return { name: year, fromKey: `${year}-01-01`, toKey: `${year}-12-31`, timezone: school.timezone };
}

/**
 * THE TC REGISTER (LIFECYCLE-6, 4 Oct 2026). The school's own numbering,
 * TC/<year name>/<n> with n counting from one each year, is ONE series for
 * the two papers a departure can carry: the leaving record written here and a
 * certificate the office issues from a template whose prefix is TC
 * (certificates.ts). Two counters, one per table, once printed
 * TC/2027–28/0001 on two different pupils' papers.
 *
 * WHY THE RECORD AND THE CERTIFICATE SHARE A NUMBER rather than each taking
 * its own: a TC number names a departure, and the two papers are that
 * departure written twice (the record's own document and the template's).
 * So the TC certificate issued to a pupil who has a leaving record prints the
 * record's serial, and a record written after a TC certificate was issued
 * takes the certificate's; only a paper with no partner draws a fresh number.
 * Numbers are drawn under one advisory lock per school, so the record and the
 * certificate cannot take the same number at once. `data:audit`'s
 * tc-register check holds it: no serial on papers of two pupils, numbers 1..n.
 */
export async function lockTcRegister(t: { $queryRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<unknown> }, schoolId: string): Promise<void> {
  await t.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`tc-register:${schoolId}`}))`;
}

/** The highest number the register holds under `prefix` ("TC/2026–27/"), across the leaving records and the issued certificates. */
export async function registerMax(t: Pick<TenantTx, "schoolRecord" | "issuedCertificate"> | typeof db, schoolId: string, prefix: string): Promise<number> {
  const c = t as Pick<TenantTx, "schoolRecord" | "issuedCertificate">;
  const [record, certificate] = await Promise.all([
    c.schoolRecord.findFirst({ where: { schoolId, serial: { startsWith: prefix } }, orderBy: { serial: "desc" }, select: { serial: true } }),
    c.issuedCertificate.findFirst({ where: { schoolId, serial: { startsWith: prefix } }, orderBy: { serial: "desc" }, select: { serial: true } }),
  ]);
  const n = (serial: string | null | undefined) => (serial ? Number(serial.slice(prefix.length)) || 0 : 0);
  return Math.max(n(record?.serial), n(certificate?.serial));
}

/** The serial a new leaving record takes, inside the caller's transaction: the departure's live TC certificate's, else the next free number. */
async function registerSerialFor(t: TenantTx, schoolId: string, membershipId: string, yearName: string): Promise<string> {
  await lockTcRegister(t, schoolId);
  const cert = await t.issuedCertificate.findFirst({
    where: { schoolId, studentMembershipId: membershipId, kind: "TC", revokedAt: null, serial: { startsWith: "TC/" } },
    orderBy: { issuedAt: "desc" },
    select: { serial: true },
  });
  if (cert && !(await t.schoolRecord.findFirst({ where: { schoolId, serial: cert.serial }, select: { serial: true } }))) return cert.serial;
  const prefix = `TC/${yearName}/`;
  return `${prefix}${String((await registerMax(t, schoolId, prefix)) + 1).padStart(4, "0")}`;
}

/**
 * Closes a membership's live leaving record instead of deleting it
 * (LIFECYCLE-7): readmission, an undone departure and a departure recorded
 * again all keep the serial on the register. The closed row lets go of the
 * membership, so the next departure writes a new live one and no certificate
 * or guardian reads the old leaving day.
 */
export async function closeLeavingRecord(
  t: { schoolRecord: { updateMany(args: unknown): Promise<{ count: number }> } },
  schoolId: string,
  membershipId: string,
  reason: "READMITTED" | "UNDONE" | "RERECORDED",
  at: Date = new Date(),
): Promise<number> {
  const closed = await t.schoolRecord.updateMany({
    where: { schoolId, studentMembershipId: membershipId },
    data: { studentMembershipId: null, formerMembershipId: membershipId, supersededAt: at, supersededReason: reason },
  });
  return closed.count;
}

/** The next number of a year, outside a transaction (the legacy numbering's fallback). */
async function nextSerial(schoolId: string, leftAt: Date): Promise<string> {
  const { name } = await serialYear(schoolId, leftAt);
  const prefix = `TC/${name}/`;
  return `${prefix}${String((await registerMax(db, schoolId, prefix)) + 1).padStart(4, "0")}`;
}

/**
 * Rows from before the document existed carry no serial. They are numbered
 * together, every unnumbered row of that year in the order the pupils left —
 * not the order the office happens to open them — after the highest already
 * issued; the row asked for gets its serial back.
 */
async function numberLegacyRows(schoolId: string, recordId: string, leftAt: Date): Promise<string> {
  const year = await serialYear(schoolId, leftAt);
  const prefix = `TC/${year.name}/`;
  const [last, unnumbered] = await Promise.all([
    registerMax(db, schoolId, prefix),
    db.schoolRecord.findMany({ where: { schoolId, serial: null }, orderBy: [{ leftAt: "asc" }, { createdAt: "asc" }], select: { id: true, leftAt: true } }),
  ]);
  let n = last;
  let mine: string | null = null;
  for (const row of unnumbered) {
    const key = dateKeyInZone(row.leftAt, year.timezone);
    if (key < year.fromKey || key > year.toKey) continue;
    n += 1;
    const serial = `${prefix}${String(n).padStart(4, "0")}`;
    await db.schoolRecord.update({ where: { id: row.id }, data: { serial } });
    if (row.id === recordId) mine = serial;
  }
  return mine ?? nextSerial(schoolId, leftAt);
}

/* -------------------------------------------------------------------------- */
/* The certificate as a document                                               */
/* -------------------------------------------------------------------------- */

/**
 * Everything the printed transfer certificate says. Frozen fields come off
 * the row; the issuing school's address and logo are read live, because a
 * school that moved still wants its letterhead right, and nothing on the
 * letterhead is a fact about the child.
 */
export type CertificateView = {
  id: string;
  serial: string | null;
  /** `timezone` is the school's: the days the paper prints are the instants read in it. */
  /** No join code: the document is handed across a counter, and that code lets its holder join the school. */
  school: { name: string; addressLine: string | null; logoPath: string | null; timezone: string };
  studentName: string;
  /** The school's own admission register number; null where the school holds none. */
  admissionNumber: string | null;
  birthdate: Date | null;
  className: string | null;
  gradeLevel: string | null;
  joinedAt: Date;
  leftAt: Date;
  reason: LeavingReason;
  conduct: Conduct | null;
  destination: string | null;
  note: string | null;
  attendanceMarked: number;
  attendancePresent: number;
  attendancePercent: number | null;
  reportCardCount: number;
  issuedAt: Date;
  issuedBy: string | null;
  /** The reader is the issuing school's office, not the family. */
  issuedHere: boolean;
};

/**
 * Who may see the document: the child, an active guardian, or an admin of
 * the school that issued it. The first two are settled by the row policy —
 * the record is read with NO tenant bound, and Postgres opens it to the
 * person it is about (student-record.ts explains why that is not a
 * shortcut). The office reads its own rows with its school bound, the
 * ordinary way. A guessed id is null in every case, never "not yours".
 */
export async function certificateFor(ctx: ActiveContext, recordId: string): Promise<CertificateView | null> {
  const asOffice = ctx.role === "ADMIN" && ctx.schoolId;
  const row = asOffice
    ? await db.schoolRecord.findFirst({ where: { id: recordId, schoolId: ctx.schoolId! } })
    : await db.schoolRecord.findFirst({ where: { id: recordId } });
  if (!row) return null;

  // A row from before the document existed gets its lines filled on first
  // reading by the office — the serial, the name, the register number — from
  // what the school still holds. The family's reading changes nothing.
  if (asOffice && row.serial === null) {
    const m = await db.membership.findUnique({
      where: { id: row.studentMembershipId ?? row.formerMembershipId ?? "" },
      select: { pupilRecord: { select: { admissionNumber: true } }, user: { select: { name: true, birthdate: true } } },
    });
    const serial = await numberLegacyRows(row.schoolId, row.id, row.leftAt);
    await db.schoolRecord.update({
      where: { id: row.id },
      data: {
        studentName: row.studentName ?? m?.user.name ?? null,
        admissionNumber: row.admissionNumber ?? m?.pupilRecord?.admissionNumber ?? null,
        birthdate: row.birthdate ?? m?.user.birthdate ?? null,
      },
    });
    row.serial = serial;
    row.studentName = row.studentName ?? m?.user.name ?? null;
    row.admissionNumber = row.admissionNumber ?? m?.pupilRecord?.admissionNumber ?? null;
    row.birthdate = row.birthdate ?? m?.user.birthdate ?? null;
  }

  // Letterhead and signatory: the issuing school's, read with that school
  // bound — the one narrow widening student-record.ts allows for names.
  // The school id came back out of a row Postgres already opened to this
  // reader, so the widening is to exactly that school — the switcher's rule.
  const [school, issuer, student] = await forOwnSchools(ctx.user.id, [row.schoolId], async () => {
    return Promise.all([
      db.school.findUnique({ where: { id: row.schoolId }, select: { name: true, addressLine: true, logoPath: true, timezone: true } }),
      row.issuedByMembershipId
        ? db.membership.findUnique({ where: { id: row.issuedByMembershipId }, select: { user: { select: { name: true } } } })
        : Promise.resolve(null),
      row.studentName ? Promise.resolve(null) : db.user.findUnique({ where: { id: row.studentUserId }, select: { name: true } }),
    ]);
  });

  return {
    id: row.id,
    serial: row.serial,
    school: {
      name: row.schoolName,
      addressLine: school?.addressLine ?? null,
      logoPath: school?.logoPath ?? null,
      timezone: school?.timezone ?? "UTC",
    },
    studentName: row.studentName ?? student?.name ?? "",
    admissionNumber: row.admissionNumber,
    birthdate: row.birthdate,
    className: row.className,
    gradeLevel: row.gradeLevel,
    joinedAt: row.joinedAt,
    leftAt: row.leftAt,
    reason: row.reason as LeavingReason,
    conduct: (row.conduct as Conduct | null) ?? null,
    destination: row.destination,
    note: row.note,
    attendanceMarked: row.attendanceMarked,
    attendancePresent: row.attendancePresent,
    attendancePercent: row.attendanceMarked === 0 ? null : Math.round((row.attendancePresent * 100) / row.attendanceMarked),
    reportCardCount: row.reportCardCount,
    issuedAt: row.createdAt,
    issuedBy: issuer?.user.name ?? null,
    issuedHere: Boolean(asOffice),
  };
}

/**
 * Undoes a departure recorded by mistake.
 *
 * IT MUST BE UNDOABLE, and not as a courtesy. "Left" is typed next to "paused"
 * in a list of two hundred children, the wrong row gets clicked, and the child
 * loses access to their school that afternoon. The alternative to an undo button
 * is a database console.
 *
 * The certificate is DELETED rather than marked withdrawn, and this is the one
 * place in this codebase that deletes rather than tombstones. The reasoning is
 * narrow: a certificate that was never true was issued to nobody, and leaving a
 * withdrawn one behind means the receiving school can read a document its
 * issuer has retracted. Nothing about the pupil is lost — marks, registers and
 * report cards are untouched, because they always were.
 *
 * ENROLMENTS ARE NOT RESTORED, deliberately. This puts the child back in the
 * school; which classes they are on is the admin's decision and is one click
 * away on the class page. Guessing would silently re-add a child to a class the
 * school had already moved them out of.
 */
export async function undoDeparture(
  ctx: ActiveContext,
  membershipId: string,
): Promise<{ ok: boolean; errorKey?: TranslationKey }> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanUndoALeaving");
  }
  const schoolId = ctx.schoolId;

  const membership = await db.membership.findFirst({
    where: { id: membershipId, schoolId, role: "STUDENT" },
    select: { id: true, leftAt: true, userId: true },
  });
  if (!membership) return { ok: false, errorKey: "refusal.pupilNotHere" };
  if (!membership.leftAt) return { ok: false, errorKey: "refusal.notLeft" };

  await db.$tenantTransaction(async (tx: unknown) => {
    const t = tx as TenantTx;
    // Closed, not deleted: a serial the office may already have printed stays on the register (LIFECYCLE-7).
    await closeLeavingRecord(t, schoolId, membership.id, "UNDONE");
    await t.membership.update({ where: { id: membership.id }, data: { leftAt: null } });
    // Back on the roll, so no longer an alumnus here.
    await closeAlumnus(t as unknown as Parameters<typeof closeAlumnus>[0], membership.userId, schoolId);
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "student.leave.undo",
    targetType: "Membership",
    targetId: membership.id,
  });

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Reading one                                                                 */
/* -------------------------------------------------------------------------- */

function toView(
  row: {
    id: string;
    schoolId: string;
    schoolName: string;
    gradeLevel: string | null;
    joinedAt: Date;
    leftAt: Date;
    reason: string;
    destination: string | null;
    note: string | null;
    attendanceMarked: number;
    attendancePresent: number;
    reportCardCount: number;
  },
  viewingSchoolId: string | null,
): SchoolRecordView {
  return {
    id: row.id,
    schoolName: row.schoolName,
    gradeLevel: row.gradeLevel,
    joinedAt: row.joinedAt,
    leftAt: row.leftAt,
    reason: row.reason as LeavingReason,
    destination: row.destination,
    note: row.note,
    attendanceMarked: row.attendanceMarked,
    attendancePresent: row.attendancePresent,
    // NULL, NOT ZERO, when nothing was ever marked — the same rule as every
    // other attendance figure here. A pupil who joined in the last week of term
    // has no attendance, which is not the same as never turning up. A whole
    // percent, the same rounding the certificate view prints.
    attendancePercent:
      row.attendanceMarked === 0
        ? null
        : Math.round((row.attendancePresent * 100) / row.attendanceMarked),
    reportCardCount: row.reportCardCount,
    issuedHere: viewingSchoolId !== null && row.schoolId === viewingSchoolId,
  };
}

const RECORD_SELECT = {
  id: true,
  schoolId: true,
  schoolName: true,
  gradeLevel: true,
  joinedAt: true,
  leftAt: true,
  reason: true,
  destination: true,
  note: true,
  attendanceMarked: true,
  attendancePresent: true,
  reportCardCount: true,
} as const;

/**
 * Every school this person has left, newest first.
 *
 * THE POLICY IS THE AUTHORISATION, and this function deliberately adds no WHERE
 * of its own beyond the pupil. Four different readers call it — the pupil, a
 * guardian, the school that issued a certificate, and the school the child
 * attends now — and each one gets a different set of rows back from Postgres for
 * a different reason. Re-implementing that in TypeScript would be a second place
 * to get it wrong, and the second place is always the one that is wrong.
 *
 * So: a school that has never taught this child gets nothing, whatever it asks.
 */
export async function recordsForStudentUser(
  ctx: ActiveContext,
  studentUserId: string,
): Promise<SchoolRecordView[]> {
  const rows = await db.schoolRecord.findMany({
    // Live records only: a closed one (an undone departure, or a stay followed by readmission) stays on the register, not on the pupil's journey.
    where: { studentUserId, supersededAt: null },
    orderBy: { leftAt: "desc" },
    select: RECORD_SELECT,
    take: 20,
  });
  return rows.map((row) => toView(row, ctx.schoolId));
}

/**
 * The same list, addressed by a MEMBERSHIP rather than a user.
 *
 * Which is what every staff-facing page actually holds: a teacher looking at a
 * child on their roster has that child's membership at THIS school, and the
 * certificates they want to see were issued against a different one. So this
 * resolves the membership to a person first — through the same
 * `assertStudentAccess` a register uses, so a guessed id is somebody else's
 * child and gets nothing.
 */
export async function recordsForStudentMembership(
  ctx: ActiveContext,
  studentMembershipId: string,
): Promise<SchoolRecordView[]> {
  if (!ctx.schoolId) return [];

  const membership = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId: ctx.schoolId, role: "STUDENT" },
    select: { userId: true },
  });
  if (!membership) return [];

  return recordsForStudentUser(ctx, membership.userId);
}

/** The signed-in pupil's own certificates. */
export async function myRecords(ctx: ActiveContext): Promise<SchoolRecordView[]> {
  if (ctx.role !== "STUDENT") return [];
  return recordsForStudentUser(ctx, ctx.user.id);
}

/**
 * Pupils this school has recorded as having left.
 *
 * The other half of the directory. Without it a departure is a one-way door
 * with nothing behind it: an admin who wants to undo one, or simply to check
 * who left last term, has no page to do it from.
 */
export async function departuresFrom(ctx: ActiveContext): Promise<
  (SchoolRecordView & { studentName: string; studentMembershipId: string })[]
> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanSeeWhoHas");
  }

  const rows = await db.schoolRecord.findMany({
    where: { schoolId: ctx.schoolId, supersededAt: null },
    orderBy: { leftAt: "desc" },
    select: {
      ...RECORD_SELECT,
      studentMembershipId: true,
      student: { select: { name: true, preferredName: true } },
    },
    take: 200,
  });

  return rows.flatMap((row) =>
    row.studentMembershipId
      ? [{ ...toView(row, ctx.schoolId), studentName: row.student.preferredName ?? row.student.name, studentMembershipId: row.studentMembershipId }]
      : [],
  );
}
