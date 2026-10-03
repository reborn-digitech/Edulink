import "server-only";
import { db } from "./db";
import type { Role } from "./constants";

/**
 * THE FEED'S TAGS (the alumni module, 3 Oct 2026): a post or comment by a
 * former pupil reads "Alumni · 2026", a pupil's "Student", staff keep their
 * role. A post knows its author's membership (Post.authorMembershipId); a
 * comment carries only a user id, so its tag is the author's standing at the
 * post's school NOW, read here in one query for the whole page.
 *
 * Kept apart from alumni.ts so bulletin.ts can read it without importing the
 * module that itself writes posts through bulletin.ts.
 */

/** The year a former pupil left, from their ALUMNUS membership's joinedAt (the leaving date). Nothing stored twice. */
export function batchYearOf(joinedAt: Date): number {
  return joinedAt.getUTCFullYear();
}

export type AuthorTag = { role: Role; batch: number | null };

/** When a person holds more than one live row at a school, the one their words speak from. */
const RANK: Role[] = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "LIBRARIAN", "WARDEN", "DRIVER", "ALUMNUS"];

/**
 * Each user's tag at `schoolId`: their live membership there, the highest of
 * them by RANK. A reader the tenant fence keeps from that school's rows (a
 * global post read elsewhere) gets an empty map, and no tag is drawn.
 */
export async function authorTagsAt(schoolId: string | null, userIds: string[]): Promise<Map<string, AuthorTag>> {
  const out = new Map<string, AuthorTag>();
  if (!schoolId || userIds.length === 0) return out;
  const rows = await db.membership.findMany({
    where: { schoolId, userId: { in: [...new Set(userIds)] }, status: "ACTIVE", leftAt: null },
    select: { userId: true, role: true, joinedAt: true },
  });
  for (const row of rows) {
    const role = row.role as Role;
    const held = out.get(row.userId);
    if (held && RANK.indexOf(held.role) <= RANK.indexOf(role)) continue;
    out.set(row.userId, { role, batch: role === "ALUMNUS" ? batchYearOf(row.joinedAt) : null });
  }
  return out;
}
