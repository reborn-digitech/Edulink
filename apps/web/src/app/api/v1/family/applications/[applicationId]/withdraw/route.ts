import { applicationSchema } from "@edulink/contracts";
import { requireApiFamily } from "@/lib/api-reads/family";
import { withdraw } from "@/lib/admissions";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/family/applications/{applicationId}/withdraw — take it back. */
export async function POST(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiFamily();
    const { applicationId } = await params;
    return ok(applicationSchema.parse(await withdraw(ctx, applicationId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/applications/[applicationId]/withdraw");
  }
}
