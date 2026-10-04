import { roomChangeBodySchema, roomChangedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { changeRoom } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/hostel/room-change — Move a boarder to another bed: the old one ends today and the new one starts, in one transaction. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = roomChangeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(roomChangedSchema.parse(await changeRoom(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/room-change");
  }
}
