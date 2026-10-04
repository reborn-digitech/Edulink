import { examActionResultSchema, printingBuildSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { buildPrintingLists } from "@/lib/exam-cell-after";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/printing — Printing lists per hall: seated and spare (autonomous). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = printingBuildSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await buildPrintingLists(ctx, p.sessionId, b.spare)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/printing");
  }
}
