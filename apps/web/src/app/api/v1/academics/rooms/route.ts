import { academicsIdResultSchema, roomSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveRoom } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/rooms — A room or lab made or changed, with its capacity. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = roomSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await saveRoom(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/rooms");
  }
}
