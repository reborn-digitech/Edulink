import "server-only";
import { db } from "./db";

/**
 * The alumni of a college whose one-to-ones a student may see and book
 * (TA-088): the office's mentor mark stands, the office has not muted them,
 * and their ALUMNUS row at the college is open — what offerMentorSlot asks
 * of a mentor before a time is offered, asked again of every time already
 * offered. Read on each list and each booking, so taking the mark back,
 * muting or closing the row stops the times at once, and restoring it brings
 * back the ones still ahead; no slot is written.
 */
export async function mentorsInStanding(schoolId: string, userIds: readonly string[]): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await db.alumniProfile.findMany({
    where: { schoolId, userId: { in: [...new Set(userIds)] }, mentor: true, mutedAt: null, membership: { schoolId, role: "ALUMNUS", status: "ACTIVE", leftAt: null } },
    select: { userId: true },
  });
  return new Set(rows.map((r) => r.userId));
}
