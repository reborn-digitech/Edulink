import "server-only";
import type { FamilyUnlinked } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import { syncStandinGuardian } from "./standin-guardian";
import type { ActiveContext } from "./session";

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

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "guardianship.unlinked",
    targetType: "Membership",
    targetId: studentMembershipId,
    meta: { guardianshipId: link.id, relation: link.relation, schoolStandsIn },
  });

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
