import { iqacInputsSaveSchema, iqacPredictorSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveEnteredInputs } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/cycles/{cycleId}/inputs — The figures the platform does not hold, entered with the document behind them; the cycle is recomputed. */
export async function POST(request: Request, { params }: { params: Promise<{ cycleId: string }> }) {
  try {
    const ctx = await requireApiRoles("IQAC");
    const p = await params;
    const parsed = iqacInputsSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(iqacPredictorSchema.parse(await saveEnteredInputs(ctx, p.cycleId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/cycles/[cycleId]/inputs");
  }
}
