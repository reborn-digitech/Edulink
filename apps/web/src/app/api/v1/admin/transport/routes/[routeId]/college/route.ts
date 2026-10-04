import { routeCollegeBodySchema, routeCollegeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveRouteCollege } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ routeId: string }> };

/** POST /api/v1/admin/transport/routes/{routeId}/college — A route at a college: fixed with a roster or a campus loop, and its fee per term. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { routeId } = await params;
    const parsed = routeCollegeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(routeCollegeSchema.parse(await saveRouteCollege(ctx, routeId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport/routes/[routeId]/college");
  }
}
