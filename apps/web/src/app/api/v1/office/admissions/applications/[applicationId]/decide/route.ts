import { applicationSchema, decisionSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { decide } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/applications/{applicationId}/decide — decline, waitlist or put back. */
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { applicationId } = await params;
    const parsed = decisionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationSchema.parse(await decide(ctx, applicationId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications/[applicationId]/decide");
  }
}
