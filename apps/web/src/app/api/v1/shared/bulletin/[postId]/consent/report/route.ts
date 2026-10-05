import { slipReportSchema } from "@edulink/contracts";
import { slipReport } from "@/lib/permission-slips";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

type Params = { params: Promise<{ postId: string }> };

/** GET /api/v1/shared/bulletin/{postId}/consent/report — the staff's list: every child in the slip's audience, the answer and who gave it (5 Oct 2026). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiSession();
    const { postId } = await params;
    return ok(slipReportSchema.parse(await slipReport(ctx, postId)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]/consent/report");
  }
}
