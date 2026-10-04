import { collegeLeavingBodySchema, collegeLeavingResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { leaveCollege } from "@/lib/college-records";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ studentMembershipId: string }> };

/** POST /api/v1/accounts/leaving/{studentMembershipId} — A college student leaves: the LEAVING clearance complete, the departure and the TC's record, the alumnus opened, the caution deposit's return recorded. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { studentMembershipId } = await params;
    const parsed = collegeLeavingBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeLeavingResultSchema.parse(await leaveCollege(ctx, studentMembershipId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/leaving/[studentMembershipId]");
  }
}
