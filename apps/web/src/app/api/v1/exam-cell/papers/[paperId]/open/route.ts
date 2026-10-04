import { requireApiRoles } from "@/lib/api-roles";
import { openPaper } from "@/lib/exam-cell-after";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ paperId: string }> };

/** GET /api/v1/exam-cell/papers/{paperId}/open — Open a sealed paper (application/pdf); every opening is logged and audited (autonomous). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const paper = await openPaper(ctx, p.paperId);
    return new Response(new Uint8Array(paper.bytes), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${paper.fileName.replace(/[^\w.-]+/g, "-")}"`, "cache-control": "private, no-store" } });
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/papers/[paperId]/open");
  }
}
