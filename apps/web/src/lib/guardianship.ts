import "server-only";
import { guardianEndReasonSchema, type FamilyUnlinked, type GuardianEndReason } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import { syncStandinGuardian } from "./standin-guardian";
import { forSchool } from "./tenant-context";
import { blankTextsOfLeavers } from "./text-retention";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";
import { GUARDIAN_RELATIONS, type GuardianRelation } from "./constants";

/**
 * A GUARDIAN ENDS THEIR OWN LINK TO A CHILD.
 *
 * A guardianship is made by a claim (the family's proof) or an invitation
 * (the school's), and until now ended only by the school: a departure, a
 * merge, the operator. But the link is the guardian's as much as the
 * school's — a relative who helped for a term, a parent after a custody
 * change, a wrong child claimed by a sibling's code — and they should not
 * have to ask the office to stop seeing a child's register.
 *
 * REVOKED, NEVER DELETED, as every other ending of a guardianship here: the
 * row is the record that this person held the role and until when, and the
 * unique (parent, child) pair lets a later claim reactivate it.
 *
 * THE CHILD MUST NOT BE LEFT WITH NOBODY. When this was the last family
 * guardian, the school stands in exactly as it does for a pupil nobody has
 * claimed (standin-guardian.ts): the class teacher, or an admin. If nobody
 * at the school can stand in either, the unlink is refused and the link
 * put back — a child with no guardian is a door with no key behind it. The
 * school's own stand-in row is the school's to end, not a parent's.
 *
 * THE OFFICE IS TOLD, because the next thing the family may do is ask why
 * the app stopped telling them about the child, and the office should be
 * able to answer "you removed the link on Tuesday".
 */
export async function unlinkChild(ctx: ActiveContext, studentMembershipId: string): Promise<FamilyUnlinked> {
  if (ctx.role !== "PARENT") throw new AccessError("access.wrongRoleForThisAction");
  const link = await db.guardianship.findFirst({
    where: { parentUserId: ctx.user.id, studentMembershipId, status: "ACTIVE" },
    select: { id: true, relation: true, studentSchoolId: true, student: { select: { user: { select: { name: true, preferredName: true } }, school: { select: { name: true } } } } },
  });
  if (!link) throw new AccessError("familyCare.unlinkNotLinked", "NOT_FOUND");
  if (link.relation === "SCHOOL") throw new AccessError("familyCare.unlinkSchoolOnly");
  const childName = link.student.user.preferredName ?? link.student.user.name;
  const schoolId = link.studentSchoolId;

  await db.guardianship.update({ where: { id: link.id }, data: { status: "REVOKED" } });

  // Reconcile the stand-in from scratch: another family guardian means
  // nothing changes; none means the school steps in; nobody to step in
  // means the unlink cannot stand.
  const sync = await syncStandinGuardian({ schoolId, studentMembershipId, actorUserId: ctx.user.id });
  if (sync.outcome === "nobody") {
    await db.guardianship.update({ where: { id: link.id }, data: { status: "ACTIVE" } });
    throw new AccessError("familyCare.unlinkWouldOrphan", "FORBIDDEN", { name: childName });
  }
  const schoolStandsIn = sync.outcome === "granted" || sync.outcome === "moved" || sync.outcome === "kept-standin";

  // TA-457 (decision 0002): a guardian whose last link to a pupil on the roll here this was has left the school; the
  // number and the words of their texts at it are blanked, a STOP reply keeping its number, with the audit row in the
  // same transaction. For this school alone: the parent's own set no longer holds it once the link is ended.
  await forSchool(schoolId, () =>
    db.$tenantTransaction(async (tx) => {
      const textsBlanked = await blankTextsOfLeavers(tx, schoolId, [ctx.user.id]);
      await audit(
        {
          schoolId,
          actorUserId: ctx.user.id,
          action: "guardianship.unlinked",
          targetType: "Membership",
          targetId: studentMembershipId,
          meta: { guardianshipId: link.id, relation: link.relation, schoolStandsIn, textsBlanked },
        },
        tx as typeof db,
      );
    }),
  );

  // The office hears, with the family's name — this is the office's own school.
  const office = await db.membership.findMany({ where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  const parentName = ctx.user.preferredName ?? ctx.user.name;
  await Promise.all(
    office.map((m) =>
      notify({
        userId: m.userId,
        schoolId,
        kind: "SYSTEM",
        titleKey: "notifTitle.childUnlinked",
        titleVars: { parent: parentName, name: childName },
        bodyKey: schoolStandsIn ? "notifBody.childUnlinkedStandin" : "notifBody.childUnlinkedOther",
        bodyVars: { name: childName },
        url: `/people/${studentMembershipId}`,
      }),
    ),
  );

  const remaining = await db.guardianship.count({ where: { parentUserId: ctx.user.id, status: "ACTIVE" } });
  return { ok: true, schoolStandsIn, remaining };
}

/* -------------------------------------------------------------------------- */
/* The office ends a family guardian's link (TA-177)                           */
/* -------------------------------------------------------------------------- */

/**
 * THE SCHOOL COULD NOT END A WRONG LINK (TA-177; the owner's decision of 14 November 2026, option 1). Every ending
 * of a guardianship was the stand-in's, except unlinkChild above, which is the guardian's alone, so when the school
 * learned that a link was wrong, or was handed a court order against a parent, nobody at the school could end it.
 *
 * WHO: the office (an ADMIN) of the pupil's school, for a pupil on its roll (not removed, not left), and only a family
 * link: the school's own stand-in row is the reconciler's (standin-guardian.ts), never ended here.
 *
 * WHY, AS A CODE (GUARDIAN_END_REASONS in packages/contracts): the audit row, written in the same transaction as the
 * ending, keeps it with the link's id and the guardian's id, and no sentence about a child or a family.
 *
 * TOLD: the head each time, with the reason; the guardian, only that the link has ended and to contact the office;
 * the child's other family guardians. When no family guardian is left the school stands in, as after the guardian's
 * own unlink. Unlike that unlink the ending is not put back when nobody could stand in: the office has decided it,
 * and the acting admin is somebody the reconciler can always find.
 *
 * ENDED ONCE: the write is conditional on the link still being ACTIVE; a second ending is answered ended: false
 * and tells nobody again.
 */
export type FamilyGuardianRow = { guardianshipId: string; name: string; relation: GuardianRelation; since: Date };
export type GuardianEndResult = { ok: true; ended: boolean; schoolStandsIn: boolean } | { ok: false; errorKey: TranslationKey };

const HEAD_BODY: Record<GuardianEndReason, TranslationKey> = {
  COURT_ORDER: "notifBody.headGuardianLinkEndedCourtOrder",
  WRONG_PERSON: "notifBody.headGuardianLinkEndedWrongPerson",
  FAMILY_REQUEST: "notifBody.headGuardianLinkEndedFamilyRequest",
  OTHER: "notifBody.headGuardianLinkEndedOther",
};

function officeSchool(ctx: ActiveContext): string {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
  return ctx.schoolId;
}

async function pupilOnRoll(schoolId: string, studentMembershipId: string) {
  const pupil = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId, role: "STUDENT", status: { not: "REMOVED" }, leftAt: null },
    select: { id: true, user: { select: { name: true, preferredName: true } }, school: { select: { name: true } } },
  });
  if (!pupil) throw new AccessError("refusal.notPupilsHere", "NOT_FOUND");
  return pupil;
}

/** The pupil's family guardians on the app, oldest link first, for the office to choose the one to end. */
export async function familyGuardiansOf(ctx: ActiveContext, studentMembershipId: string): Promise<FamilyGuardianRow[]> {
  const schoolId = officeSchool(ctx);
  const pupil = await pupilOnRoll(schoolId, studentMembershipId);
  const rows = await db.guardianship.findMany({
    where: { studentMembershipId: pupil.id, status: "ACTIVE", relation: { not: "SCHOOL" } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, relation: true, createdAt: true, parent: { select: { name: true, preferredName: true } } },
  });
  return rows.map((g) => ({
    guardianshipId: g.id,
    name: g.parent.preferredName ?? g.parent.name,
    relation: (GUARDIAN_RELATIONS as readonly string[]).includes(g.relation) ? (g.relation as GuardianRelation) : "OTHER",
    since: g.createdAt,
  }));
}

export async function endFamilyGuardianship(ctx: ActiveContext, studentMembershipId: string, guardianshipId: string, rawReason: string): Promise<GuardianEndResult> {
  const schoolId = officeSchool(ctx);
  const reason = guardianEndReasonSchema.safeParse(rawReason);
  if (!reason.success) return { ok: false, errorKey: "people.familyLinkChooseReason" };
  const pupil = await pupilOnRoll(schoolId, studentMembershipId);
  const link = await db.guardianship.findFirst({
    where: { id: guardianshipId, studentMembershipId: pupil.id, relation: { not: "SCHOOL" } },
    select: { id: true, parentUserId: true, relation: true, parent: { select: { name: true, preferredName: true } } },
  });
  if (!link) throw new AccessError("people.familyLinkNotFound", "NOT_FOUND");

  // The ending and its audit row in one transaction: a link is never ended off the record.
  const ended = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const claimed = await tx.guardianship.updateMany({ where: { id: link.id, status: "ACTIVE", relation: { not: "SCHOOL" } }, data: { status: "REVOKED" } });
    if (claimed.count === 0) return false;
    // TA-457 (decision 0002): a guardian left with no pupil on the roll here has left the school; the number and the
    // words of their texts at it are blanked, a STOP reply keeping its number.
    const textsBlanked = await blankTextsOfLeavers(tx, schoolId, [link.parentUserId]);
    await audit(
      {
        schoolId,
        actorUserId: ctx.user.id,
        action: "guardianship.end",
        targetType: "Membership",
        targetId: pupil.id,
        meta: { guardianshipId: link.id, guardianUserId: link.parentUserId, relation: link.relation, reason: reason.data, textsBlanked },
      },
      tx,
    );
    return true;
  });

  if (!ended) {
    const standing = await db.guardianship.count({ where: { studentMembershipId: pupil.id, status: "ACTIVE", relation: "SCHOOL" } });
    return { ok: true, ended: false, schoolStandsIn: standing > 0 };
  }

  const sync = await syncStandinGuardian({ schoolId, studentMembershipId: pupil.id, actorUserId: ctx.user.id });
  const schoolStandsIn = sync.outcome === "granted" || sync.outcome === "moved" || sync.outcome === "kept-standin";

  const childName = pupil.user.preferredName ?? pupil.user.name;
  const parentName = link.parent.preferredName ?? link.parent.name;
  const [others, heads] = await Promise.all([
    db.guardianship.findMany({
      where: { studentMembershipId: pupil.id, status: "ACTIVE", relation: { not: "SCHOOL" }, parentUserId: { not: link.parentUserId } },
      select: { parentUserId: true },
    }),
    db.membership.findMany({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, select: { userId: true } }),
  ]);
  const quiet = (error: unknown) => console.error("[endFamilyGuardianship] notice failed", error);
  await Promise.all([
    // The guardian: that it has ended, and whom to ask. Not the reason, and no link to the child's pages, which no longer open.
    notify({
      userId: link.parentUserId,
      schoolId,
      kind: "SYSTEM",
      titleKey: "notifTitle.guardianLinkEnded",
      titleVars: { name: childName },
      bodyKey: "notifBody.guardianLinkEnded",
      bodyVars: { name: childName, school: pupil.school.name },
    }).catch(quiet),
    ...[...new Set(others.map((g) => g.parentUserId))].map((userId) =>
      notify({
        userId,
        schoolId,
        kind: "SYSTEM",
        titleKey: "notifTitle.coGuardianLinkEnded",
        titleVars: { parent: parentName, name: childName },
        bodyKey: "notifBody.coGuardianLinkEnded",
        bodyVars: { name: childName },
        url: "/parent",
      }).catch(quiet),
    ),
    ...[...new Set(heads.map((m) => m.userId))].map((userId) =>
      notify({
        userId,
        schoolId,
        kind: "SYSTEM",
        titleKey: "notifTitle.headGuardianLinkEnded",
        titleVars: { parent: parentName, name: childName },
        bodyKey: HEAD_BODY[reason.data],
        url: `/people/${pupil.id}`,
      }).catch(quiet),
    ),
  ]);
  return { ok: true, ended: true, schoolStandsIn };
}
