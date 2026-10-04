import { requireApiRoles } from "@/lib/api-roles";
import { attendanceSheetData } from "@/lib/exam-cell-after";
import { renderAttendanceSheetPdf } from "@/lib/exam-cell-pdf";
import { getT } from "@/lib/i18n/server";
import { budget, PDF_BUDGET } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ examRoomId: string }> };

/** GET /api/v1/exam-cell/rooms/{examRoomId}/sheet — A hall's attendance sheet for its paper as a PDF (application/pdf). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    const refused = await budget(`pdf:${ctx.user.id}`, PDF_BUDGET.limit, PDF_BUDGET.windowMs);
    if (refused) return refused;
    const doc = await attendanceSheetData(ctx, p.examRoomId);
    const bytes = await renderAttendanceSheetPdf(doc, await getT());
    return new Response(new Uint8Array(bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${`attendance-${doc.room.schedule.courseCode}-${doc.room.name}.pdf`.replace(/[^\w.-]+/g, "-")}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/rooms/[examRoomId]/sheet");
  }
}
