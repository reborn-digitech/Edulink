import { operatorFeaturesSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { listFeatures } from "@/lib/platform-features";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/operator/features — the platform's feature switches, each with its state, who last changed it and the count that explains it. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(operatorFeaturesSchema.parse({ features: await listFeatures(ctx) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/features");
  }
}
