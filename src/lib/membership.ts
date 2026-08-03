import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { forOwnSchools } from "./tenant-context";
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

export type SuspensionResult = { ok: true } | { ok: false; error: string };

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
    throw new AccessError("Only an admin can pause access");
  }

  // An admin suspending themselves is the single most likely way to lock a
  // school out of its own account, and it is always a mistake rather than a
  // decision. Refused before anything else so the message is the specific one.
  if (membershipId === ctx.membershipId) {
    return { ok: false, error: "You cannot pause your own access." };
  }

  const trimmed = reason.trim().slice(0, 500);
  if (trimmed.length < 3) {
    // Deliberately required. A suspension with no stated reason is one nobody
    // can review, appeal or reverse with confidence six months later.
    return { ok: false, error: "Say why, briefly. This is kept in the audit log." };
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
      if (!target) throw new StateError("That person is not in this school.");
      if (target.status === "SUSPENDED") throw new StateError("Their access is already paused.");
      if (target.status !== "ACTIVE") {
        throw new StateError("They have not accepted their invitation yet. Revoke the invite instead.");
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
          throw new StateError(
            "This is the school's only admin. Make somebody else an admin first.",
          );
        }
      }

      await t.membership.update({
        where: { id: membershipId },
        data: { status: "SUSPENDED", suspendedAt: new Date(), suspendedReason: trimmed },
      });
    });
  } catch (error) {
    if (error instanceof StateError) return { ok: false, error: error.message };
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
    meta: { role: target?.role ?? null, reason: trimmed },
  });

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
    throw new AccessError("Only an admin can restore access");
  }

  const schoolId = ctx.schoolId;

  const target = await db.membership.findFirst({
    where: { id: membershipId, schoolId },
    select: { id: true, status: true, userId: true, role: true },
  });
  if (!target) return { ok: false, error: "That person is not in this school." };
  if (target.status !== "SUSPENDED") return { ok: false, error: "Their access is not paused." };

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

  // This one CAN be delivered, which is the asymmetry with `suspendMembership`
  // above: the membership is ACTIVE again before the row is written, so the
  // recipient's tenant set includes this school and the notification is
  // readable. Ordering matters here and is not incidental.
  await notify({
    userId: target.userId,
    schoolId,
    kind: "SYSTEM",
    title: "Your access has been restored",
    body: "You can use your school on EduLink again.",
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

/** Thrown inside the transaction to roll it back with a message for the user. */
class StateError extends Error {}

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
