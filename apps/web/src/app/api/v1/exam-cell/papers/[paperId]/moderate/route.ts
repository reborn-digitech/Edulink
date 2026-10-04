import { examActionResultSchema, paperModerateSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { moderatePaper } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ paperId: string }> };

/** POST /api/v1/exam-cell/papers/{paperId}/moderate — Mark a paper moderated, with the note (autonomous). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = paperModerateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await moderatePaper(ctx, p.paperId, b.note)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/papers/[paperId]/moderate");
  }
}
