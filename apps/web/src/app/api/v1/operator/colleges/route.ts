import { operatorCollegesQuerySchema, operatorCollegesSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { listColleges } from "@/lib/operator-college";

/** GET /api/v1/operator/colleges?test=1 — every college with its profile, roll, subscription and health; each college's read is noted in its own log. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorCollegesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorCollegesSchema.parse(await listColleges(ctx, { fixtures: parsed.data.test === "1" })));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/colleges");
  }
}
