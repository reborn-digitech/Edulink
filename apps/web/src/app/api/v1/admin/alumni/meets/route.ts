import { alumniMeetSaveSchema, alumniMeetViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createMeet } from "@/lib/placement-alumni";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/alumni/meets — The office sets a meet. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = alumniMeetSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(alumniMeetViewSchema.parse(await createMeet(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/alumni/meets");
  }
}
