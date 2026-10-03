import { hostelBoardersQuerySchema, hostelBoardersSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listBoarders } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/hostel/boarders — Every boarder with their bed. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    const parsed = hostelBoardersQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(hostelBoardersSchema.parse(await listBoarders(ctx, q.hostelId)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/boarders");
  }
}
