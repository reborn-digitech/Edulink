import "server-only";
import { db } from "./db";
import { AccessError } from "./access-error";
import { addDaysToKey, todayKey } from "./dates";
import { slipForReader } from "./permission-slips";
import type { ActiveContext } from "./session";

/**
 * THE FAMILY'S SLIPS TO ANSWER (R-1, risks batch, 5 Oct 2026). The walk found
 * a parent with no way to a permission slip but the notice itself: nothing on
 * the family's own page said a school was waiting for a yes or no. This is
 * that list — the open slips a guardian can read (the post's own visibility,
 * `slipForReader`) with a child of theirs still unanswered — for the card on
 * /parent, which links to the notice where the answer is given
 * (`answerSlipAction`, the same library call as the consent door).
 *
 * Bounded: the twenty newest slips at the family's schools whose day has not
 * passed (one day of slack for the zones; `slipForReader` decides "open" in
 * the school's own). A slip the guardian cannot read is skipped, never named.
 */
export type FamilySlip = { postId: string; title: string; question: string; consentBy: string | null; unanswered: string[] };

export async function openSlipsForFamily(ctx: ActiveContext, now: Date = new Date()): Promise<FamilySlip[]> {
  if (ctx.role !== "PARENT") return [];
  const links = await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE" }, select: { studentSchoolId: true } });
  const schoolIds = [...new Set(links.map((l) => l.studentSchoolId))];
  if (schoolIds.length === 0) return [];
  const floor = addDaysToKey(todayKey("UTC", now), -1);
  const posts = await db.post.findMany({
    where: { schoolId: { in: schoolIds }, status: "APPROVED", consentQuestion: { not: null }, OR: [{ consentBy: null }, { consentBy: { gte: floor } }] },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true },
  });
  const out: FamilySlip[] = [];
  for (const post of posts) {
    try {
      const view = await slipForReader(ctx, post.id, now);
      if (!view.open) continue;
      const unanswered = view.children.filter((c) => c.answer === null).map((c) => c.name);
      if (unanswered.length > 0) out.push({ postId: post.id, title: post.title, question: view.question, consentBy: view.consentBy, unanswered });
    } catch (error) {
      // Not a slip this guardian can read (another class's): not theirs to answer.
      if (error instanceof AccessError) continue;
      throw error;
    }
  }
  return out;
}
