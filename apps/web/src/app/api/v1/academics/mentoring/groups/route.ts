import { academicsIdResultSchema, mentoringGroupSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveMentoringGroup } from "@/lib/academics-mentoring";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/mentoring/groups — A mentoring group formed or changed (no more than the college's mentees per mentor). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("HOD", "ADMIN");
    const parsed = mentoringGroupSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await saveMentoringGroup(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/mentoring/groups");
  }
}
