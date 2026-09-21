import { operatorRetentionSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { retentionPreview } from "@/lib/retention";

/** GET /api/v1/operator/retention — what tonight's sweep would take, and the day counts it uses. */
export async function GET() {
  try {
    await requireApiOperator();
    return ok(operatorRetentionSchema.parse(await retentionPreview()));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/retention");
  }
}
