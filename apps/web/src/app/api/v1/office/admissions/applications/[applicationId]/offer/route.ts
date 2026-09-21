import { applicationSchema, offerSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { offer } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/admissions/applications/{applicationId}/offer — offer the seat. */
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { applicationId } = await params;
    const parsed = offerSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationSchema.parse(await offer(ctx, applicationId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications/[applicationId]/offer");
  }
}
