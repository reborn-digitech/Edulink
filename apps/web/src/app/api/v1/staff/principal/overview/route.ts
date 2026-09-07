import { spanQuerySchema, principalOverviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { principalOverview } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/principal/overview?days=7|30|90|year — the head's dashboard over the chosen window. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const parsed = spanQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(principalOverviewSchema.parse(await principalOverview(ctx, parsed.data.days)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/principal/overview");
  }
}
