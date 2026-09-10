import { okSchema, operatorExpertStandingBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { setExpertStanding } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/**
 * POST /api/v1/operator/experts/{profileId}/standing — list an expert, take
 * one off the list, or mark their identity checked: published and verified
 * travel together, as on the web. An empty profile is refused. Audited as
 * expert.publish / expert.unpublish.
 */
export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { profileId } = await params;
    const parsed = operatorExpertStandingBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setExpertStanding(ctx, profileId, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/experts/[profileId]/standing");
  }
}
