import { db } from "./db";
import { audit } from "./audit";
import { forTenant } from "./tenant-context";

/**
 * The school as stand-in guardian, until a real one arrives.
 *
 * A pupil whose parent is not on the app has nobody to say yes: a competition
 * entry waits forever on a consent nobody can give, and every guardian-facing
 * surface is a door with no key behind it. The school is already responsible
 * for that child all day — so, ONLY while no parent or guardian holds an
 * ACTIVE guardianship, the class teacher (or a school admin when there is no
 * class teacher) holds one instead, and THE MOMENT a real parent claims the
 * child the stand-in is revoked. The parent does not share; they replace.
 *
 * A REAL ROW, NOT A SPECIAL CASE. The stand-in is an ordinary Guardianship
 * with `relation: "SCHOOL"`, because every guardian surface — consent,
 * notifications, the switcher's children, the diary, the digest — keys on that
 * table, and a parallel mechanism would mean every one of those pages growing
 * a second code path it would someday forget. The relation value is the
 * boundary: `NOT_SCHOOL` below is how the reconciler tells a family from the
 * fallback, and nothing with `relation: "SCHOOL"` ever blocks, delays or
 * survives a real parent.
 *
 * WHO STANDS IN. The LEAD teacher of the pupil's current class; a CO teacher
 * when there is no LEAD; a school admin (earliest-joined, for determinism)
 * when there is no class or no class teacher at all. One holder at a time —
 * a consent given by whoever answers first out of three stand-ins is not a
 * decision anyone made.
 *
 * WHY THE CONSENT TIMESTAMPS ARE SET ON CREATION. `consentSharingAt` records
 * a parent agreeing that the school may show them the child's record. A
 * stand-in learns nothing they could not already read from the register — the
 * data flows INSIDE the school, not out of it — so there is no disclosure
 * left for the timestamp to gate.
 *
 * RECONCILE, DON'T CHOREOGRAPH. One idempotent function computes the correct
 * state from scratch — real guardian present means no stand-in, absent means
 * exactly one, held by the right person — and every lifecycle event (a pupil
 * joins, a parent claims, the roll is backfilled) just calls it. Hooks that
 * each know one transition drift; a reconciler cannot.
 */

/** Every relation value that means a real family member. */
const NOT_SCHOOL = { not: "SCHOOL" };

export type StandinSync =
  | { outcome: "kept-family" } // a real guardian exists; nothing to stand in for
  | { outcome: "released"; fromUserId: string } // real guardian arrived; stand-in revoked
  | { outcome: "granted"; toUserId: string } // no guardian at all; stand-in created
  | { outcome: "moved"; fromUserId: string; toUserId: string } // right holder changed
  | { outcome: "kept-standin"; userId: string } // stand-in already correct
  | { outcome: "nobody" }; // no family, and no teacher or admin to stand in

/**
 * Brings one pupil's stand-in guardianship into line with reality.
 *
 * `actorUserId` is whoever caused the sync — the joining pupil, the claiming
 * parent, the backfill operator — and lands in the audit row, because "the
 * system did it" is not an answer the server log should ever give.
 *
 * The Guardianship reads and writes need no tenant (the table carries no
 * policy, exactly so guardian questions can be answered before a school is
 * bound); the class and roll lookups are school rows, so they are read inside
 * an explicit binding to the pupil's school rather than trusting whatever
 * tenant the caller happened to arrive with.
 */
export async function syncStandinGuardian(opts: {
  schoolId: string;
  studentMembershipId: string;
  actorUserId: string;
}): Promise<StandinSync> {
  const { schoolId, studentMembershipId, actorUserId } = opts;

  const [family, standins] = await Promise.all([
    db.guardianship.findFirst({
      where: { studentMembershipId, status: "ACTIVE", relation: NOT_SCHOOL },
      select: { id: true },
    }),
    db.guardianship.findMany({
      where: { studentMembershipId, status: "ACTIVE", relation: "SCHOOL" },
      select: { id: true, parentUserId: true },
    }),
  ]);

  // A real parent or guardian is on the app: the stand-in's entire purpose
  // has ended. Revoke, never delete — the row is the record that the school
  // held this role, and for how long.
  if (family) {
    if (standins.length === 0) return { outcome: "kept-family" };
    await db.guardianship.updateMany({
      where: { id: { in: standins.map((s) => s.id) } },
      data: { status: "REVOKED" },
    });
    await audit({
      schoolId,
      actorUserId,
      action: "guardian.standin.release",
      targetType: "Membership",
      targetId: studentMembershipId,
      meta: { fromUserIds: standins.map((s) => s.parentUserId) },
    });
    return { outcome: "released", fromUserId: standins[0]!.parentUserId };
  }

  // No family on the app. Find who should stand in, reading the school's rows
  // under the school's own policies.
  const holderUserId = await forTenant(
    { schoolIds: [schoolId], userId: actorUserId, joinCode: null, isSuperuser: false },
    async () => {
      const enrollment = await db.enrollment.findFirst({
        where: { studentMembershipId, status: "ACTIVE" },
        orderBy: { enrolledAt: "desc" },
        select: { classId: true },
      });

      if (enrollment) {
        // LEAD before CO, and within a role the lowest membership id — the
        // same teacher every time, so re-running the reconciler is a no-op
        // rather than a reshuffle. Two queries because the preference is a
        // rule, not a sort trick ("CO" < "LEAD" alphabetically).
        for (const role of ["LEAD", "CO"] as const) {
          const teacher = await db.classTeacher.findFirst({
            where: {
              classId: enrollment.classId,
              role,
              teacher: { status: "ACTIVE", leftAt: null },
            },
            orderBy: { teacherMembershipId: "asc" },
            select: { teacher: { select: { userId: true } } },
          });
          if (teacher) return teacher.teacher.userId;
        }
      }

      const admin = await db.membership.findFirst({
        where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null },
        orderBy: { joinedAt: "asc" },
        select: { userId: true },
      });
      return admin?.userId ?? null;
    },
  );

  if (!holderUserId) {
    // A school with no class teacher and no admin has larger problems; leave
    // whatever stand-in exists rather than revoking the only guardian there is.
    return standins.length > 0
      ? { outcome: "kept-standin", userId: standins[0]!.parentUserId }
      : { outcome: "nobody" };
  }

  const current = standins.find((s) => s.parentUserId === holderUserId);
  const stale = standins.filter((s) => s.parentUserId !== holderUserId);

  if (stale.length > 0) {
    await db.guardianship.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { status: "REVOKED" },
    });
  }

  if (!current) {
    await db.guardianship.upsert({
      where: {
        parentUserId_studentMembershipId: { parentUserId: holderUserId, studentMembershipId },
      },
      create: {
        parentUserId: holderUserId,
        studentMembershipId,
        studentSchoolId: schoolId,
        relation: "SCHOOL",
        status: "ACTIVE",
        consentSharingAt: new Date(),
        consentNotificationsAt: new Date(),
      },
      // The same person may have been stand-in before and been revoked (the
      // parent's guardianship was later removed, say) — reactivate their row.
      update: { status: "ACTIVE", relation: "SCHOOL" },
    });
    await audit({
      schoolId,
      actorUserId,
      action: "guardian.standin.grant",
      targetType: "Membership",
      targetId: studentMembershipId,
      meta: { toUserId: holderUserId, movedFrom: stale.map((s) => s.parentUserId) },
    });
    return stale.length > 0
      ? { outcome: "moved", fromUserId: stale[0]!.parentUserId, toUserId: holderUserId }
      : { outcome: "granted", toUserId: holderUserId };
  }

  return { outcome: "kept-standin", userId: holderUserId };
}

/**
 * Re-syncs every candidate pupil of one class after its staffing changed.
 *
 * "The class teacher changed" is, from each unclaimed pupil's point of view,
 * "my stand-in guardian may be the wrong person now" — so the assignment and
 * unassignment paths call this, and the new LEAD (or CO, or the admin
 * fallback when the last teacher left) takes the guardianship over
 * automatically instead of waiting for the next backfill.
 *
 * ONLY THE CANDIDATES ARE TOUCHED: pupils with a family guardian are filtered
 * out before the loop, because for them the reconciler is a guaranteed no-op
 * and a class of five hundred should not pay for it. The filter is the same
 * NOT-SCHOOL predicate the reconciler itself uses, so the two can never
 * disagree about who a candidate is.
 *
 * Failures are swallowed per pupil (logged, never thrown): a guardianship
 * that lags a staffing change by one backfill is annoying, but a staffing
 * change refused because one pupil's sync hiccuped would be wrong.
 */
export async function syncStandinsForClass(opts: {
  schoolId: string;
  classId: string;
  actorUserId: string;
}): Promise<void> {
  const { schoolId, classId, actorUserId } = opts;

  const pupils = await forTenant(
    { schoolIds: [schoolId], userId: actorUserId, joinCode: null, isSuperuser: false },
    () =>
      db.enrollment.findMany({
        where: {
          classId,
          schoolId,
          status: "ACTIVE",
          student: {
            status: "ACTIVE",
            leftAt: null,
            // No family guardian — exactly the pupils a stand-in exists for.
            guardianships: { none: { status: "ACTIVE", relation: NOT_SCHOOL } },
          },
        },
        select: { studentMembershipId: true },
      }),
  );

  for (const pupil of pupils) {
    await syncStandinGuardian({
      schoolId,
      studentMembershipId: pupil.studentMembershipId,
      actorUserId,
    }).catch((error) =>
      console.error("[syncStandinsForClass]", pupil.studentMembershipId, error),
    );
  }
}

/**
 * Re-syncs every pupil somebody currently stands in for, within one school.
 *
 * The hook for a PERSON becoming ineligible rather than a class changing
 * hands: a teacher or admin whose membership is suspended may hold stand-in
 * guardianships as class teacher AND as admin fallback, and their classes are
 * not the whole list — so this walks what they actually hold, which is by
 * definition exactly the set that needs a new holder. The reconciler's own
 * eligibility rules (ACTIVE, not left) do the choosing.
 */
export async function syncStandinsHeldBy(opts: {
  schoolId: string;
  userId: string;
  actorUserId: string;
}): Promise<void> {
  const { schoolId, userId, actorUserId } = opts;

  const held = await db.guardianship.findMany({
    where: {
      parentUserId: userId,
      studentSchoolId: schoolId,
      relation: "SCHOOL",
      status: "ACTIVE",
    },
    select: { studentMembershipId: true },
  });

  for (const g of held) {
    await syncStandinGuardian({
      schoolId,
      studentMembershipId: g.studentMembershipId,
      actorUserId,
    }).catch((error) => console.error("[syncStandinsHeldBy]", g.studentMembershipId, error));
  }
}

/**
 * Re-syncs the classes a teacher is attached to — the restore-side hook.
 *
 * A reinstated class teacher outranks the admin fallback that covered their
 * absence, so their classes' unclaimed pupils come back to them. Reads the
 * class list under the school's own policies; each class then goes through
 * the same candidate-filtered sync a staffing change uses.
 */
export async function syncStandinsForTeacherClasses(opts: {
  schoolId: string;
  teacherUserId: string;
  actorUserId: string;
}): Promise<void> {
  const { schoolId, teacherUserId, actorUserId } = opts;

  const rows = await forTenant(
    { schoolIds: [schoolId], userId: actorUserId, joinCode: null, isSuperuser: false },
    () =>
      db.classTeacher.findMany({
        where: { schoolId, teacher: { userId: teacherUserId, schoolId } },
        select: { classId: true },
      }),
  );

  for (const classId of new Set(rows.map((r) => r.classId))) {
    await syncStandinsForClass({ schoolId, classId, actorUserId }).catch((error) =>
      console.error("[syncStandinsForTeacherClasses]", classId, error),
    );
  }
}
