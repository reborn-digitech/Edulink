import { examActionResultSchema, graceDecideSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { decideGrace } from "@/lib/exam-cell-marks";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ graceId: string }> };

/** POST /api/v1/exam-cell/grace/{graceId}/decide — The principal approves or refuses a grace proposal. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("PRINCIPAL");
    const p = await params;
    const parsed = graceDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await decideGrace(ctx, p.graceId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/grace/[graceId]/decide");
  }
}
