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
 *   - a NEW class, created here with the same section and colour and a fresh
 *     join code, never a copied teacher — staffing is next year's decision;
 *   - LEAVING: the top grade graduates, each pupil recorded as having left
 *     with the same certificate a mid-year leaver gets;
 *   - STAY: nothing happens to this class (a nursery that keeps its
 *     children, or a class the office wants to sort by hand).
 * Any pupil can be HELD BACK out of a move, and stays where they are.
 *
 * SECTIONS AND STREAMS. A school with 5A, 5B and 5C is three class rows in
 * one grade, and the year-end rarely maps them one to one: a big 5 splits
 * into 6A and 6B, two small 8s merge into one 9, the science stream forms
 * at 11 out of three 10s. So a move may name a destination PER PUPIL
 * (`reassign`), and a NEW destination carries a KEY: two moves — or two
 * pupils — that name the same key pour into the same new class, which is
 * how a split and a merge are the same mechanism. A new class may also
 * name its section, so "6A" and "6B" are sections on record and not just
 * letters in a name.
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
  /** Existing unarchived classes one grade up, offered in the picker. A
   * class that already has pupils is offered but never suggested — see the
   * plan for why. */
  candidates: { id: string; name: string; section: string | null; pupils: number }[];
};

export type Destination =
  | { kind: "CLASS"; classId: string }
  | {
      kind: "NEW";
      /**
       * Identifies the new class ACROSS the plan: every destination with
       * this key is the same class. Absent, the class is private to the
       * move that names it. The first move to name a key fixes its name,
       * grade and section.
       */
      key?: string;
      name: string;
      gradeLevel: string | null;
      /** Explicit section for the new class; undefined inherits the old class's. */
      section?: string | null;
    }
  | { kind: "LEAVE" }
  | { kind: "STAY" };

export type PromotionMove = {
  fromClassId: string;
  to: Destination;
  /** Pupils who stay behind in the old class — repeaters. */
  holdBack: string[];
  /** Pupils who go somewhere other than the class's destination: a split, a stream, an early leaver. */
  reassign?: { membershipId: string; to: Exclude<Destination, { kind: "STAY" }> }[];
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

/**
 * The rungs below the numbers, in the order Indian schools climb them. A
 * school uses whichever it uses; the ladder only says what comes after what.
 */
const EARLY_YEARS = ["PLAYGROUP", "NURSERY", "PRE-KG", "LKG", "JR KG", "JR. KG", "KG", "K", "UKG", "SR KG", "SR. KG", "PREP"];

function rung(grade: string): number | null {
  const g = grade.trim().toUpperCase();
  if (/^\d{1,2}$/.test(g)) return 100 + Number(g);
  const i = EARLY_YEARS.indexOf(g);
  return i >= 0 ? i : null;
}

/**
 * "5" → "6", "10" → "11"; a word grade steps to the NEXT RUNG THE SCHOOL HAS —
 * "K" goes to "1" in a school with K and 1, to "UKG" in a school with both —
 * and to nothing the school does not run. No arithmetic on words.
 */
export function nextGrade(grade: string | null | undefined, ladder: readonly string[] = []): string | null {
  if (!grade) return null;
  const trimmed = grade.trim();
  const here = rung(trimmed);
  if (here === null) return null;
  // A number is arithmetic: 5 goes to 6 whether or not a 6 exists yet.
  if (/^\d{1,2}$/.test(trimmed)) return String(Number(trimmed) + 1);
  const above = ladder
    .map((g) => ({ g: g.trim(), r: rung(g) }))
    .filter((x): x is { g: string; r: number } => x.r !== null && x.r > here)
    .sort((a, b) => a.r - b.r);
  return above.length > 0 ? above[0]!.g : null;
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
  const ladder = [...new Set(classes.map((c) => c.gradeLevel?.trim()).filter((g): g is string => Boolean(g)))];
  const taken = new Set(classes.map((c) => c.name.trim().toLowerCase()));
  // A bumped name that an active class already wears gets the year on it,
  // so the office is not left with two "Class 1"s to tell apart.
  const year = await db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { name: true } });
  const unique = (name: string) => (taken.has(name.trim().toLowerCase()) ? `${name} (${year?.name ?? "new"})` : name);

  return classes
    .map((klass) => {
      const next = nextGrade(klass.gradeLevel, ladder);
      const candidates = classes
        .filter((c) => c.id !== klass.id && next !== null && c.gradeLevel?.trim() === next)
        .map((c) => ({ id: c.id, name: c.name, section: c.section, pupils: c.enrollments.length }));

      /**
       * A CLASS ROW IS ONE YEAR'S COHORT. Its homework, date sheets, report
       * cards and registers hang off the row; move this year's 9 into the
       * row that was this year's 10 and they inherit every piece of work
       * that cohort was ever set. So an existing class is suggested only
       * when it is EMPTY — a class the office made ahead for next year —
       * and otherwise the pupils get a fresh class and the old row goes to
       * the archive with its year intact. The office can still choose a
       * full class from the picker; the page says how many are in it.
       */
      const empty = candidates.filter((c) => c.pupils === 0);

      let suggested: Destination;
      if (klass.enrollments.length === 0) {
        // Nobody to move: an empty class is next year's, or nobody's.
        suggested = { kind: "STAY" };
      } else if (top !== null && klass.gradeLevel?.trim() === top) {
        suggested = { kind: "LEAVE" };
      } else if (empty.length > 0) {
        // Prefer the same section; otherwise the first.
        const same = empty.find((c) =>
          classes.find((x) => x.id === c.id)?.section === klass.section,
        );
        suggested = { kind: "CLASS", classId: (same ?? empty[0]!).id };
      } else if (next !== null) {
        suggested = {
          kind: "NEW",
          key: `from:${klass.id}`,
          name: unique(nextClassName(klass.name, klass.gradeLevel, next)),
          gradeLevel: next,
          section: klass.section,
        };
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
    // The school's own order, early years before the numbers.
    .sort((a, b) => (rung(a.gradeLevel ?? "") ?? -1) - (rung(b.gradeLevel ?? "") ?? -1) || a.name.localeCompare(b.name));
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
    const hold = new Set(move.holdBack);
    for (const r of move.reassign ?? []) {
      if (hold.has(r.membershipId)) throw new AccessError("access.aPupilHeldBackCannotAlsoMove");
      if (r.to.kind === "CLASS") {
        if (!byId.has(r.to.classId)) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
        if (r.to.classId === move.fromClassId) throw new AccessError("access.aClassCannotMoveIntoItself");
      }
      if (r.to.kind === "NEW" && r.to.name.trim().length === 0) throw new AccessError("access.giveTheNewClassAName");
    }
  }

  /**
   * NEW CLASSES ARE COLLECTED BY KEY BEFORE ANYTHING MOVES, so a key named
   * from three places makes one class. An unkeyed NEW is private to its
   * move (or its pupil) and gets a key of its own here.
   */
  type NewSpec = { name: string; gradeLevel: string | null; section: string | null; originClassId: string };
  const newSpecs = new Map<string, NewSpec>();
  const keyOf = (to: Destination, fallback: string): string =>
    to.kind === "NEW" ? (to.key ?? fallback) : fallback;
  for (const move of moves) {
    const from = byId.get(move.fromClassId)!;
    const register = (to: Destination, fallback: string) => {
      if (to.kind !== "NEW") return;
      const key = keyOf(to, fallback);
      if (!newSpecs.has(key)) {
        newSpecs.set(key, {
          name: to.name.trim(),
          gradeLevel: to.gradeLevel,
          section: to.section === undefined ? from.section : to.section,
          originClassId: from.id,
        });
      }
    };
    register(move.to, `move:${move.fromClassId}`);
    for (const r of move.reassign ?? []) register(r.to, `move:${move.fromClassId}:${r.membershipId}`);
  }

  const now = new Date();
  const leftOn = opts.lastDayKey ? new Date(`${opts.lastDayKey}T00:00:00.000Z`) : undefined;

  // LEAVERS ARE CHECKED BEFORE ANYTHING IS WRITTEN. The departure is recorded
  // after the transaction (a certificate must not roll back a school), so
  // anything the departure would refuse — a last day before a pupil joined,
  // a pupil already recorded as left — has to be refused HERE, or the
  // graduates' enrolments close and the refusal leaves them on the roll of
  // no class at all.
  const destinationOf = (move: PromotionMove, membershipId: string): Destination =>
    move.reassign?.find((r) => r.membershipId === membershipId)?.to ?? move.to;
  for (const move of moves) {
    const anyLeave = move.to.kind === "LEAVE" || (move.reassign ?? []).some((r) => r.to.kind === "LEAVE");
    if (!anyLeave) continue;
    const hold = new Set(move.holdBack);
    const roll = await db.enrollment.findMany({
      where: { schoolId, classId: move.fromClassId, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } },
      select: { studentMembershipId: true, student: { select: { joinedAt: true } } },
    });
    const tooEarly = roll.filter(
      (e) =>
        !hold.has(e.studentMembershipId) &&
        destinationOf(move, e.studentMembershipId).kind === "LEAVE" &&
        leftOn &&
        e.student.joinedAt > leftOn,
    );
    if (tooEarly.length > 0) {
      throw new AccessError("access.leaversLastDayBeforeJoin", "FORBIDDEN", { count: tooEarly.length });
    }
  }

  const leavers: { membershipId: string; fromClassName: string }[] = [];
  const movedTo: { membershipId: string; className: string }[] = [];
  let created = 0;
  let archived = 0;
  let heldBack = 0;

  // Classes that RECEIVE pupils in this plan are next year's and are never
  // archived, however empty they were a moment ago.
  const receiving = new Set<string>();
  for (const m of moves) {
    if (m.to.kind === "CLASS") receiving.add(m.to.classId);
    for (const r of m.reassign ?? []) if (r.to.kind === "CLASS") receiving.add(r.to.classId);
  }

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
      if (move.to.kind === "STAY" && (move.reassign ?? []).length === 0) continue;
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

    // New classes first, one per key, so a split and a merge both land in
    // one row. A fresh join code each, because the old one is written on
    // last year's board; a retry on the rare collision rather than a failed year.
    const createdByKey = new Map<string, { id: string; name: string }>();
    for (const [key, spec] of newSpecs) {
      // The old class this key was first named from lends its colour and subject.
      const origin = byId.get(spec.originClassId);
      let made: { id: string; name: string } | null = null;
      for (let attempt = 0; attempt < 5 && !made; attempt++) {
        try {
          made = await tx.class.create({
            data: {
              schoolId,
              name: spec.name,
              gradeLevel: spec.gradeLevel,
              section: spec.section,
              // The room is the old class's; next year's is the office's to set.
              color: origin?.color ?? null,
              subject: origin?.subject ?? null,
              joinCode: classCode(),
            },
            select: { id: true, name: true },
          });
        } catch (error) {
          if (attempt === 4) throw error;
        }
      }
      createdByKey.set(key, made!);
      created += 1;
    }

    const resolve = (to: Destination, fallbackKey: string): { id: string; name: string } | null => {
      if (to.kind === "CLASS") return { id: to.classId, name: byId.get(to.classId)!.name };
      if (to.kind === "NEW") return createdByKey.get(keyOf(to, fallbackKey))!;
      return null; // LEAVE / STAY
    };

    for (const move of moves) {
      const from = byId.get(move.fromClassId)!;
      const hold = new Set(move.holdBack);
      // A STAY class still moves its reassigned pupils — a stream forming
      // out of a class that otherwise keeps its children.
      if (move.to.kind === "STAY" && (move.reassign ?? []).length === 0) continue;
      const roll = rolls.get(from.id) ?? [];
      const moving = roll.filter((e) => {
        if (hold.has(e.studentMembershipId)) return false;
        return destinationOf(move, e.studentMembershipId).kind !== "STAY";
      });
      heldBack += roll.length - moving.length;

      for (const e of moving) {
        const dest = destinationOf(move, e.studentMembershipId);
        const own = move.reassign?.some((r) => r.membershipId === e.studentMembershipId)
          ? `move:${move.fromClassId}:${e.studentMembershipId}`
          : `move:${move.fromClassId}`;
        const target = resolve(dest, own);
        if (!target) {
          leavers.push({ membershipId: e.studentMembershipId, fromClassName: from.name });
          continue;
        }
        await tx.enrollment.upsert({
          where: { classId_studentMembershipId: { classId: target.id, studentMembershipId: e.studentMembershipId } },
          create: { classId: target.id, schoolId, studentMembershipId: e.studentMembershipId, status: "ACTIVE" },
          update: { status: "ACTIVE", removedAt: null },
        });
        movedTo.push({ membershipId: e.studentMembershipId, className: target.name });
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
