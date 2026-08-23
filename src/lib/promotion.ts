import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { classCode } from "./codes";
import { notify, notifyGuardians } from "./notify";
import { recordDeparture } from "./school-record";
import { syncStandinGuardian } from "./standin-guardian";
import type { ActiveContext } from "./session";

/**
 * Year-end promotion: the whole school moves up one grade in one sitting.
 *
 * WHAT CLOSING THE YEAR NEVER DID. `closeAcademicYear` snapshots badges and
 * flips the current year; it leaves every child enrolled in last year's
 * class, because "which class is next" is a decision, not a date. This is
 * where the decision is made, once, for every class at once — old class on
 * the left, where it goes on the right — rather than six hundred times in
 * the cohort panel.
 *
 * Four destinations, deliberately no fifth:
 *   - an EXISTING class (a school that already made next year's classes);
 *   - a NEW class, created here with the same section and room and a fresh
 *     join code, never a copied teacher — staffing is next year's decision;
 *   - LEAVING: the top grade graduates, each pupil recorded as having left
 *     with the same certificate a mid-year leaver gets;
 *   - STAY: nothing happens to this class (a nursery that keeps its
 *     children, or a class the office wants to sort by hand).
 * Any pupil can be HELD BACK out of a move, and stays where they are.
 *
 * Old classes whose pupils all moved are archived, so the register and the
 * timetable stop offering them. Nothing is deleted: every old enrolment is
 * closed (REMOVED, dated), which is exactly what the archive and the report
 * cards already read.
 */

export type PromotionClass = {
  id: string;
  name: string;
  gradeLevel: string | null;
  section: string | null;
  pupils: { membershipId: string; name: string }[];
  /** What the office will most likely want, worked out from the grade. */
  suggested: Destination;
  /** Existing unarchived classes one grade up, offered in the picker. */
  candidates: { id: string; name: string }[];
};

export type Destination =
  | { kind: "CLASS"; classId: string }
  | { kind: "NEW"; name: string; gradeLevel: string | null }
  | { kind: "LEAVE" }
  | { kind: "STAY" };

export type PromotionMove = {
  fromClassId: string;
  to: Destination;
  /** Pupils who stay behind in the old class — repeaters. */
  holdBack: string[];
};

export type PromotionResult = {
  ok: true;
  moved: number;
  left: number;
  heldBack: number;
  created: number;
  archived: number;
};

function requireAdmin(ctx: ActiveContext): string {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanPromote");
  return ctx.schoolId;
}

/** "5" → "6", "10" → "11"; "K", "LKG", "Nursery" → null (no arithmetic on words). */
export function nextGrade(grade: string | null | undefined): string | null {
  if (!grade) return null;
  const trimmed = grade.trim();
  if (!/^\d{1,2}$/.test(trimmed)) return null;
  return String(Number(trimmed) + 1);
}

/**
 * "Class 5" → "Class 6", "ZZ Grade 5 · A" → "ZZ Grade 6 · A", "5A" → "6A".
 * The FIRST number in the name is taken to be the grade; a name with no
 * number keeps its name and the office renames it.
 */
export function nextClassName(name: string, from: string | null, to: string | null): string {
  if (from && to) {
    const re = new RegExp(`(^|\\D)${from}(?=\\D|$)`);
    if (re.test(name)) return name.replace(re, `$1${to}`);
  }
  return name;
}

/** Every active class with its pupils and a suggested destination. */
export async function promotionPlan(ctx: ActiveContext): Promise<PromotionClass[]> {
  const schoolId = requireAdmin(ctx);

  const [classes, school] = await Promise.all([
    db.class.findMany({
      where: { schoolId, archivedAt: null },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        section: true,
        enrollments: {
          where: { status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } },
          select: {
            studentMembershipId: true,
            student: { select: { user: { select: { name: true, preferredName: true } } } },
          },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    }),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { gradeHigh: true } }),
  ]);

  const top = school.gradeHigh?.trim() ?? null;

  return classes
    .map((klass) => {
      const next = nextGrade(klass.gradeLevel);
      const candidates = classes
        .filter((c) => c.id !== klass.id && next !== null && c.gradeLevel?.trim() === next)
        .map((c) => ({ id: c.id, name: c.name }));

      let suggested: Destination;
      if (klass.enrollments.length === 0) {
        // Nobody to move: an empty class is next year's, or nobody's.
        suggested = { kind: "STAY" };
      } else if (top !== null && klass.gradeLevel?.trim() === top) {
        suggested = { kind: "LEAVE" };
      } else if (candidates.length > 0) {
        // Prefer the same section; otherwise the first.
        const same = candidates.find((c) =>
          classes.find((x) => x.id === c.id)?.section === klass.section,
        );
        suggested = { kind: "CLASS", classId: (same ?? candidates[0]!).id };
      } else if (next !== null) {
        suggested = { kind: "NEW", name: nextClassName(klass.name, klass.gradeLevel, next), gradeLevel: next };
      } else {
        suggested = { kind: "STAY" };
      }

      return {
        id: klass.id,
        name: klass.name,
        gradeLevel: klass.gradeLevel,
        section: klass.section,
        pupils: klass.enrollments
          .map((e) => ({
            membershipId: e.studentMembershipId,
            name: e.student.user.preferredName ?? e.student.user.name,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
        suggested,
        candidates,
      };
    })
    // Top grade first when it leaves, otherwise the school's own order.
    .sort((a, b) => Number(a.gradeLevel ?? 0) - Number(b.gradeLevel ?? 0) || a.name.localeCompare(b.name));
}

/**
 * Carries out a plan. All-or-nothing for the enrolments and the new classes;
 * departures and notifications follow, each on its own, because a certificate
 * that fails to render must not un-promote six hundred children.
 */
export async function promoteSchool(
  ctx: ActiveContext,
  moves: PromotionMove[],
  opts: { lastDayKey?: string } = {},
): Promise<PromotionResult> {
  const schoolId = requireAdmin(ctx);
  if (moves.length === 0) throw new AccessError("access.nothingToPromote");

  const fromIds = moves.map((m) => m.fromClassId);
  if (new Set(fromIds).size !== fromIds.length) throw new AccessError("access.aClassMovesOnce");

  const classes = await db.class.findMany({
    where: { schoolId, archivedAt: null },
    select: { id: true, name: true, gradeLevel: true, section: true, room: true, color: true, subject: true },
  });
  const byId = new Map(classes.map((c) => [c.id, c]));
  for (const move of moves) {
    if (!byId.has(move.fromClassId)) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
    if (move.to.kind === "CLASS") {
      if (!byId.has(move.to.classId)) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
      if (move.to.classId === move.fromClassId) throw new AccessError("access.aClassCannotMoveIntoItself");
    }
    if (move.to.kind === "NEW" && move.to.name.trim().length === 0) {
      throw new AccessError("access.giveTheNewClassAName");
    }
  }

  const now = new Date();
  const leavers: { membershipId: string; fromClassName: string }[] = [];
  const movedTo: { membershipId: string; className: string }[] = [];
  let created = 0;
  let archived = 0;
  let heldBack = 0;

  // Classes that RECEIVE pupils in this plan are next year's and are never
  // archived, however empty they were a moment ago.
  const receiving = new Set(moves.filter((m) => m.to.kind === "CLASS").map((m) => (m.to as { classId: string }).classId));

  // `$tenantTransaction`, never a plain `$transaction`: the tenant is bound
  // once at the top so every statement inside runs under the school's own
  // row policies as one atomic unit.
  await db.$tenantTransaction(async (rawTx) => {
    const tx = rawTx as typeof db;
    // EVERY ROLL IS READ BEFORE ANY MOVE. The whole school moves at once:
    // old 4 goes to 5 while old 5 goes to 6. Reading the rolls as we went
    // would sweep the children who had just arrived in 5 on into 6.
    const rolls = new Map<string, { id: string; studentMembershipId: string }[]>();
    for (const move of moves) {
      if (move.to.kind === "STAY") continue;
      rolls.set(
        move.fromClassId,
        await tx.enrollment.findMany({
          where: {
            schoolId,
            classId: move.fromClassId,
            status: "ACTIVE",
            student: { status: "ACTIVE", leftAt: null },
          },
          select: { id: true, studentMembershipId: true },
        }),
      );
    }

    for (const move of moves) {
      if (move.to.kind === "STAY") continue;
      const from = byId.get(move.fromClassId)!;
      const hold = new Set(move.holdBack);
      const roll = rolls.get(from.id)!;
      const moving = roll.filter((e) => !hold.has(e.studentMembershipId));
      heldBack += roll.length - moving.length;

      let targetId: string | null = null;
      let targetName = "";
      if (move.to.kind === "CLASS") {
        targetId = move.to.classId;
        targetName = byId.get(targetId)!.name;
      } else if (move.to.kind === "NEW") {
        // A fresh join code, because the old one is written on last year's
        // board; a retry on the rare collision rather than a failed year.
        let made: { id: string; name: string } | null = null;
        for (let attempt = 0; attempt < 5 && !made; attempt++) {
          try {
            made = await tx.class.create({
              data: {
                schoolId,
                name: move.to.name.trim(),
                gradeLevel: move.to.gradeLevel,
                section: from.section,
                room: from.room,
                color: from.color,
                subject: from.subject,
                joinCode: classCode(),
              },
              select: { id: true, name: true },
            });
          } catch (error) {
            if (attempt === 4) throw error;
          }
        }
        targetId = made!.id;
        targetName = made!.name;
        created += 1;
      }

      if (move.to.kind === "LEAVE") {
        for (const e of moving) leavers.push({ membershipId: e.studentMembershipId, fromClassName: from.name });
      } else {
        for (const e of moving) {
          await tx.enrollment.upsert({
            where: { classId_studentMembershipId: { classId: targetId!, studentMembershipId: e.studentMembershipId } },
            create: { classId: targetId!, schoolId, studentMembershipId: e.studentMembershipId, status: "ACTIVE" },
            update: { status: "ACTIVE", removedAt: null },
          });
          movedTo.push({ membershipId: e.studentMembershipId, className: targetName });
        }
      }

      // The old enrolments close, dated — what the archive reads.
      if (moving.length > 0) {
        await tx.enrollment.updateMany({
          where: { id: { in: moving.map((e) => e.id) } },
          data: { status: "REMOVED", removedAt: now },
        });
      }

      // Nobody left behind and nobody arriving → the class is last year's,
      // and goes to the archive.
      if (roll.length - moving.length === 0 && !receiving.has(from.id)) {
        await tx.class.update({ where: { id: from.id }, data: { archivedAt: now } });
        archived += 1;
      }
    }
  });

  // Graduates: the same departure as any leaver, one certificate each. Done
  // after the transaction so a certificate's failure is a line in the log,
  // not a rollback of the whole school.
  let left = 0;
  const leftOn = opts.lastDayKey ? new Date(`${opts.lastDayKey}T00:00:00.000Z`) : undefined;
  for (const leaver of leavers) {
    try {
      const result = await recordDeparture(ctx, leaver.membershipId, {
        reason: "GRADUATED",
        note: null,
        destination: null,
        leftOn,
      });
      if (result.ok) left += 1;
      else console.error("[promotion] departure refused", leaver.membershipId, result.errorKey);
    } catch (error) {
      console.error("[promotion] departure failed", leaver.membershipId, error);
    }
  }

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "school.promote",
    targetType: "School",
    targetId: schoolId,
    meta: { moves: moves.length, moved: movedTo.length, left, heldBack, created, archived },
  });

  // Everyone who moved is told where they now are — the child and their
  // guardians, in their own language. Best-effort, never blocking.
  const members = await db.membership.findMany({
    where: { id: { in: movedTo.map((m) => m.membershipId) } },
    select: { id: true, userId: true },
  });
  const userOf = new Map(members.map((m) => [m.id, m.userId]));
  for (const move of movedTo) {
    const userId = userOf.get(move.membershipId);
    if (!userId) continue;
    await notify({
      userId,
      schoolId,
      kind: "SYSTEM",
      titleKey: "notifTitle.promoted",
      bodyKey: "notifBody.promoted",
      bodyVars: { className: move.className },
      url: "/student",
    }).catch(() => {});
    await notifyGuardians(move.membershipId, (childName) => ({
      schoolId,
      kind: "SYSTEM",
      titleKey: "notifTitle.childPromoted",
      titleVars: { name: childName },
      bodyKey: "notifBody.childPromoted",
      bodyVars: { name: childName, className: move.className },
      url: "/parent",
    })).catch(() => {});
    await syncStandinGuardian({ schoolId, studentMembershipId: move.membershipId, actorUserId: ctx.user.id }).catch(() => {});
  }

  return { ok: true, moved: movedTo.length, left, heldBack, created, archived };
}
