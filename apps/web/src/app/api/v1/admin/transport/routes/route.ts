import { transportRouteInputSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveRoute } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/transport/routes — a new route with its stops. The ADMIN's. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = transportRouteInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { id } = await saveRoute(ctx, null, parsed.data);
    return ok({ ok: true as const, id }, 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/routes");
  }
}
