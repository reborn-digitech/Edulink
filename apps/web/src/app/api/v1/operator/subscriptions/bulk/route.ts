import { bulkAnswerSchema, bulkBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { bulkTerms } from "@/lib/school-terms";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/subscriptions/bulk — one premium switch, or our prices for both parts, over 1 to 100 schools; never a pause. `preview` writes nothing. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = bulkBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await bulkTerms(ctx, parsed.data);
    if ("ok" in result) return operatorRefused(result);
    return ok(bulkAnswerSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/subscriptions/bulk");
  }
}
