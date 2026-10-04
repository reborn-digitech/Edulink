import { examCellHomeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { examCellHome } from "@/lib/exam-cell";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/exam-cell — The exam cell's home: sessions, terms, fee heads, grace proposals waiting. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    return ok(examCellHomeSchema.parse(await examCellHome(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell");
  }
}
