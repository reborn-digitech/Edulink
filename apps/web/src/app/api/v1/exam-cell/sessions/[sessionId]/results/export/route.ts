import { examResultsQuerySchema, officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { resultsCsv } from "@/lib/exam-cell-marks";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** GET /api/v1/exam-cell/sessions/{sessionId}/results/export — The results as the university takes them (CSV text). */
export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    const parsed = examResultsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    const file = await resultsCsv(ctx, p.sessionId, q.runId);
    return ok(officeCsvExportSchema.parse({ filename: file.name, csv: file.csv, rows: Math.max(0, file.csv.split("\n").filter(Boolean).length - 1) }));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/results/export");
  }
}
