import { examMarksImportResultSchema, examMarksImportSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { importMarks } from "@/lib/exam-cell-marks";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/marks/import — The university's result file, reconciled student by student. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examMarksImportSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examMarksImportResultSchema.parse(await importMarks(ctx, p.sessionId, b.text)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/marks/import");
  }
}
