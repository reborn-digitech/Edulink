import { operatorEntitlementsQuerySchema, operatorEntitlementsSchema, operatorGrantBodySchema, operatorGrantSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { grantPlan, listEntitlements } from "@/lib/person-plans";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/operator/entitlements?email= — one person's entitlements, newest first (16 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorEntitlementsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorEntitlementsSchema.parse(await listEntitlements(ctx, parsed.data.email)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/entitlements");
  }
}

/** POST /api/v1/operator/entitlements — grant a plan to a person by email for 1, 3, 6 or 12 months; audited, the person told in the app. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorGrantBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const g = await grantPlan(ctx, parsed.data);
    return ok(operatorGrantSchema.parse({ ...g, validFrom: g.validFrom.toISOString(), validTo: g.validTo.toISOString() }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/entitlements");
  }
}
