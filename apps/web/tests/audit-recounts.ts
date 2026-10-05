/**
 * Raw recounts the data audit (`npm run data:audit`) compares the app's
 * answers against, kept apart so an ordinary suite can hold the audit's own
 * arithmetic too (tests/college-year.test.ts runs this one on a graduation).
 */
import type { PrismaClient } from "@prisma/client";

/**
 * The guardians the office's messaging reaches, from the guardianship rows:
 * every ACTIVE link to a child still on the roll, once per guardian (S4B-2,
 * 5 Oct 2026). A pupil who leaves a school or a college — a transfer, a
 * graduation — keeps a real parent's guardianship ACTIVE on purpose (it is
 * how the family still reaches the record and the leaving certificate; see
 * recordDeparture in school-record.ts), and no notice, broadcast or count of
 * the office's goes to it. The recount used to take every ACTIVE link, so it
 * disagreed with the overview from the first leaver with a parent on.
 */
export async function reachableGuardians(db: PrismaClient, schoolId: string): Promise<{ total: number; withPhone: number }> {
  const rows = await db.guardianship.findMany({
    where: { studentSchoolId: schoolId, status: "ACTIVE", student: { role: "STUDENT", status: "ACTIVE", leftAt: null } },
    select: { parentUserId: true, parent: { select: { phone: true } } },
    distinct: ["parentUserId"],
  });
  return { total: rows.length, withPhone: rows.filter((g) => g.parent.phone).length };
}
