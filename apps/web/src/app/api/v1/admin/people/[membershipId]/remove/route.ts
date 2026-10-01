import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { removeMembership } from "@/lib/membership";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { getT } from "@/lib/i18n/server";

/**
 * POST /api/v1/admin/people/{membershipId}/remove — a pupil who was never
 * really here, taken off the roll; the rule is lib/membership.ts, which
 * refuses the moment a register mark, a grade, a hand-in or a report card
 * exists. What stood in the way comes back as `issues`, a sentence each,
 * so the phone can say which record it was rather than "cannot remove".
 * No body.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const result = await removeMembership(ctx, membershipId);
    if (!result.ok) {
      const issues: Record<string, string> = {};
      if (result.blockers) {
        const t = await getT();
        const b = result.blockers;
        if (b.attendance > 0) issues.attendance = b.attendance === 1 ? t("people.blockerAttendanceOne") : t("people.blockerAttendanceMany", { count: b.attendance });
        if (b.marks > 0) issues.marks = b.marks === 1 ? t("people.blockerMarksOne") : t("people.blockerMarksMany", { count: b.marks });
        if (b.submissions > 0) issues.submissions = b.submissions === 1 ? t("people.blockerWorkOne") : t("people.blockerWorkMany", { count: b.submissions });
        if (b.reportCards > 0) issues.reportCards = b.reportCards === 1 ? t("people.blockerCardsOne") : t("people.blockerCardsMany", { count: b.reportCards });
      }
      return apiRefused({ errorKey: result.errorKey, issues });
    }
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/remove");
  }
}
