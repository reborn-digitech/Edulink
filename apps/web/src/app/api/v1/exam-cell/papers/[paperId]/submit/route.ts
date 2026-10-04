import { examActionResultSchema, paperSubmitSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { submitPaper } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ paperId: string }> };

/** POST /api/v1/exam-cell/papers/{paperId}/submit — The setter's paper and outcome map, sealed at once (autonomous). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = paperSubmitSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await submitPaper(ctx, p.paperId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/papers/[paperId]/submit");
  }
}
