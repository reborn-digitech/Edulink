import { hostelAllotmentEndSchema, hostelBoarderSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { endAllotment } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ allotmentId: string }> };

/** POST /api/v1/hostel/allotments/{allotmentId}/end — The bed given up from a day. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const p = await params;
    const parsed = hostelAllotmentEndSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelBoarderSchema.parse(await endAllotment(ctx, p.allotmentId, b.toDate)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/allotments/[allotmentId]/end");
  }
}
