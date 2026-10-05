import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { removeSlot } from "@/lib/exams";
import { apiFailure, ok } from "@/lib/api-v1";
import { underRules } from "@/lib/api-rule-failure";

/**
 * DELETE /api/v1/admin/exams/slots/{slotId} — take a paper off a school's date
 * sheet (the web's removeSlotAction on /admin/exams, R-50; POST
 * /admin/exams/{seriesId}/slots adds one). The office's alone; audited
 * exam.slotChange. A paper with marks saved is refused with the count (422),
 * because its marks would lose their paper; a paper this school does not hold
 * is a 404. (The college's timetable slot has its own door,
 * /academics/timetable/{slotId}/remove.)
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { slotId } = await params;
    return await underRules("api/v1/admin/exams/slots/[slotId]", async () => {
      await removeSlot(ctx, slotId);
      return ok(okSchema.parse({ ok: true }));
    });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/exams/slots/[slotId]");
  }
}
