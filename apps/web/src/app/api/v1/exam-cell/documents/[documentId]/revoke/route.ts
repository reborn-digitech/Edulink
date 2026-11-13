import { examActionResultSchema, examDocumentRevokeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { revokeDocument } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ documentId: string }> };

/** POST /api/v1/exam-cell/documents/{documentId}/revoke — Withdraw a grade card, transcript or degree certificate with a reason (TA-068). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examDocumentRevokeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(examActionResultSchema.parse(await revokeDocument(ctx, p.documentId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/documents/[documentId]/revoke");
  }
}
