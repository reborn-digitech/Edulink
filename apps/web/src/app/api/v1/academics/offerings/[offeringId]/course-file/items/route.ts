import { academicsIdResultSchema, courseFileItemSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addCourseFileItem } from "@/lib/academics-coursefile";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ offeringId: string }> };

/** POST /api/v1/academics/offerings/{offeringId}/course-file/items — A resource, notes, question paper or model answer: an upload ticket or a link, tagged by outcome. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = courseFileItemSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await addCourseFileItem(ctx, p.offeringId, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/course-file/items");
  }
}
