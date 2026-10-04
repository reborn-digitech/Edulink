import { academicsIdResultSchema, mentoringNoteSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addMentoringNote } from "@/lib/academics-mentoring";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/mentoring/notes — A mentor's note on a mentee, with the flag NAAC counts. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const parsed = mentoringNoteSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await addMentoringNote(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/mentoring/notes");
  }
}
