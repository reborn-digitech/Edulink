/**
 * WHAT A TEST MEANS BY "THE STUDENT GRANTS X" (TA-555, the owner's decision of 14 November 2026). A grant is one
 * guardian's: StudentConsent is keyed to the guardianship, and a row with no guardianship opens nothing. A suite
 * that used to write one row per student and grant, and then read as "the student's guardian", now gives the grant
 * to every family guardian linked to the student at that moment (never the school's stand-in), as the student's own
 * door does when no guardian is named. Not a suite: helpers for the suites that arrange grants straight in the
 * database, through the owner connection.
 */
import type { PrismaClient } from "@prisma/client";

type Db = Pick<PrismaClient, "guardianship" | "studentConsent">;

/** The student grants `grant` to each family guardian linked to them now; answers how many guardians that was. */
export async function grantToGuardians(db: Db, schoolId: string, studentMembershipId: string, grant: string): Promise<number> {
  const links = await db.guardianship.findMany({ where: { studentMembershipId, status: "ACTIVE", relation: { not: "SCHOOL" } }, select: { id: true } });
  for (const link of links) {
    await db.studentConsent.upsert({
      where: { studentMembershipId_guardianshipId_grant: { studentMembershipId, guardianshipId: link.id, grant } },
      create: { schoolId, studentMembershipId, guardianshipId: link.id, grant },
      update: { revokedAt: null },
    });
  }
  return links.length;
}

/** The student takes `grant` back from every guardian (every grant, when none is named). */
export async function revokeFromGuardians(db: Db, studentMembershipId: string, grant?: string): Promise<void> {
  await db.studentConsent.updateMany({ where: { studentMembershipId, revokedAt: null, ...(grant ? { grant } : {}) }, data: { revokedAt: new Date() } });
}
