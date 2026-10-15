import { operatorFeatureSetBodySchema, operatorFeatureSetSchema, platformFeatureSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { AccessError } from "@/lib/access-error";
import { setFeature } from "@/lib/platform-features";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/operator/features/{code} — switch one platform feature on or off ({ on }); audited, and a no-op when it already stands so. */
export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const code = platformFeatureSchema.safeParse((await params).code);
    if (!code.success) throw new AccessError("platformFeatures.unknown", "NOT_FOUND");
    const parsed = operatorFeatureSetBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorFeatureSetSchema.parse(await setFeature(ctx, code.data, parsed.data.on)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/features/{code}");
  }
}
