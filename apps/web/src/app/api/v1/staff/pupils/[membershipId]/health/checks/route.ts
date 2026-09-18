import { healthCardSchema, healthCheckSaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { recordHealthCheck } from "@/lib/health";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/pupils/{membershipId}/health/checks — the office records one check-up. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { membershipId } = await params;
    const parsed = healthCheckSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(healthCardSchema.parse(await recordHealthCheck(ctx, membershipId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/pupils/health/checks");
  }
}
