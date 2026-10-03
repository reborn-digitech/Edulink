import { transportRouteInputSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveRoute } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** PUT /api/v1/admin/transport/routes/{routeId} — rewrite a route and its stops (a stop sent with its id keeps its pupils). The ADMIN's. */
export async function PUT(request: Request, { params }: { params: Promise<{ routeId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { routeId } = await params;
    const parsed = transportRouteInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { id } = await saveRoute(ctx, routeId, parsed.data);
    return ok({ ok: true as const, id });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/routes/update");
  }
}
