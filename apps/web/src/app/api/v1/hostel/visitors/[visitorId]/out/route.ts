import { hostelVisitorsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { signVisitorOut } from "@/lib/hostel";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ visitorId: string }> };

/** POST /api/v1/hostel/visitors/{visitorId}/out — A visitor signed out. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const p = await params;
    return ok(hostelVisitorsSchema.parse(await signVisitorOut(ctx, p.visitorId)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/visitors/[visitorId]/out");
  }
}
