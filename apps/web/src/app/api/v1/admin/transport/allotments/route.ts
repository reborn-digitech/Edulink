import { transportAllotInputSchema, transportAllotmentsQuerySchema, transportAllotmentsSchema, transportAllotResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { allotPupils, listAllotments } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/admin/transport/allotments?routeId=&classId= — today's seats, and a class's pupils to choose from. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = transportAllotmentsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(transportAllotmentsSchema.parse(await listAllotments(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/allotments");
  }
}

/** POST /api/v1/admin/transport/allotments — give pupils a seat on a route at a stop. The ADMIN's. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = transportAllotInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(transportAllotResultSchema.parse(await allotPupils(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/allotments");
  }
}
