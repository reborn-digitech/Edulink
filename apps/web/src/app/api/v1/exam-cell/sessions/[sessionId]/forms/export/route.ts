import { officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { formsCsv } from "@/lib/exam-cell";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** GET /api/v1/exam-cell/sessions/{sessionId}/forms/export — The submitted and approved forms as the university takes them (CSV text). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    const file = await formsCsv(ctx, p.sessionId);
    return ok(officeCsvExportSchema.parse({ filename: file.name, csv: file.csv, rows: Math.max(0, file.csv.split("\n").filter(Boolean).length - 1) }));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/forms/export");
  }
}
