import { hostelRoomSaveSchema, hostelsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveRoom } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/hostel/rooms — A room made or changed. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = hostelRoomSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(hostelsSchema.parse(await saveRoom(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/rooms");
  }
}
