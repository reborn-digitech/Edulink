import { applicationSchema, applicationRespondSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { respond } from "@/lib/admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/office/admissions/applications/{applicationId}/respond — record a walk-in family's answer to the offer,
 * given at the counter (TA-179). Only an application no account stands behind: a family with an account answers for
 * itself, and the office's answer for it is refused.
 */
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { applicationId } = await params;
    const parsed = applicationRespondSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationSchema.parse(await respond(ctx, applicationId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications/[applicationId]/respond");
  }
}
