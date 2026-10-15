import { operatorExpertApplicationsQuerySchema, operatorExpertApplicationsSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { listExpertApplications } from "@/lib/expert-applications";

/**
 * GET /api/v1/operator/expert-applications — the experts who applied from the login page (15 Oct 2026), every
 * field and whether a document was sent; ?status= (PENDING, the queue, by default, oldest first).
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorExpertApplicationsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorExpertApplicationsSchema.parse({ items: await listExpertApplications(ctx, parsed.data.status ?? "PENDING") }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/expert-applications");
  }
}
