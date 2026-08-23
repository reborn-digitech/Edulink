import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { forOwnSchools } from "./tenant-context";
import { audit } from "./audit";
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
    deleteMany(args: unknown): Promise<unknown>;
  };
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
      studentCode: true,
      user: { select: { name: true, birthdate: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        select: { class: { select: { name: true, section: true } } },
        take: 1,
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

  if (leftAt < membership.joinedAt) {
    // A certificate saying somebody left before they arrived is the kind of
    // thing nobody notices until a receiving school asks about it.
    return { ok: false, errorKey: "refusal.leaveBeforeJoin" };
  }

  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { name: true },
  });

  /**
   * The snapshot. COUNTS, taken now, never recomputed.
   *
   * `groupBy` in the database rather than rows into memory, the same as
   * insights.ts — a pupil with six years of registers is thousands of rows and
   * this page is a modal on a directory.
   *
   * LATE COUNTS AS PRESENT, matching every other attendance figure in this
   * codebase. A child who arrived at ten past nine was in school, and a
   * certificate that says otherwise disagrees with the report cards the same
   * school issued.
   */
  const [byStatus, reportCardCount] = await Promise.all([
    db.attendanceRecord.groupBy({
      by: ["status"],
      where: { schoolId, studentMembershipId: membership.id },
      _count: { _all: true },
    }),
    db.reportCard.count({
      where: { schoolId, studentMembershipId: membership.id, status: "PUBLISHED" },
    }),
  ]);

  const counted = byStatus.reduce((sum, row) => sum + row._count._all, 0);
  const present = byStatus
    .filter((row) => row.status === "PRESENT" || row.status === "LATE")
    .reduce((sum, row) => sum + row._count._all, 0);

  const destination = input.destination?.trim().slice(0, 200) || null;
  const note = input.note?.trim().slice(0, 1000) || null;
  const klass = membership.enrollments[0]?.class ?? null;
  const className = klass
    ? klass.section && !klass.name.toLowerCase().endsWith(klass.section.toLowerCase())
      ? `${klass.name} ${klass.section}`
      : klass.name
    : null;
  const serial = await nextSerial(schoolId, leftAt);

  // `$tenantTransaction`, never `$transaction`. The plain form opens a
  // transaction that nothing has bound `app.school_ids` on, so every statement
  // inside it is refused by the policy — and refused in the silent direction,
  // as zero rows rather than an error. See db.ts.
  const record = await db.$tenantTransaction(async (tx: unknown) => {
    const t = tx as TenantTx;
    // A certificate from an earlier stay — a pupil who left, came back and is
    // leaving again — is replaced, not tripped over: one per membership, and
    // this one covers the whole stay (joinedAt is the first day, the counts
    // are cumulative).
    await t.schoolRecord.deleteMany({ where: { studentMembershipId: membership.id, schoolId } });
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
        studentCode: membership.studentCode,
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

    // Their enrolments end with them. REMOVED rather than deleted, exactly as
    // `cohort.ts` does it, so last term's marks still have a class to belong to.
    await t.enrollment.updateMany({
      where: { studentMembershipId: membership.id, schoolId, status: "ACTIVE" },
      data: { status: "REMOVED" },
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
    meta: { recordId: record.id, reason: input.reason, destination },
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

/**
 * The school's own numbering: TC/<year of leaving>/<n>, n counting from one
 * each year, per school. Read the highest issued and add one; the unique
 * index on (schoolId, serial) turns a race into a retry, not a duplicate.
 */
async function nextSerial(schoolId: string, leftAt: Date): Promise<string> {
  const year = leftAt.getUTCFullYear();
  const prefix = `TC/${year}/`;
  const last = await db.schoolRecord.findFirst({
    where: { schoolId, serial: { startsWith: prefix } },
    orderBy: { serial: "desc" },
    select: { serial: true },
  });
  const n = last?.serial ? Number(last.serial.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
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
  school: { name: string; addressLine: string | null; logoPath: string | null; code: string };
  studentName: string;
  studentCode: string | null;
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
  // reading by the office — the serial, the name, the code — from what the
  // school still holds. The family's reading changes nothing.
  if (asOffice && row.serial === null) {
    const m = await db.membership.findUnique({
      where: { id: row.studentMembershipId },
      select: { studentCode: true, user: { select: { name: true, birthdate: true } } },
    });
    const serial = await nextSerial(row.schoolId, row.leftAt);
    await db.schoolRecord.update({
      where: { id: row.id },
      data: {
        serial,
        studentName: row.studentName ?? m?.user.name ?? null,
        studentCode: row.studentCode ?? m?.studentCode ?? null,
        birthdate: row.birthdate ?? m?.user.birthdate ?? null,
      },
    });
    row.serial = serial;
    row.studentName = row.studentName ?? m?.user.name ?? null;
    row.studentCode = row.studentCode ?? m?.studentCode ?? null;
    row.birthdate = row.birthdate ?? m?.user.birthdate ?? null;
  }

  // Letterhead and signatory: the issuing school's, read with that school
  // bound — the one narrow widening student-record.ts allows for names.
  // The school id came back out of a row Postgres already opened to this
  // reader, so the widening is to exactly that school — the switcher's rule.
  const [school, issuer, student] = await forOwnSchools(ctx.user.id, [row.schoolId], async () => {
    return Promise.all([
      db.school.findUnique({ where: { id: row.schoolId }, select: { name: true, addressLine: true, logoPath: true, code: true } }),
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
      code: school?.code ?? "",
    },
    studentName: row.studentName ?? student?.name ?? "",
    studentCode: row.studentCode,
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
    select: { id: true, leftAt: true },
  });
  if (!membership) return { ok: false, errorKey: "refusal.pupilNotHere" };
  if (!membership.leftAt) return { ok: false, errorKey: "refusal.notLeft" };

  await db.$tenantTransaction(async (tx: unknown) => {
    const t = tx as TenantTx;
    await t.schoolRecord.deleteMany({ where: { studentMembershipId: membership.id, schoolId } });
    await t.membership.update({ where: { id: membership.id }, data: { leftAt: null } });
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
    // has no attendance, which is not the same as never turning up.
    attendancePercent:
      row.attendanceMarked === 0
        ? null
        : Math.round((row.attendancePresent * 1000) / row.attendanceMarked) / 10,
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
    where: { studentUserId },
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
    where: { schoolId: ctx.schoolId },
    orderBy: { leftAt: "desc" },
    select: {
      ...RECORD_SELECT,
      studentMembershipId: true,
      student: { select: { name: true, preferredName: true } },
    },
    take: 200,
  });

  return rows.map((row) => ({
    ...toView(row, ctx.schoolId),
    studentName: row.student.preferredName ?? row.student.name,
    studentMembershipId: row.studentMembershipId,
  }));
}
