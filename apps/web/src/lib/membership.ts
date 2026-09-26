import "server-only";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { refreshStanding } from "./competitions";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { forOwnSchools } from "./tenant-context";
import { syncStandinsHeldBy, syncStandinsForTeacherClasses } from "./standin-guardian";
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
};

export type RemovalResult =
  | { ok: true }
  | { ok: false; errorKey: TranslationKey; blockers?: RemovalBlocker };

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
 * a register mark, a grade, a piece of work handed in, a report card. Those are
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

  const blockers = { attendance, marks, submissions, reportCards };
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
  if (target.leftAt) {
    return {
      ok: false,
      errorKey: "refusal.alreadyLeftDoc",
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

  await db.$tenantTransaction(async (rawTx) => {
    const t = rawTx as { membership: { delete(args: unknown): Promise<unknown> } };
    // Every relation pointing at Membership is Cascade or SetNull, so this
    // takes the enrolments and the parent links with it and leaves nothing
    // dangling. Checked against the schema rather than assumed.
    await t.membership.delete({ where: { id: membershipId } });
  });

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
    meta: { role: target.role, removedUserId: target.userId },
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
