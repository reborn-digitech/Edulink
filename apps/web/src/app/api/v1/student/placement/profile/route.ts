import { placementProfileSaveSchema, placementProfileSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveMyProfile } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/student/placement/profile — The student's profile and season choices. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const parsed = placementProfileSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(placementProfileSchema.parse(await saveMyProfile(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/profile");
  }
}
