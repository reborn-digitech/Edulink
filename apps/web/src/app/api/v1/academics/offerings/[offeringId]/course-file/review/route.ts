import { academicsChangedResultSchema, courseFileReviewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { reviewCourseFile } from "@/lib/academics-coursefile";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ offeringId: string }> };

/** POST /api/v1/academics/offerings/{offeringId}/course-file/review — The HOD marks the course file reviewed, with a note to its faculty member. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("HOD");
    const p = await params;
    const parsed = courseFileReviewSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsChangedResultSchema.parse(await reviewCourseFile(ctx, p.offeringId, q.note)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/course-file/review");
  }
}
