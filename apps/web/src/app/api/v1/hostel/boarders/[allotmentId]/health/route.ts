import { hostelBoarderHealthSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { boarderHealth } from "@/lib/hostel";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ allotmentId: string }> };

/** GET /api/v1/hostel/boarders/{allotmentId}/health — What the warden needs from a boarder's health card; the read is shown to the family. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("WARDEN");
    const p = await params;
    return ok(hostelBoarderHealthSchema.parse(await boarderHealth(ctx, p.allotmentId)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/boarders/[allotmentId]/health");
  }
}
