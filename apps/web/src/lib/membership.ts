import "server-only";
import { Prisma } from "@prisma/client";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { refreshStanding } from "./competitions";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { forOwnSchools } from "./tenant-context";
import { syncStandinsHeldBy, syncStandinsForTeacherClasses } from "./standin-guardian";
import { takeDownProfileOf } from "./faculty-profile";
import { blankTextsOfLeavers, familyGuardiansOfPupil } from "./text-retention";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * Suspending somebody's access to a school, and giving it back.
 *
 * THE SUSPENSION IS OF A MEMBERSHIP, NEVER OF A USER, and that is the whole
 * design. `User.disabledAt` exists and stops a login everywhere at once; no
 * admin can reach it from here and none ever should. A teacher may work at two
 * schools, and Riverside deciding it is done with them must not lock them out of
 * Oakfield — nor out of their own account, their own notifications, or their
 * children's parent view. Whoever runs the server holds the global switch, and
 * there is still no actor in this app above a school (see the global feed for
 * the other place that gap shows).
 *
 * NOTHING IS DELETED. Marks stay marked, attendance stays taken, posts stay
 * posted. A suspension is a statement about access from now on, not an attempt
 * to unhappen a term — and a school that needs the record later is a school that
 * needs it most in exactly the cases that lead to a suspension.
 *
 * REVOCATION IS ALREADY BUILT AND IS NOT DONE HERE. Every request re-derives its
 * tenant through `ownMembershipIn`, which filters `status: "ACTIVE"`, so the
 * moment this commits the database itself stops handing that school's rows to
 * that person — not merely the UI. Sessions are deliberately left alone: killing
 * them would sign the person out of their OTHER school too, which is precisely
 * the blast radius this file exists to avoid.
 */

/** ⚠ `errorKey`, not a sentence — translated at the action boundary. */
export type SuspensionResult = { ok: true } | { ok: false; errorKey: TranslationKey };

/** What the directory needs to render one suspended person. */
export type SuspendedSchool = { schoolId: string; schoolName: string; role: Role; at: Date | null };

/**
 * Suspends one membership.
 *
 * The membership id comes from the client, so it is re-queried WITH the
 * session's schoolId rather than trusted — the assert-don't-accept rule from
 * tenancy.ts. A membership id belonging to another school is NOT_FOUND, not
 * somebody else's person.
 */
export async function suspendMembership(
  ctx: ActiveContext,
  membershipId: string,
  reason: string,
): Promise<SuspensionResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanPauseAccess");
  }

  // An admin suspending themselves is the single most likely way to lock a
  // school out of its own account, and it is always a mistake rather than a
  // decision. Refused before anything else so the message is the specific one.
  if (membershipId === ctx.membershipId) {
    return { ok: false, errorKey: "refusal.pauseSelf" };
  }

  const trimmed = reason.trim().slice(0, 500);
  if (trimmed.length < 3) {
    // Deliberately required. A suspension with no stated reason is one nobody
    // can review, appeal or reverse with confidence six months later.
    return { ok: false, errorKey: "refusal.sayWhyAudit" };
  }

  const schoolId = ctx.schoolId;

  try {
    await db.$tenantTransaction(async (tx: unknown) => {
      const t = tx as TenantTx;

      // ---- the lock, and why a plain count would not do -------------------
      //
      // Two admins pausing each other at the same moment both read "there is
      // one other admin", both commit, and the school has none — unrecoverable
      // without database access. READ COMMITTED does not save us: neither
      // transaction sees the other's uncommitted update, so counting AFTER the
      // update is just as wrong as counting before.
      //
      // So all suspensions in a school are serialised behind a row lock on the
      // school itself. Suspensions are rare and the lock is held for two
      // statements; the contention is theoretical and the alternative is a
      // school with no way back in.
      await t.$queryRaw`SELECT id FROM "School" WHERE id = ${schoolId} FOR UPDATE`;

      const target = await t.membership.findFirst({
        where: { id: membershipId, schoolId },
        select: { id: true, role: true, status: true, userId: true },
      });
      if (!target) throw new StateError("refusal.personNotHere");
      if (target.status === "SUSPENDED") throw new StateError("refusal.alreadyPausedState");
      if (target.status !== "ACTIVE") {
        throw new StateError("refusal.inviteNotAccepted");
      }

      if (target.role === "ADMIN") {
        const otherAdmins = await t.membership.count({
          where: {
            schoolId,
            role: "ADMIN",
            status: "ACTIVE",
            leftAt: null,
            id: { not: membershipId },
          },
        });
        if (otherAdmins === 0) {
          throw new StateError("refusal.onlyAdminLeft");
        }
      }

      // TA-192: the head's pages pass to every admin while the school has no active head (duties.ts), so an admin
      // pausing the only active head would take the pages the head has not given them. A head is paused while
      // another head stays active; the last one is refused, as the last admin is.
      if (target.role === "PRINCIPAL") {
        const otherHeads = await t.membership.count({
          where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null, id: { not: membershipId } },
        });
        if (otherHeads === 0) throw new StateError("refusal.onlyHeadLeft");
      }

      await t.membership.update({
        where: { id: membershipId },
        data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: trimmed },
      });
    });
  } catch (error) {
    if (error instanceof StateError) return { ok: false, errorKey: error.key };
    throw error;
  }

  const target = await db.membership.findFirst({
    where: { id: membershipId, schoolId },
    select: { userId: true, role: true },
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "membership.suspend",
    targetType: "Membership",
    targetId: membershipId,
    // The reason is the admin's free text about a person and lives on the
    // membership row, where the people who may read it read it; the log
    // records that one was given, and how long, not what it said.
    meta: { role: target?.role ?? null, reasonLength: trimmed.length },
  });

  // A suspended teacher or admin cannot be anybody's stand-in guardian. They
  // may hold stand-ins two ways — as class teacher, and as the admin fallback —
  // so the walk is over what they actually HOLD, not over their classes; the
  // reconciler's own eligibility rules pick each pupil's new holder.
  if (target && target.role !== "STUDENT") {
    await syncStandinsHeldBy({ schoolId, userId: target.userId, actorUserId: ctx.user.id }).catch(
      (error) => console.error("[suspendMembership] standin sync failed", error),
    );
  }

  // A college teacher's public page comes down with their access (A3-S-5): paused, they cannot reach "take my page
  // down", and the signed-out page would go on naming them as the college's staff. Reinstated, they publish again.
  if (target && (target.role === "FACULTY" || target.role === "HOD")) {
    await takeDownProfileOf(schoolId, membershipId, ctx.user.id, "membership.suspend");
  }

  // NO NOTIFICATION IS SENT HERE, and the reason is worth stating rather than
  // looking like an omission: a Notification row carries a schoolId and is
  // read under the same policy as everything else, so the one person who cannot
  // read a notification about this suspension is the person it is about. You
  // cannot tell somebody in-app that you have just revoked their ability to
  // read in-app things.
  //
  // `/suspended` is the message instead. It runs off their own Membership rows,
  // which stay self-readable, so it works precisely when nothing else does.
  return { ok: true };
}

/** Gives it back. Clears the reason with it — a lifted suspension is not a note. */
export async function reinstateMembership(
  ctx: ActiveContext,
  membershipId: string,
): Promise<SuspensionResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanRestoreAccess");
  }

  const schoolId = ctx.schoolId;

  const target = await db.membership.findFirst({
    where: { id: membershipId, schoolId },
    select: { id: true, status: true, userId: true, role: true },
  });
  if (!target) return { ok: false, errorKey: "refusal.personNotHere" };
  if (target.status !== "SUSPENDED") return { ok: false, errorKey: "refusal.notPaused" };

  // No lock needed: restoring an admin can only ever increase the number of
  // admins, which is the direction that is always safe.
  await db.membership.update({
    where: { id: membershipId },
    data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "membership.reinstate",
    targetType: "Membership",
    targetId: membershipId,
    meta: { role: target.role },
  });

  // A reinstated class teacher outranks the admin fallback that covered their
  // absence, so their classes' unclaimed pupils come back to them now rather
  // than on the next backfill.
  if (target.role === "TEACHER" || target.role === "PRINCIPAL") {
    await syncStandinsForTeacherClasses({
      schoolId,
      teacherUserId: target.userId,
      actorUserId: ctx.user.id,
    }).catch((error) => console.error("[reinstateMembership] standin sync failed", error));
  }

  // This one CAN be delivered, which is the asymmetry with `suspendMembership`
  // above: the membership is ACTIVE again before the row is written, so the
  // recipient's tenant set includes this school and the notification is
  // readable. Ordering matters here and is not incidental.
  await notify({
    userId: target.userId,
    schoolId,
    kind: "SYSTEM",
    titleKey: "notifTitle.accessRestored",
    bodyKey: "notifBody.accessRestored",
    url: "/",
  });

  return { ok: true };
}

/**
 * The schools that have paused this person, for the page that tells them so.
 *
 * TWO PASSES, the same shape as `listContexts` and for the same reason. A
 * suspended person's tenant set is empty by construction — that is what the
 * suspension DID — so a join to School returns nothing and Prisma refuses the
 * required relation. Their own Membership rows are still readable through the
 * self clause on `app.user_id`, so: read the ids under the policies, then widen
 * to exactly those and read the names.
 *
 * Naming the school is not a leak. They were a member of it; they are being told
 * which door closed, which is the difference between a message and a shrug.
 */
export async function suspendedSchoolsFor(userId: string): Promise<SuspendedSchool[]> {
  const rows = await db.membership.findMany({
    where: { userId, status: "SUSPENDED", leftAt: null },
    select: { schoolId: true, role: true, suspendedAt: true },
  });
  if (rows.length === 0) return [];

  return forOwnSchools(
    userId,
    rows.map((r) => r.schoolId),
    async () => {
      const schools = await db.school.findMany({
        where: { id: { in: rows.map((r) => r.schoolId) } },
        select: { id: true, name: true },
      });
      const names = new Map(schools.map((s) => [s.id, s.name]));
      return rows.map((r) => ({
        schoolId: r.schoolId,
        // Tolerant rather than `!`: a school deleted out from under a suspended
        // membership must still render a sentence, not a 500 on the one page
        // whose entire job is to explain something.
        schoolName: names.get(r.schoolId) ?? "your school",
        role: r.role as Role,
        at: r.suspendedAt,
      }));
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Removing somebody who was never really here                                 */
/* -------------------------------------------------------------------------- */

/** What a removal refuses to throw away, and how much of it there is. */
export type RemovalBlocker = {
  attendance: number;
  marks: number;
  submissions: number;
  reportCards: number;
  /** Every other record the delete would cascade through: fees paid, certificates, exam and internal marks, lecture attendance, results, incidents… (TA-015). */
  records: number;
};

export type RemovalResult =
  | { ok: true }
  | { ok: false; errorKey: TranslationKey; blockers?: RemovalBlocker };

/**
 * THE RELATIONS WHOSE ROWS GO WITH A REMOVED PUPIL (TA-015), as `Model.column`.
 *
 * Deleting a Membership cascades through every relation to it marked
 * `onDelete: Cascade` — well over a hundred. The four counts in removeMembership
 * name what a school register holds; a college writes none of them, and a school
 * pupil can have a fee receipt or an issued certificate before the first
 * register mark. So the rule is inverted: EVERY cascading relation is a record
 * that refuses the removal, except the ones named here, which are what a
 * mis-added pupil really has — the places the office put them (class, programme,
 * courses, batch, mentor group, fee plan and its unpaid bills), the admission
 * form the office typed, the log of staff opening the health card, the parent
 * links, and the child's own practice, which the docblock below has always left
 * out. Read from the generated client's schema at run time, so a table added
 * tomorrow with a cascade to Membership blocks a removal until somebody decides
 * otherwise here; tests/ta-high-deletes-removal.test.ts holds the list to the
 * schema.
 *
 * A row that goes with the pupil can itself carry records (a library card its
 * loans and fines, an unpaid bill a payment's allocation): what cascades from it
 * blocks too, except a practice attempt's answers.
 */
export const GOES_WITH_THE_ROW: readonly string[] = [
  "Guardianship.studentMembershipId",
  "GuardianClaim.studentMembershipId",
  "Enrollment.studentMembershipId",
  "StudentProgramme.studentMembershipId",
  "ProgrammeEnrolment.studentMembershipId",
  "CourseRegistration.studentMembershipId",
  "LabBatchMember.studentMembershipId",
  "MentoringMember.studentMembershipId",
  "StudentFeePlan.studentMembershipId",
  "FeeDemand.studentMembershipId",
  "LibraryMember.membershipId",
  // The admission form as the office typed it: every admissions admit writes one, and so does every intake row with
  // a PEN or an admission day, so a bulk-import typo has one. Nothing is certified from it until a certificate is
  // issued, and an issued certificate, a leaving record or a requested change still refuses.
  "PupilRecord.studentMembershipId",
  // The family's log of staff opening the health card, written whenever the office opens the person page, card or
  // none; a card or a check-up still refuses.
  "HealthCardRead.studentMembershipId",
  // The child's own practice, never a school's to certify; competition entries are handled after the delete.
  "CompetitionEntry.studentMembershipId",
  "QuizAttempt.studentMembershipId",
  "QuizMastery.studentMembershipId",
  "EarnedBadge.studentMembershipId",
  "PracticeOnce.studentMembershipId",
];

/** Rows under a GOES_WITH_THE_ROW row that go with it too. */
export const GOES_WITH_ITS_PARENT: readonly string[] = ["QuizResponse.attemptId"];

/** The four the removal counts and names on its own. */
const COUNTED_APART = ["AttendanceRecord.studentMembershipId", "Grade.studentMembershipId", "Submission.studentMembershipId", "ReportCard.studentMembershipId"];

type RecordProbe = { name: string; count: (membershipId: string) => Prisma.Sql };
let recordProbes: RecordProbe[] | null = null;

/** A table or column name from the generated schema, quoted; anything else is a programming error. */
function ident(name: string): Prisma.Sql {
  if (!/^\w+$/.test(name)) throw new Error(`not an identifier: ${name}`);
  return Prisma.raw(`"${name}"`);
}

/** One count per relation whose rows would cascade away with a pupil's membership and are a record. */
export function removalRecordProbes(): RecordProbe[] {
  if (recordProbes) return recordProbes;
  const models = Prisma.dmmf.datamodel.models;
  const cascadesFrom = (target: string) =>
    models.flatMap((model) =>
      model.fields
        .filter((f) => f.type === target && f.relationOnDelete === "Cascade" && f.relationFromFields?.length === 1 && f.relationToFields?.length === 1)
        .map((f) => ({ model: model.name, column: f.relationFromFields![0]!, references: f.relationToFields![0]! })),
    );
  const probes: RecordProbe[] = [];
  for (const { model, column } of cascadesFrom("Membership")) {
    const name = `${model}.${column}`;
    if (COUNTED_APART.includes(name)) continue;
    if (!GOES_WITH_THE_ROW.includes(name)) {
      probes.push({ name, count: (id) => Prisma.sql`(SELECT count(*) FROM ${ident(model)} WHERE ${ident(column)} = ${id})` });
      continue;
    }
    for (const child of cascadesFrom(model)) {
      const childName = `${child.model}.${child.column}`;
      if (GOES_WITH_ITS_PARENT.includes(childName)) continue;
      probes.push({ name: childName, count: (id) => Prisma.sql`(SELECT count(*) FROM ${ident(child.model)} c JOIN ${ident(model)} p ON c.${ident(child.column)} = p.${ident(child.references)} WHERE p.${ident(column)} = ${id})` });
    }
  }
  recordProbes = probes;
  return probes;
}

/**
 * How many rows of record the removal of this membership would cascade away, counted on the transaction in hand —
 * so under the same tenant and row security as the delete — in one round trip rather than a hundred.
 */
async function countRecords(rawTx: unknown, membershipId: string): Promise<number> {
  const tx = rawTx as { $queryRaw<T>(query: Prisma.Sql): Promise<T> };
  const counts = removalRecordProbes().map((probe) => probe.count(membershipId));
  const [row] = await tx.$queryRaw<{ records: number }[]>(Prisma.sql`SELECT (${Prisma.join(counts, " + ")})::int AS "records"`);
  return row?.records ?? 0;
}

/**
 * THE THIRD VERB, and the reason there are three rather than two.
 *
 * A school needs to say three different things about a pupil and they are not
 * interchangeable:
 *
 *   PAUSE   — not for now. They are coming back. One click undoes it.
 *   LEFT    — they have gone to another school. A certificate is issued with
 *             this school's name on it, and the next school reads it.
 *   REMOVE  — they were never here. A duplicate row, a typo in a bulk import,
 *             a child added to the wrong school on a Monday morning.
 *
 * Before this, the third had to be spelled as one of the first two, and both
 * lie. Pausing leaves a person in the directory forever with a status implying
 * they might return. Recording them as having LEFT writes a leaving certificate
 * for a child who never attended — a document, addressed to a school that does
 * not exist, saying they were marked present zero times out of zero.
 *
 * SO THIS ONE DELETES, and it is the only thing in this codebase that does.
 * The justification is narrow and does not generalise: a tombstone is for
 * somebody who WAS here, and the entire precondition below is that they were
 * not. Leaving a REMOVED row behind would keep a child's name in a school's
 * directory because somebody mistyped an email once.
 *
 * THE PRECONDITION IS THE SAFETY, not the confirmation dialog. This refuses
 * outright the moment there is anything a school would have to certify —
 * a register mark, a grade, a piece of work handed in, a report card, and any
 * other record the delete would cascade through (a fee paid, a certificate, an
 * exam mark, a lecture attended, an incident: TA-015, see GOES_WITH_THE_ROW).
 * The first four are
 * exactly the things a leaving certificate summarises, so "there is history"
 * and "the answer is LEFT, not REMOVE" are the same sentence, and the error
 * says so. An admin cannot reach for the destructive verb by accident, because
 * for anybody with a term behind them it is not offered at all.
 */
export async function removeMembership(
  ctx: ActiveContext,
  membershipId: string,
): Promise<RemovalResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) {
    throw new AccessError("access.onlyAnAdminCanRemoveSomebodyFrom");
  }
  if (membershipId === ctx.membershipId) {
    return { ok: false, errorKey: "refusal.removeSelf" };
  }

  const schoolId = ctx.schoolId;

  const target = await db.membership.findFirst({
    where: { id: membershipId, schoolId },
    select: { id: true, role: true, userId: true, leftAt: true },
  });
  if (!target) return { ok: false, errorKey: "refusal.personNotHere" };

  // PUPILS ONLY, matching `recordDeparture`. Staff carry rows this check does
  // not look at — classes they lead, registers they took, leave they were
  // granted — and deciding what happens to a class whose teacher vanishes is a
  // different feature with a different question in it.
  if (target.role !== "STUDENT") {
    return {
      ok: false,
      errorKey: "refusal.onlyPupilRemoved",
    };
  }

  /**
   * The four things that mean "they were here".
   *
   * Counted in parallel and reported IN FULL rather than short-circuiting on
   * the first one: an admin who is told "they have attendance" fixes that and
   * comes back to be told about marks. One refusal should be the whole answer.
   *
   * Quiz attempts and badges are deliberately not here. Practice is the child's
   * own, follows the pupil rather than the school, and a school has never had
   * to certify it — treating it as history would block a genuine mis-add for a
   * child who opened the practice tab once while their account was being set up.
   */
  const [attendance, marks, submissions, reportCards] = await Promise.all([
    db.attendanceRecord.count({ where: { schoolId, studentMembershipId: membershipId } }),
    db.grade.count({ where: { schoolId, studentMembershipId: membershipId } }),
    db.submission.count({ where: { schoolId, studentMembershipId: membershipId } }),
    db.reportCard.count({ where: { schoolId, studentMembershipId: membershipId } }),
  ]);
  // …and every other record the cascade would take (TA-015): see GOES_WITH_THE_ROW.
  const records = await db.$tenantTransaction((rawTx) => countRecords(rawTx, membershipId));

  const blockers = { attendance, marks, submissions, reportCards, records };
  const total = attendance + marks + submissions + reportCards;
  if (total > 0) {
    return {
      ok: false,
      blockers,
      errorKey: "refusal.hasRecord",
    };
  }

  // Already recorded as having left is history too, whatever the counts say:
  // a certificate exists with this school's name on it and somebody may hold a
  // copy. Undoing the departure first is the honest route, and it is one click.
  // Asked before the other records, which the departure itself writes.
  if (target.leftAt) {
    return {
      ok: false,
      errorKey: "refusal.alreadyLeftDoc",
    };
  }

  if (records > 0) {
    return {
      ok: false,
      blockers,
      errorKey: "refusal.hasRecord",
    };
  }

  // The cascade below takes the pupil's competition entries with it, and a
  // leaderboard row is a stored count of entries with a result: remember which
  // boards this pupil was on so they can be recomputed once the rows are gone.
  const boards = await db.competitionEntry.findMany({
    where: { studentMembershipId: membershipId, OR: [{ rank: { not: null } }, { scoreMilli: { not: null } }] },
    select: { competitionId: true },
    distinct: ["competitionId"],
  });

  let textsBlanked = 0;
  const gone = await db.$tenantTransaction(async (rawTx) => {
    const t = rawTx as { membership: { delete(args: unknown): Promise<unknown> } };
    // Counted again in the delete's own transaction, so a record written since
    // the count above (a fee taken at the counter a moment ago) stops it too.
    if ((await countRecords(rawTx, membershipId)) > 0) return false;
    // Read before the delete takes the parent links with it (TA-457).
    const guardians = await familyGuardiansOfPupil(rawTx, membershipId);
    // Every relation pointing at Membership is Cascade or SetNull, so this
    // takes the enrolments and the parent links with it and leaves nothing
    // dangling. Checked against the schema rather than assumed.
    await t.membership.delete({ where: { id: membershipId } });
    // TA-457 (decision 0002): the pupil and each guardian left with no pupil here have left the school; the number
    // and the words of their texts at it are blanked, a STOP reply keeping its number.
    textsBlanked = await blankTextsOfLeavers(rawTx, schoolId, [target.userId, ...guardians]);
    return true;
  });
  if (!gone) return { ok: false, errorKey: "refusal.hasRecord" };

  for (const b of boards) await refreshStanding(schoolId, b.competitionId);

  // AUDITED AFTER THE ROW IS GONE, and that is the point of an audit log: the
  // only remaining evidence a school has that this person was ever on its roll,
  // and the one thing here no ordinary write path can edit.
  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "membership.remove",
    targetType: "Membership",
    targetId: membershipId,
    meta: { role: target.role, removedUserId: target.userId, textsBlanked },
  });

  return { ok: true };
}

/** Thrown inside the transaction to roll it back with a message for the user. */
/** Carries a KEY, so the catch site can hand it to the boundary untranslated. */
class StateError extends Error {
  constructor(public readonly key: TranslationKey) {
    super(key);
  }
}

type TenantTx = {
  $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
  membership: {
    findFirst(args: unknown): Promise<{
      id: string;
      role: string;
      status: string;
      userId: string;
    } | null>;
    count(args: unknown): Promise<number>;
    update(args: unknown): Promise<unknown>;
  };
};
