import { operatorExpertsSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { operatorExperts } from "@/lib/api-reads/operator";

/** GET /api/v1/operator/experts — the marketplace's curation queue, unpublished first. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(operatorExpertsSchema.parse(await operatorExperts(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/experts");
  }
}
