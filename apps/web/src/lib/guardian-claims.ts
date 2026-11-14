import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { localeForUser, sendParentClaimNotice } from "./email";
import { AccessError } from "./tenancy";
import { forSchool, forUser } from "./tenant-context";
import { syncStandinGuardian } from "./standin-guardian";
import type { ActiveContext } from "./session";
import { COOL_OFF_DAYS, coolOffCutoff, statusNow, stillWaiting, waitingCutoff } from "./request-expiry";
import { consentApplies, consentAppliesMany, revokeGrantsOfLink } from "./student-consent";

/**
 * A claim to be a child's guardian, and the yes that makes it one.
 *
 * THE CODE AND THE BIRTHDAY ARE ON PAPER THAT CHANGES HANDS, and a
 * guardianship is the child's whole record: their attendance, their marks,
 * their messages, where they will be on Tuesday. A right pair used to make
 * the guardianship at once and tell the family afterwards (finding 8). It
 * now makes a CLAIM, which opens nothing, and the guardianship is made when
 * somebody who would know says yes:
 *
 *   the school's office (an admin or the head), or
 *   a guardian the child already has.
 *
 * The school's own stand-in guardian is not "a guardian the child already
 * has": it is the school, and the school decides as the office.
 *
 * AN ADULT AT A COLLEGE DECIDES THEMSELF (TA-555, testing analysis of 13
 * November 2026; the owner's decision of 14 November 2026). Where the
 * student's consent applies (student-consent.ts `consentApplies`: an adult at
 * a COLLEGE or an AUTONOMOUS_COLLEGE), a claim on them needs THEIR OWN yes:
 * the student is told when it is filed, it waits in their own list
 * (/student/consent), and neither the office nor a guardian they already have
 * can approve or decline it. The guardian the student accepts starts with
 * nothing: a grant is one guardian's, and the student has given this one none.
 * The office is told of the link, as it is of one a guardian added (TA-177),
 * so it can end a wrong one. Whether consent applies is asked when the claim
 * is filed (who is told) and again when it is decided (who may decide): a
 * claim that waited over an eighteenth birthday becomes the student's.
 *
 * `claimChildFor` (lib/claim-child.ts) is still where the pair is checked
 * and the attempts are limited; it calls `fileClaim` where it used to write
 * the guardianship.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type Relation = "PARENT" | "GUARDIAN" | "OTHER";

/**
 * Files the claim and tells the people who may decide it. Claiming twice
 * while the first waits is claiming once, and tells nobody again.
 */
export async function fileClaim(input: {
  claimant: { id: string; name: string };
  studentMembershipId: string;
  schoolId: string;
  childName: string;
  schoolName: string;
  relation: Relation;
}): Promise<{ claimId: string; alreadyWaiting: boolean }> {
  const { claimant, studentMembershipId, schoolId, relation } = input;
  return forSchool(schoolId, async () => {
    const waiting = await db.guardianClaim.findFirst({
      where: { claimantUserId: claimant.id, studentMembershipId, ...stillWaiting() },
      select: { id: true },
    });
    if (waiting) return { claimId: waiting.id, alreadyWaiting: true };

    // SEVEN DAYS AFTER A NO — see lib/request-expiry.ts. It says nothing the
    // claimant was not already told: that a claim of theirs was declined.
    const declined = await db.guardianClaim.findFirst({
      where: { claimantUserId: claimant.id, studentMembershipId, status: "DECLINED", decidedAt: { gte: coolOffCutoff() } },
      select: { id: true },
    });
    if (declined) throw new AccessError("claim.declinedRecently", "FORBIDDEN", { days: COOL_OFF_DAYS });

    await db.guardianClaim.updateMany({
      where: { claimantUserId: claimant.id, studentMembershipId, status: "PENDING", createdAt: { lt: waitingCutoff() } },
      data: { status: "EXPIRED", decidedAt: new Date() },
    });

    const made = await db.guardianClaim.create({
      data: { schoolId, studentMembershipId, claimantUserId: claimant.id, relation },
      select: { id: true },
    });
    await audit({ schoolId, actorUserId: claimant.id, action: "parent.claim.request", targetType: "Membership", targetId: studentMembershipId });

    // An adult at a college is the one who decides (TA-555): they are told, and nobody else is asked.
    if (await consentApplies(studentMembershipId)) {
      const student = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId }, select: { userId: true } });
      if (student) {
        await notify({
          userId: student.userId,
          schoolId,
          kind: "SYSTEM",
          titleKey: "claim.notifAskedYou",
          titleVars: { claimant: claimant.name },
          bodyKey: "claim.notifAskedYouBody",
          url: "/student/consent",
          urgent: true,
        }).catch((error) => console.error("[fileClaim] notice failed", error));
      }
      return { claimId: made.id, alreadyWaiting: false };
    }

    const [family, office] = await Promise.all([
      db.guardianship.findMany({
        where: { studentMembershipId, status: "ACTIVE", parentUserId: { not: claimant.id }, relation: { not: "SCHOOL" } },
        select: { parentUserId: true },
      }),
      db.membership.findMany({ where: { schoolId, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { userId: true } }),
    ]);
    const familyIds = new Set(family.map((g) => g.parentUserId));
    const told = [...new Set([...familyIds, ...office.map((m) => m.userId)])].filter((id) => id !== claimant.id);
    await Promise.all(
      told.map((userId) =>
        notify({
          userId,
          schoolId,
          kind: "SYSTEM",
          titleKey: "claim.notifAsked",
          titleVars: { claimant: claimant.name, name: input.childName },
          bodyKey: "claim.notifAskedBody",
          bodyVars: { school: input.schoolName },
          // A guardian decides from their own pages; the office from the school's queue.
          url: familyIds.has(userId) ? "/parent/claims" : "/joins",
          urgent: true,
        }).catch((error) => console.error("[fileClaim] notice failed", error)),
      ),
    );
    return { claimId: made.id, alreadyWaiting: false };
  });
}

/* -------------------------------------------------------------------------- */
/* The claimant's own view                                                     */
/* -------------------------------------------------------------------------- */

export type MyClaim = { id: string; status: "PENDING" | "DECLINED" | "EXPIRED"; schoolName: string; declineReason: string | null; createdAt: Date };

/**
 * What the claimant is waiting on: that a claim at a named school waits, or
 * was declined. NOT the child's name. They typed a code and a date, and until
 * somebody has said yes this page confirms nothing about whose they were.
 */
export async function myClaims(userId: string): Promise<MyClaim[]> {
  const rows = await forUser(userId, () =>
    db.guardianClaim.findMany({
      where: { claimantUserId: userId, status: { in: ["PENDING", "DECLINED", "EXPIRED"] } },
      select: { id: true, status: true, schoolId: true, createdAt: true, declineReason: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  );
  return Promise.all(
    rows.map(async (row) => {
      const school = await forSchool(row.schoolId, () => db.school.findUnique({ where: { id: row.schoolId }, select: { name: true } }));
      return {
        id: row.id,
        status: statusNow(row) as MyClaim["status"],
        schoolName: school?.name ?? "",
        declineReason: row.status === "DECLINED" ? row.declineReason : null,
        createdAt: row.createdAt,
      };
    }),
  );
}

/* -------------------------------------------------------------------------- */
/* The queue                                                                   */
/* -------------------------------------------------------------------------- */

export type WaitingClaim = {
  id: string;
  claimantName: string;
  /** The address the claimant signs in with: what the office rings the family to check. Null in a guardian's queue (TA-365). */
  claimantEmail: string | null;
  relation: Relation;
  childName: string;
  className: string | null;
  schoolName: string;
  createdAt: Date;
};

const CLAIM_SELECT = {
  id: true,
  schoolId: true,
  relation: true,
  createdAt: true,
  studentMembershipId: true,
  claimant: { select: { name: true, preferredName: true, email: true } },
  school: { select: { name: true } },
  student: {
    select: {
      leftAt: true,
      status: true,
      user: { select: { name: true, preferredName: true } },
      enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 },
    },
  },
} as const;

type ClaimRow = {
  id: string;
  relation: string;
  createdAt: Date;
  claimant: { name: string; preferredName: string | null; email: string | null };
  school: { name: string };
  student: { user: { name: string; preferredName: string | null }; enrollments: { class: { name: string } }[] };
};

const shaped = (row: ClaimRow): WaitingClaim => ({
  id: row.id,
  claimantName: row.claimant.name,
  claimantEmail: row.claimant.email,
  relation: row.relation as Relation,
  childName: row.student.user.preferredName ?? row.student.user.name,
  className: row.student.enrollments[0]?.class.name ?? null,
  schoolName: row.school.name,
  createdAt: row.createdAt,
});

/** The claims waiting on the office: an admin's or the head's school, oldest first. Empty for anybody else. */
export async function waitingClaimsForOffice(session: ActiveContext): Promise<WaitingClaim[]> {
  if (!session.schoolId || (session.role !== "ADMIN" && session.role !== "PRINCIPAL")) return [];
  const rows = await db.guardianClaim.findMany({
    where: { schoolId: session.schoolId, ...stillWaiting() },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: CLAIM_SELECT,
  });
  // A claim on an adult at a college is the student's own to decide (TA-555): not in the office's queue.
  const theirs = await consentAppliesMany(rows.map((row) => row.studentMembershipId));
  return rows.filter((row) => !theirs.has(row.studentMembershipId)).map(shaped);
}

/**
 * The claims on this guardian's own children. The children are read from
 * Guardianship, which carries no policy; the claims under each child's
 * school, which being the child's guardian earns.
 */
export async function waitingClaimsForGuardian(userId: string): Promise<WaitingClaim[]> {
  const mine = await db.guardianship.findMany({
    where: { parentUserId: userId, status: "ACTIVE", relation: { not: "SCHOOL" } },
    select: { studentMembershipId: true, studentSchoolId: true },
  });
  if (mine.length === 0) return [];
  const bySchool = new Map<string, string[]>();
  for (const g of mine) bySchool.set(g.studentSchoolId, [...(bySchool.get(g.studentSchoolId) ?? []), g.studentMembershipId]);
  const lists = await Promise.all(
    [...bySchool].map(([schoolId, membershipIds]) =>
      forSchool(schoolId, async () => {
        const rows = await db.guardianClaim.findMany({
          where: { schoolId, studentMembershipId: { in: membershipIds }, ...stillWaiting(), claimantUserId: { not: userId } },
          orderBy: { createdAt: "asc" },
          select: CLAIM_SELECT,
        });
        // An adult child at a college decides their own (TA-555): not in a guardian's queue.
        const theirs = await consentAppliesMany(rows.map((row) => row.studentMembershipId));
        return rows.filter((row) => !theirs.has(row.studentMembershipId));
      }),
    ),
  );
  // The claimant's sign-in address is the office's, to ring the family on (TA-365): a guardian deciding reads the
  // name and the relation, and one adult's address is not handed to another private person.
  return lists.flat().map((row) => ({ ...shaped(row), claimantEmail: null }));
}

export async function waitingClaimCount(session: ActiveContext): Promise<number> {
  if (session.role === "PARENT") return (await waitingClaimsForGuardian(session.user.id)).length;
  if (!session.schoolId || (session.role !== "ADMIN" && session.role !== "PRINCIPAL")) return 0;
  // Counted as the queue lists them: without the claims an adult at a college decides themself (TA-555).
  const rows = await db.guardianClaim.findMany({ where: { schoolId: session.schoolId, ...stillWaiting() }, select: { studentMembershipId: true } });
  if (rows.length === 0) return 0;
  const theirs = await consentAppliesMany(rows.map((row) => row.studentMembershipId));
  return rows.filter((row) => !theirs.has(row.studentMembershipId)).length;
}

/** A claim waiting on the student's own yes: who asks and as what. Never the claimant's address (TA-365). */
export type StudentWaitingClaim = { id: string; claimantName: string; relation: Relation; createdAt: Date };

/**
 * The claims waiting on THIS student's own answer (TA-555): an adult at a college reads who is asking to be their
 * guardian, oldest first. Empty for a minor, a pupil at a school, and anybody who is not a student: theirs wait on
 * the office and the family as before.
 */
export async function waitingClaimsForStudent(session: ActiveContext): Promise<StudentWaitingClaim[]> {
  if (session.role !== "STUDENT" || !session.schoolId || !session.membershipId) return [];
  if (!(await consentApplies(session.membershipId))) return [];
  const rows = await db.guardianClaim.findMany({
    where: { schoolId: session.schoolId, studentMembershipId: session.membershipId, ...stillWaiting() },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { id: true, relation: true, createdAt: true, claimant: { select: { name: true } } },
  });
  return rows.map((row) => ({ id: row.id, claimantName: row.claimant.name, relation: row.relation as Relation, createdAt: row.createdAt }));
}

/* -------------------------------------------------------------------------- */
/* The decision                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Makes the claimant the child's guardian, or does not.
 *
 * WHO MAY: the office of the child's school, or a family guardian the child
 * already has. Nobody decides their own claim. Everybody else gets the
 * NOT_FOUND an id that never existed gets. WHERE THE STUDENT IS AN ADULT AT A
 * COLLEGE (TA-555) it is the student alone, to approve or to decline: the
 * office and a guardian are told so in a sentence (claim.studentDecides), and
 * a student whose consent does not apply (a minor, a pupil at a school) is
 * nobody here, as before.
 *
 * ONE TRANSACTION: the claim's status, the link, the link's clean slate of
 * grants and the audit row are written together, so a link is never made off
 * the record and never made with an earlier link's grants.
 *
 * A CHILD WHO HAS LEFT CANNOT BE CLAIMED, and one who left while the claim
 * waited cannot either: approving is refused, as claiming is.
 *
 * DECIDED ONCE, by a status write conditional on PENDING that comes first.
 */
export async function decideClaim(session: ActiveContext, claimId: string, decision: "APPROVE" | "DECLINE", reason?: string): Promise<void> {
  const said = decision === "DECLINE" ? reason?.trim().slice(0, 300) || null : null;
  // Read under whatever this session is bound to: the office's own school, or
  // a guardian's children's schools. Anybody bound to neither finds nothing.
  const pointer = await db.guardianClaim.findFirst({
    where: { id: claimId },
    select: { id: true, schoolId: true, studentMembershipId: true, claimantUserId: true },
  });
  if (!pointer) throw new AccessError("access.claimNotFound", "NOT_FOUND");
  if (pointer.claimantUserId === session.user.id) throw new AccessError("access.claimNotFound", "NOT_FOUND");

  const isOffice = (session.role === "ADMIN" || session.role === "PRINCIPAL") && session.schoolId === pointer.schoolId;
  const isStudent = session.role === "STUDENT" && session.schoolId === pointer.schoolId && Boolean(session.membershipId) && session.membershipId === pointer.studentMembershipId;
  const isFamily =
    !isOffice &&
    !isStudent &&
    (await db.guardianship.count({
      where: { parentUserId: session.user.id, studentMembershipId: pointer.studentMembershipId, status: "ACTIVE", relation: { not: "SCHOOL" } },
    })) > 0;
  if (!isOffice && !isFamily && !isStudent) throw new AccessError("access.claimNotFound", "NOT_FOUND");

  await forSchool(pointer.schoolId, async () => {
    // An adult at a college decides who their guardian is (TA-555); anybody else's claim is not a student's to decide.
    const studentDecides = await consentApplies(pointer.studentMembershipId);
    if (studentDecides && !isStudent) throw new AccessError("claim.studentDecides");
    if (!studentDecides && isStudent) throw new AccessError("access.claimNotFound", "NOT_FOUND");

    const claim = await db.guardianClaim.findFirst({ where: { id: claimId, schoolId: pointer.schoolId }, select: { ...CLAIM_SELECT, status: true, claimantUserId: true } });
    if (!claim) throw new AccessError("access.claimNotFound", "NOT_FOUND");
    if (claim.status !== "PENDING") throw new AccessError("access.thatClaimHasAlreadyBeenDecided");
    if (claim.createdAt < waitingCutoff()) throw new AccessError("access.thatRequestHasExpired");
    if (decision === "APPROVE" && (claim.student.leftAt || claim.student.status !== "ACTIVE")) throw new AccessError("access.thatPupilHasLeft");

    const childName = claim.student.user.preferredName ?? claim.student.user.name;
    const by = isStudent ? "student" : isOffice ? "office" : "guardian";
    const now = new Date();

    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const claimed = await tx.guardianClaim.updateMany({
        where: { id: claimId, schoolId: pointer.schoolId, status: "PENDING" },
        data: { status: decision === "APPROVE" ? "APPROVED" : "DECLINED", decidedAt: now, decidedByUserId: session.user.id, declineReason: said },
      });
      if (claimed.count === 0) throw new AccessError("access.thatClaimHasAlreadyBeenDecided");
      if (decision === "DECLINE") {
        await audit({ schoolId: pointer.schoolId, actorUserId: session.user.id, action: "parent.claim.decline", targetType: "Membership", targetId: pointer.studentMembershipId, meta: { by, reasonGiven: said !== null } }, tx);
        return;
      }
      const key = { parentUserId_studentMembershipId: { parentUserId: claim.claimantUserId, studentMembershipId: pointer.studentMembershipId } };
      const before = await tx.guardianship.findUnique({ where: key, select: { status: true } });
      const link = await tx.guardianship.upsert({
        where: key,
        create: {
          parentUserId: claim.claimantUserId,
          studentMembershipId: pointer.studentMembershipId,
          studentSchoolId: pointer.schoolId,
          relation: claim.relation,
          status: "ACTIVE",
          consentSharingAt: now,
          consentNotificationsAt: now,
        },
        update: { status: "ACTIVE", relation: claim.relation, consentSharingAt: now },
        select: { id: true },
      });
      // A link made, or made again, starts with nothing (TA-555): no grant of an earlier link outlives its ending.
      const grantsRevoked = before?.status === "ACTIVE" ? 0 : await revokeGrantsOfLink(tx, link.id, now);
      await audit({ schoolId: pointer.schoolId, actorUserId: claim.claimantUserId, action: "parent.claim", targetType: "Membership", targetId: pointer.studentMembershipId, meta: { approvedBy: session.user.id, by, guardianshipId: link.id, ...(grantsRevoked ? { grantsRevoked } : {}) } }, tx);
    });

    if (decision === "DECLINE") {
      await notify({
        userId: claim.claimantUserId,
        schoolId: pointer.schoolId,
        kind: "SYSTEM",
        titleKey: "claim.notifDeclined",
        titleVars: { school: claim.school.name },
        ...(said ? { bodyKey: "joinRequests.reasonGiven" as const, bodyVars: { reason: said } } : { bodyKey: "claim.notifDeclinedBody" as const }),
        url: "/parent/link",
      }).catch((error) => console.error("[decideClaim] notice failed", error));
      return;
    }

    // A real guardian now exists, so the school's stand-in is released in the same breath.
    await syncStandinGuardian({ schoolId: pointer.schoolId, studentMembershipId: pointer.studentMembershipId, actorUserId: session.user.id }).catch((error) =>
      console.error("[decideClaim] standin sync failed", error),
    );
    await notify({
      userId: claim.claimantUserId,
      schoolId: pointer.schoolId,
      kind: "SYSTEM",
      titleKey: "claim.notifApproved",
      titleVars: { name: childName },
      // An adult's new guardian is told that the student decides what they see, and that nothing is shared yet (TA-555).
      ...(studentDecides ? { bodyKey: "claim.notifApprovedAdultBody" as const, bodyVars: { name: childName } } : { bodyKey: "claim.notifApprovedBody" as const, bodyVars: { school: claim.school.name } }),
      url: "/parent",
    }).catch((error) => console.error("[decideClaim] notice failed", error));
    if (claim.claimant.email) {
      await sendParentClaimNotice(claim.claimant.email, childName, claim.school.name, `${APP_URL}/parent`, await localeForUser(claim.claimantUserId)).catch((error) => console.error("[decideClaim] email failed", error));
    }

    // A FAMILY GUARDIAN'S YES IS TOLD TO THE OFFICE (TA-177; the owner's decision of 14 November 2026): the link does
    // not wait for the office, but the office hears of every guardian a guardian added, so it can end a wrong one.
    // An adult student's own yes is told the same way (TA-555).
    if (!isOffice) {
      const office = await db.membership.findMany({ where: { schoolId: pointer.schoolId, role: { in: ["ADMIN", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { userId: true } });
      const approver = session.user.preferredName ?? session.user.name;
      const claimant = claim.claimant.preferredName ?? claim.claimant.name;
      await Promise.all(
        [...new Set(office.map((m) => m.userId))]
          .filter((userId) => userId !== session.user.id && userId !== claim.claimantUserId)
          .map((userId) =>
            notify({
              userId,
              schoolId: pointer.schoolId,
              kind: "SYSTEM",
              // The student's own yes (TA-555) is told in its own words; a guardian's as before.
              ...(isStudent
                ? { titleKey: "claim.notifStudentApproved" as const, titleVars: { claimant, name: childName }, bodyKey: "claim.notifStudentApprovedBody" as const, bodyVars: { name: childName } }
                : { titleKey: "claim.notifGuardianApproved" as const, titleVars: { guardian: approver, claimant, name: childName }, bodyKey: "claim.notifGuardianApprovedBody" as const, bodyVars: { name: childName } }),
              url: `/people/${pointer.studentMembershipId}`,
            }).catch((error) => console.error("[decideClaim] office notice failed", error)),
          ),
      );
    }
  });
}
