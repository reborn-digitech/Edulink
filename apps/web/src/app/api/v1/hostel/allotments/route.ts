import { hostelAllotSchema, hostelBoarderSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { allotBed } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/hostel/allotments — A pupil to a bed from a day. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = hostelAllotSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelBoarderSchema.parse(await allotBed(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/allotments");
  }
}
