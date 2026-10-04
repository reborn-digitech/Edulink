import { examActionResultSchema, examDocumentIssueSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { issueDocument } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/exam-cell/documents — Issue a grade card, transcript or (autonomous) degree certificate, numbered with a public check. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const parsed = examDocumentIssueSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await issueDocument(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/documents");
  }
}
