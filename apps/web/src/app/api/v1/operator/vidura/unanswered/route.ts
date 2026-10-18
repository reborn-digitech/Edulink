import { viduraUnansweredSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { unansweredReport } from "@/lib/assistant/gaps";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/operator/vidura/unanswered — the last thirty days' refusals and discards by mode, role and school, counts only, and the stems that found nothing (Vidura pass 3). */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(viduraUnansweredSchema.parse(await unansweredReport(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/vidura/unanswered");
  }
}
